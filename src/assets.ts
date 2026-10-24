import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PART_NAMES, PartName } from './skater';
import { PropKind } from './track';
import { toonify } from './toon';

// Models are built in Blender by art/build_assets.py and exported to public/models.

const PROP_NAMES: PropKind[] = ['tree', 'pine', 'bush', 'rock', 'fence', 'lamp', 'cone', 'bench'];

export interface Assets {
  parts: Partial<Record<PartName, THREE.Object3D>>;
  props: Partial<Record<PropKind, THREE.Object3D>>;
}

function pick(scene: THREE.Object3D, name: string): THREE.Object3D | undefined {
  const o = scene.getObjectByName(name);
  if (!o) return undefined;
  const c = o.clone();
  c.position.set(0, 0, 0);
  c.rotation.set(0, 0, 0);
  c.scale.set(1, 1, 1);
  const g = new THREE.Group();
  g.name = name;
  g.add(c);
  return g;
}

export async function loadAssets(): Promise<Assets> {
  const loader = new GLTFLoader();
  const base = import.meta.env.BASE_URL;
  const assets: Assets = { parts: {}, props: {} };
  try {
    const [skater, props] = await Promise.all([
      loader.loadAsync(`${base}models/skater.glb`),
      loader.loadAsync(`${base}models/props.glb`),
    ]);
    toonify(skater.scene);
    toonify(props.scene);
    for (const n of PART_NAMES) {
      const o = pick(skater.scene, n);
      if (o) assets.parts[n] = o;
    }
    for (const n of PROP_NAMES) {
      const o = pick(props.scene, n);
      if (o) assets.props[n] = o;
    }
  } catch (e) {
    // Fall back to the built-in shapes rather than failing to start.
    console.warn('Could not load models', e);
  }
  return assets;
}
