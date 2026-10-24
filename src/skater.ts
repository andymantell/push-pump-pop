import * as THREE from 'three';
import { Rider, GrabName } from './rider';
import { toon } from './toon';

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

const THIGH = 0.44;
const SHIN = 0.44;
const UPPER_ARM = 0.29;
const FOREARM = 0.3;
const DECK_TOP = 0.115;
/** Top of the snowboard's binding baseplates. */
const SNOW_TOP = 0.05;
/** Where the feet sit along the board, front and back. */
const FRONT_X = 0.24, BACK_X = -0.21;
const ANKLE = 0.075;
/** Ankle joint height above the bottom of the sole. */
const SOLE = 0.09;
const STAND_HIP = DECK_TOP + ANKLE + (THIGH + SHIN) * 0.97;

const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const DOWN = v3(0, -1, 0);

// Where each grab takes hold of the deck (deck space: +x nose, +z toe edge),
// which hand does it, how the board tilts (nose up is +), which way the elbow
// bows, and how far the knees splay apart to leave room for the arm.
const GRABS: Record<GrabName, { hand: 'L' | 'R'; at: THREE.Vector3; tilt: number; elbow: THREE.Vector3; splay: number }> = {
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

export class Skater {
  readonly root = new THREE.Group();
  private body = new THREE.Group();
  private boardPivot = new THREE.Group();
  private p: Record<PartName, THREE.Object3D>;
  private shadow: THREE.Mesh;

  private crouch = 0.15;
  private lift = 0;
  private armRaise = 0.5;
  private pumpAnim = 0;
  private pushT = 0;
  private pushW = 0;
  private bailT = 0;
  private bailBoard = new THREE.Vector3();
  /** 0..1 blend into the grab pose, and the last grab for easing out. */
  private grabW = 0;
  private manualPitch = 0;
  private lastGrab: GrabName = 'Indy';
  private snowParts: Record<SnowPartName, THREE.Object3D>;
  private snow = false;

  constructor(parts?: Partial<Record<PartName | SnowPartName, THREE.Object3D>>) {
    const ph = placeholderParts();
    this.p = { ...ph, ...(parts ?? {}) } as Record<PartName, THREE.Object3D>;
    const p = this.p;
    this.snowParts = { ...placeholderSnowParts(), ...(parts ?? {}) } as Record<SnowPartName, THREE.Object3D>;

    this.root.add(this.body);
    this.body.add(this.boardPivot);
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
    this.setSnow(false);

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

  /** Snowboard and beanie on the snow, skateboard and cap everywhere else. */
  setSnow(on: boolean) {
    this.snow = on;
    this.p.deck.visible = !on;
    this.p.head.visible = !on;
    this.snowParts.snowboard.visible = on;
    this.snowParts.head_snow.visible = on;
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
    if (r.pushing) crouchT = 0.32;
    if (!r.grounded) {
      const peak = Math.min(1, r.airTime * 4);
      liftT = r.current ? 0.32 : 0.16 * peak;
      crouchT = r.current ? 0.45 : 0.35;
      armT = 0.9;
    }
    if (r.flipping) { crouchT = 0.8; liftT = 0.4; armT = 0.2; }
    if (r.manual) crouchT = 0.3;
    // Tuck knee: knees pulled right up, board with them.
    const tuck = r.current?.axis === 'tuck' ? Math.sin(r.trickProgress * Math.PI) : 0;
    crouchT += (0.85 - crouchT) * tuck;
    liftT += (0.45 - liftT) * tuck;
    if (r.grab) this.lastGrab = r.grab;
    this.grabW += ((r.grab ? 1 : 0) - this.grabW) * (1 - Math.exp(-dt * 18));
    const gw = this.grabW;
    const grab = GRABS[this.lastGrab];
    // Grabbing: knees up, board pulled in to the hand.
    crouchT += (0.85 - crouchT) * gw;
    liftT += (0.5 - liftT) * gw;
    this.crouch += (crouchT - this.crouch) * k;
    this.lift += (liftT - this.lift) * k;
    this.armRaise += (armT - this.armRaise) * k;

    // Spins turn the whole rider about the vertical; flips and manuals pitch it,
    // flips about the middle of the body, manuals about the wheels left on the ground.
    const noseUp = r.manual === 'Manual' || r.manual === 'Tail Press', noseDown = r.manual === 'Nose Manual' || r.manual === 'Nose Press';
    this.manualPitch += ((noseUp ? 0.3 : noseDown ? -0.3 : 0) - this.manualPitch) * k;
    const flip = r.flipAngle;
    const pitch = flip + this.manualPitch;
    // A skateboard pivots on its wheels, a snowboard on its tail or nose.
    const end = this.snow ? 0.42 : 0.25;
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
    this.root.position.set(r.x + ox + wallX, r.y + oy, 0);
    this.root.rotation.set(0, yaw, r.angle + pitch, 'ZYX');

    // Board tricks.
    const prog = r.trickProgress;
    const trick = r.current;
    this.boardPivot.position.y = 0.08 + this.lift;
    this.boardPivot.rotation.set(0, r.boardYaw, 0);
    if (trick && trick.axis === 'flip') this.boardPivot.rotation.x = trick.dir * prog * Math.PI * 2;
    if (trick && trick.axis === 'spin') this.boardPivot.rotation.y = r.boardYaw + prog * Math.PI;
    // Shifty: twist the board across and back, feet still strapped to it.
    const shifty = trick && trick.axis === 'shifty' ? trick.dir * Math.sin(prog * Math.PI) * 1.1 : 0;
    this.boardPivot.rotation.y += shifty;
    this.boardPivot.rotation.z = grab.tilt * gw;

    // Body.
    const deckTop = this.snow ? SNOW_TOP : DECK_TOP;
    const hipY = STAND_HIP - (DECK_TOP - deckTop) - this.crouch * 0.42 + this.lift * 0.4;
    p.pelvis.position.set(0.02, hipY, 0);
    // Look where you're going: riding fakie after a 180, the shoulders open up
    // and the head turns the other way. cos(yaw) is +1 regular, -1 fakie.
    const facing = Math.cos(yaw);
    const twist = 0.3 * (facing - 1) / 2;
    p.torso.rotation.set(0.18 + this.crouch * 0.55 + gw * 0.25, twist, 0);
    p.head.rotation.set(-0.15 - this.crouch * 0.4, 1.0 * facing - twist, 0);

    // Feet lift off the board to let it flip or spin under them.
    const flipLift = trick && (trick.axis === 'flip' || trick.axis === 'spin') ? Math.sin(prog * Math.PI) * 0.22 : 0;
    const footY = deckTop + ANKLE + this.lift + flipLift;
    // Feet ride the board as it tilts for a nose or tail grab, or twists for a shifty.
    const tilt = grab.tilt * gw;
    const front = v3(FRONT_X * Math.cos(shifty), footY + Math.sin(tilt) * FRONT_X, 0.02 - FRONT_X * Math.sin(shifty));
    const back = v3(BACK_X * Math.cos(shifty), footY + Math.sin(tilt) * BACK_X, 0.02 - BACK_X * Math.sin(shifty));

    // Ease in and out of pushing so the foot never snaps between the ground and the board.
    // No pushing on a snowboard: both feet are strapped in.
    this.pushW += ((r.pushing && r.grounded && !r.bailing && !this.snow ? 1 : 0) - this.pushW) * (1 - Math.exp(-dt * 12));
    if (this.pushW > 0.01) {
      this.pushT = (this.pushT + dt * 1.6) % 1;
      const t = this.pushT;
      const foot = v3();
      if (t < 0.55) {
        const s = t / 0.55;
        foot.set(0.1 - 0.6 * s, ANKLE - 0.03, 0.26);
      } else {
        const s = (t - 0.55) / 0.45;
        foot.set(-0.5 + 0.6 * s, ANKLE + Math.sin(s * Math.PI) * 0.15, 0.26 - 0.1 * Math.sin(s * Math.PI));
      }
      back.lerp(foot, this.pushW);
      // The push foot follows the real ground, which curves away from the board's line
      // on rollers and dips: never plant it below the surface.
      back.y = Math.max(back.y, this.groundLocalY(back.x, back.z, groundY) + SOLE);
    } else {
      this.pushT = 0;
    }

    const hipL = v3(0.14, hipY, 0);
    const hipR = v3(-0.06, hipY, 0);
    // Knees point forward, splaying apart for a grab between the legs.
    const splay = grab.splay * gw;
    this.leg(p.thigh_L, p.shin_L, p.shoe_L, hipL, front, v3(splay, 0, 1));
    this.leg(p.thigh_R, p.shin_R, p.shoe_R, hipR, back, v3(-splay, 0, 1));

    // Arms out for balance, higher in the air, swinging when pushing.
    const swing = r.pushing ? Math.sin(this.pushT * Math.PI * 2) * 0.5 : 0;
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
    } else {
      this.bailT = 0;
      this.body.rotation.z = 0;
      this.body.position.set(0, 0, 0);
      this.boardPivot.position.x = 0;
      this.body.visible = true;
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
    this.shadow.position.set(r.x, gy + 0.02, 0);
    this.shadow.rotation.set(-Math.PI / 2, 0, 0);
    this.shadow.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), Math.atan(groundSlope(r.x)));
    const s = Math.max(0.3, 1 - height * 0.12);
    this.shadow.scale.set(1.3 * s, 0.5 * s, 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.25 * s;
  }

  /** Reach the grabbing hand to the deck with two-bone IK, blended by w. */
  private grabArm(g: (typeof GRABS)[GrabName], w: number) {
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
