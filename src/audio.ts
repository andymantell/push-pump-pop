import type { Rider, Trick } from './rider';
import type { Biome } from './biomes';
import type { Rail } from './track';

// Sound effects and ambience, all synthesised with Web Audio: there are no sound files
// (see SOUNDS.md). Each surface has its own wheel roar, grit, joints and landing thud.
// iOS only lets a page make sound after a tap, so nothing starts until the first one.

export type Ground = 'concrete' | 'wood' | 'tar' | 'snow' | 'sand' | 'stone' | 'basalt' | 'dirt' | 'biscuit';
type RailSound = 'metal' | 'coping' | 'log' | 'sugar';

interface Band { type: BiquadFilterType; f: number; q: number; gain: number }
interface GroundSound {
  /** Low wheel roar (brown noise); its filter opens up by fSpeed Hz per m/s. */
  rumble: Band & { fSpeed: number };
  /** The surface texture (white noise). */
  hiss: Band & { fSpeed: number };
  /** Sparse crackles: grit and gravel under the wheels, denser with speed. */
  grit: Band;
  /** Joints in the surface, `every` metres apart: each wheel clacks over them. */
  seam?: { every: number; gain: number; f: number; q: number; jitter: number };
  /** Landing: a thump, and a burst of noise through this band. */
  land: Band & { decay: number; thump: number };
}

const GROUNDS: Record<Ground, GroundSound> = {
  // Smooth slabs: a clean roar and a tk-tk over each joint.
  concrete: {
    rumble: { type: 'lowpass', f: 420, q: 0.7, gain: 0.55, fSpeed: 16 },
    hiss: { type: 'bandpass', f: 900, q: 0.8, gain: 0.55, fSpeed: 40 },
    grit: { type: 'bandpass', f: 3000, q: 1, gain: 0.12 },
    seam: { every: 3, gain: 0.6, f: 1500, q: 1.5, jitter: 0 },
    land: { type: 'bandpass', f: 900, q: 0.9, gain: 1, decay: 0.12, thump: 1 },
  },
  // Boardwalk planks: hollow, booming, and a clatter over every gap between boards.
  wood: {
    rumble: { type: 'bandpass', f: 260, q: 2.5, gain: 1.4, fSpeed: 8 },
    hiss: { type: 'bandpass', f: 700, q: 1, gain: 0.35, fSpeed: 25 },
    grit: { type: 'bandpass', f: 2000, q: 1, gain: 0.06 },
    seam: { every: 0.45, gain: 0.55, f: 320, q: 5, jitter: 0.05 },
    land: { type: 'bandpass', f: 190, q: 4, gain: 2.2, decay: 0.35, thump: 1.3 },
  },
  // Gravelly tar roofs: duller roar, lots of little stones.
  tar: {
    rumble: { type: 'lowpass', f: 340, q: 0.7, gain: 0.45, fSpeed: 10 },
    hiss: { type: 'bandpass', f: 600, q: 0.7, gain: 0.32, fSpeed: 20 },
    grit: { type: 'bandpass', f: 2600, q: 0.8, gain: 0.4 },
    land: { type: 'lowpass', f: 700, q: 0.7, gain: 0.9, decay: 0.1, thump: 0.9 },
  },
  // A snowboard carving: a bright hiss and crunch, no wheel roar.
  snow: {
    rumble: { type: 'lowpass', f: 300, q: 0.5, gain: 0.12, fSpeed: 0 },
    hiss: { type: 'bandpass', f: 3200, q: 0.6, gain: 0.55, fSpeed: 80 },
    grit: { type: 'bandpass', f: 5000, q: 0.7, gain: 0.35 },
    land: { type: 'lowpass', f: 1600, q: 0.5, gain: 1.3, decay: 0.3, thump: 0.5 },
  },
  // Sandy canyon paths: gritty and hissy, soft landings.
  sand: {
    rumble: { type: 'lowpass', f: 450, q: 0.6, gain: 0.3, fSpeed: 8 },
    hiss: { type: 'bandpass', f: 1800, q: 0.6, gain: 0.6, fSpeed: 40 },
    grit: { type: 'bandpass', f: 3500, q: 0.9, gain: 0.7 },
    land: { type: 'bandpass', f: 1400, q: 0.6, gain: 1, decay: 0.22, thump: 0.6 },
  },
  // Mossy temple flagstones: uneven joints that clunk.
  stone: {
    rumble: { type: 'lowpass', f: 460, q: 0.8, gain: 0.6, fSpeed: 12 },
    hiss: { type: 'bandpass', f: 1100, q: 1, gain: 0.4, fSpeed: 25 },
    grit: { type: 'bandpass', f: 2200, q: 1, gain: 0.2 },
    seam: { every: 1.5, gain: 0.9, f: 650, q: 2, jitter: 0.4 },
    land: { type: 'bandpass', f: 600, q: 1, gain: 1.1, decay: 0.15, thump: 1 },
  },
  // Rough lava rock: a heavy, crunchy roar.
  basalt: {
    rumble: { type: 'lowpass', f: 420, q: 0.9, gain: 0.65, fSpeed: 16 },
    hiss: { type: 'bandpass', f: 1400, q: 0.7, gain: 0.5, fSpeed: 30 },
    grit: { type: 'bandpass', f: 1800, q: 0.8, gain: 0.85 },
    land: { type: 'bandpass', f: 1000, q: 0.8, gain: 1.2, decay: 0.18, thump: 1 },
  },
  // A packed earth farm lane: a soft low roar, crunchy little stones, dull landings.
  dirt: {
    rumble: { type: 'lowpass', f: 380, q: 0.7, gain: 0.45, fSpeed: 10 },
    hiss: { type: 'bandpass', f: 1300, q: 0.7, gain: 0.4, fSpeed: 30 },
    grit: { type: 'bandpass', f: 2600, q: 0.9, gain: 0.5 },
    land: { type: 'bandpass', f: 700, q: 0.8, gain: 1, decay: 0.16, thump: 0.9 },
  },
  // A giant biscuit path: a crumbly crunch and a soft click over the docker holes.
  biscuit: {
    rumble: { type: 'lowpass', f: 360, q: 0.8, gain: 0.4, fSpeed: 10 },
    hiss: { type: 'bandpass', f: 1600, q: 0.8, gain: 0.35, fSpeed: 30 },
    grit: { type: 'bandpass', f: 3200, q: 1.2, gain: 0.65 },
    seam: { every: 1.2, gain: 0.35, f: 1100, q: 2, jitter: 0.1 },
    land: { type: 'bandpass', f: 1200, q: 0.7, gain: 1.1, decay: 0.2, thump: 0.8 },
  },
};

const BIOME_GROUND: Record<string, Ground> = {
  park: 'concrete', beach: 'wood', rooftops: 'tar', snow: 'snow', desert: 'concrete', jungle: 'stone', volcano: 'basalt', farm: 'dirt', candy: 'biscuit', docks: 'concrete', pirate: 'sand', haunted: 'stone', funfair: 'wood', toxic: 'concrete', mine: 'stone', dino: 'dirt', moon: 'sand', sky: 'stone',
};

/** Grinds: noise rung through these resonances, and the clank when you lock on. */
const RAILS: Record<RailSound, { bands: [number, number, number][]; grit: number; gritF: number; clank: number[]; clankDecay: number }> = {
  // [frequency, Q, gain]
  metal: { bands: [[2300, 14, 1], [3900, 16, 0.7], [5600, 18, 0.45], [900, 2, 0.25]], grit: 0.5, gritF: 4000, clank: [880, 1410, 2230, 3170, 4400], clankDecay: 0.45 },
  // A box ledge: the metal edge on concrete, lower and scratchier.
  coping: { bands: [[1700, 8, 0.8], [2900, 9, 0.5], [1200, 1, 0.5]], grit: 0.8, gritF: 2200, clank: [620, 1050, 1720], clankDecay: 0.25 },
  // Jungle logs: a woody rasp.
  log: { bands: [[450, 2.5, 1], [900, 3, 0.6], [1600, 1.5, 0.3]], grit: 0.6, gritF: 900, clank: [210, 330, 520], clankDecay: 0.18 },
  // Candy canes: a glassy hard-candy squeal and a bright little chime when you lock on.
  sugar: { bands: [[3100, 18, 0.8], [4700, 20, 0.5], [1500, 3, 0.3]], grit: 0.3, gritF: 5000, clank: [1320, 1980, 2640, 3960], clankDecay: 0.6 },
};

/** Grind styles: how the pitch and brightness change (a boardslide is the deck on the rail). */
const GRIND_STYLE: Record<string, { pitch: number; q: number }> = {
  '50-50': { pitch: 1, q: 1 }, '5-0': { pitch: 0.94, q: 1 }, 'Nosegrind': { pitch: 1.08, q: 1 }, 'Boardslide': { pitch: 0.6, q: 0.45 },
  // A scooter's deck end on the rail: a feeble rings higher, a smith a little lower.
  'Feeble': { pitch: 1.12, q: 0.8 }, 'Smith': { pitch: 0.9, q: 0.8 },
};

const PREF_KEY = 'ppp-sound';

interface Emitter { next: number; min: number; max: number; play: (t: number) => void }

export class Sound {
  ctx: BaseAudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private amb!: GainNode;
  private white!: AudioBuffer;
  private pink!: AudioBuffer;
  private brown!: AudioBuffer;
  private crackle!: AudioBuffer;
  private on = true;
  /** False when rendering offline, where the context is never 'running' between steps. */
  private live = true;

  private ground: Ground = 'concrete';
  private railSound: RailSound = 'metal';
  private roll: {
    gain: GainNode; rumble: BiquadFilterNode; rumbleGain: GainNode; hiss: BiquadFilterNode; hissGain: GainNode;
    grit: BiquadFilterNode; gritGain: GainNode; gritSrc: AudioBufferSourceNode;
  } | null = null;
  private grind: { gain: GainNode; bands: { f: BiquadFilterNode; g: GainNode }[]; grit: GainNode; gritF: BiquadFilterNode; gritSrc: AudioBufferSourceNode } | null = null;
  private wind: { gain: GainNode; filter: BiquadFilterNode } | null = null;
  private ambNodes: AudioNode[] = [];
  private ambSources: AudioScheduledSourceNode[] = [];
  private emitters: Emitter[] = [];

  // What the rider was doing last frame, to spot changes.
  private dist = 0;
  private nextSeam = 0;
  private pops = 0;
  private perched = false;
  private grindRail: Rail | null = null;
  private grindStyle = '';
  private pushT = 0;
  /** Rolling ducks for a moment after a landing so the wheels hitting the ground punch through. */
  private duckUntil = 0;
  private snow = false;
  /** Feet strapped in (snowboard, mountain board): no pushing. */
  private bound = false;
  /** On a scooter: an aluminium deck and bars that rattle, and whips instead of flips. */
  private scooter = false;
  private cur: Trick | null = null;
  private spinning = false;
  private flipT = 0;
  private inMud = false;
  private bounces = -1;
  private squelchT = 0;

  constructor(ctx?: BaseAudioContext) {
    try { this.on = localStorage.getItem(PREF_KEY) !== 'off'; } catch { /* no storage */ }
    if (ctx) { this.live = false; this.init(ctx); }
  }

  get enabled() { return this.on; }
  set enabled(v: boolean) {
    this.on = v;
    try { localStorage.setItem(PREF_KEY, v ? 'on' : 'off'); } catch { /* no storage */ }
    if (this.ctx) this.master.gain.setTargetAtTime(v ? 0.9 : 0, this.ctx.currentTime, 0.05);
  }

  /**
   * Start sound on the first tap or key press (iOS insists), and wake it again if the
   * system paused it, for example after a phone call or switching apps.
   */
  listen() {
    const unlock = () => {
      if (!this.ctx) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.init(new AC({ latencyHint: 'interactive' }));
      }
      const ctx = this.ctx as AudioContext;
      if (ctx.state !== 'running') {
        ctx.resume().catch(() => {});
        // A silent blip from inside the tap is what really unlocks older iOS.
        const src = ctx.createBufferSource();
        src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
        src.connect(ctx.destination);
        src.start();
      }
    };
    for (const ev of ['pointerdown', 'touchend', 'click', 'keydown']) window.addEventListener(ev, unlock, { capture: true, passive: true });
    document.addEventListener('visibilitychange', () => {
      const ctx = this.ctx as AudioContext | null;
      if (!ctx) return;
      if (document.hidden) ctx.suspend().catch(() => {});
      else ctx.resume().catch(() => {});
    });
  }

  private init(ctx: BaseAudioContext) {
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    // Gentle on the mix, firm on the peaks, so a big crash never clips.
    comp.threshold.value = -8;
    comp.knee.value = 4;
    comp.ratio.value = 12;
    comp.attack.value = 0.003;
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = this.on ? 0.9 : 0;
    this.master.connect(comp);
    this.sfx = ctx.createGain();
    this.sfx.connect(this.master);
    this.amb = ctx.createGain();
    this.amb.gain.value = 0.6;
    this.amb.connect(this.master);
    this.white = this.noise('white', 2);
    this.pink = this.noise('pink', 4);
    this.brown = this.noise('brown', 4);
    this.crackle = this.makeCrackle(2, 300);
    this.buildRoll();
    this.buildGrind();
    this.buildWind();
  }

  private noise(kind: 'white' | 'pink' | 'brown', secs: number) {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * secs), ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0, peak = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'white') d[i] = w;
      else if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last; }
      else {
        // Paul Kellet's pink noise filter.
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;
      }
      peak = Math.max(peak, Math.abs(d[i]));
    }
    for (let i = 0; i < d.length; i++) d[i] /= peak;
    // Fade the ends together so the loop doesn't click.
    const fade = Math.min(2000, d.length >> 4);
    for (let i = 0; i < fade; i++) {
      const k = i / fade;
      d[i] = d[i] * k + d[d.length - fade + i] * (1 - k);
    }
    return buf;
  }

  /** Tiny clicks at random, `rate` a second: gravel and grit when looped. */
  private makeCrackle(secs: number, rate: number) {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * secs), ctx.sampleRate);
    const d = buf.getChannelData(0);
    const n = Math.floor(secs * rate);
    for (let k = 0; k < n; k++) {
      const at = Math.floor(Math.random() * (d.length - 200));
      const amp = Math.pow(Math.random(), 3);
      const len = 20 + Math.floor(Math.random() * 80);
      for (let i = 0; i < len; i++) d[at + i] += (Math.random() * 2 - 1) * amp * (1 - i / len);
    }
    return buf;
  }

  private loop(buf: AudioBuffer, rate = 1) {
    const src = this.ctx!.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.playbackRate.value = rate;
    // Start somewhere random so layers using the same buffer don't line up.
    src.start(0, Math.random() * buf.duration);
    return src;
  }

  private filter(b: { type: BiquadFilterType; f: number; q: number }) {
    const f = this.ctx!.createBiquadFilter();
    f.type = b.type;
    f.frequency.value = b.f;
    f.Q.value = b.q;
    return f;
  }

  private gain(v: number, to?: AudioNode) {
    const g = this.ctx!.createGain();
    g.gain.value = v;
    if (to) g.connect(to);
    return g;
  }

  private buildRoll() {
    const gain = this.gain(0, this.sfx);
    const p = GROUNDS[this.ground];
    const rumble = this.filter(p.rumble), hiss = this.filter(p.hiss), grit = this.filter(p.grit);
    const rumbleGain = this.gain(p.rumble.gain, gain), hissGain = this.gain(p.hiss.gain, gain), gritGain = this.gain(p.grit.gain, gain);
    // Keep the deepest bass out: wheels whir more than they boom.
    this.loop(this.brown).connect(this.filter({ type: 'highpass', f: 160, q: 0.7 })).connect(rumble).connect(rumbleGain);
    this.loop(this.white).connect(hiss).connect(hissGain);
    const gritSrc = this.loop(this.crackle);
    gritSrc.connect(grit).connect(gritGain);
    this.roll = { gain, rumble, rumbleGain, hiss, hissGain, grit, gritGain, gritSrc };
  }

  private buildGrind() {
    const gain = this.gain(0, this.sfx);
    const src = this.loop(this.white);
    const bands = [0, 1, 2, 3].map(() => {
      const f = this.filter({ type: 'bandpass', f: 1000, q: 1 });
      const g = this.gain(0, gain);
      src.connect(f).connect(g);
      return { f, g };
    });
    const grit = this.gain(0, gain);
    const gritSrc = this.loop(this.crackle, 1.5);
    const gritF = this.filter({ type: 'bandpass', f: 3000, q: 0.8 });
    gritSrc.connect(gritF).connect(grit);
    this.grind = { gain, bands, grit, gritF, gritSrc };
  }

  private buildWind() {
    const gain = this.gain(0, this.sfx);
    const filter = this.filter({ type: 'bandpass', f: 400, q: 0.8 });
    this.loop(this.pink).connect(filter).connect(gain);
    this.wind = { gain, filter };
  }

  /** A new track: its surface, rails and ambience. */
  setScene(b: Biome, snow: boolean, bound = snow, scooter = false) {
    this.scooter = scooter;
    this.ground = BIOME_GROUND[b.id] ?? 'concrete';
    this.railSound = b.id === 'jungle' || b.id === 'farm' || b.id === 'pirate' || b.id === 'dino' || b.id === 'sky' ? 'log' : b.id === 'candy' ? 'sugar' : 'metal';
    this.snow = snow;
    this.bound = bound;
    // Start fresh: nothing the rider did on the last track should sound on this one.
    this.perched = false;
    this.pops = -1;
    this.bounces = -1;
    if (!this.ctx) { this.pendingScene = b; return; }
    const p = GROUNDS[this.ground], r = this.roll!, t = this.ctx.currentTime;
    const set = (f: BiquadFilterNode, g: GainNode, band: Band) => {
      f.type = band.type;
      f.frequency.setValueAtTime(band.f, t);
      f.Q.setValueAtTime(band.q, t);
      g.gain.setValueAtTime(band.gain, t);
    };
    set(r.rumble, r.rumbleGain, p.rumble);
    set(r.hiss, r.hissGain, p.hiss);
    set(r.grit, r.gritGain, p.grit);
    this.buildAmbience(b);
  }
  private pendingScene: Biome | null = null;

  /**
   * Every frame. `active` is false on menus and in replays, which keeps the rider quiet.
   */
  update(dt: number, r: Rider, active: boolean, ambLevel: number) {
    const ctx = this.ctx!;
    if (!this.ready()) return;
    if (this.pendingScene) { const b = this.pendingScene; this.pendingScene = null; this.setScene(b, this.snow, this.bound, this.scooter); }
    const t = ctx.currentTime;
    const p = GROUNDS[this.ground];
    const speed = active ? r.speed : 0;
    this.amb.gain.setTargetAtTime(0.6 * ambLevel, t, 0.3);

    // Rolling: on the ground (or round a loop), louder and brighter the faster you go.
    const rolling = active && (r.grounded || !!r.loop) && !r.grind && !r.bailing && !r.perched && r.dropT < 0 && !r.falling;
    const duck = t < this.duckUntil ? 0.3 : 1;
    const lvl = rolling ? Math.pow(Math.min(1, speed / 9), 0.8) * (r.manual ? 0.6 : 1) * 0.22 * duck : 0;
    const roll = this.roll!;
    roll.gain.gain.setTargetAtTime(lvl, t, lvl > 0 ? (duck < 1 ? 0.01 : 0.07) : 0.015);
    roll.rumble.frequency.setTargetAtTime(p.rumble.f + p.rumble.fSpeed * speed, t, 0.1);
    roll.hiss.frequency.setTargetAtTime(p.hiss.f + p.hiss.fSpeed * speed, t, 0.1);
    roll.gritSrc.playbackRate.setTargetAtTime(0.3 + speed / 10, t, 0.1);

    // Joints in the surface clack under the front wheels, then the back ones.
    if (rolling && p.seam && speed > 0.5) {
      this.dist += speed * dt;
      if (this.dist >= this.nextSeam) {
        const s = p.seam;
        this.nextSeam = this.dist + s.every * (1 + (Math.random() * 2 - 1) * s.jitter);
        const g = s.gain * 0.6 * Math.min(1, speed / 8) * (r.manual ? 0.5 : 1);
        this.clack(t, s.f, s.q, g);
        if (!r.manual) this.clack(t + 0.5 / speed, s.f * 0.94, s.q, g * 0.8);
      }
    }

    // Mud: a splat as you hit it, then squelching under the wheels.
    const mud = rolling && r.track.inMud(r.x);
    if (mud && !this.inMud && speed > 2) this.splat(t, Math.min(1, speed / 10));
    if (mud && speed > 1) {
      this.squelchT += dt * (1.5 + speed * 0.35);
      if (this.squelchT >= 1) { this.squelchT -= 1 + Math.random() * 0.4; this.squelch(t, Math.min(1, speed / 9)); }
    } else this.squelchT = 0.5;
    this.inMud = mud;

    // Pushing: a shoe scuffing the ground on each kick.
    if (active && r.pushing && r.grounded && !this.bound) {
      this.pushT += dt * 1.6;
      if (this.pushT >= 1) { this.pushT -= 1; this.scuff(t); }
    } else this.pushT = 0.7;

    // Bounced off a jelly pad.
    if (r.bounces !== this.bounces) {
      if (active && this.bounces >= 0) this.boing(t, r.speed);
      this.bounces = r.bounces;
    }
    // Popped off the ground or a rail.
    if (r.pops !== this.pops) {
      if (active && this.pops >= 0) this.pop(t);
      this.pops = r.pops;
    }
    // Flips and spins starting, and each new turn of a backflip or frontflip.
    if (active) {
      if (r.current && r.current !== this.cur) {
        const c = r.current, was = this.cur?.axis === 'whip' ? this.cur : null;
        // A whip turning the deck, a barspin ticking round the headset (a second swipe adds one).
        if (c.axis === 'whip') {
          if ((c.whip ?? 0) !== (was?.whip ?? 0)) this.whoosh('flip');
          if ((c.bars ?? 0) !== (was?.bars ?? 0)) this.barspin(t);
        } else this.whoosh(c.axis === 'flip' ? 'flip' : 'spin');
      }
      if (r.spin && !this.spinning) this.whoosh('spin');
      if (r.flipping && (this.flipT === 0 || r.flipT < this.flipT)) this.whoosh('big');
    }
    this.cur = r.current;
    this.spinning = !!r.spin;
    this.flipT = r.flipping ? r.flipT : 0;
    // Dropping in from the coping.
    if (this.perched && !r.perched && active) { this.clack(t, 900, 1.5, 0.7); this.thump(t + 0.05, 0.4); }
    this.perched = r.perched;

    // Grinding.
    const rail = active ? r.grind?.rail ?? null : null;
    const style = r.grind?.style ?? '';
    if (rail !== this.grindRail) {
      if (rail) this.lockOn(t, rail);
      this.grindRail = rail;
    } else if (rail && style !== this.grindStyle) this.clack(t, 1800, 2, 0.5);
    this.grindStyle = style;
    const g = this.grind!;
    if (rail) {
      const kind = this.railKind(rail);
      const prof = RAILS[kind], st = GRIND_STYLE[style] ?? GRIND_STYLE['50-50'];
      const pitch = st.pitch * (0.85 + speed / 40) * (this.snow ? 0.85 : 1);
      g.bands.forEach(({ f, g: bg }, i) => {
        const b = prof.bands[i];
        // Narrow bands let little through, so they get a boost.
        bg.gain.setTargetAtTime(b ? b[2] * (b[1] > 5 ? 3 : 1) : 0, t, 0.02);
        if (!b) return;
        f.frequency.setTargetAtTime(b[0] * pitch, t, 0.03);
        f.Q.setTargetAtTime(b[1] * st.q, t, 0.03);
      });
      g.gritF.frequency.setTargetAtTime(prof.gritF * pitch, t, 0.03);
      g.grit.gain.setTargetAtTime(prof.grit * (style === 'Boardslide' ? 0.5 : 1), t, 0.02);
      g.gritSrc.playbackRate.setTargetAtTime(0.8 + speed / 8, t, 0.05);
      // A little wobble, like real wheels on a rail.
      const wob = 0.85 + Math.random() * 0.3;
      g.gain.gain.setTargetAtTime(0.16 * Math.min(1, speed / 6) * wob * (this.snow ? 0.7 : 1), t, 0.02);
    } else g.gain.gain.setTargetAtTime(0, t, 0.03);

    // Wind rushing past, more of it in the air.
    const w = this.wind!;
    const air = active && !r.grounded && !r.grind && !r.loop;
    const wl = Math.pow(Math.min(1, speed / 20), 2) * (air ? 0.35 : 0.15);
    w.gain.gain.setTargetAtTime(wl, t, 0.15);
    w.filter.frequency.setTargetAtTime(250 + speed * 45, t, 0.2);

    for (const e of this.emitters) {
      if (t < e.next) continue;
      e.play(t);
      e.next = t + e.min + Math.random() * (e.max - e.min);
    }
  }

  private railKind(rail: Rail): RailSound {
    return rail.kind === 'ledge' ? 'coping' : this.railSound;
  }

  // ---- One-shots ----

  private burst(t: number, o: { buf?: AudioBuffer; type: BiquadFilterType; f: number; q: number; gain: number; attack?: number; decay: number; fEnd?: number; rate?: number; to?: AudioNode; pan?: number }) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = o.buf ?? this.white;
    src.loop = true;
    src.playbackRate.value = o.rate ?? 1;
    const f = this.filter(o);
    if (o.fEnd) f.frequency.exponentialRampToValueAtTime(o.fEnd, t + (o.attack ?? 0.002) + o.decay);
    const g = ctx.createGain();
    const a = o.attack ?? 0.002;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.gain, t + a);
    g.gain.setTargetAtTime(0, t + a, o.decay / 4);
    let out: AudioNode = g;
    if (o.pan) { const p = ctx.createStereoPanner(); p.pan.value = o.pan; g.connect(p); out = p; }
    out.connect(o.to ?? this.sfx);
    src.connect(f).connect(g);
    src.start(t, Math.random() * src.buffer.duration);
    src.stop(t + a + o.decay * 1.5 + 0.05);
  }

  private tone(t: number, o: { type?: OscillatorType; f: number; fEnd?: number; gain: number; attack?: number; decay: number; to?: AudioNode; lp?: number; pan?: number; glide?: number }) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    const a = o.attack ?? 0.005;
    if (o.fEnd) osc.frequency.exponentialRampToValueAtTime(o.fEnd, t + a + (o.glide ?? o.decay));
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.gain, t + a);
    g.gain.setTargetAtTime(0, t + a, o.decay / 4);
    let node: AudioNode = osc;
    if (o.lp) { const f = this.filter({ type: 'lowpass', f: o.lp, q: 0.7 }); osc.connect(f); node = f; }
    node.connect(g);
    let out: AudioNode = g;
    if (o.pan) { const p = ctx.createStereoPanner(); p.pan.value = o.pan; g.connect(p); out = p; }
    out.connect(o.to ?? this.sfx);
    osc.start(t);
    osc.stop(t + a + o.decay * 1.5 + 0.05);
  }

  private clack(t: number, f: number, q: number, gain: number) {
    this.burst(t, { type: 'bandpass', f, q, gain, decay: 0.03 });
  }

  private thump(t: number, gain: number) {
    this.tone(t, { f: 110, fEnd: 45, gain, decay: 0.12 });
  }

  private scuff(t: number) {
    this.burst(t, { type: 'bandpass', f: 2600, q: 0.8, gain: 0.12, attack: 0.04, decay: 0.12, fEnd: 1800 });
  }

  /** Bars spinning: the headset ticking round, and a swish of air. */
  private barspin(t: number) {
    for (let i = 0; i < 6; i++) this.clack(t + i * 0.05, 3200 + i * 120, 6, 0.08);
    this.burst(t, { buf: this.pink, type: 'bandpass', f: 1400, q: 2, gain: 0.2, attack: 0.05, decay: 0.25, fEnd: 2600 });
  }

  /** Tail snap: the board's tail hitting the ground, then the wheels leaving it. */
  private pop(t: number) {
    if (this.scooter && !this.snow) {
      // A bunny hop: no tail to snap, just the wheels leaving the ground and the deck rattling.
      const p = GROUNDS[this.ground];
      this.burst(t, { type: p.land.type, f: p.land.f * 1.4, q: p.land.q, gain: p.land.gain * 0.3, decay: p.land.decay * 0.4 });
      this.clack(t + 0.02, 2600, 5, 0.18);
      this.tone(t, { f: 140, fEnd: 70, gain: 0.2, decay: 0.05 });
      return;
    }
    if (this.snow) {
      this.burst(t, { type: 'lowpass', f: 900, q: 0.6, gain: 0.5, decay: 0.08 });
      return;
    }
    const p = GROUNDS[this.ground];
    this.burst(t, { type: 'bandpass', f: 2200, q: 1.2, gain: 0.7, decay: 0.025 });
    this.burst(t, { type: p.land.type, f: p.land.f * 1.5, q: p.land.q, gain: p.land.gain * 0.35, decay: p.land.decay * 0.4 });
    this.tone(t, { f: 160, fEnd: 60, gain: 0.35, decay: 0.06 });
  }

  /** Touching down: the bigger the air, the bigger the thud. */
  land(airTime: number) {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    const p = GROUNDS[this.ground];
    const s = Math.min(1, 0.3 + airTime * 0.6);
    this.duckUntil = t + 0.1 + s * 0.08;
    this.burst(t, { type: p.land.type, f: p.land.f, q: p.land.q, gain: p.land.gain * s * 0.8, decay: p.land.decay * (0.7 + s * 0.5) });
    this.tone(t, { f: 95, fEnd: 40, gain: p.land.thump * s * 0.7, decay: 0.15 + s * 0.1 });
    if (!this.snow) {
      // Back wheels, then front: each a punchy smack of urethane and a ring from the trucks.
      for (const [dt, g] of [[0, 1], [0.035, 0.8]]) this.wheels(t + dt, g * s);
      // A big landing rattles the trucks.
      if (s > 0.6) for (let i = 0; i < 3; i++) this.clack(t + 0.07 + i * 0.03 + Math.random() * 0.02, 2200 + Math.random() * 1200, 4, 0.12 * s / (1 + i));
    } else this.burst(t, { buf: this.crackle, type: 'bandpass', f: 4500, q: 0.8, gain: 0.8 * s, decay: 0.2 });
  }

  /** Two wheels and a truck hitting the ground together. */
  /** A jelly pad: a wobbly rising boing and a soft splat of jelly. */
  private boing(t: number, speed: number) {
    const f = 170 + Math.min(10, speed) * 6;
    const o = this.ctx!.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 3.2, t + 0.22);
    o.frequency.exponentialRampToValueAtTime(f * 2.4, t + 0.45);
    const wob = this.ctx!.createOscillator();
    wob.frequency.value = 22;
    const wg = this.gain(f * 0.12);
    wob.connect(wg).connect(o.frequency);
    const g = this.gain(0, this.sfx);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(g);
    o.start(t); wob.start(t);
    o.stop(t + 0.52); wob.stop(t + 0.52);
    this.burst(t, { buf: this.pink, type: 'lowpass', f: 900, q: 1, gain: 0.5, decay: 0.08 });
  }

  /** Riding into mud: a wet slap. */
  private splat(t: number, g: number) {
    this.burst(t, { buf: this.brown, type: 'bandpass', f: 700, q: 1.2, gain: 0.9 * g, attack: 0.005, decay: 0.18, fEnd: 260 });
    this.burst(t + 0.02, { buf: this.pink, type: 'bandpass', f: 2200, q: 1.5, gain: 0.25 * g, decay: 0.12, fEnd: 900 });
  }

  /** One squelch: a gloopy, falling, slightly bubbly suck. */
  private squelch(t: number, g: number) {
    const f = 380 + Math.random() * 220;
    this.burst(t, { buf: this.brown, type: 'bandpass', f, q: 4, gain: 0.5 * g, attack: 0.01, decay: 0.12, fEnd: f * 0.55, pan: (Math.random() - 0.5) * 0.3 });
    this.tone(t + 0.02, { f: f * 1.6, fEnd: f * 0.9, gain: 0.03 * g, decay: 0.07, glide: 0.06 });
  }

  private wheels(t: number, g: number) {
    this.tone(t, { f: 340, fEnd: 120, gain: 0.55 * g, attack: 0.001, decay: 0.045 });
    this.burst(t, { type: 'bandpass', f: 650, q: 1.2, gain: 0.9 * g, attack: 0.001, decay: 0.05 });
    this.burst(t, { type: 'bandpass', f: 1600, q: 2, gain: 0.45 * g, attack: 0.001, decay: 0.02 });
    for (const f of [1950, 2780, 3640]) this.tone(t, { f: f * (0.97 + Math.random() * 0.06), gain: 0.05 * g, attack: 0.001, decay: 0.08 });
  }

  private lockOn(t: number, rail: Rail) {
    const prof = RAILS[this.railKind(rail)];
    prof.clank.forEach((f, i) => this.tone(t, { f: f * (0.98 + Math.random() * 0.04), gain: 0.08 / (1 + i * 0.5), decay: prof.clankDecay / (1 + i * 0.3), type: this.railKind(rail) === 'log' ? 'triangle' : 'sine' }));
    this.burst(t, { type: 'bandpass', f: prof.clank[1] * 2, q: 1, gain: 0.25, decay: 0.03 });
    this.thump(t, 0.3);
  }

  trick(tr: Trick) {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    switch (tr.axis) {
      case 'flip': case 'spin': case 'shifty': case 'tuck':
        // Feet catching the board as it comes round.
        this.burst(t, { type: 'bandpass', f: this.snow ? 900 : 1600, q: 3, gain: 0.25, decay: 0.03 });
        break;
      case 'loop':
        this.chime(t, [784, 1175, 1568], 0.07, 0.18);
        break;
      case 'whip':
        // Feet stamping back on the deck as it comes round, and a hollow ring from the aluminium.
        if (tr.whip) {
          this.burst(t, { type: 'bandpass', f: this.snow ? 900 : 1300, q: 2.5, gain: 0.32, decay: 0.03 });
          if (!this.snow) for (const f of [1850, 2900]) this.tone(t, { f, gain: 0.04, decay: 0.12 });
        }
        // Hands slapping back onto the grips.
        if (tr.bars) this.burst(t + 0.01, { type: 'bandpass', f: 700, q: 1.5, gain: 0.25, decay: 0.025 });
        break;
    }
  }

  /** The start of a flip or spin: a whoosh as the board or body turns. */
  whoosh(kind: 'flip' | 'spin' | 'big') {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    if (kind === 'flip') {
      this.burst(t, { type: 'bandpass', f: 2600, q: 4, gain: 0.3, decay: 0.012 });
      this.burst(t, { buf: this.pink, type: 'bandpass', f: 900, q: 2, gain: 0.3, attack: 0.08, decay: 0.2, fEnd: 2600 });
    } else if (kind === 'spin') {
      this.burst(t, { buf: this.pink, type: 'bandpass', f: 400, q: 1.5, gain: 0.35, attack: 0.12, decay: 0.3, fEnd: 1200 });
    } else {
      this.burst(t, { buf: this.pink, type: 'bandpass', f: 300, q: 1.2, gain: 0.45, attack: 0.25, decay: 0.5, fEnd: 900 });
    }
  }

  grab() {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    if (this.scooter) {
      // Body tricks: no board to grab, just a swish of legs and clothes, and the deck clinking free.
      this.burst(t, { buf: this.pink, type: 'bandpass', f: 600, q: 1.2, gain: 0.3, attack: 0.04, decay: 0.2, fEnd: 1300 });
      this.clack(t + 0.02, 2400, 5, 0.1);
      return;
    }
    // A hand slapping the board, and the grip tape under the fingers.
    this.burst(t, { type: 'bandpass', f: 900, q: 2, gain: 0.35, decay: 0.03 });
    this.burst(t + 0.01, { type: 'highpass', f: 3500, q: 0.7, gain: 0.12, attack: 0.01, decay: 0.08 });
  }

  manual() {
    if (!this.ready()) return;
    // The front or back wheels lift: a little truck rattle.
    this.clack(this.ctx!.currentTime, 1100, 2, 0.3);
  }

  pump(good: boolean) {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    // Knees driving the board down: a soft whump, with a lift on a good one.
    this.tone(t, { f: 70, fEnd: 50, gain: good ? 0.45 : 0.2, attack: 0.04, decay: 0.2 });
    if (good) this.tone(t + 0.03, { type: 'triangle', f: 520, fEnd: 780, gain: 0.06, attack: 0.02, decay: 0.12 });
  }

  bail() {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    const p = GROUNDS[this.ground];
    // A thud, a slide along the ground, and the board clattering away.
    this.tone(t, { f: 90, fEnd: 35, gain: 0.8, decay: 0.25 });
    this.burst(t, { type: p.land.type, f: p.land.f, q: p.land.q, gain: p.land.gain * 0.8, decay: p.land.decay * 1.5 });
    this.burst(t + 0.05, { type: this.snow ? 'highpass' : 'bandpass', f: this.snow ? 2500 : 1500, q: 0.7, gain: 0.4, attack: 0.03, decay: 0.45, fEnd: 700 });
    if (!this.snow) for (let i = 0; i < 5; i++) {
      const at = t + 0.12 + i * (0.09 + Math.random() * 0.08);
      this.clack(at, 700 + Math.random() * 900, 3, 0.5 / (1 + i * 0.6));
    }
  }

  /** Into a gap: a splash, a sizzle, or a long way down. */
  fall(into: 'water' | 'lava' | 'dark' | 'sky' | 'loop') {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    if (into === 'loop') { this.bail(); return; }
    if (into === 'water') {
      const at = t + 0.35;
      this.burst(at, { type: 'lowpass', f: 4000, q: 0.7, gain: 0.8, attack: 0.01, decay: 0.6, fEnd: 500 });
      this.tone(at, { f: 120, fEnd: 50, gain: 0.5, decay: 0.2 });
      for (let i = 0; i < 9; i++) {
        const f = 400 + Math.random() * 700;
        this.tone(at + 0.1 + Math.random() * 0.6, { f, fEnd: f * 1.8, gain: 0.06, decay: 0.05, glide: 0.04 });
      }
    } else if (into === 'lava') {
      const at = t + 0.35;
      this.tone(at, { f: 80, fEnd: 40, gain: 0.6, decay: 0.3 });
      this.burst(at, { type: 'highpass', f: 3000, q: 0.5, gain: 0.25, attack: 0.02, decay: 1.2 });
      this.burst(at, { buf: this.crackle, type: 'bandpass', f: 2500, q: 0.7, gain: 0.8, attack: 0.02, decay: 1 });
    } else if (into === 'sky') {
      // A long whistle down past the islands, and a soft poof into the clouds.
      this.tone(t, { f: 1500, fEnd: 300, gain: 0.08, attack: 0.05, decay: 1.4, glide: 1.4 });
      this.burst(t + 1.3, { type: 'lowpass', f: 900, q: 0.5, gain: 0.3, attack: 0.05, decay: 0.6 });
    } else {
      // A cartoon whistle down, and a far-off bump.
      this.tone(t, { f: 1300, fEnd: 350, gain: 0.08, attack: 0.05, decay: 0.9, glide: 0.9 });
      this.tone(t + 0.9, { f: 80, fEnd: 40, gain: 0.35, decay: 0.2 });
    }
  }

  enterLoop() {
    if (!this.ready()) return;
    this.burst(this.ctx!.currentTime, { buf: this.pink, type: 'bandpass', f: 300, q: 1, gain: 0.35, attack: 0.3, decay: 0.6, fEnd: 1400 });
  }

  // ---- Game feedback ----

  private chime(t: number, notes: number[], gap: number, gain: number, type: OscillatorType = 'sine') {
    notes.forEach((f, i) => {
      this.tone(t + i * gap, { type, f, gain, decay: 0.35 });
      this.tone(t + i * gap, { f: f * 2.005, gain: gain * 0.3, decay: 0.2 });
    });
  }

  /** A combo banked: higher and longer for a bigger multiplier. */
  bank(mult: number) {
    if (!this.ready()) return;
    const scale = [523, 659, 784, 1047, 1319, 1568];
    const n = Math.max(1, Math.min(scale.length, mult));
    this.chime(this.ctx!.currentTime, scale.slice(0, n), 0.06, 0.1);
  }

  lost() {
    if (!this.ready()) return;
    this.tone(this.ctx!.currentTime + 0.2, { type: 'triangle', f: 330, fEnd: 165, gain: 0.15, decay: 0.3, lp: 1200 });
  }

  challenge() {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.chime(t, [784, 988, 1175, 1568], 0.07, 0.12, 'triangle');
    for (let i = 0; i < 6; i++) this.tone(t + 0.3 + i * 0.04, { f: 2500 + Math.random() * 2000, gain: 0.03, decay: 0.1 });
  }

  lifeLost() {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime + 0.25;
    this.tone(t, { type: 'square', f: 294, gain: 0.07, decay: 0.12, lp: 1500 });
    this.tone(t + 0.13, { type: 'square', f: 220, gain: 0.07, decay: 0.2, lp: 1500 });
  }

  outOfLives() {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime + 0.5;
    [392, 330, 262].forEach((f, i) => this.tone(t + i * 0.2, { type: 'triangle', f, gain: 0.14, decay: 0.3, lp: 1800 }));
  }

  finish() {
    if (!this.ready()) return;
    const t = this.ctx!.currentTime;
    this.chime(t, [523, 659, 784, 1047], 0.08, 0.11, 'triangle');
    [523, 659, 784].forEach((f) => this.tone(t + 0.35, { type: 'triangle', f, gain: 0.06, attack: 0.02, decay: 0.9 }));
  }

  /** A soft tick for menu buttons. */
  click() {
    if (!this.ready()) return;
    this.tone(this.ctx!.currentTime, { f: 1500, fEnd: 1100, gain: 0.08, decay: 0.03 });
  }

  /** The replay button popping up, or a new drop. */
  blip() {
    if (!this.ready()) return;
    this.tone(this.ctx!.currentTime, { type: 'triangle', f: 880, fEnd: 1320, gain: 0.06, decay: 0.08 });
  }

  private ready() {
    return !!this.ctx && (!this.live || this.ctx.state === 'running');
  }

  // ---- Ambience ----

  private buildAmbience(b: Biome) {
    const ctx = this.ctx!, t = ctx.currentTime;
    for (const s of this.ambSources) { try { s.stop(t + 0.5); } catch { /* not started */ } }
    const old = this.ambNodes;
    setTimeout(() => old.forEach((n) => n.disconnect()), 800);
    this.ambSources = [];
    this.ambNodes = [];
    this.emitters = [];
    const night = !!b.lights || !!b.stars;
    const out = this.gain(0, this.amb);
    out.gain.setTargetAtTime(1, t + 0.3, 0.4);
    this.ambNodes.push(out);

    /** A looping noise bed, gently swelling every `period` seconds by `depth`. */
    const bed = (buf: AudioBuffer, band: { type: BiquadFilterType; f: number; q: number }, gain: number, period = 0, depth = 0, sweep = 0) => {
      const src = this.loop(buf);
      const f = this.filter(band);
      const g = this.gain(gain, out);
      src.connect(f).connect(g);
      this.ambSources.push(src);
      this.ambNodes.push(f, g);
      if (period) {
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 1 / period;
        const d = this.gain(gain * depth);
        lfo.connect(d).connect(g.gain);
        if (sweep) { const s = this.gain(sweep); lfo.connect(s).connect(f.frequency); this.ambNodes.push(s); }
        lfo.start(t + Math.random());
        this.ambSources.push(lfo);
        this.ambNodes.push(d);
      }
    };
    const every = (min: number, max: number, play: (t: number) => void) =>
      this.emitters.push({ next: t + 1 + Math.random() * min, min, max, play });
    const pan = () => Math.random() * 1.6 - 0.8;

    const bird = (at: number) => {
      const p = pan(), f0 = 2800 + Math.random() * 1800, n = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) this.tone(at + i * 0.11, { f: f0 * (1 + Math.random() * 0.15), fEnd: f0 * 0.7, gain: 0.025, decay: 0.06, glide: 0.06, to: out, pan: p });
    };
    const crickets = (at: number) => {
      const p = pan(), f = 4200 + Math.random() * 600;
      for (let i = 0; i < 3; i++) this.tone(at + i * 0.045, { f, gain: 0.012, attack: 0.004, decay: 0.025, to: out, pan: p });
    };

    switch (b.id) {
      case 'park':
        bed(this.pink, { type: 'lowpass', f: 450, q: 0.7 }, 0.07, 11, 0.6);
        if (night) every(0.4, 1.4, crickets); else every(1.5, 5, bird);
        break;
      case 'beach': {
        // Waves rolling in and washing out, and gulls.
        bed(this.brown, { type: 'lowpass', f: 600, q: 0.7 }, 0.16, 8, 0.8, 250);
        bed(this.pink, { type: 'highpass', f: 2000, q: 0.5 }, 0.025, 8, 0.9);
        if (!night) every(6, 14, (at) => {
          const p = pan();
          for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++)
            this.tone(at + i * 0.4, { type: 'sawtooth', f: 1500, fEnd: 1000, gain: 0.02, attack: 0.04, decay: 0.3, glide: 0.3, lp: 2600, to: out, pan: p });
        });
        else every(0.6, 2, crickets);
        break;
      }
      case 'rooftops':
        // The city far below: a low hum of traffic, cars going by, the odd horn.
        bed(this.brown, { type: 'lowpass', f: 200, q: 0.7 }, 0.18);
        bed(this.pink, { type: 'bandpass', f: 900, q: 0.6 }, 0.02, 9, 0.5);
        every(5, 12, (at) => {
          const src = ctx.createBufferSource();
          src.buffer = this.brown;
          const f = this.filter({ type: 'bandpass', f: 300, q: 1 });
          const g = this.gain(0);
          const pn = ctx.createStereoPanner();
          const dir = Math.random() < 0.5 ? -1 : 1;
          pn.pan.setValueAtTime(-0.9 * dir, at);
          pn.pan.linearRampToValueAtTime(0.9 * dir, at + 3);
          f.frequency.setValueAtTime(260, at);
          f.frequency.linearRampToValueAtTime(420, at + 1.5);
          f.frequency.linearRampToValueAtTime(240, at + 3);
          g.gain.setValueAtTime(0, at);
          g.gain.linearRampToValueAtTime(0.25, at + 1.5);
          g.gain.linearRampToValueAtTime(0, at + 3);
          src.connect(f).connect(g).connect(pn).connect(out);
          src.start(at, Math.random() * 2);
          src.stop(at + 3.1);
        });
        every(20, 45, (at) => {
          const p = pan();
          for (const f of [415, 523]) this.tone(at, { type: 'square', f, gain: 0.015, attack: 0.02, decay: 0.3, lp: 1100, to: out, pan: p });
        });
        break;
      case 'snow': {
        // Mountain wind, howling more in a blizzard.
        const heavy = b.particles === 'heavysnow';
        bed(this.pink, { type: 'bandpass', f: 550, q: 1.6 }, heavy ? 0.5 : 0.25, 7, 0.7, 250);
        bed(this.pink, { type: 'bandpass', f: 1200, q: 2.5 }, heavy ? 0.15 : 0.08, 13, 0.8, 400);
        break;
      }
      case 'desert':
        bed(this.pink, { type: 'bandpass', f: 1000, q: 0.8 }, 0.14, 9, 0.7, 300);
        if (b.mood === 'Sandstorm') bed(this.white, { type: 'highpass', f: 3000, q: 0.5 }, 0.03, 5, 0.6);
        if (night) every(0.5, 1.6, crickets);
        else every(14, 30, (at) => this.tone(at, { f: 2900, fEnd: 2000, gain: 0.025, attack: 0.05, decay: 0.8, glide: 0.8, to: out, pan: pan() }));
        break;
      case 'jungle': {
        // Insects buzzing, birds calling, frogs.
        const src = this.loop(this.white);
        const f = this.filter({ type: 'bandpass', f: 5500, q: 6 });
        const g = this.gain(0.012, out);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 23;
        const d = this.gain(0.012);
        lfo.connect(d).connect(g.gain);
        lfo.start();
        src.connect(f).connect(g);
        this.ambSources.push(src, lfo);
        this.ambNodes.push(f, g, d);
        bed(this.pink, { type: 'lowpass', f: 500, q: 0.7 }, 0.1, 10, 0.5);
        every(2.5, 7, (at) => {
          const p = pan(), f0 = 700 + Math.random() * 500;
          for (let i = 0; i < 2; i++) this.tone(at + i * 0.28, { f: f0, fEnd: f0 * 2, gain: 0.03, attack: 0.02, decay: 0.2, glide: 0.18, to: out, pan: p });
        });
        every(3, 8, (at) => {
          const p = pan();
          for (let i = 0; i < 3; i++) this.tone(at + i * 0.07, { type: 'square', f: 170 + Math.random() * 30, gain: 0.03, decay: 0.04, lp: 700, to: out, pan: p });
        });
        if (night) every(0.4, 1.2, crickets);
        break;
      }
      case 'farm': {
        // Wind through the corn, birds, hens clucking and a cow now and then; owls at night.
        bed(this.pink, { type: 'bandpass', f: 1500, q: 0.7 }, 0.06, 9, 0.8, 500);
        bed(this.pink, { type: 'lowpass', f: 400, q: 0.7 }, 0.05, 13, 0.5);
        const moo = (at: number) => {
          const p = pan(), f0 = 120 + Math.random() * 30, len = 0.9 + Math.random() * 0.6;
          this.tone(at, { type: 'sawtooth', f: f0, fEnd: f0 * 0.82, gain: 0.04, attack: 0.18, decay: len, glide: len, lp: 700, to: out, pan: p });
          this.tone(at, { type: 'sawtooth', f: f0 * 2.01, fEnd: f0 * 1.6, gain: 0.012, attack: 0.2, decay: len * 0.8, glide: len, lp: 900, to: out, pan: p });
        };
        const cluck = (at: number) => {
          const p = pan(), n = 3 + Math.floor(Math.random() * 4);
          for (let i = 0; i < n; i++) {
            const f = 520 + Math.random() * 160;
            this.tone(at + i * 0.13 + Math.random() * 0.04, { type: 'square', f, fEnd: f * 0.8, gain: 0.012, decay: 0.05, glide: 0.04, lp: 1800, to: out, pan: p });
          }
        };
        if (night) {
          every(0.5, 1.5, crickets);
          every(9, 20, (at) => {
            const p = pan();
            this.tone(at, { f: 390, fEnd: 360, gain: 0.03, attack: 0.04, decay: 0.35, glide: 0.3, to: out, pan: p });
            this.tone(at + 0.55, { f: 380, fEnd: 330, gain: 0.025, attack: 0.04, decay: 0.6, glide: 0.5, to: out, pan: p });
          });
        } else {
          every(2, 6, bird);
          every(5, 12, cluck);
          every(14, 32, moo);
          if (b.mood === 'Morning' || b.mood === 'Morning mist') every(18, 35, (at) => {
            // Cock-a-doodle-doo.
            const p = pan();
            [[520, 700, 0.14], [700, 760, 0.14], [760, 900, 0.18], [900, 620, 0.5]].forEach(([f0, f1, d], i) =>
              this.tone(at + [0, 0.16, 0.32, 0.52][i], { type: 'sawtooth', f: f0, fEnd: f1, gain: 0.02, attack: 0.02, decay: d, glide: d, lp: 2200, to: out, pan: p }));
          });
        }
        break;
      }
      case 'docks': {
        // Water slapping the harbour wall, gulls, chains and the crane's beeps; ship horns and a foghorn in the fog.
        const fog = b.mood === 'Sea fog';
        bed(this.brown, { type: 'lowpass', f: 380, q: 0.8 }, 0.1, 5, 0.7, 120);
        bed(this.pink, { type: 'bandpass', f: 1400, q: 0.8 }, 0.02, 3.3, 0.9);
        every(0.8, 2.5, (at) => this.burst(at, { buf: this.brown, type: 'bandpass', f: 500 + Math.random() * 300, q: 1.5, gain: 0.12, attack: 0.02, decay: 0.25, to: out, pan: pan() }));
        if (!night && !fog) every(4, 10, (at) => {
          const p = pan();
          for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++)
            this.tone(at + i * 0.35, { type: 'sawtooth', f: 1600, fEnd: 1050, gain: 0.018, attack: 0.03, decay: 0.28, glide: 0.28, lp: 2800, to: out, pan: p });
        });
        // Chains clanking as a container is lifted.
        every(9, 20, (at) => {
          const p = pan();
          for (let i = 0; i < 6; i++) this.tone(at + i * 0.09 + Math.random() * 0.03, { f: 1800 + Math.random() * 900, gain: 0.012, attack: 0.002, decay: 0.08, to: out, pan: p });
        });
        // The crane's warning beeps.
        if (!fog) every(14, 30, (at) => { const p = pan(); for (let i = 0; i < 3; i++) this.tone(at + i * 0.5, { type: 'square', f: 1200, gain: 0.008, attack: 0.005, decay: 0.25, lp: 2500, to: out, pan: p }); });
        // A big ship's horn far off, or the foghorn every few seconds in the fog.
        every(fog ? 9 : 25, fog ? 14 : 50, (at) => {
          const p = pan() * 0.5, len = fog ? 2.2 : 1.6;
          for (const f of fog ? [98, 147] : [110, 165]) this.tone(at, { type: 'sawtooth', f, gain: 0.03, attack: 0.15, decay: len, lp: 600, to: out, pan: p });
        });
        break;
      }
      case 'pirate': {
        // Surf on the rocks, a ship's timbers creaking, parrots and gulls, the ship's bell,
        // and a cannon booming far off. Torchlit nights get crickets and the bell only.
        bed(this.brown, { type: 'lowpass', f: 520, q: 0.7 }, 0.15, 7, 0.8, 220);
        bed(this.pink, { type: 'highpass', f: 1800, q: 0.5 }, 0.022, 7, 0.9);
        // Waves slapping the stepping stones.
        every(1.2, 3.2, (at) => this.burst(at, { buf: this.brown, type: 'bandpass', f: 420 + Math.random() * 260, q: 1.4, gain: 0.1, attack: 0.03, decay: 0.3, to: out, pan: pan() }));
        // Timbers creaking: a slow, rough glide.
        every(6, 14, (at) => {
          const f = 120 + Math.random() * 90, p = pan();
          this.tone(at, { type: 'sawtooth', f, fEnd: f * 1.35, gain: 0.012, attack: 0.25, decay: 0.7, glide: 0.8, lp: 900, to: out, pan: p });
        });
        if (!night) {
          // A parrot squawk: two harsh chirps.
          every(8, 18, (at) => {
            const p = pan();
            for (let i = 0; i < 2; i++) this.tone(at + i * 0.16, { type: 'square', f: 1900, fEnd: 1300, gain: 0.012, attack: 0.01, decay: 0.12, glide: 0.1, lp: 3200, to: out, pan: p });
          });
          every(6, 14, (at) => {
            const p = pan();
            for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++)
              this.tone(at + i * 0.4, { type: 'sawtooth', f: 1500, fEnd: 1000, gain: 0.016, attack: 0.04, decay: 0.3, glide: 0.3, lp: 2600, to: out, pan: p });
          });
          // A cannon far across the bay: a dull thud and a long rumble.
          every(30, 60, (at) => this.burst(at, { buf: this.brown, type: 'lowpass', f: 160, q: 0.7, gain: 0.35, attack: 0.01, decay: 1.4, to: out, pan: pan() * 0.6 }));
        } else every(0.6, 2, crickets);
        // The ship's bell: two strokes.
        every(20, 40, (at) => {
          const p = pan() * 0.7;
          for (let i = 0; i < 2; i++) for (const [f, g] of [[880, 0.02], [2210, 0.008], [3340, 0.004]] as const)
            this.tone(at + i * 0.6, { f, gain: g, attack: 0.003, decay: 1.6, to: out, pan: p });
        });
        break;
      }
      case 'haunted': {
        // Wind moaning through bare trees, owls, a creaking gate, crows, and now and then a
        // friendly ghost going "whooo".
        bed(this.pink, { type: 'bandpass', f: 520, q: 1.6 }, 0.07, 9, 0.8, 260);
        bed(this.brown, { type: 'lowpass', f: 160, q: 0.7 }, 0.08, 6, 0.5);
        every(0.6, 2, crickets);
        // An owl: hoo, hoo-hoo.
        every(8, 18, (at) => {
          const p = pan();
          [0, 0.55, 0.8].forEach((d, i) => this.tone(at + d, { f: i ? 380 : 400, fEnd: i ? 340 : 360, gain: 0.03, attack: 0.04, decay: 0.32, glide: 0.3, lp: 900, to: out, pan: p }));
        });
        // A gate creaking open on rusty hinges.
        every(14, 30, (at) => {
          const p = pan();
          this.tone(at, { type: 'sawtooth', f: 520, fEnd: 780, gain: 0.01, attack: 0.1, decay: 1.1, glide: 1.0, lp: 1800, to: out, pan: p });
          this.tone(at + 0.05, { type: 'square', f: 260, fEnd: 390, gain: 0.006, attack: 0.1, decay: 1.0, glide: 0.9, lp: 1200, to: out, pan: p });
        });
        // A crow's caw.
        every(10, 22, (at) => {
          const p = pan();
          for (let i = 0; i < 2; i++) this.tone(at + i * 0.3, { type: 'sawtooth', f: 620, fEnd: 480, gain: 0.014, attack: 0.02, decay: 0.2, glide: 0.18, lp: 1600, to: out, pan: p });
        });
        // The friendly ghost: a long wobbling "whooo" that slides down.
        every(18, 36, (at) => {
          const p = pan() * 0.6;
          this.tone(at, { f: 620, fEnd: 360, gain: 0.025, attack: 0.4, decay: 1.8, glide: 1.6, lp: 1400, to: out, pan: p });
          this.tone(at, { f: 628, fEnd: 366, gain: 0.015, attack: 0.4, decay: 1.8, glide: 1.6, lp: 1400, to: out, pan: p });
        });
        break;
      }
      case 'funfair': {
        // The crowd chattering, a fairground organ tune drifting over, coaster cars clacking up
        // the lift hill and the screams of fun as they drop.
        bed(this.pink, { type: 'bandpass', f: 700, q: 0.9 }, 0.05, 6, 0.6, 200);
        bed(this.brown, { type: 'lowpass', f: 240, q: 0.7 }, 0.06, 5, 0.4);
        const tune = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1047];
        every(10, 20, (at) => {
          const p = pan() * 0.5;
          tune.forEach((f, i) => {
            this.tone(at + i * 0.24, { type: 'square', f, gain: 0.006, attack: 0.01, decay: 0.2, lp: 1800, to: out, pan: p });
            if (i % 3 === 0) this.tone(at + i * 0.24, { type: 'triangle', f: f / 4, gain: 0.01, attack: 0.01, decay: 0.3, to: out, pan: p });
          });
        });
        every(16, 30, (at) => {
          const p = pan();
          for (let i = 0; i < 14; i++) this.burst(at + i * 0.16, { buf: this.brown, type: 'bandpass', f: 900, q: 3, gain: 0.04, attack: 0.002, decay: 0.05, to: out, pan: p });
          // Then the drop: a few happy screams.
          for (let k = 0; k < 3; k++) {
            const f = 900 + Math.random() * 400;
            this.tone(at + 2.6 + k * 0.15, { type: 'sawtooth', f, fEnd: f * 1.3, gain: 0.006, attack: 0.08, decay: 0.9, glide: 0.6, lp: 2400, to: out, pan: p });
          }
        });
        if (night) every(0.8, 2.5, crickets);
        else every(4, 10, bird);
        break;
      }
      case 'toxic': {
        // Machines humming, steam hissing from the vents, belts clanking, goo bubbling, and a
        // warning klaxon somewhere far off.
        bed(this.brown, { type: 'lowpass', f: 140, q: 1.2 }, 0.1, 4, 0.3);
        every(5, 12, (at) => this.burst(at, { buf: this.pink, type: 'highpass', f: 3000, q: 0.5, gain: 0.05, attack: 0.05, decay: 1.2, to: out, pan: pan() }));
        every(1.5, 4, (at) => {
          const p = pan();
          for (let i = 0; i < 3; i++) this.tone(at + i * 0.22, { f: 300 + Math.random() * 120, gain: 0.012, attack: 0.002, decay: 0.07, to: out, pan: p });
        });
        every(0.7, 2.2, (at) => {
          const f = 120 + Math.random() * 100;
          this.tone(at, { f, fEnd: f * 2.4, gain: 0.04, attack: 0.01, decay: 0.1, glide: 0.09, to: out, pan: pan() });
        });
        every(25, 50, (at) => {
          const p = pan() * 0.6;
          for (let i = 0; i < 3; i++) this.tone(at + i * 0.7, { type: 'square', f: 440, fEnd: 330, gain: 0.006, attack: 0.05, decay: 0.55, glide: 0.5, lp: 1400, to: out, pan: p });
        });
        break;
      }
      case 'sky': {
        // High up in the open air: wind gusting past, birds chirping, wind chimes tinkling and
        // the roar of a hot air balloon's burner now and then.
        bed(this.pink, { type: 'bandpass', f: 600, q: 0.6 }, 0.07, 6, 0.8, 300);
        every(1.5, 4, (at) => {
          const f = 2600 + Math.random() * 1200, p = pan();
          for (let i = 0; i < 3; i++) this.tone(at + i * 0.1, { f, fEnd: f * 1.25, gain: 0.015, attack: 0.005, decay: 0.06, glide: 0.05, to: out, pan: p });
        });
        every(5, 11, (at) => {
          const notes = [1568, 1760, 2093, 2349, 2637], p = pan();
          for (let i = 0; i < 4; i++) this.tone(at + i * 0.17 + Math.random() * 0.1, { type: 'triangle', f: notes[Math.floor(Math.random() * 5)], gain: 0.012, attack: 0.002, decay: 1.2, to: out, pan: p });
        });
        every(20, 40, (at) => this.burst(at, { buf: this.brown, type: 'bandpass', f: 500, q: 0.8, gain: 0.05, attack: 0.1, decay: 1.6, to: out, pan: pan() }));
        break;
      }
      case 'moon': {
        // No air on the moon, so this is the base: a low hum of machinery, radio bleeps and
        // chatter, the hiss of an airlock, and now and then a rocket rumbling far off.
        bed(this.brown, { type: 'lowpass', f: 110, q: 1.5 }, 0.06, 8, 0.3);
        bed(this.pink, { type: 'bandpass', f: 2400, q: 6 }, 0.012, 5, 0.5, 200);
        every(3, 8, (at) => {
          const p = pan(), n = 2 + Math.floor(Math.random() * 4);
          for (let i = 0; i < n; i++) this.tone(at + i * 0.13, { type: 'sine', f: Math.random() < 0.5 ? 1320 : 1760, gain: 0.012, attack: 0.005, decay: 0.08, to: out, pan: p });
        });
        every(8, 16, (at) => {
          const p = pan();
          for (let i = 0; i < 6; i++) this.tone(at + i * 0.09, { type: 'square', f: 300 + Math.random() * 500, gain: 0.004, attack: 0.005, decay: 0.07, lp: 1800, to: out, pan: p });
        });
        every(18, 34, (at) => this.burst(at, { buf: this.pink, type: 'highpass', f: 2200, q: 0.5, gain: 0.04, attack: 0.05, decay: 1.4, to: out, pan: pan() }));
        every(30, 60, (at) => this.burst(at, { buf: this.brown, type: 'lowpass', f: 160, q: 1, gain: 0.07, attack: 2, decay: 4, to: out, pan: pan() * 0.5 }));
        break;
      }
      case 'dino': {
        // A warm humid valley: insects buzzing, odd birds calling, the tar bubbling, a
        // pterodactyl screeching overhead and now and then a big dinosaur bellowing far off.
        bed(this.pink, { type: 'bandpass', f: 4200, q: 2 }, 0.025, 6, 0.6, 400);
        bed(this.brown, { type: 'lowpass', f: 200, q: 0.8 }, 0.05, 9, 0.4);
        every(2, 6, (at) => {
          const f = 700 + Math.random() * 500, p = pan();
          for (let i = 0; i < 2; i++) this.tone(at + i * 0.18, { f, fEnd: f * 1.3, gain: 0.02, attack: 0.01, decay: 0.12, glide: 0.1, to: out, pan: p });
        });
        every(3, 8, (at) => {
          const f = 90 + Math.random() * 60;
          this.tone(at, { f, fEnd: f * 2, gain: 0.03, attack: 0.01, decay: 0.12, glide: 0.1, to: out, pan: pan() });
        });
        every(14, 28, (at) => this.tone(at, { type: 'sawtooth', f: 1800, fEnd: 1100, gain: 0.008, attack: 0.05, decay: 0.7, glide: 0.6, lp: 3200, to: out, pan: pan() }));
        every(20, 40, (at) => {
          const p = pan() * 0.7;
          this.tone(at, { type: 'sawtooth', f: 70, fEnd: 48, gain: 0.03, attack: 0.25, decay: 1.6, glide: 1.4, lp: 420, to: out, pan: p });
          this.burst(at, { buf: this.brown, type: 'lowpass', f: 260, q: 1, gain: 0.05, attack: 0.25, decay: 1.4, to: out, pan: p });
        });
        break;
      }
      case 'mine': {
        // A deep cave: a low rumble, water dripping and echoing, pickaxes chinking far off, a mine
        // cart rattling past somewhere, and the soft ringing hum of the crystals.
        bed(this.brown, { type: 'lowpass', f: 90, q: 1 }, 0.09, 9, 0.3);
        every(0.8, 2.6, (at) => {
          const f = 900 + Math.random() * 900, p = pan();
          this.tone(at, { f, fEnd: f * 1.6, gain: 0.03, attack: 0.002, decay: 0.12, glide: 0.05, to: out, pan: p });
          this.tone(at + 0.18, { f, fEnd: f * 1.6, gain: 0.01, attack: 0.002, decay: 0.12, glide: 0.05, to: out, pan: p });
        });
        every(4, 9, (at) => {
          const p = pan() * 0.7;
          for (let i = 0; i < 3; i++) this.tone(at + i * 0.55, { type: 'triangle', f: 2400 + Math.random() * 300, gain: 0.012, attack: 0.001, decay: 0.25, to: out, pan: p });
        });
        every(20, 40, (at) => this.burst(at, { buf: this.brown, type: 'bandpass', f: 300, q: 1.5, gain: 0.05, attack: 1.2, decay: 2.5, to: out, pan: pan() * 0.8 }));
        every(6, 12, (at) => {
          const f = [523, 659, 784, 988][Math.floor(Math.random() * 4)];
          this.tone(at, { type: 'sine', f, gain: 0.008, attack: 0.6, decay: 2.4, to: out, pan: pan() });
        });
        break;
      }
      case 'candy': {
        // A warm sugary breeze, music-box twinkles, the chocolate river bubbling; soft chimes at night.
        bed(this.pink, { type: 'bandpass', f: 1100, q: 0.7 }, 0.05, 10, 0.7, 300);
        bed(this.brown, { type: 'lowpass', f: 260, q: 0.8 }, 0.06, 7, 0.4);
        const notes = [1047, 1175, 1319, 1568, 1760, 2093];
        const twinkle = (at: number) => {
          const p = pan(), n = 2 + Math.floor(Math.random() * 3);
          let k = Math.floor(Math.random() * notes.length);
          for (let i = 0; i < n; i++) {
            k = Math.max(0, Math.min(notes.length - 1, k + (Math.random() < 0.5 ? -1 : 1)));
            this.tone(at + i * 0.18, { f: notes[k], gain: night ? 0.022 : 0.016, attack: 0.004, decay: 0.7, to: out, pan: p });
            this.tone(at + i * 0.18, { f: notes[k] * 3.01, gain: 0.004, attack: 0.002, decay: 0.25, to: out, pan: p });
          }
        };
        every(night ? 2.5 : 4, night ? 6 : 10, twinkle);
        every(0.8, 2.5, (at) => {
          // A chocolate bubble: a low pop that glides up.
          const f = 140 + Math.random() * 120;
          this.tone(at, { f, fEnd: f * 2.2, gain: 0.04, attack: 0.01, decay: 0.09, glide: 0.08, to: out, pan: pan() });
        });
        if (night) every(0.5, 1.6, crickets);
        else every(2.5, 7, bird);
        break;
      }
      case 'volcano': {
        // Deep rumbling, lava bubbling and popping.
        const big = !!b.eruption;
        bed(this.brown, { type: 'lowpass', f: 90, q: 0.8 }, big ? 0.5 : 0.3, 6, 0.5);
        every(0.3, 1.8, (at) => {
          const f = 90 + Math.random() * 140;
          this.tone(at, { f, fEnd: f * 0.5, gain: 0.07, decay: 0.08, to: out, pan: pan() });
          this.burst(at, { buf: this.crackle, type: 'bandpass', f: 2200, q: 0.8, gain: 0.25, decay: 0.15, to: out, pan: pan() });
        });
        if (big) every(5, 11, (at) => this.burst(at, { buf: this.brown, type: 'lowpass', f: 140, q: 0.7, gain: 0.9, attack: 0.1, decay: 2, to: out }));
        break;
      }
    }
    if (b.mood === 'Stormy night' || b.mood === 'Thunderstorm') every(10, 22, (at) => this.burst(at, { buf: this.brown, type: 'lowpass', f: 160, q: 0.7, gain: 0.6, attack: 0.3, decay: 2.5, to: out }));
    if (b.particles === 'rain') {
      bed(this.pink, { type: 'highpass', f: 1200, q: 0.5 }, 0.06);
      bed(this.crackle, { type: 'bandpass', f: 4000, q: 0.7 }, 0.12);
    }
  }
}
