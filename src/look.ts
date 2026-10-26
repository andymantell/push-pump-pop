import * as THREE from 'three';
import { addLighting } from './lighting';
import { twoToneGradient } from './toon';
import { drawPattern, PatternName, drawDeck, DeckArt, PATTERNS, DECK_ARTS } from './patterns';

// The rider's look, chosen in the customiser and saved on this device.
//
// Clothes, hair and hats are pieces of public/models/wardrobe.glb (art/build_wardrobe.py),
// named `<slot>__<style>`, each hanging from one of the skater's joints. Dressing a joint swaps
// its model for the chosen pieces. Colours go on by material name: every rider part shares one
// material per name (see paint), so changing the look recolours everything that's dressed.

export const HAIR_STYLES = ['buzz', 'crop', 'spiky', 'curly', 'puffs', 'bob', 'ponytail', 'bun', 'pigtails', 'long', 'braids', 'mohawk', 'messy', 'flow', 'swoop', 'afro', 'spacebuns'] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];
export const HATS = ['none', 'cap', 'capback', 'beanie', 'bucket', 'headband', 'bandana', 'catears', 'unicorn'] as const;
export type Hat = (typeof HATS)[number];
export const MOUTHS = ['smile', 'grin', 'cheeky', 'tongue'] as const;
export type Mouth = (typeof MOUTHS)[number];
export const GLASSES = ['none', 'round', 'sun', 'star', 'heart'] as const;
export type Glasses = (typeof GLASSES)[number];
export const TOPS = ['hoodie', 'tee', 'vest', 'jersey', 'rash', 'jacket'] as const;
export type Top = (typeof TOPS)[number];
export const BOTTOMS = ['jeans', 'shorts', 'joggers', 'leggings', 'skirt'] as const;
export type Bottom = (typeof BOTTOMS)[number];
export const SHOES = ['low', 'high'] as const;
export type Shoes = (typeof SHOES)[number];
/** What's on the rider's head: their own hat, or the helmet a ride puts on them. */
export type Headgear = 'own' | 'skate' | 'farm' | 'snow' | 'fullface' | 'water';

export interface Look {
  skin: number;
  eyes: number;
  hair: HairStyle;
  hairColour: number;
  /** Dyed tips on long hair, braids and the mohawk: -1 for none. */
  tips: number;
  mouth: Mouth;
  freckles: boolean;
  cheeks: boolean;
  lashes: boolean;
  glasses: Glasses;
  glassesColour: number;
  hat: Hat;
  hatColour: number;
  /** Every helmet a ride puts on you is this colour. */
  helmetColour: number;
  top: Top;
  topColour: number;
  trimColour: number;
  pattern: PatternName;
  patternColour: number;
  bottom: Bottom;
  bottomColour: number;
  /** Leggings under a skirt. */
  legsColour: number;
  sockColour: number;
  shoes: Shoes;
  shoeColour: number;
  soleColour: number;
  laceColour: number;
  deck: DeckArt;
  deckColour: number;
  deckArtColour: number;
  gripColour: number;
  wheelColour: number;
  truckColour: number;
  scooterColour: number;
  barsColour: number;
  scooterWheelColour: number;
  snowboardColour: number;
  mountainboardColour: number;
  /** The downhill bike's frame. */
  bikeColour: number;
  /** The river kayak, and the playboat on standing waves. */
  kayakColour: number;
  playboatColour: number;
}

/** The kid as he was before the customiser: blue hoodie, jeans, red cap. */
export const DEFAULT_LOOK: Look = {
  skin: 0xf0c09a, eyes: 0x1e1e22, hair: 'crop', hairColour: 0x5c3a24, tips: -1,
  mouth: 'smile', freckles: false, cheeks: false, lashes: false, glasses: 'none', glassesColour: 0x2a2a30,
  hat: 'cap', hatColour: 0xe8402a, helmetColour: 0xe23034,
  top: 'hoodie', topColour: 0x2f8fd8, trimColour: 0x1e68a6, pattern: 'none', patternColour: 0xf4f4f0,
  bottom: 'jeans', bottomColour: 0x343e52, legsColour: 0x2a2a30, sockColour: 0xf4f4f0,
  shoes: 'low', shoeColour: 0xf5f5f0, soleColour: 0xece6d6, laceColour: 0xe8402a,
  deck: 'none', deckColour: 0xe8402a, deckArtColour: 0xffd23f, gripColour: 0x222226, wheelColour: 0xf5e6a8, truckColour: 0xb8bec6,
  scooterColour: 0x7a4fd8, barsColour: 0xc4cad4, scooterWheelColour: 0xffd23f,
  snowboardColour: 0x2a7fd4, mountainboardColour: 0x3c9646, bikeColour: 0x18b6b0,
  kayakColour: 0xf2552a, playboatColour: 0x2ab0e0,
};

// ---------------------------------------------------------------- palettes

export const SKIN_TONES = [0xfbe2cc, 0xf6d0b1, 0xf0c09a, 0xe5ac80, 0xd69a66, 0xc0824e, 0xa46a3c, 0x87532e, 0x6a3f22, 0x4e2d18];
export const HAIR_COLOURS = [
  0x1c1410, 0x3a2418, 0x5c3a24, 0x8a5a34, 0xc28a46, 0xe8c66c, 0xf4e6b4, 0xa4432a, 0xd8682c, 0xb8b8bc,
  0xff6fb5, 0xc04cf0, 0x3a86ff, 0x2ec4b6, 0x46c046, 0xff4040,
];
export const EYE_COLOURS = [0x1e1e22, 0x4a2c1a, 0x7a5230, 0x3a78c8, 0x3c9a5a, 0x7a6a3a];
/** For clothes, hats, boards and scooters. */
export const COLOURS = [
  0xe8402a, 0xff8a1e, 0xffd23f, 0x9ad438, 0x2a9d5c, 0x2ec4b6, 0x5cc8f0, 0x2f8fd8, 0x26355a, 0x8e5cd9,
  0xc8a2f0, 0xffa8d0, 0xff5fa8, 0xd81e6e, 0xf4f4f0, 0x9aa0a8, 0x2a2a30, 0x7a4e2d, 0x4a6fa5, 0xc8b88a,
];

// ---------------------------------------------------------------- storage

const KEY = 'push-pump-pop-look';

function valid(v: unknown, d: unknown): boolean {
  if (typeof d === 'number') return typeof v === 'number' && Number.isFinite(v);
  if (typeof d === 'boolean') return typeof v === 'boolean';
  return typeof v === 'string';
}

/** A saved look, with anything missing or broken filled in from the default. */
export function parseLook(raw: unknown): Look {
  const out = { ...DEFAULT_LOOK };
  if (raw && typeof raw === 'object') {
    const lists: Partial<Record<keyof Look, readonly string[]>> = {
      hair: HAIR_STYLES, hat: HATS, mouth: MOUTHS, glasses: GLASSES, top: TOPS, bottom: BOTTOMS, shoes: SHOES, pattern: PATTERNS, deck: DECK_ARTS,
    };
    for (const k of Object.keys(out) as (keyof Look)[]) {
      const v = (raw as Record<string, unknown>)[k];
      if (!valid(v, out[k])) continue;
      if (lists[k] && !lists[k]!.includes(v as string)) continue;
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}

export function loadLook(): Look {
  try {
    const s = localStorage.getItem(KEY);
    return parseLook(s ? JSON.parse(s) : null);
  } catch {
    return { ...DEFAULT_LOOK };
  }
}

export function saveLook(look: Look) {
  try { localStorage.setItem(KEY, JSON.stringify(look)); } catch { /* not saved */ }
}

// ---------------------------------------------------------------- pieces

/** Hats that cover the top of the head, so the hair under them is cut short. */
const COVERS: Record<Hat, boolean> = {
  none: false, cap: true, capback: true, beanie: true, bucket: true, headband: false, bandana: true, catears: false, unicorn: false,
};
/** Hair that stands out from the head: bands worn over it sit this much further out. */
const BAND_FIT: Partial<Record<HairStyle, number>> = { curly: 1.14, bob: 1.03, long: 1.03, messy: 1.05, flow: 1.03, afro: 1.32 };
/** Middle of the skull above the neck (scaled like the head), which bands grow out from. */
const SKULL_Y = 0.16 * 1.08;
const SLEEVES: Record<Top, string> = { hoodie: 'hoodie', tee: 'tee', vest: 'bare', jersey: 'jersey', rash: 'rash', jacket: 'jacket' };

/** The wardrobe pieces for the head, under the given headgear. */
export function headPieces(look: Look, gear: Headgear): string[] {
  const out = ['head__base', `mouth__${look.mouth}`];
  if (look.freckles) out.push('face__freckles');
  if (look.cheeks) out.push('face__cheeks');
  if (look.lashes) out.push('face__lashes');
  // (Goggles go over a full-face helmet instead.)
  if (look.glasses !== 'none' && gear !== 'fullface') out.push(`glasses__${look.glasses}`);
  const covered = gear !== 'own' || COVERS[look.hat];
  out.push(`hair__${look.hair}${covered ? '__under' : ''}`);
  if (gear !== 'own') out.push(`helmet__${gear}`);
  else if (look.hat !== 'none') out.push(`hat__${look.hat === 'capback' ? 'cap' : look.hat}`);
  return out;
}

/** The wardrobe pieces for each body joint. */
export function bodyPieces(look: Look): Record<string, string[]> {
  const sl = SLEEVES[look.top];
  const b = look.bottom;
  const out: Record<string, string[]> = {
    torso: [`torso__${look.top}`],
    pelvis: [`pelvis__${b}`],
  };
  for (const s of ['L', 'R']) {
    out[`upperArm_${s}`] = [`upperArm_${s}__${sl}`];
    out[`forearm_${s}`] = [`forearm_${s}__${sl}`];
    out[`thigh_${s}`] = [`thigh_${s}__${b}`];
    out[`shin_${s}`] = [`shin_${s}__${b}`];
    out[`shoe_${s}`] = [`shoe_${s}__${look.shoes}`];
  }
  return out;
}

export class Wardrobe {
  private pieces = new Map<string, THREE.Object3D>();

  constructor(scene: THREE.Object3D | null) {
    if (!scene) return;
    for (const c of scene.children) this.pieces.set(c.name, c);
  }

  get loaded() { return this.pieces.size > 0; }

  /** A fresh copy of a piece, with its origin on the joint. */
  piece(name: string): THREE.Object3D | null {
    const o = this.pieces.get(name);
    if (!o) return null;
    const c = o.clone();
    c.position.set(0, 0, 0);
    c.rotation.set(0, 0, 0);
    c.scale.set(1, 1, 1);
    return c;
  }
}

/** Remember which children of each part are its model (not joints hung off it), so dress can swap them. */
export function markModels(parts: Iterable<THREE.Object3D>) {
  for (const p of parts) for (const c of p.children) c.userData.model = true;
}

/** Swap a joint's model for these wardrobe pieces. Does nothing if any piece is missing. */
export function dress(joint: THREE.Object3D, names: string[], wardrobe: Wardrobe, look?: Look) {
  const got = names.map((n) => wardrobe.piece(n));
  if (got.some((g) => !g)) return;
  for (const c of [...joint.children]) if (c.userData.model) joint.remove(c);
  const g = new THREE.Group();
  g.userData.model = true;
  got.forEach((p, i) => {
    // A cap worn backwards.
    if (names[i] === 'hat__cap' && look?.hat === 'capback') p!.rotation.y = Math.PI;
    const fit = look && /^hat__(headband|catears|unicorn)$/.test(names[i]) ? BAND_FIT[look.hair] ?? 1 : 1;
    p!.scale.setScalar(fit);
    p!.position.y = SKULL_Y * (1 - fit);
    g.add(p!);
  });
  joint.add(g);
  paint(g);
}

// ---------------------------------------------------------------- colours

const shared = new Map<string, THREE.Material>();
let current: Look = DEFAULT_LOOK;

/** Use the shared material for every recolourable material under root. */
export function paint(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const swap = (m: THREE.Material) => {
      if (!(m.name in SLOTS)) return m;
      let s = shared.get(m.name);
      if (!s) {
        // A clone loses the lamp and rim light shader patch, so it goes back on.
        s = addLighting(m.clone());
        s.name = m.name;
        s.userData = { ...m.userData };
        shared.set(m.name, s);
        colour(m.name, s as THREE.MeshToonMaterial, current);
      }
      return s;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) riderStyle(m);
  });
}

/**
 * Riders are shaded like Wind Waker: no outline, and just a lit side and a shadow side.
 * Only named materials (from the models): unnamed ones may be shared with the scenery.
 */
function riderStyle(m: THREE.Material) {
  if (!m.name) return;
  m.userData.outlineParameters = { visible: false };
  const t = m as THREE.MeshToonMaterial;
  if (t.isMeshToonMaterial && t.gradientMap !== twoToneGradient()) {
    t.gradientMap = twoToneGradient();
    t.needsUpdate = true;
  }
}

const darker = (c: number, k = 0.72) => new THREE.Color(c).multiplyScalar(k).getHex();
const lighter = (c: number, k = 0.45) => new THREE.Color(c).lerp(new THREE.Color(0xffffff), k).getHex();

/** The colour of each material slot for a look. */
const SLOTS: Record<string, (l: Look) => number> = {
  skin: (l) => l.skin,
  freckle: (l) => darker(l.skin, 0.75),
  blush: (l) => new THREE.Color(l.skin).lerp(new THREE.Color(0xff6a7a), 0.45).getHex(),
  eye: (l) => l.eyes,
  brow: (l) => darker(l.hairColour, 0.85),
  hair: (l) => l.hairColour,
  hair_tips: (l) => (l.tips < 0 ? l.hairColour : l.tips),
  hair_tie: (l) => l.trimColour,
  glasses: (l) => l.glassesColour,
  hat: (l) => l.hatColour,
  hat_dark: (l) => darker(l.hatColour),
  hat_trim: (l) => lighter(l.hatColour, 0.7),
  // The helmets each ride puts on you (from skater.glb's material names).
  skate_helmet: (l) => l.helmetColour,
  helmet: (l) => l.helmetColour,
  beanie: (l) => l.helmetColour,
  beanie_cuff: (l) => darker(l.helmetColour),
  fullface: (l) => l.helmetColour,
  fullface_stripe: (l) => darker(l.helmetColour, 0.6),
  water_helmet: (l) => l.helmetColour,
  top: (l) => l.topColour,
  top_dark: (l) => l.trimColour,
  top_inner: (l) => (l.top === 'jacket' ? l.trimColour : 0xf4f4f0),
  bottom: (l) => l.bottomColour,
  bottom_dark: (l) => darker(l.bottomColour),
  legs: (l) => l.legsColour,
  sock: (l) => l.sockColour,
  shoe: (l) => l.shoeColour,
  sole: (l) => l.soleColour,
  shoe_accent: (l) => l.laceColour,
  lace: (l) => l.laceColour,
  deck_grip: (l) => l.gripColour,
  deck_graphic: (l) => l.deckColour,
  wheel: (l) => l.wheelColour,
  truck: (l) => l.truckColour,
  scooter_frame: (l) => l.scooterColour,
  scooter_frame_dark: (l) => darker(l.scooterColour),
  scooter_bar: (l) => l.barsColour,
  scooter_tyre: (l) => l.scooterWheelColour,
  snowscoot_ski: (l) => l.scooterColour,
  snowboard_top: (l) => l.snowboardColour,
  mtb_deck: (l) => l.mountainboardColour,
  mtb_frame: (l) => l.bikeColour,
  mtb_frame_dark: (l) => darker(l.bikeColour),
  kayak_hull: (l) => l.kayakColour,
  playboat_hull: (l) => l.playboatColour,
};

const textures = new Map<string, THREE.CanvasTexture>();

function colour(name: string, m: THREE.MeshToonMaterial, look: Look) {
  const c = SLOTS[name](look);
  // Printed materials get a texture holding the colours, and stay white themselves.
  let tex: THREE.CanvasTexture | null = null;
  if (name === 'top' && look.pattern !== 'none') tex = texture('top', (cv) => drawPattern(cv, look.pattern, look.topColour, look.patternColour));
  if (name === 'deck_graphic' && look.deck !== 'none') tex = texture('deck', (cv) => drawDeck(cv, look.deck, look.deckColour, look.deckArtColour), [512, 128]);
  if (tex) {
    m.color.set(0xffffff);
    m.map = tex;
  } else {
    m.color.set(c);
    m.map = null;
  }
  m.needsUpdate = true;
}

function texture(key: string, draw: (c: HTMLCanvasElement) => void, size = [128, 128]): THREE.CanvasTexture {
  let t = textures.get(key);
  if (!t) {
    const cv = document.createElement('canvas');
    cv.width = size[0];
    cv.height = size[1];
    t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    // glTF's UVs run from the top of the image, so the canvas's top is up the body.
    t.flipY = false;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    textures.set(key, t);
  }
  draw(t.image as HTMLCanvasElement);
  t.needsUpdate = true;
  return t;
}

/** Recolour everything painted so far for this look. */
export function setColours(look: Look) {
  current = look;
  for (const [name, m] of shared) colour(name, m as THREE.MeshToonMaterial, look);
}

const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

/** A surprise look for the dice: new clothes, hair and colours, but the same skin and eyes. */
export function randomLook(old: Look): Look {
  const bright = () => pick(COLOURS);
  const hat = Math.random() < 0.35 ? 'none' : pick(HATS);
  return {
    ...old,
    hair: pick(HAIR_STYLES), hairColour: Math.random() < 0.7 ? pick(HAIR_COLOURS.slice(0, 10)) : pick(HAIR_COLOURS),
    tips: Math.random() < 0.25 ? pick(HAIR_COLOURS.slice(10)) : -1,
    mouth: pick(MOUTHS), glasses: Math.random() < 0.6 ? 'none' : pick(GLASSES), glassesColour: bright(),
    hat, hatColour: bright(), helmetColour: bright(),
    top: pick(TOPS), topColour: bright(), trimColour: bright(),
    pattern: Math.random() < 0.5 ? 'none' : pick(PATTERNS), patternColour: bright(),
    bottom: pick(BOTTOMS), bottomColour: bright(), legsColour: bright(), sockColour: bright(),
    shoes: pick(SHOES), shoeColour: bright(), laceColour: bright(), soleColour: Math.random() < 0.6 ? 0xf4f4f0 : bright(),
    deck: pick(DECK_ARTS), deckColour: bright(), deckArtColour: bright(), wheelColour: bright(),
    scooterColour: bright(), barsColour: bright(), scooterWheelColour: bright(), snowboardColour: bright(), mountainboardColour: bright(), bikeColour: bright(), kayakColour: bright(), playboatColour: bright(),
  };
}
