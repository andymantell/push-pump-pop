import * as THREE from 'three';
import { Track, DX, PropKind } from './track';
import { toon } from './toon';

export const TRACK_W = 3;

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

function concreteTexture(base: string, seam: string): THREE.CanvasTexture {
  return canvasTexture(256, 256, (c) => {
    c.fillStyle = base;
    c.fillRect(0, 0, 256, 256);
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 900; i++) {
      c.fillStyle = r() > 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
      c.fillRect(r() * 256, r() * 256, 2 + r() * 3, 2 + r() * 3);
    }
    c.fillStyle = seam;
    c.fillRect(0, 0, 4, 256);
  });
}

/** Smoothed track height, used to lay the background ground. */
function smoothed(track: Track, x: number, win: number): number {
  let s = 0, n = 0;
  for (let d = -win; d <= win; d += win / 6) { s += track.height(x + d); n++; }
  return s / n;
}

export class World {
  readonly group = new THREE.Group();
  private groundCache: Float32Array;
  private groundStep = 1;

  constructor(private track: Track, private models: Partial<Record<PropKind | 'finish', THREE.Object3D>> = {}) {
    this.groundCache = new Float32Array(Math.ceil(track.length / this.groundStep) + 2);
    for (let i = 0; i < this.groundCache.length; i++) {
      const x = i * this.groundStep;
      this.groundCache[i] = Math.min(smoothed(track, x, 5), track.height(x)) - 0.25;
    }
    this.buildTrack();
    this.buildGround();
    this.buildProps();
    this.buildSigns();
    this.buildFinish();
  }

  /** Height of the background ground at (x, z), z < 0 is behind the track. */
  groundY(x: number, z: number): number {
    const f = Math.max(0, Math.min(this.groundCache.length - 1.001, x / this.groundStep));
    const i = Math.floor(f), t = f - i;
    const near = this.groundCache[i] * (1 - t) + this.groundCache[i + 1] * t;
    const depth = Math.min(1, Math.max(0, (-z - TRACK_W / 2) / 40));
    const hills = 2.5 * Math.sin(x * 0.045) + 1.5 * Math.sin(x * 0.11 + 1.3) + 4;
    return near + (hills - 1) * depth * depth;
  }

  private buildTrack() {
    const tr = this.track;
    const n = tr.heights.length;
    const base = tr.minY - 25;
    const z0 = TRACK_W / 2;

    const top = new Float32Array(n * 2 * 3), topUv = new Float32Array(n * 2 * 2);
    const front = new Float32Array(n * 2 * 3), frontUv = new Float32Array(n * 2 * 2);
    const band = new Float32Array(n * 2 * 3);
    for (let i = 0; i < n; i++) {
      const x = i * DX, y = tr.heights[i];
      top.set([x, y, z0, x, y, -z0], i * 6);
      topUv.set([x / 3, 0, x / 3, 1], i * 4);
      front.set([x, y - 0.12, z0, x, base, z0], i * 6);
      frontUv.set([x / 4, (y - 0.12) / 4, x / 4, base / 4], i * 4);
      band.set([x, y + 0.001, z0 + 0.005, x, y - 0.12, z0 + 0.005], i * 6);
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
    const topMat = toon(0xffffff, { map: concreteTexture('#d9d4cc', 'rgba(0,0,0,0.18)') });
    const frontMat = toon(0xffffff, { map: concreteTexture('#9d958c', 'rgba(0,0,0,0.12)') });
    const topMesh = new THREE.Mesh(mk(top, topUv, false), topMat);
    const frontMesh = new THREE.Mesh(mk(front, frontUv), frontMat);
    const bandMesh = new THREE.Mesh(mk(band, null), toon(0xf2a33a));
    // The track is one long strip: keep it out of the outline pass to avoid noisy lines.
    for (const m of [topMesh, frontMesh, bandMesh]) {
      (m.material as THREE.Material).userData.outlineParameters = { visible: false };
      this.group.add(m);
    }
    // Front face ends in the band, give the top edge its own outline-like dark line.
    const edge = band.slice();
    for (let i = 0; i < n; i++) { edge[i * 6 + 1] = tr.heights[i] + 0.002; edge[i * 6 + 4] = tr.heights[i] - 0.025; edge[i * 6 + 2] = edge[i * 6 + 5] = z0 + 0.01; }
    const edgeMesh = new THREE.Mesh(mk(edge, null), new THREE.MeshBasicMaterial({ color: 0x2b2420 }));
    edgeMesh.material.userData.outlineParameters = { visible: false };
    this.group.add(edgeMesh);
  }

  private buildGround() {
    const len = this.track.length;
    const nx = Math.ceil(len / 1) + 1;
    const zs = [-TRACK_W / 2 + 0.05, -2.5, -4, -7, -11, -16, -23, -32, -45, -60, -80];
    const pos = new Float32Array(nx * zs.length * 3);
    const col = new Float32Array(nx * zs.length * 3);
    const c1 = new THREE.Color(0x7fc75a), c2 = new THREE.Color(0x5aa64a), c3 = new THREE.Color(0x9bd36f);
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

    // Far distant hills.
    const hills = new THREE.Group();
    for (let i = 0; i < 40; i++) {
      const r = 30 + (i * 37) % 25;
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(i % 2 ? 0x8cc7a0 : 0x7ab894));
      s.scale.y = 0.45;
      s.position.set(i * 22 - 40, this.track.minY - 2, -120 - (i % 3) * 15);
      hills.add(s);
    }
    this.group.add(hills);
  }

  private makeProp(kind: PropKind | 'finish'): THREE.Object3D {
    const model = this.models[kind];
    if (model) return model.clone();
    return placeholderProp(kind);
  }

  private buildProps() {
    for (const p of this.track.props) {
      if (p.x > this.track.length + 20) continue;
      const o = this.makeProp(p.kind);
      o.position.set(p.x, this.groundY(p.x, p.z), p.z);
      o.scale.setScalar(p.scale);
      o.rotation.y = p.rot;
      this.group.add(o);
    }
  }

  private buildSigns() {
    for (const s of this.track.signs) {
      const tex = canvasTexture(512, 160, (c) => {
        c.fillStyle = '#1f3b57';
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
    const g = this.models.finish ? this.models.finish.clone() : placeholderProp('finish');
    g.position.set(x, this.track.height(x), 0);
    this.group.add(g);
  }
}

function placeholderProp(kind: PropKind | 'finish'): THREE.Object3D {
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, color: number, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, toon(color));
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };
  switch (kind) {
    case 'tree':
    case 'pine':
      add(new THREE.CylinderGeometry(0.15, 0.22, 2, 7), 0x7a5232, 0, 1, 0);
      add(new THREE.IcosahedronGeometry(1.3, 0), 0x3f9a45, 0, 2.8, 0);
      add(new THREE.IcosahedronGeometry(0.9, 0), 0x52b552, 0.5, 3.6, 0.2);
      break;
    case 'bush':
      add(new THREE.IcosahedronGeometry(0.6, 0), 0x4aa14a, 0, 0.4, 0);
      add(new THREE.IcosahedronGeometry(0.45, 0), 0x5cbc55, 0.5, 0.3, 0.1);
      break;
    case 'rock':
      add(new THREE.DodecahedronGeometry(0.5, 0), 0x9a9a9a, 0, 0.25, 0).scale.y = 0.6;
      break;
    case 'fence': {
      const wood = 0xc58b52;
      add(new THREE.BoxGeometry(0.1, 1, 0.1), wood, -1.2, 0.5, 0);
      add(new THREE.BoxGeometry(2.4, 0.1, 0.05), wood, 0, 0.75, 0);
      add(new THREE.BoxGeometry(2.4, 0.1, 0.05), wood, 0, 0.4, 0);
      break;
    }
    case 'lamp':
      add(new THREE.CylinderGeometry(0.06, 0.08, 4, 8), 0x3c4652, 0, 2, 0);
      add(new THREE.BoxGeometry(0.6, 0.15, 0.3), 0x3c4652, 0.25, 4, 0);
      add(new THREE.BoxGeometry(0.4, 0.05, 0.2), 0xfff3b0, 0.3, 3.9, 0);
      break;
    case 'cone':
      add(new THREE.ConeGeometry(0.18, 0.5, 12), 0xff7a1a, 0, 0.25, 0);
      break;
    case 'bench':
      add(new THREE.BoxGeometry(1.6, 0.08, 0.45), 0xb5703a, 0, 0.45, 0);
      add(new THREE.BoxGeometry(1.6, 0.3, 0.06), 0xb5703a, 0, 0.75, -0.2);
      add(new THREE.BoxGeometry(0.08, 0.45, 0.4), 0x444444, -0.7, 0.22, 0);
      add(new THREE.BoxGeometry(0.08, 0.45, 0.4), 0x444444, 0.7, 0.22, 0);
      break;
    case 'finish': {
      const post = 0xe8e8e8;
      const zb = -TRACK_W / 2 - 0.2;
      add(new THREE.CylinderGeometry(0.1, 0.1, 4.2, 10), post, -1.8, 2.1, zb);
      add(new THREE.CylinderGeometry(0.1, 0.1, 4.2, 10), post, 1.8, 2.1, zb);
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
      break;
    }
  }
  return g;
}
