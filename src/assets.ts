import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PART_NAMES, PartName, SNOW_PART_NAMES, SnowPartName, MTB_PART_NAMES, MtbPartName, SCOOTER_HEAD_NAMES } from './skater';
import { SCOOTER_PART_NAMES, ScooterPartName } from './scooter';
import { BIKE_PART_NAMES, BikePartName } from './mtb';
import { PropKind } from './track';
import { toonify } from './toon';

// Models are built in Blender by art/build_assets.py and exported to public/models.

export interface Assets {
  parts: Partial<Record<PartName | SnowPartName | MtbPartName | ScooterPartName | BikePartName | (typeof SCOOTER_HEAD_NAMES)[number], THREE.Object3D>>;
  props: Partial<Record<PropKind, THREE.Object3D>>;
}

/** Props keep their node transform: a prop's origin is wherever its first part was made, not
 * always its base, so zeroing it would sink (or tip over) the model. */
function pick(scene: THREE.Object3D, name: string, keepTransform = false): THREE.Object3D | undefined {
  const o = scene.getObjectByName(name);
  if (!o) return undefined;
  const c = o.clone();
  if (!keepTransform) {
    c.position.set(0, 0, 0);
    c.rotation.set(0, 0, 0);
    c.scale.set(1, 1, 1);
  }
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
    const [skater, props, scooter, mtb] = await Promise.all([
      loader.loadAsync(`${base}models/skater.glb`),
      loader.loadAsync(`${base}models/props.glb`),
      loader.loadAsync(`${base}models/scooter.glb`),
      loader.loadAsync(`${base}models/mtb.glb`),
    ]);
    toonify(skater.scene);
    toonify(props.scene);
    toonify(scooter.scene);
    toonify(mtb.scene);
    for (const n of BIKE_PART_NAMES) {
      const o = pick(mtb.scene, n);
      if (o) assets.parts[n] = o;
    }
    for (const n of SCOOTER_PART_NAMES) {
      const o = pick(scooter.scene, n);
      if (o) assets.parts[n] = o;
    }
    for (const n of [...PART_NAMES, ...SNOW_PART_NAMES, ...MTB_PART_NAMES, ...SCOOTER_HEAD_NAMES]) {
      const o = pick(skater.scene, n);
      if (o) assets.parts[n] = o;
    }
    for (const child of props.scene.children) {
      const o = pick(props.scene, child.name, true);
      if (o) assets.props[child.name] = o;
    }
  } catch (e) {
    // Fall back to the built-in shapes rather than failing to start.
    console.warn('Could not load models', e);
  }
  return assets;
}
