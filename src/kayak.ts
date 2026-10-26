import * as THREE from 'three';
import { Rider } from './rider';
import { toon } from './toon';
import { PartName, PART_NAMES, elbowBackBend } from './skater';
import { Look, Wardrobe, bodyPieces, headPieces, dress, markModels, paint } from './look';

// The white water kayak and its paddler: the same kid as the skater, sat in the boat with a
// spray deck sealing them in, a buoyancy aid on and a helmet, holding a double-bladed paddle.
// Two boats: a half slice river runner for the rivers (a full, rockered bow that rides up over
// the waves, and a low, thin "slicey" stern), and a stubby playboat for the standing waves.
//
// Boat space: x forward (to the bow), y up, z towards the camera; the origin is on the water
// line under the middle of the cockpit. The legs are inside the boat, so only the body from the
// hips up shows; the arms reach for the paddle with two-bone IK.

const UPPER_ARM = 0.29;
const FOREARM = 0.3;

export type BoatKind = 'river' | 'play';

interface HullShape {
  /** Length, beam, and where the widest point is (0 stern, 1 bow). */
  len: number;
  beam: number;
  widest: number;
  /** Deck height at the bow end, over the cockpit, and at the stern end. */
  bowDeck: number;
  midDeck: number;
  sternDeck: number;
  /** How far the bow and stern rise off the water (rocker), and how deep the hull sits. */
  bowRocker: number;
  sternRocker: number;
  draft: number;
}

/**
 * A half slice river runner (in the spirit of boats like the Pyranha Ripper or Dagger Rewind,
 * about 2.6 m long): full, high bow with plenty of rocker; low, thin, flat stern.
 */
const HALF_SLICE: HullShape = { len: 2.6, beam: 0.64, widest: 0.55, bowDeck: 0.2, midDeck: 0.26, sternDeck: 0.07, bowRocker: 0.2, sternRocker: 0.05, draft: 0.12 };
/** A playboat: short, flat and wide, with thin low ends at both bow and stern. */
const PLAYBOAT: HullShape = { len: 1.85, beam: 0.66, widest: 0.5, bowDeck: 0.08, midDeck: 0.24, sternDeck: 0.06, bowRocker: 0.1, sternRocker: 0.06, draft: 0.1 };

const smooth = (a: number, b: number, t: number) => {
  const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const DOWN = v3(0, -1, 0);

/** Height of the deck's ridge and of the keel at `t` along the boat (0 stern, 1 bow). */
function profile(s: HullShape, t: number) {
  // Deck: low at the ends, rising to the cockpit, the bow carrying more volume than the stern.
  const deck = t < 0.5
    ? s.sternDeck + (s.midDeck - s.sternDeck) * Math.sin(Math.PI * t) ** 0.7
    : s.bowDeck + (s.midDeck - s.bowDeck) * Math.sin(Math.PI * t) ** 0.8;
  // Keel: flat under the middle, sweeping up to each end.
  const bow = Math.max(0, t - 0.62) / 0.38, stern = Math.max(0, 0.22 - t) / 0.22;
  const keel = -s.draft + s.bowRocker * bow * bow + s.sternRocker * stern * stern + (s.draft * 0.7) * (bow ** 3 + stern ** 2 * 0.5);
  return { deck: Math.max(deck, keel + 0.02), keel };
}

/** Half the beam at `t`: pointed at both ends, widest a little ahead of the middle. */
function halfBeam(s: HullShape, t: number) {
  const u = t < s.widest ? t / s.widest : (1 - t) / (1 - s.widest);
  return (s.beam / 2) * Math.sin((Math.PI / 2) * Math.min(1, u)) ** 0.75;
}

/** The hull as one mesh: cross-sections lofted from stern to bow, a flat-ish hull under a domed deck. */
function hullGeometry(s: HullShape): THREE.BufferGeometry {
  const NS = 48, NP = 24;
  const pos: number[] = [];
  for (let i = 0; i <= NS; i++) {
    const t = i / NS, x = (t - 0.5) * s.len;
    const { deck, keel } = profile(s, t);
    // The sides are a little way up from the keel (hard edges, the "chines"), the deck domes over.
    const w = halfBeam(s, t), chine = keel + (deck - keel) * 0.35;
    for (let j = 0; j < NP; j++) {
      const a = (j / NP) * Math.PI * 2;
      const c = Math.cos(a), sn = Math.sin(a);
      // Upper half: round deck; lower half: flatter hull with soft chines.
      const z = Math.sign(c) * Math.abs(c) ** (sn > 0 ? 0.8 : 0.45) * w;
      const y = sn > 0 ? chine + (deck - chine) * sn ** 1.2 : chine + (chine - keel) * -(Math.abs(sn) ** 1.6);
      pos.push(x, y, z);
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < NS; i++) for (let j = 0; j < NP; j++) {
    const a = i * NP + j, b = i * NP + (j + 1) % NP, c = a + NP, d = b + NP;
    idx.push(a, c, b, b, c, d);
  }
  // Close the two ends.
  const tip = (t: number) => { const { deck, keel } = profile(s, t); return [(t - 0.5) * s.len, (deck + keel) / 2, 0]; };
  const e0 = pos.length / 3; pos.push(...tip(0));
  const e1 = pos.length / 3; pos.push(...tip(1));
  for (let j = 0; j < NP; j++) {
    idx.push(e0, j, (j + 1) % NP);
    const a = NS * NP + j, b = NS * NP + (j + 1) % NP;
    idx.push(e1, b, a);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A boat: hull, cockpit rim and spray deck, with a stripe of the second colour along its side. */
function buildBoat(s: HullShape, colour: number, trim: number, slot: string): THREE.Group {
  const g = new THREE.Group();
  const hullMat = toon(colour);
  // Painted in the customiser's boat colour.
  hullMat.name = slot;
  const hull = new THREE.Mesh(hullGeometry(s), hullMat);
  g.add(hull);
  // A grab loop at each end, and a stripe of trim along the deck.
  const trimMat = toon(trim);
  trimMat.name = 'kayak_trim';
  const deckAt = (t: number) => profile(s, t).deck;
  for (const t of [0.04, 0.96]) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 12), toon(0x26262a));
    loop.position.set((t - 0.5) * s.len, deckAt(t) - 0.005, 0);
    g.add(loop);
  }
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(s.len * 0.62, 0.012, 0.05), trimMat);
  stripe.position.set(s.len * 0.12, deckAt(0.62) + 0.004, 0);
  stripe.rotation.z = Math.atan2(deckAt(0.93) - deckAt(0.31), s.len * 0.62) * 0.5;
  g.add(stripe);
  // The cockpit: a rim round the opening and the spray deck stretched over it, up to the waist.
  const mid = profile(s, 0.47).deck;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 6, 28), toon(0x2a2a2e));
  rim.scale.set(0.4, 0.24, 1);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(-0.08, mid - 0.01, 0);
  g.add(rim);
  const skirtMat = toon(0x22324a);
  skirtMat.name = 'kayak_skirt';
  const deckSkirt = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), skirtMat);
  deckSkirt.scale.set(0.4, 0.06, 0.24);
  deckSkirt.position.set(-0.08, mid - 0.01, 0);
  g.add(deckSkirt);
  const tunnel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.16, 16), skirtMat);
  tunnel.position.set(-0.14, mid + 0.07, 0);
  g.add(tunnel);
  return g;
}

/** The paddle: a shaft with a blade at each end, feathered (turned) against each other. */
function buildPaddle(): { group: THREE.Group; blades: THREE.Object3D[] } {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.96, 8), toon(0x2a2a2e));
  g.add(shaft);
  const bladeMat = toon(0xf4c430);
  bladeMat.name = 'kayak_blade';
  const blades: THREE.Object3D[] = [];
  for (const end of [1, -1]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), bladeMat);
    b.scale.set(0.1, 0.23, 0.018);
    b.position.y = end * 0.86;
    // Feathered: the far blade turned against the near one.
    b.rotation.y = end > 0 ? 0 : Math.PI / 3;
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 6), toon(0x2a2a2e));
    tip.position.y = end * 0.68;
    g.add(b, tip);
    blades.push(b);
  }
  return { group: g, blades };
}

/** A buoyancy aid over the top: a padded vest, open at the arms, with a dark collar. */
function buildVest(): THREE.Group {
  const g = new THREE.Group();
  const m = toon(0xffd02a);
  m.name = 'kayak_vest';
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.2, 4, 14), m);
  body.scale.set(1.05, 1, 0.82);
  body.position.y = 0.25;
  g.add(body);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 6, 16), toon(0x22324a));
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.45;
  g.add(collar);
  // Two padded panels down the front, and a buckle strap round the middle.
  const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.035, 16, 1, true), toon(0x22324a));
  strap.scale.set(1.05, 1, 0.84);
  strap.position.y = 0.16;
  g.add(strap);
  return g;
}

export class KayakRig {
  readonly root = new THREE.Group();
  /** Tips over for a capsize, and drifts off for a swim. */
  private body = new THREE.Group();
  /** Thrown about about the cockpit for tricks. */
  private trick = new THREE.Group();
  private boats: Record<BoatKind, THREE.Group>;
  private kind: BoatKind = 'river';
  private paddle: THREE.Group;
  private blades: THREE.Object3D[];
  private vest: THREE.Group;
  private p: Record<PartName, THREE.Object3D>;
  private helmet: THREE.Object3D;
  private shadow: THREE.Mesh;

  /** Stroke in progress: 0 to 1 through it, and which side (+1 near, -1 far). */
  private strokeT = -1;
  private strokeSide: 1 | -1 = 1;
  private queued = 0;
  private strokeW = 0;
  private pops = 0;
  private hopT = -1;
  private splats = 0;
  private splatT = -1;
  /** The boat's turn from tricks, eased back to upright after. */
  private pitch = 0;
  private yaw = 0;
  private roll = 0;
  private bailT = 0;
  private bob = 0;
  private wasAir = false;
  private landT = -1;
  private surfYaw = 0;

  constructor(parts: Partial<Record<string, THREE.Object3D>> = {}, shadow?: THREE.Mesh) {
    const ph = placeholderBody();
    const own = (o: THREE.Object3D) => { const c = o.clone(false); if (o.children[0]) c.add(o.children[0].clone()); return c; };
    this.p = Object.fromEntries(PART_NAMES.map((n) => [n, parts[n] ? own(parts[n]) : ph[n]])) as Record<PartName, THREE.Object3D>;
    const p = this.p;
    this.helmet = parts.head_skatehelmet?.clone() ?? p.head;
    markModels([...Object.values(p), this.helmet]);

    this.root.add(this.body);
    this.body.add(this.trick);
    this.boats = { river: buildBoat(HALF_SLICE, 0xf2552a, 0xffffff, 'kayak_hull'), play: buildBoat(PLAYBOAT, 0x2ab0e0, 0xffd02a, 'playboat_hull') };
    for (const b of Object.values(this.boats)) this.trick.add(b);
    const pd = buildPaddle();
    this.paddle = pd.group;
    this.blades = pd.blades;
    this.trick.add(this.paddle);

    // Sat in the cockpit, facing the bow; the legs are hidden inside the boat.
    this.trick.add(p.pelvis);
    p.pelvis.rotation.y = Math.PI / 2;
    p.pelvis.add(p.torso);
    p.torso.add(this.helmet);
    this.helmet.position.y = 0.5;
    p.head.visible = false;
    this.vest = buildVest();
    p.torso.add(this.vest);
    p.torso.add(p.upperArm_L, p.upperArm_R);
    p.upperArm_L.position.set(0.21, 0.44, 0);
    p.upperArm_R.position.set(-0.21, 0.44, 0);
    p.upperArm_L.add(p.forearm_L);
    p.upperArm_R.add(p.forearm_R);
    p.forearm_L.position.y = -UPPER_ARM;
    p.forearm_R.position.y = -UPPER_ARM;
    for (const n of ['thigh_L', 'thigh_R', 'shin_L', 'shin_R', 'shoe_L', 'shoe_R', 'deck'] as const) p[n].visible = false;
    this.setBoat('river');

    const sh = shadow ?? new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }),
    );
    sh.rotation.x = -Math.PI / 2;
    (sh.material as THREE.Material).userData.outlineParameters = { visible: false };
    this.shadow = sh;
  }

  get shadowMesh() { return this.shadow; }

  /** The half slice on the rivers, the playboat on the standing waves. */
  setBoat(kind: BoatKind) {
    this.kind = kind;
    for (const [k, b] of Object.entries(this.boats)) b.visible = k === kind;
    // Sat a little lower in the playboat, which is thinner over the knees.
    this.p.pelvis.position.set(-0.14, kind === 'play' ? 0.16 : 0.18, 0);
  }

  /** Dress in a look from the customiser, in a helmet in their helmet colour. */
  wear(look: Look, w: Wardrobe) {
    if (w.loaded) {
      for (const [n, names] of Object.entries(bodyPieces(look))) dress(this.p[n as PartName], names, w);
      dress(this.helmet, headPieces(look, 'water'), w, look);
    }
    paint(this.root);
  }

  /** The worst wrong-way elbow bend of the two arms, in radians (for the playtest). */
  elbowBackBend() {
    return Math.max(elbowBackBend(this.p.forearm_L), elbowBackBend(this.p.forearm_R));
  }

  /** No legs to check: they're inside the boat. */
  legPoints(): THREE.Vector3[] { return []; }

  /** Everything update() moves, for recording replays. */
  get joints(): THREE.Object3D[] {
    return [this.root, this.body, this.trick, ...Object.values(this.boats), this.paddle, ...Object.values(this.p), this.helmet, this.vest, this.shadow];
  }

  /** A tap: another paddle stroke, on the other side. */
  pumpKick() {
    if (this.strokeT < 0) { this.strokeT = 0; this.strokeSide = this.strokeSide > 0 ? -1 : 1; } else this.queued = 1;
  }

  update(dt: number, r: Rider, groundY: (x: number) => number, groundSlope: (x: number) => number) {
    const p = this.p;
    const air = !r.grounded && !r.grind && !r.loop;
    const ease = (from: number, to: number, rate: number) => from + (to - from) * (1 - Math.exp(-dt * rate));

    // Paddle strokes: on each tap, and steadily while paddling along on its own when slow.
    if (this.strokeT < 0 && (r.pushing || this.queued) && !air && !r.roll && !r.bailing) {
      this.queued = 0;
      this.strokeT = 0;
      this.strokeSide = this.strokeSide > 0 ? -1 : 1;
    }
    if (this.strokeT >= 0) {
      this.strokeT += dt / 0.5;
      if (this.strokeT >= 1) this.strokeT = -1;
    }
    this.strokeW = ease(this.strokeW, this.strokeT >= 0 && !air && !r.roll ? 1 : 0, 14);

    // Boof: the bow comes up as you launch, then levels out for the air.
    if (r.pops !== this.pops) { this.pops = r.pops; this.hopT = 0; }
    let boof = 0;
    if (this.hopT >= 0) {
      this.hopT += dt;
      boof = 0.45 * smooth(0, 0.08, this.hopT) * (1 - smooth(0.15, 0.45, this.hopT));
      if (this.hopT > 0.5) this.hopT = -1;
    }
    // Splat: stood up on the stern against the rock, then back down.
    if (r.splats !== this.splats) { this.splats = r.splats; this.splatT = 0; }
    let splat = 0;
    if (this.splatT >= 0) {
      this.splatT += dt;
      splat = 1.25 * smooth(0, 0.15, this.splatT) * (1 - smooth(0.45, 0.7, this.splatT));
      if (this.splatT > 0.7) this.splatT = -1;
    }
    // Landing: the bow buries a little and pops back up.
    if (this.wasAir && !air && !r.bailing) this.landT = 0;
    this.wasAir = air;
    let land = 0;
    if (this.landT >= 0) {
      this.landT += dt;
      land = -0.18 * Math.sin(Math.min(1, this.landT / 0.12) * Math.PI / 2) * Math.exp(-Math.max(0, this.landT - 0.12) * 6);
      if (this.landT > 1) this.landT = -1;
    }

    // Stalls: up on the stern (nose up) or the bow.
    // Stalls stand up further the more the device is tipped.
    const up = 0.55 + 0.45 * Math.min(1, Math.abs(r.tilt));
    const stall = r.manual === 'Stern Stall' ? 0.95 * up : r.manual === 'Bow Stall' ? -0.85 * up : 0;
    // Side surfing, held in a sticky hole: turned across the current, bouncing.
    this.surfYaw = ease(this.surfYaw, r.stuck ? Math.PI / 2 : 0, 8);
    // Capsized: over and back up as the strokes come; a swim leaves the boat upside down.
    const over = r.roll ? Math.PI * (1 - smooth(0, 1, r.roll.taps / 3)) : r.bailing ? Math.PI : 0;
    this.roll = ease(this.roll, over, r.roll || r.bailing ? 9 : 12);
    this.pitch = ease(this.pitch, stall + splat + boof + land, 12);

    // Where it pivots: stalls about the end that's in the water, the rest about the cockpit.
    const pivotX = stall > 0 ? -1.0 : stall < 0 ? 0.95 : splat > 0.01 ? -0.9 : 0;
    // The boat as you steer it: tipped by the tilt, turned by your thumb.
    const yaw = r.boat.yaw + this.surfYaw;
    const pitch = this.pitch + r.boat.pitch;
    this.bob += dt;
    const bob = !air && !r.bailing ? 0.02 * Math.sin(this.bob * 3.2) : 0;
    this.root.position.set(r.x, r.y + bob, r.z);
    this.root.rotation.set(0, 0, r.angle, 'ZYX');
    this.trick.position.set(pivotX, 0, 0);
    this.trick.rotation.set(this.roll + r.boat.wheelRoll, yaw, pitch, 'YZX');
    for (const b of Object.values(this.boats)) b.position.set(-pivotX, 0, 0);
    p.pelvis.position.x = -0.14 - pivotX;

    // The paddler: upright, leaning into a stroke, twisting with it, tucked forward in the air.
    const lean = air ? 0.35 : 0.12 + 0.15 * this.strokeW;
    const s = this.strokeSide;
    const st = Math.max(0, this.strokeT);
    const twist = this.strokeW * s * (0.45 - 0.8 * smooth(0.1, 0.8, st));
    p.torso.rotation.set(lean, twist, 0);
    this.helmet.rotation.set(-lean * 0.8, -twist * 0.6, 0);

    // The paddle. Idle: held across the boat in front of the chest. Stroking: the near (or far)
    // blade goes in by the feet and pulls back to the hip, the top hand high.
    const P = v3(-0.14 - pivotX + 0.32, 0.62, 0);
    const idleDir = v3(0, -0.12, 1).normalize();
    let catchX = 0.55, y = -0.08;
    if (st < 0.15) { catchX = 0.75; y = 0.3 - 0.38 * smooth(0, 0.15, st); }
    else if (st < 0.75) { catchX = 0.75 - 1.0 * smooth(0.15, 0.75, st); y = -0.08; }
    else { catchX = -0.25; y = -0.08 + 0.5 * smooth(0.75, 1, st); }
    const T = v3(catchX - pivotX, y, s * 0.62);
    const strokeDir = T.clone().sub(P).normalize().multiplyScalar(s);
    const dir = idleDir.clone().lerp(strokeDir, this.strokeW).normalize();
    // Capsized: the paddle sweeps out to the side to roll up.
    this.paddle.position.copy(P);
    this.paddle.quaternion.setFromUnitVectors(v3(0, 1, 0), dir);
    // The near hand on the shaft a little way from the middle, the far hand the other side.
    this.root.updateMatrixWorld(true);
    for (const [side, k] of [['L', -1], ['R', 1]] as const) {
      const hand = this.paddle.localToWorld(v3(0, k * 0.36, 0));
      const target = p.torso.worldToLocal(hand);
      const upper = side === 'L' ? p.upperArm_L : p.upperArm_R, fore = side === 'L' ? p.forearm_L : p.forearm_R;
      this.arm(upper, fore, target, v3(side === 'L' ? 1 : -1, -0.6, -0.3));
    }

    // Swim: the boat drifts on upside down, the paddler beside it, bobbing, then blinks back.
    if (r.bailing) {
      this.bailT += dt;
      this.body.position.set(Math.min(0.6, this.bailT * 0.8), 0, 0);
      p.pelvis.visible = this.bailT < 0.2;
      this.body.visible = !(this.bailT > 0.9 && Math.floor(this.bailT * 14) % 2 === 0);
    } else {
      this.bailT = 0;
      this.body.position.set(0, 0, 0);
      p.pelvis.visible = true;
      this.body.visible = true;
    }

    const gy = groundY(r.x);
    const height = Math.max(0, r.y - gy);
    this.shadow.position.set(r.x, gy + 0.02, r.z);
    this.shadow.rotation.set(-Math.PI / 2, 0, 0);
    this.shadow.rotateOnWorldAxis(v3(0, 0, 1), Math.atan(groundSlope(r.x)));
    const sc = Math.max(0.3, 1 - height * 0.12);
    this.shadow.scale.set(2.4 * sc, 0.6 * sc, 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = air ? 0.18 * sc : 0;
  }

  /** Two-bone IK for an arm, in the torso's space. */
  private arm(upper: THREE.Object3D, fore: THREE.Object3D, hand: THREE.Vector3, pole: THREE.Vector3) {
    const d = hand.clone().sub(upper.position);
    let len = d.length();
    const max = UPPER_ARM + FOREARM - 0.002;
    if (len > max) { d.multiplyScalar(max / len); len = max; }
    const u = d.clone().normalize();
    const cosA = (UPPER_ARM * UPPER_ARM + len * len - FOREARM * FOREARM) / (2 * UPPER_ARM * len);
    const a = Math.acos(Math.max(-1, Math.min(1, cosA)));
    const perp = pole.clone().sub(u.clone().multiplyScalar(pole.dot(u))).normalize();
    const elbow = u.clone().multiplyScalar(Math.cos(a) * UPPER_ARM).add(perp.multiplyScalar(Math.sin(a) * UPPER_ARM));
    upper.quaternion.setFromUnitVectors(DOWN, elbow.clone().normalize());
    const foreDir = d.clone().sub(elbow).normalize().applyQuaternion(upper.quaternion.clone().invert());
    fore.quaternion.setFromUnitVectors(DOWN, foreDir);
  }
}

/** Plain shapes for the body if the models can't load (and for the headless playtest). */
function placeholderBody(): Record<PartName, THREE.Object3D> {
  const cap3 = (r: number, len: number, color: number) => {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len - r * 2), 4, 10), toon(color));
    m.position.y = -len / 2;
    const g = new THREE.Group();
    g.add(m);
    return g;
  };
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), toon(0xffd640));
  skull.position.y = 0.17;
  head.add(skull);
  const torso = new THREE.Group();
  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.26, 4, 12), toon(0x2f8fd8));
  chest.position.y = 0.27;
  torso.add(chest);
  const pelvis = new THREE.Group();
  pelvis.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.06, 4, 10), toon(0x2f3b4d)));
  return {
    deck: new THREE.Group(), pelvis, torso, head,
    upperArm_L: cap3(0.05, UPPER_ARM, 0x2f8fd8), upperArm_R: cap3(0.05, UPPER_ARM, 0x2f8fd8),
    forearm_L: cap3(0.042, FOREARM, 0xf0c09a), forearm_R: cap3(0.042, FOREARM, 0xf0c09a),
    thigh_L: new THREE.Group(), thigh_R: new THREE.Group(), shin_L: new THREE.Group(), shin_R: new THREE.Group(),
    shoe_L: new THREE.Group(), shoe_R: new THREE.Group(),
  };
}
