import * as THREE from 'three';
import { Rider, BoardGrab } from './rider';
import { toon } from './toon';
import { spaceKit } from './spacesuit';
import { railY } from './track';

// Rigid-part skater posed procedurally: two-bone IK keeps the feet on the
// board while the body crouches, pumps, pops and tucks.
// Every part's mesh hangs from its joint along -Y, so models can be swapped in by name.

export const PART_NAMES = [
  'deck', 'pelvis', 'torso', 'head',
  'upperArm_L', 'upperArm_R', 'forearm_L', 'forearm_R',
  'thigh_L', 'thigh_R', 'shin_L', 'shin_R', 'shoe_L', 'shoe_R',
] as const;
export type PartName = (typeof PART_NAMES)[number];
/** Swapped in for the snow biome: a snowboard with bindings, and a beanie and goggles. */
export const SNOW_PART_NAMES = ['snowboard', 'head_snow'] as const;
export type SnowPartName = (typeof SNOW_PART_NAMES)[number];
/** Swapped in on the farm: a mountain board with big tyres and bindings, and a helmet. */
export const MTB_PART_NAMES = ['mountainboard', 'head_helmet'] as const;
export type MtbPartName = (typeof MTB_PART_NAMES)[number];
/** Worn on the scooter: a skate helmet. */
export const SCOOTER_HEAD_NAMES = ['head_skatehelmet'] as const;
export type BoardKind = 'skate' | 'snow' | 'mountain';

const THIGH = 0.44;
const SHIN = 0.44;
const UPPER_ARM = 0.29;
const FOREARM = 0.3;
const DECK_TOP = 0.115;
/** Top of the snowboard's binding baseplates. */
const SNOW_TOP = 0.05;
/** Top of the mountain board's deck, up over its big tyres. */
const MTB_TOP = 0.2;
/** Where the feet sit along the board, front and back. */
const FRONT_X = 0.24, BACK_X = -0.21;
const ANKLE = 0.075;
/** Ankle joint height above the bottom of the sole. */
const SOLE = 0.09;
const STAND_HIP = DECK_TOP + ANKLE + (THIGH + SHIN) * 0.97;
/** Pushing: strides a second, starting partway through the swing forward to the first plant. */
export const PUSH_RATE = 0.9, PUSH_START = 0.8;
/** Where the push foot plants (beside the front foot) and where the drive back ends. */
const PLANT_X = 0.26, DRIVE_X = -0.6;
/** Share of each stride with the foot on the ground. */
const PLANT_SHARE = 0.5;

const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const DOWN = v3(0, -1, 0);
const smooth = (a: number, b: number, t: number) => {
  const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
/** Board flips and shove-its start and finish a little gentler than they spin mid-air. */
const flipEase = (p: number) => 0.5 * p + 0.5 * p * p * (3 - 2 * p);

// Ollie: how far the pop tips the board nose up, pivoting on the back wheels
// (on a snowboard, on the tail where it leaves the snow).
const OLLIE_PITCH = 0.62, PRESS_PITCH = 0.36;
const OLLIE_PIVOT = 0.25, PRESS_PIVOT = 0.35;
/** Time to the top of a flat-ground ollie, which the ollie's timing is scaled against. */
const OLLIE_PEAK = 0.4;
/** Stretches the whole ollie animation: higher is slower. */
const OLLIE_SLOW = 1.3;

// Where each grab takes hold of the deck (deck space: +x nose, +z toe edge),
// which hand does it, how the board tilts (nose up is +), which way the elbow
// bows, and how far the knees splay apart to leave room for the arm.
const GRABS: Record<BoardGrab, { hand: 'L' | 'R'; at: THREE.Vector3; tilt: number; elbow: THREE.Vector3; splay: number }> = {
  Indy: { hand: 'R', at: v3(0.0, 0.1, 0.11), tilt: 0.1, elbow: v3(-0.3, 0, 1), splay: 0.9 },
  Melon: { hand: 'L', at: v3(0.32, 0.1, -0.1), tilt: -0.05, elbow: v3(1, 0, -0.6), splay: 0.4 },
  Nosegrab: { hand: 'L', at: v3(0.4, 0.13, 0.04), tilt: 0.45, elbow: v3(1, 0.3, -0.4), splay: 0 },
  Tailgrab: { hand: 'R', at: v3(-0.4, 0.13, 0.04), tilt: -0.45, elbow: v3(-1, 0.3, -0.4), splay: 0 },
};

function placeholderParts(): Record<PartName, THREE.Object3D> {
  const skin = 0xf0c09a, shirt = 0x2f8fd8, pants = 0x2f3b4d, shoe = 0xf4f4f4, cap = 0xe8402a;
  const cap3 = (r: number, len: number, color: number) => {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len - r * 2), 4, 10), toon(color));
    m.position.y = -len / 2;
    const g = new THREE.Group();
    g.add(m);
    return g;
  };
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 12), toon(skin));
  skull.position.y = 0.16;
  const hat = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(cap));
  hat.position.y = 0.19;
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.14), toon(cap));
  brim.position.set(0, 0.19, 0.14);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 8), toon(skin));
  neck.position.y = 0.03;
  head.add(skull, hat, brim, neck);

  const torso = new THREE.Group();
  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.26, 4, 12), toon(shirt));
  chest.scale.set(1.15, 1, 0.75);
  chest.position.y = 0.27;
  torso.add(chest);

  const pelvis = new THREE.Group();
  const hips = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.06, 4, 10), toon(pants));
  hips.rotation.z = Math.PI / 2;
  hips.scale.set(1, 1, 0.85);
  pelvis.add(hips);

  const shoeG = () => {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.28), toon(shoe));
    m.position.set(0, -0.04, 0.03);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.025, 0.29), toon(0x333333));
    sole.position.set(0, -0.075, 0.03);
    g.add(m, sole);
    return g;
  };

  const deck = new THREE.Group();
  const deckMat = toon(0x222222), wood = toon(0xd88c3a), metal = toon(0xb8bec6), wheel = toon(0xf5e6a8);
  const mid = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.21), deckMat);
  mid.position.y = 0.1;
  deck.add(mid);
  for (const s of [-1, 1]) {
    const kick = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.21), deckMat);
    kick.position.set(s * 0.38, 0.12, 0);
    kick.rotation.z = s * 0.35;
    deck.add(kick);
    const under = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.006, 0.2), wood);
    under.position.y = 0.088;
    deck.add(under);
    const truck = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, 0.18), metal);
    truck.position.set(s * 0.25, 0.065, 0);
    deck.add(truck);
    for (const z of [-0.1, 0.1]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.035, 12), wheel);
      w.rotation.x = Math.PI / 2;
      w.position.set(s * 0.25, 0.03, z);
      deck.add(w);
    }
  }

  return {
    deck, pelvis, torso, head,
    upperArm_L: cap3(0.05, UPPER_ARM, shirt), upperArm_R: cap3(0.05, UPPER_ARM, shirt),
    forearm_L: cap3(0.042, FOREARM, skin), forearm_R: cap3(0.042, FOREARM, skin),
    thigh_L: cap3(0.075, THIGH, pants), thigh_R: cap3(0.075, THIGH, pants),
    shin_L: cap3(0.06, SHIN, pants), shin_R: cap3(0.06, SHIN, pants),
    shoe_L: shoeG(), shoe_R: shoeG(),
  };
}

function placeholderSnowParts(): Record<SnowPartName, THREE.Object3D> {
  const board = new THREE.Group();
  const top = toon(0x2a7fd4), base = toon(0xf4f4f4), strap = toon(0x222222);
  const mid = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.24), top);
  mid.position.y = 0.012;
  board.add(mid);
  for (const s of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 16, 1, false, 0, Math.PI), base);
    tip.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    tip.position.set(s * 0.45, 0.03, 0);
    tip.rotation.z = s * 0.3;
    board.add(tip);
  }
  for (const x of [FRONT_X, BACK_X]) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.025, 0.3), strap);
    plate.position.set(x, 0.035, 0.02);
    const high = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.12, 0.02), strap);
    high.position.set(x, 0.09, -0.12);
    board.add(plate, high);
  }
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 12), toon(0xf0c09a));
  skull.position.y = 0.16;
  const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.135, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.9), toon(0xe8402a));
  beanie.position.y = 0.17;
  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.06), toon(0xffb020));
  goggles.position.set(0, 0.22, 0.1);
  head.add(skull, beanie, goggles);
  return { snowboard: board, head_snow: head };
}

function placeholderMtbParts(): Record<MtbPartName, THREE.Object3D> {
  const board = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.03, 0.25), toon(0x3a8a3a));
  deck.position.y = MTB_TOP - 0.015;
  board.add(deck);
  for (const x of [-0.33, 0.33]) for (const z of [-0.17, 0.17]) {
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.07, 16), toon(0x2a2828));
    tyre.rotation.x = Math.PI / 2;
    tyre.position.set(x, 0.085, z);
    board.add(tyre);
  }
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 12), toon(0xf0c09a));
  skull.position.y = 0.16;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.9), toon(0xf2a020));
  helmet.position.y = 0.18;
  head.add(skull, helmet);
  return { mountainboard: board, head_helmet: head };
}

export class Skater {
  readonly root = new THREE.Group();
  private body = new THREE.Group();
  private boardPivot = new THREE.Group();
  /** Tips the whole board about its tail for the ollie pop. */
  private boardTilt = new THREE.Group();
  private p: Record<PartName, THREE.Object3D>;
  private shadow: THREE.Mesh;

  private crouch = 0.15;
  private flipLift = 0;
  private shiftyS = 0;
  private lift = 0;
  private armRaise = 0.5;
  private pumpAnim = 0;
  private pushT = 0;
  private pushW = 0;
  /** A stride under way: once planted, the foot always drives right back. */
  private pushOn = false;
  private bailT = 0;
  private bailBoard = new THREE.Vector3();
  /** 0..1 blend into the grab pose, and the last grab for easing out. */
  private grabW = 0;
  private manualPitch = 0;
  private slideW = 0;
  private lastGrab: BoardGrab = 'Indy';
  private snowParts: Record<SnowPartName, THREE.Object3D>;
  private mtbParts: Record<MtbPartName, THREE.Object3D>;
  private board: BoardKind = 'skate';
  private get snow() { return this.board === 'snow'; }
  /** Feet strapped to the board: no pushing, and they stay put when popping. */
  private get bound() { return this.board !== 'skate'; }
  /** Ollie in progress: time since the pop (-1 for none), the height popped from, and the timing scale. */
  private pops = 0;
  private olT = -1;
  private olPopY = 0;
  private olPopX = 0;
  private olPopSlope = 0;
  private olS = 1;
  /** Left over from the last ollie's pose when it ended or a new one began, fading out. */
  private olRest: Record<string, number> = {};
  private olActive = false;
  private ol = { pitch: 0, pin: 0, slide: 0, load: 0, ext: 0, hold: 0, arms: 0 };
  /** Knees bending to soak up a landing. */
  private wasAir = false;
  private airBefore = 0;
  private landT = -1;
  private landW = 0;
  private space = spaceKit();

  constructor(parts?: Partial<Record<PartName | SnowPartName | MtbPartName, THREE.Object3D>>) {
    const ph = placeholderParts();
    this.p = { ...ph, ...(parts ?? {}) } as Record<PartName, THREE.Object3D>;
    const p = this.p;
    this.snowParts = { ...placeholderSnowParts(), ...(parts ?? {}) } as Record<SnowPartName, THREE.Object3D>;
    this.mtbParts = { ...placeholderMtbParts(), ...(parts ?? {}) } as Record<MtbPartName, THREE.Object3D>;

    this.root.add(this.body);
    this.body.add(this.boardTilt);
    this.boardTilt.add(this.boardPivot);
    this.boardPivot.position.y = 0.08;
    p.deck.position.y = -0.08;
    this.boardPivot.add(p.deck);

    this.body.add(p.pelvis);
    p.pelvis.add(p.torso);
    p.torso.add(p.head);
    p.head.position.y = 0.5;
    p.torso.add(p.upperArm_L, p.upperArm_R);
    p.upperArm_L.position.set(0.21, 0.44, 0);
    p.upperArm_R.position.set(-0.21, 0.44, 0);
    p.upperArm_L.add(p.forearm_L);
    p.upperArm_R.add(p.forearm_R);
    p.forearm_L.position.y = -UPPER_ARM;
    p.forearm_R.position.y = -UPPER_ARM;
    for (const n of ['thigh_L', 'thigh_R', 'shin_L', 'shin_R', 'shoe_L', 'shoe_R'] as const) this.body.add(p[n]);
    const sp = this.snowParts;
    sp.snowboard.position.y = -0.08;
    this.boardPivot.add(sp.snowboard);
    p.torso.add(sp.head_snow);
    sp.head_snow.position.y = 0.5;
    const mp = this.mtbParts;
    mp.mountainboard.position.y = -0.08;
    this.boardPivot.add(mp.mountainboard);
    p.torso.add(mp.head_helmet);
    mp.head_helmet.position.y = 0.5;
    p.torso.add(this.space);
    this.setBoard('skate');

    const sh = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }),
    );
    sh.rotation.x = -Math.PI / 2;
    sh.scale.set(1.3, 0.5, 1);
    sh.material.userData.outlineParameters = { visible: false };
    this.shadow = sh;
  }

  get shadowMesh() { return this.shadow; }

  /** The space helmet, on the moon. */
  setSpace(on: boolean) { this.space.visible = on; }

  /** Snowboard and beanie on the snow, mountain board and helmet on the farm, skateboard and cap everywhere else. */
  setBoard(kind: BoardKind) {
    this.board = kind;
    this.p.deck.visible = kind === 'skate';
    this.p.head.visible = kind === 'skate';
    this.snowParts.snowboard.visible = kind === 'snow';
    this.snowParts.head_snow.visible = kind === 'snow';
    this.mtbParts.mountainboard.visible = kind === 'mountain';
    this.mtbParts.head_helmet.visible = kind === 'mountain';
  }

  /** World positions of the points that should never go below the ground: knees, heels and toes. */
  legPoints(): THREE.Vector3[] {
    const p = this.p;
    this.root.updateMatrixWorld(true);
    const pts: THREE.Vector3[] = [];
    for (const side of ['L', 'R'] as const) {
      pts.push(p[`shin_${side}`].getWorldPosition(new THREE.Vector3()));
      const shoe = p[`shoe_${side}`];
      pts.push(shoe.localToWorld(v3(0, -0.085, 0.17)), shoe.localToWorld(v3(0, -0.085, -0.11)));
    }
    return pts;
  }

  /** Everything update() moves, for recording replays. */
  get joints(): THREE.Object3D[] {
    return [this.root, this.body, this.boardTilt, this.boardPivot, ...Object.values(this.p), ...Object.values(this.snowParts), ...Object.values(this.mtbParts), this.shadow];
  }

  pumpKick() { this.pumpAnim = 1; }

  update(dt: number, r: Rider, groundY: (x: number) => number, groundSlope: (x: number) => number) {
    const p = this.p;
    const k = 1 - Math.exp(-dt * 14);

    // Pose targets.
    let crouchT = 0.18;
    let liftT = 0;
    let armT = 0.45;
    if (r.pumpTimer > 0) crouchT = 0.55;
    this.pumpAnim = Math.max(0, this.pumpAnim - dt * 3);
    // Pushing: one long stride at a time. Up to speed, he finishes the stride and steps
    // back onto the board as the foot swings past it, unless he leaves the ground or
    // starts doing something else first.
    const canPush = r.grounded && !r.bailing && !this.bound && !r.manual && !r.grind && r.pumpTimer <= 0;
    if (canPush && (r.pushing || this.pushOn)) {
      // Picking up again while the last stride is still easing out carries on from where it was.
      if (!this.pushOn && this.pushW < 0.01) this.pushT = PUSH_START;
      this.pushOn = true;
      this.pushT += dt * PUSH_RATE;
      if (this.pushT >= 1) this.pushT -= 1;
      if (!r.pushing && this.pushT > PLANT_SHARE + 0.4 * (1 - PLANT_SHARE)) this.pushOn = false;
    } else this.pushOn = false;
    // Sinking low on the front leg as the back one drives out behind.
    const drive = this.pushDrive();
    if (this.pushOn) crouchT = 0.5 + 0.22 * drive;
    if (!r.grounded) {
      const peak = Math.min(1, r.airTime * 4);
      liftT = r.current ? 0.32 : 0.16 * peak;
      crouchT = r.current ? 0.45 : 0.35;
      armT = 0.9;
    }
    // Grinding: knees soft, arms out for balance; lower and wider on a boardslide.
    const style = r.grind?.style;
    if (r.grind) { crouchT = style === 'Boardslide' ? 0.45 : 0.32; liftT = 0; armT = 0.75; }
    this.slideW += ((style === 'Boardslide' ? 1 : 0) - this.slideW) * (1 - Math.exp(-dt * 16));
    // Round a loop: low and tucked, board on the track.
    if (r.loop) { crouchT = 0.5; liftT = 0; armT = 0.4; }
    if (r.flipping) { crouchT = 0.8; liftT = 0.4; armT = 0.2; }
    if (r.manual) crouchT = 0.3;
    const ollie = this.ollieUpdate(dt, r, groundY);
    // A plain ollie: knees tuck up at the top, then the legs reach down for the landing.
    if (ollie && !r.current && !r.flipping) {
      const tk = ollie.tuck * (1 - ollie.reach);
      crouchT = 0.3 + 0.45 * tk;
      liftT = 0.12 + 0.33 * tk;
    }
    // Arms drop back as he crouches, then swing up with the pop.
    if (ollie && !r.flipping) armT = 0.1 + (armT - 0.1) * this.ol.arms;
    // Tuck knee: knees pulled right up, board with them.
    const tuck = r.current?.axis === 'tuck' ? Math.sin(r.trickProgress * Math.PI) : 0;
    crouchT += (0.85 - crouchT) * tuck;
    liftT += (0.45 - liftT) * tuck;
    if (r.grab && r.grab in GRABS) this.lastGrab = r.grab as BoardGrab;
    this.grabW += ((r.grab ? 1 : 0) - this.grabW) * (1 - Math.exp(-dt * 18));
    const gw = this.grabW;
    const grab = GRABS[this.lastGrab];
    // Grabbing: knees up, board pulled in to the hand.
    crouchT += (0.85 - crouchT) * gw;
    liftT += (0.5 - liftT) * gw;
    // Eased, and never faster than the legs can follow from one frame to the next.
    const cap = (d: number, rate: number) => Math.max(-rate * dt, Math.min(rate * dt, d));
    // Slower still while the legs are near straight springing off the tail, where a
    // little bend swings the knees a long way.
    const stiff = this.olT >= 0 && this.olT < 0.3 * this.olS * OLLIE_SLOW ? 0.5 : 1;
    this.crouch += cap((crouchT - this.crouch) * k, 5 * stiff);
    this.lift += cap((liftT - this.lift) * k, 3 * stiff);
    this.armRaise += (armT - this.armRaise) * k;
    const absorb = this.landUpdate(dt, r);
    // Knees dip as the tail snaps down, the legs straighten springing off it,
    // and they bend again to soak up the landing.
    const crouch = this.crouch + 0.55 * this.ol.load - 0.05 * this.ol.ext + 0.5 * absorb;

    // Spins turn the whole rider about the vertical; flips and manuals pitch it,
    // flips about the middle of the body, manuals about the wheels left on the ground.
    const noseUp = r.manual === 'Manual' || r.manual === 'Tail Press', noseDown = r.manual === 'Nose Manual' || r.manual === 'Nose Press';
    // A 5-0 rides the back truck with the nose up, a nosegrind the front truck: the same pitch as manuals.
    const tailDown = noseUp || style === '5-0', noseLow = noseDown || style === 'Nosegrind';
    this.manualPitch += ((tailDown ? 0.3 : noseLow ? -0.3 : 0) - this.manualPitch) * k;
    const flip = r.flipAngle;
    const pitch = flip + this.manualPitch;
    // A board pivots on its wheels, a snowboard on its tail or nose.
    const end = this.snow ? 0.42 : this.board === 'mountain' ? 0.33 : 0.25;
    const pivot = r.flipping ? v3(0, 0.75, 0) : v3(this.manualPitch > 0 ? -end : end, 0.03, 0);
    const spin = r.spin ? r.spin.dir * r.spinProgress * (r.spin.deg === 360 ? Math.PI * 2 : Math.PI) : 0;
    const yaw = r.bodyYaw + spin;
    // Keep the pivot where it would be unpitched.
    const ca = Math.cos(r.angle), sa = Math.sin(r.angle), cb = Math.cos(r.angle + pitch), sb = Math.sin(r.angle + pitch);
    const ox = (ca * pivot.x - sa * pivot.y) - (cb * pivot.x - sb * pivot.y);
    const oy = (sa * pivot.x + ca * pivot.y) - (sb * pivot.x + cb * pivot.y);
    // Next to the face of a ledge (bouncing off it, or dropping into a gap): draw the
    // rider back from it so his front half doesn't go into the wall.
    let wallX = 0;
    for (const side of [1, -1]) {
      if (groundY(r.x) - r.y > 0.4) continue;
      let d = 0;
      while (d < 0.6 && groundY(r.x - side * d + side * 0.6) - r.y > 0.4) d += 0.02;
      wallX -= side * d;
    }
    // Winding up the pop, he's drawn still on the ground a moment after the physics has
    // left it, then springs up to catch it: the jump reads as his doing, not a float.
    // He's held on the line he popped from (the slope of a kicker, or a rail).
    // Popped partway up a kicker, the face curves up above that line: follow it instead.
    const popLine = Math.max(this.olPopY + (r.x - this.olPopX) * this.olPopSlope, groundY(r.x));
    const hold = r.bailing ? 0 : Math.min(0, popLine - r.y) * this.ol.hold;
    this.root.position.set(r.x + ox + wallX, r.y + oy + hold, r.z);
    this.root.rotation.set(0, yaw, r.angle + pitch, 'ZYX');

    // Board tricks.
    const prog = r.trickProgress;
    const trick = r.current;
    this.boardPivot.position.y = 0.08 + this.lift;
    this.boardPivot.rotation.set(0, r.boardYaw, 0);
    // Popping out of an ollie, the board only starts to flip once it's off the ground.
    const popped = 1 - this.ol.hold;
    if (trick && trick.axis === 'flip') this.boardPivot.rotation.x = trick.dir * flipEase(prog) * popped * Math.PI * 2;
    if (trick && trick.axis === 'spin') this.boardPivot.rotation.y = r.boardYaw + flipEase(prog) * popped * Math.PI;
    // Shifty: twist the board across and back, feet still strapped to it.
    // A boardslide turns the board across the rail, the deck resting on it.
    // Smoothed like flipLift, so a shifty that lands at 80% round doesn't snap the feet back.
    this.shiftyS += ((trick && trick.axis === 'shifty' ? trick.dir * Math.sin(prog * Math.PI) * 1.1 : 0) - this.shiftyS) * k;
    const shifty = this.shiftyS + this.slideW * Math.PI / 2;
    this.boardPivot.rotation.y += shifty;
    const slideDrop = this.slideW * (this.snow ? 0.02 : 0.09);
    this.boardPivot.position.y -= slideDrop;
    this.boardPivot.rotation.z = grab.tilt * gw;

    // Ollie pop: the board tips up about its tail end (the nose end, riding fakie),
    // that end held down on the ground for a moment as the rider springs up, then
    // levels out as it rises to his feet.
    const back = Math.cos(r.bodyYaw) >= 0 ? 1 : -1;
    const w = r.bailing ? 0 : 1;
    const tiltX = -back * (this.snow ? PRESS_PIVOT : this.board === 'mountain' ? 0.33 : OLLIE_PIVOT) * Math.min(1, w * 4);
    const tiltY = this.boardPivot.position.y - 0.08;
    const popGround = (popLine - r.y - hold) * Math.cos(r.angle);
    const pin = Math.max(-0.05, Math.min(0, popGround - tiltY)) * this.ol.pin * w;
    // Flipping or shoving it, the board is kicked out of the pop sooner: less tip.
    const flick = trick && (trick.axis === 'flip' || trick.axis === 'spin') ? 0.6 : 1;
    const olPitch = back * (this.snow ? PRESS_PITCH : OLLIE_PITCH) * this.ol.pitch * w * flick;
    this.boardTilt.position.set(tiltX, tiltY + pin, 0);
    this.boardTilt.rotation.set(0, 0, olPitch);
    const onBoard = (f: THREE.Vector3) => {
      const dx = f.x - tiltX, dy = f.y - tiltY, c = Math.cos(olPitch), sn = Math.sin(olPitch);
      f.x = tiltX + dx * c - dy * sn;
      f.y = tiltY + pin + dx * sn + dy * c;
    };

    // Body.
    const deckTop = this.snow ? SNOW_TOP : this.board === 'mountain' ? MTB_TOP : DECK_TOP;
    const hipY = STAND_HIP - (DECK_TOP - deckTop) - crouch * 0.42 + this.lift * 0.4;
    p.pelvis.position.set(0.02, hipY, 0);
    // Look where you're going: riding fakie after a 180, the shoulders open up
    // and the head turns the other way. cos(yaw) is +1 regular, -1 fakie.
    const facing = Math.cos(yaw);
    const twist = 0.3 * (facing - 1) / 2;
    p.torso.rotation.set(0.18 + crouch * 0.55 + gw * 0.25 + 0.12 * this.pushW, twist, 0);
    p.head.rotation.set(-0.15 - crouch * 0.4, 1.0 * facing - twist, 0);

    // Feet lift off the board to let it flip or spin under them. Smoothed, so a flip that
    // lands (or locks onto a rail) at 80% round doesn't snap the feet down.
    this.flipLift += ((trick && (trick.axis === 'flip' || trick.axis === 'spin') ? Math.sin(prog * Math.PI) * 0.22 : 0) - this.flipLift) * k;
    const flipLift = this.flipLift;
    const footY = deckTop + ANKLE + this.lift + flipLift - slideDrop;
    // Feet ride the board as it tilts for a nose or tail grab, or twists for a shifty.
    const tilt = grab.tilt * gw;
    // Popping, the back foot stands on the tail and the front foot in the middle of the
    // board, then slides up the grip to level it. Snowboard bindings keep the feet put.
    const slide = this.bound ? 0 : this.ol.slide * w;
    const frontX = FRONT_X + slide * (back > 0 ? -0.16 : 0.05);
    const backX = BACK_X + slide * (back > 0 ? -0.07 : 0.16);
    const front = v3(frontX * Math.cos(shifty), footY + Math.sin(tilt) * frontX, 0.02 - frontX * Math.sin(shifty));
    const backFoot = v3(backX * Math.cos(shifty), footY + Math.sin(tilt) * backX, 0.02 - backX * Math.sin(shifty));
    onBoard(front);
    onBoard(backFoot);

    // Ease in and out of pushing so the foot never snaps between the ground and the board.
    // No pushing on a snowboard or mountain board: both feet are strapped in.
    // Capped too: starting to push the moment you land, after a big crouch, mustn't fling the foot down.
    const pushTo = (this.pushOn ? 1 : 0) - this.pushW;
    this.pushW += Math.max(-dt * 6, Math.min(dt * 6, pushTo * (1 - Math.exp(-dt * 12))));
    // The hips sit back over the board as the push leg reaches out behind.
    const hipBack = 0.1 * this.pushW * drive;
    if (this.pushW > 0.01) {
      const t = this.pushT;
      // Slow at each end, fastest in the middle.
      const ease = (s: number) => s - Math.sin(s * Math.PI * 2) / (Math.PI * 2);
      const foot = v3();
      if (t < PLANT_SHARE) {
        // Planted beside the front foot, driving all the way back.
        foot.set(PLANT_X + (DRIVE_X - PLANT_X) * ease(t / PLANT_SHARE), ANKLE - 0.03, 0.26);
      } else {
        // Knee up, swinging forward to plant again.
        const s = (t - PLANT_SHARE) / (1 - PLANT_SHARE);
        foot.set(DRIVE_X + (PLANT_X - DRIVE_X) * ease(s), ANKLE - 0.03 + Math.sin(s * Math.PI) * 0.2, 0.26 - 0.08 * Math.sin(s * Math.PI));
      }
      backFoot.lerp(foot, this.pushW);
      // The push foot follows the real ground, which curves away from the board's line
      // on rollers and dips: never plant it below the surface.
      backFoot.y = Math.max(backFoot.y, this.groundLocalY(backFoot.x, backFoot.z, groundY) + SOLE);
    }

    p.pelvis.position.x -= hipBack;
    const hipL = v3(0.14 - hipBack, hipY, 0);
    const hipR = v3(-0.06 - hipBack, hipY, 0);
    // Knees point forward, splaying apart for a grab between the legs.
    const splay = grab.splay * gw;
    this.leg(p.thigh_L, p.shin_L, p.shoe_L, hipL, front, v3(splay, 0, 1));
    this.leg(p.thigh_R, p.shin_R, p.shoe_R, hipR, backFoot, v3(-splay, 0, 1));

    // Arms out for balance, higher in the air, swinging when pushing.
    const swing = Math.sin(this.pushT * Math.PI * 2) * 0.75 * this.pushW;
    p.upperArm_L.rotation.set(0.25 + swing, 0, 0.35 + this.armRaise * 0.9);
    p.upperArm_R.rotation.set(0.25 - swing, 0, -(0.35 + this.armRaise * 0.9));
    p.forearm_L.rotation.set(0.6, 0, -0.3 - this.armRaise * 0.3);
    p.forearm_R.rotation.set(0.6, 0, 0.3 + this.armRaise * 0.3);
    if (gw > 0.01) this.grabArm(grab, gw);

    // Bail: tumble off, board flies ahead, then snap back.
    if (r.bailing) {
      if (this.bailT === 0) this.bailBoard.set(0, 0, 0);
      this.bailT += dt;
      const t = this.bailT;
      this.body.rotation.z = -Math.min(1, t * 2.5) * 1.35;
      this.body.position.set(-Math.min(1, t * 2.5) * 0.6, 0.2 * Math.sin(Math.min(1, t * 2.5) * Math.PI), 0);
      this.boardPivot.rotation.z = t * 9;
      this.boardPivot.position.x = t * 1.8;
      this.boardPivot.position.y = 0.08 + Math.max(0, Math.sin(t * 4) * 0.8);
      const blink = t > 0.9 && Math.floor(t * 14) % 2 === 0;
      this.body.visible = !blink;
      this.boardTilt.position.set(0, 0, 0);
      this.boardTilt.rotation.set(0, 0, 0);
    } else {
      this.bailT = 0;
      this.body.rotation.z = 0;
      this.body.position.set(0, 0, 0);
      this.boardPivot.position.x = 0;
      this.body.visible = true;
      this.boardPivot.position.x -= tiltX;
      this.boardPivot.position.y -= tiltY;
    }

    // Last resort for any pose (a bail on a slope, a crouch in a dip): lift the body so
    // no knee, heel or toe goes into the ground. Deeper than a body length is a wall, not a dip.
    let sink = 0, wall = false;
    for (const pt of this.legPoints()) {
      sink = Math.max(sink, groundY(pt.x) - pt.y);
      if (Math.abs(groundSlope(pt.x)) > 1.5) wall = true;
    }
    if (sink > 0 && !wall) this.body.position.y += Math.min(sink, 0.6);

    // Blob shadow on the ground below.
    const gy = groundY(r.x);
    const height = Math.max(0, r.y - gy);
    this.shadow.position.set(r.x, gy + 0.02, r.z);
    this.shadow.rotation.set(-Math.PI / 2, 0, 0);
    this.shadow.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), Math.atan(groundSlope(r.x)));
    const s = Math.max(0.3, 1 - height * 0.12);
    this.shadow.scale.set(1.3 * s, 0.5 * s, 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.25 * s;
  }

  /**
   * Follow an ollie from the pop to the landing. Its timing scales with how hard the pop
   * launched the rider, so a quick low hop goes through it faster. Returns how far the knees
   * have tucked and how far the legs reach down for the landing, or null with no ollie.
   */
  private ollieUpdate(dt: number, r: Rider, groundY: (x: number) => number) {
    let restart = false;
    if (r.pops !== this.pops) {
      this.pops = r.pops;
      if (!r.grounded) {
        restart = true;
        this.olT = 0;
        this.olPopY = r.popY;
        this.olPopX = r.x - r.vx * dt;
        this.olPopSlope = Math.tan(r.angle);
        this.olS = Math.max(0.8, Math.min(1, r.vy / r.g / OLLIE_PEAK));
      }
    }
    const active = !(this.olT < 0 || r.grounded || r.grind || r.loop || r.bailing || r.falling);
    const ol = this.ol as Record<string, number>;
    const prev = { ...ol };
    let tuck = 0;
    if (active) {
      this.olT += dt;
      const t = this.olT, s = this.olS;
      // Crouch on the ground, snap the tail as the legs push, level the board, tuck.
      // Each move takes several frames at 60 fps, so nothing snaps.
      const at = (a: number, b: number) => smooth(a * s * OLLIE_SLOW, b * s * OLLIE_SLOW, t);
      ol.hold = 1 - at(0.06, 0.24);
      ol.load = at(0, 0.07) * (1 - at(0.08, 0.17));
      const snap = at(0.05, 0.14);
      const level = at(0.17, 0.36);
      ol.pitch = snap * (1 - level);
      ol.pin = at(0.05, 0.11) * (1 - at(0.15, 0.26));
      ol.slide = at(0.08, 0.24) * (1 - level);
      ol.ext = at(0.08, 0.17) * (1 - level);
      ol.arms = 1 - at(0, 0.07) * (1 - at(0.09, 0.2));
      tuck = at(0.2, 0.42);
    } else {
      this.olT = -1;
      for (const k in ol) ol[k] = k === 'arms' ? 1 : 0;
    }
    // Starting or ending an ollie (landing mid-pop, or popping again straight after a
    // landing), the pose it was in fades out from where it was rather than snapping.
    const changed = restart || active !== this.olActive;
    this.olActive = active;
    const ease = Math.exp(-dt * 18);
    for (const k in ol) {
      const rest = changed ? prev[k] - ol[k] : (this.olRest[k] ?? 0) * ease;
      this.olRest[k] = rest;
      ol[k] += rest;
    }
    if (!active) return null;
    // Coming down: straighten out in the last moments before touching down.
    let reach = 0;
    if (r.vy < 0) {
      // Hopping onto a rail, it's the rail you come down on.
      const rail = r.track.railAt(r.x);
      const railTop = rail ? railY(rail, r.x) : -Infinity;
      const below = r.y > railTop ? Math.max(groundY(r.x), railTop) : groundY(r.x);
      const toLand = (r.y - below) / Math.max(1, -r.vy);
      reach = 1 - smooth(0.15, 0.35, toLand);
    }
    return { tuck, reach };
  }


  /** Knee bend after touching down, harder after a bigger air. */
  private landUpdate(dt: number, r: Rider) {
    const air = !r.grounded && !r.grind && !r.loop;
    if (air) this.airBefore = r.airTime;
    if (this.wasAir && !air && !r.bailing) {
      this.landT = 0;
      this.landW = Math.max(0.35, Math.min(1, (this.airBefore - 0.1) / 0.5));
    }
    this.wasAir = air;
    if (this.landT < 0 || r.bailing) { this.landT = -1; return 0; }
    const t = this.landT;
    this.landT += dt;
    if (this.landT > 1) this.landT = -1;
    return this.landW * Math.sin(Math.min(1, t / 0.1) * Math.PI / 2) * Math.exp(-Math.max(0, t - 0.1) * 4.5);
  }

  /** Reach the grabbing hand to the deck with two-bone IK, blended by w. */
  private grabArm(g: (typeof GRABS)[BoardGrab], w: number) {
    const p = this.p;
    const upper = g.hand === 'L' ? p.upperArm_L : p.upperArm_R;
    const fore = g.hand === 'L' ? p.forearm_L : p.forearm_R;
    this.body.updateMatrixWorld(true);
    // Target and pole in the torso's space, where the shoulder lives.
    const hand = p.torso.worldToLocal(this.p.deck.localToWorld(g.at.clone()));
    const s = upper.position.clone();
    const d = hand.sub(s);
    let len = d.length();
    const max = UPPER_ARM + FOREARM - 0.002;
    if (len > max) { d.multiplyScalar(max / len); len = max; }
    const u = d.clone().normalize();
    const cosA = (UPPER_ARM * UPPER_ARM + len * len - FOREARM * FOREARM) / (2 * UPPER_ARM * len);
    const a = Math.acos(Math.max(-1, Math.min(1, cosA)));
    const pole = g.elbow.clone();
    const perp = pole.sub(u.clone().multiplyScalar(pole.dot(u))).normalize();
    const elbow = u.clone().multiplyScalar(Math.cos(a) * UPPER_ARM).add(perp.multiplyScalar(Math.sin(a) * UPPER_ARM));
    const qU = new THREE.Quaternion().setFromUnitVectors(DOWN, elbow.clone().normalize());
    const foreDir = d.clone().sub(elbow).normalize().applyQuaternion(qU.clone().invert());
    const qF = new THREE.Quaternion().setFromUnitVectors(DOWN, foreDir);
    upper.quaternion.slerp(qU, w);
    fore.quaternion.slerp(qF, w);
  }

  /** Height of the ground in the rider's own frame, below a point in that frame. */
  private groundLocalY(x: number, z: number, groundY: (x: number) => number) {
    this.root.updateMatrixWorld(true);
    const w = this.root.localToWorld(v3(x, 0, z));
    return this.root.worldToLocal(w.set(w.x, groundY(w.x), w.z)).y;
  }

  /** How far through the drive back the push foot is, 0 at the plant to 1 fully out behind. */
  private pushDrive() {
    const t = this.pushT;
    return t < PLANT_SHARE ? t / PLANT_SHARE : 1 - (t - PLANT_SHARE) / (1 - PLANT_SHARE);
  }

  private leg(thigh: THREE.Object3D, shin: THREE.Object3D, shoe: THREE.Object3D, hip: THREE.Vector3, foot: THREE.Vector3, pole: THREE.Vector3) {
    const d = foot.clone().sub(hip);
    let len = d.length();
    const max = THIGH + SHIN - 0.002;
    if (len > max) { d.multiplyScalar(max / len); len = max; }
    const u = d.clone().normalize();
    const cosA = (THIGH * THIGH + len * len - SHIN * SHIN) / (2 * THIGH * len);
    const a = Math.acos(Math.max(-1, Math.min(1, cosA)));
    const perp = pole.sub(u.clone().multiplyScalar(pole.dot(u))).normalize();
    const knee = hip.clone().add(u.clone().multiplyScalar(Math.cos(a) * THIGH)).add(perp.multiplyScalar(Math.sin(a) * THIGH));
    const end = hip.clone().add(d);

    thigh.position.copy(hip);
    thigh.quaternion.setFromUnitVectors(DOWN, knee.clone().sub(hip).normalize());
    shin.position.copy(knee);
    shin.quaternion.setFromUnitVectors(DOWN, end.clone().sub(knee).normalize());
    shoe.position.copy(end);
    shoe.quaternion.identity();
  }
}
