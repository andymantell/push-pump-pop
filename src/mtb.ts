import * as THREE from 'three';
import { Rider, BikeHold } from './rider';
import { toon } from './toon';
import { spaceKit } from './spacesuit';
import { railY } from './track';
import { PartName, PART_NAMES } from './skater';
import { Look, Wardrobe, bodyPieces, headPieces, dress, markModels, paint } from './look';

// The downhill bike and its rider: the same kid as the skater, in a full-face helmet and
// goggles, stood up on the pedals in the attack position, hands on the grips. Posed like the
// scooter rider, with two-bone IK from the hips to the pedals and the shoulders to the grips.
//
// The bike is a full-suspension downhill bike in parts that move like the real thing:
// - the swingarm turns about the main pivot, driving the rear shock, which shortens between
//   its eyes as its coil spring squashes;
// - the fork's lowers (and the front wheel) slide up its stanchions along the steering axis;
// - both wheels follow the ground under them, so on bumpy ground the wheels move and the frame
//   floats, and landings and pumps squash both ends;
// - the bars turn about the steering axis, the cranks go round when pedalling, the wheels roll.
//
// Bike space: x forward, y up, z towards the camera (the drive side), origin on the ground under
// the bottom bracket. The numbers match art/build_assets.py, where the parts are modelled.

export const BIKE_PART_NAMES = [
  'mtb_frame', 'mtb_swingarm', 'mtb_fork_upper', 'mtb_fork_lower', 'mtb_wheel_f', 'mtb_wheel_r', 'mtb_studs',
  'mtb_cranks', 'mtb_pedal', 'mtb_shock_body', 'mtb_shock_shaft', 'mtb_spring', 'head_fullface',
] as const;
export type BikePartName = (typeof BIKE_PART_NAMES)[number];

const THIGH = 0.44;
const SHIN = 0.44;
const UPPER_ARM = 0.29;
const FOREARM = 0.3;
const ANKLE = 0.075;

// Modern downhill geometry (long, low and slack): 29in wheels, the bottom bracket below the axles.
export const WHEEL_R = 0.37;
const AXLE_R = new THREE.Vector2(-0.455, WHEEL_R);
const AXLE_F = new THREE.Vector2(0.845, WHEEL_R);
const BB = new THREE.Vector2(0, 0.35);
const PIVOT = new THREE.Vector2(0.04, 0.45);
const SHOCK_F = new THREE.Vector2(0.17, 0.58);
const SHOCK_S = new THREE.Vector2(-0.13, 0.64);
const HEAD = THREE.MathUtils.degToRad(63);
/** Up the fork legs, from the front axle (the steering axis is parallel, just behind them). */
const AXIS = new THREE.Vector2(-Math.cos(HEAD), Math.sin(HEAD));
const CRANK = 0.165;
/** How hits from the ground bounce the rider about: push per m/s of wheel strike, spring, damping. */
const JOLT_UP = 4, JOLT_TIP = 20, JOLT_ROLL = 6, JOLT_K = 180, JOLT_D = 11;
/** Pedals stand out from the cranks, and the feet sit on top of them. */
const PEDAL_Z = 0.13, PEDAL_TOP = 0.012;
const GRIP = new THREE.Vector3(0.49, 1.07, 0.37);
const RING = 0.075, COG = 0.048, CHAIN_Z = 0.06;
/** Shock: where the spring perches are, from each eye. */
const PERCH_BODY = 0.05, PERCH_SHAFT = 0.03;
/** The midpoint between the axles is over the rider's point on the track. */
const MID_X = (AXLE_R.x + AXLE_F.x) / 2;

/** Suspension travel at each axle from the sag position: how far the wheel can come up, and drop. */
const TRAVEL = 0.15, DROOP = 0.05;
/** How fast a wheel drops back down to the ground (rebound), m/s. */
const REBOUND = 3;
/** Feet and hips: standing on the pedals, knees and elbows bent. */
const HIP = new THREE.Vector2(-0.11, 1.02);
const HIP_Z = 0.08;

const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const DOWN = v3(0, -1, 0);
const smooth = (a: number, b: number, t: number) => {
  const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
/** Up and back down over a trick's progress: 0 at the ends, 1 in the middle. */
const bump = (p: number, a = 0.2, b = 0.8) => smooth(0, a, p) * (1 - smooth(b, 1, p));

/**
 * Body tricks held from the left-hand swipes: where each foot goes (bike space, null to stay on
 * its pedal), how far the hips move and the body tips forward, and whether the hands let go.
 */
const HOLDS: Record<BikeHold, { front: THREE.Vector3 | null; back: THREE.Vector3 | null; hip: THREE.Vector3; lean: number; hands: number }> = {
  // Legs stretched out behind over the back wheel, body flat along the bike.
  Superman: { front: v3(-0.95, 1.08, -0.08), back: v3(-1.0, 1.15, 0.08), hip: v3(-0.3, 0.12, 0), lean: 1.15, hands: 0 },
  // Both feet off the pedals, legs out to the sides.
  'No Footer': { front: v3(0.12, 0.62, -0.45), back: v3(-0.1, 0.64, 0.45), hip: v3(0, 0.12, 0), lean: 0.6, hands: 0 },
  // The front foot kicked over the top tube to the near side.
  'Can Can': { front: v3(0.22, 0.75, 0.42), back: null, hip: v3(0, 0.08, 0), lean: 0.55, hands: 0 },
  // Hands off the bars, arms thrown out wide, knees gripping the bike.
  'No Hander': { front: null, back: null, hip: v3(0.03, 0.1, 0), lean: 0.35, hands: 1 },
};

function placeholderBike(): Record<Exclude<BikePartName, 'head_fullface'>, THREE.Object3D> {
  const frameM = toon(0x18b6b0), black = toon(0x26262a), gold = toon(0xe8b642), orange = toon(0xff7018), tyre = toon(0x302e2e);
  const g = () => new THREE.Group();
  const bar = (m: THREE.Material, a: THREE.Vector2, b: THREE.Vector2, r: number, z = 0) => {
    const d = b.clone().sub(a);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), m);
    mesh.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, z);
    mesh.rotation.z = Math.atan2(d.y, d.x) - Math.PI / 2;
    return mesh;
  };
  const along = (s: number) => AXLE_F.clone().addScaledVector(AXIS, s);
  const frame = g();
  frame.add(bar(frameM, along(0.62), new THREE.Vector2(0.05, 0.39), 0.04), bar(frameM, along(0.69), new THREE.Vector2(-0.1, 0.74), 0.028),
    bar(frameM, along(0.6), along(0.715), 0.034), bar(frameM, BB, new THREE.Vector2(-0.12, 0.8), 0.026));
  const swing = g();
  for (const z of [-0.065, 0.065]) {
    swing.add(bar(frameM, PIVOT.clone().sub(PIVOT), AXLE_R.clone().sub(PIVOT), 0.02, z), bar(frameM, AXLE_R.clone().sub(PIVOT), SHOCK_S.clone().sub(PIVOT), 0.017, z));
  }
  const upper = g();
  for (const z of [-0.072, 0.072]) upper.add(bar(gold, AXIS.clone().multiplyScalar(0.36), AXIS.clone().multiplyScalar(0.775), 0.019, z));
  const grips = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, GRIP.z * 2 + 0.1, 8), black);
  grips.rotation.x = Math.PI / 2;
  grips.position.set(GRIP.x - AXLE_F.x, GRIP.y - AXLE_F.y, 0);
  upper.add(grips);
  const lower = g();
  for (const z of [-0.072, 0.072]) lower.add(bar(black, AXIS.clone().multiplyScalar(-0.03), AXIS.clone().multiplyScalar(0.395), 0.027, z));
  const wheel = () => {
    const w = g();
    const t = new THREE.Mesh(new THREE.TorusGeometry(WHEEL_R - 0.035, 0.032, 8, 24), tyre);
    w.add(t);
    return w;
  };
  const cranks = g();
  cranks.add(bar(black, new THREE.Vector2(0, 0), new THREE.Vector2(CRANK, 0), 0.014, 0.075));
  const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.016, 0.09), black);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.17, 10), black);
  body.rotation.z = -Math.PI / 2; body.position.x = 0.085;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.17, 8), toon(0xc4cad4));
  shaft.rotation.z = -Math.PI / 2; shaft.position.x = 0.085;
  const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.029, 1, 10, 1, true), orange);
  spring.rotation.z = -Math.PI / 2; spring.position.x = 0.5;
  const wrap = (o: THREE.Object3D) => { const w = g(); w.add(o); return w; };
  return {
    mtb_frame: frame, mtb_swingarm: swing, mtb_fork_upper: upper, mtb_fork_lower: lower,
    mtb_wheel_f: wheel(), mtb_wheel_r: wheel(), mtb_studs: g(), mtb_cranks: cranks, mtb_pedal: wrap(pedal),
    mtb_shock_body: wrap(body), mtb_shock_shaft: wrap(shaft), mtb_spring: wrap(spring),
  };
}

/** Front or back end of the bike: how far the wheel is pushed up from its sag position, and how fast. */
interface End { c: number; v: number }

export class MtbRig {
  readonly root = new THREE.Group();
  private body = new THREE.Group();
  private unit = new THREE.Group();
  /** The bike as a whole: thrown about under the rider for whips, tabletops and turndowns. */
  private bikeT = new THREE.Group();
  private bike = new THREE.Group();
  private swing = new THREE.Group();
  private wheelR = new THREE.Group();
  private steerOuter = new THREE.Group();
  private steerYaw = new THREE.Group();
  private steerInner = new THREE.Group();
  private slide = new THREE.Group();
  private wheelF = new THREE.Group();
  private cranks = new THREE.Group();
  private pedals: THREE.Object3D[] = [];
  private shockBody: THREE.Object3D;
  private shockShaft: THREE.Object3D;
  private spring: THREE.Object3D;
  private studs: THREE.Object3D[] = [];
  private chain: THREE.Mesh[] = [];
  private p: Record<PartName, THREE.Object3D>;
  private helmet: THREE.Object3D;
  private space = spaceKit();
  private shadow: THREE.Mesh;

  private front: End = { c: 0, v: 0 };
  private rear: End = { c: 0, v: 0 };
  /** Extra squash on both ends from a landing or a pump, easing off. */
  private load = 0;
  private loadV = 0;
  /** The frame rising and sinking on its springs. */
  private frameY = 0;
  private frameV = 0;
  private spinF = 0;
  private spinR = 0;
  private crank = 0;
  private crouch = 0.2;
  private lift = 0;
  private lean = 0.6;
  private holdW = 0;
  private lastHold: BikeHold = 'Superman';
  private manualPitch = 0;
  private steer = 0;
  private trickW = 0;
  private lastTrick = 'Whip';
  private pops = 0;
  private hopT = -1;
  private hopPitch = 0;
  private wasAir = false;
  private airBefore = 0;
  private landT = -1;
  private landW = 0;
  private absorb = 0;
  private bailT = 0;
  private pumpAnim = 0;
  private wobT = 0;
  private wob = 0;
  private weight = 0;
  /** The rider bounced about by hits from the ground: up and down, pitch, and roll (chatter). */
  private jolt = 0;
  private joltV = 0;
  private joltP = 0;
  private joltPV = 0;
  private chatter = 0;
  private chatterT = 0;

  constructor(parts: Partial<Record<string, THREE.Object3D>> = {}, shadow?: THREE.Mesh) {
    const ph = placeholderBody();
    const own = (o: THREE.Object3D) => { const c = o.clone(false); if (o.children[0]) c.add(o.children[0].clone()); return c; };
    this.p = Object.fromEntries(PART_NAMES.map((n) => [n, parts[n] ? own(parts[n]) : ph[n]])) as Record<PartName, THREE.Object3D>;
    const p = this.p;
    this.helmet = parts.head_fullface?.clone() ?? p.head;
    markModels([...Object.values(p), this.helmet]);
    const pb = placeholderBike();
    const part = (n: Exclude<BikePartName, 'head_fullface'>) => parts[n]?.clone() ?? pb[n].clone();

    this.root.add(this.body);
    this.body.add(this.unit);
    this.unit.add(this.bikeT);
    this.bikeT.add(this.bike);
    this.bike.position.x = -MID_X;
    this.bike.add(part('mtb_frame'));

    // Swingarm and back wheel, about the main pivot.
    this.swing.position.set(PIVOT.x, PIVOT.y, 0);
    this.swing.add(part('mtb_swingarm'));
    this.wheelR.position.set(AXLE_R.x - PIVOT.x, AXLE_R.y - PIVOT.y, 0);
    this.wheelR.add(part('mtb_wheel_r'));
    this.swing.add(this.wheelR);
    this.bike.add(this.swing);

    // Fork: turns about the steering axis (tipped back to the head angle), lowers slide up it.
    this.steerOuter.position.set(AXLE_F.x, AXLE_F.y, 0);
    this.steerOuter.rotation.z = Math.PI / 2 - HEAD;
    this.steerInner.rotation.z = -(Math.PI / 2 - HEAD);
    this.steerOuter.add(this.steerYaw);
    this.steerYaw.add(this.steerInner);
    this.steerInner.add(part('mtb_fork_upper'), this.slide);
    this.slide.add(part('mtb_fork_lower'), this.wheelF);
    this.wheelF.add(part('mtb_wheel_f'));
    this.bike.add(this.steerOuter);
    for (const w of [this.wheelF, this.wheelR]) {
      const s = part('mtb_studs');
      w.add(s);
      this.studs.push(s);
    }

    // Cranks and pedals at the bottom bracket.
    this.cranks.position.set(BB.x, BB.y, 0);
    this.cranks.add(part('mtb_cranks'));
    this.bike.add(this.cranks);
    for (let i = 0; i < 2; i++) {
      const pd = part('mtb_pedal');
      this.bike.add(pd);
      this.pedals.push(pd);
    }

    // Rear shock, eye to eye between the frame and the swingarm yoke.
    this.shockBody = part('mtb_shock_body');
    this.shockShaft = part('mtb_shock_shaft');
    this.spring = part('mtb_spring');
    this.bike.add(this.shockBody, this.shockShaft, this.spring);

    // Chain: top and bottom runs from the ring to the cog, restretched as the swingarm moves.
    const chainM = toon(0x4a4a50);
    for (let i = 0; i < 2; i++) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 1, 5), chainM);
      this.chain.push(c);
      this.bike.add(c);
    }

    this.unit.add(p.pelvis);
    p.pelvis.add(p.torso);
    p.pelvis.rotation.y = Math.PI / 2;
    p.torso.add(this.helmet);
    this.helmet.position.y = 0.5;
    p.head.visible = false;
    p.torso.add(this.space);
    p.torso.add(p.upperArm_L, p.upperArm_R);
    p.upperArm_L.position.set(0.21, 0.44, 0);
    p.upperArm_R.position.set(-0.21, 0.44, 0);
    p.upperArm_L.add(p.forearm_L);
    p.upperArm_R.add(p.forearm_R);
    p.forearm_L.position.y = -UPPER_ARM;
    p.forearm_R.position.y = -UPPER_ARM;
    for (const n of ['thigh_L', 'thigh_R', 'shin_L', 'shin_R', 'shoe_L', 'shoe_R'] as const) this.unit.add(p[n]);
    p.deck.visible = false;
    this.setSnow(false);

    const sh = shadow ?? new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }),
    );
    sh.rotation.x = -Math.PI / 2;
    (sh.material as THREE.Material).userData.outlineParameters = { visible: false };
    this.shadow = sh;
  }

  get shadowMesh() { return this.shadow; }

  /** The space helmet, on the moon. */
  setSpace(on: boolean) { this.space.visible = on; this.helmet.visible = !on; }

  /** Studded tyres for the snow. */
  setSnow(on: boolean) { for (const s of this.studs) s.visible = on; }

  /** Dress in a look from the customiser, in the full-face helmet, on a bike in their colour. */
  wear(look: Look, w: Wardrobe) {
    if (w.loaded) {
      for (const [n, names] of Object.entries(bodyPieces(look))) dress(this.p[n as PartName], names, w);
      dress(this.helmet, headPieces(look, 'fullface'), w, look);
    }
    paint(this.root);
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

  /** World positions of the bottoms of both tyres (for checking they stay on the ground). */
  tyrePoints(): THREE.Vector3[] {
    this.root.updateMatrixWorld(true);
    return [this.wheelR, this.wheelF].map((w) => w.localToWorld(v3(0, 0, 0)).sub(v3(0, WHEEL_R, 0)));
  }

  /** How far each end is compressed from sag, front and back (for tests and previews). */
  get compression() { return { front: this.front.c, rear: this.rear.c }; }

  /** Everything update() moves, for recording replays. */
  get joints(): THREE.Object3D[] {
    return [this.root, this.body, this.unit, this.bikeT, this.bike, this.swing, this.wheelR, this.steerOuter, this.steerYaw, this.steerInner,
      this.slide, this.wheelF, this.cranks, ...this.pedals, this.shockBody, this.shockShaft, this.spring, ...this.chain,
      ...Object.values(this.p), this.helmet, this.shadow];
  }

  pumpKick() { this.pumpAnim = 1; this.loadV += 0.35; }

  update(dt: number, r: Rider, groundY: (x: number) => number, groundSlope: (x: number) => number) {
    const p = this.p;
    const k = 1 - Math.exp(-dt * 14);
    const cap = (d: number, rate: number) => Math.max(-rate * dt, Math.min(rate * dt, d));
    const air = !r.grounded && !r.grind && !r.loop;
    // The surface under the wheels: the rail when on a skinny, rocks in a rock garden.
    const rough = (x: number) => r.track.rough?.(x) ?? 0;
    const rail = r.grind?.rail;
    const surface = (x: number) => rail ? railY(rail, Math.max(rail.x0, Math.min(rail.x1, x))) : groundY(x) + rough(x);

    // Pose targets.
    let crouchT = 0.2, liftT = 0, leanT = 0.6;
    if (r.pumpTimer > 0) { crouchT = 0.5; leanT = 0.7; }
    this.pumpAnim = Math.max(0, this.pumpAnim - dt * 3);
    if (air) { crouchT = 0.3; liftT = 0.1 * Math.min(1, r.airTime * 4); }
    if (r.grind) crouchT = 0.32;
    if (r.loop) { crouchT = 0.5; leanT = 0.7; }
    if (r.flipping) { crouchT = 0.6; liftT = 0.2; leanT = 0.75; }
    if (r.manual) crouchT = 0.25;

    const hop = this.hopUpdate(dt, r, groundY);
    if (hop && !r.current && !r.flipping) {
      const tk = hop.tuck * (1 - hop.reach);
      crouchT = 0.3 + 0.35 * tk;
      liftT = 0.08 + 0.22 * tk;
    }

    // Bike tricks: how far into the throw, eased in and out.
    const bt = r.current?.axis === 'bike' ? r.current : null;
    if (bt) this.lastTrick = bt.name;
    const tw = bt ? bump(r.trickProgress, 0.3, 0.75) : 0;
    this.trickW += cap((tw - this.trickW) * (1 - Math.exp(-dt * 40)), 4.5);
    if (bt) { crouchT = Math.max(crouchT, 0.45); liftT = Math.max(liftT, 0.15); }

    const hold = r.grab && r.grab in HOLDS ? r.grab as BikeHold : null;
    if (hold) this.lastHold = hold;
    this.holdW += cap(((hold ? 1 : 0) - this.holdW) * (1 - Math.exp(-dt * 14)), 2.2);
    const hw = this.holdW, H = HOLDS[this.lastHold];
    if (hw > 0.01) { crouchT += (0.4 - crouchT) * hw; liftT += (0.2 - liftT) * hw; }
    leanT += (H.lean - leanT) * hw;

    this.crouch += cap((crouchT - this.crouch) * k, 5);
    this.lift += cap((liftT - this.lift) * k, 3);
    this.lean += cap((leanT - this.lean) * k, 6);
    this.absorb = Math.max(this.landUpdate(dt, r), this.absorb - dt * 2.5);

    // Manuals pitch about the back axle, stoppies about the front one, flips about the middle.
    const noseUp = r.manual === 'Manual' || r.grind?.style === 'Skinny Manual';
    const noseDown = r.manual === 'Stoppie' || r.grind?.style === 'Skinny Stoppie';
    this.manualPitch += ((noseUp ? 0.34 : noseDown ? -0.3 : 0) - this.manualPitch) * k;
    const pitch = r.flipAngle + this.manualPitch + this.hopPitch;
    const pv = r.flipping ? v3(0, 0.75, 0) : this.manualPitch > 0.005 || this.hopPitch > 0.005 ? v3(AXLE_R.x - MID_X, 0, 0) : v3(AXLE_F.x - MID_X, 0, 0);
    const spin = r.spin ? r.spin.dir * r.spinProgress * (r.spin.deg === 360 ? Math.PI * 2 : Math.PI) : 0;
    const yaw = r.bodyYaw + spin;
    const ca = Math.cos(r.angle), sa = Math.sin(r.angle), cb = Math.cos(r.angle + pitch), sb = Math.sin(r.angle + pitch);
    const ox = (ca * pv.x - sa * pv.y) - (cb * pv.x - sb * pv.y);
    const oy = (sa * pv.x + ca * pv.y) - (sb * pv.x + cb * pv.y);
    this.root.position.set(r.x + ox, r.y + oy, r.z);
    this.root.rotation.set(0, yaw, r.angle + pitch, 'ZYX');

    // Bike tricks throw the bike about under the rider, about a point between hands and feet.
    const W = this.trickW;
    const T = this.lastTrick;
    const roll = T === 'Whip' ? 1.15 : T === 'Tabletop' ? -1.3 : 0.75;
    const tyaw = T === 'Whip' ? -0.75 : T === 'Tabletop' ? -0.2 : 0.35;
    const tpitch = T === 'Turndown' ? -0.25 : T === 'Tabletop' ? 0.12 : 0;
    const steerT = T === 'Turndown' ? 0.95 : T === 'Tabletop' ? -0.45 : 0.2;
    // Thrown about from the grips, which the hands keep hold of.
    const tc = v3(GRIP.x - MID_X, GRIP.y, 0);
    this.bikeT.position.copy(tc);
    this.bikeT.rotation.set(roll * W, tyaw * W, tpitch * W, 'YXZ');
    this.bikeT.position.add(v3(0, (T === 'Tabletop' ? 0.12 : 0.06) * W, 0));
    this.bike.position.set(-MID_X - tc.x, -tc.y + this.lift * 0.6 + this.frameY, -tc.z);

    // Bars: straight, turned for a trick, or wobbling when riding backwards.
    const wobSteer = this.wob * 0.35 * Math.sin(this.wobT * 1.3);
    this.steer += ((steerT * W + wobSteer) - this.steer) * (1 - Math.exp(-dt * 30));
    this.steerYaw.rotation.y = this.steer;

    // --- suspension: each wheel is pushed up to stay on the ground under it, and drops back
    // down at the rebound speed when the ground falls away (or in the air, to full droop).
    this.loadV += (-90 * this.load - 11 * this.loadV) * dt;
    this.load = Math.max(-0.02, this.load + this.loadV * dt);
    const squash = this.load + 0.08 * this.absorb + (r.pumpTimer > 0 ? 0.03 : 0);
    this.root.updateMatrixWorld(true);
    const axleWorld = (local: THREE.Vector2) => this.bike.localToWorld(v3(local.x, local.y, 0));
    const restR = axleWorld(AXLE_R), restF = axleWorld(AXLE_F);
    const upW = v3(0, 1, 0).transformDirection(this.bike.matrixWorld);
    const contact = (pos: THREE.Vector3, end: End, unloaded: boolean) => {
      // How far up (along the bike's up) the wheel must come for its tyre to touch the ground.
      const need = (surface(pos.x) + WHEEL_R - pos.y) / Math.max(0.3, upW.y);
      const onGround = !air && !r.falling && !unloaded;
      const floor = need;
      let c = end.c;
      if (c < floor) {
        // Pushed up by the ground: the wheel follows it straight away.
        end.v = Math.max(end.v, (floor - c) / Math.max(dt, 1e-3));
        c = floor;
      } else {
        // Free to drop: back down towards the ground, or full droop in the air.
        const to = onGround ? floor : -DROOP;
        end.v = -Math.min(REBOUND, (c - to) / Math.max(dt, 1e-3));
        c = Math.max(to, c + end.v * dt);
      }
      end.c = Math.max(-DROOP, c);
    };
    const frontUp = this.manualPitch > 0.05 || this.hopPitch > 0.05;
    const rearUp = this.manualPitch < -0.05;
    contact(restR, this.rear, rearUp);
    contact(restF, this.front, frontUp);
    // The frame sinks on its springs as they're loaded (landings, pumps), rides up a little
    // over big hits, and is pushed straight up if either end would bottom out.
    // (Not while bailing: the bike cartwheeling through the ground isn't a hit to soak up.)
    const over = r.bailing ? 0 : Math.min(0.1, Math.max(0, this.rear.c - TRAVEL, this.front.c - TRAVEL));
    const loaded = !air && !r.falling;
    const frameTo = loaded ? Math.max(0, (this.rear.c + this.front.c) / 2) * 0.2 - squash : 0;
    this.frameV += (70 * (frameTo - this.frameY) - 12 * this.frameV) * dt;
    this.frameY = Math.max(-0.3, Math.min(0.3, this.frameY + this.frameV * dt + over));
    if (over > 0) this.frameV = Math.max(this.frameV, 0);

    // Hits from the ground get through the springs to the rider: knocked up and back by the
    // front wheel, up and forward by the back one, and shaken about while it keeps coming.
    // (A wheel dropping off a rock lets the rider sink, so they bob about rather than float up.)
    const hitF = loaded ? Math.max(-4, Math.min(4, this.front.v)) : 0, hitR = loaded ? Math.max(-4, Math.min(4, this.rear.v)) : 0;
    this.joltV += ((hitF + hitR) * JOLT_UP - JOLT_K * this.jolt - JOLT_D * this.joltV) * dt;
    this.jolt = Math.max(-0.06, Math.min(0.06, this.jolt + this.joltV * dt));
    this.joltPV += ((hitF - hitR) * JOLT_TIP - JOLT_K * this.joltP - JOLT_D * this.joltPV) * dt;
    this.joltP = Math.max(-0.25, Math.min(0.25, this.joltP + this.joltPV * dt));
    // Side to side: each hit knocks the body one way or the other.
    const knock = (Math.abs(hitF) + Math.abs(hitR)) * (Math.sin(r.x * 7.3) > 0 ? 1 : -1);
    this.chatterT += (knock * JOLT_ROLL - JOLT_K * this.chatter - JOLT_D * this.chatterT) * dt;
    this.chatter = Math.max(-0.12, Math.min(0.12, this.chatter + this.chatterT * dt));

    // Swingarm: turned about the pivot so the back axle comes up by the rear compression.
    const arm = AXLE_R.clone().sub(PIVOT);
    this.rear.c = Math.min(TRAVEL, this.rear.c);
    this.front.c = Math.min(TRAVEL, this.front.c);
    const swingAng = Math.asin(Math.max(-0.9, Math.min(0.9, (arm.y + this.rear.c) / arm.length()))) - Math.asin(arm.y / arm.length());
    // (The arm points back, so raising the axle is a clockwise turn.)
    this.swing.rotation.z = -swingAng;
    // Fork: the lowers slide up the stanchions.
    const forkS = this.front.c / Math.sin(HEAD);
    this.slide.position.set(AXIS.x * forkS, AXIS.y * forkS, 0);

    // Rear shock: from the frame eye to the yoke eye, which has turned with the swingarm.
    const ca2 = Math.cos(-swingAng), sa2 = Math.sin(-swingAng);
    const yoke = SHOCK_S.clone().sub(PIVOT);
    const S = new THREE.Vector2(PIVOT.x + ca2 * yoke.x - sa2 * yoke.y, PIVOT.y + sa2 * yoke.x + ca2 * yoke.y);
    const dir = S.clone().sub(SHOCK_F);
    const len = dir.length();
    dir.normalize();
    const X = v3(1, 0, 0);
    this.shockBody.position.set(SHOCK_F.x, SHOCK_F.y, 0);
    this.shockBody.quaternion.setFromUnitVectors(X, v3(dir.x, dir.y, 0));
    this.shockShaft.position.set(S.x, S.y, 0);
    this.shockShaft.quaternion.setFromUnitVectors(X, v3(-dir.x, -dir.y, 0));
    this.spring.position.set(SHOCK_F.x + dir.x * PERCH_BODY, SHOCK_F.y + dir.y * PERCH_BODY, 0);
    this.spring.quaternion.copy(this.shockBody.quaternion);
    this.spring.scale.set(Math.max(0.05, len - PERCH_BODY - PERCH_SHAFT), 1, 1);

    // Wheels roll; the cranks turn when pedalling (or stay level, left foot forward, coasting).
    const speed = r.grounded || r.grind ? r.v : 0;
    this.spinF -= speed * dt / WHEEL_R;
    this.spinR -= speed * dt / WHEEL_R;
    this.wheelF.rotation.z = this.spinF;
    this.wheelR.rotation.z = this.spinR;
    if (r.pushing && !r.bailing) this.crank -= dt * 7;
    else {
      // Settle back to level, the drive side (near) pedal forward, so the near leg doesn't hide the shock.
      const level = Math.round(this.crank / (Math.PI * 2)) * Math.PI * 2;
      this.crank += (level - this.crank) * (1 - Math.exp(-dt * 8));
    }
    this.cranks.rotation.z = this.crank;
    const pedalAt = (side: 1 | -1) => {
      const a = this.crank + (side > 0 ? 0 : Math.PI);
      return v3(BB.x + Math.cos(a) * CRANK, BB.y + Math.sin(a) * CRANK, side * PEDAL_Z);
    };
    const nearPedal = pedalAt(1), farPedal = pedalAt(-1);
    this.pedals[0].position.copy(nearPedal);
    this.pedals[1].position.copy(farPedal);

    // Chain runs, from the top and bottom of the ring to the cog, wherever the axle has gone.
    const axle = new THREE.Vector2(PIVOT.x + ca2 * arm.x - sa2 * arm.y, PIVOT.y + sa2 * arm.x + ca2 * arm.y);
    const run = (m: THREE.Mesh, a: THREE.Vector2, b: THREE.Vector2) => {
      const d = b.clone().sub(a);
      m.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, CHAIN_Z);
      m.scale.set(1, d.length(), 1);
      m.rotation.set(0, 0, Math.atan2(d.y, d.x) - Math.PI / 2);
    };
    run(this.chain[0], new THREE.Vector2(BB.x, BB.y + RING), new THREE.Vector2(axle.x, axle.y + COG));
    run(this.chain[1], new THREE.Vector2(BB.x, BB.y - RING), new THREE.Vector2(axle.x, axle.y - COG));

    // --- rider: feet on the pedals, hands on the grips, hips over the bottom bracket.
    this.unit.updateMatrixWorld(true);
    const inUnit = (local: THREE.Vector3) => this.unit.worldToLocal(this.bike.localToWorld(local.clone()));
    const footOn = (pd: THREE.Vector3) => inUnit(v3(pd.x, pd.y + PEDAL_TOP + ANKLE, pd.z * 0.75));
    // Left foot on the far pedal (at the back), right foot on the near one.
    const footL = footOn(farPedal), footR = footOn(nearPedal);
    // Deep squats ease off, so a big landing never folds the legs flat (the knees would flick).
    const crouchIn = this.crouch + 0.45 * this.absorb + 0.6 * squash;
    const crouch = crouchIn > 0.6 ? 0.6 + (crouchIn - 0.6) * 0.4 : crouchIn;
    const hold3 = H.hip.clone().multiplyScalar(hw);
    const bikeY = this.frameY + this.lift * 0.6;
    let hipY = HIP.y - crouch * 0.38 + bikeY + hold3.y + 0.05 * this.trickW + this.jolt;
    // In a rock garden the rider's weight goes where the balance is.
    this.weight += (r.balance - this.weight) * (1 - Math.exp(-dt * 10));
    const hipX = HIP.x - MID_X + hold3.x - (this.lean - 0.6) * 0.06 + this.weight * 0.16;
    // Never squat so deep the legs fold flat (the knees would flick about): stand up off a
    // pedal that comes up too close under the hips.
    const MIN_LEG = 0.5;
    for (const f of [footL, footR]) {
      const dx = f.x - hipX, dy = hipY - f.y;
      if (Math.hypot(dx, dy) < MIN_LEG) hipY = f.y + Math.sqrt(Math.max(0, MIN_LEG * MIN_LEG - dx * dx));
    }
    p.pelvis.position.set(hipX, hipY, 0);
    const shake = this.chatter;
    p.torso.rotation.set(this.lean + crouch * 0.3 + this.weight * 0.25 - this.joltP, 0, shake);
    // The head stays steadier than the body under it, eyes on the trail.
    this.helmet.rotation.set(-this.lean * 0.85 - crouch * 0.25 + this.joltP * 0.6, 0, -shake * 0.5);
    const hipL = v3(hipX, hipY, -HIP_Z), hipR = v3(hipX, hipY, HIP_Z);
    const swing = (foot: THREE.Vector3, hip: THREE.Vector3, to: THREE.Vector3 | null) => {
      if (!to || hw < 0.001) return;
      const tgt = inUnit(to);
      const a = foot.clone().sub(hip), b = tgt.clone().sub(hip);
      const angA = Math.atan2(a.y, a.x), angB = Math.atan2(b.y, b.x);
      let dAng = angB - angA;
      if (dAng > Math.PI) dAng -= Math.PI * 2;
      if (dAng < -Math.PI) dAng += Math.PI * 2;
      const la = Math.hypot(a.x, a.y), lb = Math.hypot(b.x, b.y);
      const ang = angA + dAng * hw, l = la + (lb - la) * hw;
      foot.set(hip.x + Math.cos(ang) * l, hip.y + Math.sin(ang) * l, foot.z + (tgt.z - foot.z) * hw);
    };
    swing(footL, hipL, H.front);
    swing(footR, hipR, H.back);
    // Knees forward and out, round the top tube.
    const polL = v3(1, -0.3, -0.55), polR = v3(1, -0.3, 0.55);
    this.leg(p.thigh_L, p.shin_L, p.shoe_L, hipL, footL, polL, Math.PI / 2 - 0.08);
    this.leg(p.thigh_R, p.shin_R, p.shoe_R, hipR, footR, polR, Math.PI / 2 + 0.08);

    this.root.updateMatrixWorld(true);
    const freeT = H.hands * hw;
    for (const [side, s] of [['L', -1], ['R', 1]] as const) {
      const grip = this.steerInner.localToWorld(v3(GRIP.x - AXLE_F.x, GRIP.y - AXLE_F.y, s * GRIP.z));
      // No hander: arms thrown up and out.
      const free = this.unit.localToWorld(v3(hipX + 0.15, hipY + 0.85, s * 0.62));
      grip.lerp(free, freeT);
      const target = p.torso.worldToLocal(grip);
      const upper = side === 'L' ? p.upperArm_L : p.upperArm_R, fore = side === 'L' ? p.forearm_L : p.forearm_R;
      this.arm(upper, fore, target, v3(side === 'L' ? 1 : -1, -0.5, -0.4));
    }

    // Bail: over the bars, the bike cartwheeling on ahead.
    if (r.bailing) {
      this.bailT += dt;
      const t = this.bailT;
      const u = Math.min(1, t * 2.2);
      this.body.rotation.z = -u * 1.6;
      this.body.rotation.x = 0;
      this.wob = 0;
      this.body.position.set(u * 0.7, 0.35 * Math.sin(u * Math.PI), 0);
      this.bikeT.position.x += -t * 1.2 - u * 0.7;
      this.bikeT.position.y += Math.max(0, Math.sin(t * 3.5) * 0.5) - u * 0.35;
      this.bikeT.rotation.z += t * 3;
      this.body.visible = !(t > 0.9 && Math.floor(t * 14) % 2 === 0);
    } else {
      this.bailT = 0;
      this.body.rotation.z = 0;
      this.body.position.set(0, 0, 0);
      this.wob += Math.max(-dt * 2, Math.min(dt * 2, r.wobble - this.wob));
      const wob = this.wob;
      this.wobT += dt * (5 + 6 * wob);
      this.body.rotation.x = wob * 0.32 * Math.sin(this.wobT);
      this.body.visible = true;
    }

    // Last resort for any pose: lift the body so no knee, heel or toe goes into the ground.
    let sink = 0, wall = false;
    for (const pt of this.legPoints()) {
      sink = Math.max(sink, groundY(pt.x) - pt.y);
      if (Math.abs(groundSlope(pt.x)) > 1.5) wall = true;
    }
    if (sink > 0 && !wall) this.body.position.y += Math.min(sink, 0.6);

    const gy = groundY(r.x);
    const height = Math.max(0, r.y - gy);
    this.shadow.position.set(r.x, gy + 0.02, r.z);
    this.shadow.rotation.set(-Math.PI / 2, 0, 0);
    this.shadow.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), Math.atan(groundSlope(r.x)));
    const s = Math.max(0.3, 1 - height * 0.12);
    this.shadow.scale.set(1.9 * s, 0.55 * s, 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.25 * s;
  }

  /** Bunny hop: the front wheel comes up first, then the back, the bike tucked up under the rider. */
  private hopUpdate(dt: number, r: Rider, groundY: (x: number) => number) {
    if (r.pops !== this.pops) {
      this.pops = r.pops;
      if (!r.grounded) this.hopT = 0;
    }
    const active = !(this.hopT < 0 || r.grounded || r.grind || r.loop || r.bailing || r.falling);
    if (!active) {
      this.hopT = -1;
      this.hopPitch *= Math.exp(-dt * 16);
      return null;
    }
    this.hopT += dt;
    const t = this.hopT;
    this.hopPitch += ((0.32 * smooth(0, 0.08, t) * (1 - smooth(0.14, 0.36, t))) - this.hopPitch) * (1 - Math.exp(-dt * 30));
    let reach = 0;
    if (r.vy < 0) {
      const rail = r.track.railAt(r.x);
      const railTop = rail ? railY(rail, r.x) : -Infinity;
      const below = r.y > railTop ? Math.max(groundY(r.x), railTop) : groundY(r.x);
      reach = 1 - smooth(0.15, 0.35, (r.y - below) / Math.max(1, -r.vy));
    }
    return { tuck: smooth(0.15, 0.4, t), reach };
  }

  /** Squash after touching down: a knee bend for the rider and a hit on both shocks. */
  private landUpdate(dt: number, r: Rider) {
    const air = !r.grounded && !r.grind && !r.loop;
    if (air) this.airBefore = r.airTime;
    if (this.wasAir && !air && !r.bailing) {
      this.landT = 0;
      this.landW = Math.max(0.35, Math.min(1, (this.airBefore - 0.1) / 0.5));
      // The bigger the drop, the deeper the shocks go.
      this.loadV += 0.6 + 1.4 * this.landW;
    }
    this.wasAir = air;
    if (this.landT < 0 || r.bailing) { this.landT = -1; return 0; }
    const t = this.landT;
    this.landT += dt;
    if (this.landT > 1) this.landT = -1;
    return this.landW * Math.sin(Math.min(1, t / 0.15) * Math.PI / 2) * Math.exp(-Math.max(0, t - 0.15) * 4.5);
  }

  private leg(thigh: THREE.Object3D, shin: THREE.Object3D, shoe: THREE.Object3D, hip: THREE.Vector3, foot: THREE.Vector3, pole: THREE.Vector3, footYaw: number) {
    const d = foot.clone().sub(hip);
    let len = d.length();
    const max = THIGH + SHIN - 0.002;
    if (len > max) { d.multiplyScalar(max / len); len = max; }
    const u = d.clone().normalize();
    const cosA = (THIGH * THIGH + len * len - SHIN * SHIN) / (2 * THIGH * len);
    const a = Math.acos(Math.max(-1, Math.min(1, cosA)));
    const perp = pole.clone().sub(u.clone().multiplyScalar(pole.dot(u))).normalize();
    const knee = hip.clone().add(u.clone().multiplyScalar(Math.cos(a) * THIGH)).add(perp.multiplyScalar(Math.sin(a) * THIGH));
    const end = hip.clone().add(d);
    thigh.position.copy(hip);
    thigh.quaternion.setFromUnitVectors(DOWN, knee.clone().sub(hip).normalize());
    shin.position.copy(knee);
    shin.quaternion.setFromUnitVectors(DOWN, end.clone().sub(knee).normalize());
    shoe.position.copy(end);
    shoe.rotation.set(0, footYaw, 0);
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
  const shoe = () => {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.28), toon(0xf4f4f4));
    m.position.set(0, -0.04, 0.03);
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
    thigh_L: cap3(0.075, THIGH, 0x2f3b4d), thigh_R: cap3(0.075, THIGH, 0x2f3b4d),
    shin_L: cap3(0.06, SHIN, 0x2f3b4d), shin_R: cap3(0.06, SHIN, 0x2f3b4d),
    shoe_L: shoe(), shoe_R: shoe(),
  };
}
