// Character turnaround for judging the skater: `npm run dev`, then open /art/preview.html.
// ?pose=stand|crouch|air  picks the pose, ?close=1 frames the head and shoulders,
// ?t=<height>&d=<distance> frames anything else.
import * as THREE from 'three';
import { loadAssets } from '../src/assets';
import { Skater } from '../src/skater';
import { Rider } from '../src/rider';

const q = new URLSearchParams(location.search);
const pose = q.get('pose') ?? 'stand';
const close = q.get('close') === '1';

const W = 1200, H = close ? 420 : 640;
const canvas = document.getElementById('c') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setScissorTest(true);
const effect = renderer;

const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xdff3ff, 0x6b8f4e, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-6, 12, 10);
scene.add(sun);

const assets = await loadAssets();
const skater = new Skater(assets.parts);
scene.add(skater.root);

// Just enough of a rider to drive the pose.
const r = {
  x: 0, y: 0, angle: 0, grounded: pose !== 'air', airTime: pose === 'air' ? 0.4 : 0,
  pumpTimer: pose === 'crouch' ? 1 : 0, pushing: false, bailing: false,
  current: null, trickProgress: 0, boardYaw: 0,
} as unknown as Rider;
for (let i = 0; i < 120; i++) skater.update(1 / 60, r, () => 0, () => 0);

// Front faces the camera (+Z) as in game; the game camera looks from +Z.
const views: [string, number][] = [['front', 0], ['three-quarter', Math.PI / 4], ['side', Math.PI / 2], ['back', Math.PI]];
const target = new THREE.Vector3(0, Number(q.get('t') ?? (close ? 1.5 : 0.9)), 0);
const dist = Number(q.get('d') ?? (close ? 1.3 : 3.6));
const cam = new THREE.PerspectiveCamera(30, W / 4 / H, 0.05, 50);
const vw = W / 4;
views.forEach(([, a], i) => {
  cam.position.set(Math.sin(a) * dist, target.y + (close ? 0.05 : 0.2), Math.cos(a) * dist);
  cam.lookAt(target);
  renderer.setViewport(i * vw, 0, vw, H);
  renderer.setScissor(i * vw, 0, vw, H);
  renderer.setClearColor(i % 2 ? 0x9bd5f4 : 0x8fcff2);
  effect.render(scene, cam);
});
(window as any).ready = true;
