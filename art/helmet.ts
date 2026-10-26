// Close-ups of a head part from the side, three-quarter, front and back:
// `npm run dev`, then open /art/helmet.html?part=head_fullface
import * as THREE from 'three';
import { loadAssets } from '../src/assets';

const q = new URLSearchParams(location.search);
const name = q.get('part') ?? 'head_fullface';
const views: [string, number, number][] = [['side', Math.PI / 2, 0.05], ['three-quarter', Math.PI / 4, 0.15], ['front', 0, 0.05], ['back', Math.PI * 0.8, 0.2]];
const T = Number(q.get('size') ?? 360);
const canvas = document.getElementById('c') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(views.length * T, T);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setScissorTest(true);
const effect = renderer;

const assets = await loadAssets();
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xfff0dc, 0x807050, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 2.4);
sun.position.set(-6, 12, 10);
scene.add(sun);
const o = (assets.parts as Record<string, THREE.Object3D>)[name];
// Parts face +X in the game (the rider rides to the right); turn it to face the camera at 0.
if (o) { const c = o.clone(); c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); scene.add(c); }
const mid = new THREE.Vector3(0, Number(q.get('look') ?? 0.16), 0);
views.forEach(([, yaw, pitch], i) => {
  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 20);
  const d = Number(q.get('dist') ?? 1.05);
  cam.position.set(mid.x + Math.sin(yaw) * Math.cos(pitch) * d, mid.y + Math.sin(pitch) * d, mid.z + Math.cos(yaw) * Math.cos(pitch) * d);
  cam.lookAt(mid);
  renderer.setViewport(i * T, 0, T, T);
  renderer.setScissor(i * T, 0, T, T);
  renderer.setClearColor(i % 2 ? 0x9bd5f4 : 0x8fcff2);
  effect.render(scene, cam);
});
(window as any).ready = true;
