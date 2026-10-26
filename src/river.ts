import * as THREE from 'three';
import { Track, DX } from './track';
import { Biome } from './biomes';
import { toon } from './toon';

// The kayak's rivers. The track is the water's surface: this draws it as running water,
// white where it breaks (wave crests, steep chutes, holes and the foot of a drop), carries it
// on behind the track to the far bank, and cuts it away at the front so you see down into it.
// The water's texture slides downstream every frame; spray is a small pool of particles.

/** How fast the surface pattern runs downstream, m/s. */
const FLOW = 2.6;
/** Metres of water seen through the cut-away front before the river bed. */
export const WATER_DEPTH = 1.3;

function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/**
 * Ripples on running water: long pale streaks along the flow and little curls, light on a
 * white ground (the vertex colours give the blue and the foam).
 */
function flowTexture(): THREE.CanvasTexture {
  return canvasTexture(256, 256, (c) => {
    c.fillStyle = '#e8eef2';
    c.fillRect(0, 0, 256, 256);
    const r = rng(41);
    // Darker troughs between the ripples.
    for (let i = 0; i < 40; i++) {
      c.fillStyle = `rgba(20,60,90,${0.05 + r() * 0.07})`;
      c.beginPath();
      c.ellipse(r() * 256, r() * 256, 18 + r() * 40, 3 + r() * 6, 0, 0, Math.PI * 2);
      c.fill();
    }
    // Bright streaks of light along the flow, wrapped round the edges so the tile is seamless.
    for (let i = 0; i < 70; i++) {
      const x = r() * 256, y = r() * 256, w = 10 + r() * 36;
      c.strokeStyle = `rgba(255,255,255,${0.35 + r() * 0.5})`;
      c.lineWidth = 1 + r() * 2.2;
      for (const dx of [0, -256, 256]) for (const dy of [0, -256, 256]) {
        c.beginPath();
        c.moveTo(x + dx, y + dy);
        c.quadraticCurveTo(x + dx + w / 2, y + dy - 2 - r() * 3, x + dx + w, y + dy);
        c.stroke();
      }
    }
  });
}

/** White water: bubbly foam with holes in it, for drawing over the broken parts. */
function foamTexture(): THREE.CanvasTexture {
  return canvasTexture(256, 256, (c) => {
    c.clearRect(0, 0, 256, 256);
    const r = rng(77);
    for (let i = 0; i < 260; i++) {
      const x = r() * 256, y = r() * 256, rad = 2 + r() * 9;
      c.fillStyle = `rgba(255,255,255,${0.55 + r() * 0.45})`;
      for (const dx of [0, -256, 256]) for (const dy of [0, -256, 256]) {
        c.beginPath();
        c.arc(x + dx, y + dy, rad, 0, Math.PI * 2);
        c.fill();
      }
    }
    // Little dark bubbles in it.
    for (let i = 0; i < 90; i++) {
      c.fillStyle = 'rgba(120,170,190,0.5)';
      c.beginPath();
      c.arc(r() * 256, r() * 256, 1 + r() * 2.5, 0, Math.PI * 2);
      c.fill();
    }
  });
}

/**
 * How broken the water is at each sample of the track, 0 (smooth) to 1 (all foam): wave crests,
 * steep chutes, the foot of a drop or waterfall, holes and the pillows of water against rocks.
 */
export function foamAlong(tr: Track): Float32Array {
  const n = tr.heights.length;
  const f = new Float32Array(n);
  const h = tr.heights;
  for (let i = 1; i < n - 1; i++) {
    const slope = (h[i + 1] - h[i - 1]) / (2 * DX);
    // Steeper than a gentle run: it breaks up, all white on a waterfall.
    let v = Math.max(0, Math.min(1, (-slope - 0.18) * 2.5));
    // Crests of waves, where the water curls over.
    const x = i * DX;
    const curv = tr.curvature(x);
    v = Math.max(v, Math.min(0.75, Math.max(0, -curv - 0.25) * 0.6));
    f[i] = v;
  }
  // The foot of every drop is a boil of white water for a few metres.
  for (let i = 1; i < n; i++) {
    const fall = h[i - 1] - h[i];
    if (fall < 0.3) continue;
    const len = Math.min(10, 2.5 + fall * 1.6);
    for (let k = 0; k < len / DX && i + k < n; k++) f[i + k] = Math.max(f[i + k], 1 - (k * DX) / len * 0.85);
  }
  for (const hl of tr.holes) {
    const i0 = Math.floor(hl.x0 / DX), i1 = Math.ceil(hl.x1 / DX), m = i1 - i0;
    for (let k = 0; k <= m && i0 + k < n; k++) {
      const u = k / m;
      // A standing wave: smooth green water pours down the face into a white trough, and piles
      // up white on the far side.
      if (hl.wave) {
        // A standing wave: white where it breaks over the crest and boils back down the top of
        // the face, green and glassy lower down, a little froth in the trough, and the tongue
        // pouring in smooth.
        const x = (i0 + k) * DX, { crest, trough } = hl.wave;
        f[i0 + k] = x < crest ? 0.55 + 0.45 * (x - hl.x0) / (crest - hl.x0)
          : x < trough ? Math.max(0.12, 1 - ((x - crest) / (trough - crest)) * 1.6)
          : x < trough + 2.4 ? 0.12 + 0.3 * Math.sin(Math.PI * (x - trough) / 2.4) : 0.06;
        continue;
      }
      // White from the trough up the pile, a sticky one boiling hardest.
      const w = u < 0.25 ? u / 0.25 * 0.5 : u < 0.85 ? 1 : (1 - u) / 0.15;
      f[i0 + k] = Math.max(f[i0 + k], w * (hl.sticky ? 1 : 0.8));
    }
  }
  for (const s of tr.splats) {
    const i0 = Math.floor((s.x - 2) / DX);
    for (let k = 0; k < 2.6 / DX && i0 + k < n; k++) if (i0 + k >= 0) f[i0 + k] = Math.max(f[i0 + k], 0.55 * Math.sin(Math.PI * k * DX / 2.6));
  }
  return f;
}

export class River {
  readonly group = new THREE.Group();
  private flow: THREE.Texture[] = [];
  private foam: THREE.Texture[] = [];
  private splashes: Splashes;
  private time = 0;
  /** Which way the water runs: downstream is +x, except on a standing wave, surfed facing upstream. */
  private dir = 1;
  private wy!: Float32Array;
  private width = 8;
  /** Where the water breaks, throwing spray and shedding foam all the time. */
  private emitters: Emitter[] = [];
  private flecks!: Flecks;
  private mist: Splashes;
  private acc = 0;

  constructor(private track: Track, private biome: Biome) {
    if (track.holes.some((h) => h.wave)) this.dir = -1;
    const rv = biome.river!;
    const tr = track;
    const n = tr.heights.length;
    const foam = foamAlong(tr);
    // The water's surface: the track, except over a drop, where it pours off the lip in a
    // curve instead of a sheer wall, white all the way down.
    const wy = Float32Array.from(tr.heights);
    for (let i = 1; i < n; i++) {
      const fall = tr.heights[i - 1] - tr.heights[i];
      if (fall < 0.3) continue;
      const lipY = tr.heights[i - 1], len = 0.6 + Math.sqrt(fall) * 0.9;
      for (let k = 0; k * DX < len && i + k < n; k++) {
        const u = (k * DX) / len;
        wy[i + k] = Math.max(tr.heights[i + k], lipY - fall * u * u);
        foam[i + k] = 1;
      }
    }
    const water = new THREE.Color(rv.water), white = new THREE.Color(rv.foam), deep = new THREE.Color(rv.deep);
    const z0 = 1.5;
    // The river runs from the cut-away front back to its far bank, a few strips deep.
    const zs = [z0, 0, -z0, -z0 - rv.width * 0.4, -z0 - rv.width - 0.6];
    const rows = zs.length;
    const pos = new Float32Array(n * rows * 3), uv = new Float32Array(n * rows * 2), col = new Float32Array(n * rows * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const x = i * DX, y = wy[i];
      for (let j = 0; j < rows; j++) {
        const k = i * rows + j;
        pos.set([x, y, zs[j]], k * 3);
        uv.set([x / 4, zs[j] / 4], k * 2);
        // Further back the foam spreads out and fades, as the river's broken water would.
        const back = Math.max(0, -zs[j] - z0) / rv.width;
        const wob = 0.12 * Math.sin(x * 0.9 + j * 2.1);
        const fo = Math.max(0, Math.min(1, foam[i] * (1 - back * 0.45) + (foam[i] > 0.1 ? wob : 0)));
        tmp.copy(water).lerp(deep, back * 0.25).lerp(white, fo * 0.85);
        col.set([tmp.r, tmp.g, tmp.b], k * 3);
      }
    }
    const idx: number[] = [];
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < rows - 1; j++) {
      const a = i * rows + j, b = a + 1, c = a + rows, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const flow = flowTexture();
    this.flow.push(flow);
    const surface = new THREE.Mesh(g, toon(0xffffff, { map: flow, vertexColors: true, side: THREE.DoubleSide }));
    this.add(surface);

    // Foam drawn over the broken water, sliding a little faster than the flow below it.
    const fpos = new Float32Array(n * 2 * 3), fuv = new Float32Array(n * 2 * 2), fa = new Float32Array(n * 2 * 4);
    for (let i = 0; i < n; i++) {
      const x = i * DX, y = wy[i] + 0.012;
      fpos.set([x, y, z0, x, y, -z0 - rv.width * 0.4], i * 6);
      fuv.set([x / 3, 0.4, x / 3, -z0 / 3 - rv.width * 0.13], i * 4);
      const a = Math.min(1, foam[i] * 1.3);
      fa.set([1, 1, 1, a, 1, 1, 1, a * 0.5], i * 8);
    }
    const fidx: number[] = [];
    for (let i = 0; i < n - 1; i++) { const a = i * 2; fidx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
    fg.setAttribute('uv', new THREE.BufferAttribute(fuv, 2));
    fg.setAttribute('color', new THREE.BufferAttribute(fa, 4));
    fg.setIndex(fidx);
    const ft = foamTexture();
    this.foam.push(ft);
    const fm = new THREE.MeshBasicMaterial({ map: ft, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const foamMesh = new THREE.Mesh(fg, fm);
    foamMesh.renderOrder = 1;
    this.add(foamMesh);

    // The cut-away front: water, darker as it gets deeper, down to the river bed.
    const wpos = new Float32Array(n * 2 * 3), wcol = new Float32Array(n * 2 * 3);
    const lip = water.clone().lerp(white, 0.25);
    for (let i = 0; i < n; i++) {
      const x = i * DX, y = wy[i];
      const bed = this.bedY(i);
      wpos.set([x, y, z0, x, bed, z0], i * 6);
      const top = lip.clone().lerp(white, foam[i] * 0.6);
      wcol.set([top.r, top.g, top.b, deep.r, deep.g, deep.b], i * 6);
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.BufferAttribute(wpos, 3));
    wg.setAttribute('color', new THREE.BufferAttribute(wcol, 3));
    const widx: number[] = [];
    for (let i = 0; i < n - 1; i++) { const a = i * 2; widx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    wg.setIndex(widx);
    const front = new THREE.Mesh(wg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    this.add(front);
    // A bright line where the surface meets the cut.
    const lpos = new Float32Array(n * 2 * 3);
    for (let i = 0; i < n; i++) {
      const x = i * DX, y = wy[i];
      lpos.set([x, y + 0.01, z0 + 0.004, x, y - 0.05, z0 + 0.004], i * 6);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
    lg.setIndex(widx);
    this.add(new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: white, side: THREE.DoubleSide })));

    this.splashes = new Splashes(white);
    this.group.add(this.splashes.points);
    // Soft clouds of mist rising off the biggest white water.
    this.mist = new Splashes(white, 1.4, -0.6, 0.35);
    this.group.add(this.mist.points);
    this.wy = wy;
    this.width = rv.width;
    this.emitters = emittersAlong(tr, wy);
    this.flecks = new Flecks(white, wy, this.dir, -z0 - rv.width * 0.5);
    this.group.add(this.flecks.points);
  }

  /** The river bed under sample i, seen through the front: deeper under big water and drops. */
  bedY(i: number): number {
    const tr = this.track;
    // The bed follows the water's line, smoothed, so it doesn't copy every wave.
    let lo = Infinity;
    for (let k = -40; k <= 40; k += 8) lo = Math.min(lo, tr.heights[Math.max(0, Math.min(tr.heights.length - 1, i + k))]);
    return lo - WATER_DEPTH;
  }

  private add(m: THREE.Mesh) {
    (m.material as THREE.Material).userData.outlineParameters = { visible: false };
    m.receiveShadow = true;
    this.group.add(m);
  }

  /** Throw up spray at (x, y): `n` drops, flung up to `up` m/s. */
  splash(x: number, y: number, n: number, up = 4, along = 0) {
    this.splashes.throw(x, y, n, up, along);
  }

  update(dt: number, focusX = 0) {
    this.time += dt;
    // White water near the camera: a steady fizz of spray, and foam flecks floating off downstream.
    this.acc += dt;
    if (this.acc >= 1 / 30) {
      const step = this.acc;
      this.acc = 0;
      for (const e of this.emitters) {
        if (Math.abs(e.x - focusX) > 22) continue;
        const n = e.spray * step * this.splashes.share;
        for (let k = Math.floor(n + Math.random()); k > 0; k--) {
          const z = 1.2 - Math.random() * (this.width + 2.4);
          this.splashes.one(e.x + (Math.random() - 0.5) * e.len, this.wy[Math.max(0, Math.round(e.x / DX))] + 0.05, z, e.vx, e.up);
        }
        const m = e.mist * step * this.splashes.share;
        for (let k = Math.floor(m + Math.random()); k > 0; k--) {
          this.mist.one(e.x + (Math.random() - 0.5) * e.len, this.wy[Math.max(0, Math.round(e.x / DX))] + 0.2, 1 - Math.random() * (this.width + 1.5), e.vx * 0.3, 0.5, 1.2 + Math.random());
        }
        const f = e.foam * step * this.splashes.share;
        for (let k = Math.floor(f + Math.random()); k > 0; k--) this.flecks.spawn(e.x + (Math.random() - 0.5) * e.len, 1.2 - Math.random() * (this.width + 2.4));
      }
    }
    this.flecks.update(dt);
    this.mist.update(dt);
    for (const t of this.flow) t.offset.x = -(this.time * FLOW * this.dir) / 4;
    for (const t of this.foam) { t.offset.x = -(this.time * FLOW * 1.25 * this.dir) / 3; t.offset.y = Math.sin(this.time * 1.7) * 0.02; }
    this.splashes.update(dt);
  }

  setParticles(share: number) { this.splashes.share = share; this.flecks.share = share; }
}

/** A pool of spray drops: flung up, falling back, fading out. */
class Splashes {
  readonly points: THREE.Points;
  private pos: Float32Array;
  private vel: Float32Array;
  private life: Float32Array;
  private next = 0;
  /** Share of drops to throw, from the quality setting. */
  share = 1;
  private static readonly N = 1400;

  constructor(color: THREE.Color, size = 0.24, private gravity = 14, opacity = 1) {
    const N = Splashes.N;
    this.pos = new Float32Array(N * 3).fill(-9999);
    this.vel = new Float32Array(N * 3);
    this.life = new Float32Array(N);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const tex = canvasTexture(32, 32, (c) => {
      const gr = c.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.5, 'rgba(255,255,255,0.8)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gr;
      c.fillRect(0, 0, 32, 32);
    });
    const m = new THREE.PointsMaterial({ color, size, map: tex, transparent: true, depthWrite: false, sizeAttenuation: true, opacity });
    m.userData.outlineParameters = { visible: false };
    this.points = new THREE.Points(g, m);
    this.points.frustumCulled = false;
    this.points.renderOrder = 2;
  }

  throw(x: number, y: number, n: number, up: number, along: number) {
    const N = Splashes.N;
    const count = Math.round(n * this.share);
    for (let k = 0; k < count; k++) {
      const i = this.next;
      this.next = (this.next + 1) % N;
      this.pos.set([x + (Math.random() - 0.5) * 0.8, y + 0.05, (Math.random() - 0.5) * 1.4], i * 3);
      this.vel.set([along + (Math.random() - 0.5) * 3, up * (0.5 + Math.random() * 0.7), (Math.random() - 0.5) * 2.5], i * 3);
      this.life[i] = 0.5 + Math.random() * 0.5;
    }
  }

  /** One drop at (x, y, z), flung along at about `vx` and up at about `up`. */
  one(x: number, y: number, z: number, vx: number, up: number, life = 0.35 + Math.random() * 0.45) {
    const i = this.next;
    this.next = (this.next + 1) % Splashes.N;
    this.pos.set([x, y, z], i * 3);
    this.vel.set([vx + (Math.random() - 0.5) * 1.5, up * (0.4 + Math.random() * 0.8), (Math.random() - 0.5) * 1.2], i * 3);
    this.life[i] = life;
  }

  update(dt: number) {
    const N = Splashes.N;
    for (let i = 0; i < N; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -9999; continue; }
      this.vel[i * 3 + 1] -= this.gravity * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
    }
    (this.points.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }
}

/** A spot where the water breaks: how much spray and foam it sheds each second, and how. */
interface Emitter { x: number; len: number; spray: number; foam: number; mist: number; up: number; vx: number }

/** Every spot along a river where the water breaks: drops, holes, waves, rocks and wave crests. */
function emittersAlong(tr: Track, wy: Float32Array): Emitter[] {
  const out: Emitter[] = [];
  const n = wy.length;
  // The foot of each drop: a curtain of spray and lots of foam.
  for (let i = 1; i < n; i++) {
    const fall = tr.heights[i - 1] - tr.heights[i];
    if (fall < 0.3) continue;
    const foot = i * DX + 0.6 + Math.sqrt(fall) * 0.9;
    out.push({ x: foot, len: 1.6, spray: 120 + fall * 80, foam: 40 + fall * 20, mist: 3 + fall * 3, up: 3 + fall * 1.5, vx: -0.5 });
  }
  // Holes boil, the water folding back upstream; sticky ones hardest.
  for (const h of tr.holes) {
    if (h.wave) {
      // A standing wave breaks over its crest and tumbles back down the face (upstream, +x).
      out.push({ x: h.wave.crest + 0.4, len: 1.2, spray: 110, foam: 12, mist: 3, up: 2.6, vx: 1.6 });
      out.push({ x: h.wave.crest - 2, len: 2.5, spray: 0, foam: 30, mist: 0, up: 0, vx: 0 });
      continue;
    }
    const mid = h.x0 + (h.x1 - h.x0) * 0.4;
    out.push({ x: mid, len: (h.x1 - h.x0) * 0.5, spray: h.sticky ? 140 : 90, foam: h.sticky ? 40 : 28, mist: h.sticky ? 3 : 1.5, up: 2.6, vx: -1.2 });
  }
  // The pillow of water piling up against each rock.
  for (const r of tr.splats) out.push({ x: r.x - 0.4, len: 0.8, spray: 40, foam: 10, mist: 0, up: 2.8, vx: -0.6 });
  // Breaking crests of waves in the wave trains.
  for (let i = 2; i < n - 2; i += 2) {
    const x = i * DX;
    if (tr.holeAt(x)) continue;
    const c = -tr.curvature(x);
    if (c > 0.35 && wy[i] >= wy[i - 2] && wy[i] >= wy[i + 2]) out.push({ x, len: 1, spray: 20 * Math.min(2, c), foam: 6, mist: 0, up: 1.8, vx: 0.5 });
  }
  return out;
}

/** Flecks of foam floating on the water, carried along with it and slowly fading. */
class Flecks {
  readonly points: THREE.Points;
  private pos: Float32Array;
  private life: Float32Array;
  private speed: Float32Array;
  private next = 0;
  share = 1;
  private static readonly N = 1200;

  constructor(color: THREE.Color, private wy: Float32Array, private dir: number, _mid: number) {
    const N = Flecks.N;
    this.pos = new Float32Array(N * 3).fill(-9999);
    this.life = new Float32Array(N);
    this.speed = new Float32Array(N);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const tex = canvasTexture(32, 32, (c) => {
      // A squashed blob of bubbles, wider than tall, like foam seen low across the water.
      c.fillStyle = 'rgba(255,255,255,0.95)';
      for (const [x, y, r] of [[16, 18, 7], [9, 19, 5], [23, 19, 5], [13, 15, 4], [20, 15, 4]]) { c.beginPath(); c.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2); c.fill(); }
    });
    const m = new THREE.PointsMaterial({ color, size: 0.6, map: tex, transparent: true, depthWrite: false, sizeAttenuation: true, opacity: 0.9 });
    m.userData.outlineParameters = { visible: false };
    this.points = new THREE.Points(g, m);
    this.points.frustumCulled = false;
    this.points.renderOrder = 2;
  }

  spawn(x: number, z: number) {
    const i = this.next;
    this.next = (this.next + 1) % Flecks.N;
    this.pos.set([x, this.at(x) + 0.03, z], i * 3);
    this.life[i] = 2.5 + Math.random() * 2.5;
    this.speed[i] = FLOW * (0.8 + Math.random() * 0.5) * this.dir;
  }

  private at(x: number) {
    const i = Math.max(0, Math.min(this.wy.length - 1, Math.round(x / DX)));
    return this.wy[i];
  }

  update(dt: number) {
    const N = Flecks.N;
    for (let i = 0; i < N; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -9999; continue; }
      const x = this.pos[i * 3] + this.speed[i] * dt;
      this.pos[i * 3] = x;
      this.pos[i * 3 + 1] = this.at(x) + 0.03;
    }
    (this.points.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }
}
