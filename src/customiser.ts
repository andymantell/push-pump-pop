import * as THREE from 'three';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { Assets } from './assets';
import { Skater } from './skater';
import { ScooterRig } from './scooter';
import { Rider, Swipe } from './rider';
import { TrackBuilder } from './track';
import {
  Look, Wardrobe, setColours, saveLook, randomLook, dress,
  HAIR_STYLES, HATS, MOUTHS, GLASSES, TOPS, BOTTOMS, SHOES, SKIN_TONES, HAIR_COLOURS, EYE_COLOURS, COLOURS,
} from './look';
import { PATTERNS, DECK_ARTS, drawPattern, drawDeck } from './patterns';

// The customiser: a big spinnable rider on the left, and tabs of choices on the right (above
// and below in portrait). Every tap changes the look straight away, saves it, and the rider
// does a little trick. Style choices show as pictures of the rider wearing them.

/** Which ride the preview shows, or 'deck': the skateboard on its own, upside down to show its picture. */
type View = 'skate' | 'scooter' | 'snow' | 'mountain' | 'deck';
/** Where the camera looks: the whole rider, the head, or down at the board. */
type Frame = 'body' | 'head' | 'legs' | 'feet' | 'board' | 'torso' | 'face';

interface Choice<K extends keyof Look> {
  key: K;
  label: string;
  /** Style chips: each value with its name; colours: a palette. */
  values: readonly Look[K][];
  names?: Record<string, string>;
  /** Colour swatches rather than pictures. */
  colours?: boolean;
  /** Pictures drawn straight from a canvas (patterns, deck art) instead of the rider. */
  draw?: (cv: HTMLCanvasElement, v: Look[K], look: Look) => void;
  /** Only shown when this is true. */
  when?: (l: Look) => boolean;
  /** Which ride and framing to show while choosing this. */
  view?: View;
  frame?: Frame;
}
type AnyChoice = { [K in keyof Look]: Choice<K> }[keyof Look];
/** frame: where the camera looks; thumb: how the pictures of choices are framed. */
interface Tab { id: string; label: string; icon: string; frame: Frame; thumb: Frame; view?: View; choices: AnyChoice[] }

const NAMES: Record<string, string> = {
  buzz: 'Buzz cut', crop: 'Short', spiky: 'Spiky', curly: 'Curly', puffs: 'Puffs', bob: 'Bob', ponytail: 'Ponytail', bun: 'Bun',
  pigtails: 'Bunches', long: 'Long', braids: 'Braids', mohawk: 'Mohawk',
  none: 'None', cap: 'Cap', capback: 'Cap back', beanie: 'Beanie', bucket: 'Bucket hat', headband: 'Headband', bandana: 'Bandana',
  catears: 'Cat ears', unicorn: 'Unicorn',
  smile: 'Smile', grin: 'Big grin', cheeky: 'Cheeky', tongue: 'Tongue out',
  round: 'Specs', sun: 'Shades', star: 'Stars', heart: 'Hearts',
  hoodie: 'Hoodie', tee: 'T-shirt', vest: 'Vest', jersey: 'Jersey', rash: 'Rash vest', jacket: 'Jacket',
  jeans: 'Jeans', shorts: 'Shorts', joggers: 'Joggers', leggings: 'Leggings', skirt: 'Skirt',
  low: 'Low', high: 'High tops',
  stripes: 'Stripes', stars: 'Stars', hearts: 'Hearts', spots: 'Spots', checks: 'Checks', zigzag: 'Zigzag', flowers: 'Flowers',
  lightning: 'Lightning', rainbow: 'Rainbow', camo: 'Camo', flames: 'Flames',
  dino: 'Dinosaur', shark: 'Shark', galaxy: 'Space', smiley: 'Smiley', paws: 'Paws',
  true: 'Yes', false: 'No',
};

const c = <K extends keyof Look>(ch: Choice<K>) => ch as unknown as AnyChoice;
const TABS: Tab[] = [
  { id: 'me', thumb: 'face', label: 'ME', icon: '&#128578;', frame: 'head', choices: [
    c({ key: 'skin', label: 'Skin', values: SKIN_TONES, colours: true }),
    c({ key: 'eyes', label: 'Eyes', values: EYE_COLOURS, colours: true }),
    c({ key: 'mouth', label: 'Mouth', values: MOUTHS }),
    c({ key: 'freckles', label: 'Freckles', values: [false, true] }),
    c({ key: 'cheeks', label: 'Rosy cheeks', values: [false, true] }),
    c({ key: 'lashes', label: 'Eyelashes', values: [false, true] }),
    c({ key: 'glasses', label: 'Glasses', values: GLASSES }),
    c({ key: 'glassesColour', label: 'Glasses colour', values: COLOURS, colours: true, when: (l) => l.glasses !== 'none' }),
  ] },
  { id: 'hair', thumb: 'face', label: 'HAIR', icon: '&#128135;', frame: 'head', choices: [
    c({ key: 'hair', label: 'Style', values: HAIR_STYLES }),
    c({ key: 'hairColour', label: 'Colour', values: HAIR_COLOURS, colours: true }),
    c({ key: 'tips', label: 'Dyed tips', values: [-1, ...HAIR_COLOURS.slice(9)], colours: true, when: (l) => ['long', 'braids', 'mohawk', 'bob', 'ponytail', 'pigtails'].includes(l.hair) }),
  ] },
  { id: 'hat', thumb: 'face', label: 'HAT', icon: '&#129506;', frame: 'head', choices: [
    c({ key: 'hat', label: 'Hat', values: HATS }),
    c({ key: 'hatColour', label: 'Colour', values: COLOURS, colours: true, when: (l) => l.hat !== 'none' }),
    c({ key: 'helmetColour', label: 'Helmet colour (scooter, farm and snow)', values: COLOURS, colours: true, view: 'scooter' }),
  ] },
  { id: 'top', thumb: 'torso', label: 'TOP', icon: '&#128085;', frame: 'body', choices: [
    c({ key: 'top', label: 'Top', values: TOPS }),
    c({ key: 'topColour', label: 'Colour', values: COLOURS, colours: true }),
    c({ key: 'trimColour', label: 'Trim colour', values: COLOURS, colours: true }),
    c({ key: 'pattern', label: 'Pattern', values: PATTERNS, draw: (cv, v, l) => drawPattern(cv, v, l.topColour, l.patternColour) }),
    c({ key: 'patternColour', label: 'Pattern colour', values: COLOURS, colours: true, when: (l) => l.pattern !== 'none' && l.pattern !== 'rainbow' }),
  ] },
  { id: 'bottoms', thumb: 'legs', label: 'LEGS', icon: '&#128086;', frame: 'legs', choices: [
    c({ key: 'bottom', label: 'Bottoms', values: BOTTOMS }),
    c({ key: 'bottomColour', label: 'Colour', values: COLOURS, colours: true }),
    c({ key: 'legsColour', label: 'Leggings colour', values: COLOURS, colours: true, when: (l) => l.bottom === 'skirt' }),
    c({ key: 'sockColour', label: 'Socks', values: COLOURS, colours: true, when: (l) => l.bottom === 'shorts' }),
  ] },
  { id: 'shoes', thumb: 'feet', label: 'SHOES', icon: '&#128095;', frame: 'feet', choices: [
    c({ key: 'shoes', label: 'Shoes', values: SHOES }),
    c({ key: 'shoeColour', label: 'Colour', values: COLOURS, colours: true }),
    c({ key: 'laceColour', label: 'Laces and stripes', values: COLOURS, colours: true }),
    c({ key: 'soleColour', label: 'Soles', values: COLOURS, colours: true }),
  ] },
  { id: 'board', thumb: 'body', label: 'BOARD', icon: '&#128761;', frame: 'board', view: 'deck', choices: [
    c({ key: 'deck', label: 'Picture', values: DECK_ARTS, draw: (cv, v, l) => drawDeck(cv, v, l.deckColour, l.deckArtColour) }),
    c({ key: 'deckColour', label: 'Deck colour', values: COLOURS, colours: true }),
    c({ key: 'deckArtColour', label: 'Picture colour', values: COLOURS, colours: true, when: (l) => l.deck !== 'none' && l.deck !== 'rainbow' && l.deck !== 'checks' }),
    c({ key: 'gripColour', label: 'Grip tape', values: COLOURS, colours: true }),
    c({ key: 'wheelColour', label: 'Wheels', values: COLOURS, colours: true }),
    c({ key: 'truckColour', label: 'Trucks', values: COLOURS, colours: true }),
  ] },
  { id: 'rides', thumb: 'body', label: 'RIDES', icon: '&#128756;', frame: 'body', view: 'scooter', choices: [
    c({ key: 'scooterColour', label: 'Scooter', values: COLOURS, colours: true, view: 'scooter' }),
    c({ key: 'barsColour', label: 'Scooter bars', values: COLOURS, colours: true, view: 'scooter' }),
    c({ key: 'scooterWheelColour', label: 'Scooter wheels', values: COLOURS, colours: true, view: 'scooter' }),
    c({ key: 'snowboardColour', label: 'Snowboard', values: COLOURS, colours: true, view: 'snow' }),
    c({ key: 'mountainboardColour', label: 'Mountain board', values: COLOURS, colours: true, view: 'mountain' }),
  ] },
];

const css = (n: number) => '#' + n.toString(16).padStart(6, '0');

/** A copy of a rider part with just its own model, not the joints another rider hung off it. */
function ownClone(o: THREE.Object3D): THREE.Object3D {
  if (!o.children.some((ch) => ch.userData.model)) return o.clone();
  const cl = o.clone(false);
  for (const ch of o.children) if (ch.userData.model) cl.add(ch.clone());
  return cl;
}
function cloneParts(parts: Assets['parts']): Assets['parts'] {
  const out: Record<string, THREE.Object3D> = {};
  for (const [k, v] of Object.entries(parts)) if (v) out[k] = ownClone(v);
  return out as Assets['parts'];
}

/** A rider rolling along a long flat, kept in the middle of its own little scene. */
class Stage {
  readonly scene = new THREE.Scene();
  /** Turned by dragging: the rider spins on the spot. */
  readonly turn = new THREE.Group();
  private offset = new THREE.Group();
  readonly skater: Skater;
  readonly scooter: ScooterRig;
  private rider: Rider;
  private track = new TrackBuilder(0).flat(3000).build(5, 2990);
  private pad: THREE.Mesh;
  /** The skateboard on show by itself, nose up, its underside to the camera. */
  private deck = new THREE.Group();
  private deckSpin = new THREE.Group();
  private t = 0;
  view: View = 'skate';

  constructor(assets: Assets, private wardrobe: Wardrobe) {
    this.scene.add(new THREE.HemisphereLight(0xeaf6ff, 0x8a9a7a, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 2.1);
    sun.position.set(-4, 8, 7);
    this.scene.add(sun);
    this.skater = new Skater(cloneParts(assets.parts));
    this.scooter = new ScooterRig(cloneParts(assets.parts));
    const padMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
    padMat.userData.outlineParameters = { visible: false };
    this.pad = new THREE.Mesh(new THREE.CircleGeometry(1.3, 48), padMat);
    this.pad.rotation.x = -Math.PI / 2;
    // Nose up and upside down: the deck's underside faces the camera.
    const flip = new THREE.Group();
    flip.rotation.x = -Math.PI / 2;
    flip.add(this.deck);
    this.deck.position.y = -0.1;
    const upright = new THREE.Group();
    upright.rotation.z = Math.PI / 2;
    upright.position.y = 0.75;
    upright.add(flip);
    this.deckSpin.add(upright);
    this.scene.add(this.deckSpin);
    this.scene.add(this.turn);
    this.turn.add(this.offset, this.pad);
    this.offset.add(this.skater.root, this.scooter.root, this.skater.shadowMesh, this.scooter.shadowMesh);
    const noop = () => {};
    this.rider = new Rider(this.track, { trick: noop, land: noop, bail: noop, pump: noop, fall: noop } as never);
    this.setView('skate');
  }

  wear(look: Look) {
    this.skater.wear(look, this.wardrobe);
    this.scooter.wear(look, this.wardrobe);
    dress(this.deck, ['deck__std'], this.wardrobe);
  }

  setView(v: View) {
    if (v === this.view && this.rider.x > 0) return;
    this.view = v;
    const scoot = v === 'scooter';
    const deck = v === 'deck';
    this.turn.visible = !deck;
    this.deckSpin.visible = deck;
    this.skater.root.visible = !scoot;
    this.skater.shadowMesh.visible = !scoot;
    this.scooter.root.visible = scoot;
    this.scooter.shadowMesh.visible = scoot;
    if (!scoot) this.skater.setBoard(v === 'snow' ? 'snow' : v === 'mountain' ? 'mountain' : 'skate');
    this.rider.opts = { friction: 1, maxSpeed: 17, snow: v === 'snow', mountain: v === 'mountain', scooter: scoot };
    this.rider.respawn(20, 0);
  }

  /** A little trick to show off a change. */
  trick() {
    const r = this.rider;
    // The board on show does a flip of its own.
    if (this.view === 'deck') { this.flipT = 0; return; }
    if (!r.grounded || r.bailing) return;
    const all: Swipe[] = ['up', 'left', 'right', 'down'];
    r.swipe(all[Math.floor(Math.random() * 4)]);
    r.release();
  }

  private flipT = -1;

  update(dt: number) {
    this.t += dt;
    // Swaying to glimpse the grip tape, and a kickflip when something changes.
    let roll = 0;
    if (this.flipT >= 0) {
      this.flipT += dt / 0.6;
      roll = Math.PI * 2 * (1 - (1 - Math.min(1, this.flipT)) ** 2);
      if (this.flipT >= 1) this.flipT = -1;
    }
    this.deckSpin.rotation.y = Math.sin(this.t * 0.9) * 0.55 + roll;
    const r = this.rider;
    // Roll steadily, fast enough not to push, on a never-ending flat.
    if (r.grounded) r.v = 5.2;
    if (r.x > 2500) r.respawn(20, 0);
    r.update(dt);
    const fig = this.view === 'scooter' ? this.scooter : this.skater;
    fig.update(dt, r, (x) => this.track.height(x), (x) => this.track.slope(x));
    this.offset.position.x = -r.x;
  }
}

export class Customiser {
  private renderer: THREE.WebGLRenderer;
  private effect: OutlineEffect;
  private camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50);
  private camPos = new THREE.Vector3(0, 1.2, 3.6);
  private camLook = new THREE.Vector3(0, 0.9, 0);
  private stage: Stage;
  /** For pictures of the choices: a second rider standing still. */
  private thumbStage: Stage;
  private thumbs: THREE.WebGLRenderer;
  private thumbEffect: OutlineEffect;
  private tab = TABS[0];
  private frame: Frame = 'head';
  private yaw = FACE_YAW;
  private yawGoal = FACE_YAW;
  private open = false;
  private raf = 0;
  private last = 0;
  private panel: HTMLElement;
  private body: HTMLElement;
  private canvas: HTMLCanvasElement;

  constructor(private assets: Assets, private wardrobe: Wardrobe, private look: Look, private onDone: (l: Look) => void) {
    this.panel = document.getElementById('rider')!;
    this.canvas = this.panel.querySelector('canvas')!;
    this.body = this.panel.querySelector('.rd-body')!;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.effect = new OutlineEffect(this.renderer, { defaultThickness: 0.006, defaultColor: [0.1, 0.08, 0.08] });
    this.stage = new Stage(assets, wardrobe);
    this.thumbStage = new Stage(assets, wardrobe);
    for (let i = 0; i < 60; i++) this.thumbStage.update(1 / 30);
    this.thumbStage.turn.rotation.y = FACE_YAW;
    this.thumbs = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.thumbs.setSize(THUMB, THUMB);
    this.thumbs.outputColorSpace = THREE.SRGBColorSpace;
    this.thumbEffect = new OutlineEffect(this.thumbs, { defaultThickness: 0.008, defaultColor: [0.1, 0.08, 0.08] });
    this.buildTabs();
    this.panel.querySelector('.rd-done')!.addEventListener('click', () => this.close());
    this.panel.querySelector('.rd-dice')!.addEventListener('click', () => {
      this.set(randomLook(this.look));
      this.stage.trick();
    });
    this.dragToTurn();
    window.addEventListener('resize', () => { if (this.open) this.resize(); });
  }

  get isOpen() { return this.open; }

  /** The look as the preview shows it: hat off while choosing hair, so you can see it. */
  private shown(l: Look = this.look): Look {
    return this.tab.id === 'hair' ? { ...l, hat: 'none' } : l;
  }

  show(look: Look) {
    this.look = look;
    this.open = true;
    this.panel.classList.remove('hidden');
    setColours(look);
    this.selectTab(this.tab);
    this.resize();
    this.last = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  close() {
    this.open = false;
    cancelAnimationFrame(this.raf);
    this.panel.classList.add('hidden');
    this.onDone(this.look);
  }

  private set(look: Look) {
    const before = this.look;
    this.look = look;
    saveLook(look);
    setColours(look);
    // Only re-dress if a piece changed, not just a colour.
    const pieces: (keyof Look)[] = ['hair', 'hat', 'mouth', 'freckles', 'cheeks', 'lashes', 'glasses', 'top', 'bottom', 'shoes'];
    if (pieces.some((k) => before[k] !== look[k])) this.stage.wear(this.shown());
    this.renderChoices();
  }

  private buildTabs() {
    const bar = this.panel.querySelector('.rd-tabs')!;
    bar.innerHTML = '';
    for (const t of TABS) {
      const b = document.createElement('button');
      b.innerHTML = `<i>${t.icon}</i><span>${t.label}</span>`;
      b.dataset.tab = t.id;
      b.addEventListener('click', () => this.selectTab(t));
      bar.appendChild(b);
    }
  }

  private selectTab(t: Tab) {
    this.tab = t;
    this.frame = t.frame;
    this.stage.wear(this.shown());
    this.stage.setView(t.view ?? 'skate');
    this.yawGoal = this.stage.view === 'scooter' ? -0.9 : FACE_YAW;
    this.panel.querySelectorAll<HTMLElement>('.rd-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t.id));
    this.renderChoices();
    this.body.scrollTop = 0;
  }

  private renderChoices() {
    const look = this.look;
    this.body.innerHTML = '';
    for (const ch of this.tab.choices) {
      if (ch.when && !ch.when(look)) continue;
      const sec = document.createElement('section');
      sec.innerHTML = `<h3>${ch.label}</h3>`;
      const row = document.createElement('div');
      row.className = ch.colours ? 'rd-swatches' : 'rd-chips';
      for (const v of ch.values as readonly unknown[]) {
        const b = document.createElement('button');
        const on = look[ch.key] === v;
        b.classList.toggle('on', on);
        if (ch.colours) {
          if (v === -1) { b.classList.add('none'); b.innerHTML = '&#10005;'; } else b.style.background = css(v as number);
          b.setAttribute('aria-label', `${ch.label} ${v === -1 ? 'none' : css(v as number)}`);
        } else {
          const name = NAMES[String(v)] ?? String(v);
          b.innerHTML = `<img alt="" /><span>${name}</span>`;
          const img = b.querySelector('img')!;
          img.src = this.picture(ch, v);
        }
        b.addEventListener('click', () => {
          if (ch.view) this.stage.setView(ch.view);
          else this.stage.setView(this.tab.view ?? 'skate');
          if (look[ch.key] === v) { this.stage.trick(); return; }
          this.set({ ...this.look, [ch.key]: v });
          this.stage.trick();
        });
        row.appendChild(b);
      }
      sec.appendChild(row);
      sec.addEventListener('pointerdown', () => { if (ch.view && ch.view !== this.stage.view) this.stage.setView(ch.view); }, { capture: true });
      this.body.appendChild(sec);
    }
  }

  /** A picture of a choice: the rider wearing it, or the pattern or deck picture itself. */
  private picture(ch: AnyChoice, v: unknown): string {
    const look = this.shown({ ...this.look, [ch.key]: v } as Look);
    if (ch.draw) {
      const cv = document.createElement('canvas');
      const deck = ch.key === 'deck';
      cv.width = deck ? 256 : 96;
      cv.height = deck ? 64 : 96;
      (ch.draw as (c: HTMLCanvasElement, v: unknown, l: Look) => void)(cv, v, look);
      return cv.toDataURL();
    }
    const key = JSON.stringify([this.tab.thumb, look]);
    const hit = thumbCache.get(key);
    if (hit) return hit;
    const st = this.thumbStage;
    setColours(look);
    st.wear(look);
    st.setView('skate');
    for (let i = 0; i < 3; i++) st.update(1 / 30);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 20);
    const [pos, at] = framing(this.tab.thumb, 0);
    cam.position.copy(pos);
    cam.lookAt(at);
    this.thumbs.setClearColor(0x000000, 0);
    this.thumbEffect.render(st.scene, cam);
    const url = this.thumbs.domElement.toDataURL();
    setColours(this.look);
    if (thumbCache.size > 400) thumbCache.clear();
    thumbCache.set(key, url);
    return url;
  }

  private dragToTurn() {
    let lastX: number | null = null;
    this.canvas.addEventListener('pointerdown', (e) => { lastX = e.clientX; this.canvas.setPointerCapture(e.pointerId); });
    this.canvas.addEventListener('pointermove', (e) => {
      if (lastX === null) return;
      this.yawGoal += (e.clientX - lastX) * 0.012;
      lastX = e.clientX;
    });
    const up = () => { lastX = null; };
    this.canvas.addEventListener('pointerup', up);
    this.canvas.addEventListener('pointercancel', up);
    // A tap on the rider: do a trick.
    let downAt = 0;
    this.canvas.addEventListener('pointerdown', () => { downAt = performance.now(); });
    this.canvas.addEventListener('pointerup', () => { if (performance.now() - downAt < 200) this.stage.trick(); });
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    this.renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    this.camera.aspect = r.width / Math.max(1, r.height);
    this.camera.updateProjectionMatrix();
  }

  private loop(now: number) {
    if (!this.open) return;
    const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000));
    this.last = now;
    this.stage.update(dt);
    this.yaw += (this.yawGoal - this.yaw) * (1 - Math.exp(-dt * 10));
    this.stage.turn.rotation.y = this.yaw;
    const [pos, at] = framing(this.frame, this.camera.aspect);
    const k = 1 - Math.exp(-dt * 5);
    this.camPos.lerp(pos, k);
    this.camLook.lerp(at, k);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    this.effect.render(this.stage.scene, this.camera);
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }
}

const THUMB = 96;
/** Turns the skater (who stands across the board, looking along it) to face the camera. */
const FACE_YAW = -0.75;
const thumbCache = new Map<string, string>();

/** Camera position and target for each framing. */
function framing(f: Frame, aspect: number): [THREE.Vector3, THREE.Vector3] {
  const wide = aspect > 0 && aspect < 0.8 ? 1.25 : 1;
  switch (f) {
    case 'face': return [new THREE.Vector3(0, 1.6, 1.1), new THREE.Vector3(0, 1.56, 0)];
    case 'torso': return [new THREE.Vector3(0, 1.2, 1.9), new THREE.Vector3(0, 1.08, 0)];
    case 'head': return [new THREE.Vector3(0, 1.6, 2.1 * wide), new THREE.Vector3(0, 1.38, 0)];
    case 'legs': return [new THREE.Vector3(0, 0.75, 2.3 * wide), new THREE.Vector3(0, 0.6, 0)];
    case 'feet': return [new THREE.Vector3(0, 0.45, 1.4 * wide), new THREE.Vector3(0, 0.15, 0)];
    case 'board': return [new THREE.Vector3(0, 0.85, 1.75 * wide), new THREE.Vector3(0, 0.75, 0)];
    default: return [new THREE.Vector3(0, 1.15, 3.6 * wide), new THREE.Vector3(0, 0.9, 0)];
  }
}
