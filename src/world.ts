import * as THREE from 'three';
import { Track, DX } from './track';
import { Biome, Surface } from './biomes';
import { toon } from './toon';

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

export class World {
  readonly group = new THREE.Group();
  private groundCache: Float32Array;
  private particles: THREE.Points | null = null;
  private particleVel = 0;
  private clouds = new THREE.Group();
  private rand: () => number;

  constructor(private track: Track, readonly biome: Biome, private models: Models, seed: string) {
    this.rand = rng(hashString(seed));
    this.groundCache = new Float32Array(Math.ceil(track.length) + 2);
    for (let i = 0; i < this.groundCache.length; i++) {
      this.groundCache[i] = Math.min(this.smoothed(i, 5), track.surface(i)) - 0.25;
    }
    this.buildTrack();
    this.buildPitFills();
    this.buildStairs();
    this.buildRails();
    this.buildGround();
    this.buildFar();
    this.buildProps();
    this.buildSigns();
    this.buildFinish();
    this.buildSky();
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
    hemi.intensity = b.hemi[2];
    sun.color.setHex(b.sun[0]);
    sun.intensity = b.sun[1];
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
        const hills = 4 * Math.sin(x * 0.03) + 2 * Math.sin(x * 0.09 + 1.3) + 10;
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
      this.group.add(m);
    }
  }

  private topMat!: THREE.Material;
  private frontMat!: THREE.Material;

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
        this.group.add(box);
        // A bright nosing on each step so the set reads at a glance.
        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, TRACK_W + 0.04), toon(this.biome.band));
        nose.position.set(st.x0 + i * st.run + 0.03, top - 0.015, 0);
        this.group.add(nose);
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
        this.group.add(box, coping);
        continue;
      }
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, len, 12), barMat);
      bar.position.set((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2 - 0.04, r.z);
      bar.rotation.z = ang - Math.PI / 2;
      this.group.add(bar);
      // Posts down to the ground (or the stairs) every metre or two.
      const n = Math.max(2, Math.round(len / 1.8) + 1);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        tmp.set(r.x0 + (r.x1 - r.x0) * t, 0, 0);
        const top = r.y0 + (r.y1 - r.y0) * t - 0.06;
        const foot = this.track.height(tmp.x) - 0.05;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, top - foot, 8), postMat);
        post.position.set(tmp.x, (top + foot) / 2, r.z);
        this.group.add(post);
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
        ? new THREE.MeshBasicMaterial({ color: b.pitFillColor ?? 0xff5a10 })
        : toon(b.pitFillColor ?? 0x2aa6d9);
      mat.userData.outlineParameters = { visible: false };
      const box = new THREE.Mesh(new THREE.BoxGeometry(p.x1 - p.x0, h, TRACK_W + 0.2), mat);
      box.position.set((p.x0 + p.x1) / 2, p.floorY + h / 2, 0);
      this.group.add(box);
      const foam = new THREE.Mesh(
        new THREE.BoxGeometry(p.x1 - p.x0, 0.08, TRACK_W + 0.22),
        new THREE.MeshBasicMaterial({ color: b.pitFill === 'lava' ? 0xffd040 : 0xe8fbff }),
      );
      foam.position.set((p.x0 + p.x1) / 2, topY, 0);
      this.group.add(foam);
    }
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
    this.group.add(m);
  }

  private noOutline(o: THREE.Object3D) {
    o.traverse((c) => {
      const mesh = c as THREE.Mesh;
      if (mesh.isMesh) (mesh.material as THREE.Material).userData.outlineParameters = { visible: false };
    });
    return o;
  }

  private buildFar() {
    const b = this.biome, tr = this.track, r = this.rand;
    const far = new THREE.Group();
    const len = tr.length;
    const mat = (c: number) => toon(c);
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
        for (let x = -100; x < len + 200; x += 45 + r() * 40) {
          const h = 60 + r() * 50, rad = 45 + r() * 30;
          const z = -160 - r() * 60;
          const base = new THREE.Mesh(new THREE.ConeGeometry(rad, h, 7), mat(b.farColors[r() > 0.5 ? 0 : 2]));
          base.position.set(x, tr.minY + h / 2 - 10, z);
          const cap = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.38, h * 0.38, 7), mat(b.farColors[1]));
          cap.position.set(x, tr.minY + h - 10 - h * 0.19 + 0.5, z);
          far.add(base, cap);
        }
        break;
      case 'mesas': {
        const mesa = this.models.mesa;
        for (let x = -60; x < len + 150; x += 35 + r() * 40) {
          const o = mesa ? mesa.clone() : new THREE.Mesh(new THREE.CylinderGeometry(8, 10, 16, 8), mat(b.farColors[0]));
          const s = 2 + r() * 1.5;
          o.scale.set(s * 2.2, s * (0.7 + r() * 0.4), s * 1.6);
          o.position.set(x, this.groundY(x, -40) - 3, -110 - r() * 80);
          o.rotation.y = r() * Math.PI;
          far.add(o);
        }
        break;
      }
      case 'volcano': {
        const vx = len * 0.75;
        const cone = new THREE.Mesh(new THREE.CylinderGeometry(22, 110, 90, 12, 1, true), mat(b.farColors[0]));
        cone.position.set(vx, tr.minY + 35, -230);
        const glow = new THREE.Mesh(new THREE.CircleGeometry(22, 16), new THREE.MeshBasicMaterial({ color: b.farColors[1] }));
        glow.rotation.x = -Math.PI / 2;
        glow.position.set(vx, tr.minY + 79.5, -230);
        far.add(cone, glow);
        for (let i = 0; i < 9; i++) {
          const puff = new THREE.Mesh(new THREE.SphereGeometry(10 + i * 2, 10, 8), mat(b.farColors[2]));
          puff.position.set(vx + i * 9 - 10, tr.minY + 88 + i * 9, -235 - i * 3);
          far.add(puff);
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
      for (let i = 0; i < 24; i++) {
        const c = new THREE.Group();
        for (let j = 0; j < 4; j++) {
          const s = new THREE.Mesh(new THREE.SphereGeometry(2 + (j % 2), 10, 8), cm);
          s.position.set(j * 2.2 - 3, (j % 2) * 0.8, 0);
          c.add(s);
        }
        c.position.set(i * 30 - 20, tr.maxY + 14 + (i * 7) % 10, -90 - (i % 4) * 10);
        this.clouds.add(c);
      }
      this.group.add(this.clouds);
    }

    if (b.particles) {
      const n = 700;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) pos.set([r() * 60 - 30, r() * 30 - 8, r() * 30 - 22], i * 3);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const snow = b.particles === 'snow';
      const pm = new THREE.PointsMaterial({ color: snow ? 0xffffff : 0xff8a3a, size: snow ? 0.12 : 0.09, transparent: true, opacity: 0.9, depthWrite: false });
      this.particles = new THREE.Points(g, pm);
      this.particleVel = snow ? -1.2 : 1.5;
      this.group.add(this.particles);
    }
  }

  /** Weighted pick from the biome's background props. */
  private pickBack(): string {
    const list = this.biome.back;
    const total = list.reduce((s, [, w]) => s + w, 0);
    let t = this.rand() * total;
    for (const [k, w] of list) { t -= w; if (t <= 0) return k; }
    return list[0][0];
  }

  private placeProp(kind: string, x: number, z: number, scale = 1, rot = 0) {
    const model = this.models[kind];
    if (!model) return;
    const o = model.clone();
    o.position.set(x, this.groundY(x, z), z);
    o.scale.setScalar(scale);
    o.rotation.y = rot;
    this.group.add(o);
  }

  private buildProps() {
    const b = this.biome, r = this.rand;
    const end = this.track.length + 10;
    for (let x = -10; x < end; x += 3 + r() * 4) {
      const z = b.backZ[0] + r() * (b.backZ[1] - b.backZ[0]);
      this.placeProp(this.pickBack(), x, z, 0.8 + r() * 0.6, r() * Math.PI * 2);
    }
    if (b.fence) for (let x = -6; x < end; x += b.fence.spacing) this.placeProp(b.fence.kind, x, b.fence.z);
    if (b.posts) for (let x = 4; x < end; x += b.posts.spacing) this.placeProp(b.posts.kind, x, b.posts.z);
    if (b.edge) for (let x = 6; x < end; x += b.edge.spacing * (0.7 + r() * 0.6)) this.placeProp(b.edge.kind, x, b.edge.z, 1, r() * Math.PI);
    for (const p of this.track.props) this.placeProp(p.kind, p.x, p.z, p.scale, p.rot);
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
      this.group.add(g);
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
    this.group.add(g);
  }

  private buildSky() { /* sky is the scene background, set in applyEnvironment */ }

  update(dt: number, camX: number, camY: number) {
    this.clouds.position.x = camX * 0.6;
    if (this.particles) {
      this.particles.position.set(camX, camY, 0);
      const pos = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const a = pos.array as Float32Array;
      const t = performance.now() / 1000;
      for (let i = 0; i < a.length; i += 3) {
        a[i + 1] += this.particleVel * dt * (0.6 + ((i * 7) % 10) / 20);
        a[i] += Math.sin(t + i) * dt * 0.3;
        if (a[i + 1] < -8) a[i + 1] += 30;
        if (a[i + 1] > 22) a[i + 1] -= 30;
      }
      pos.needsUpdate = true;
    }
  }
}
