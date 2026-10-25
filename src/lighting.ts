import * as THREE from 'three';

// Cheap lighting tricks for the toon materials, so the iPad never has to run real point lights:
// - lamp pools: up to MAX_LAMPS lights near the camera, each a soft, banded pool of colour
//   that lights the track, the ground, the props and the rider as they roll through;
// - rim light: a thin band of sky colour around the edges of things, so they stand off the
//   background instead of looking cut out of card.

export const MAX_LAMPS = 8;

export type Lamp = { x: number; y: number; z: number; radius: number; color: THREE.Color };

const uniforms = {
  uLamps: { value: Array.from({ length: MAX_LAMPS }, () => new THREE.Vector4()) },
  uLampCols: { value: Array.from({ length: MAX_LAMPS }, () => new THREE.Color()) },
  uRim: { value: new THREE.Color() },
  uLampCount: { value: 0 },
};

const VERT_PARS = 'varying vec3 vLampWorld;\n';
const VERT = `
  vec4 lampWorld = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    lampWorld = instanceMatrix * lampWorld;
  #endif
  vLampWorld = (modelMatrix * lampWorld).xyz;
`;

const FRAG_PARS = `
varying vec3 vLampWorld;
uniform vec4 uLamps[${MAX_LAMPS}];
uniform vec3 uLampCols[${MAX_LAMPS}];
uniform vec3 uRim;
uniform int uLampCount;
`;

const FRAG = `
  vec3 lampSum = vec3(0.0);
  for (int i = 0; i < ${MAX_LAMPS}; i++) {
    if (i >= uLampCount) break;
    vec4 L = uLamps[i];
    vec3 d = vLampWorld - L.xyz;
    // Squashed so the pool spreads over the ground under the lamp, not up into the sky.
    float f = 1.0 - length(d * vec3(1.0, 0.8, 1.0)) / L.w;
    if (f <= 0.0) continue;
    vec3 toLamp = normalize((viewMatrix * vec4(-d, 0.0)).xyz);
    // Only surfaces that face the lamp: the track's front wall stays dark under a lamp behind it.
    float face = smoothstep(-0.05, 0.35, dot(normal, toLamp));
    // Three soft-edged rings, to match the cel shading.
    float band = 0.3 * smoothstep(0.0, 0.06, f) + 0.35 * smoothstep(0.3, 0.36, f) + 0.35 * smoothstep(0.6, 0.66, f);
    lampSum += uLampCols[i] * band * face;
  }
  outgoingLight += diffuseColor.rgb * lampSum;

  // Rim light on edges that face sideways (not the ground or the track top seen at a low angle).
  float rimEdge = 1.0 - max(dot(normal, normalize(vViewPosition)), 0.0);
  float rimUp = inverseTransformDirection(normal, viewMatrix).y;
  float rim = smoothstep(0.6, 0.66, rimEdge) * (1.0 - smoothstep(0.45, 0.75, rimUp)) * smoothstep(-0.5, 0.1, rimUp);
  outgoingLight += uRim * rim * (0.4 + diffuseColor.rgb);
`;

/** Add the lamp pools and rim light to a toon material. */
export function addLighting<M extends THREE.Material>(m: M): M {
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = VERT_PARS + shader.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n' + VERT);
    shader.fragmentShader = FRAG_PARS + shader.fragmentShader.replace('#include <opaque_fragment>', FRAG + '\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => 'lamps';
  return m;
}

/** Light the scene with the lamps on screen around x. Most tracks have none, and then the
 * shaders skip the lamp loop altogether. */
export function setLamps(lamps: Lamp[], x: number) {
  let n = 0;
  for (const l of lamps) {
    if (n === MAX_LAMPS) break;
    if (Math.abs(l.x - x) > 40 + l.radius) continue;
    uniforms.uLamps.value[n].set(l.x, l.y, l.z, l.radius);
    uniforms.uLampCols.value[n].copy(l.color);
    n++;
  }
  uniforms.uLampCount.value = n;
}

export function setRim(color: THREE.ColorRepresentation, strength: number) {
  uniforms.uRim.value.set(color).multiplyScalar(strength);
}
