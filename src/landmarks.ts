import * as THREE from 'three';
import { toon } from './toon';

// Landmarks: one or two big set pieces behind each track, so every track has something of
// its own to look at. Each builder returns a group with its origin on the ground; `z` is how
// far back it stands and `r` how much room it needs (scattered props keep clear of it).

export interface Landmark {
  z: number;
  r: number;
  /** Floats on the sea, or hangs in the air over the track, rather than standing on the ground. */
  on?: 'sea' | 'air';
  build: (rand: () => number) => THREE.Object3D;
}

type V3 = [number, number, number];

function mesh(geo: THREE.BufferGeometry, color: number | THREE.Material, at: V3 = [0, 0, 0], rot: V3 = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, typeof color === 'number' ? toon(color) : color);
  m.position.set(...at);
  m.rotation.set(...rot);
  return m;
}
const box = (w: number, h: number, d: number, c: number | THREE.Material, at: V3 = [0, h / 2, 0], rot?: V3) => mesh(new THREE.BoxGeometry(w, h, d), c, at, rot);
const cyl = (rt: number, rb: number, h: number, c: number | THREE.Material, at: V3 = [0, h / 2, 0], seg = 12, rot?: V3) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), c, at, rot);
const ball = (r: number, c: number | THREE.Material, at: V3, seg = 12) => mesh(new THREE.SphereGeometry(r, seg, Math.ceil(seg * 0.7)), c, at);
const glow = (c: number) => new THREE.MeshBasicMaterial({ color: c });

function group(...parts: THREE.Object3D[]) {
  const g = new THREE.Group();
  g.add(...parts);
  return g;
}

/** A bar from a to b. */
function beam(a: V3, b: V3, t: number, c: number | THREE.Material) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const m = new THREE.Mesh(new THREE.BoxGeometry(t, len, t), typeof c === 'number' ? toon(c) : c);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return m;
}

function textPanel(text: string, w: number, h: number, bg: string, fg: string, border?: string) {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = Math.round((512 * h) / w);
  const c = cv.getContext('2d')!;
  c.fillStyle = bg;
  c.fillRect(0, 0, cv.width, cv.height);
  if (border) {
    c.strokeStyle = border;
    c.lineWidth = 14;
    c.strokeRect(10, 10, cv.width - 20, cv.height - 20);
  }
  c.fillStyle = fg;
  c.font = `900 ${Math.round(cv.height * 0.55)}px system-ui, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, cv.width / 2, cv.height * 0.54, cv.width * 0.9);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
}

/** A big wheel with gondolas, facing the camera. */
function bigWheel(rad: number, frame: number, cars: number[]) {
  const g = new THREE.Group();
  const hub = rad + 1.5;
  for (const dz of [-0.6, 0.6]) {
    g.add(beam([-rad * 0.55, 0, dz], [0, hub, dz], 0.35, frame), beam([rad * 0.55, 0, dz], [0, hub, dz], 0.35, frame));
  }
  const ring = mesh(new THREE.TorusGeometry(rad, 0.18, 6, 40), frame, [0, hub, 0]);
  const ring2 = mesh(new THREE.TorusGeometry(rad * 0.55, 0.12, 6, 30), frame, [0, hub, 0]);
  g.add(ring, ring2, cyl(0.5, 0.5, 1.6, frame, [0, hub, 0], 12, [Math.PI / 2, 0, 0]));
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rad, y = hub + Math.sin(a) * rad;
    g.add(beam([0, hub, 0], [x, y, 0], 0.12, frame));
    const car = group(box(1.1, 0.9, 0.9, cars[i % cars.length], [0, -0.75, 0]), box(1.3, 0.12, 1.0, 0xf4f0e8, [0, -0.25, 0]));
    car.position.set(x, y, 0.3);
    g.add(car);
  }
  return g;
}

function hotAirBalloon(c1: number, c2: number) {
  const env = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const seg = mesh(new THREE.SphereGeometry(2.2, 4, 10, (i / 8) * Math.PI * 2, Math.PI / 4), i % 2 ? c1 : c2);
    env.add(seg);
  }
  env.scale.set(1, 1.15, 1);
  env.position.y = 4.2;
  const basket = box(0.9, 0.7, 0.9, 0x8a5a30, [0, 0.35, 0]);
  const ropes = [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([x, z]) => beam([x, 0.7, z], [x * 2.6, 2.5, z * 2.6], 0.04, 0x4a3a2a));
  return group(env, basket, ...ropes);
}

function rockArch(c1: number, c2: number, span: number, h: number) {
  const g = new THREE.Group();
  const leg = (x: number) => mesh(new THREE.CylinderGeometry(span * 0.16, span * 0.22, h, 7), c1, [x, h / 2, 0]);
  g.add(leg(-span / 2), leg(span / 2));
  const top = mesh(new THREE.TorusGeometry(span / 2, span * 0.15, 6, 14, Math.PI), c2, [0, h, 0]);
  top.scale.z = 1.3;
  g.add(top);
  return g;
}

function cliff(w: number, h: number, c: number, c2: number) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(w, h, 6, 6, 4, 1);
  const p = geo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    p.setZ(i, p.getZ(i) + Math.sin(x * 0.9 + y * 0.7) * 0.6);
    if (y > 0) p.setY(i, y + Math.sin(x * 1.3) * 0.8);
  }
  geo.computeVertexNormals();
  g.add(mesh(geo, c, [0, h / 2, 0]));
  g.add(box(w + 0.6, 0.5, 6.4, c2, [0, h + 0.1, 0]));
  return g;
}

export const LANDMARKS: Record<string, Landmark> = {
  // ---- Sunny Park
  fountain: { z: -7, r: 3, build: () => group(
    cyl(2.4, 2.6, 0.6, 0xc8c0b4), cyl(2.1, 2.1, 0.05, 0x5ab8e8, [0, 0.58, 0], 24),
    cyl(0.35, 0.5, 1.6, 0xc8c0b4, [0, 1.3, 0]), cyl(1.2, 0.5, 0.35, 0xc8c0b4, [0, 2.2, 0]),
    cyl(1.0, 1.0, 0.05, 0x5ab8e8, [0, 2.37, 0], 20), cyl(0.12, 0.35, 1.0, 0xbfe8ff, [0, 2.9, 0]),
    ball(0.25, 0xbfe8ff, [0, 3.45, 0], 10),
  ) },
  bandstand: { z: -9, r: 4, build: () => {
    const g = group(cyl(3.2, 3.4, 0.7, 0xe8e0d0, undefined, 8), cyl(3.6, 0.2, 1.8, 0xd84a3a, [0, 4.6, 0], 8), ball(0.25, 0xf2c040, [0, 5.6, 0], 8));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      g.add(cyl(0.1, 0.1, 3.0, 0xf8f6f0, [Math.cos(a) * 2.9, 2.2, Math.sin(a) * 2.9], 8));
    }
    g.add(cyl(3.5, 3.5, 0.25, 0xf8f6f0, [0, 3.7, 0], 8));
    return g;
  } },
  playground: { z: -7, r: 5, build: () => {
    const g = new THREE.Group();
    // Swings
    for (const x of [-4.2, -1.8]) g.add(beam([x, 0, -0.8], [x, 2.6, 0], 0.12, 0x3a7ad8), beam([x, 0, 0.8], [x, 2.6, 0], 0.12, 0x3a7ad8));
    g.add(beam([-4.2, 2.6, 0], [-1.8, 2.6, 0], 0.12, 0x3a7ad8));
    for (const x of [-3.6, -2.4]) g.add(beam([x, 2.6, 0], [x, 0.6, 0], 0.03, 0x404040), box(0.5, 0.06, 0.25, 0xe84a3a, [x, 0.6, 0]));
    // Slide
    g.add(box(1.2, 0.12, 1.2, 0xf2c040, [1.5, 2.0, 0]));
    for (const [x, z] of [[1, -0.5], [2, -0.5], [1, 0.5], [2, 0.5]]) g.add(cyl(0.06, 0.06, 2.0, 0x3a7ad8, [x, 1.0, z], 6));
    g.add(beam([2.1, 2.0, 0], [4.4, 0.25, 0], 0.9, 0xe84a3a));
    for (let i = 0; i < 5; i++) g.add(box(0.7, 0.06, 0.06, 0x3a7ad8, [0.85, 0.35 + i * 0.4, 0]));
    return g;
  } },
  ferris: { z: -26, r: 10, build: () => bigWheel(9, 0xf4f0e8, [0xe84a3a, 0xf2c040, 0x3a7ad8, 0x4ab84a]) },
  windmill: { z: -18, r: 5, build: () => {
    const sails = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const s = group(box(0.25, 4.2, 0.1, 0x8a5a30, [0, 2.1, 0]), box(0.9, 3.2, 0.05, 0xf4ecd8, [0.55, 2.5, 0]));
      s.rotation.z = (i * Math.PI) / 2 + 0.3;
      sails.add(s);
    }
    sails.position.set(0, 7.2, 1.7);
    return group(cyl(1.3, 2.2, 7, 0xf0e6d2, undefined, 10), cyl(0.2, 1.6, 1.8, 0xb84a3a, [0, 7.9, 0], 10), sails);
  } },
  balloons: { z: -24, r: 0, on: 'air', build: (r) => {
    const g = new THREE.Group();
    const cols: [number, number][] = [[0xe84a3a, 0xf2c040], [0x3a7ad8, 0xf4f0e8], [0x4ab84a, 0xf2a03a], [0xa050d0, 0xf4f0e8]];
    for (let i = 0; i < 4; i++) {
      const b = hotAirBalloon(...cols[i]);
      b.position.set(i * 9 - 13 + r() * 3, 5 + r() * 6, -r() * 12);
      b.scale.setScalar(0.8 + r() * 0.5);
      g.add(b);
    }
    return g;
  } },
  pond: { z: -8, r: 5, build: () => {
    const water = mesh(new THREE.CircleGeometry(4, 24), 0x4aa8d8, [0, 0.12, 0], [-Math.PI / 2, 0, 0]);
    water.scale.y = 0.55;
    const g = group(water);
    for (const [x, z] of [[-1.2, 0.3], [0.6, -0.5], [1.7, 0.6]]) {
      g.add(ball(0.22, 0xf8f4e8, [x, 0.3, z], 10), ball(0.13, 0x3a8a4a, [x + 0.22, 0.5, z], 8), box(0.1, 0.05, 0.08, 0xf2a03a, [x + 0.36, 0.48, z]));
    }
    for (let i = 0; i < 9; i++) g.add(cyl(0.03, 0.03, 0.9 + (i % 3) * 0.2, 0x6a9a3a, [-3.6 + i * 0.2, 0.5, -1.1 + (i % 2) * 0.3], 5));
    return g;
  } },

  // ---- Beach Boardwalk
  lighthouse: { z: -24, r: 4, build: () => {
    const g = group(mesh(new THREE.IcosahedronGeometry(4, 0), 0x8a8478, [0, 0.5, 0]));
    for (let i = 0; i < 5; i++) g.add(cyl(1.5 - (i + 1) * 0.12, 1.5 - i * 0.12, 2.2, i % 2 ? 0xf4f0e8 : 0xd84a3a, [0, 3 + i * 2.2 + 1.1, 0], 14));
    g.add(cyl(1.3, 1.3, 0.25, 0x30343a, [0, 14.2, 0], 14), cyl(0.7, 0.7, 1.4, glow(0xfff0a0), [0, 15.0, 0], 12), cyl(0.15, 0.95, 1.0, 0xd84a3a, [0, 16.2, 0], 12));
    return g;
  } },
  pierwheel: { z: -30, r: 10, build: () => group(box(26, 0.6, 5, 0x9c6c3c, [0, 1.8, 0]), ...[-12, -6, 0, 6, 12].map((x) => cyl(0.3, 0.3, 2, 0x6a4422, [x, 0.6, 1.8], 6)), (() => { const w = bigWheel(8, 0xf4f0e8, [0x2bc4c0, 0xf2a03a, 0xe84a3a]); w.position.y = 2.1; return w; })()) },
  shipwreck: { z: -16, r: 5, build: () => {
    const hull = mesh(new THREE.CylinderGeometry(2.4, 2.4, 10, 10, 1, false, 0, Math.PI), 0x6a4422, [0, 1.8, 0], [0, 0, -Math.PI / 2]);
    const g = group(hull, beam([0.5, 0.5, 0], [1.2, 6.5, 0], 0.25, 0x5a3a1a), beam([1.0, 4.8, 0], [-0.4, 5.6, 0], 0.15, 0x5a3a1a), box(1.6, 1.6, 0.05, 0xe8e0c8, [0.6, 4.6, 0.2], [0, 0, 0.3]));
    g.rotation.z = 0.12;
    return g;
  } },
  sandcastle: { z: -5.5, r: 2, build: () => {
    const s = 0xe8c98a;
    const g = group(box(2.2, 0.7, 1.4, s), box(1.0, 0.6, 0.8, s, [0, 1.0, 0]));
    for (const [x, z] of [[-1.1, -0.7], [1.1, -0.7], [-1.1, 0.7], [1.1, 0.7]]) g.add(cyl(0.3, 0.35, 1.1, s, [x, 0.55, z], 8), cyl(0, 0.35, 0.4, s, [x, 1.3, z], 8));
    g.add(cyl(0.02, 0.02, 0.9, 0x5a3a1a, [0, 1.75, 0], 4), box(0.4, 0.25, 0.02, 0xe84a3a, [0.2, 2.05, 0]));
    return g;
  } },
  beachhuts: { z: -12, r: 9, build: () => {
    const g = new THREE.Group();
    const cols = [0xe84a3a, 0x3a9ad8, 0xf2c040, 0x4ab84a, 0xf28ab0, 0x2bc4c0];
    for (let i = 0; i < 6; i++) {
      const x = i * 2.6 - 6.5;
      g.add(box(2.2, 2.2, 2.0, cols[i], [x, 1.1, 0]), box(0.9, 1.6, 0.05, 0xf4f0e8, [x, 0.8, 1.01]));
      const roof = mesh(new THREE.CylinderGeometry(0.01, 1.6, 1.0, 4), 0xf4f0e8, [x, 2.7, 0], [0, Math.PI / 4, 0]);
      roof.scale.set(1.0, 1, 0.9);
      g.add(roof);
    }
    return g;
  } },
  sailboats: { z: -50, r: 0, on: 'sea', build: (r) => {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const b = group(box(4, 0.6, 1.2, i % 2 ? 0xf4f0e8 : 0x3a5a9a, [0, 0.3, 0]), cyl(0.06, 0.06, 5, 0x5a3a1a, [0, 3, 0], 4),
        mesh(new THREE.ConeGeometry(1.6, 4.4, 3), i % 2 ? 0xe84a3a : 0xf4f0e8, [0.9, 3.1, 0], [0, 0, 0]));
      b.position.set(i * 22 - 30 + r() * 8, 0, -r() * 20);
      g.add(b);
    }
    return g;
  } },

  // ---- Downtown Rooftops
  billboard: { z: -6.5, r: 4, build: (r) => {
    const texts = ['PUMP!', 'POP SODA', 'SKATE', 'GO BIG'];
    const sign = textPanel(texts[Math.floor(r() * texts.length)], 7, 2.6, '#e84aa0', '#ffffff', '#ffe060');
    sign.position.set(0, 5, 0.1);
    const g = group(sign, box(7.4, 3.0, 0.2, 0x30283a, [0, 5, -0.05]));
    for (const x of [-2.5, 2.5]) g.add(cyl(0.12, 0.12, 3.6, 0x4a4a52, [x, 1.8, -0.2], 6));
    for (let i = 0; i < 5; i++) g.add(ball(0.12, glow(0xfff2b0), [-2.8 + i * 1.4, 6.6, 0.3], 6));
    return g;
  } },
  radiotower: { z: -9, r: 2, build: () => {
    const g = new THREE.Group();
    const h = 16, w0 = 1.6;
    const corners = (y: number) => { const w = w0 * (1 - (y / h) * 0.8); return [[-w, -w], [w, -w], [w, w], [-w, w]] as [number, number][]; };
    for (let k = 0; k < 4; k++) {
      const [a, b] = [corners(0)[k], corners(h)[k]];
      g.add(beam([a[0], 0, a[1]], [b[0], h, b[1]], 0.1, 0xd84a3a));
    }
    for (let y = 2; y < h; y += 2) {
      const c = corners(y), d = corners(y + 2);
      for (let k = 0; k < 4; k++) g.add(beam([c[k][0], y, c[k][1]], [d[(k + 1) % 4][0], y + 2, d[(k + 1) % 4][1]], 0.05, k % 2 ? 0xf4f0e8 : 0xd84a3a));
    }
    g.add(cyl(0.05, 0.05, 3, 0x4a4a52, [0, h + 1.5, 0], 4), ball(0.22, glow(0xff3030), [0, h + 3.1, 0], 8));
    return g;
  } },
  helipad: { z: -7, r: 4, build: () => {
    const pad = cyl(3, 3, 0.25, 0x4a4c52, undefined, 24);
    const h = group(box(0.25, 0.02, 1.6, 0xf4f0e8, [-0.5, 0.26, 0]), box(0.25, 0.02, 1.6, 0xf4f0e8, [0.5, 0.26, 0]), box(1.0, 0.02, 0.25, 0xf4f0e8, [0, 0.26, 0]));
    h.position.x = -1.6;
    const heli = group(
      mesh(new THREE.SphereGeometry(1.0, 14, 10), 0xe84a3a, [0, 1.4, 0]), beam([0.8, 1.6, 0], [3.4, 1.9, 0], 0.25, 0xe84a3a),
      box(0.1, 0.8, 0.6, 0xe84a3a, [3.4, 2.1, 0]), box(5.5, 0.05, 0.25, 0x30343a, [0, 2.55, 0], [0, 0.6, 0]), cyl(0.06, 0.06, 0.3, 0x30343a, [0, 2.4, 0], 6),
      box(2.4, 0.08, 0.08, 0x30343a, [0, 0.45, 0.6]), box(2.4, 0.08, 0.08, 0x30343a, [0, 0.45, -0.6]),
      mesh(new THREE.SphereGeometry(0.6, 10, 8), 0x9ad8f0, [-0.55, 1.55, 0.35]),
    );
    heli.position.x = 1.2;
    return group(pad, h, heli);
  } },
  blimp: { z: -45, r: 0, on: 'air', build: () => {
    const body = ball(1, 0xe8e4dc, [0, 0, 0], 20);
    body.scale.set(9, 3, 3);
    const band = textPanel('PUSH PUMP POP', 10, 1.6, '#e84aa0', '#ffffff');
    band.position.set(0, 0, 3.02);
    const g = group(body, band, box(2.5, 1.0, 1.2, 0x30283a, [0, -3.2, 0]));
    for (const r of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const fin = box(2.2, 0.15, 1.8, 0xe84aa0, [0, 0, 0]);
      const f = group(fin);
      fin.position.set(0, 0, 1.6);
      f.rotation.x = r;
      f.position.x = -8;
      g.add(f);
    }
    g.position.y = 10;
    return group(g);
  } },
  crane: { z: -24, r: 4, build: () => {
    const y = 26, c = 0xf2c040;
    const g = group(box(1.2, y, 1.2, c, [0, y / 2, 0]), box(22, 0.9, 0.9, c, [5, y + 0.5, 0]), box(2.4, 2, 2.4, 0x3a3a42, [0, y - 1, 0]), box(3, 2, 2, 0x8a8a92, [-5, y - 0.6, 0]));
    g.add(cyl(0.03, 0.03, 8, 0x30343a, [12, y - 4, 0], 4), box(1.6, 0.5, 0.8, 0xd84a3a, [12, y - 8.2, 0]));
    return g;
  } },
  garden: { z: -6, r: 4, build: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const x = i * 2.6 - 2.6;
      g.add(box(2.2, 0.7, 1.2, 0x8a5a30, [x, 0.35, 0]), box(2.1, 0.1, 1.1, 0x5a3a20, [x, 0.72, 0]));
      for (let k = 0; k < 4; k++) g.add(ball(0.28, [0x4ab84a, 0xe84a3a, 0xf2c040][(i + k) % 3], [x - 0.75 + k * 0.5, 1.0, 0], 8));
    }
    g.add(cyl(0.12, 0.15, 1.6, 0x7a5232, [4, 0.8, -0.5], 6), ball(1.0, 0x4ab84a, [4, 2.2, -0.5], 10));
    return g;
  } },

  // ---- Snowy Mountain
  skijump: { z: -22, r: 7, build: () => {
    // In-run on stilts, curving into the take-off table, with the start hut on top.
    const g = new THREE.Group();
    const pts: V3[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      pts.push([-9 + t * 13, 15 * (1 - t) * (1 - t) + 2.5, 0]);
    }
    for (let i = 0; i < 10; i++) {
      g.add(beam(pts[i], pts[i + 1], 2.4, 0xe8eef4), beam([pts[i][0], pts[i][1] - 0.3, 0], [pts[i + 1][0], pts[i + 1][1] - 0.3, 0], 2.6, 0x3d7fd0));
      if (i % 2 === 0) for (const z of [-1, 1]) g.add(box(0.3, pts[i][1], 0.3, 0x6a6f78, [pts[i][0], pts[i][1] / 2, z]));
    }
    g.add(box(3, 3, 3.2, 0xd84a3a, [-10, 18.5, 0]), mesh(new THREE.ConeGeometry(2.4, 1.4, 4), 0x30343a, [-10, 20.7, 0], [0, Math.PI / 4, 0]));
    g.add(box(0.2, 1.2, 2.6, 0xf2c040, [4.1, 3.0, 0]));
    return g;
  } },
  igloo: { z: -7, r: 3, build: () => {
    const dome = mesh(new THREE.SphereGeometry(2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xf4f8fc);
    const door = mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.4, 12, 1, false, 0, Math.PI), 0xf4f8fc, [0, 0, 1.9], [Math.PI / 2, 0, 0]);
    const g = group(dome, door, mesh(new THREE.CircleGeometry(0.55, 12, 0, Math.PI), 0x2a3a5a, [0, 0, 2.61]));
    for (let i = 1; i < 4; i++) g.add(mesh(new THREE.TorusGeometry(2 * Math.cos((i * Math.PI) / 8), 0.03, 4, 28), 0xc8d8ea, [0, 2 * Math.sin((i * Math.PI) / 8), 0], [Math.PI / 2, 0, 0]));
    return g;
  } },
  observatory: { z: -26, r: 4, build: () => group(
    cyl(3, 3.2, 5, 0xe8e4dc, undefined, 16), mesh(new THREE.SphereGeometry(3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xc8ccd4, [0, 5, 0]),
    box(1.0, 3.2, 0.3, 0x30343a, [0, 6.4, 2.6], [-0.5, 0, 0]), box(0.6, 1.8, 0.05, glow(0xffe080), [1.6, 2.2, 3.05]),
  ) },
  snowcat: { z: -8, r: 3, build: () => group(
    box(3.6, 0.9, 2.2, 0x30343a, [0, 0.45, 0]), box(3.0, 1.2, 2.0, 0xd84a3a, [0.2, 1.5, 0]), box(1.4, 0.8, 1.9, 0x9ad8f0, [-0.8, 1.6, 0]),
    box(0.3, 1.4, 2.6, 0xc8ccd4, [-2.1, 0.8, 0], [0, 0, -0.2]), ball(0.15, glow(0xfff2b0), [-1.65, 1.2, 0.7], 6), ball(0.15, glow(0xfff2b0), [-1.65, 1.2, -0.7], 6),
  ) },
  icefall: { z: -20, r: 6, build: () => {
    const g = cliff(12, 10, 0x8a9ab0, 0xf4f8fc);
    for (let i = 0; i < 7; i++) g.add(cyl(0.05, 0.6, 3 + (i % 3) * 2.5, 0xbfe4fa, [-3 + i, 10 - (3 + (i % 3) * 2.5) / 2, 3.2], 6, [Math.PI, 0, 0]));
    g.add(box(4, 8, 0.5, 0xa8d8f4, [0, 5, 3.1]));
    return g;
  } },

  // ---- Desert Canyon
  arch: { z: -22, r: 8, build: () => rockArch(0xc9784a, 0xd98a58, 14, 9) },
  saloon: { z: -8, r: 5, build: () => {
    const sign = textPanel('SALOON', 5, 1.1, '#7a3e22', '#f8e0b0');
    sign.position.set(0, 5.4, 1.05);
    const g = group(box(7, 4.8, 2, 0xb07848, [0, 2.4, 0]), box(7.6, 1.6, 2.1, 0xa06838, [0, 5.5, 0]), sign, box(1.4, 1.8, 0.05, 0x5a3a1a, [0, 0.9, 1.02]), box(7, 0.15, 1.6, 0x8a5a30, [0, 2.6, 1.8]));
    for (const x of [-2.4, 2.4]) g.add(box(1.0, 1.0, 0.05, 0x3a2a1a, [x, 1.6, 1.02]), box(1.0, 1.0, 0.05, 0x3a2a1a, [x, 3.8, 1.02]));
    for (const x of [-3.3, -1, 1, 3.3]) g.add(cyl(0.08, 0.08, 2.6, 0x8a5a30, [x, 1.3, 2.5], 6));
    return g;
  } },
  windpump: { z: -14, r: 3, build: () => {
    const g = new THREE.Group();
    for (const [x, z] of [[-1.2, -1.2], [1.2, -1.2], [1.2, 1.2], [-1.2, 1.2]]) g.add(beam([x, 0, z], [x * 0.2, 9, z * 0.2], 0.12, 0x6a6a72));
    const fan = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const blade = box(0.35, 1.6, 0.04, 0xd8d4cc, [0, 1.0, 0]);
      const b = group(blade);
      b.rotation.z = (i / 12) * Math.PI * 2;
      fan.add(b);
    }
    fan.position.set(0, 9.4, 0.5);
    g.add(fan, beam([0, 9.4, 0], [0, 9.4, -2.2], 0.12, 0x6a6a72), box(0.05, 1.2, 1.4, 0xd84a3a, [0, 9.4, -2.4]), cyl(1.4, 1.4, 1.0, 0x8a8a92, [3, 0.5, 0], 14));
    return g;
  } },
  watertower: { z: -12, r: 3, build: () => {
    const g = group(cyl(2, 2, 3, 0x8a5a30, [0, 7.5, 0], 14), cyl(0.2, 2.2, 1.2, 0x5a3a1a, [0, 9.6, 0], 14));
    for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]]) g.add(beam([x, 0, z], [x * 0.9, 6, z * 0.9], 0.2, 0x6a4422));
    g.add(beam([0, 6.5, 0], [2.5, 4, 0], 0.15, 0x6a6a72));
    return g;
  } },
  oldcar: { z: -7, r: 3, build: () => group(
    box(3.6, 0.8, 1.7, 0x9a5a3a, [0, 0.75, 0]), box(1.9, 0.75, 1.6, 0x8a4a2a, [0.2, 1.5, 0]), box(1.7, 0.6, 1.62, 0x5a7a8a, [0.2, 1.5, 0]),
    ...[[-1.2, 0.85], [1.2, 0.85], [-1.2, -0.85], [1.2, -0.85]].map(([x, z]) => cyl(0.38, 0.38, 0.25, 0x30302e, [x, 0.38, z], 10, [Math.PI / 2, 0, 0])),
    ball(0.5, 0x9a8a4a, [-2.6, 0.4, 0.6], 6),
  ) },
  hoodoos: { z: -16, r: 6, build: (r) => {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const h = 4 + r() * 6, x = i * 2.6 - 5;
      g.add(cyl(0.6, 0.9, h, i % 2 ? 0xc9784a : 0xe09a64, [x, h / 2, r() * 2], 7), cyl(1.0, 0.8, 0.8, 0xa85a34, [x, h + 0.3, 0], 7));
    }
    return g;
  } },

  // ---- Jungle Ruins
  temple: { z: -26, r: 9, build: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) g.add(box(16 - i * 3, 2.2, 12 - i * 2, i % 2 ? 0x9a9c84 : 0x8a8c74, [0, 1.1 + i * 2.2, 0]));
    g.add(box(3, 11.8, 1.4, 0xa8aa90, [0, 5.5, 4.2], [-0.36, 0, 0]));
    g.add(box(3.4, 2.6, 3, 0x8a8c74, [0, 12.3, 0]), box(1.2, 1.6, 0.1, 0x2a2a22, [0, 12.0, 1.55]));
    for (let i = 0; i < 6; i++) g.add(ball(0.9, 0x4a9a40, [-7 + i * 2.8, 1 + (i % 3) * 2.4, 5.5 - (i % 3)], 8));
    return g;
  } },
  waterfall: { z: -22, r: 7, build: () => {
    const g = cliff(14, 12, 0x6a7a5a, 0x3f8f3f);
    const fall = box(3.5, 12, 0.4, 0x8ad8f0, [0, 6, 3.3]);
    const pool = mesh(new THREE.CircleGeometry(4, 20), 0x3aa8c8, [0, 0.15, 5], [-Math.PI / 2, 0, 0]);
    pool.scale.y = 0.5;
    g.add(fall, pool, box(4.5, 0.6, 1.4, 0xe8f8ff, [0, 0.3, 4]));
    for (let i = 0; i < 4; i++) g.add(box(0.2, 12, 0.05, 0xd8f4ff, [-1.2 + i * 0.8, 6, 3.55]));
    return g;
  } },
  ropebridge: { z: -14, r: 9, build: () => {
    const g = new THREE.Group();
    for (const x of [-8, 8]) g.add(box(3, 7, 3, 0x8a8c74, [x, 3.5, 0]), ball(1.3, 0x4a9a40, [x, 7.3, 0], 8));
    for (let i = 0; i <= 16; i++) {
      const x = -6.5 + i * (13 / 16), sag = 5.6 - 1.5 * Math.sin((i / 16) * Math.PI);
      g.add(box(0.6, 0.08, 1.3, 0x8a5a30, [x, sag, 0]));
      if (i % 2 === 0) for (const z of [-0.65, 0.65]) g.add(cyl(0.02, 0.02, 1.0, 0x6a4422, [x, sag + 0.5, z], 4));
    }
    for (const z of [-0.65, 0.65]) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 16; i++) pts.push(new THREE.Vector3(-6.5 + i * (13 / 16), 6.6 - 1.2 * Math.sin((i / 16) * Math.PI), z));
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x5a3a1a })));
    }
    return g;
  } },
  bighead: { z: -16, r: 4, build: () => group(
    box(4, 5, 3.6, 0x8a8c74, [0, 2.5, 0]), box(4.4, 1, 3.8, 0x7a7c64, [0, 5.3, 0]), box(1.2, 0.5, 0.3, 0x3a3a32, [-0.9, 3.6, 1.82]), box(1.2, 0.5, 0.3, 0x3a3a32, [0.9, 3.6, 1.82]),
    box(0.8, 1.4, 0.8, 0x7a7c64, [0, 2.6, 1.9]), box(2.2, 0.35, 0.2, 0x3a3a32, [0, 1.3, 1.82]), ball(0.9, 0x4a9a40, [1.6, 5.8, 1.0], 8), ball(0.7, 0x5aa848, [-1.8, 4.2, 1.6], 8),
  ) },
  totems: { z: -9, r: 4, build: () => {
    const g = new THREE.Group();
    const cols = [0xc84a3a, 0x3a9a8a, 0xf2c040, 0x8a5a30];
    for (let t = 0; t < 3; t++) for (let i = 0; i < 3 + t; i++) {
      const x = t * 2.6 - 2.6;
      g.add(box(1.1, 1.1, 1.1, cols[(i + t) % 4], [x, 0.55 + i * 1.1, 0]), box(0.25, 0.25, 0.1, 0xf4f0e8, [x - 0.25, 0.75 + i * 1.1, 0.55]), box(0.25, 0.25, 0.1, 0xf4f0e8, [x + 0.25, 0.75 + i * 1.1, 0.55]));
    }
    return g;
  } },

  // ---- Volcano
  lavafall: { z: -26, r: 7, build: () => {
    const g = cliff(20, 10, 0x3a3336, 0x48404a);
    g.add(box(2.6, 10, 0.4, glow(0xff7a1a), [0, 5, 3.3]), box(1.0, 10, 0.1, glow(0xffd040), [0.3, 5, 3.55]));
    const pool = mesh(new THREE.CircleGeometry(4, 20), glow(0xff5a10), [0, 0.15, 5], [-Math.PI / 2, 0, 0]);
    pool.scale.y = 0.5;
    g.add(pool);
    return g;
  } },
  bones: { z: -10, r: 5, build: () => {
    // A giant ribcage half sunk in the ash, with its skull in front.
    const bone = 0xeee6d0;
    const g = group(beam([-5, 2.0, 0], [4.5, 2.6, 0], 0.4, bone), ball(1.1, bone, [6.0, 0.9, 0.6], 8), box(1.8, 0.7, 1.0, bone, [7.3, 0.6, 0.6]));
    for (let i = 0; i < 7; i++) {
      const rad = 2.0 + Math.sin((i / 6) * Math.PI) * 0.6;
      const rib = mesh(new THREE.TorusGeometry(rad, 0.13, 5, 12, Math.PI), bone, [-4 + i * 1.3, -0.2, 0], [0, Math.PI / 2, 0]);
      rib.scale.y = 1.1;
      g.add(rib);
    }
    // Turned a little, so the ribs read as arches rather than edge-on bars.
    g.rotation.y = 0.75;
    return group(g);
  } },
  spire: { z: -24, r: 4, build: () => {
    const g = group(cyl(0.6, 3.2, 18, 0x221e24, undefined, 6), cyl(0, 0.9, 3, 0x2e2a30, [0, 19.5, 0], 6));
    for (let i = 0; i < 5; i++) g.add(box(0.35, 0.6, 0.1, glow(0xff8a2a), [0.3 * (i % 2 ? 1 : -1), 3 + i * 3, 3.2 - i * 0.5]));
    return g;
  } },
  basaltarch: { z: -18, r: 7, build: () => rockArch(0x2e2a30, 0x3a3336, 11, 7) },
  geyser: { z: -12, r: 3, build: () => {
    const g = group(mesh(new THREE.CylinderGeometry(1.2, 2.6, 1.4, 9), 0x4a4044, [0, 0.7, 0]), cyl(1.1, 1.1, 0.08, glow(0xff8a2a), [0, 1.42, 0], 9));
    for (let i = 0; i < 7; i++) g.add(ball(0.6 + i * 0.18, 0x9a9094, [Math.sin(i * 1.7) * (0.2 + i * 0.12), 1.9 + i * 0.8, 0], 8));
    return g;
  } },
  // ---- Autumn Farm
  barn: { z: -20, r: 9, build: () => {
    // A red barn with a gambrel roof, white trim, crossed doors and a hayloft full of hay.
    const red = 0xb8382c, white = 0xf4f0e6, roof = 0x5a4a44;
    const W = 12, D = 9, H = 5.5;
    const g = group(box(W, H, D, red));
    for (const sgn of [1, -1]) {
      g.add(box(W + 0.6, 0.25, 3.6, roof, [0, H + 1.4, sgn * 3.15], [sgn * 0.9, 0, 0]));
      g.add(box(W + 0.6, 0.25, 3.0, roof, [0, H + 3.4, sgn * 1.15], [sgn * 0.42, 0, 0]));
    }
    // The gable ends, as a filled outline.
    const shape = new THREE.Shape([[-D / 2, 0], [D / 2, 0], [D / 2, H], [D / 2 - 1.8, H + 2.6], [0, H + 3.9], [-D / 2 + 1.8, H + 2.6], [-D / 2, H]].map(([x, y]) => new THREE.Vector2(x, y)));
    for (const sx of [-1, 1]) g.add(mesh(new THREE.ShapeGeometry(shape), red, [sx * (W / 2 + 0.01), 0, 0], [0, sx * Math.PI / 2, 0]));
    // The long wall facing the track (+z): two big doors with white crosses.
    const fz = D / 2 + 0.02;
    for (const x of [-3, 3]) {
      g.add(beam([x - 1.7, 0.1, fz + 0.05], [x + 1.7, 3.7, fz + 0.05], 0.18, white), beam([x + 1.7, 0.1, fz + 0.05], [x - 1.7, 3.7, fz + 0.05], 0.18, white));
      g.add(box(3.7, 0.18, 0.1, white, [x, 3.8, fz + 0.04]), box(0.18, 3.8, 0.1, white, [x - 1.8, 1.9, fz + 0.04]), box(0.18, 3.8, 0.1, white, [x + 1.8, 1.9, fz + 0.04]));
    }
    for (const x of [-W / 2 + 0.1, W / 2 - 0.1]) g.add(box(0.2, H, 0.12, white, [x, H / 2, fz + 0.03]));
    g.add(box(W, 0.2, 0.12, white, [0, H - 0.1, fz + 0.03]));
    // A hayloft door in the roof with hay poking out, and a weathervane.
    g.add(box(2.2, 1.6, 0.6, white, [0, H + 1.5, fz - 1.6]), box(1.8, 1.2, 0.62, 0x3a2a20, [0, H + 1.5, fz - 1.58]), ball(0.6, 0xe8c46c, [0, H + 1.2, fz - 1.2], 8));
    g.add(cyl(0.06, 0.06, 1.2, 0x6a6a72, [0, H + 4.4, 0], 6), box(0.9, 0.05, 0.25, 0x6a6a72, [0.2, H + 4.9, 0]));
    return g;
  } },
  silos: { z: -16, r: 5, build: () => {
    const g = new THREE.Group();
    for (const [x, h, r] of [[-2.2, 11, 2.0], [2.0, 8.5, 1.7]] as const) {
      g.add(cyl(r, r, h, 0xd8dce0, [x, h / 2, 0], 18));
      for (let y = 1.5; y < h; y += 1.5) g.add(cyl(r + 0.04, r + 0.04, 0.12, 0xa8acb2, [x, y, 0], 18));
      g.add(mesh(new THREE.SphereGeometry(r, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xb8382c, [x, h, 0]));
      g.add(beam([x + r * 0.6, 0.2, r * 0.75], [x + r * 0.6, h, r * 0.75], 0.08, 0x6a6a72));
    }
    g.add(beam([-0.6, 9.5, 0], [1.2, 7.8, 0], 0.4, 0x8a8e94));
    return g;
  } },
  tractor: { z: -8, r: 5, build: () => {
    // A little green tractor towing a trailer of hay bales.
    const green = 0x3a9a3a, yellow = 0xf2c040, tyre = 0x2a2828;
    const wheel = (x: number, r: number, z: number) => group(cyl(r, r, 0.5, tyre, [x, r, z], 16, [Math.PI / 2, 0, 0]), cyl(r * 0.55, r * 0.55, 0.52, yellow, [x, r, z], 12, [Math.PI / 2, 0, 0]));
    const g = group(
      box(2.0, 1.0, 1.3, green, [0.6, 1.3, 0]), box(1.1, 1.5, 1.3, green, [-0.9, 2.0, 0]), box(0.9, 0.8, 1.32, 0x9ad0e8, [-0.9, 2.3, 0]),
      box(1.4, 0.12, 1.5, green, [-0.9, 2.82, 0]), cyl(0.08, 0.08, 1.1, 0x404040, [1.0, 2.3, 0.3], 8),
      wheel(-1.0, 0.85, 0.75), wheel(-1.0, 0.85, -0.75), wheel(1.3, 0.5, 0.7), wheel(1.3, 0.5, -0.7),
    );
    const trailer = group(box(3.4, 0.25, 1.8, 0x8a5a30, [0, 0.9, 0]), wheel(0, 0.45, 0.95), wheel(0, 0.45, -0.95), beam([1.7, 0.9, 0], [2.6, 0.7, 0], 0.12, 0x404040));
    for (const [x, y] of [[-1.0, 1.4], [0, 1.4], [1.0, 1.4], [-0.5, 1.9], [0.5, 1.9]]) trailer.add(box(0.95, 0.5, 1.4, 0xe8c46c, [x, y, 0]));
    trailer.position.x = -4.6;
    g.add(trailer);
    return g;
  } },
  combine: { z: -14, r: 6, build: () => {
    // A big combine harvester with its reel out in front and a grain pipe.
    const body = 0xd84a2a, dark = 0x3a3434;
    const g = group(
      box(4.0, 2.4, 2.6, body, [0, 2.4, 0]), box(1.6, 1.4, 1.8, body, [1.2, 4.3, 0]), box(1.3, 1.0, 1.82, 0x9ad0e8, [1.25, 4.4, 0]),
      cyl(1.1, 1.1, 0.6, dark, [1.2, 1.1, 1.2], 16, [Math.PI / 2, 0, 0]), cyl(1.1, 1.1, 0.6, dark, [1.2, 1.1, -1.2], 16, [Math.PI / 2, 0, 0]),
      cyl(0.6, 0.6, 0.5, dark, [-1.5, 0.6, 1.1], 12, [Math.PI / 2, 0, 0]), cyl(0.6, 0.6, 0.5, dark, [-1.5, 0.6, -1.1], 12, [Math.PI / 2, 0, 0]),
      box(1.2, 0.8, 5.0, 0xf2c040, [3.0, 1.0, 0]), cyl(0.7, 0.7, 4.6, 0xf2c040, [3.4, 1.6, 0], 8, [Math.PI / 2, 0, 0]),
      beam([-1.6, 3.4, -0.8], [-3.6, 4.6, 1.4], 0.35, body),
    );
    for (let i = 0; i < 6; i++) g.add(beam([3.4 + Math.cos(i) * 0.7, 1.6 + Math.sin(i) * 0.7, -2.3], [3.4 + Math.cos(i) * 0.7, 1.6 + Math.sin(i) * 0.7, 2.3], 0.06, 0x8a6a2a));
    return g;
  } },
  maze: { z: -22, r: 10, build: (r) => {
    // A maize maze: blocks of tall corn with paths between, and a lookout tower to see over it.
    const g = new THREE.Group();
    const corn = 0xa8b84a, tops = 0xd8c860;
    for (let i = -4; i <= 4; i++) for (let j = -2; j <= 2; j++) {
      if (r() < 0.32) continue;
      g.add(box(1.9, 2.4, 1.9, corn, [i * 2.2, 1.2, j * 2.2]), box(1.9, 0.25, 1.9, tops, [i * 2.2, 2.5, j * 2.2]));
    }
    const tower = group(box(2.2, 0.15, 2.2, 0x8a5a30, [0, 4.5, 0]), box(2.2, 0.8, 0.08, 0x8a5a30, [0, 4.95, 1.05]), box(2.6, 0.15, 2.6, 0xb8382c, [0, 6.6, 0]));
    for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) tower.add(cyl(0.08, 0.08, 6.6, 0x6a4422, [x, 3.3, z], 6));
    tower.add(cyl(0.04, 0.04, 1.4, 0x404040, [0, 7.3, 0], 6), box(0.8, 0.5, 0.03, 0xf2c040, [0.42, 7.7, 0]));
    tower.position.set(10.5, 0, 0);
    g.add(tower);
    return g;
  } },
  farmhouse: { z: -14, r: 6, build: () => {
    const wall = 0xf2e8d4, roof = 0x8a4a3a;
    const g = group(box(8, 4.2, 5, wall), box(8.6, 0.25, 3.6, roof, [0, 5.0, 1.3], [0.62, 0, 0]), box(8.6, 0.25, 3.6, roof, [0, 5.0, -1.3], [-0.62, 0, 0]));
    const shape = new THREE.Shape([[-2.5, 0], [2.5, 0], [0, 1.9]].map(([x, y]) => new THREE.Vector2(x, y)));
    for (const sx of [-1, 1]) g.add(mesh(new THREE.ShapeGeometry(shape), wall, [sx * 4.01, 4.2, 0], [0, sx * Math.PI / 2, 0]));
    g.add(box(0.8, 2.2, 0.8, 0x9a6a5a, [2.5, 5.6, -0.6]));
    for (const x of [-2.6, 2.6]) {
      g.add(box(1.3, 1.2, 0.06, 0x5a8ab0, [x, 2.8, 2.52]), box(1.5, 0.12, 0.1, 0xffffff, [x, 2.15, 2.55]));
      g.add(box(0.3, 1.2, 0.06, 0x3a7a4a, [x - 0.85, 2.8, 2.53]), box(0.3, 1.2, 0.06, 0x3a7a4a, [x + 0.85, 2.8, 2.53]));
    }
    g.add(box(1.1, 2.1, 0.06, 0x3a7a4a, [0, 1.05, 2.52]), box(3.0, 0.15, 1.4, 0x8a5a30, [0, 2.4, 3.1]));
    for (const x of [-1.3, 1.3]) g.add(cyl(0.07, 0.07, 2.4, 0xffffff, [x, 1.2, 3.7], 6));
    // A wisp of chimney smoke.
    for (let i = 0; i < 4; i++) g.add(ball(0.35 + i * 0.15, 0xe8e8e8, [2.5 + i * 0.4, 7.0 + i * 0.6, -0.6], 8));
    return g;
  } },
  haystack: { z: -9, r: 4, build: () => {
    // A pyramid of square bales with a pitchfork leaning on it.
    const g = new THREE.Group();
    [5, 4, 3, 2].forEach((n, row) => {
      for (let i = 0; i < n; i++) g.add(box(1.0, 0.48, 0.55, (i + row) % 2 ? 0xe8c46c : 0xdcb45a, [(i - (n - 1) / 2) * 1.04, 0.24 + row * 0.5, row * -0.2]));
    });
    g.add(beam([2.6, 0, 0.6], [1.9, 2.0, 0.4], 0.06, 0x8a5a30), box(0.4, 0.04, 0.04, 0x8a8a92, [1.85, 2.08, 0.4]));
    return g;
  } },
  coop: { z: -8, r: 4, build: () => {
    // A hen house on legs with a ramp, and hens pecking about.
    const g = group(box(2.6, 1.6, 1.8, 0xd8b070, [0, 1.6, 0]), box(3.0, 0.15, 1.2, 0xb8382c, [0, 2.65, 0.45], [0.55, 0, 0]), box(3.0, 0.15, 1.2, 0xb8382c, [0, 2.65, -0.45], [-0.55, 0, 0]));
    for (const [x, z] of [[-1.1, -0.7], [1.1, -0.7], [1.1, 0.7], [-1.1, 0.7]]) g.add(cyl(0.07, 0.07, 0.8, 0x6a4422, [x, 0.4, z], 6));
    g.add(box(0.5, 0.6, 0.05, 0x3a2a20, [0.6, 1.4, 0.92]), beam([0.6, 0.85, 0.95], [0.6, 0, 2.0], 0.4, 0x8a5a30));
    for (const [x, z] of [[-1.5, 1.6], [1.8, 1.9], [-0.4, 2.3], [2.4, 0.6]]) {
      g.add(ball(0.18, 0xf4eee4, [x, 0.2, z], 8), ball(0.1, 0xf4eee4, [x + 0.16, 0.36, z], 8), box(0.05, 0.08, 0.03, 0xd83a3a, [x + 0.17, 0.48, z]));
    }
    return g;
  } },
  pumpkinpatch: { z: -7, r: 4, build: (r) => {
    // Giant pumpkins on a vine, and a hand-painted sign.
    const g = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const s = 0.4 + r() * 0.6, x = -3 + i * 1.0 + r() * 0.4, z = (r() - 0.5) * 2;
      const p = ball(s, i % 3 ? 0xf28020 : 0xe06818, [x, s * 0.8, z], 12);
      p.scale.y = 0.8;
      g.add(p, cyl(0.05, 0.07, 0.25, 0x5a7a2a, [x, s * 1.55, z], 6));
    }
    const sign = textPanel('PUMPKINS', 2.4, 0.7, '#f4e8d0', '#c0501a', '#6a4422');
    sign.position.set(3.4, 1.4, 0.3);
    g.add(sign, cyl(0.06, 0.06, 1.4, 0x6a4422, [2.6, 0.7, 0.25], 6), cyl(0.06, 0.06, 1.4, 0x6a4422, [4.2, 0.7, 0.25], 6));
    return g;
  } },
  gingercastle: { z: -24, r: 11, build: () => {
    // A gingerbread castle: biscuit towers with icing trim, candy-cane flagpoles and gumdrop tops.
    const ginger = 0xb8743a, icing = 0xfff6ee, door = 0x6a3a1a;
    const g = group(box(12, 7, 6, ginger, [0, 3.5, 0]));
    for (let x = -5.5; x <= 5.6; x += 1.1) g.add(box(0.7, 0.8, 6.2, ginger, [x, 7.4, 0]), box(0.75, 0.15, 0.1, icing, [x, 7.85, 3.12]));
    g.add(box(12.1, 0.25, 0.1, icing, [0, 6.9, 3.02]));
    for (let x = -5; x <= 5; x += 2.5) g.add(box(2.0, 0.12, 0.1, icing, [x, 6.4, 3.03]));
    for (const [x, h, c] of [[-7, 11, 0xff7ab8], [7, 11, 0x7ad8b0], [0, 13, 0xc8a0f8]] as const) {
      g.add(cyl(1.8, 1.9, h, ginger, [x, h / 2, 0.5], 14));
      for (let y = 2.5; y < h; y += 2.5) g.add(cyl(1.95, 1.95, 0.18, icing, [x, y, 0.5], 14));
      g.add(cyl(0.05, 2.3, 3.2, c, [x, h + 1.6, 0.5], 14), ball(0.35, icing, [x, h + 3.3, 0.5], 10));
      g.add(box(0.6, 1.0, 0.2, 0xfff0a0, [x, h - 2.5, 2.35]));
    }
    g.add(mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 16, 1, false, 0, Math.PI), door, [0, 3.2, 3.05], [Math.PI / 2, 0, 0]), box(3.2, 3.2, 0.3, door, [0, 1.6, 3.05]));
    for (const [x, c] of [[-3.5, 0xff5a8a], [-2.4, 0x7ad8b0], [2.4, 0xffd04a], [3.5, 0x8ab8ff]] as const) g.add(ball(0.4, c, [x, 4.5, 3.1], 10));
    const sign = textPanel('CANDY CASTLE', 5, 0.9, '#fff6ee', '#e0407a', '#ff8ac8');
    sign.position.set(0, 5.6, 3.2);
    g.add(sign);
    return g;
  } },
  bigcupcake: { z: -16, r: 6, build: () => {
    // A giant cupcake with a candle on top.
    const g = group(cyl(4.2, 3.4, 4, 0xff7ab8, [0, 2, 0], 24));
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      g.add(box(0.12, 4, 0.2, 0xe85a9a, [Math.cos(a) * 3.85, 2, Math.sin(a) * 3.85], [0, -a, 0]));
    }
    for (const [r, y] of [[4.6, 4.6], [3.8, 5.8], [2.8, 6.9], [1.6, 7.8]] as const) {
      const t = mesh(new THREE.TorusGeometry(r * 0.75, r * 0.32, 10, 28), 0xfff4e8, [0, y, 0], [Math.PI / 2, 0, 0]);
      g.add(t);
    }
    g.add(ball(0.9, 0xe02040, [0, 8.8, 0], 14));
    const cols = [0xffd04a, 0x7ad8b0, 0x8ab8ff, 0xc8a0f8, 0xff5a8a];
    for (let i = 0; i < 30; i++) {
      const a = i * 2.4, r = 1.5 + (i % 5) * 0.6;
      g.add(box(0.35, 0.1, 0.1, cols[i % 5], [Math.cos(a) * r, 5.4 + (5 - (i % 5)) * 0.55, Math.sin(a) * r + 0.3], [0, a, 0.5]));
    }
    g.add(cyl(0.18, 0.18, 1.8, 0x8ab8ff, [1.4, 8.6, 0.6], 8), mesh(new THREE.SphereGeometry(0.25, 8, 6), glow(0xffc040), [1.4, 9.75, 0.6]));
    return g;
  } },
  chocfall: { z: -22, r: 8, build: () => {
    // A chocolate waterfall pouring off a cliff of layer cake into a chocolate pool.
    const g = new THREE.Group();
    const layers = [0xf0c890, 0xff9ac8, 0xf0c890, 0xfff4e8, 0xf0c890] as const;
    const W = 14, lh = 2.1;
    layers.forEach((c, i) => g.add(box(W - i * 0.6, lh, 6 - i * 0.3, c, [0, lh * (i + 0.5), 0])));
    const top = lh * layers.length;
    // Pink icing over the top, dripping down the front.
    g.add(box(W - 2.2, 0.4, 5, 0xff8ac8, [0, top + 0.2, 0]));
    for (let i = 0; i < 16; i++) {
      const x = -5.6 + i * 0.75, d = 0.5 + ((i * 7) % 5) * 0.25;
      if (Math.abs(x) < 2.4) continue;
      g.add(cyl(0.18, 0.18, d, 0xff8ac8, [x, top - d / 2 + 0.2, 2.4], 6), ball(0.2, 0xff8ac8, [x, top - d + 0.2, 2.4], 6));
    }
    const choc = 0x6a3a1a;
    g.add(box(4, top + 0.4, 0.5, choc, [0, (top + 0.4) / 2, 3.3]));
    for (let i = 0; i < 5; i++) g.add(box(0.2, top + 0.4, 0.05, 0x9a5a30, [-1.6 + i * 0.8, (top + 0.4) / 2, 3.58]));
    const pool = mesh(new THREE.CircleGeometry(4.5, 22), choc, [0, 0.15, 5.5], [-Math.PI / 2, 0, 0]);
    pool.scale.y = 0.5;
    g.add(pool, box(5, 0.7, 1.4, 0x8a5030, [0, 0.35, 4.2]));
    for (const [x, c] of [[-5, 0xe02040], [5, 0x7ad8b0], [-3.5, 0xffd04a], [3.6, 0xe02040]] as const) g.add(ball(0.7, c, [x, top + 0.9, 0.5], 10));
    return g;
  } },
  lolliarch: { z: -12, r: 7, build: () => {
    // An arch of giant lollipops with a rainbow sign.
    const g = new THREE.Group();
    const cols = [0xff5a8a, 0xffd04a, 0x7ad8b0, 0x8ab8ff, 0xc8a0f8];
    for (const sx of [-1, 1]) {
      g.add(cyl(0.2, 0.2, 7, 0xfaf6ec, [sx * 5, 3.5, 0], 10));
      const d = cyl(2.2, 2.2, 0.5, cols[sx < 0 ? 0 : 3], [sx * 5, 8.5, 0], 24, [Math.PI / 2, 0, 0]);
      g.add(d);
      for (let r = 0.5; r < 2.1; r += 0.6) g.add(mesh(new THREE.TorusGeometry(r, 0.12, 6, 24), 0xffffff, [sx * 5, 8.5, 0.27]));
    }
    for (let i = 0; i < 5; i++) {
      const t = mesh(new THREE.TorusGeometry(5 - i * 0.35, 0.18, 6, 30, Math.PI), cols[i], [0, 7, -0.3]);
      g.add(t);
    }
    const sign = textPanel('SWEET!', 3.2, 1, '#fff6ee', '#e0407a', '#ffd04a');
    sign.position.set(0, 11.3, 0);
    g.add(sign);
    return g;
  } },
  gingerhouse: { z: -14, r: 6, build: () => {
    // A gingerbread house with icing on the roof and sweets for decoration.
    const ginger = 0xb8743a, icing = 0xfff6ee;
    const g = group(box(7, 4, 5, ginger, [0, 2, 0]));
    for (const sgn of [1, -1]) {
      g.add(box(7.8, 0.35, 3.9, 0x9a5a2a, [0, 5.3, sgn * 1.45], [sgn * 0.75, 0, 0]));
      for (let x = -3.5; x <= 3.6; x += 0.7) g.add(ball(0.22, icing, [x, 4.15 + 0.1, sgn * 2.9], 8));
    }
    const shape = new THREE.Shape([[-2.5, 0], [2.5, 0], [0, 2.6]].map(([x, y]) => new THREE.Vector2(x, y)));
    for (const sx of [-1, 1]) g.add(mesh(new THREE.ShapeGeometry(shape), ginger, [sx * 3.51, 4, 0], [0, sx * Math.PI / 2, 0]));
    g.add(box(1.4, 2.4, 0.2, 0x6a3a1a, [0, 1.2, 2.55]), ball(0.15, 0xffd04a, [0.45, 1.2, 2.7], 8));
    for (const x of [-2.4, 2.4]) {
      g.add(box(1.4, 1.2, 0.2, 0xfff0a0, [x, 2.4, 2.55]), box(1.6, 0.15, 0.25, icing, [x, 1.75, 2.6]), box(0.12, 1.2, 0.22, icing, [x, 2.4, 2.58]));
    }
    const cols = [0xff5a8a, 0x7ad8b0, 0xffd04a, 0x8ab8ff];
    for (let i = 0; i < 10; i++) g.add(ball(0.22, cols[i % 4], [-3.2 + i * 0.7, 0.25, 2.8], 8));
    g.add(box(0.9, 1.6, 0.9, 0xe02040, [2, 6, -0.6]), box(1.0, 0.2, 1.0, icing, [2, 6.85, -0.6]));
    return g;
  } },
  gumball: { z: -10, r: 4, build: () => {
    // A giant gumball machine full of coloured balls.
    const g = group(cyl(1.6, 2.0, 3, 0xe02040, [0, 1.5, 0], 18), box(0.9, 0.9, 0.3, 0xc8c8d0, [0, 1.8, 1.8]), cyl(0.3, 0.3, 0.2, 0xc8c8d0, [0, 1.8, 2.0], 10, [Math.PI / 2, 0, 0]));
    const globe = mesh(new THREE.SphereGeometry(2.6, 24, 16), new THREE.MeshBasicMaterial({ color: 0xe8f8ff, transparent: true, opacity: 0.35, depthWrite: false }), [0, 5.4, 0]);
    globe.userData.outlineParameters = { visible: false };
    const cols = [0xff5a8a, 0x7ad8b0, 0xffd04a, 0x8ab8ff, 0xc8a0f8, 0xff9a40];
    for (let i = 0; i < 40; i++) {
      const a = i * 2.4, y = 3.3 + (i / 40) * 3.6, rr = Math.sqrt(Math.max(0, 2.2 * 2.2 - (y - 5.4) ** 2)) * (0.4 + 0.6 * ((i * 7) % 10) / 10);
      g.add(ball(0.45, cols[i % 6], [Math.cos(a) * rr, y, Math.sin(a) * rr], 8));
    }
    g.add(globe, cyl(1.2, 1.6, 0.6, 0xe02040, [0, 8.1, 0], 16), ball(0.4, 0xe02040, [0, 8.6, 0], 10));
    return g;
  } },
  layercake: { z: -18, r: 7, build: () => {
    // A tall layer cake with dripping icing and candles.
    const g = new THREE.Group();
    const tiers = [[5, 3, 0xffd0e0], [3.8, 2.6, 0xd0f0ff], [2.6, 2.2, 0xfff0b0]] as const;
    let y = 0;
    for (const [r, h, c] of tiers) {
      g.add(cyl(r, r, h, c, [0, y + h / 2, 0], 28));
      g.add(cyl(r + 0.05, r + 0.05, 0.4, 0xfff6ee, [0, y + h - 0.2, 0], 28));
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2, d = 0.4 + ((i * 5) % 7) * 0.12;
        g.add(cyl(0.18, 0.18, d, 0xfff6ee, [Math.cos(a) * (r + 0.05), y + h - 0.4 - d / 2, Math.sin(a) * (r + 0.05)], 6));
      }
      y += h;
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      g.add(cyl(0.12, 0.12, 1.2, [0xff5a8a, 0x8ab8ff, 0x7ad8b0, 0xffd04a, 0xc8a0f8][i], [Math.cos(a) * 1.6, y + 0.6, Math.sin(a) * 1.6], 8));
      g.add(mesh(new THREE.SphereGeometry(0.18, 8, 6), glow(0xffc040), [Math.cos(a) * 1.6, y + 1.35, Math.sin(a) * 1.6]));
    }
    g.add(ball(0.7, 0xe02040, [0, y + 0.5, 0], 12));
    return g;
  } },
  donutwheel: { z: -20, r: 10, build: () => {
    // A big wheel with a doughnut for a rim.
    const g = bigWheel(7, 0xff8ac8, [0x7ad8b0, 0xffd04a, 0x8ab8ff, 0xc8a0f8]);
    const d = mesh(new THREE.TorusGeometry(7, 0.9, 12, 40), 0xd8a060, [0, 8.5, -0.3]);
    const ice = mesh(new THREE.TorusGeometry(7, 0.75, 10, 40), 0xff8ac8, [0, 8.5, 0.15]);
    ice.scale.z = 0.7;
    g.add(d, ice);
    const cols = [0xffd04a, 0x7ad8b0, 0xffffff, 0x8ab8ff];
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2 + 0.05;
      g.add(box(0.5, 0.14, 0.14, cols[i % 4], [Math.cos(a) * 7.1, 8.5 + Math.sin(a) * 7.1, 0.7], [0, 0, a + i]));
    }
    return g;
  } },
  gantry: { z: -17, r: 10, build: () => {
    // A ship-to-shore container crane: tall legs, a boom reaching out over the water, a box on the hook.
    const red = 0xd8502a, white = 0xf4f0e8;
    const g = new THREE.Group();
    for (const x of [-6, 6]) for (const z of [-3, 3]) {
      g.add(box(0.8, 22, 0.8, red, [x, 11, z]));
      g.add(box(1.4, 0.8, 1.4, 0x3a3a3e, [x, 0.4, z]));
    }
    for (const y of [8, 15, 22]) for (const z of [-3, 3]) g.add(box(12.8, 0.7, 0.7, red, [0, y, z]));
    for (const x of [-6, 6]) g.add(beam([x, 1, -3], [x, 14, 3], 0.35, red), beam([x, 14, -3], [x, 22, 3], 0.35, red));
    // The boom, out over the water behind (-z), and a machine house on top.
    g.add(box(1.6, 1.4, 34, red, [0, 23.5, -9]), box(5, 3.2, 5, white, [0, 25.6, 1.5]));
    g.add(beam([0, 30, 1.5], [0, 23.8, -24], 0.25, red), beam([0, 30, 1.5], [0, 23.8, 6], 0.25, red), box(1, 5, 1, red, [0, 27.5, 1.5]));
    g.add(beam([0, 23, -6], [0, 12, -6], 0.08, 0x3a3a3e), box(6.1, 2.6, 2.44, 0x2a6ab0, [0, 10.7, -6]));
    const sign = textPanel('PUMP LINE', 6, 1.4, '#f4f0e8', '#d8502a', '#d8502a');
    sign.position.set(0, 18.5, 3.5);
    g.add(sign);
    return g;
  } },
  warehouse: { z: -17, r: 9, build: () => {
    // A brick warehouse with a curved roof, big loading doors and the harbour's name on it.
    const brick = 0xa8583a, roof = 0x6a7a88, trim = 0xf0e8d8;
    const g = group(box(16, 7, 8, brick, [0, 3.5, 0]));
    const vault = mesh(new THREE.CylinderGeometry(4.2, 4.2, 16.4, 20, 1, false, -Math.PI / 2, Math.PI), roof, [0, 7, 0], [0, 0, Math.PI / 2]);
    vault.scale.set(1, 1, 0.45);
    g.add(vault);
    for (const x of [-5, 0, 5]) {
      g.add(box(3.4, 4.6, 0.2, 0x3a4a58, [x, 2.3, 4.05]));
      for (let k = 0; k < 6; k++) g.add(box(3.4, 0.08, 0.22, 0x5a6a78, [x, 0.4 + k * 0.75, 4.06]));
      g.add(box(3.8, 0.25, 0.3, trim, [x, 4.75, 4.1]));
    }
    for (const x of [-7.4, 7.4]) g.add(box(0.4, 7, 0.3, trim, [x, 3.5, 4.06]));
    const sign = textPanel('HARBOUR', 7, 1.2, '#f0e8d8', '#2a4a6a', '#2a4a6a');
    sign.position.set(0, 6, 4.12);
    g.add(sign);
    return g;
  } },
  fishmarket: { z: -11, r: 6, build: () => {
    // Striped market stalls with fish on ice and crates of crabs.
    const g = new THREE.Group();
    const stripes = [[0x2a6ab0, 0xf4f0e8], [0xd8442a, 0xf4f0e8], [0x3a8a4a, 0xf4f0e8]];
    stripes.forEach(([c1, c2], i) => {
      const x = (i - 1) * 4.2;
      g.add(box(3.6, 1, 1.6, 0x8a6a4a, [x, 0.5, 0]), box(3.6, 0.15, 1.6, 0xe8f4ff, [x, 1.05, 0]));
      for (let k = 0; k < 6; k++) g.add(box(0.6, 0.1, 1.9, k % 2 ? c1 : c2, [x - 1.5 + k * 0.6, 2.6 - 0.15, 0.2], [0.3, 0, 0]));
      for (const sx of [-1.7, 1.7]) g.add(box(0.1, 2.5, 0.1, 0xe8e8e8, [x + sx, 1.25, 0.75]), box(0.1, 2.5, 0.1, 0xe8e8e8, [x + sx, 1.25, -0.75]));
      for (let k = 0; k < 5; k++) {
        const fish = ball(0.14, [0x9ab0c0, 0xf09080, 0xb8c0c8][(k + i) % 3], [x - 1.2 + k * 0.6, 1.2, 0.2], 8);
        fish.scale.set(2.4, 0.6, 0.8);
        g.add(fish);
      }
    });
    const sign = textPanel('FRESH FISH', 4, 0.8, '#f4f0e8', '#2a6ab0', '#2a6ab0');
    sign.position.set(0, 3.4, 0.2);
    g.add(sign, cyl(0.06, 0.06, 1, 0xe8e8e8, [-1.6, 2.9, 0.2], 6), cyl(0.06, 0.06, 1, 0xe8e8e8, [1.6, 2.9, 0.2], 6));
    return g;
  } },
  harbourclock: { z: -15, r: 4, build: () => {
    // The harbour master's office: a white tower with a clock, a flag and a weather vane.
    const white = 0xf4f0e8, blue = 0x2a4a6a;
    const g = group(box(6, 4, 5, white, [0, 2, 0]), box(6.6, 0.4, 5.6, blue, [0, 4.2, 0]), box(3, 7, 3, white, [0, 7.5, 0]));
    g.add(mesh(new THREE.ConeGeometry(2.4, 2.4, 4), blue, [0, 12.2, 0], [0, Math.PI / 4, 0]));
    const face = mesh(new THREE.CircleGeometry(1, 24), 0xfffbe8, [0, 9, 1.52]);
    g.add(face, box(0.08, 0.7, 0.05, 0x222222, [0, 9.3, 1.56]), box(0.5, 0.08, 0.05, 0x222222, [0.22, 9, 1.56]));
    g.add(mesh(new THREE.TorusGeometry(1, 0.08, 6, 24), blue, [0, 9, 1.52]));
    for (const x of [-1.8, 0, 1.8]) g.add(box(1, 1.3, 0.1, 0x8ab8d8, [x, 2.4, 2.52]));
    g.add(cyl(0.05, 0.05, 3, 0xd8d8d8, [2.6, 5.7, 0], 6), box(1.2, 0.7, 0.04, 0xd84a2a, [3.2, 6.8, 0]));
    return g;
  } },
  cargoship: { z: -48, r: 0, on: 'sea', build: () => {
    // A big container ship at anchor, stacked high.
    const g = group(box(60, 6, 12, 0x2a3a58, [0, 1.5, 0]), box(60.2, 1.2, 12.2, 0xc83a2a, [0, -0.9, 0]));
    g.add(mesh(new THREE.ConeGeometry(6, 10, 4, 1), 0x2a3a58, [33, 1.5, 0], [0, Math.PI / 4, -Math.PI / 2]));
    g.add(box(8, 10, 11, 0xf4f0e8, [-24, 9.5, 0]), box(9, 1, 12, 0x2a3a58, [-24, 14.8, 0]), box(1.4, 4, 1.4, 0xd8502a, [-26, 17, 0]));
    for (let x = -24; x < -20; x += 1.5) g.add(box(0.1, 1, 11.1, 0x2a3a4a, [x, 12, 0]));
    const cols = [0xc8442a, 0x2a6ab0, 0x3a8a4a, 0xe0a030, 0x8a8a92, 0x2a8a8a];
    for (let i = 0; i < 10; i++) {
      const h = 2 + ((i * 7) % 4);
      for (let k = 0; k < h; k++) g.add(box(3.8, 2.5, 11, cols[(i * 3 + k * 5) % 6], [-16 + i * 4.4, 5.75 + k * 2.6, 0]));
    }
    return g;
  } },
  tugboat: { z: -30, r: 0, on: 'sea', build: () => {
    // A little red tug with a fat tyre bumper and a puffing funnel.
    const g = group(box(9, 2.2, 3.6, 0xc83a2a, [0, 0.6, 0]), box(9.2, 0.5, 3.8, 0x2a2a2e, [0, -0.3, 0]));
    g.add(mesh(new THREE.ConeGeometry(1.8, 3, 4), 0xc83a2a, [5.2, 0.6, 0], [0, Math.PI / 4, -Math.PI / 2]));
    g.add(box(3.5, 2.2, 2.8, 0xf4f0e8, [-0.8, 2.8, 0]), box(3.8, 0.3, 3.1, 0x2a4a6a, [-0.8, 4, 0]), cyl(0.5, 0.6, 2.4, 0x2a2a2e, [-2.8, 3.6, 0], 12), box(1.2, 0.3, 1.25, 0xe0a030, [-2.8, 4.2, 0]));
    for (const x of [-1.8, -0.8, 0.2]) g.add(box(0.6, 0.7, 0.05, 0x8ab8d8, [x, 3.1, 1.42]));
    g.add(mesh(new THREE.TorusGeometry(1, 0.35, 8, 20), 0x2a2a2e, [6.2, 0.4, 0], [0, Math.PI / 2, 0]));
    for (let i = 0; i < 3; i++) g.add(ball(0.5 + i * 0.25, 0xe8e8ec, [-2.8 - i * 0.8, 5.4 + i * 1.1, 0], 8));
    return g;
  } },
  ferry: { z: -40, r: 0, on: 'sea', build: () => {
    // A car ferry: white decks, a blue hull, a funnel with a star.
    const g = group(box(40, 5, 10, 0x2a5aa8, [0, 1, 0]), box(38, 3, 9.5, 0xf4f0e8, [-1, 5, 0]), box(30, 2.6, 9, 0xf4f0e8, [-3, 7.8, 0]));
    for (let x = -18; x < 18; x += 2) g.add(box(1.2, 0.8, 0.05, 0x3a5a7a, [x, 5.4, 4.8]), box(1.2, 0.8, 0.05, 0x3a5a7a, [x - 3, 8, 4.55]));
    g.add(cyl(1.6, 1.8, 5, 0xf4f0e8, [-8, 11.5, 0], 14), cyl(1.62, 1.62, 1.2, 0x2a5aa8, [-8, 13.4, 0], 14));
    g.add(mesh(new THREE.ConeGeometry(5, 7, 4), 0x2a5aa8, [22, 1, 0], [0, Math.PI / 4, -Math.PI / 2]));
    const sign = textPanel('ISLAND FERRY', 12, 1.4, '#f4f0e8', '#2a5aa8');
    sign.position.set(0, 2, 5.05);
    g.add(sign);
    return g;
  } },
  pirateship: { z: -38, r: 0, on: 'sea', build: () => {
    // A pirate galleon at anchor: dark hull, gold trim, three masts with sails and the black flag.
    const hull = 0x4a2a18, trim = 0xe0b040, sail = 0xf4ecd8;
    const g = group(box(22, 4, 7, hull, [0, 1.5, 0]), box(22.2, 0.4, 7.2, trim, [0, 3.4, 0]));
    g.add(box(6, 3, 7, hull, [-9, 5, 0]), box(6.2, 0.3, 7.2, trim, [-9, 6.5, 0]), mesh(new THREE.ConeGeometry(3.5, 6, 4), hull, [13, 1.8, 0], [0, Math.PI / 4, -Math.PI / 2]));
    for (let x = -6; x <= 8; x += 3.5) g.add(box(0.8, 0.8, 0.1, 0x1a1a1a, [x, 2, 3.55]), cyl(0.15, 0.15, 0.8, 0x2a2a2a, [x, 2, 3.9], 8, [Math.PI / 2, 0, 0]));
    for (const [x, h] of [[-5, 14], [2, 17], [9, 12]] as const) {
      g.add(cyl(0.25, 0.3, h, 0x6a4422, [x, 3.5 + h / 2, 0], 8));
      for (const [y, w] of [[0.35, 1], [0.65, 0.8]] as const) {
        const s = mesh(new THREE.PlaneGeometry(6 * w, 3.6 * w, 4, 1), new THREE.MeshLambertMaterial({ color: sail, side: THREE.DoubleSide }), [x, 3.5 + h * y + 1, 0.5]);
        const p = s.geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let k = 0; k < p.count; k++) p.setZ(k, 0.6 * Math.cos((p.getX(k) / (3 * w)) * Math.PI / 2));
        s.geometry.computeVertexNormals();
        g.add(s);
      }
    }
    const flag = textPanel('☠', 2.6, 1.6, '#1a1a1a', '#ffffff');
    flag.position.set(2, 21.5, 0);
    g.add(flag);
    return g;
  } },
  skullrock: { z: -30, r: 0, on: 'sea', build: () => {
    // A great rock in the shape of a skull, waves round its foot.
    const rock = 0xb8aa98;
    const g = new THREE.Group();
    const dome = mesh(new THREE.SphereGeometry(7, 14, 10), rock, [0, 6, 0]);
    dome.scale.set(1, 1.1, 0.8);
    g.add(dome, box(8, 4, 5, rock, [0, 1.5, 1.5]));
    for (const x of [-2.6, 2.6]) {
      const eye = mesh(new THREE.SphereGeometry(1.7, 10, 8), 0x2a2420, [x, 7, 5.1]);
      eye.scale.z = 0.5;
      g.add(eye);
    }
    g.add(mesh(new THREE.ConeGeometry(0.9, 1.6, 3), 0x2a2420, [0, 4.6, 5.4], [Math.PI, 0, 0]));
    for (let i = 0; i < 5; i++) g.add(box(0.9, 1.4, 0.4, 0xe8e0d0, [-2 + i, 2.6, 4.05]));
    g.add(mesh(new THREE.TorusGeometry(7.5, 0.5, 6, 24), 0xe8f8ff, [0, 0.1, 0], [Math.PI / 2, 0, 0]));
    return g;
  } },
  fort: { z: -18, r: 8, build: () => {
    // A stone fort on the cliff: battlements, cannons poking out, the black flag on top.
    const stone = 0xa89c88, dark = 0x2a2a2e;
    const g = group(box(14, 6, 7, stone, [0, 3, 0]));
    for (let x = -6.5; x <= 6.6; x += 1.3) g.add(box(0.8, 0.9, 7.2, stone, [x, 6.45, 0]));
    g.add(box(4, 10, 4, stone, [-5, 5, -1]));
    for (let x = -6.5; x <= -3.4; x += 1.0) g.add(box(0.6, 0.8, 4.2, stone, [x, 10.4, -1]));
    for (const x of [-2, 1.5, 5]) g.add(box(1.2, 1, 0.3, dark, [x, 4, 3.55]), cyl(0.25, 0.3, 1.6, dark, [x, 4, 4.2], 10, [Math.PI / 2, 0, 0]));
    g.add(mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.3, 14, 1, false, 0, Math.PI), 0x4a2a18, [0, 1.6, 3.55], [Math.PI / 2, 0, 0]), box(2.8, 1.6, 0.3, 0x4a2a18, [0, 0.8, 3.55]));
    g.add(cyl(0.08, 0.08, 4, 0x6a4422, [-5, 12.8, -1], 6));
    const flag = textPanel('☠', 2, 1.3, '#1a1a1a', '#ffffff');
    flag.position.set(-3.9, 14, -1);
    g.add(flag);
    return g;
  } },
  tavern: { z: -14, r: 6, build: () => {
    // A ramshackle pirate tavern on stilts with a swinging sign.
    const wood = 0x8a5a30, dark = 0x5a3a1a;
    const g = new THREE.Group();
    for (const x of [-3.5, 3.5]) for (const z of [-2.5, 2.5]) g.add(cyl(0.2, 0.2, 2, dark, [x, 1, z], 6));
    g.add(box(8, 0.4, 6, dark, [0, 2.1, 0]), box(7.4, 4, 5.4, wood, [0, 4.3, 0]));
    for (let y = 2.6; y < 6.2; y += 0.6) g.add(box(7.5, 0.06, 5.5, dark, [0, y, 0]));
    for (const sgn of [1, -1]) g.add(box(8.4, 0.3, 3.6, 0x6a8a3a, [0, 7.3, sgn * 1.35], [sgn * 0.6, 0, 0]));
    g.add(box(1.4, 2.4, 0.2, 0x3a2410, [0, 3.5, 2.75]));
    for (const x of [-2.4, 2.4]) g.add(box(1.2, 1, 0.1, 0xffd080, [x, 4.6, 2.72]));
    g.add(box(0.1, 1.2, 0.1, dark, [3.9, 6, 2.9]), box(1.6, 0.1, 0.1, dark, [3.2, 6.6, 2.9]));
    const sign = textPanel('THE JOLLY PUMP', 2.8, 0.9, '#e8d4a8', '#5a2a1a', '#5a2a1a');
    sign.position.set(3.2, 5.9, 3);
    g.add(sign);
    for (let i = 0; i < 4; i++) g.add(box(0.5, 0.35, 0.05, wood, [-3.2 + i * 0.1, 0.5 + i * 0.4, 3.2]));
    return g;
  } },
  treasure: { z: -9, r: 4, build: () => {
    // X marks the spot: a dug-up chest of gold beside a shovel, a map pinned on a post.
    const g = new THREE.Group();
    for (const a of [0.7, -0.7]) g.add(box(2.4, 0.05, 0.35, 0xc8302a, [0, 0.03, 0], [0, a, 0]));
    const mound = mesh(new THREE.SphereGeometry(1.4, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0xe0c890, [2.2, 0, -0.5]);
    mound.scale.y = 0.4;
    g.add(mound, box(1.4, 0.8, 0.9, 0x8a5028, [0.6, 0.4, -0.4]), box(1.42, 0.12, 0.92, 0xe0b040, [0.6, 0.6, -0.4]));
    for (let i = 0; i < 9; i++) g.add(cyl(0.12, 0.12, 0.04, 0xf2c428, [0.6 + Math.cos(i) * 0.3, 0.85 + (i % 3) * 0.06, -0.4 + Math.sin(i) * 0.2], 10));
    g.add(beam([2.6, 0, -0.2], [2.9, 1.6, -0.5], 0.08, 0x6a4422), box(0.35, 0.45, 0.05, 0x9a9aa2, [2.55, 0.15, -0.18], [0, 0, 0.18]));
    g.add(cyl(0.07, 0.07, 1.6, 0x6a4422, [-2, 0.8, 0], 6));
    const map = textPanel('X', 0.9, 0.7, '#e8d4a8', '#c8302a');
    map.position.set(-2, 1.3, 0.1);
    g.add(map);
    return g;
  } },
  // ---- Haunted Hollow
  manor: { z: -26, r: 12, build: () => {
    // A crooked old manor on the hill: leaning towers, pointed roofs, glowing windows, a bat-shaped weathervane.
    const wall = 0x5a4a6a, roof = 0x2a2238, trim = 0x3a3048, lit = glow(0xffc860);
    const g = group(box(16, 9, 8, wall, [0, 4.5, 0]), box(16.4, 0.5, 8.4, trim, [0, 9.2, 0]));
    const r1 = mesh(new THREE.ConeGeometry(10, 5, 4), roof, [0, 11.9, 0], [0, Math.PI / 4, 0]);
    r1.scale.z = 0.55;
    g.add(r1);
    for (const [x, h, lean] of [[-9, 15, 0.06], [8.5, 18, -0.08]] as const) {
      const t = group(cyl(2.2, 2.4, h, wall, [0, h / 2, 0], 8), mesh(new THREE.ConeGeometry(2.9, 5, 8), roof, [0, h + 2.5, 0]));
      for (let y = 3; y < h - 1; y += 4) t.add(box(0.9, 1.4, 0.1, lit, [0, y, 2.3]));
      t.position.set(x, 0, 0.5);
      t.rotation.z = lean;
      g.add(t);
    }
    for (const x of [-5, -1.5, 2, 5.5]) for (const y of [2.6, 6.4]) {
      g.add(box(1.4, 1.9, 0.1, (x + y) % 3 > 1 ? lit : 0x1a1424, [x, y, 4.05]), box(1.7, 0.2, 0.2, trim, [x, y - 1.05, 4.1]));
    }
    g.add(box(2, 3.2, 0.2, 0x3a2418, [0, 1.6, 4.1]), cyl(1.1, 1.1, 0.2, 0x3a2418, [0, 3.2, 4.1], 12, [Math.PI / 2, 0, 0]));
    g.add(box(4, 0.4, 2, 0x6a6474, [0, 0.2, 5]), box(3, 0.4, 1.2, 0x6a6474, [0, 0.6, 4.6]));
    g.add(cyl(0.06, 0.06, 2.5, 0x1a1424, [8.5, 21.5, 0.5], 6), box(1.4, 0.4, 0.06, 0x1a1424, [8.5, 22.2, 0.5]));
    return g;
  } },
  graveyardgate: { z: -9, r: 5, build: () => {
    // Stone gateposts with an iron arch, the gate hanging open, and a sign over the top.
    const stone = 0x8a8494, iron = 0x24222a;
    const g = new THREE.Group();
    for (const x of [-2.4, 2.4]) g.add(box(0.9, 3, 0.9, stone, [x, 1.5, 0]), box(1.1, 0.3, 1.1, stone, [x, 3.15, 0]), ball(0.35, stone, [x, 3.6, 0], 10));
    const arch = mesh(new THREE.TorusGeometry(2.4, 0.07, 6, 24, Math.PI), iron, [0, 3.2, 0]);
    g.add(arch);
    for (let i = 0; i < 9; i++) g.add(cyl(0.03, 0.03, 2.4, iron, [-1.9 + i * 0.2, 1.3, 0.9 + i * 0.12], 5));
    g.add(box(1.8, 0.06, 0.06, iron, [-1.1, 2.3, 1.4], [0, -0.6, 0]), box(1.8, 0.06, 0.06, iron, [-1.1, 0.4, 1.4], [0, -0.6, 0]));
    const sign = textPanel('HOLLOW', 2.8, 0.7, '#2a2238', '#e8e0f8', '#8a84a4');
    sign.position.set(0, 4.6, 0.05);
    g.add(sign);
    for (const x of [-4.5, 4.5]) for (let k = 0; k < 3; k++) g.add(box(0.1, 1.6, 0.1, iron, [x + (x < 0 ? k : -k) * 0.6, 0.8, 0]));
    return g;
  } },
  giantpumpkin: { z: -12, r: 5, build: () => {
    // A prize pumpkin as big as a shed, carved with a huge grin, glowing from inside.
    const g = new THREE.Group(), face = glow(0xffb030);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const seg = ball(2.2, k % 2 ? 0xf08020 : 0xd86818, [Math.cos(a) * 1.4, 2.6, Math.sin(a) * 1.4], 16);
      seg.scale.set(0.8, 1.1, 0.8);
      g.add(seg);
    }
    g.add(ball(2.6, 0xf08020, [0, 2.7, 0], 18), cyl(0.3, 0.4, 1.4, 0x5a7a2a, [0.2, 5.8, 0], 8));
    for (const x of [-1.1, 1.1]) g.add(mesh(new THREE.CircleGeometry(0.6, 3), face, [x, 3.4, 3.62], [0, 0, Math.PI / 2]));
    g.add(mesh(new THREE.CircleGeometry(0.35, 3), face, [0, 2.6, 3.7], [0, 0, -Math.PI / 2]));
    const mouth = box(2.8, 0.6, 0.1, face, [0, 1.7, 3.55]);
    g.add(mouth, box(0.4, 0.3, 0.12, 0xf08020, [-0.6, 1.9, 3.6]), box(0.4, 0.3, 0.12, 0xf08020, [0.6, 1.5, 3.6]));
    g.add(box(1.6, 1.1, 0.08, 0xe8d4a8, [3.8, 0.9, 1.5], [0, -0.3, 0.05]), cyl(0.06, 0.06, 1.4, 0x5a3a1a, [3.8, 0.4, 1.4], 6));
    const tag = textPanel('1ST PRIZE', 1.4, 0.7, '#e8d4a8', '#c8302a');
    tag.position.set(3.82, 0.95, 1.56);
    tag.rotation.y = -0.3;
    g.add(tag);
    return g;
  } },
  witchhut: { z: -14, r: 6, build: () => {
    // A witch's hut on crooked stilts: a lopsided pointy roof, a round window, a broom by the door.
    const wood = 0x5a4a3a, dark = 0x3a2e24, roof = 0x3a3a5a;
    const g = new THREE.Group();
    for (const [x, z] of [[-2, -1.6], [2, -1.6], [-2, 1.6], [2, 1.6]]) g.add(beam([x * 1.1, 0, z * 1.1], [x, 2.2, z], 0.25, dark));
    g.add(box(5, 0.3, 4, dark, [0, 2.3, 0]));
    const body = box(4.2, 3.2, 3.6, wood, [0, 4, 0], [0, 0, 0.05]);
    g.add(body);
    const r1 = mesh(new THREE.ConeGeometry(3.6, 4.5, 6), roof, [0.3, 7.6, 0], [0, 0, -0.15]);
    g.add(r1, ball(0.25, 0xffd040, [1.0, 9.8, 0], 8));
    g.add(mesh(new THREE.CircleGeometry(0.55, 16), glow(0x9aff6a), [-0.9, 4.4, 1.82]), box(1, 1.9, 0.1, dark, [1, 3.4, 1.82]));
    g.add(beam([2.4, 2.4, 1.9], [2.0, 4.6, 2.0], 0.08, 0x8a6a3a), cyl(0.05, 0.4, 0.9, 0xc8a050, [2.45, 2.65, 1.9], 8));
    for (let i = 0; i < 4; i++) g.add(box(0.8, 0.12, 0.6, dark, [-0.2 + i * 0.25, 0.5 + i * 0.55, 2.8]));
    return g;
  } },
  spookyoak: { z: -16, r: 6, build: () => {
    // A huge old hollow oak with a face in its trunk: two glowing eyes and a gaping mouth.
    const bark = 0x5a4e56, dark = 0x3a3038, eye = glow(0xfff080);
    const g = group(cyl(1.6, 2.6, 9, bark, [0, 4.5, 0], 9));
    for (let a = 0; a < 6; a++) {
      const ang = (a / 6) * Math.PI * 2;
      g.add(beam([0, 0.6, 0], [Math.cos(ang) * 3.4, -0.2, Math.sin(ang) * 3.4], 0.7, dark));
    }
    for (const [ang, up, len] of [[0.6, 9, 6], [2.5, 8, 6.5], [1.6, 10, 4], [3.6, 7, 5], [-0.6, 8.5, 5]] as const) {
      const tip: V3 = [Math.cos(ang) * len, up + 3, Math.sin(ang) * 1.2];
      g.add(beam([0, up - 1.5, 0], tip, 0.55, bark));
      for (const d of [-0.8, 0.8]) g.add(beam(tip, [tip[0] + Math.cos(ang + d) * 2, tip[1] + 1.2, tip[2]], 0.2, dark));
    }
    for (const x of [-0.6, 0.6]) g.add(mesh(new THREE.CircleGeometry(0.28, 12), eye, [x, 5.6, 2.12]));
    const m = mesh(new THREE.CircleGeometry(0.7, 14), 0x140e18, [0, 4.2, 2.2]);
    m.scale.y = 1.3;
    g.add(m);
    return g;
  } },
  // ---- Funfair
  carousel: { z: -14, r: 7, build: () => {
    // A merry-go-round: striped canopy, gold poles, painted horses at different heights.
    const g = group(cyl(5.2, 5.4, 0.6, 0xf4ecd8, [0, 0.3, 0], 24), cyl(0.6, 0.6, 5.2, 0xf2c040, [0, 2.9, 0], 12));
    const stripes = [0xe84a3a, 0xf4ecd8];
    for (let k = 0; k < 16; k++) {
      const a0 = (k / 16) * Math.PI * 2;
      g.add(mesh(new THREE.ConeGeometry(5.8, 2.2, 16, 1, false, a0, Math.PI / 8), stripes[k % 2], [0, 6.3, 0]));
    }
    g.add(cyl(5.8, 5.8, 0.7, 0xf2c040, [0, 4.9, 0], 24), ball(0.4, 0xf2c040, [0, 7.6, 0], 10));
    const horses = [0xf4f0e8, 0x8a5a30, 0x3a3a3a, 0xf4f0e8, 0xd8a050, 0xf4f0e8];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2, x = Math.cos(a) * 4, z = Math.sin(a) * 4, y = 1.6 + (k % 2) * 0.5;
      g.add(cyl(0.06, 0.06, 4.2, 0xf2c040, [x, 2.7, z], 6));
      const h = group(box(1.4, 0.5, 0.4, horses[k], [0, 0, 0]), box(0.35, 0.7, 0.3, horses[k], [0.65, 0.4, 0], [0, 0, -0.4]),
        box(0.45, 0.25, 0.28, horses[k], [0.9, 0.7, 0]), box(0.15, 0.4, 0.42, 0xe84a3a, [0.45, 0.6, 0]));
      for (const lx of [-0.5, 0.5]) h.add(box(0.12, 0.6, 0.12, horses[k], [lx, -0.45, 0], [0, 0, lx * 0.6]));
      h.position.set(x, y, z);
      h.rotation.y = -a;
      g.add(h);
    }
    return g;
  } },
  helterskelter: { z: -16, r: 5, build: () => {
    // A helter-skelter tower with a striped slide spiralling down and a pointed roof.
    const g = group(cyl(1.6, 2, 11, 0xf4ecd8, [0, 5.5, 0], 12), mesh(new THREE.ConeGeometry(2.6, 3, 12), 0xe84a3a, [0, 12.5, 0]));
    g.add(cyl(0.05, 0.05, 1.4, 0x5a3a1a, [0, 14.6, 0], 6), box(0.9, 0.5, 0.04, 0xf2c040, [0.45, 15.0, 0]));
    const n = 60;
    for (let i = 0; i < n; i++) {
      const t = i / n, a = t * Math.PI * 2 * 3, y = 10.5 - t * 9.8;
      const seg = box(1.2, 0.18, 1.1, i % 6 < 3 ? 0xf2c040 : 0x3a7ad8, [Math.cos(a) * 2.6, y, Math.sin(a) * 2.6], [0, -a, -0.25]);
      g.add(seg);
    }
    for (let k = 0; k < 4; k++) g.add(box(0.5, 0.8, 0.1, 0x2a2238, [0, 3 + k * 2.4, 2.02]));
    return g;
  } },
  coasterhill: { z: -24, r: 10, build: () => {
    // A wooden roller coaster's lift hill: white trestles, a red track, a train of cars at the top.
    const frame = 0xf4ecd8, rail = 0xe84a3a;
    const g = new THREE.Group();
    const y = (x: number) => x < 0 ? 16 * Math.max(0, 1 + x / 14) : 16 * Math.max(0, 1 - x / 9) ** 1.5;
    for (let x = -14; x <= 9; x += 1) g.add(beam([x, y(x) + 0.3, 0], [x + 1, y(x + 1) + 0.3, 0], 0.35, rail));
    for (let x = -12; x <= 8; x += 2) {
      const h = y(x);
      if (h < 0.5) continue;
      g.add(beam([x - 0.8, 0, -1], [x, h, 0], 0.2, frame), beam([x + 0.8, 0, 1], [x, h, 0], 0.2, frame), cyl(0.12, 0.12, h, frame, [x, h / 2, 0], 6));
      if (h > 4) g.add(box(1.8, 0.12, 0.12, frame, [x, h * 0.5, 0], [0, 0, 0.6]));
    }
    for (let k = 0; k < 3; k++) {
      const x = -2.6 + k * 1.3;
      g.add(box(1.2, 0.7, 1.1, [0x3a7ad8, 0xf2c040, 0x4ab84a][k], [x, y(x) + 0.8, 0], [0, 0, Math.atan2(y(x + 0.5) - y(x - 0.5), 1)]));
    }
    return g;
  } },
  balloonarch: { z: -6, r: 4, build: () => {
    // An arch of balloons, all colours, with a sign hanging from it.
    const cols = [0xe84a3a, 0xf2c040, 0x3a7ad8, 0x4ab84a, 0xff96c8];
    const g = new THREE.Group();
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * Math.PI;
      g.add(ball(0.42, cols[i % cols.length], [Math.cos(a) * 4, Math.sin(a) * 4.5, (i % 2) * 0.3 - 0.15], 10));
    }
    const sign = textPanel('FUNFAIR', 3.4, 0.9, '#f4ecd8', '#e84a3a', '#e84a3a');
    sign.position.set(0, 3.6, 0.3);
    g.add(sign);
    return g;
  } },
  bigtop: { z: -22, r: 10, build: () => {
    // The circus big top: a huge striped tent with flags on its poles.
    const g = new THREE.Group();
    const stripes = [0xe84a3a, 0xf4ecd8];
    for (let k = 0; k < 20; k++) {
      const a0 = (k / 20) * Math.PI * 2;
      g.add(mesh(new THREE.CylinderGeometry(9, 9, 5, 20, 1, true, a0, Math.PI / 10), stripes[k % 2], [0, 2.5, 0]));
      g.add(mesh(new THREE.ConeGeometry(10, 6, 20, 1, false, a0, Math.PI / 10), stripes[(k + 1) % 2], [0, 8, 0]));
    }
    for (const x of [-3, 3]) g.add(cyl(0.15, 0.15, 13, 0xf2c040, [x, 6.5, 0], 6), box(1.2, 0.6, 0.05, 0x3a7ad8, [x + 0.6, 12.6, 0]));
    g.add(box(3, 3.4, 0.2, 0x2a2238, [0, 1.7, 9]));
    const sign = textPanel('BIG TOP', 4, 1, '#f2c040', '#c8302a', '#c8302a');
    sign.position.set(0, 4.3, 9.1);
    g.add(sign);
    return g;
  } },
  // ---- Toxic Factory
  goovat: { z: -14, r: 6, build: () => {
    // A giant vat of glowing green goo on legs, a ladder up the side, pipes feeding in.
    const steel = 0x8a9098, goo = glow(0x7aff4a);
    const g = group(cyl(4, 4, 6, steel, [0, 5, 0], 20), cyl(3.8, 3.8, 0.2, goo, [0, 8.05, 0], 20), cyl(4.2, 4.2, 0.4, 0x5a6068, [0, 8.1, 0], 20));
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.4;
      g.add(cyl(0.25, 0.25, 2.2, 0x5a6068, [Math.cos(a) * 3.2, 1.1, Math.sin(a) * 3.2], 8));
    }
    for (let k = 0; k < 5; k++) g.add(ball(0.35 + (k % 2) * 0.2, goo, [-1.5 + k * 0.8, 8.2 + (k % 3) * 0.15, (k % 2) - 0.5], 8));
    for (const y of [3, 5, 7]) g.add(box(8.1, 0.3, 0.3, 0xf2c020, [0, y, 0], [0, 0, 0]));
    g.add(box(0.5, 0.25, 0.1, goo, [1.2, 4, 4.05]), cyl(0.5, 0.5, 0.2, goo, [2.4, 0.1, 3.4], 14));
    for (let y = 2.4; y < 8.4; y += 0.5) g.add(box(0.8, 0.06, 0.06, 0x3a3e44, [-4.2, y, 1.2]));
    g.add(box(0.06, 6, 0.06, 0x3a3e44, [-4.2, 5.4, 0.8]), box(0.06, 6, 0.06, 0x3a3e44, [-4.2, 5.4, 1.6]));
    g.add(beam([4, 7, 0], [8, 11, -1], 0.5, 0x4a8a6e), beam([8, 11, -1], [8, 0, -1], 0.5, 0x4a8a6e));
    const label = textPanel('GOO', 2.6, 1.2, '#f2c020', '#222226', '#222226');
    label.position.set(0, 5.6, 4.06);
    g.add(label);
    return g;
  } },
  coolingtower: { z: -30, r: 10, build: () => {
    // A big cooling tower, waisted in the middle, puffing a cloud of steam.
    const g = group(mesh(new THREE.CylinderGeometry(6, 8.5, 18, 24, 1, true), 0xd8dcd0, [0, 9, 0]), mesh(new THREE.CylinderGeometry(7, 6, 6, 24, 1, true), 0xd8dcd0, [0, 21, 0]));
    g.add(cyl(7.05, 7.05, 1, 0xd84a3a, [0, 23, 0], 24));
    for (const [x, y, r] of [[0, 26, 4], [2, 29, 3.5], [-1.5, 31, 3], [1, 34, 2.5]] as const) g.add(ball(r, 0xf4f4f0, [x, y, 0], 10));
    return g;
  } },
  crusher: { z: -12, r: 6, build: () => {
    // A crusher: a huge striped press block hanging in a steel frame over a squashed car.
    const steel = 0x5a6068;
    const g = group(box(0.8, 9, 0.8, steel, [-3.5, 4.5, 0]), box(0.8, 9, 0.8, steel, [3.5, 4.5, 0]), box(8, 1, 1.2, steel, [0, 9.2, 0]));
    g.add(box(5.6, 2.6, 3, 0xf2c020, [0, 6, 0]), cyl(0.5, 0.5, 2.6, 0x9aa0a8, [0, 8, 0], 10));
    for (let i = 0; i < 5; i++) g.add(box(0.5, 2.62, 3.02, 0x222226, [-2.2 + i * 1.1, 6, 0], [0, 0, 0.5]));
    g.add(box(5, 0.6, 3.4, 0x3a3e44, [0, 0.3, 0]), box(3.4, 0.6, 1.8, 0xd84a3a, [0, 0.9, 0]), box(1.6, 0.4, 1.6, 0xd84a3a, [0.3, 1.35, 0]));
    for (const x of [-1.2, 1.2]) g.add(cyl(0.35, 0.35, 0.25, 0x222226, [x, 0.75, 0.95], 10, [Math.PI / 2, 0, 0]));
    return g;
  } },
  robotarm: { z: -9, r: 5, build: () => {
    // A big orange robot arm, reaching over towards the track with a claw.
    const orange = 0xf08a2a, dark = 0x3a3e44;
    const g = group(cyl(1.2, 1.5, 1, dark, [0, 0.5, 0], 14), cyl(0.9, 0.9, 1, orange, [0, 1.5, 0], 14));
    g.add(beam([0, 2, 0], [1.5, 6, 1], 0.8, orange), ball(0.6, dark, [1.5, 6, 1], 12), beam([1.5, 6, 1], [4.5, 5, 3.5], 0.6, orange));
    g.add(ball(0.4, dark, [4.5, 5, 3.5], 10), beam([4.5, 5, 3.5], [4.7, 3.8, 3.7], 0.25, dark));
    for (const d of [-0.35, 0.35]) g.add(beam([4.7, 3.8, 3.7 + d], [4.9, 3.1, 3.7 + d * 1.6], 0.15, dark));
    g.add(ball(0.18, glow(0xff3a2a), [1.6, 6.5, 1.5], 8));
    return g;
  } },
  controlroom: { z: -16, r: 6, build: () => {
    // A control room up on stilts: a long lit window, screens, a little satellite dish.
    const wall = 0x9aa0a8;
    const g = new THREE.Group();
    for (const x of [-3.5, 3.5]) g.add(box(0.4, 4, 0.4, 0x5a6068, [x, 2, 0]));
    g.add(box(8, 3.5, 4, wall, [0, 5.75, 0]), box(8.4, 0.4, 4.4, 0x5a6068, [0, 7.7, 0]));
    g.add(box(6.6, 1.6, 0.1, glow(0x9ad8ff), [0, 6, 2.02]));
    for (let i = 0; i < 4; i++) g.add(box(1, 0.6, 0.05, glow(i % 2 ? 0x7aff4a : 0xffb030), [-2.4 + i * 1.6, 5.9, 2.06]));
    g.add(beam([-3.5, 0, 3], [-3.5, 4, 2.2], 0.15, 0xf2c020), cyl(0.8, 0.1, 0.4, 0xd8dcd0, [2.6, 8.4, 0], 12, [0.6, 0, 0]));
    const sign = textPanel('CONTROL', 3, 0.7, '#222226', '#f2c020');
    sign.position.set(0, 7.2, 2.05);
    g.add(sign);
    return g;
  } },
  // ---- Crystal Mine
  minehead: { z: -18, r: 7, build: () => {
    // The mine entrance: a timber-framed tunnel mouth with a winding tower and its big wheel above.
    const wood = 0x8a5a30, iron = 0x4a4a52;
    const g = group(box(7, 6, 3, 0x3a3240, [0, 3, 0]), box(4, 4.2, 0.1, 0x0a080c, [0, 2.1, 1.55]));
    g.add(box(0.5, 4.6, 0.5, wood, [-2.2, 2.3, 1.6]), box(0.5, 4.6, 0.5, wood, [2.2, 2.3, 1.6]), box(5.2, 0.5, 0.6, wood, [0, 4.6, 1.6]));
    for (const x of [-0.9, 0.9]) g.add(box(0.12, 0.08, 6, iron, [x, 0.05, 3]));
    for (const x of [-2.6, 2.6]) g.add(beam([x, 6, 0], [x * 0.3, 15, 0], 0.4, iron));
    g.add(beam([-2.6, 6, 0], [2.6, 10, 0], 0.2, iron), beam([2.6, 6, 0], [-2.6, 10, 0], 0.2, iron));
    const wheel = new THREE.Group();
    wheel.add(mesh(new THREE.TorusGeometry(2.4, 0.18, 6, 24), iron));
    for (let k = 0; k < 6; k++) wheel.add(box(4.8, 0.14, 0.14, iron, [0, 0, 0], [0, 0, (k / 6) * Math.PI]));
    wheel.position.set(0, 15, 0);
    g.add(wheel);
    const sign = textPanel('MINE', 2.6, 0.8, '#4a3020', '#f2c040');
    sign.position.set(0, 5.4, 1.62);
    g.add(sign);
    return g;
  } },
  geode: { z: -14, r: 6, build: () => {
    // A huge geode split open, lined with glowing purple crystals.
    const g = group(mesh(new THREE.SphereGeometry(5, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), 0x6a6070, [0, 1, 0], [Math.PI / 2, 0, 0]));
    g.add(mesh(new THREE.CircleGeometry(4.4, 18), 0x2a1a40, [0, 4, 0.6]));
    const c = glow(0xc890ff), c2 = glow(0xe8c8ff);
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2, d = 2.4 + (k % 3) * 0.6;
      g.add(mesh(new THREE.ConeGeometry(0.35, 1.6, 6), k % 3 ? c : c2, [Math.cos(a) * d, 4 + Math.sin(a) * d, 1.2], [Math.PI / 2 - 0.3, 0, a]));
    }
    return g;
  } },
  cavefall: { z: -16, r: 7, build: () => {
    // An underground waterfall pouring off a ledge into a pool, lit blue from below.
    const rock = 0x4a4250, water = glow(0x6ac8ff);
    const g = new THREE.Group();
    for (const [x, y, r] of [[-3.5, 4, 4.5], [3.5, 5, 4.8], [0, 10, 4.6], [-2.5, 12, 3.6], [3, 12.5, 3.4]] as const) {
      const lump = mesh(new THREE.IcosahedronGeometry(r, 0), rock, [x, y, -1.5]);
      lump.scale.set(1, 1.3, 0.7);
      g.add(lump);
    }
    g.add(box(4, 1, 3, rock, [0, 12, 1]));
    g.add(box(2.6, 12, 0.3, new THREE.MeshBasicMaterial({ color: 0x8ad8ff, transparent: true, opacity: 0.75 }), [0, 6, 2.4]));
    for (const x of [-0.9, -0.2, 0.6]) g.add(box(0.18, 12, 0.05, glow(0xe0f6ff), [x, 6, 2.6]));
    g.add(cyl(4.5, 4.5, 0.3, water, [0, 0.15, 3.5], 20));
    for (let k = 0; k < 6; k++) g.add(ball(0.6 + (k % 2) * 0.3, 0xffffff, [-1.5 + k * 0.6, 0.6, 2.8 + (k % 2) * 0.5], 8));
    for (const x of [-4, 4]) g.add(mesh(new THREE.ConeGeometry(0.5, 2.2, 6), glow(0x7ad0ff), [x, 1.1, 2.6]));
    return g;
  } },
  cathedral: { z: -30, r: 12, build: () => {
    // A crystal cathedral: a forest of giant glowing crystal spires, tallest in the middle.
    const cs = [glow(0xc890ff), glow(0x7ad0ff), glow(0x7affb0)];
    const g = new THREE.Group();
    for (let k = 0; k < 11; k++) {
      const x = (k - 5) * 2.2, h = 22 - Math.abs(k - 5) * 3.2;
      g.add(mesh(new THREE.CylinderGeometry(0, 1.3, h, 6), cs[k % 3], [x, h / 2, (k % 2) * 1.5], [0, 0, (k - 5) * -0.04]));
    }
    for (let k = 0; k < 7; k++) {
      const lump = mesh(new THREE.IcosahedronGeometry(2.6, 0), 0x3a3240, [(k - 3) * 3.8, 0.6, 1 + (k % 2) * 0.8]);
      lump.scale.set(1.3, 0.6, 1);
      g.add(lump);
    }
    for (let k = 0; k < 10; k++) g.add(mesh(new THREE.CylinderGeometry(0, 0.5, 2.5 + (k % 3), 6), cs[(k + 1) % 3], [(k - 4.5) * 2.6, 1.6, 3.2], [0, 0, (k % 2 ? 0.3 : -0.3)]));
    return g;
  } },
  // ---- Dino Valley
  brachio: { z: -26, r: 9, build: () => {
    // A huge friendly long-necked dinosaur, munching the top of a tree.
    const skin = 0x7ab0a0, belly = 0xb8d8b0, dark = 0x4a7a6e;
    const body = ball(5, skin, [0, 7.5, 0], 16);
    body.scale.set(1.5, 0.9, 0.9);
    const g = group(body);
    const under = ball(4.4, belly, [0, 6.8, 1.2], 14);
    under.scale.set(1.4, 0.7, 0.75);
    g.add(under);
    for (const [x, z] of [[-4.5, 2], [-4.5, -2], [4, 2], [4, -2]] as const) g.add(cyl(1.1, 1.3, 5, x < 0 ? skin : dark, [x, 2.5, z], 10));
    g.add(beam([5.5, 9, 0], [9, 17, 0], 1.6, skin), beam([9, 17, 0], [10, 21, 0], 1.2, skin));
    const head = ball(1.4, skin, [10.8, 21.6, 0], 12);
    head.scale.set(1.5, 0.8, 0.9);
    g.add(head, ball(0.25, 0x222222, [11.4, 22.1, 0.9], 8), ball(0.1, 0xffffff, [11.5, 22.2, 1.1], 6));
    g.add(beam([-6.5, 7, 0], [-11, 4, 0], 1.6, skin), beam([-11, 4, 0], [-15, 2.5, 0], 0.8, skin));
    for (let k = 0; k < 6; k++) g.add(ball(0.7, dark, [-3 + k * 1.4, 11.6 - Math.abs(k - 2) * 0.3, 0], 8));
    g.add(cyl(0.6, 0.8, 18, 0x8a6a40, [14, 9, -2], 8), ball(3.4, 0x4a9a40, [14, 19, -2], 10), ball(2.4, 0x6ab84a, [12.5, 20, -0.5], 10));
    return g;
  } },
  trex: { z: -14, r: 6, build: () => {
    // A big (cartoon, friendly) T. rex, standing tall with its tiny arms out.
    const skin = 0x6aa04a, belly = 0xd8d890, dark = 0x4a7a36;
    const body = ball(2.6, skin, [0, 5.2, 0], 14);
    body.scale.set(1.3, 1, 0.9);
    const g = group(body, ball(2, belly, [1.2, 4.8, 0.8], 12));
    for (const z of [-1, 1]) g.add(beam([-0.5, 4, z], [0, 1.5, z], 1.1, dark), beam([0, 1.5, z], [-0.4, 0.2, z], 0.8, dark), box(1.6, 0.4, 0.9, dark, [0.2, 0.2, z]));
    g.add(beam([-3, 5.5, 0], [-7, 3, 0], 1.4, skin), beam([-7, 3, 0], [-9.5, 2, 0], 0.6, skin));
    g.add(beam([2.6, 6.5, 0], [3.4, 8.4, 0], 1.6, skin));
    const head = box(3.4, 1.6, 1.8, skin, [4.4, 9, 0]);
    g.add(head, box(3, 0.5, 1.6, belly, [4.6, 8, 0]));
    for (let k = 0; k < 5; k++) g.add(mesh(new THREE.ConeGeometry(0.14, 0.4, 4), 0xffffff, [3.4 + k * 0.5, 8.1, 0.92], [Math.PI, 0, 0]));
    g.add(ball(0.32, 0xffffff, [4.2, 9.6, 0.9], 8), ball(0.16, 0x222222, [4.3, 9.6, 1.15], 6));
    for (const z of [-0.6, 0.6]) g.add(beam([3, 5.8, z * 2.4], [3.9, 5.2, z * 2.6], 0.3, skin));
    for (let k = 0; k < 5; k++) g.add(mesh(new THREE.ConeGeometry(0.3, 0.6, 4), dark, [-2 + k * 1, 7.6 - k * 0.3, 0]));
    return g;
  } },
  stego: { z: -12, r: 6, build: () => {
    // A stegosaurus with a row of big plates down its back and spikes on its tail.
    const skin = 0xc89a4a, plate = 0xd85a3a, dark = 0x8a6a30;
    const body = ball(2.4, skin, [0, 2.8, 0], 14);
    body.scale.set(1.6, 1, 0.85);
    const g = group(body);
    for (const [x, z] of [[-2, 1], [-2, -1], [2, 1], [2, -1]] as const) g.add(cyl(0.45, 0.55, 1.6, dark, [x, 0.8, z], 8));
    g.add(beam([3.4, 2.8, 0], [5.4, 1.8, 0], 0.7, skin), ball(0.7, skin, [5.6, 1.7, 0], 10), ball(0.12, 0x222222, [5.9, 1.95, 0.5], 6));
    g.add(beam([-3.4, 3, 0], [-7, 1.6, 0], 0.8, skin));
    for (let k = 0; k < 7; k++) {
      const x = -3 + k, h = 1.3 + (3 - Math.abs(k - 3)) * 0.25;
      g.add(mesh(new THREE.ConeGeometry(h * 0.6, h, 4), plate, [x, 4.6 + h / 2 - Math.abs(k - 3) * 0.3, 0], [0, Math.PI / 4, 0]));
    }
    for (const [dy, dz] of [[0.5, 0.4], [0.5, -0.4]] as const) g.add(beam([-6.6, 1.8, 0], [-7.4, 1.8 + dy, dz * 2], 0.15, 0xf4ecd8));
    return g;
  } },
  trike: { z: -10, r: 5, build: () => {
    // A triceratops: a big frill and three horns, munching ferns.
    const skin = 0x8a7ab0, frill = 0xe8a040, dark = 0x5a4a80;
    const body = ball(2, skin, [0, 2.4, 0], 14);
    body.scale.set(1.5, 1, 0.9);
    const g = group(body);
    for (const [x, z] of [[-1.8, 0.9], [-1.8, -0.9], [1.6, 0.9], [1.6, -0.9]] as const) g.add(cyl(0.45, 0.5, 1.4, dark, [x, 0.7, z], 8));
    g.add(ball(1.1, skin, [3.4, 2.2, 0], 12), mesh(new THREE.CircleGeometry(2, 16), frill, [2.6, 3.1, 0], [0, -Math.PI / 2 + 0.5, 0]));
    for (const z of [-0.5, 0.5]) g.add(mesh(new THREE.ConeGeometry(0.2, 1.6, 6), 0xf4ecd8, [4.1, 3.2, z], [0, 0, -1.1]));
    g.add(mesh(new THREE.ConeGeometry(0.15, 0.6, 6), 0xf4ecd8, [4.4, 2.3, 0], [0, 0, -1.3]), ball(0.13, 0x222222, [3.9, 2.6, 0.75], 6));
    g.add(beam([-2.8, 2.4, 0], [-4.6, 1.4, 0], 0.6, skin));
    return g;
  } },
  bignest: { z: -9, r: 5, build: () => {
    // A giant nest with eggs, one of them hatching: a baby dinosaur peeking out.
    const straw = 0xc8a05a, egg = 0xf0e8cc;
    const g = group(cyl(4, 3, 1.2, straw, [0, 0.6, 0], 18), cyl(3.4, 3.4, 0.2, 0x8a6a3a, [0, 1.15, 0], 18));
    for (const [x, z] of [[-1.6, -0.5], [0.4, -1.4], [1.8, 0.2]] as const) {
      const e = ball(1, egg, [x, 2.1, z], 12);
      e.scale.set(1, 1.35, 1);
      g.add(e);
    }
    const shell = mesh(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), egg, [-0.2, 2.1, 1.4]);
    shell.scale.set(1, 1.35, 1);
    g.add(shell, ball(0.7, 0x8ad06a, [-0.2, 2.6, 1.4], 12), ball(0.14, 0x222222, [0.05, 2.8, 2.0], 6), ball(0.14, 0x222222, [-0.45, 2.8, 2.0], 6));
    return g;
  } },
  ptero: { z: -20, r: 0, on: 'air', build: (r) => {
    // A couple of pterodactyls gliding high over the valley.
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const p = new THREE.Group(), skin = i % 2 ? 0xb07a5a : 0x9a6a8a;
      const body = ball(0.5, skin, [0, 0, 0], 8);
      body.scale.set(2, 0.7, 0.7);
      p.add(body, mesh(new THREE.ConeGeometry(0.3, 1.6, 5), 0xe8b040, [1.6, 0.1, 0], [0, 0, -Math.PI / 2]), mesh(new THREE.ConeGeometry(0.25, 1, 4), skin, [0.6, 0.6, 0], [0, 0, 0.8]));
      for (const z of [-1, 1]) {
        const w = mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.6, 0, 0), new THREE.Vector3(-0.6, 0, 0), new THREE.Vector3(0.2, 0.4, 3.4 * z)]), skin);
        (w.material as THREE.Material).side = THREE.DoubleSide;
        p.add(w);
      }
      p.position.set(i * 14 - 14 + r() * 4, 18 + r() * 8, -r() * 10);
      p.scale.setScalar(1.6);
      g.add(p);
    }
    return g;
  } },
  // ---- Moon Base
  domebase: { z: -18, r: 9, build: () => {
    // The moon base: glass domes joined by tunnels, lit windows, an airlock door.
    const white = 0xe8eaf0, glass = new THREE.MeshBasicMaterial({ color: 0x9ad8ff, transparent: true, opacity: 0.55 });
    const g = new THREE.Group();
    for (const [x, rr] of [[-7, 3.2], [0, 5], [7.5, 3.6]] as const) {
      g.add(cyl(rr + 0.3, rr + 0.3, 1.2, white, [x, 0.6, 0], 24));
      g.add(mesh(new THREE.SphereGeometry(rr, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), glass, [x, 1.2, 0]));
      for (let k = 0; k < 6; k++) g.add(mesh(new THREE.TorusGeometry(rr, 0.08, 4, 20, Math.PI), white, [x, 1.2, 0], [0, (k / 6) * Math.PI, 0]));
    }
    g.add(box(4, 2, 2, white, [-3.6, 1, 0]), box(4, 2, 2, white, [3.8, 1, 0]));
    for (const x of [-3.6, 3.8]) g.add(box(2.4, 0.5, 0.05, glow(0xffe8a0), [x, 1.3, 1.02]));
    g.add(box(1.4, 1.8, 0.2, 0xf08a2a, [0, 0.9, 5.1]), cyl(0.15, 0.15, 0.1, glow(0x7affa0), [0, 2.0, 5.2], 8, [Math.PI / 2, 0, 0]));
    g.add(ball(1.4, 0x7ab06a, [0, 2, 0], 10), ball(1, 0x5a9a4a, [1.4, 1.6, 1], 10), cyl(0.15, 0.2, 2, 0x8a6a40, [0, 1.2, 0], 6));
    const sign = textPanel('MOON BASE', 4, 0.8, '#2a3a5a', '#ffffff');
    sign.position.set(0, 2.7, 5.2);
    g.add(sign);
    return g;
  } },
  rocket: { z: -24, r: 8, build: () => {
    // A big rocket standing on its launch pad, ready to go home, with a gantry beside it.
    const white = 0xf2f2f4, red = 0xd83a2a, steel = 0x6a707c;
    const g = group(box(12, 1, 12, 0x5a5a64, [0, 0.5, 0]), cyl(2.4, 2.4, 16, white, [0, 9, 0], 20), mesh(new THREE.ConeGeometry(2.4, 5, 20), red, [0, 19.5, 0]));
    g.add(cyl(2.45, 2.45, 1.2, red, [0, 6, 0], 20), cyl(2.45, 2.45, 0.6, 0x222226, [0, 13, 0], 20));
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.5;
      g.add(box(0.3, 4, 2.4, red, [Math.cos(a) * 3, 3, Math.sin(a) * 3], [0, -a, 0]));
    }
    g.add(cyl(0.6, 0.6, 0.15, glow(0x9ad8ff), [0, 15, 2.38], 14, [Math.PI / 2, 0, 0]));
    for (const x of [-5.5, -3.5]) g.add(box(0.3, 18, 0.3, steel, [x, 9.5, -2]));
    for (let y = 2; y < 19; y += 2.5) g.add(box(2.3, 0.2, 0.3, steel, [-4.5, y, -2]), beam([-5.5, y, -2], [-3.5, y + 2.5, -2], 0.12, steel));
    g.add(box(2.5, 0.3, 0.4, steel, [-2.6, 15, -1.2]));
    return g;
  } },
  bigdish: { z: -20, r: 8, build: () => {
    // A giant radio telescope dish, tipped up to listen to the stars.
    const white = 0xe8eaf0, steel = 0x6a707c;
    const g = group(box(4, 1, 4, steel, [0, 0.5, 0]), box(1.2, 6, 1.2, white, [0, 4, 0]));
    const dish = new THREE.Group();
    dish.add(mesh(new THREE.SphereGeometry(8, 24, 10, 0, Math.PI * 2, 0, Math.PI * 0.32), white, [0, -8, 0]));
    dish.add(beam([0, -0.3, 0], [0, 5, 0], 0.2, steel), ball(0.6, steel, [0, 5.2, 0], 10));
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      dish.add(beam([Math.cos(a) * 3.8, 0.1, Math.sin(a) * 3.8], [0, 5, 0], 0.12, steel));
    }
    dish.position.set(0, 9.5, 0);
    dish.rotation.set(0.8, 0, 0.3);
    g.add(dish, ball(0.25, glow(0xff3a2a), [0, 7.2, 0.7], 8));
    return g;
  } },
  biglander: { z: -12, r: 6, build: () => {
    // A big lunar lander, gold foil and silver, standing on its four legs with the ladder down.
    const gold = 0xf0be3c, silver = 0xd2d6de;
    const g = group(box(4, 2.6, 4, gold, [0, 3.6, 0]), cyl(1.9, 2.2, 2.4, silver, [0, 6.1, 0], 8));
    for (const x of [-1, 1]) for (const z of [-1, 1]) g.add(beam([x * 1.8, 3, z * 1.8], [x * 3.4, 0.2, z * 3.4], 0.18, silver), cyl(0.6, 0.6, 0.15, silver, [x * 3.4, 0.1, z * 3.4], 10));
    for (let y = 0.6; y < 2.6; y += 0.5) g.add(box(1, 0.1, 0.1, 0x5a5a64, [0, y, 2.6]));
    g.add(box(1, 0.8, 0.05, glow(0x9ad8ff), [0, 6.4, 1.9]), cyl(0.9, 0.2, 0.3, 0xffffff, [1.6, 7.6, 0], 12, [0.6, 0, 0]));
    g.add(box(1.4, 0.8, 0.05, 0x5a5a64, [0, 4.2, 2.03]));
    return g;
  } },
  station: { z: -40, r: 0, on: 'air', build: () => {
    // A space station drifting overhead: a turning ring of modules round a hub, with solar wings.
    const white = 0xe8eaf0, panel = 0x2a4aa8;
    const g = new THREE.Group();
    g.add(mesh(new THREE.TorusGeometry(8, 0.9, 8, 24), white), ball(1.6, white, [0, 0, 0], 12));
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      g.add(beam([0, 0, 0], [Math.cos(a) * 8, Math.sin(a) * 8, 0], 0.3, white));
    }
    for (const x of [-14, 14]) g.add(box(8, 3, 0.1, panel, [x, 0, 0]), beam([Math.sign(x) * 8.5, 0, 0], [Math.sign(x) * 10, 0, 0], 0.2, white));
    g.position.set(0, 34, 0);
    g.rotation.set(0.3, 0, 0.2);
    return group(g);
  } },
  // ---- Sky Islands
  floatisle: { z: -30, r: 0, on: 'air', build: () => {
    // A little island floating above the track, a tree and a cottage on top, a waterfall
    // pouring off its edge and rocks hanging underneath.
    const g = new THREE.Group();
    g.add(cyl(7, 6.4, 1.6, 0x6ab85a, [0, 0, 0], 16));
    const under = mesh(new THREE.ConeGeometry(6.4, 12, 12), 0x9a7a5a, [0, -6.8, 0], [Math.PI, 0, 0]);
    g.add(under, mesh(new THREE.ConeGeometry(2, 5, 8), 0x8a6a4a, [4, -4, 2], [Math.PI, 0, 0.2]));
    g.add(cyl(0.3, 0.4, 3, 0x8a6a4a, [-3, 2.3, -1], 8), ball(2, 0x5aa84a, [-3, 4.6, -1], 10));
    g.add(box(3, 2.2, 2.4, 0xf4ecd8, [2, 1.9, -1]), mesh(new THREE.ConeGeometry(2.4, 1.8, 4), 0xd85a3a, [2, 3.9, -1], [0, Math.PI / 4, 0]));
    g.add(box(0.6, 0.6, 0.05, glow(0xffe8a0), [1.4, 2, 0.22]));
    g.add(box(1.6, 14, 0.2, new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.8 }), [5.5, -6.5, 3.5]));
    return group(g.translateY(14));
  } },
  skycastle: { z: -32, r: 0, on: 'air', build: () => {
    // A castle on the clouds: white towers with blue pointy roofs and flags.
    const wall = 0xf4f0e8, roof = 0x4a7ad8;
    const g = group(box(16, 8, 6, wall, [0, 4, 0]));
    for (let i = 0; i < 8; i++) g.add(box(1.2, 1, 6.2, wall, [-7.4 + i * 2.1, 8.5, 0]));
    for (const [x, h, r] of [[-9, 14, 2.4], [9, 14, 2.4], [-3, 18, 2], [3.5, 22, 2.2]] as const) {
      g.add(cyl(r, r, h, wall, [x, h / 2, 1], 14), mesh(new THREE.ConeGeometry(r * 1.25, r * 2.2, 14), roof, [x, h + r * 1.1, 1]));
      g.add(cyl(0.06, 0.06, 2, 0x5a5a64, [x, h + r * 2.2 + 1, 1], 6), box(1.2, 0.7, 0.05, 0xf2c040, [x + 0.6, h + r * 2.2 + 1.6, 1]));
    }
    g.add(box(3, 4.5, 0.2, 0x8a5a30, [0, 2.25, 3.05]));
    for (let i = 0; i < 5; i++) g.add(box(0.8, 1.2, 0.05, glow(0xffe8a0), [-6 + i * 3, 6, 3.05]));
    for (let k = 0; k < 9; k++) g.add(ball(3 + (k % 3), 0xffffff, [-12 + k * 3, 0, 2 + (k % 2) * 2], 10));
    return g;
  } },
  rainbow: { z: -45, r: 0, build: () => {
    // A rainbow arching right over the track, its ends in puffy clouds.
    const cols = [0xe84a3a, 0xf29a3a, 0xf2d84a, 0x6ac84a, 0x4a9ad8, 0x8a5ac8];
    const g = new THREE.Group();
    cols.forEach((c, i) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(30 - i * 1.2, 0.6, 6, 40, Math.PI), new THREE.MeshBasicMaterial({ color: c }));
      m.material.userData.outlineParameters = { visible: false };
      g.add(m);
    });
    for (const x of [-27, 27]) for (let k = 0; k < 4; k++) g.add(ball(3.5 + (k % 2), 0xffffff, [x + (k - 1.5) * 3, 1 + (k % 2), 1], 10));
    return g;
  } },
  bigwindmill: { z: -20, r: 0, on: 'air', build: () => {
    // A tall windmill with big white sails, on its own little hill.
    const g = group(mesh(new THREE.ConeGeometry(4.2, 12, 8), 0xe8dcc0, [0, 6, 0]), mesh(new THREE.ConeGeometry(2.4, 3, 8), 0x8a5a3a, [0, 13.2, 0]));
    const hub = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const sail = box(1.6, 8, 0.15, 0xffffff, [0, 4.4, 0]);
      const arm = new THREE.Group();
      arm.add(sail, box(0.3, 9, 0.2, 0x8a5a3a, [0, 4.2, -0.1]));
      arm.rotation.z = (k / 4) * Math.PI * 2 + 0.4;
      hub.add(arm);
    }
    hub.position.set(0, 11, 2.6);
    g.add(hub, ball(0.6, 0x5a5a64, [0, 11, 2.6], 8), box(1.6, 2.6, 0.2, 0x8a5a3a, [0, 1.3, 3.7]));
    // Its own little floating island.
    g.add(cyl(6, 5.4, 1.4, 0x6ab85a, [0, -0.7, 0], 14), mesh(new THREE.ConeGeometry(5.4, 9, 10), 0x9a7a5a, [0, -5.9, 0], [Math.PI, 0, 0]));
    return g;
  } },
  // --- The downhill world. Hillside Town:
  funicular: { z: -26, r: 7, build: () => {
    // A funicular (ascensor) up the hillside: a steep track on a viaduct, a little car, and a
    // station at each end.
    const g = new THREE.Group();
    const ang = 0.62, len = 22;
    const dx = Math.cos(ang) * len, dy = Math.sin(ang) * len;
    g.add(box(4, 3.4, 3.6, 0xf2c040, [-dx / 2 - 1.5, 1.7, 0]), box(4.4, 0.3, 4, 0x9a5a3a, [-dx / 2 - 1.5, 3.5, 0]));
    g.add(box(4, 3.4, 3.6, 0xe8768f, [dx / 2 + 1.5, dy + 1.7, 0]), box(4.4, 0.3, 4, 0x9a5a3a, [dx / 2 + 1.5, dy + 3.5, 0]));
    // The viaduct under the track, legs down to the ground.
    for (let i = 0; i <= 8; i++) {
      const t = i / 8, x = -dx / 2 + dx * t, y = dy * t;
      if (y > 0.5) g.add(box(0.5, y, 2.6, 0xd8d0c0, [x, y / 2, 0]));
    }
    g.add(beam([-dx / 2, 0.2, -0.7], [dx / 2, dy + 0.2, -0.7], 0.18, 0x5a5a62), beam([-dx / 2, 0.2, 0.7], [dx / 2, dy + 0.2, 0.7], 0.18, 0x5a5a62));
    g.add(beam([-dx / 2, 0.05, 0], [dx / 2, dy + 0.05, 0], 0.4, 0xc8c0b0));
    // The car, its floor level on the slope, half way up.
    const car = group(box(3.2, 2.2, 2.0, 0xd84a3a, [0, 1.1, 0]), box(3.4, 0.2, 2.2, 0xf4f0e8, [0, 2.3, 0]),
      box(2.6, 0.8, 2.05, 0x34465a, [0, 1.45, 0]), box(0.15, 2.2, 2.05, 0xf4f0e8, [-0.6, 1.1, 0]), box(0.15, 2.2, 2.05, 0xf4f0e8, [0.6, 1.1, 0]));
    car.position.set(-dx * 0.08, dy * 0.42 + 0.3, 0);
    g.add(car);
    return g;
  } },
  belltower: { z: -24, r: 5, build: () => {
    // The town church: a white nave and a tall bell tower with a clock and a tiled cap.
    const wall = 0xf4f0e8, trim = 0x5ca4e8;
    const g = group(box(9, 6, 6, wall, [2.5, 3, 0]), mesh(new THREE.ConeGeometry(5.4, 2.6, 4), 0x9a5a3a, [2.5, 7.3, 0], [0, Math.PI / 4, 0]));
    g.add(box(4, 17, 4, wall, [-3.5, 8.5, 0]), box(4.4, 0.5, 4.4, trim, [-3.5, 11.5, 0]), box(4.4, 0.5, 4.4, trim, [-3.5, 17, 0]));
    // Bell openings and the bell.
    g.add(box(1.6, 2.6, 4.1, 0x2a2a34, [-3.5, 14.2, 0]), cyl(0.5, 0.8, 1.0, 0xd8a83a, [-3.5, 14.4, 0], 10));
    g.add(mesh(new THREE.ConeGeometry(3.1, 4.5, 4), 0xd8783a, [-3.5, 19.5, 0], [0, Math.PI / 4, 0]), cyl(0.06, 0.06, 2.4, 0x3a3a3a, [-3.5, 22.6, 0], 4), box(1.2, 0.12, 0.12, 0x3a3a3a, [-3.5, 23.1, 0]));
    g.add(cyl(1.1, 1.1, 0.2, 0xfaf6ea, [-3.5, 9.6, 2.05], 20, [Math.PI / 2, 0, 0]), box(0.08, 0.8, 0.05, 0x2a2a2a, [-3.5, 9.9, 2.18]), box(0.6, 0.08, 0.05, 0x2a2a2a, [-3.3, 9.6, 2.18]));
    g.add(box(1.4, 3.2, 0.2, 0x7a4a2a, [2.5, 1.6, 3.05]), cyl(1.2, 1.2, 0.15, 0x5ca4e8, [2.5, 4.6, 3.05], 16, [Math.PI / 2, 0, 0]));
    return g;
  } },
  mural: { z: -10.5, r: 6, build: () => {
    // A wall painted end to end: sun, sea, hills and a rider mid-whip.
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 256;
    const c = cv.getContext('2d')!;
    const sky = c.createLinearGradient(0, 0, 0, 256);
    sky.addColorStop(0, '#ff7a5a'); sky.addColorStop(0.6, '#ffd060');
    c.fillStyle = sky; c.fillRect(0, 0, 512, 256);
    c.fillStyle = '#ffef9a'; c.beginPath(); c.arc(380, 120, 60, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3a8ad0'; c.fillRect(0, 170, 512, 86);
    c.fillStyle = '#5ac0e8'; for (let x = 0; x < 512; x += 40) { c.beginPath(); c.arc(x + 20, 176, 20, Math.PI, 0); c.fill(); }
    for (const [x, col] of [[60, '#e8768f'], [150, '#6ec482'], [240, '#b07ad8']] as const) { c.fillStyle = col; c.beginPath(); c.arc(x, 200, 90, Math.PI, 0); c.fill(); }
    c.strokeStyle = '#1a1a2a'; c.lineWidth = 9; c.lineCap = 'round';
    c.beginPath(); c.arc(250, 90, 26, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(330, 70, 26, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(250, 90); c.lineTo(285, 55); c.lineTo(330, 70); c.moveTo(285, 55); c.lineTo(300, 35); c.stroke();
    c.fillStyle = '#1a1a2a'; c.font = '900 44px system-ui, sans-serif'; c.fillText('BAJA!', 24, 60);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const g = group(box(13, 6.4, 0.8, 0xd8d0c0, [0, 3.2, 0]), box(13.4, 0.4, 1.0, 0x9a5a3a, [0, 6.5, 0]));
    g.add(mesh(new THREE.PlaneGeometry(12.4, 6), toon(0xffffff, { map: tex }), [0, 3.1, 0.41]));
    return g;
  } },
  // ---- Muddy Woods
  treehouse: { z: -14, r: 6, build: () => {
    // A big beech with a plank treehouse in its arms, a rope ladder and a little flag.
    const bark = 0x6a5a48, leaf = 0x4e8a3a, leaf2 = 0x6aa04a, plank = 0xa8743e;
    const g = group(cyl(1.0, 1.6, 12, bark, [0, 6, 0], 9));
    for (const [x, y, r, c] of [[0, 13.5, 4.2, leaf], [-3, 12, 3, leaf2], [3.2, 12.4, 3.1, leaf2], [0.5, 16, 3, leaf2], [-1.8, 15, 2.6, leaf]] as const) g.add(ball(r, c, [x, y, 0], 9));
    // The platform and hut.
    g.add(box(7, 0.35, 5, plank, [0, 7.2, 1.2]), box(4.2, 3, 3.4, 0xc08a50, [0.6, 8.9, 1.6]));
    g.add(mesh(new THREE.ConeGeometry(3.4, 1.8, 4), 0x8a3a2a, [0.6, 11.3, 1.6], [0, Math.PI / 4, 0]));
    g.add(box(1.0, 1.0, 0.1, 0x2a2018, [-0.2, 9.1, 3.32]), box(1.0, 1.7, 0.1, 0x5a3a20, [1.6, 8.25, 3.32]));
    for (const x of [-3.3, 3.3]) g.add(box(0.12, 1.0, 5, plank, [x, 7.9, 1.2]));
    for (const x of [-3.3, -2.2, -1.1, 2.6, 3.3]) g.add(box(0.12, 1.0, 0.12, plank, [x, 7.9, 3.65]));
    g.add(box(6.8, 0.12, 0.12, plank, [0, 8.4, 3.65]));
    // Struts down to the trunk.
    g.add(beam([-3, 7.0, 3.5], [-0.8, 4.2, 0.6], 0.25, plank), beam([3, 7.0, 3.5], [0.8, 4.2, 0.6], 0.25, plank));
    // Rope ladder.
    for (const x of [-2.7, -2.1]) g.add(beam([x, 7.0, 3.6], [x, 0.3, 3.8], 0.06, 0xd8c08a));
    for (let y = 1; y < 7; y += 0.7) g.add(box(0.7, 0.08, 0.12, plank, [-2.4, y, 3.7]));
    g.add(cyl(0.05, 0.05, 2.4, 0x3a3a3a, [2.4, 11.6, 1.6], 4), box(1.1, 0.6, 0.04, 0xf2c040, [2.95, 12.4, 1.6]));
    return g;
  } },
  logcabin: { z: -12, r: 6, build: () => {
    // A woodcutter's cabin of round logs, a stone chimney, a log pile and a chopping block.
    const log = 0x8a5a32, end = 0xd8a868, stone = 0x8a8a84;
    const g = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const y = 0.3 + i * 0.55;
      g.add(cyl(0.3, 0.3, 8.4, log, [0, y, 2.2], 8, [0, 0, Math.PI / 2]), cyl(0.3, 0.3, 8.4, log, [0, y, -2.2], 8, [0, 0, Math.PI / 2]));
      g.add(cyl(0.3, 0.3, 5, log, [-3.8, y + 0.27, 0], 8, [Math.PI / 2, 0, 0]), cyl(0.3, 0.3, 5, log, [3.8, y + 0.27, 0], 8, [Math.PI / 2, 0, 0]));
    }
    // Roof: two sloped planes.
    g.add(box(9.4, 0.3, 3.6, 0x4a3a2e, [0, 6.0, 1.3], [0.62, 0, 0]), box(9.4, 0.3, 3.6, 0x4a3a2e, [0, 6.0, -1.3], [-0.62, 0, 0]));
    g.add(box(4, 3.2, 1, 0x4a3a2e, [-3.8, 6, 0], [0, Math.PI / 2, 0]));
    g.add(box(1.4, 2.6, 0.2, 0x5a3418, [1.2, 1.3, 2.55]), box(1.4, 1.1, 0.2, 0xffd88a, [-2, 2.6, 2.55]), box(1.6, 0.15, 0.3, log, [-2, 2.0, 2.6]));
    // Chimney with a puff of smoke.
    g.add(box(1.2, 8, 1.2, stone, [3.2, 4, -1]));
    for (const [y, r, x] of [[8.6, 0.6, 3.3], [9.6, 0.8, 3.6], [10.8, 1.0, 4.1]] as const) g.add(ball(r, 0xe8e8ec, [x, y, -1], 8));
    // Log pile, each log end showing its rings.
    for (let row = 0; row < 3; row++) for (let k = 0; k < 4 - row; k++) {
      const x = -7.2 + k * 0.7 + row * 0.35, y = 0.32 + row * 0.6;
      g.add(cyl(0.32, 0.32, 2.4, log, [x, y, 1.6], 8, [Math.PI / 2, 0, 0]), cyl(0.26, 0.26, 0.02, end, [x, y, 2.81], 8, [Math.PI / 2, 0, 0]));
    }
    g.add(cyl(0.55, 0.6, 0.9, log, [6.2, 0.45, 2.5], 10), cyl(0.5, 0.5, 0.02, end, [6.2, 0.91, 2.5], 10));
    g.add(beam([6.1, 0.9, 2.5], [6.6, 1.8, 2.7], 0.08, 0x7a5a3a), box(0.4, 0.3, 0.08, 0xb8b8c0, [6.65, 1.85, 2.7]));
    return g;
  } },
  bigoak: { z: -18, r: 8, build: (rand) => {
    // An ancient oak, wider than a house, with a tyre swing.
    const bark = 0x5a4a3a, leaf = 0x3e7a34, leaf2 = 0x5a943e;
    const g = group(cyl(2.0, 3.0, 8, bark, [0, 4, 0], 10));
    for (let a = 0; a < 5; a++) {
      const ang = (a / 5) * Math.PI * 2 + 0.4;
      g.add(beam([0, 0.8, 0], [Math.cos(ang) * 4, 0, Math.sin(ang) * 4], 0.9, bark));
    }
    for (const [x, up, len] of [[-1, 7.5, 7], [1, 7, 7.5], [0, 8, 4], [-1, 6, 5.5]] as const) g.add(beam([0, up - 1, 0], [x * len, up + 3.5, 0.5], 0.9, bark));
    for (let i = 0; i < 9; i++) {
      const x = (rand() - 0.5) * 16, y = 12 + rand() * 4.5, r = 3 + rand() * 1.8;
      g.add(ball(r, i % 2 ? leaf : leaf2, [x, y, (rand() - 0.5) * 2], 9));
    }
    // A branch for the swing.
    g.add(beam([1, 7.5, 0.4], [6.8, 8.3, 1.2], 0.5, bark));
    g.add(beam([5.6, 8.1, 1.1], [5.6, 2.2, 1.6], 0.05, 0xd8c08a));
    g.add(mesh(new THREE.TorusGeometry(0.75, 0.28, 8, 16), 0x2a2a2e, [5.6, 1.6, 1.6]));
    return g;
  } },
  stonebridge: { z: -16, r: 9, build: () => {
    // An old mossy stone railway viaduct striding across the valley on round arches.
    const stone = 0x9a948a, moss = 0x5e8a44;
    const span = 6, n = 4, h = 11, pier = 1.4, w = span * n + pier;
    const face = new THREE.Shape();
    face.moveTo(-w / 2, 0); face.lineTo(w / 2, 0); face.lineTo(w / 2, h); face.lineTo(-w / 2, h); face.lineTo(-w / 2, 0);
    const rad = (span - pier) / 2, spring = h - 2.2 - rad;
    for (let i = 0; i < n; i++) {
      const cx = -w / 2 + pier + rad + i * span;
      const hole = new THREE.Path();
      hole.moveTo(cx - rad, 0); hole.lineTo(cx + rad, 0); hole.lineTo(cx + rad, spring);
      hole.absarc(cx, spring, rad, 0, Math.PI, false);
      hole.lineTo(cx - rad, 0);
      face.holes.push(hole);
    }
    const geo = new THREE.ExtrudeGeometry(face, { depth: 3, bevelEnabled: false, curveSegments: 10 });
    const g = group(mesh(geo, stone, [0, 0, -1.5]));
    g.add(box(w + 0.6, 0.5, 3.4, 0x7e786e, [0, h + 0.25, 0]), box(w + 0.6, 0.18, 3.5, moss, [0, h + 0.55, 0]));
    // Parapet posts, moss at the pier feet and ivy hanging down the face.
    for (let x = -w / 2; x <= w / 2; x += 1.5) g.add(box(0.3, 0.8, 0.3, stone, [x, h + 0.9, 1.4]));
    for (let i = 0; i <= n; i++) g.add(box(pier + 0.4, 0.7, 3.4, moss, [-w / 2 + pier / 2 + i * span, 0.35, 0]));
    for (const [x, len] of [[-9.4, 4], [-3.4, 2.5], [2.6, 5], [8.6, 3]] as const) {
      g.add(box(1.0, len, 0.2, moss, [x, h - len / 2, 1.55]), ball(0.5, moss, [x, h - len, 1.6], 7));
    }
    return g;
  } },
  // ---- Boulder Peak
  mountainhut: { z: -14, r: 6, build: () => {
    // A mountain refuge: stone ground floor, wooden top with a balcony, a steep roof and a flag.
    const stone = 0xa09a90, wood = 0x9a6a3a, roof = 0x8a3a2a;
    const g = group(box(8, 3, 5.5, stone, [0, 1.5, 0]), box(8, 2.6, 5.5, wood, [0, 4.3, 0]));
    g.add(box(8.8, 0.3, 4, roof, [0, 6.8, 1.4], [0.75, 0, 0]), box(8.8, 0.3, 4, roof, [0, 6.8, -1.4], [-0.75, 0, 0]));
    // Windows with red shutters, the door and the balcony.
    for (const x of [-2.4, 2.4]) {
      g.add(box(1.0, 1.0, 0.1, 0xffe8a8, [x, 4.4, 2.8]), box(0.4, 1.1, 0.1, 0xd84a3a, [x - 0.75, 4.4, 2.82]), box(0.4, 1.1, 0.1, 0xd84a3a, [x + 0.75, 4.4, 2.82]));
    }
    g.add(box(1.3, 2.2, 0.15, 0x5a3418, [0, 1.1, 2.8]));
    g.add(box(8, 0.2, 1.2, wood, [0, 3.0, 3.3]), box(8, 0.8, 0.1, wood, [0, 3.5, 3.85]));
    for (let x = -3.8; x <= 3.8; x += 0.95) g.add(box(0.1, 0.8, 0.1, wood, [x, 3.5, 3.85]));
    g.add(box(0.8, 2, 0.8, stone, [2.6, 8, -1]));
    // The flag pole, with a red-and-white flag.
    g.add(cyl(0.06, 0.06, 6, 0xe8e8e8, [5.2, 3, 2], 6), box(1.4, 0.45, 0.04, 0xd84a3a, [5.95, 5.5, 2]), box(1.4, 0.45, 0.04, 0xf4f4f4, [5.95, 5.05, 2]));
    // Firewood stacked against the wall.
    g.add(box(2.4, 1.4, 0.8, 0x7a5030, [-5.4, 0.7, 1.5]));
    return g;
  } },
  summitcross: { z: -22, r: 6, build: () => {
    // The summit: a craggy top, a cairn and a tall cross with a little box for the summit book.
    const rock = 0x8a8478, rock2 = 0x6e695e;
    const g = group(mesh(new THREE.ConeGeometry(7, 9, 7), rock, [0, 4.5, 0]), mesh(new THREE.ConeGeometry(4, 6, 6), rock2, [-4.5, 3, 1], [0, 0.5, 0.15]));
    g.add(mesh(new THREE.ConeGeometry(2.4, 3.05, 7), 0xf4f6fa, [0, 7.5, 0]));
    g.add(box(0.5, 6, 0.5, 0xd8a83a, [0, 12, 0]), box(3, 0.5, 0.5, 0xd8a83a, [0, 13.4, 0]), box(0.5, 0.5, 0.5, 0x3a3a3a, [0, 10.5, 0.4]));
    for (const [y, r] of [[0.4, 0.8], [1.1, 0.6], [1.7, 0.45], [2.2, 0.3]] as const) g.add(ball(r, 0x9a948a, [4.5, y, 2], 7));
    return g;
  } },
  cablecar: { z: -20, r: 8, build: () => {
    // A cable car up the mountain: two steel pylons, the cables, and a red cabin half way.
    const steel = 0x7a8088, g = new THREE.Group();
    const a: V3 = [-12, 8, 0], b: V3 = [12, 20, 0];
    for (const [x, h] of [[-12, 8], [12, 20]] as const) {
      g.add(beam([x - 1.2, 0, 0], [x, h, 0], 0.35, steel), beam([x + 1.2, 0, 0], [x, h, 0], 0.35, steel));
      for (let y = 2; y < h - 1; y += 2.5) g.add(box(2.4 * (1 - y / h) + 0.3, 0.15, 0.15, steel, [x, y, 0]));
      g.add(box(3, 0.4, 0.6, steel, [x, h, 0]));
    }
    for (const dz of [-0.3, 0.3]) g.add(beam([a[0], a[1], dz], [b[0], b[1], dz], 0.06, 0x2a2a2e));
    const t = 0.45, cx = a[0] + (b[0] - a[0]) * t, cy = a[1] + (b[1] - a[1]) * t;
    g.add(beam([cx, cy, 0], [cx, cy - 2.4, 0], 0.12, 0x2a2a2e));
    g.add(box(2.6, 2.0, 2.0, 0xd84a3a, [cx, cy - 3.4, 0]), box(2.2, 0.8, 2.05, 0x34465a, [cx, cy - 3.1, 0]), box(2.8, 0.2, 2.2, 0xf4f4f4, [cx, cy - 2.35, 0]));
    // The station at the bottom.
    g.add(box(6, 3, 4, 0xe8e0d0, [-15, 1.5, 0]), box(6.6, 0.3, 4.6, 0x5a5a62, [-15, 3.15, 0]));
    return g;
  } },
  eaglerock: { z: -16, r: 6, build: () => {
    // A tall rock tower with an eagle's nest on top and the eagle perched beside it.
    const rock = 0x8a8478, rock2 = 0xa49e92;
    const g = group(cyl(2.2, 3.6, 12, rock, [0, 6, 0], 7), cyl(1.4, 2.4, 4, rock2, [0.4, 13.5, 0], 6));
    g.add(cyl(3, 4.5, 3, rock2, [-3.6, 1.5, 1], 6), mesh(new THREE.TorusGeometry(1.1, 0.4, 6, 12), 0x7a5a3a, [0.4, 15.7, 0], [Math.PI / 2, 0, 0]));
    // The eagle: brown body, white head, yellow beak, wings half open.
    const eagle = group(ball(0.55, 0x5a3a24, [0, 0, 0], 8), ball(0.3, 0xf4f0e8, [0.45, 0.45, 0], 8), mesh(new THREE.ConeGeometry(0.1, 0.3, 5), 0xf2c040, [0.75, 0.42, 0], [0, 0, -Math.PI / 2]));
    eagle.add(box(0.15, 0.4, 1.8, 0x4a2e1a, [-0.1, 0.2, 0], [0.3, 0, 0]));
    eagle.position.set(1.6, 16.1, 0.6);
    g.add(eagle);
    return g;
  } },
  // ---- North Shore
  firelookout: { z: -18, r: 5, build: () => {
    // A fire lookout: a little cabin with windows all round on a tall timber tower.
    const wood = 0x7a5232, g = new THREE.Group(), h = 14;
    for (const [x, z] of [[-2, -2], [2, -2], [-2, 2], [2, 2]] as const) g.add(beam([x * 1.4, 0, z * 1.4], [x * 0.8, h, z * 0.8], 0.3, wood));
    for (let y = 3; y < h; y += 3.5) {
      const k = 1.4 - (0.6 * y) / h;
      g.add(beam([-2 * k, y, 2 * k], [2 * k, y + 3.5, 2 * k], 0.15, wood), beam([2 * k, y, 2 * k], [-2 * k, y + 3.5, 2 * k], 0.15, wood));
    }
    g.add(box(4.6, 0.3, 4.6, wood, [0, h, 0]), box(3.6, 2.4, 3.6, 0xd8c8a0, [0, h + 1.35, 0]), box(3.7, 1.0, 3.7, 0x34465a, [0, h + 1.7, 0]));
    g.add(mesh(new THREE.ConeGeometry(3.2, 1.6, 4), 0x4a6a3a, [0, h + 3.3, 0], [0, Math.PI / 4, 0]));
    // Stairs zig-zagging up one side.
    for (let y = 0; y < h; y += 3.5) g.add(beam([y % 7 ? -2 : 2, y, 2.6], [y % 7 ? 2 : -2, y + 3.5, 2.6], 0.4, 0x9a7048));
    return g;
  } },
  trestle: { z: -22, r: 10, build: () => {
    // An old wooden logging-railway trestle across the valley, criss-crossed timbers.
    const wood = 0x6a4a2e, g = new THREE.Group(), h = 12, n = 7, sp = 4;
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * sp;
      g.add(beam([x - 1.2, 0, 0], [x - 0.6, h, 0], 0.3, wood), beam([x + 1.2, 0, 0], [x + 0.6, h, 0], 0.3, wood));
      for (let y = 0; y < h; y += 4) g.add(beam([x - 1.1, y, 0.2], [x + 1.1, y + 4, 0.2], 0.12, wood), beam([x + 1.1, y, 0.2], [x - 1.1, y + 4, 0.2], 0.12, wood));
      if (i < n - 1) for (let y = 4; y < h; y += 4) g.add(beam([x, y, -0.2], [x + sp, y, -0.2], 0.15, wood));
    }
    g.add(box(sp * n, 0.5, 2.4, wood, [0, h + 0.25, 0]), box(sp * n, 0.15, 0.15, 0x5a5a62, [0, h + 0.6, 0.6]), box(sp * n, 0.15, 0.15, 0x5a5a62, [0, h + 0.6, -0.6]));
    // A little old locomotive parked on it.
    g.add(box(4, 2, 2, 0x2a2a30, [6, h + 1.6, 0]), cyl(0.8, 0.8, 3.4, 0x2a2a30, [3.6, h + 1.4, 0], 12, [0, 0, Math.PI / 2]), cyl(0.3, 0.4, 1.2, 0x2a2a30, [2.4, h + 2.6, 0], 8), box(4.2, 0.2, 2.2, 0xc8402a, [6, h + 2.7, 0]));
    return g;
  } },
  bigcedar: { z: -14, r: 6, build: () => {
    // A giant old cedar, wider than a car, with a wooden ramp spiralling round it.
    const bark = 0x7a4a32, leaf = 0x2e5a3a, leaf2 = 0x3a6a44, wood = 0x9a7048;
    const g = group(cyl(1.6, 2.4, 22, bark, [0, 11, 0], 10));
    for (let i = 0; i < 6; i++) {
      const y = 9 + i * 2.6, r = 6 - i * 0.8;
      g.add(mesh(new THREE.ConeGeometry(r, 4, 9), i % 2 ? leaf : leaf2, [0, y + 2, 0]));
    }
    for (let a = 0; a < 6; a++) g.add(beam([0, 0.6, 0], [Math.cos(a) * 3.4, 0, Math.sin(a) * 3.4], 0.8, bark));
    // The spiral ramp of planks round the trunk, on brackets.
    for (let k = 0; k < 18; k++) {
      const a = k * 0.55, y = 0.6 + k * 0.32, r = 2.9;
      const plank = box(1.6, 0.12, 0.9, wood, [Math.cos(a) * r, y, Math.sin(a) * r], [0, -a, 0]);
      g.add(plank, beam([Math.cos(a) * 2.1, y - 0.6, Math.sin(a) * 2.1], [Math.cos(a) * r, y, Math.sin(a) * r], 0.1, wood));
    }
    return g;
  } },
  // ---- Whitewater Centre
  slalomgates: { z: -4, r: 0, on: 'air', build: () => {
    // Slalom gates hanging over the course from a wire: pairs of striped poles, green to go
    // down through, red to come back up through, as at a real slalom course.
    const g = new THREE.Group();
    const wire = 0x2a2a2e, pylon = 0x9aa0a8;
    // A pylon on the far bank with an arm reaching out over the water.
    g.add(box(0.3, 8, 0.3, pylon, [0, 3, -8.5]), box(0.2, 0.2, 9, pylon, [0, 7.4, -4]), beam([0, 4.5, -8.5], [0, 7.3, -5], 0.15, pylon));
    g.add(box(0.04, 0.04, 8.5, wire, [0, 7.25, -4.2]));
    for (const [z, red] of [[-1.2, false], [-4.4, true]] as const) {
      const c = red ? 0xe03a2a : 0x2ea84a;
      const gate = new THREE.Group();
      for (const dx of [-0.7, 0.7]) {
        gate.add(beam([dx, 7.3, z], [dx, 1.4, z], 0.03, wire));
        for (let k = 0; k < 5; k++) gate.add(cyl(0.05, 0.05, 0.4, k % 2 ? 0xf4f4f0 : c, [dx, 1.2 + k * 0.4, z], 8));
      }
      gate.add(box(1.0, 0.3, 0.03, 0xf4f4f0, [0, 3.6, z]));
      g.add(gate);
    }
    return g;
  } },
  pumphouse: { z: -16, r: 7, build: () => {
    // The pump house that sends the water round: a block with big blue pipes and the sign.
    const wall = 0xd8d4c8, pipe = 0x2a7ac0;
    const g = group(box(12, 6, 6, wall, [0, 3, 0]), box(12.4, 0.5, 6.4, 0x5a6470, [0, 6.25, 0]));
    for (const x of [-3.5, 0, 3.5]) g.add(cyl(0.6, 0.6, 7, pipe, [x, 0.6, 4.5], 14, [Math.PI / 2, 0, 0]), cyl(0.9, 0.9, 0.5, pipe, [x, 0.6, 3.1], 14, [Math.PI / 2, 0, 0]));
    for (const x of [-4.5, -1.5, 1.5, 4.5]) g.add(box(1.6, 1.4, 0.1, 0x8ac8e8, [x, 4.2, 3.05]));
    g.add(box(1.6, 2.6, 0.1, 0x3a4a5a, [5, 1.3, 3.05]));
    const sign = textPanel('WHITEWATER CENTRE', 10, 1.3, '#1e5a8a', '#ffffff');
    sign.position.set(0, 7.3, 3.1);
    return g.add(sign), g;
  } },
  grandstand: { z: -15, r: 8, build: (rand) => {
    // Stepped seating full of fans waving flags, for race day.
    const g = new THREE.Group();
    const shirt = [0xe84a3a, 0x3a7ad8, 0xf2c040, 0x4ab84a, 0xf4f4f0, 0xc84ad8];
    for (let row = 0; row < 5; row++) {
      g.add(box(14, 0.5, 1.2, 0x9aa0a8, [0, 0.25 + row * 0.6, 2.4 - row * 1.2]));
      for (let k = 0; k < 13; k++) {
        if (rand() < 0.25) continue;
        const x = -6.4 + k + (rand() - 0.5) * 0.3, y = 0.5 + row * 0.6, z = 2.4 - row * 1.2;
        g.add(cyl(0.2, 0.22, 0.6, shirt[Math.floor(rand() * shirt.length)], [x, y + 0.3, z], 6), ball(0.15, 0xe0b090, [x, y + 0.75, z], 6));
        if (rand() < 0.15) g.add(box(0.02, 0.9, 0.02, 0x3a3a3a, [x + 0.25, y + 1.0, z]), box(0.45, 0.3, 0.02, shirt[k % shirt.length], [x + 0.48, y + 1.3, z]));
      }
    }
    g.add(box(15, 0.2, 7, 0x4a5460, [0, 4.4, -0.2]));
    for (const x of [-7, 7]) g.add(box(0.2, 4.4, 0.2, 0x4a5460, [x, 2.2, 2.8]), box(0.2, 4.4, 0.2, 0x4a5460, [x, 2.2, -3.4]));
    return g;
  } },
  boatlift: { z: -14, r: 6, build: () => {
    // The conveyor that carries paddlers and their boats back up to the top of the course.
    const g = new THREE.Group();
    const frame = 0x7a828c, belt = 0x2a2a2e;
    g.add(beam([-6, 0.4, 0], [6, 4.6, 0], 1.6, belt));
    for (let k = 0; k <= 4; k++) { const x = -6 + k * 3, y = 0.4 + k * 1.05; g.add(box(0.2, y, 0.2, frame, [x, y / 2, 0.9]), box(0.2, y, 0.2, frame, [x, y / 2, -0.9])); }
    const boats = [0xf2552a, 0x2ab0e0, 0xffd02a];
    boats.forEach((c, i) => {
      const x = -4 + i * 4, y = 1.3 + (x + 6) * 0.35;
      const b = mesh(new THREE.SphereGeometry(1, 12, 8), c, [x, y, 0], [0, 0, Math.atan(0.35)]);
      b.scale.set(1.3, 0.22, 0.32);
      g.add(b);
    });
    g.add(box(2.4, 2.6, 2.4, 0xd8d4c8, [7.2, 1.3, 0]), box(2.6, 0.3, 2.6, 0x5a6470, [7.2, 2.75, 0]));
    return g;
  } },
  boatrack: { z: -12, r: 4, build: () => {
    // A rack of hire boats in every colour, paddles leaning against it.
    const g = new THREE.Group();
    const wood = 0x8a6a42, cols = [0xf2552a, 0x2ab0e0, 0xffd02a, 0x4ab84a, 0xc84ad8, 0xe84a8a];
    for (const x of [-3, 3]) g.add(box(0.2, 3, 0.2, wood, [x, 1.5, 0.6]), box(0.2, 3, 0.2, wood, [x, 1.5, -0.6]));
    for (let row = 0; row < 3; row++) {
      g.add(box(6.4, 0.15, 1.4, wood, [0, 0.6 + row * 0.9, 0]));
      const b = mesh(new THREE.SphereGeometry(1, 12, 8), cols[row * 2 % cols.length], [0, 0.85 + row * 0.9, 0]);
      b.scale.set(2.6, 0.22, 0.32);
      g.add(b);
    }
    for (let k = 0; k < 4; k++) g.add(beam([4 + k * 0.3, 0, 0.9], [3.6 + k * 0.3, 2.2, 0.6], 0.05, 0x2a2a2e), box(0.2, 0.5, 0.03, 0xffd02a, [3.6 + k * 0.3, 2.3, 0.6]));
    return g;
  } },
  // ---- Forest Creek
  watermill: { z: -14, r: 7, build: () => {
    // An old stone mill on the creek with its wooden wheel turning in the leat.
    const stone = 0x8a8478, wood = 0x6a4a2e, roof = 0x5a3a32;
    const g = group(box(8, 6, 6, stone, [0, 3, 0]), box(8.6, 0.3, 4, roof, [0, 6.9, 1.4], [0.7, 0, 0]), box(8.6, 0.3, 4, roof, [0, 6.9, -1.4], [-0.7, 0, 0]));
    g.add(box(1.4, 2.6, 0.2, wood, [1.5, 1.3, 3.05]), box(1.2, 1.2, 0.2, 0xffd88a, [-2, 4, 3.05]));
    const wheel = new THREE.Group();
    wheel.add(mesh(new THREE.TorusGeometry(2.6, 0.18, 6, 20), wood));
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      wheel.add(box(0.15, 2.6, 0.15, wood, [Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0], [0, 0, a + Math.PI / 2]), box(0.8, 0.12, 0.9, wood, [Math.cos(a) * 2.7, Math.sin(a) * 2.7, 0], [0, 0, a]));
    }
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(4.6, 2.6, 0.5);
    g.add(wheel, box(0.6, 0.5, 6, 0x3a8e9a, [4.6, 0.1, 0.5]));
    return g;
  } },
  kayakcamp: { z: -11, r: 5, build: () => {
    // A paddlers' camp on the bank: two tents, boats pulled up, a campfire.
    const g = new THREE.Group();
    for (const [x, c] of [[-2.5, 0xe86a2a], [1.5, 0x3a8ad8]] as const) {
      const t = mesh(new THREE.ConeGeometry(1.5, 1.8, 4), c, [x, 0.9, -0.5], [0, Math.PI / 4, 0]);
      t.scale.z = 1.4;
      g.add(t);
    }
    for (const [x, c] of [[-1, 0xf2552a], [3.5, 0xffd02a]] as const) {
      const b = mesh(new THREE.SphereGeometry(1, 12, 8), c, [x, 0.25, 1.6], [0, 0.3, 0]);
      b.scale.set(1.3, 0.22, 0.32);
      g.add(b);
    }
    g.add(cyl(0.6, 0.7, 0.2, 0x6a6a62, [0.5, 0.1, 1], 10), mesh(new THREE.ConeGeometry(0.35, 0.8, 6), glow(0xff9a2a), [0.5, 0.5, 1]));
    for (const a of [0.3, 1.9, 3.4]) g.add(cyl(0.12, 0.12, 1.2, 0x6a4a2e, [0.5 + Math.cos(a) * 1.2, 0.15, 1 + Math.sin(a) * 1.2], 6, [Math.PI / 2, a, 0]));
    return g;
  } },
  heronrock: { z: -10, r: 3, build: () => {
    // A big mossy boulder with a grey heron standing on it, watching for fish.
    const g = new THREE.Group();
    const rock = mesh(new THREE.DodecahedronGeometry(2.2, 0), 0x7a7a70, [0, 1.2, 0]);
    rock.scale.set(1.3, 0.7, 1);
    g.add(rock, ball(1.1, 0x4a7a3a, [-0.6, 2.1, 0.2], 7));
    const grey = 0x9aa2a8;
    const body = ball(0.4, grey, [0.6, 3.0, 0.2], 10);
    body.scale.set(1.4, 0.8, 0.8);
    g.add(body, beam([0.2, 2.2, 0.2], [0.3, 2.85, 0.2], 0.05, 0xc8a040), beam([0.6, 2.2, 0.2], [0.6, 2.85, 0.2], 0.05, 0xc8a040));
    g.add(beam([1.1, 3.1, 0.2], [1.25, 3.8, 0.2], 0.12, grey), ball(0.17, 0xe8ecee, [1.3, 3.9, 0.2], 8), beam([1.4, 3.9, 0.2], [1.85, 3.85, 0.2], 0.05, 0xe0b040));
    return g;
  } },
  startgate: { z: -6, r: 4, build: () => {
    // The race's inflatable arch and a timing screen.
    const g = new THREE.Group();
    const arch = mesh(new THREE.TorusGeometry(3.4, 0.55, 10, 24, Math.PI), 0xd84a3a, [0, 0, 0]);
    g.add(arch);
    const panel = textPanel('DOWNHILL', 5.2, 1.1, '#ffd84a', '#1a1a2a');
    panel.position.set(0, 3.5, 0.6);
    g.add(panel, box(1.4, 1.2, 1.4, 0x2a2a34, [-3.4, 0.6, 0]), box(1.4, 1.2, 1.4, 0x2a2a34, [3.4, 0.6, 0]));
    const clock = textPanel('0:00.00', 2.4, 0.8, '#101018', '#ff5a3a');
    clock.position.set(5.5, 2.6, 0.2);
    g.add(clock, cyl(0.08, 0.08, 2.2, 0x3a3a3a, [5.5, 1.1, 0], 6));
    return g;
  } },
};

/** Which landmarks each track has, spread along it in order. */
export const TRACK_LANDMARKS: Record<string, string[]> = {
  'park-1': ['fountain'], 'park-2': ['playground'], 'park-3': ['pond', 'windmill'], 'park-4': ['bandstand'],
  'park-5': ['balloons', 'fountain'], 'park-6': ['playground', 'pond'], 'park-7': ['ferris'], 'park-8': ['windmill', 'bandstand'],
  'park-9': ['balloons', 'ferris'], 'park-10': ['fountain', 'bandstand'], 'park-pipe': ['ferris'],
  'beach-1': ['sandcastle', 'lighthouse'], 'beach-2': ['beachhuts'], 'beach-3': ['sailboats', 'shipwreck'], 'beach-4': ['pierwheel'],
  'beach-5': ['lighthouse', 'beachhuts'], 'beach-6': ['shipwreck', 'sandcastle'], 'beach-7': ['pierwheel', 'sailboats'], 'beach-8': ['lighthouse'],
  'beach-9': ['beachhuts', 'pierwheel'], 'beach-10': ['lighthouse', 'shipwreck'], 'beach-pipe': ['pierwheel'],
  'rooftops-1': ['billboard'], 'rooftops-2': ['garden', 'radiotower'], 'rooftops-3': ['helipad'], 'rooftops-4': ['crane', 'billboard'],
  'rooftops-5': ['blimp', 'radiotower'], 'rooftops-6': ['billboard', 'helipad'], 'rooftops-7': ['garden', 'crane'], 'rooftops-8': ['blimp', 'helipad'],
  'rooftops-9': ['radiotower', 'billboard'], 'rooftops-10': ['crane', 'radiotower'], 'rooftops-mega': ['blimp', 'billboard'],
  'snow-1': ['igloo'], 'snow-2': ['skijump'], 'snow-3': ['snowcat', 'icefall'], 'snow-4': ['observatory'],
  'snow-5': ['igloo', 'skijump'], 'snow-6': ['icefall'], 'snow-7': ['snowcat', 'observatory'], 'snow-8': ['skijump', 'igloo'],
  'snow-9': ['icefall', 'snowcat'], 'snow-10': ['observatory', 'igloo'], 'snow-mega': ['skijump'],
  'desert-1': ['windpump'], 'desert-2': ['arch'], 'desert-3': ['saloon', 'watertower'], 'desert-4': ['hoodoos'],
  'desert-5': ['oldcar', 'arch'], 'desert-6': ['windpump', 'hoodoos'], 'desert-7': ['saloon'], 'desert-8': ['arch', 'oldcar'],
  'desert-9': ['watertower', 'windpump'], 'desert-10': ['hoodoos', 'saloon'], 'desert-mega': ['arch'],
  'jungle-1': ['totems'], 'jungle-2': ['waterfall'], 'jungle-3': ['bighead', 'temple'], 'jungle-4': ['ropebridge'],
  'jungle-5': ['totems', 'waterfall'], 'jungle-6': ['temple'], 'jungle-7': ['ropebridge', 'bighead'], 'jungle-8': ['waterfall', 'totems'],
  'jungle-9': ['temple', 'ropebridge'], 'jungle-10': ['bighead', 'temple'], 'jungle-pipe': ['temple'],
  'volcano-1': ['geyser'], 'volcano-2': ['bones'], 'volcano-3': ['lavafall', 'spire'], 'volcano-4': ['basaltarch'],
  'volcano-5': ['spire', 'geyser'], 'volcano-6': ['bones', 'lavafall'], 'volcano-7': ['basaltarch', 'geyser'], 'volcano-8': ['lavafall'],
  'volcano-9': ['spire', 'bones'], 'volcano-10': ['lavafall', 'basaltarch'], 'volcano-mega': ['spire'],
  'farm-1': ['barn'], 'farm-2': ['tractor', 'silos'], 'farm-3': ['haystack', 'windmill'], 'farm-4': ['coop', 'farmhouse'],
  'farm-5': ['maze'], 'farm-6': ['pumpkinpatch', 'barn'], 'farm-7': ['combine', 'silos'], 'farm-8': ['balloons', 'farmhouse'],
  'farm-pipe': ['barn'],
  'candy-1': ['lolliarch'], 'candy-2': ['bigcupcake', 'gingerhouse'], 'candy-3': ['gumball', 'donutwheel'], 'candy-4': ['chocfall'],
  'candy-5': ['layercake', 'lolliarch'], 'candy-6': ['gingerhouse', 'gumball'], 'candy-7': ['donutwheel', 'bigcupcake'], 'candy-8': ['gingercastle'],
  'candy-pipe': ['donutwheel'],
  'docks-1': ['harbourclock', 'tugboat'], 'docks-2': ['gantry', 'cargoship'], 'docks-3': ['fishmarket', 'warehouse'], 'docks-4': ['gantry', 'tugboat'],
  'docks-5': ['lighthouse', 'ferry'], 'docks-6': ['ferry', 'harbourclock'], 'docks-7': ['cargoship', 'gantry'], 'docks-8': ['warehouse', 'tugboat'],
  'docks-9': ['lighthouse', 'cargoship'], 'docks-10': ['gantry', 'ferry'], 'docks-mega': ['gantry'],
  'pirate-1': ['treasure', 'pirateship'], 'pirate-2': ['shipwreck', 'tavern'], 'pirate-3': ['fort'], 'pirate-4': ['skullrock', 'treasure'],
  'pirate-5': ['fort', 'pirateship'], 'pirate-6': ['tavern', 'skullrock'], 'pirate-7': ['shipwreck', 'lighthouse'], 'pirate-8': ['pirateship', 'fort'],
  'pirate-pipe': ['pirateship'],
  'haunted-1': ['graveyardgate', 'spookyoak'], 'haunted-2': ['manor'], 'haunted-3': ['witchhut', 'graveyardgate'], 'haunted-4': ['giantpumpkin', 'spookyoak'],
  'haunted-5': ['manor', 'witchhut'], 'haunted-6': ['spookyoak', 'giantpumpkin'], 'haunted-7': ['graveyardgate', 'manor'], 'haunted-8': ['manor'],
  'haunted-pipe': ['manor'],
  'funfair-1': ['balloonarch', 'ferris'], 'funfair-2': ['carousel', 'coasterhill'], 'funfair-3': ['coasterhill'], 'funfair-4': ['helterskelter', 'bigtop'],
  'funfair-5': ['helterskelter', 'carousel'], 'funfair-6': ['bigtop', 'ferris'], 'funfair-7': ['carousel', 'coasterhill'], 'funfair-8': ['bigtop', 'helterskelter'],
  'funfair-9': ['ferris', 'carousel'], 'funfair-10': ['coasterhill', 'balloonarch'], 'funfair-pipe': ['bigtop'],
  'toxic-1': ['goovat', 'coolingtower'], 'toxic-2': ['controlroom'], 'toxic-3': ['goovat', 'robotarm'], 'toxic-4': ['coolingtower', 'controlroom'],
  'toxic-5': ['robotarm', 'goovat'], 'toxic-6': ['crusher', 'coolingtower'], 'toxic-7': ['controlroom', 'crusher'], 'toxic-8': ['goovat', 'robotarm'],
  'toxic-9': ['crusher', 'controlroom'], 'toxic-10': ['coolingtower', 'goovat'], 'toxic-mega': ['coolingtower'],
  'mine-1': ['minehead', 'geode'], 'mine-2': ['cavefall'], 'mine-3': ['geode', 'cathedral'], 'mine-4': ['minehead', 'cavefall'],
  'mine-5': ['cathedral', 'geode'], 'mine-6': ['cavefall', 'minehead'], 'mine-7': ['geode', 'cathedral'], 'mine-8': ['minehead', 'cavefall'],
  'mine-9': ['cathedral', 'geode'], 'mine-10': ['cavefall', 'cathedral'], 'mine-mega': ['cathedral'],
  'dino-1': ['brachio', 'bignest'], 'dino-2': ['trex', 'ptero'], 'dino-3': ['stego', 'brachio'], 'dino-4': ['trike', 'ptero'],
  'dino-5': ['bignest', 'trex'], 'dino-6': ['brachio', 'stego'], 'dino-7': ['ptero', 'trike'], 'dino-8': ['trex', 'brachio'],
  'dino-9': ['stego', 'bignest'], 'dino-10': ['brachio', 'trex'], 'dino-mega': ['brachio'],
  'moon-1': ['domebase', 'station'], 'moon-2': ['biglander'], 'moon-3': ['rocket', 'bigdish'], 'moon-4': ['domebase', 'biglander'],
  'moon-5': ['bigdish', 'station'], 'moon-6': ['rocket', 'domebase'], 'moon-7': ['biglander', 'bigdish'], 'moon-8': ['station', 'rocket'],
  'moon-9': ['domebase', 'bigdish'], 'moon-10': ['biglander', 'rocket'], 'moon-pipe': ['domebase'],
  'sky-1': ['floatisle', 'bigwindmill'], 'sky-2': ['balloons', 'skycastle'], 'sky-3': ['bigwindmill', 'floatisle'], 'sky-4': ['rainbow'],
  'sky-5': ['bigwindmill', 'balloons'], 'sky-6': ['skycastle', 'floatisle'], 'sky-7': ['rainbow', 'blimp'], 'sky-8': ['floatisle', 'bigwindmill'],
  'sky-9': ['blimp', 'skycastle'], 'sky-10': ['floatisle', 'skycastle'], 'sky-mega': ['rainbow'],
  'dh-urban-1': ['startgate', 'belltower'], 'dh-urban-2': ['funicular'], 'dh-urban-3': ['mural', 'belltower'], 'dh-urban-4': ['funicular', 'mural'],
  'dh-urban-5': ['belltower', 'crane'], 'dh-urban-6': ['mural', 'startgate'], 'dh-urban-7': ['funicular', 'belltower'], 'dh-urban-8': ['startgate', 'mural'],
  'dh-urban-9': ['lighthouse', 'crane'], 'dh-urban-10': ['startgate', 'funicular'],
  'dh-mud-1': ['startgate', 'logcabin'], 'dh-mud-2': ['bigoak'], 'dh-mud-3': ['treehouse', 'stonebridge'], 'dh-mud-4': ['logcabin', 'bigoak'],
  'dh-mud-5': ['stonebridge', 'treehouse'], 'dh-mud-6': ['waterfall', 'logcabin'], 'dh-mud-7': ['bigoak', 'stonebridge'], 'dh-mud-8': ['startgate', 'treehouse'],
  'dh-mud-9': ['stonebridge', 'bigoak'], 'dh-mud-10': ['startgate', 'stonebridge'],
  'dh-rocky-1': ['startgate', 'mountainhut'], 'dh-rocky-2': ['eaglerock'], 'dh-rocky-3': ['cablecar', 'summitcross'], 'dh-rocky-4': ['mountainhut', 'eaglerock'],
  'dh-rocky-5': ['summitcross', 'cablecar'], 'dh-rocky-6': ['eaglerock', 'summitcross'], 'dh-rocky-7': ['cablecar', 'mountainhut'], 'dh-rocky-8': ['startgate', 'summitcross'],
  'dh-rocky-9': ['eaglerock', 'cablecar'], 'dh-rocky-10': ['startgate', 'summitcross'],
  'dh-shore-1': ['startgate', 'bigcedar'], 'dh-shore-2': ['firelookout'], 'dh-shore-3': ['trestle', 'logcabin'], 'dh-shore-4': ['bigcedar', 'waterfall'],
  'dh-shore-5': ['logcabin', 'firelookout'], 'dh-shore-6': ['trestle', 'bigcedar'], 'dh-shore-7': ['firelookout', 'trestle'], 'dh-shore-8': ['startgate', 'waterfall'],
  'dh-shore-9': ['bigcedar', 'trestle'], 'dh-shore-10': ['startgate', 'firelookout'],
  'kayak-centre-1': ['boatrack', 'pumphouse'], 'kayak-centre-2': ['slalomgates'], 'kayak-centre-3': ['boatlift', 'slalomgates'], 'kayak-centre-4': ['grandstand'],
  'kayak-centre-5': ['slalomgates', 'grandstand'], 'kayak-centre-6': ['pumphouse', 'boatrack'], 'kayak-centre-7': ['slalomgates', 'boatlift'], 'kayak-centre-8': ['grandstand', 'pumphouse'],
  'kayak-centre-9': ['boatrack', 'slalomgates'], 'kayak-centre-10': ['slalomgates', 'grandstand'], 'kayak-centre-wave': ['grandstand'],
  'kayak-creek-1': ['kayakcamp', 'heronrock'], 'kayak-creek-2': ['watermill'], 'kayak-creek-3': ['heronrock', 'logcabin'], 'kayak-creek-4': ['waterfall'],
  'kayak-creek-5': ['watermill', 'kayakcamp'], 'kayak-creek-6': ['bigoak', 'heronrock'], 'kayak-creek-7': ['logcabin', 'waterfall'], 'kayak-creek-8': ['kayakcamp', 'watermill'],
  'kayak-creek-9': ['heronrock', 'bigoak'], 'kayak-creek-10': ['waterfall', 'watermill'], 'kayak-creek-wave': ['kayakcamp'],
};
