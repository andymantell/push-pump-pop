import * as THREE from 'three';
import { addLighting, Lamp, setRim } from './lighting';
import { Track, DX, LOOP_SHIFT } from './track';
import { Biome, Particles, Surface } from './biomes';
import { toon } from './toon';
import { LANDMARKS, TRACK_LANDMARKS } from './landmarks';

export const TRACK_W = 3;

type Models = Partial<Record<string, THREE.Object3D>>;

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
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function speckle(c: CanvasRenderingContext2D, n: number, dark = 0.05, light = 0.06) {
  const r = rng(7);
  for (let i = 0; i < n; i++) {
    c.fillStyle = r() > 0.5 ? `rgba(0,0,0,${dark})` : `rgba(255,255,255,${light})`;
    c.fillRect(r() * 256, r() * 256, 2 + r() * 3, 2 + r() * 3);
  }
}

/** Procedural texture for a track surface; one tile covers 3 m (top) or 4 m (front). */
function surfaceTexture(s: Surface): THREE.CanvasTexture {
  return canvasTexture(256, 256, (c) => {
    c.fillStyle = s.base;
    c.fillRect(0, 0, 256, 256);
    const r = rng(11);
    switch (s.kind) {
      case 'concrete':
        speckle(c, 900);
        c.fillStyle = s.seam;
        c.fillRect(0, 0, 4, 256);
        break;
      case 'tar':
        speckle(c, 1400, 0.08, 0.04);
        c.fillStyle = s.seam;
        for (let i = 0; i < 3; i++) c.fillRect(r() * 256, 0, 2, 256);
        break;
      case 'planks':
        for (let i = 0; i < 12; i++) {
          c.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.08})`;
          c.fillRect(i * 21.33, 0, 21.33, 256);
          c.fillStyle = s.seam;
          c.fillRect(i * 21.33, 0, 3, 256);
          c.fillStyle = 'rgba(0,0,0,0.35)';
          c.fillRect(i * 21.33 + 8, 20, 3, 3);
          c.fillRect(i * 21.33 + 8, 232, 3, 3);
        }
        break;
      case 'snow':
        speckle(c, 500, 0.03, 0.1);
        c.fillStyle = s.seam;
        for (let i = 0; i < 6; i++) c.fillRect(0, r() * 256, 256, 2);
        break;
      case 'ice':
        speckle(c, 300, 0.04, 0.1);
        for (let i = 0; i < 10; i++) {
          c.strokeStyle = i % 2 ? s.seam : 'rgba(255,255,255,0.35)';
          c.lineWidth = 2 + r() * 4;
          c.beginPath();
          const y = r() * 256;
          c.moveTo(0, y);
          for (let x = 0; x <= 256; x += 32) c.lineTo(x, y + (r() - 0.5) * 20);
          c.stroke();
        }
        break;
      case 'strata':
        for (let y = 0; y < 256; y += 16 + Math.floor(r() * 16)) {
          c.fillStyle = r() > 0.5 ? s.seam : s.accent ?? s.seam;
          c.fillRect(0, y, 256, 4 + r() * 10);
        }
        speckle(c, 600);
        break;
      case 'stone': {
        const bw = 64, bh = 32;
        for (let row = 0; row < 8; row++) {
          for (let col = -1; col < 5; col++) {
            const x = col * bw + (row % 2) * (bw / 2);
            c.fillStyle = `rgba(0,0,0,${r() * 0.12})`;
            c.fillRect(x, row * bh, bw, bh);
            c.strokeStyle = s.seam;
            c.lineWidth = 3;
            c.strokeRect(x, row * bh, bw, bh);
          }
        }
        if (s.accent) {
          c.fillStyle = s.accent;
          for (let i = 0; i < 6; i++) c.fillRect(r() * 256, r() * 256, 10 + r() * 20, 6 + r() * 10);
        }
        break;
      }
      case 'basalt':
        speckle(c, 1200, 0.1, 0.04);
        c.strokeStyle = s.accent ?? s.seam;
        c.lineWidth = s.accent ? 3 : 2;
        for (let i = 0; i < 7; i++) {
          c.beginPath();
          let x = r() * 256, y = r() * 256;
          c.moveTo(x, y);
          for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 60; y += (r() - 0.3) * 50; c.lineTo(x, y); }
          c.stroke();
        }
        c.fillStyle = s.seam;
        c.fillRect(0, 0, 3, 256);
        break;
      case 'dirt': {
        // Packed earth lane: two wheel ruts along it, pebbles and tufts of grass at the edges.
        speckle(c, 1400, 0.07, 0.05);
        for (const v of [0.3, 0.7]) {
          c.fillStyle = s.seam;
          c.globalAlpha = 0.45;
          c.fillRect(0, v * 256 - 14, 256, 28);
          c.globalAlpha = 0.25;
          c.fillRect(0, v * 256 - 20, 256, 40);
          c.globalAlpha = 1;
        }
        for (let i = 0; i < 40; i++) {
          c.fillStyle = r() > 0.5 ? s.accent ?? s.base : '#8a8478';
          c.beginPath();
          c.ellipse(r() * 256, r() * 256, 2 + r() * 3, 1.5 + r() * 2, 0, 0, Math.PI * 2);
          c.fill();
        }
        c.fillStyle = 'rgba(90,150,60,0.8)';
        for (let i = 0; i < 70; i++) {
          const y = r() > 0.5 ? r() * 18 : 256 - r() * 18;
          c.fillRect(r() * 256, y, 2, 4 + r() * 6);
        }
        break;
      }
      case 'soil': {
        // Layers of earth with stones and roots.
        for (let y = 0; y < 256; y += 20 + Math.floor(r() * 22)) {
          c.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.12})`;
          c.fillRect(0, y, 256, 8 + r() * 14);
        }
        speckle(c, 900, 0.08, 0.04);
        for (let i = 0; i < 22; i++) {
          c.fillStyle = s.accent ?? '#9a9488';
          c.strokeStyle = 'rgba(0,0,0,0.35)';
          c.lineWidth = 2;
          c.beginPath();
          c.ellipse(r() * 256, r() * 256, 5 + r() * 9, 4 + r() * 6, r() * 3, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }
        c.strokeStyle = s.seam;
        c.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          c.beginPath();
          let x = r() * 256, y = r() * 256;
          c.moveTo(x, y);
          for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 30; y += 8 + r() * 12; c.lineTo(x, y); }
          c.stroke();
        }
        break;
      }
      case 'biscuit': {
        // A crunchy biscuit: docking holes in rows, a sugar sparkle, a darker baked edge.
        speckle(c, 700, 0.05, 0.06);
        for (let y = 32; y < 256; y += 64) for (let x = 32; x < 256; x += 64) {
          c.fillStyle = s.seam;
          c.beginPath(); c.arc(x + (y % 128 ? 32 : 0), y, 6, 0, Math.PI * 2); c.fill();
        }
        c.fillStyle = s.accent ?? '#fff';
        for (let i = 0; i < 90; i++) c.fillRect(r() * 256, r() * 256, 2, 2);
        c.fillStyle = 'rgba(150,90,30,0.35)';
        c.fillRect(0, 0, 256, 10);
        c.fillRect(0, 246, 256, 10);
        break;
      }
      case 'cake': {
        // Layer cake: sponge, cream and jam stripes, with crumbs.
        for (let y = 0; y < 256; y += 64) {
          c.fillStyle = s.accent ?? '#fff';
          c.fillRect(0, y + 40, 256, 10);
          c.fillStyle = s.seam;
          c.fillRect(0, y + 50, 256, 8);
        }
        speckle(c, 800, 0.06, 0.05);
        c.fillStyle = 'rgba(200,140,70,0.5)';
        for (let i = 0; i < 70; i++) { c.beginPath(); c.arc(r() * 256, r() * 256, 1.5 + r() * 2, 0, Math.PI * 2); c.fill(); }
        break;
      }
      case 'windows': {
        c.fillStyle = s.seam;
        for (let y = 0; y < 256; y += 64) c.fillRect(0, y, 256, 6);
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 4; col++) {
            const lit = r() > 0.55;
            c.fillStyle = lit ? s.accent ?? '#ffd27a' : '#2c2638';
            c.fillRect(col * 64 + 14, row * 64 + 18, 36, 34);
            c.fillStyle = 'rgba(0,0,0,0.3)';
            c.fillRect(col * 64 + 31, row * 64 + 18, 2, 34);
          }
        }
        break;
      }
    }
  });
}

/** A butte: stacked rock bands sharing one ragged outline, with a flat top. */
function mesaShape(x: number, y: number, z: number, rad: number, h: number, r: () => number, bands: THREE.Material[], top: THREE.Material) {
  const g = new THREE.Group();
  const SEG = 11;
  const wob = Array.from({ length: SEG }, () => 0.8 + r() * 0.35);
  const n = 3 + Math.floor(r() * 3);
  let yy = 0;
  for (let i = 0; i < n; i++) {
    const lh = (h / n) * (0.7 + r() * 0.6);
    const r0 = rad * (1.25 - (i / n) * 0.35), r1 = rad * (1.25 - ((i + 1) / n) * 0.35);
    const geo = new THREE.CylinderGeometry(r1, r0, lh, SEG, 1, i < n - 1);
    const p = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let k = 0; k < p.count; k++) {
      const ang = Math.atan2(p.getZ(k), p.getX(k));
      const w = wob[Math.round(((ang + Math.PI) / (Math.PI * 2)) * SEG) % SEG];
      p.setX(k, p.getX(k) * w);
      p.setZ(k, p.getZ(k) * w * 0.7);
    }
    geo.computeVertexNormals();
    const mats = i < n - 1 ? bands[i % bands.length] : [bands[i % bands.length], top, top];
    const m = new THREE.Mesh(geo, mats);
    m.position.y = yy + lh / 2;
    g.add(m);
    yy += lh;
  }
  g.position.set(x, y, z);
  return g;
}

interface ParticleLook {
  n: number;
  color: number;
  size: number;
  vx: number;
  vy: number;
  opacity?: number;
  sway?: number;
  swaySpeed?: number;
  /** Drift about in all directions (fireflies). */
  wander?: number;
  blink?: boolean;
  /** Each particle picks one of these colours (sprinkles). */
  colors?: number[];
}

const PARTICLES: Record<Particles, ParticleLook> = {
  snow: { n: 700, color: 0xffffff, size: 0.12, vx: 0, vy: -1.2 },
  heavysnow: { n: 1800, color: 0xffffff, size: 0.14, vx: -2.5, vy: -2.4, sway: 0.6 },
  embers: { n: 700, color: 0xff8a3a, size: 0.09, vx: 0, vy: 1.5 },
  ash: { n: 1000, color: 0x9a928c, size: 0.1, vx: 0.6, vy: -0.7, sway: 0.5, opacity: 0.8 },
  rain: { n: 1400, color: 0xdde8f8, size: 0, vx: -3, vy: -16, sway: 0, opacity: 0.7 },
  petals: { n: 260, color: 0xf8b8d0, size: 0.13, vx: 0.8, vy: -0.8, sway: 1.4, swaySpeed: 2 },
  leaves: { n: 260, color: 0xe07a24, size: 0.16, vx: 1.0, vy: -1.0, sway: 1.6, swaySpeed: 1.6 },
  dust: { n: 1300, color: 0xe0c090, size: 0.08, vx: 7, vy: -0.3, sway: 0.4, opacity: 0.7 },
  sprinkles: { n: 500, color: 0xffffff, size: 0.12, vx: 0.3, vy: -1.4, sway: 0.6, colors: [0xff5a9a, 0x5ad0ff, 0xffe04a, 0x7aea6a, 0xb07aff] },
  fireflies: { n: 220, color: 0xfff27a, size: 0.22, vx: 0, vy: 0, sway: 0, wander: 0.8, blink: true },
};

let lava: THREE.CanvasTexture | null = null;
/** Lava glowing yellow at the top and cooling to dark red further down, with a few crusts. */
function lavaTexture(): THREE.CanvasTexture {
  if (lava) return lava;
  lava = canvasTexture(64, 256, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#ffd040');
    g.addColorStop(0.12, '#ff7a1a');
    g.addColorStop(0.5, '#d8400e');
    g.addColorStop(1, '#5a1408');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 256);
    const r = rng(9);
    for (let i = 0; i < 14; i++) {
      c.fillStyle = `rgba(60,16,8,${0.25 + r() * 0.3})`;
      c.fillRect(r() * 64, 40 + r() * 200, 6 + r() * 14, 3 + r() * 4);
    }
  });
  lava.wrapT = THREE.ClampToEdgeWrapping;
  return lava;
}

let halo: THREE.SpriteMaterial | null = null;
/** A soft glow around a lit lamp. */
function haloMaterial(): THREE.SpriteMaterial {
  if (halo) return halo;
  const tex = canvasTexture(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,240,180,0.9)');
    g.addColorStop(0.3, 'rgba(255,220,140,0.35)');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  halo = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  halo.userData.outlineParameters = { visible: false };
  return halo;
}

let blob: THREE.MeshBasicMaterial | null = null;
/** A soft round shadow, darkest in the middle. */
function blobMaterial(): THREE.MeshBasicMaterial {
  if (blob) return blob;
  const tex = canvasTexture(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(20,16,30,0.3)');
    g.addColorStop(0.55, 'rgba(20,16,30,0.15)');
    g.addColorStop(1, 'rgba(20,16,30,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  blob = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  blob.userData.outlineParameters = { visible: false };
  return blob;
}

/** Cast and catch the sun's shadow (sprites and glowing bits stay out of it). */
function group3(...parts: THREE.Object3D[]) {
  const g = new THREE.Group();
  g.add(...parts);
  return g;
}

function shadows(o: THREE.Object3D): THREE.Object3D {
  o.traverse((c) => {
    const mesh = c as THREE.Mesh;
    if (!mesh.isMesh || (mesh.material as THREE.Material).type === 'MeshBasicMaterial') return;
    mesh.castShadow = mesh.receiveShadow = true;
  });
  return o;
}

export class World {
  readonly group = new THREE.Group();
  /** Lights that pool on the ground: lamps at night, and lava. */
  readonly lamps: Lamp[] = [];
  private groundCache: Float32Array;
  private particles: THREE.Points | THREE.LineSegments | null = null;
  private particleKind: ParticleLook | null = null;
  private particleStride = 1;
  private clouds = new THREE.Group();
  /** Things on the sky (stars, aurora) that barely move as the camera goes by. */
  private sky = new THREE.Group();
  private rand: () => number;

  constructor(private track: Track, readonly biome: Biome, private models: Models, seed: string) {
    this.rand = rng(hashString(seed));
    this.groundCache = new Float32Array(Math.ceil(track.length) + 2);
    for (let i = 0; i < this.groundCache.length; i++) {
      this.groundCache[i] = Math.min(this.smoothed(i, 5), track.surface(i)) - 0.25;
    }
    this.lightUp();
    this.buildTrack();
    this.buildMud();
    this.buildBouncers();
    this.buildPitFills();
    this.buildStairs();
    this.buildRails();
    this.buildLoops();
    this.buildGround();
    this.buildFar();
    this.placeLandmarks(seed);
    this.buildProps();
    this.buildSigns();
    this.buildFinish();
    this.buildSky();
  }

  /** Lava always glows; lamps and windows only when the mood turns them on. The models'
   * materials are shared by every track, so this is set afresh for each one. */
  private lightUp() {
    const on = !!this.biome.lights;
    for (const m of Object.values(this.models)) {
      m?.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        for (const mat of ([] as THREE.Material[]).concat(mesh.material)) {
          const t = mat as THREE.MeshToonMaterial;
          if (!t.emissive) continue;
          if (t.name === 'lava' || t.name === 'ember') t.emissive.copy(t.color).multiplyScalar(0.8);
          else if (t.name === 'lamp_light' || t.name === 'window_glow') t.emissive.copy(t.color).multiplyScalar(on ? 1 : 0);
        }
      });
    }
  }

  private tinted = new Map<THREE.Material, THREE.Material>();

  /** Blossom or autumn leaves on the park trees. */
  private tintLeaves(o: THREE.Object3D, tint: number) {
    o.traverse((c) => {
      const mesh = c as THREE.Mesh;
      if (!mesh.isMesh || Array.isArray(mesh.material) || !mesh.material.name.startsWith('leaf')) return;
      let t = this.tinted.get(mesh.material);
      if (!t) {
        const m = addLighting((mesh.material as THREE.MeshToonMaterial).clone());
        m.color.lerp(new THREE.Color(tint), 0.7);
        this.tinted.set(mesh.material, m);
        t = m;
      }
      mesh.material = t;
    });
  }

  private smoothed(x: number, win: number): number {
    let s = 0, n = 0;
    for (let d = -win; d <= win; d += win / 6) { s += this.track.surface(x + d); n++; }
    return s / n;
  }

  /** Apply sky, fog and light colours for this biome. */
  applyEnvironment(scene: THREE.Scene, hemi: THREE.HemisphereLight, sun: THREE.DirectionalLight) {
    const b = this.biome;
    const cv = document.createElement('canvas');
    cv.width = 2; cv.height = 256;
    const c = cv.getContext('2d')!;
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, b.sky[0]);
    g.addColorStop(0.6, b.sky[1]);
    g.addColorStop(1, b.sky[2]);
    c.fillStyle = g;
    c.fillRect(0, 0, 2, 256);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    scene.background = t;
    scene.fog = new THREE.Fog(b.fog[0], b.fog[1], b.fog[2]);
    hemi.color.setHex(b.hemi[0]);
    hemi.groundColor.setHex(b.hemi[1]);
    // Less flat fill and a bit more sun, so the toon bands show which way things face.
    hemi.intensity = b.hemi[2] * 0.8;
    sun.color.setHex(b.sun[0]);
    sun.intensity = b.sun[1] * 1.1;
    // Rim light takes the colour of the sky at the horizon (moonlight blue at night).
    const rim = new THREE.Color(b.sky[2]).lerp(new THREE.Color(b.sun[0]), 0.5);
    setRim(rim, b.stars ? 0.5 : 0.32);
    document.body.style.background = b.sky[1];
  }

  /** Height of the background ground at (x, z), z < 0 is behind the track. */
  groundY(x: number, z: number): number {
    const f = Math.max(0, Math.min(this.groundCache.length - 1.001, x));
    const i = Math.floor(f), t = f - i;
    const near = this.groundCache[i] * (1 - t) + this.groundCache[i + 1] * t;
    const back = -z - TRACK_W / 2;
    const depth = Math.min(1, Math.max(0, back / 40));
    switch (this.biome.groundShape) {
      case 'hills': {
        const hills = 2.5 * Math.sin(x * 0.045) + 1.5 * Math.sin(x * 0.11 + 1.3) + 4;
        return near + (hills - 1) * depth * depth;
      }
      case 'mountain': {
        const hills = 2.5 * Math.sin(x * 0.03) + 1.5 * Math.sin(x * 0.09 + 1.3) + 6;
        return near + hills * depth * depth;
      }
      case 'flat':
        return near + (0.8 * Math.sin(x * 0.07) + 0.6) * depth;
      case 'shore':
        // Dunes near the track, then sand sloping down to the sea.
        return near + 0.6 * Math.sin(x * 0.2) * Math.min(1, back / 4) - Math.max(0, back - 8) * 0.35;
      case 'roof':
        return back < 11 ? near : near - 40;
    }
  }

  private buildTrack() {
    const tr = this.track;
    const n = tr.heights.length;
    const base = tr.minY - 25;
    const z0 = TRACK_W / 2;

    const top = new Float32Array(n * 2 * 3), topUv = new Float32Array(n * 2 * 2);
    const front = new Float32Array(n * 2 * 3), frontUv = new Float32Array(n * 2 * 2);
    const band = new Float32Array(n * 2 * 3);
    const edge = new Float32Array(n * 2 * 3);
    for (let i = 0; i < n; i++) {
      const x = i * DX, y = tr.heights[i];
      top.set([x, y, z0, x, y, -z0], i * 6);
      topUv.set([x / 3, 0, x / 3, 1], i * 4);
      front.set([x, y - 0.12, z0, x, base, z0], i * 6);
      frontUv.set([x / 4, (y - 0.12) / 4, x / 4, base / 4], i * 4);
      band.set([x, y + 0.001, z0 + 0.005, x, y - 0.12, z0 + 0.005], i * 6);
      edge.set([x, y + 0.002, z0 + 0.01, x, y - 0.025, z0 + 0.01], i * 6);
    }
    const idx: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, c, b, b, c, d);
    }
    const flipped = idx.map((_, i) => idx[i - (i % 3) + [0, 2, 1][i % 3]]);
    const mk = (pos: Float32Array, uv: Float32Array | null, faceFront = true) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      if (uv) g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      g.setIndex(faceFront ? flipped : idx);
      g.computeVertexNormals();
      return g;
    };
    this.topMat = toon(0xffffff, { map: surfaceTexture(this.biome.top) });
    this.frontMat = toon(0xffffff, { map: surfaceTexture(this.biome.front) });
    const meshes = [
      new THREE.Mesh(mk(top, topUv, false), this.topMat),
      new THREE.Mesh(mk(front, frontUv), this.frontMat),
      new THREE.Mesh(mk(band, null), toon(this.biome.band)),
      new THREE.Mesh(mk(edge, null), new THREE.MeshBasicMaterial({ color: 0x2b2420 })),
    ];
    // The track is one long strip: keep it out of the outline pass to avoid noisy lines.
    for (const m of meshes) {
      (m.material as THREE.Material).userData.outlineParameters = { visible: false };
      m.receiveShadow = true;
      this.group.add(m);
    }
  }

  private topMat!: THREE.Material;
  private frontMat!: THREE.Material;

  /** Wet mud lying on the track: wobbly edges, rounded ends, puddles that catch the light. */
  private buildMud() {
    const tr = this.track;
    if (!tr.mud.length) return;
    const tex = canvasTexture(256, 128, (c) => {
      c.fillStyle = '#5c3d22';
      c.fillRect(0, 0, 256, 128);
      const r = rng(23);
      for (let i = 0; i < 60; i++) {
        c.fillStyle = r() > 0.5 ? 'rgba(40,24,10,0.35)' : 'rgba(140,100,60,0.3)';
        c.beginPath();
        c.ellipse(r() * 256, r() * 128, 6 + r() * 18, 3 + r() * 8, 0, 0, Math.PI * 2);
        c.fill();
      }
      // Puddles with a bright rim on one side, like they're reflecting the sky.
      for (let i = 0; i < 5; i++) {
        const x = r() * 256, y = 20 + r() * 88, w = 14 + r() * 20, h = 6 + r() * 8;
        c.fillStyle = '#7a5a3c';
        c.beginPath(); c.ellipse(x, y, w, h, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(255,240,210,0.7)';
        c.lineWidth = 2.5;
        c.beginPath(); c.ellipse(x, y, w * 0.8, h * 0.6, 0, Math.PI * 1.1, Math.PI * 1.7); c.stroke();
      }
      for (let i = 0; i < 40; i++) {
        c.fillStyle = 'rgba(255,245,220,0.55)';
        c.fillRect(r() * 256, r() * 128, 2, 2);
      }
    });
    const mat = toon(0xffffff, { map: tex });
    mat.userData.outlineParameters = { visible: false };
    const half = TRACK_W / 2;
    for (const m of tr.mud) {
      const x0 = m.x0 - 0.4, x1 = m.x1 + 0.4;
      const n = Math.max(2, Math.ceil((x1 - x0) / 0.1));
      const pos = new Float32Array((n + 1) * 2 * 3), uv = new Float32Array((n + 1) * 2 * 2);
      const seed = m.x0 * 1.7;
      for (let i = 0; i <= n; i++) {
        const x = x0 + (x1 - x0) * i / n;
        // Round the ends off and let the edges wander.
        const end = Math.min(1, (x - x0) / 1.2, (x1 - x) / 1.2);
        const cap = Math.sqrt(Math.max(0, end * (2 - end)));
        const wob = 0.12 * Math.sin(x * 2.3 + seed) + 0.08 * Math.sin(x * 5.1 + seed * 2);
        const front = (half - 0.08 + wob) * cap, back = -(half - 0.25 - wob) * cap;
        const y = tr.height(x) + 0.025;
        pos.set([x, y, front, x, y, back], i * 6);
        uv.set([x / 3, 0, x / 3, 1], i * 4);
      }
      const idx: number[] = [];
      for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      const mesh = new THREE.Mesh(g, mat);
      mesh.receiveShadow = true;
      this.group.add(mesh);
      // Splats of mud dripping down the front face.
      for (let x = m.x0 + 0.5; x < m.x1; x += 1.2 + this.rand() * 1.8) {
        const h = 0.15 + this.rand() * 0.35;
        const drip = new THREE.Mesh(new THREE.CapsuleGeometry(0.09 + this.rand() * 0.08, h, 3, 8), mat);
        drip.position.set(x, tr.height(x) - h / 2 - 0.05, half + 0.02);
        drip.scale.z = 0.25;
        this.group.add(drip);
      }
    }
    // Clods thrown up by the wheels.
    const N = 160;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3).fill(-999), 3));
    this.splat = { pts: new THREE.Points(g, new THREE.PointsMaterial({ color: 0x5c3d22, size: 0.11 })), vel: new Float32Array(N * 3), life: new Float32Array(N), next: 0, carry: 0 };
    this.group.add(this.splat.pts);
  }
  private splat: { pts: THREE.Points; vel: Float32Array; life: Float32Array; next: number; carry: number } | null = null;

  /** Jelly pads: wobbly translucent blocks that squash when you bounce. */
  private jellies: { mesh: THREE.Object3D; x0: number; x1: number; t: number }[] = [];
  private buildBouncers() {
    const colors = [0xff4a8a, 0x4ad86a, 0xffa020, 0x8a5aff];
    this.track.bouncers.forEach((pad, i) => {
      const len = pad.x1 - pad.x0, y = this.track.height(pad.x0);
      const c = colors[i % colors.length];
      // A jelly block set into the path: its top bulges just above the ground and its
      // front shows down the side of the track like a slab of jelly.
      const H = 0.6;
      const body = new THREE.Mesh(new THREE.BoxGeometry(len, H, TRACK_W - 0.3, 8, 3, 4), toon(c, { transparent: true, opacity: 0.85 }));
      // Round the top edges off like a jelly sweet.
      const p = body.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let k = 0; k < p.count; k++) {
        if (p.getY(k) <= 0) continue;
        const ex = Math.abs(p.getX(k)) / (len / 2), ez = Math.abs(p.getZ(k)) / ((TRACK_W - 0.3) / 2);
        p.setY(k, p.getY(k) + 0.06 * (1 - ex * ex) - 0.1 * ez * ez);
      }
      body.geometry.computeVertexNormals();
      body.position.y = 0.12 - H / 2;
      const shine = new THREE.Mesh(new THREE.BoxGeometry(len * 0.6, 0.02, 0.18), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
      shine.position.set(-len * 0.1, 0.19, 0.5);
      shine.userData.outlineParameters = { visible: false };
      // A highlight down the front face, and a dusting of sugar on top.
      const gloss = new THREE.Mesh(new THREE.PlaneGeometry(len * 0.7, 0.08), shine.material);
      gloss.position.set(0, 0.0, (TRACK_W - 0.3) / 2 + 0.01);
      const sugar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.05), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      sugar.userData.outlineParameters = { visible: false };
      const grains = new THREE.InstancedMesh(sugar.geometry, sugar.material, 40);
      const m4 = new THREE.Matrix4();
      for (let k = 0; k < 40; k++) {
        const fx = ((k * 0.618) % 1) - 0.5, fz = ((k * 0.381 + 0.2) % 1) - 0.5;
        grains.setMatrixAt(k, m4.makeTranslation(fx * len * 0.85, 0.16 + 0.04 * (1 - 4 * fx * fx), fz * (TRACK_W - 0.8)));
      }
      grains.userData.outlineParameters = { visible: false };
      const g = group3(body, shine, gloss, grains);
      g.position.set((pad.x0 + pad.x1) / 2, y, 0);
      this.group.add(g);
      this.jellies.push({ mesh: g, x0: pad.x0, x1: pad.x1, t: 9 });
    });
  }
  /** A pad just bounced someone: wobble it. */
  bounce(x: number) {
    for (const j of this.jellies) if (x >= j.x0 - 0.5 && x <= j.x1 + 0.5) j.t = 0;
  }

  /** Throw up mud behind the wheels while riding through it. */
  mud(dt: number, x: number, y: number, v: number, grounded: boolean) {
    const s = this.splat;
    if (!s) return;
    const pos = s.pts.geometry.getAttribute('position') as THREE.BufferAttribute;
    const a = pos.array as Float32Array;
    if (grounded && Math.abs(v) > 1.5 && this.track.inMud(x)) {
      s.carry += dt * Math.abs(v) * 6;
      while (s.carry >= 1) {
        s.carry -= 1;
        const i = s.next;
        s.next = (s.next + 1) % s.life.length;
        a.set([x - Math.sign(v) * 0.4, y + 0.05, (Math.random() - 0.5) * 0.6], i * 3);
        s.vel.set([-v * (0.15 + Math.random() * 0.25), 1.5 + Math.random() * 2.5, (Math.random() - 0.3) * 1.2], i * 3);
        s.life[i] = 0.5 + Math.random() * 0.4;
      }
    }
    for (let i = 0; i < s.life.length; i++) {
      if (s.life[i] <= 0) continue;
      s.life[i] -= dt;
      if (s.life[i] <= 0) { a[i * 3 + 1] = -999; continue; }
      s.vel[i * 3 + 1] -= 14 * dt;
      a[i * 3] += s.vel[i * 3] * dt;
      a[i * 3 + 1] += s.vel[i * 3 + 1] * dt;
      a[i * 3 + 2] += s.vel[i * 3 + 2] * dt;
    }
    pos.needsUpdate = true;
  }

  /** Steps drawn over the straight slope the rider actually rolls on. */
  private buildStairs() {
    const base = this.track.minY - 25;
    // Box faces: +x, -x, +y, -y, +z, -z.
    const mats = [this.frontMat, this.frontMat, this.topMat, this.frontMat, this.frontMat, this.frontMat];
    for (const st of this.track.stairs) {
      for (let i = 0; i < st.steps; i++) {
        const top = st.y0 - i * st.rise;
        const box = new THREE.Mesh(new THREE.BoxGeometry(st.run, top - base, TRACK_W + 0.02), mats);
        box.position.set(st.x0 + (i + 0.5) * st.run, (top + base) / 2, 0);
        this.group.add(shadows(box));
        // A bright nosing on each step so the set reads at a glance.
        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, TRACK_W + 0.04), toon(this.biome.band));
        nose.position.set(st.x0 + i * st.run + 0.03, top - 0.015, 0);
        this.group.add(shadows(nose));
      }
    }
  }

  /** Loop-the-loops: a banded ribbon you ride on the inside of, drifting back as it goes round. */
  private buildLoops() {
    const W = 0.6, T = 0.22, N = 96;
    const inner = toon(0xffffff, { map: surfaceTexture(this.biome.top), side: THREE.DoubleSide });
    const band = toon(this.biome.band, { side: THREE.DoubleSide });
    for (const L of this.track.loops) {
      // Rings of four corners: inner/outer radius by front/back edge.
      const pos: number[] = [];
      for (let i = 0; i <= N; i++) {
        const phi = (i / N) * Math.PI * 2;
        const zc = -LOOP_SHIFT * (i / N);
        for (const [rad, dz] of [[L.r, W], [L.r, -W], [L.r + T, -W], [L.r + T, W]]) {
          pos.push(L.x + rad * Math.sin(phi), L.y + L.r - rad * Math.cos(phi), zc + dz);
        }
      }
      // Faces between consecutive rings: 0-1 inner, 1-2 back, 2-3 outer, 3-0 front.
      const face = (a: number, b: number) => {
        const idx: number[] = [];
        for (let i = 0; i < N; i++) {
          const p = i * 4, q = (i + 1) * 4;
          idx.push(p + a, q + a, p + b, p + b, q + a, q + b);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setIndex(idx);
        g.computeVertexNormals();
        return g;
      };
      const ribbon = face(0, 1);
      // Texture runs along the loop.
      const uv: number[] = [];
      for (let i = 0; i <= N; i++) { const u = (i / N) * L.r * Math.PI * 2 / 3; uv.push(u, 0, u, 1, u, 1, u, 0); }
      ribbon.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      for (const m of [new THREE.Mesh(ribbon, inner), new THREE.Mesh(face(1, 2), band), new THREE.Mesh(face(2, 3), band), new THREE.Mesh(face(3, 0), band)]) {
        (m.material as THREE.Material).userData.outlineParameters = { visible: false };
        this.group.add(shadows(m));
      }
    }
  }

  /** Grind rails, box ledges and stair handrails. */
  private buildRails() {
    const barMat = toon(this.biome.band);
    const postMat = toon(0x5a5e66);
    const tmp = new THREE.Vector3();
    for (const r of this.track.rails) {
      const len = Math.hypot(r.x1 - r.x0, r.y1 - r.y0);
      const ang = Math.atan2(r.y1 - r.y0, r.x1 - r.x0);
      if (r.kind === 'ledge') {
        // A concrete box with a metal edge along the top.
        const h = r.y0 - this.track.height(r.x0);
        const box = new THREE.Mesh(new THREE.BoxGeometry(len, h, 0.7), [this.frontMat, this.frontMat, this.topMat, this.frontMat, this.frontMat, this.frontMat]);
        box.position.set((r.x0 + r.x1) / 2, r.y0 - h / 2, r.z - 0.2);
        const coping = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.08), barMat);
        coping.position.set((r.x0 + r.x1) / 2, r.y0 - 0.02, r.z + 0.12);
        this.group.add(shadows(box), shadows(coping));
        continue;
      }
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, len, 12), barMat);
      bar.position.set((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2 - 0.04, r.z);
      bar.rotation.z = ang - Math.PI / 2;
      this.group.add(shadows(bar));
      // Posts down to the ground (or the stairs) every metre or two.
      const n = Math.max(2, Math.round(len / 1.8) + 1);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        tmp.set(r.x0 + (r.x1 - r.x0) * t, 0, 0);
        const top = r.y0 + (r.y1 - r.y0) * t - 0.06;
        const foot = this.track.height(tmp.x) - 0.05;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, top - foot, 8), postMat);
        post.position.set(tmp.x, (top + foot) / 2, r.z);
        this.group.add(shadows(post));
      }
    }
  }

  private buildPitFills() {
    const b = this.biome;
    if (b.pitFill === 'dark') return;
    for (const p of this.track.pits) {
      const topY = Math.min(p.lipY, p.landY) - 1.3;
      const h = topY - p.floorY;
      const mat = b.pitFill === 'lava'
        ? new THREE.MeshBasicMaterial({ map: lavaTexture() })
        : toon(b.pitFillColor ?? 0x2aa6d9);
      mat.userData.outlineParameters = { visible: false };
      const box = new THREE.Mesh(new THREE.BoxGeometry(p.x1 - p.x0, h, TRACK_W + 0.2), mat);
      box.position.set((p.x0 + p.x1) / 2, p.floorY + h / 2, 0);
      this.group.add(box);
      const foam = new THREE.Mesh(
        new THREE.BoxGeometry(p.x1 - p.x0, 0.08, TRACK_W + 0.22),
        this.waterTop(p.x1 - p.x0, b.pitFill === 'lava'),
      );
      foam.position.set((p.x0 + p.x1) / 2, topY, 0);
      this.group.add(foam);
      if (b.pitFill === 'lava') this.lamps.push({ x: (p.x0 + p.x1) / 2, y: topY + 0.6, z: 0.5, radius: 9 + (p.x1 - p.x0), color: new THREE.Color(0xff7a28), intensity: 18 });
    }
  }

  /** Rippled water with flecks of foam (or lava with glowing swirls), rather than a flat sheet. */
  private waterTop(w: number, lava = false): THREE.Material {
    const fill = new THREE.Color(this.biome.pitFillColor ?? 0x2aa6d9);
    // A dark fill is a river of chocolate: glossy swirls, not foam.
    const choc = !lava && fill.getHSL({ h: 0, s: 0, l: 0 }).l < 0.3;
    const base = lava ? new THREE.Color(0xff8a20) : choc ? fill.clone().lerp(new THREE.Color(0xa05a2a), 0.4) : fill.lerp(new THREE.Color(0xffffff), 0.35);
    const tex = canvasTexture(128, 128, (c) => {
      c.fillStyle = `#${base.getHexString()}`;
      c.fillRect(0, 0, 128, 128);
      const r = rng(5);
      c.strokeStyle = lava ? 'rgba(255,236,120,0.95)' : choc ? 'rgba(200,130,80,0.9)' : 'rgba(255,255,255,0.85)';
      c.lineWidth = 3;
      for (let i = 0; i < 9; i++) {
        const x = r() * 128, y = r() * 128;
        c.beginPath();
        c.arc(x, y, 6 + r() * 6, Math.PI * 1.1, Math.PI * 1.9);
        c.stroke();
      }
    });
    tex.repeat.set(w / 3, 1);
    const m = new THREE.MeshBasicMaterial({ map: tex });
    m.userData.outlineParameters = { visible: false };
    return m;
  }

  private buildGround() {
    const len = this.track.length;
    const nx = Math.ceil(len) + 40;
    const zs = [-TRACK_W / 2 + 0.05, -2.5, -4, -7, -10.9, -11.1, -16, -23, -32, -45, -60, -80];
    const pos = new Float32Array(nx * zs.length * 3);
    const col = new Float32Array(nx * zs.length * 3);
    const [c1, c2, c3] = this.biome.ground.map((c) => new THREE.Color(c));
    const tmp = new THREE.Color();
    for (let i = 0; i < nx; i++) {
      const x = i - 20;
      for (let j = 0; j < zs.length; j++) {
        const k = (i * zs.length + j) * 3;
        pos[k] = x; pos[k + 1] = this.groundY(x, zs[j]); pos[k + 2] = zs[j];
        const n = (Math.sin(x * 0.7 + j * 1.9) + Math.sin(x * 0.23 - j)) * 0.25 + 0.5;
        tmp.copy(c1).lerp(n > 0.5 ? c3 : c2, Math.abs(n - 0.5) * 1.6);
        col.set([tmp.r, tmp.g, tmp.b], k);
      }
    }
    const idx: number[] = [];
    for (let i = 0; i < nx - 1; i++) for (let j = 0; j < zs.length - 1; j++) {
      const a = i * zs.length + j, b = a + 1, c = a + zs.length, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, toon(0xffffff, { vertexColors: true }));
    (m.material as THREE.Material).userData.outlineParameters = { visible: false };
    m.receiveShadow = true;
    this.group.add(m);
  }

  private noOutline(o: THREE.Object3D) {
    o.traverse((c) => {
      const mesh = c as THREE.Mesh;
      if (!mesh.isMesh) return;
      for (const m of ([] as THREE.Material[]).concat(mesh.material)) m.userData.outlineParameters = { visible: false };
    });
    return o;
  }

  private buildFar() {
    const b = this.biome, tr = this.track, r = this.rand;
    const far = new THREE.Group();
    const len = tr.length;
    const mat = (c: number) => toon(c);
    const fog = new THREE.Color(b.fog[0]);
    /** A material that ignores the fog, tinted part way towards it instead. */
    const hazed = (c: number, amt: number) => toon(new THREE.Color(c).lerp(fog, Math.min(0.85, amt + (b.haze ?? 0))).getHex(), { fog: false });
    switch (b.far) {
      case 'hills':
        for (let i = 0; i * 22 < len + 120; i++) {
          const rad = 30 + (i * 37) % 25;
          const s = new THREE.Mesh(new THREE.SphereGeometry(rad, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(b.farColors[i % 2]));
          s.scale.y = 0.45;
          s.position.set(i * 22 - 40, tr.minY - 2, -120 - (i % 3) * 15);
          far.add(s);
        }
        break;
      case 'fields': {
        // Patchwork farmland: rolling hills striped with crop rows, hedges along the top.
        const stripes = b.farColors.map((col, k) => {
          const base = new THREE.Color(col);
          const tex = canvasTexture(64, 64, (c) => {
            c.fillStyle = `#${base.getHexString()}`;
            c.fillRect(0, 0, 64, 64);
            c.fillStyle = `#${base.clone().multiplyScalar(0.82).getHexString()}`;
            for (let y = 0; y < 64; y += 8) c.fillRect(0, y + (k % 2) * 2, 64, 3);
          });
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(1, 6 + k * 2);
          return toon(0xffffff, { map: tex });
        });
        const hedge = mat(0x3f7a3a);
        for (let i = 0; i * 26 < len + 140; i++) {
          const rad = 34 + (i * 37) % 26;
          const s = new THREE.Mesh(new THREE.SphereGeometry(rad, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), stripes[(i * 3) % stripes.length]);
          s.scale.y = 0.32 + ((i * 13) % 5) * 0.03;
          s.rotation.y = r() * Math.PI;
          const z = -105 - (i % 3) * 18;
          s.position.set(i * 26 - 40, tr.minY - 3, z);
          far.add(s);
          // A row of hedge bushes along the crest.
          for (let k = -2; k <= 2; k++) {
            const bush = new THREE.Mesh(new THREE.SphereGeometry(2.2 + r(), 8, 6), hedge);
            bush.scale.y = 0.7;
            bush.position.set(i * 26 - 40 + k * 5, tr.minY - 3 + rad * s.scale.y - Math.abs(k) * 0.9, z + rad * 0.15);
            far.add(bush);
          }
        }
        break;
      }
      case 'scoops': {
        // Ice cream hills: big pastel scoops with a drippy rim, some with a cherry on top.
        const cherry = mat(0xe02040);
        for (let i = 0; i * 24 < len + 140; i++) {
          const rad = 22 + (i * 37) % 18;
          const col = b.farColors[(i * 3) % b.farColors.length];
          const z = -100 - (i % 3) * 16;
          const scoop = new THREE.Mesh(new THREE.SphereGeometry(rad, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(col));
          scoop.scale.y = 0.7;
          scoop.position.set(i * 24 - 40, tr.minY - 4, z);
          const rim = new THREE.Mesh(new THREE.TorusGeometry(rad * 1.01, rad * 0.06, 6, 30), mat(new THREE.Color(col).multiplyScalar(0.92).getHex()));
          rim.rotation.x = Math.PI / 2;
          rim.position.set(i * 24 - 40, tr.minY - 3.2, z);
          far.add(scoop, rim);
          if (i % 3 === 1) {
            const c = new THREE.Mesh(new THREE.SphereGeometry(rad * 0.12, 10, 8), cherry);
            c.position.set(i * 24 - 40, tr.minY - 4 + rad * 0.7 + rad * 0.08, z);
            far.add(c);
          }
        }
        break;
      }
      case 'sea': {
        const sea = new THREE.Mesh(new THREE.PlaneGeometry(len + 800, 700), toon(b.farColors[0]));
        sea.rotation.x = -Math.PI / 2;
        sea.position.set(len / 2, tr.minY - 3, -370);
        far.add(sea);
        for (let i = 0; i < len / 6; i++) {
          const w = new THREE.Mesh(new THREE.BoxGeometry(2 + r() * 4, 0.05, 0.3), new THREE.MeshBasicMaterial({ color: b.farColors[1] }));
          w.position.set(r() * (len + 100) - 50, tr.minY - 2.95, -30 - r() * 60);
          far.add(w);
        }
        break;
      }
      case 'skyline': {
        const winTex = surfaceTexture({ kind: 'windows', base: '#3a2f5c', seam: '#2a2048', accent: '#ffcf70' });
        for (let x = -60; x < len + 120; x += 7 + r() * 12) {
          const h = 15 + r() * 45, w = 6 + r() * 10, d = 8 + r() * 10;
          const z = -40 - r() * 80;
          const tex = winTex.clone();
          tex.repeat.set(w / 8, h / 8);
          tex.needsUpdate = true;
          const m = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(b.farColors[Math.floor(r() * 3)]).lerp(new THREE.Color(0xffffff), 0.6) });
          const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
          box.position.set(x, tr.minY - 35 + h + (z < -80 ? 20 : 10), z);
          far.add(box);
        }
        break;
      }
      case 'mountains':
        // Closer and unfogged (tinted by hand instead), so the peaks read against the sky.
        for (let x = -100; x < len + 200; x += 40 + r() * 35) {
          const h = 45 + r() * 35, rad = 35 + r() * 22;
          const z = -170 - r() * 60;
          const rock = b.farColors[r() > 0.5 ? 0 : 2];
          const base = new THREE.Mesh(new THREE.ConeGeometry(rad, h, 7), hazed(rock, 0.2));
          base.position.set(x, tr.minY + h / 2 - 10, z);
          base.rotation.y = r() * Math.PI;
          const cap = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.42, h * 0.42, 7), hazed(b.farColors[1], 0.1));
          cap.position.set(x, tr.minY + h - 10 - h * 0.21 + 0.3, z);
          cap.rotation.y = base.rotation.y;
          far.add(base, cap);
        }
        break;
      case 'mesas': {
        // Flat-topped buttes in bands of rock, wider than tall.
        const bands = [0xc9784a, 0xe09a64, 0xa85a34, 0xd98a58];
        for (let x = -60; x < len + 150; x += 30 + r() * 35) {
          const z = -95 - r() * 70;
          const rad = 8 + r() * 14, h = 14 + r() * 18;
          far.add(mesaShape(x, this.groundY(x, -40) - 4, z, rad, h, r, bands.map((c) => hazed(c, 0.15 + (-z - 95) / 400)), hazed(0xe8b07a, 0.15)));
        }
        break;
      }
      case 'volcano': {
        // The volcano rides along with the sky so it's in view for the whole track.
        const vx = 45, vy = -22;
        const cone = new THREE.Mesh(new THREE.CylinderGeometry(22, 110, 90, 12, 1, true), hazed(b.farColors[0], 0.3));
        cone.position.set(vx, vy, -230);
        const glow = new THREE.Mesh(new THREE.CircleGeometry(22, 16), new THREE.MeshBasicMaterial({ color: b.farColors[1], fog: false }));
        glow.rotation.x = -Math.PI / 2;
        glow.position.set(vx, vy + 44.5, -230);
        this.sky.add(cone, glow);
        const smoke = hazed(b.farColors[2], 0.3);
        for (let i = 0; i < 9; i++) {
          const puff = new THREE.Mesh(new THREE.SphereGeometry(10 + i * 2, 10, 8), smoke);
          puff.position.set(vx + i * 9 - 10, vy + 53 + i * 9, -235 - i * 3);
          this.sky.add(puff);
        }
        if (b.eruption) {
          // A fountain of lava over the crater, lighting the smoke from below.
          const hot = new THREE.MeshBasicMaterial({ color: 0xffa020, fog: false });
          const hotter = new THREE.MeshBasicMaterial({ color: 0xffe060, fog: false });
          for (let i = 0; i < 18; i++) {
            const h = r() * 34;
            const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(2.5 + r() * 3.5 - h * 0.05, 0), i % 3 ? hot : hotter);
            blob.position.set(vx + (r() - 0.5) * (8 + h), vy + 46 + h, -226);
            this.sky.add(blob);
          }
          const lit = new THREE.MeshBasicMaterial({ color: 0xc8502a, fog: false });
          for (let i = 0; i < 4; i++) {
            const puff = new THREE.Mesh(new THREE.SphereGeometry(9 + i * 2, 10, 8), lit);
            puff.position.set(vx - 4 + i * 5, vy + 50 + i * 4, -238);
            this.sky.add(puff);
          }
        }
        for (let x = -60; x < len + 100; x += 30 + r() * 30) {
          const h = 20 + r() * 25;
          const m = new THREE.Mesh(new THREE.ConeGeometry(25 + r() * 15, h, 6), mat(b.farColors[0]));
          m.position.set(x, tr.minY + h / 2 - 6, -120 - r() * 40);
          far.add(m);
        }
        break;
      }
    }
    this.noOutline(far);
    this.group.add(far);

    if (b.clouds !== null) {
      const cm = new THREE.MeshToonMaterial({ color: b.clouds });
      cm.userData.outlineParameters = { visible: false };
      const n = b.cloudCount ?? 24;
      for (let i = 0; i < n; i++) {
        const c = new THREE.Group();
        for (let j = 0; j < 4; j++) {
          const s = new THREE.Mesh(new THREE.SphereGeometry(2 + (j % 2), 10, 8), cm);
          s.position.set(j * 2.2 - 3, (j % 2) * 0.8, 0);
          c.add(s);
        }
        c.position.set(i * (720 / n) - 20, tr.maxY + 14 + (i * 7) % 10, -90 - (i % 4) * 10);
        this.clouds.add(c);
      }
      this.group.add(this.clouds);
    }

    if (b.particles) this.buildParticles(b.particles);
    this.buildSkyExtras();
  }

  private buildParticles(kind: Particles) {
    const r = this.rand;
    const p = PARTICLES[kind];
    // Rain is drawn as short slanted streaks; everything else as points.
    const stride = kind === 'rain' ? 2 : 1;
    const pos = new Float32Array(p.n * stride * 3);
    for (let i = 0; i < p.n; i++) {
      const x = r() * 60 - 30, y = r() * 30 - 8, z = r() * 30 - 22;
      pos.set([x, y, z], i * stride * 3);
      if (stride === 2) pos.set([x + p.vx * 0.06, y + p.vy * 0.06, z], i * 6 + 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    if (p.colors) {
      const col = new Float32Array(p.n * 3), c = new THREE.Color();
      for (let i = 0; i < p.n; i++) col.set(c.setHex(p.colors[i % p.colors.length]).toArray(), i * 3);
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    const glow = kind === 'fireflies' || kind === 'embers';
    const common = { color: p.color, transparent: true, opacity: p.opacity ?? 0.9, depthWrite: false, blending: glow ? THREE.AdditiveBlending : THREE.NormalBlending };
    this.particles = stride === 2
      ? new THREE.LineSegments(g, new THREE.LineBasicMaterial(common))
      : new THREE.Points(g, new THREE.PointsMaterial({ ...common, size: p.size, vertexColors: !!p.colors }));
    this.particleKind = p;
    this.particleStride = stride;
    this.group.add(this.particles);
  }

  /** Stars, northern lights and an erupting volcano, all far off behind everything else. */
  private buildSkyExtras() {
    const b = this.biome, r = this.rand, tr = this.track;
    if (b.stars) {
      const n = 500;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) pos.set([r() * 900 - 450, -15 + Math.pow(r(), 0.7) * 170, -300 - r() * 40], i * 3);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.sky.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85, depthWrite: false })));
      if (!b.bigMoon) {
        const moon = new THREE.Mesh(new THREE.CircleGeometry(9, 32), new THREE.MeshBasicMaterial({ color: 0xfff6dc, fog: false }));
        moon.position.set(-60, 44, -320);
        this.sky.add(moon);
      }
    }
    if (b.bigMoon) {
      // A huge orange harvest moon sitting low over the fields.
      const moon = new THREE.Mesh(new THREE.CircleGeometry(26, 40), new THREE.MeshBasicMaterial({ color: 0xffc070, fog: false }));
      moon.position.set(40, 22, -310);
      const halo = new THREE.Mesh(new THREE.CircleGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0xffb060, fog: false, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.position.set(40, 22, -312);
      for (const [x, y, rr] of [[34, 28, 4], [48, 18, 5.5], [44, 30, 2.5], [30, 16, 3]]) {
        const spot = new THREE.Mesh(new THREE.CircleGeometry(rr, 20), new THREE.MeshBasicMaterial({ color: 0xe8a858, fog: false }));
        spot.position.set(x, y, -309);
        this.sky.add(spot);
      }
      this.sky.add(halo, moon);
    }
    if (b.aurora) {
      const colors = [0x5affb0, 0x40d8ff, 0xa070ff];
      for (let k = 0; k < 3; k++) {
        const geo = new THREE.PlaneGeometry(420, 26 + k * 6, 60, 1);
        const p = geo.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i);
          p.setY(i, p.getY(i) + 14 * Math.sin(x * 0.02 + k * 1.7) + 6 * Math.sin(x * 0.051 + k));
          p.setZ(i, 20 * Math.sin(x * 0.013 + k));
        }
        const m = new THREE.MeshBasicMaterial({ color: colors[k], transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
        const mesh = new THREE.Mesh(geo, m);
        mesh.position.set(0, 34 + k * 10, -280 + k * 6);
        this.sky.add(mesh);
      }
    }
    this.noOutline(this.sky);
    this.group.add(this.sky);
  }

  /** Weighted pick from the biome's background props. */
  private pickBack(): string {
    const list = this.biome.back;
    const total = list.reduce((s, [, w]) => s + w, 0);
    let t = this.rand() * total;
    for (const [k, w] of list) { t -= w; if (t <= 0) return k; }
    return list[0][0];
  }

  private footprints = new Map<string, number>();

  /** Half the width of a model's base, so props on a slope sit in it rather than float. */
  private footprint(kind: string, model: THREE.Object3D): number {
    let r = this.footprints.get(kind);
    if (r === undefined) {
      const box = new THREE.Box3().setFromObject(model);
      r = Math.max(-box.min.x, box.max.x, -box.min.z, box.max.z, 0);
      this.footprints.set(kind, r);
    }
    return r;
  }

  private placeProp(kind: string, x: number, z: number, scale = 1, rot = 0): THREE.Object3D | undefined {
    const model = this.models[kind];
    if (!model) return undefined;
    const o = model.clone();
    if (kind === this.biome.fence?.kind) {
      // Fence bays are 2.4 m long: shear each one to follow the ground so the rails meet
      // the next bay and the posts stay upright.
      const y0 = this.groundY(x - 1.2, z), y1 = this.groundY(x + 1.2, z);
      o.matrixAutoUpdate = false;
      o.matrix.set(1, 0, 0, x, (y1 - y0) / 2.4, 1, 0, (y0 + y1) / 2, 0, 0, 1, z, 0, 0, 0, 1);
      this.group.add(shadows(o));
      return o;
    }
    const rr = Math.min(1.2, this.footprint(kind, model) * scale * 0.6);
    let y = this.groundY(x, z);
    for (const [dx, dz] of [[rr, 0], [-rr, 0], [0, rr], [0, -rr]]) y = Math.min(y, this.groundY(x + dx, z + dz));
    o.position.set(x, y, z);
    o.scale.setScalar(scale);
    o.rotation.y = rot;
    if (this.biome.leafTint !== undefined && kind === 'tree') this.tintLeaves(o, this.biome.leafTint);
    if (this.biome.lights && kind === 'farmpost') {
      const halo = new THREE.Sprite(haloMaterial());
      halo.position.set(0, 1.5, 0.35);
      halo.scale.setScalar(1.2);
      o.add(halo);
      this.addLamp(x, y + 1.5, z + 0.35, 0xffc070, 18, 8);
    }
    if (this.biome.lights && kind === 'gumlamp') {
      const halo = new THREE.Sprite(haloMaterial());
      halo.position.set(0, 2.66, 0);
      halo.scale.setScalar(1.6);
      o.add(halo);
      this.addLamp(x, y + 2.66 * scale, z, 0xfff0b0, 30, 12);
    }
    if (this.biome.lights && kind === 'lamp') {
      const halo = new THREE.Sprite(haloMaterial());
      halo.position.set(0, 3.9, 0.85);
      halo.scale.setScalar(2.2);
      o.add(halo);
      this.addLamp(x, y + 3.9 * scale, z + 0.85 * scale, 0xffd080, 45);
    }
    if (kind !== this.biome.fence?.kind) this.blobs.push({ x, z, r: Math.min(2.4, Math.max(0.35, this.footprint(kind, model) * scale * 0.9)) });
    this.group.add(shadows(o));
    return o;
  }

  private clearings: { x: number; z: number; r: number }[] = [];
  /** Soft dark patches where things meet the ground. */
  private blobs: { x: number; z: number; r: number }[] = [];

  /** A pool of light on the ground, brighter on darker nights. */
  private addLamp(x: number, y: number, z: number, color: number, intensity: number, radius = 11) {
    const night = this.biome.stars ? 1.3 : 1;
    this.lamps.push({ x, y, z, radius, color: new THREE.Color(color), intensity: intensity * night });
  }

  /** This track's landmarks, spread along it. */
  private placeLandmarks(id: string) {
    const names = TRACK_LANDMARKS[id] ?? [];
    const tr = this.track;
    const end = Number.isFinite(tr.finishX) ? tr.finishX : tr.length;
    names.forEach((name, i) => {
      const lm = LANDMARKS[name];
      if (!lm) return;
      const x = tr.startX + (end - tr.startX) * (names.length === 1 ? 0.45 : 0.28 + i * 0.44);
      const o = lm.build(this.rand);
      let y: number;
      if (lm.on === 'sea') y = tr.minY - 3;
      else if (lm.on === 'air') y = tr.height(x);
      else {
        y = this.groundY(x, lm.z);
        const rr = lm.r * 0.5;
        for (const [dx, dz] of [[rr, 0], [-rr, 0], [0, rr * 0.6], [0, -rr * 0.6]]) y = Math.min(y, this.groundY(x + dx, lm.z + dz));
      }
      o.position.set(x, y, lm.z);
      this.group.add(shadows(o));
      if (lm.r) this.clearings.push({ x, z: lm.z, r: lm.r });
      if (lm.r && lm.on !== 'sea') this.blobs.push({ x, z: lm.z, r: lm.r * 0.9 });
    });
  }

  private buildProps() {
    const b = this.biome, r = this.rand;
    const end = this.track.length + 10;
    for (let x = -10; x < end; x += 3 + r() * 4) {
      const z = b.backZ[0] + r() * (b.backZ[1] - b.backZ[0]);
      const kind = this.pickBack(), scale = 0.8 + r() * 0.6, rot = r() * Math.PI * 2;
      // Keep clear of the landmarks.
      if (this.clearings.some((c) => Math.abs(x - c.x) < c.r + 1.5 && Math.abs(z - c.z) < c.r + 2)) continue;
      this.placeProp(kind, x, z, scale, rot);
    }
    if (b.fence) for (let x = -6; x < end; x += b.fence.spacing) this.placeProp(b.fence.kind, x, b.fence.z);
    if (b.posts) {
      const tops: THREE.Vector3[] = [];
      for (let x = 4; x < end; x += b.posts.spacing) {
        const o = this.placeProp(b.posts.kind, x, b.posts.z);
        if (o) tops.push(o.position.clone());
      }
      if (b.posts.kind === 'liftpylon') this.buildLift(tops);
    }
    if (b.lights && b.posts?.kind !== 'lamp' && b.posts?.kind !== 'gumlamp') this.buildNightLights(end);
    if (b.edge) for (let x = 6; x < end; x += b.edge.spacing * (0.7 + r() * 0.6)) this.placeProp(b.edge.kind, x, b.edge.z, 1, r() * Math.PI);
    for (const p of this.track.props) this.placeProp(p.kind, p.x, p.z, p.scale, p.rot);
    this.buildBlobs();
  }

  /** After dark, worlds without street lamps get lamps (towns) or burning torches (the wild). */
  private buildNightLights(end: number) {
    const wild = ['desert', 'jungle', 'volcano', 'snow', 'farm'].includes(this.biome.id);
    if (!wild) {
      for (let x = 9; x < end; x += 18) this.placeProp('lamp', x, -2.6);
      return;
    }
    const wood = toon(0x6a4628), flame = new THREE.MeshBasicMaterial({ color: 0xffb030 }), core = new THREE.MeshBasicMaterial({ color: 0xfff0a0 });
    flame.userData.outlineParameters = { visible: false };
    core.userData.outlineParameters = { visible: false };
    const torch = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 6), wood);
    pole.position.y = 1.1;
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.1, 0.22, 8), toon(0x3a3034));
    bowl.position.y = 2.25;
    const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.5, 7), flame);
    f1.position.y = 2.55;
    const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 6), core);
    f2.position.y = 2.48;
    torch.add(pole, bowl, f1, f2);
    for (let x = 9; x < end; x += 16) {
      const z = -2.4, y = this.groundY(x, z);
      const t = torch.clone();
      t.position.set(x, y, z);
      const halo = new THREE.Sprite(haloMaterial());
      halo.position.y = 2.55;
      halo.scale.setScalar(1.8);
      t.add(halo);
      this.group.add(shadows(t));
      this.addLamp(x, y + 2.6, z, 0xff9a40, 22, 10);
      this.blobs.push({ x, z, r: 0.4 });
    }
  }

  /** All the contact shadows in one mesh: a soft dark disc laid over the ground under each prop. */
  private buildBlobs() {
    if (!this.blobs.length) return;
    const N = 3, per = (N + 1) * (N + 1);
    const pos = new Float32Array(this.blobs.length * per * 3), uv = new Float32Array(this.blobs.length * per * 2);
    const idx: number[] = [];
    this.blobs.forEach((b, k) => {
      const v0 = k * per;
      for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
        const u = i / N, w = j / N, x = b.x + (u - 0.5) * 2 * b.r, z = b.z + (w - 0.5) * 2 * b.r;
        const v = v0 + i * (N + 1) + j;
        pos.set([x, this.groundY(x, Math.min(z, -TRACK_W / 2 - 0.05)) + 0.04, z], v * 3);
        uv.set([u, w], v * 2);
      }
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const a = v0 + i * (N + 1) + j, c = a + N + 1;
        idx.push(a, a + 1, c, c, a + 1, c + 1);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, blobMaterial());
    m.renderOrder = -1;
    this.group.add(m);
  }

  /** Chairlift cables slung between the pylons, with a chair every so often. */
  private buildLift(tops: THREE.Vector3[]) {
    const cableMat = new THREE.LineBasicMaterial({ color: 0x2a2e36 });
    const chairMat = toon(0x3d7fd0), barMat = toon(0x4a4f58);
    const chair = new THREE.Group();
    const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6), barMat);
    hanger.position.y = -0.8;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.5), chairMat);
    seat.position.y = -1.6;
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 0.08), chairMat);
    back.position.set(0, -1.35, -0.22);
    chair.add(hanger, seat, back);
    for (let i = 0; i + 1 < tops.length; i++) {
      const a = tops[i], b = tops[i + 1];
      for (const dz of [-1.3, 1.3]) {
        const pts: THREE.Vector3[] = [];
        for (let k = 0; k <= 16; k++) {
          const t = k / 16;
          pts.push(new THREE.Vector3(a.x + (b.x - a.x) * t, a.y + 6.9 + (b.y - a.y) * t - 1.4 * Math.sin(Math.PI * t), a.z + dz));
        }
        this.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), cableMat));
        // One chair per span on each cable, going opposite ways.
        const t = dz < 0 ? 0.3 + this.rand() * 0.15 : 0.55 + this.rand() * 0.15;
        const c = chair.clone();
        c.position.set(a.x + (b.x - a.x) * t, a.y + 6.9 + (b.y - a.y) * t - 1.4 * Math.sin(Math.PI * t), a.z + dz);
        this.group.add(shadows(c));
      }
    }
  }

  private buildSigns() {
    for (const s of this.track.signs) {
      const tex = canvasTexture(512, 160, (c) => {
        c.fillStyle = this.biome.sign;
        c.fillRect(0, 0, 512, 160);
        c.strokeStyle = '#ffffff';
        c.lineWidth = 10;
        c.strokeRect(10, 10, 492, 140);
        c.fillStyle = '#ffffff';
        c.font = 'bold 64px system-ui, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(s.text, 256, 84, 470);
      });
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      const g = new THREE.Group();
      const board = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.81), new THREE.MeshBasicMaterial({ map: tex }));
      board.position.y = 2.2;
      const postMat = toon(0x4a4a4a);
      for (const dx of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8), postMat);
        post.position.set(dx, 1.1, -0.02);
        g.add(post);
      }
      g.add(board);
      const z = -2.0;
      g.position.set(s.x + 2, this.groundY(s.x + 2, z), z);
      this.group.add(shadows(g));
    }
  }

  private buildFinish() {
    const x = this.track.finishX;
    if (!Number.isFinite(x)) return;
    const g = new THREE.Group();
    const zb = -TRACK_W / 2 - 0.2;
    for (const dx of [-1.8, 1.8]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.2, 10), toon(0xe8e8e8));
      post.position.set(dx, 2.1, zb);
      g.add(post);
    }
    const tex = canvasTexture(512, 128, (c) => {
      for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) {
        c.fillStyle = (i + j) % 2 ? '#111' : '#fff';
        c.fillRect(i * 32, j * 32, 32, 32);
      }
      c.fillStyle = '#e8402a';
      c.fillRect(96, 24, 320, 80);
      c.fillStyle = '#fff';
      c.font = 'bold 60px system-ui, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('FINISH', 256, 66);
    });
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    banner.position.set(0, 3.8, zb);
    g.add(banner);
    g.position.set(x, this.track.height(x), 0);
    this.group.add(shadows(g));
  }

  private buildSky() { /* sky is the scene background, set in applyEnvironment */ }

  update(dt: number, camX: number, camY: number) {
    for (const j of this.jellies) {
      if (j.t > 1) continue;
      j.t += dt;
      const w = Math.exp(-j.t * 6) * Math.sin(j.t * 38);
      j.mesh.scale.set(1 + w * 0.12, 1 - w * 0.4, 1 + w * 0.08);
    }
    this.clouds.position.x = camX * 0.6;
    this.sky.position.set(camX * 0.9, camY, 0);
    const p = this.particleKind;
    if (this.particles && p) {
      this.particles.position.set(camX, camY, 0);
      const pos = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const a = pos.array as Float32Array;
      const t = performance.now() / 1000;
      const step = this.particleStride * 3;
      for (let i = 0; i < a.length; i += step) {
        const k = 0.6 + ((i * 7) % 10) / 20;
        let dx = p.vx * dt * k + Math.sin(t * (p.swaySpeed ?? 1) + i) * dt * (p.sway ?? 0.3);
        let dy = p.vy * dt * k;
        if (p.wander) { dx += Math.sin(t * 0.7 + i * 0.37) * dt * p.wander; dy += Math.cos(t * 0.9 + i * 0.21) * dt * p.wander; }
        if (a[i + 1] + dy < -8) dy += 30;
        if (a[i + 1] + dy > 22) dy -= 30;
        if (a[i] + dx < -30) dx += 60;
        if (a[i] + dx > 30) dx -= 60;
        for (let j = i; j < i + step; j += 3) { a[j] += dx; a[j + 1] += dy; }
      }
      pos.needsUpdate = true;
      if (p.blink) (this.particles.material as THREE.Material).opacity = 0.6 + 0.4 * Math.sin(t * 3);
    }
  }
}
