// The downhill bike riding through a rock garden and off a drop, for judging the suspension:
// `npm run dev`, then open /art/bike.html. window.frame(t) steps the ride to t seconds and draws it
// (for recording); ?view=side|three-quarter|close picks the camera, ?w=&h= the size.
import * as THREE from 'three';
import { loadAssets } from '../src/assets';
import { MtbRig } from '../src/mtb';
import { Rider } from '../src/rider';
import { TrackBuilder, DX } from '../src/track';

const q = new URLSearchParams(location.search);
const W = Number(q.get('w') ?? 900), H = Number(q.get('h') ?? 560);
const view = q.get('view') ?? 'three-quarter';
const canvas = document.getElementById('c') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x8fcff2);
const effect = renderer;
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xdff3ff, 0x6b8f4e, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-6, 12, 10);
scene.add(sun);

const b = new TrackBuilder(0);
b.flat(12).rocky((t) => t.ramp(14, -1.2), 0.24).flat(4).kicker(4, 0.9).flat(1).land(12).flat(60);
const track = b.build(6, 100);
// Ground: a strip following the profile, and the rocks.
const shape = new THREE.Shape();
shape.moveTo(0, -20);
for (let x = 0; x <= track.length; x += DX * 4) shape.lineTo(x, track.height(x));
shape.lineTo(track.length, -20);
const ground = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 2.4, bevelEnabled: false }), new THREE.MeshLambertMaterial({ color: 0x9a8a72 }));
ground.position.z = -1.2;
scene.add(ground);
const rockM = new THREE.MeshLambertMaterial({ color: 0x8a8580 });
for (const rk of track.gardenRocks) for (const z of [-0.6, -0.3, 0]) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), rockM);
  m.scale.set(rk.w / 2, rk.h, 0.3);
  m.position.set(rk.x + z * 0.3, track.height(rk.x), z);
  scene.add(m);
}

const assets = await loadAssets();
const rig = new MtbRig(assets.parts);
scene.add(rig.root);
const noop = () => {};
const r = new Rider(track, { trick: noop, land: noop, bail: noop, pump: noop, fall: noop } as never);
r.opts = { friction: 1, maxSpeed: 17, mtb: true };
r.v = 6;
const dt = 1 / 240;
let t = 0;
const cam = new THREE.PerspectiveCamera(32, W / H, 0.05, 200);
const angle = view === 'side' ? 0 : view === 'close' ? 0.25 : 0.55;
const dist = view === 'close' ? 3.5 : 4;
function frame(to: number) {
  while (t < to) { r.update(dt); rig.update(dt, r, (x) => track.height(x), (x) => track.slope(x)); t += dt; }
  const target = new THREE.Vector3(r.x, r.y + (view === 'close' ? 0.95 : 0.85), 0);
  cam.position.set(r.x + Math.sin(angle) * dist, target.y + 0.35, Math.cos(angle) * dist);
  cam.lookAt(target);
  effect.render(scene, cam);
}
frame(1 / 60);
(window as any).frame = frame;
(window as any).ready = true;
