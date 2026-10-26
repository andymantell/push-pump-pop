import * as THREE from 'three';
import { toon } from './toon';

/**
 * For the moon: a round glass space helmet with a white collar, and an air tank on the back.
 * Hung off the torso (the head sits 0.5 above it), so it moves with the rider.
 */
export function spaceKit(): THREE.Group {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0xc8ecff, transparent: true, opacity: 0.4, depthWrite: false }),
  );
  glass.position.y = 0.66;
  glass.userData.outlineParameters = { visible: false };
  (glass.material as THREE.Material).userData.outlineParameters = { visible: false };
  const shine = new THREE.Mesh(new THREE.CircleGeometry(0.05, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
  shine.position.set(-0.1, 0.78, 0.2);
  shine.material.userData.outlineParameters = { visible: false };
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 8, 20), toon(0xf0f0f4));
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.45;
  g.add(glass, shine, collar);
  g.visible = false;
  return g;
}
