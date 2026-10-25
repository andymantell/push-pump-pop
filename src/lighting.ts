import * as THREE from 'three';

// Lighting on top of the toon shading:
// - lamps are real point lights, but only a few of them, moved each frame to the lamps nearest
//   the camera, so the iPad never lights more than MAX_LAMPS at once. Their light falls off
//   smoothly instead of in toon bands, so pools of light look like light, not paint;
// - rim light: a thin band of sky colour around the edges of things, so they stand off the
//   background instead of looking cut out of card.

export const MAX_LAMPS = 4;

export type Lamp = { x: number; y: number; z: number; radius: number; color: THREE.Color; intensity: number };

const uniforms = {
  uRim: { value: new THREE.Color() },
};

const FRAG_PARS = `
uniform vec3 uRim;
void RE_Direct_Lamp(const in IncidentLight directLight, const in vec3 geometryNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight) {
  float wrap = max((dot(geometryNormal, directLight.direction) + 0.2) / 1.2, 0.0);
  reflectedLight.directDiffuse += wrap * directLight.color * BRDF_Lambert(material.diffuseColor);
}
`;

// Point lights skip the toon gradient and light smoothly.
const [before, after] = THREE.ShaderChunk.lights_fragment_begin.split('NUM_POINT_LIGHTS > 0');
const LIGHTS_BEGIN = before + 'NUM_POINT_LIGHTS > 0' + after.replace(
  'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
  'RE_Direct_Lamp( directLight, geometryNormal, material, reflectedLight );',
);

const FRAG = `
  // Rim light on edges that face sideways (not the ground or the track top seen at a low angle).
  float rimEdge = 1.0 - max(dot(normal, normalize(vViewPosition)), 0.0);
  float rimUp = inverseTransformDirection(normal, viewMatrix).y;
  float rim = smoothstep(0.6, 0.66, rimEdge) * (1.0 - smoothstep(0.45, 0.75, rimUp)) * smoothstep(-0.5, 0.1, rimUp);
  outgoingLight += uRim * rim * (0.4 + diffuseColor.rgb);
`;

/** Add the smooth lamp light and rim light to a toon material. */
export function addLighting<M extends THREE.Material>(m: M): M {
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <lights_toon_pars_fragment>', '#include <lights_toon_pars_fragment>\n' + FRAG_PARS)
      .replace('#include <lights_fragment_begin>', LIGHTS_BEGIN)
      .replace('#include <opaque_fragment>', FRAG + '\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => 'lamps';
  return m;
}

export function setRim(color: THREE.ColorRepresentation, strength: number) {
  uniforms.uRim.value.set(color).multiplyScalar(strength);
}

/** The few real lights that stand in for whichever lamps are on screen. */
export class LampLights {
  private lights: THREE.PointLight[] = [];
  private lamps: Lamp[] = [];

  constructor(private scene: THREE.Scene) {}

  /** A track's lamps. The number of lights only changes between tracks with and without lamps,
   * as each change makes every shader rebuild. */
  use(lamps: Lamp[]) {
    this.lamps = lamps;
    const n = lamps.length ? MAX_LAMPS : 0;
    while (this.lights.length > n) this.scene.remove(this.lights.pop()!);
    while (this.lights.length < n) {
      const l = new THREE.PointLight(0xffffff, 0, 10, 2);
      this.lights.push(l);
      this.scene.add(l);
    }
  }

  /** Move the lights to the lamps nearest x. */
  update(x: number) {
    if (!this.lights.length) return;
    const near = this.lamps.length <= MAX_LAMPS ? this.lamps : [...this.lamps].sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x));
    this.lights.forEach((l, i) => {
      const lamp = near[i];
      if (!lamp) { l.intensity = 0; return; }
      l.position.set(lamp.x, lamp.y, lamp.z);
      l.color.copy(lamp.color);
      l.distance = lamp.radius;
      l.intensity = lamp.intensity;
    });
  }
}
