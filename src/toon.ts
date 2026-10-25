import * as THREE from 'three';
import { addLighting } from './lighting';

let gradient: THREE.DataTexture | null = null;

/** Three-step ramp for the cel-shaded look. */
export function toonGradient(): THREE.DataTexture {
  if (gradient) return gradient;
  const data = new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 255, 255, 255, 255]);
  gradient = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}

const cache = new Map<string, THREE.MeshToonMaterial>();

export function toon(color: THREE.ColorRepresentation, opts: THREE.MeshToonMaterialParameters = {}): THREE.MeshToonMaterial {
  const key = new THREE.Color(color).getHexString() + JSON.stringify(Object.keys(opts));
  if (!Object.keys(opts).length && cache.has(key)) return cache.get(key)!;
  const m = addLighting(new THREE.MeshToonMaterial({ color, gradientMap: toonGradient(), ...opts }));
  if (!Object.keys(opts).length) cache.set(key, m);
  return m;
}

/** Swap any standard materials (e.g. from glTF) for toon ones of the same colour. */
export function toonify(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const conv = (m: THREE.Material) => {
      const s = m as THREE.MeshStandardMaterial;
      const t = addLighting(new THREE.MeshToonMaterial({
        color: s.color ?? 0xffffff,
        map: s.map ?? null,
        gradientMap: toonGradient(),
        vertexColors: s.vertexColors,
      }));
      t.name = s.name;
      return t;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(conv) : conv(mesh.material);
  });
}
