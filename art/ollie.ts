// Filmstrip of a trick from the real physics, for judging animation: `npm run dev`, then
// open /art/ollie.html. ?swipe=up|left|right|down picks the flip-side swipe, ?grab=up etc.
// a held grab, ?spin=right a body spin, ?snow=1 the snowboard; ?at=0,0.03,... the frame times
// in seconds after the pop, ?rail=1 a hop onto a rail, and ?views=side,three-quarter,back the camera angles.
import * as THREE from 'three';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { loadAssets } from '../src/assets';
import { Skater } from '../src/skater';
import { Rider, Swipe } from '../src/rider';
import { TrackBuilder } from '../src/track';

const q = new URLSearchParams(location.search);
const times = (q.get('at') ?? '0,0.02,0.04,0.07,0.1,0.15,0.22,0.35,0.5,0.65,0.8,0.86,0.95').split(',').map(Number);
const angles: Record<string, [number, number]> = { side: [0, 0.2], 'three-quarter': [Math.PI / 4, 0.4], back: [Math.PI * 0.85, 0.5], low: [0.25, -0.3] };
const views = (q.get('views') ?? 'side,three-quarter,back').split(',');
const snow = q.get('snow') === '1';

const CW = 200, CH = 260;
const W = CW * times.length, H = CH * views.length;
const canvas = document.getElementById('c') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setScissorTest(true);
const effect = new OutlineEffect(renderer, { defaultThickness: 0.006, defaultColor: [0.1, 0.08, 0.08] });

const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xdff3ff, 0x6b8f4e, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-6, 12, 10);
scene.add(sun);
const ground = new THREE.Mesh(new THREE.BoxGeometry(400, 0.1, 3), new THREE.MeshLambertMaterial({ color: snow ? 0xf2f6fa : 0x9a9a9a }));
ground.position.set(100, -0.05, 0);
scene.add(ground);

const assets = await loadAssets();
const skater = new Skater(assets.parts);
skater.setSnow(snow);
scene.add(skater.root);

const rail = q.get('rail') === '1';
const b = new TrackBuilder(0);
if (rail) b.flat(20).rail(8);
b.flat(200);
const track = b.build(5, 190);
const noop = () => {};
const r = new Rider(track, { trick: noop, land: noop, bail: noop, pump: noop, fall: noop } as never);
r.opts = { friction: 1, maxSpeed: 17, snow };
r.v = 8;
const dt = 1 / 120;
const step = () => { r.update(dt); skater.update(dt, r, (x) => track.height(x), (x) => track.slope(x)); };
for (let i = 0; i < 120; i++) step();
while (rail && r.x < track.rails[0].x0 - r.v * 0.45) step();
const swipe = q.get('swipe'), grab = q.get('grab'), spin = q.get('spin');
if (grab) r.grabSwipe(grab as Swipe);
else if (spin) r.spinSwipe(spin as 'left' | 'right');
else { r.swipe((swipe ?? 'up') as Swipe); r.release(); }
let t = 0;
const cam = new THREE.PerspectiveCamera(30, CW / CH, 0.05, 50);
times.forEach((at, col) => {
  while (t < at - 1e-6) { step(); t += dt; }
  views.forEach((v, row) => {
    const [a, h] = angles[v];
    const target = new THREE.Vector3(r.x, r.y + 0.75, 0);
    cam.position.set(r.x + Math.sin(a) * 3.4, target.y + h, Math.cos(a) * 3.4);
    cam.lookAt(target);
    const y = H - (row + 1) * CH;
    renderer.setViewport(col * CW, y, CW, CH);
    renderer.setScissor(col * CW, y, CW, CH);
    renderer.setClearColor(row % 2 ? 0x9bd5f4 : 0x8fcff2);
    effect.render(scene, cam);
  });
});
(window as any).ready = true;
