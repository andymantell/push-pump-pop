// Contact sheet for props: `npm run dev`, then open /art/props.html?names=haybale,pumpkin
// Each prop gets a tile with a three-quarter view from the game camera's side, on a ground disc.
import * as THREE from 'three';
import { loadAssets } from '../src/assets';

const q = new URLSearchParams(location.search);
const names = (q.get('names') ?? '').split(',').filter(Boolean);
const cols = Math.min(5, names.length || 1), rows = Math.ceil(names.length / cols);
const T = 260;
const canvas = document.getElementById('c') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(cols * T, rows * T);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setScissorTest(true);
const effect = renderer;

const assets = await loadAssets();
names.forEach((n, i) => {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff0dc, 0x807050, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(-6, 12, 10);
  scene.add(sun);
  const o = assets.props[n];
  if (o) scene.add(o.clone());
  const box = new THREE.Box3().setFromObject(o ?? new THREE.Object3D());
  const size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
  const r = Math.max(size.x, size.y, size.z, 0.5);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r * 0.9, 32), new THREE.MeshLambertMaterial({ color: 0x9a8a60 }));
  disc.rotation.x = -Math.PI / 2;
  scene.add(disc);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 200);
  cam.position.set(mid.x + r * 1.2, mid.y + r * 0.6, mid.z + r * 2.4);
  cam.lookAt(mid);
  const x = (i % cols) * T, y = (rows - 1 - Math.floor(i / cols)) * T;
  renderer.setViewport(x, y, T, T);
  renderer.setScissor(x, y, T, T);
  renderer.setClearColor(i % 2 ? 0x9bd5f4 : 0x8fcff2);
  effect.render(scene, cam);
});
(window as any).ready = true;
