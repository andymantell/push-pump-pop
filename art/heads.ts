// Grid of wardrobe head pieces for judging hair, hats and faces: `npm run dev`, then open
// /art/heads.html. ?items=hair:bob,hat:cap+hair:bob__under,... one cell per comma, pieces joined by +
// (slot:style, with the head and a smile added). ?yaw=0.6 turns them, ?cols=6.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { toonify } from '../src/toon';

const q = new URLSearchParams(location.search);
const items = (q.get('items') ?? 'hair:buzz,hair:crop,hair:spiky,hair:curly,hair:puffs,hair:bob,hair:ponytail,hair:bun,hair:pigtails,hair:long,hair:braids,hair:mohawk').split(',');
const cols = Number(q.get('cols') ?? 6);
const yaw = Number(q.get('yaw') ?? 0.7);
const C = 220;
const rows = Math.ceil(items.length / cols);
const W = C * cols, H = C * rows;
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

const gltf = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/${q.get('glb') ?? 'wardrobe'}.glb`);
toonify(gltf.scene);
const piece = (n: string) => {
  const o = gltf.scene.getObjectByName(n);
  if (!o) { console.error('missing', n); return new THREE.Group(); }
  const c = o.clone();
  c.position.set(0, 0, 0);
  return c;
};
const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
items.forEach((item, i) => {
  const g = new THREE.Group();
  if (!q.get('glb')) g.add(piece('head__base'));
  const names = item.split('+').map((s) => s.replace(':', '__'));
  if (!q.get('glb') && !names.some((n) => n.startsWith('mouth__'))) names.push('mouth__smile');
  for (const n of names) g.add(piece(n));
  g.rotation.y = yaw;
  scene.add(g);
  cam.position.set(0, 0.22, 1.05);
  cam.lookAt(0, 0.12, 0);
  const x = (i % cols) * C, y = H - (Math.floor(i / cols) + 1) * C;
  renderer.setViewport(x, y, C, C);
  renderer.setScissor(x, y, C, C);
  renderer.setClearColor(i % 2 ? 0x9bd5f4 : 0x8fcff2);
  effect.render(scene, cam);
  scene.remove(g);
});
(window as any).ready = true;
