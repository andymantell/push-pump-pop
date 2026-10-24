import * as THREE from 'three';

// Slow-motion replays of big combos. Rather than re-simulating, every frame the
// skater's joints, the shadow and the camera go into a rolling buffer, along with
// what the combo readout and the trick popups showed. A banked combo worth
// REPLAY_POINTS or more is cut out of the buffer as a clip, which the player
// below poses back frame by frame, blending between frames for smooth slow-mo.

/** A banked combo worth at least this many points gets a replay. */
export const REPLAY_POINTS = 1500;
const BUFFER_SECONDS = 15;
const RECORD_HZ = 60;
/** Lead-in before the take-off, and how long to keep rolling after the combo banks. */
const LEAD_IN = 0.7;
const TAIL = 0.25;
const PIPE_TAIL = 0.8;
const MAX_CLIP = 9;
export const MAX_CLIPS = 5;
/** Matches the .popup rise animation in style.css. */
const POPUP_LIFE = 0.9;

// Frame layout: camera position and quaternion, camera follow point (for the
// clouds and particles), shadow opacity, then per joint position, quaternion,
// scale and visibility.
const HEAD = 10;
const PER_JOINT = 11;

export interface HudSnap { html: string; cls: string; }
interface PopEvent { t: number; text: string; cls: string; }

export interface Clip {
  frames: Float32Array;
  /** Frame times from the start of the clip. */
  times: Float32Array;
  hud: (HudSnap | null)[];
  events: PopEvent[];
  duration: number;
  points: number;
  names: string[];
}

interface Pending { t0: number; t1: number; points: number; names: string[]; }


export class Replays {
  /** Saved clips, best first. */
  clips: Clip[] = [];
  /** Called when a big combo's clip has been cut. */
  onClip: (clip: Clip) => void = () => {};

  readonly stride: number;
  private cap = BUFFER_SECONDS * RECORD_HZ;
  private buf: Float32Array;
  private times: Float64Array;
  private hud: (HudSnap | null)[];
  private head = 0;
  private size = 0;
  private events: PopEvent[] = [];
  private pending: Pending[] = [];
  private t = 0;
  private lastRec = -Infinity;
  private comboStart: number | null = null;
  private takeoff = 0;
  private wasGrounded = true;

  constructor(private joints: THREE.Object3D[], private camera: THREE.Camera, private shadow: THREE.Mesh) {
    this.stride = HEAD + joints.length * PER_JOINT;
    this.buf = new Float32Array(this.cap * this.stride);
    this.times = new Float64Array(this.cap);
    this.hud = new Array(this.cap).fill(null);
  }

  /** Forget everything, for a new run. */
  reset() {
    this.clips = [];
    this.pending = [];
    this.events = [];
    this.size = 0;
    this.comboStart = null;
  }

  /** Record the frame just drawn. */
  record(dt: number, follow: THREE.Vector3, grounded: boolean, hud: HudSnap | null) {
    this.t += dt;
    if (this.wasGrounded && !grounded) this.takeoff = this.t;
    this.wasGrounded = grounded;
    if (this.t - this.lastRec >= 1 / RECORD_HZ - 0.001) {
      this.lastRec = this.t;
      const i = (this.head + this.size) % this.cap;
      if (this.size < this.cap) this.size++;
      else this.head = (this.head + 1) % this.cap;
      this.capture(this.buf, i * this.stride, follow);
      this.times[i] = this.t;
      this.hud[i] = hud;
    }
    while (this.events.length && this.events[0].t < this.t - BUFFER_SECONDS) this.events.shift();
    for (const p of this.pending.filter((p) => p.t1 <= this.t)) this.cut(p);
  }

  popup(text: string, cls: string) { this.events.push({ t: this.t, text, cls }); }

  /** A trick was scored; `duration` is how long it took (grabs and manuals score at the end). */
  trick(duration: number, grounded: boolean) {
    if (this.comboStart !== null) return;
    this.comboStart = Math.min(grounded ? this.t : this.takeoff, this.t - duration) - LEAD_IN;
  }

  /** The combo banked; keep it as a clip if it's big. */
  bank(points: number, names: string[], pipe: boolean) {
    const t0 = this.comboStart ?? this.t - 2;
    this.comboStart = null;
    if (points < REPLAY_POINTS) return;
    const t1 = this.t + (pipe ? PIPE_TAIL : TAIL);
    this.pending.push({ t0: Math.max(t0, t1 - MAX_CLIP), t1, points, names: [...names] });
  }

  lost() { this.comboStart = null; }

  /** Big combos still waiting for their tail to be recorded. */
  get waiting() { return this.pending.length; }

  /** Cut any clips still waiting for their tail, with what's been recorded so far. */
  flush() { for (const p of [...this.pending]) this.cut(p); }

  private cut(p: Pending) {
    this.pending.splice(this.pending.indexOf(p), 1);
    const idx: number[] = [];
    for (let k = 0; k < this.size; k++) {
      const i = (this.head + k) % this.cap;
      if (this.times[i] >= p.t0 && this.times[i] <= p.t1) idx.push(i);
    }
    if (idx.length < 2) return;
    const s = this.stride;
    const frames = new Float32Array(idx.length * s);
    const t0 = this.times[idx[0]];
    const times = new Float32Array(idx.length);
    idx.forEach((i, n) => {
      frames.set(this.buf.subarray(i * s, i * s + s), n * s);
      times[n] = this.times[i] - t0;
    });
    // The lead-in shows the run, not the end of the combo before this one.
    const from = p.t0 + LEAD_IN;
    const clip: Clip = {
      frames, times, hud: idx.map((i) => (this.times[i] >= from ? this.hud[i] : null)),
      events: this.events.filter((e) => e.t >= from && e.t <= p.t1).map((e) => ({ ...e, t: e.t - t0 })),
      duration: times[times.length - 1], points: p.points, names: p.names,
    };
    this.clips.push(clip);
    this.clips.sort((a, b) => b.points - a.points);
    this.clips.length = Math.min(this.clips.length, MAX_CLIPS);
    if (this.clips.includes(clip)) this.onClip(clip);
  }

  /** Write the current pose of everything into `out` at `o`. */
  capture(out: Float32Array, o: number, follow: THREE.Vector3) {
    const c = this.camera;
    c.position.toArray(out, o);
    c.quaternion.toArray(out, o + 3);
    out[o + 7] = follow.x;
    out[o + 8] = follow.y;
    out[o + 9] = (this.shadow.material as THREE.MeshBasicMaterial).opacity;
    let j = o + HEAD;
    for (const ob of this.joints) {
      ob.position.toArray(out, j);
      ob.quaternion.toArray(out, j + 3);
      ob.scale.toArray(out, j + 7);
      out[j + 10] = ob.visible ? 1 : 0;
      j += PER_JOINT;
    }
  }

  /** Pose everything between frames at offsets `a` and `b`, `w` of the way to `b`. Returns the follow point. */
  apply(src: Float32Array, a: number, b: number, w: number, follow: THREE.Vector3) {
    const lerp = (k: number) => src[a + k] + (src[b + k] - src[a + k]) * w;
    const f = src as unknown as number[]; // slerpFlat is typed for plain arrays but reads any.
    const c = this.camera;
    c.position.set(lerp(0), lerp(1), lerp(2));
    THREE.Quaternion.slerpFlat(qa, 0, f, a + 3, f, b + 3, w);
    c.quaternion.fromArray(qa);
    follow.set(lerp(7), lerp(8), 0);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = lerp(9);
    let j = HEAD;
    for (const ob of this.joints) {
      ob.position.set(lerp(j), lerp(j + 1), lerp(j + 2));
      THREE.Quaternion.slerpFlat(qa, 0, f, a + j + 3, f, b + j + 3, w);
      ob.quaternion.fromArray(qa);
      ob.scale.set(lerp(j + 7), lerp(j + 8), lerp(j + 9));
      ob.visible = src[(w < 0.5 ? a : b) + j + 10] > 0.5;
      j += PER_JOINT;
    }
  }
}
const qa: number[] = [0, 0, 0, 1];

export const SPEEDS = [1, 0.5, 0.25];
const LOOP_HOLD = 0.8;
const $ = (id: string) => document.getElementById(id)!;
const fmt = (n: number) => Math.round(n).toLocaleString('en-GB');

/** The replay screen: play/pause, a scrubber, slow-mo speeds and a choice of clips. */
export class Player {
  open = false;
  onClose: () => void = () => {};

  private clip!: Clip;
  private index = 0;
  private t = 0;
  private hold = 0;
  private playing = true;
  private speed = 0.5;
  private scrubbing = false;
  private saved: Float32Array;
  private follow = new THREE.Vector3();
  private shownHud: HudSnap | null | undefined;
  private pops = new Map<PopEvent, HTMLElement>();

  private el = $('replay');
  private bar = $('rp-bar');
  private fill = $('rp-fill');
  private knob = $('rp-knob');
  private playBtn = $('rp-play');
  private combo = $('rp-combo');
  private popLayer = $('rp-popups');

  constructor(private rec: Replays, private clips: () => Clip[]) {
    this.saved = new Float32Array(rec.stride);
    this.playBtn.addEventListener('click', () => this.toggle());
    $('rp-close').addEventListener('click', () => this.close());
    $('rp-prev').addEventListener('click', () => this.pick(this.index - 1));
    $('rp-next').addEventListener('click', () => this.pick(this.index + 1));
    // Tapping the picture itself plays and pauses too.
    $('rp-screen').addEventListener('click', () => this.toggle());
    for (const b of this.el.querySelectorAll<HTMLButtonElement>('[data-speed]')) {
      b.addEventListener('click', () => this.setSpeed(Number(b.dataset.speed)));
    }
    // Drag anywhere along the bar to scrub; it pauses while your finger is down.
    let resume = false;
    const seek = (e: PointerEvent) => {
      const r = this.bar.getBoundingClientRect();
      this.seek(((e.clientX - r.left) / r.width) * this.clip.duration);
    };
    this.bar.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.bar.setPointerCapture(e.pointerId);
      this.scrubbing = true;
      resume = this.playing;
      this.playing = false;
      seek(e);
    });
    this.bar.addEventListener('pointermove', (e) => { if (this.scrubbing) seek(e); });
    const up = () => {
      if (!this.scrubbing) return;
      this.scrubbing = false;
      if (resume) this.play();
      else this.drawButtons();
    };
    this.bar.addEventListener('pointerup', up);
    this.bar.addEventListener('pointercancel', up);
    // Keys belong to the replay while it's open, not the game underneath.
    window.addEventListener('keydown', (e) => {
      if (!this.open) return;
      e.stopImmediatePropagation();
      if (e.code === 'Escape') this.close();
      else if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); this.toggle(); }
      else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        this.playing = false;
        this.seek(this.t + (e.code === 'ArrowLeft' ? -1 : 1) / 30);
        this.drawButtons();
      } else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
        const i = SPEEDS.indexOf(this.speed) + (e.code === 'ArrowUp' ? -1 : 1);
        this.setSpeed(SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, i))]);
      }
    });
  }

  /** Open on the given clip, remembering the live pose to put back afterwards. */
  show(clip: Clip, follow: THREE.Vector3) {
    this.rec.capture(this.saved, 0, follow);
    this.open = true;
    this.el.classList.remove('hidden');
    this.pick(Math.max(0, this.clips().indexOf(clip)));
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.el.classList.add('hidden');
    this.clearPops();
    this.rec.apply(this.saved, 0, 0, 0, this.follow);
    this.onClose();
  }

  private pick(i: number) {
    const list = this.clips();
    this.index = (i + list.length) % list.length;
    this.clip = list[this.index];
    $('rp-title').textContent = this.clip.names.join(' + ');
    $('rp-pts').textContent = `${fmt(this.clip.points)} pts`;
    $('rp-count').textContent = list.length > 1 ? `${this.index + 1} / ${list.length}` : '';
    this.el.classList.toggle('single', list.length < 2);
    this.clearPops();
    this.shownHud = undefined;
    this.t = 0;
    this.hold = 0;
    this.play();
  }

  private play() {
    if (this.t >= this.clip.duration) this.t = 0;
    this.playing = true;
    this.drawButtons();
  }

  private toggle() {
    if (this.playing) { this.playing = false; this.drawButtons(); } else this.play();
  }

  private setSpeed(s: number) {
    this.speed = s;
    this.drawButtons();
  }

  private seek(t: number) {
    this.t = Math.max(0, Math.min(this.clip.duration, t));
    this.hold = 0;
  }

  private drawButtons() {
    this.playBtn.innerHTML = this.playing ? '&#10074;&#10074;' : '&#9654;';
    this.playBtn.setAttribute('aria-label', this.playing ? 'Pause' : 'Play');
    for (const b of this.el.querySelectorAll<HTMLButtonElement>('[data-speed]')) {
      b.classList.toggle('on', Number(b.dataset.speed) === this.speed);
    }
  }

  /** Advance and pose the replay; returns the camera follow point and how far the replay moved in game time. */
  update(dt: number): { follow: THREE.Vector3; dt: number } {
    const c = this.clip;
    let step = 0;
    if (this.playing) {
      if (this.t >= c.duration) {
        // Loop round after a short pause on the last frame.
        this.hold += dt;
        if (this.hold > LOOP_HOLD) { this.t = 0; this.hold = 0; this.clearPops(); }
      } else {
        step = dt * this.speed;
        this.t = Math.min(c.duration, this.t + step);
      }
    }
    // Find the frames either side of the playhead.
    const times = c.times;
    let lo = 0, hi = times.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (times[mid] <= this.t) lo = mid; else hi = mid;
    }
    const span = times[hi] - times[lo];
    const w = span > 0 ? Math.max(0, Math.min(1, (this.t - times[lo]) / span)) : 0;
    const s = this.rec.stride;
    this.rec.apply(c.frames, lo * s, hi * s, w, this.follow);

    const frac = c.duration > 0 ? this.t / c.duration : 0;
    this.fill.style.width = `${frac * 100}%`;
    this.knob.style.left = `${frac * 100}%`;
    $('rp-speedtag').textContent = this.speed === 1 ? 'REPLAY' : `SLOW-MO ${this.speed === 0.5 ? '½' : '¼'}×`;

    const hud = c.hud[w < 0.5 ? lo : hi];
    if (hud !== this.shownHud) {
      this.shownHud = hud;
      this.combo.className = hud?.cls ?? '';
      this.combo.innerHTML = hud?.html ?? '';
    }
    this.drawPops();
    return { follow: this.follow, dt: step };
  }

  /** Popups as they were at the playhead, posed by hand so scrubbing moves them too. */
  private drawPops() {
    for (const e of this.clip.events) {
      const age = this.t - e.t;
      let el = this.pops.get(e);
      if (age < 0 || age > POPUP_LIFE) {
        if (el) { el.remove(); this.pops.delete(e); }
        continue;
      }
      if (!el) {
        el = document.createElement('div');
        el.className = 'popup ' + e.cls;
        el.style.animation = 'none';
        el.textContent = e.text;
        this.popLayer.appendChild(el);
        this.pops.set(e, el);
      }
      // Same curve as the rise keyframes.
      const k = age / POPUP_LIFE;
      let op, y, sc;
      if (k < 0.15) { const q = easeOut(k / 0.15); op = q; y = 10 - 10 * q; sc = 0.7 + 0.38 * q; }
      else { const q = easeOut((k - 0.15) / 0.85); op = 1 - q; y = -60 * q; sc = 1.08 - 0.08 * q; }
      el.style.opacity = String(op);
      el.style.transform = `translate(-50%, ${y}px) scale(${sc})`;
    }
  }

  private clearPops() {
    for (const el of this.pops.values()) el.remove();
    this.pops.clear();
  }
}

const easeOut = (x: number) => 1 - Math.pow(1 - x, 2);
