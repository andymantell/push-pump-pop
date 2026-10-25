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
};
