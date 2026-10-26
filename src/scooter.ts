import * as THREE from 'three';
import { Rider, ScooterHold } from './rider';
import { toon } from './toon';
import { spaceKit } from './spacesuit';
import { railY } from './track';
import { PartName, PART_NAMES } from './skater';

// The scooter rider: the same kid as the skater, in a helmet, standing on a scooter and
// facing the way he rides, one foot behind the other, hands on the grips. Posed like the
// skater, with two-bone IK: the feet stay on the deck and the hands on the grips while the
// body crouches, pumps and hops, and they let go for whips, barspins and body tricks.
//
// The scooter is two parts that turn about the steering axis, straight up through the front
// axle: the deck (with the back wheel) whips round it, the bars (with the fork and front
// wheel) spin round it. Both are modelled with their origin on the ground under the front axle.

export const SCOOTER_PART_NAMES = ['scooter_deck', 'scooter_bars', 'snowscoot_deck', 'snowscoot_bars'] as const;
export type ScooterPartName = (typeof SCOOTER_PART_NAMES)[number];
export type ScooterKind = 'scooter' | 'snow';

const THIGH = 0.44;
const SHIN = 0.44;
const UPPER_ARM = 0.29;
const FOREARM = 0.3;
const ANKLE = 0.075;
/** Front axle (and the steering axis) and back axle, along the scooter. */
export const AXLE_F = 0.31, AXLE_B = -0.29;
export const WHEEL_R = 0.06;
/** Top of the deck, and its underside (what slides on a rail). */
const DECK_TOP = 0.105, DECK_BASE = 0.075;
/** The snow scooter stands a little taller, on its skis. */
const SNOW_LIFT = 0.03;
/** Grips: height above the ground and how far out each side. */
export const GRIP_Y = 0.88, GRIP_Z = 0.22;
/** Feet on the deck: the front (left) foot ahead, the back foot angled out a little. */
const FRONT = { x: 0.07, z: -0.025, yaw: Math.PI / 2 - 0.12 };
const BACK = { x: -0.16, z: 0.03, yaw: Math.PI / 2 - 0.55 };
const HIP_Z = 0.08;
const STAND_HIP = DECK_TOP + ANKLE + (THIGH + SHIN) * 0.9;

const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const DOWN = v3(0, -1, 0);
const smooth = (a: number, b: number, t: number) => {
  const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
/** Up and back down over a trick's progress: 0 at the ends, 1 in the middle. */
const bump = (p: number, a = 0.15, b = 0.85) => smooth(0, a, p) * (1 - smooth(b, 1, p));

/**
 * Body tricks held from the left-hand swipes: where the feet go (scooter frame), how far the
 * hips move and the body tips forward, and how far the bars turn.
 */
const HOLDS: Record<ScooterHold, { front: THREE.Vector3 | null; back: THREE.Vector3 | null; hip: THREE.Vector3; lean: number; bars: number }> = {
  // Legs stretched out behind, the body flat over the deck.
  Superman: { front: v3(-0.92, 0.88, -0.07), back: v3(-0.98, 0.96, 0.07), hip: v3(-0.32, 0.02, 0), lean: 1.05, bars: 0 },
  // Both feet off, legs out to the sides.
  'No Footer': { front: v3(0.02, 0.4, -0.42), back: v3(-0.12, 0.42, 0.42), hip: v3(0, 0.1, 0), lean: 0.35, bars: 0 },
  // The back foot kicked over the deck to the far side.
  'Can Can': { front: null, back: v3(0.2, 0.52, -0.4), hip: v3(0, 0.06, 0), lean: 0.3, bars: 0 },
  // Bars turned round, arms crossed, feet on the deck.
  'X-Up': { front: null, back: null, hip: v3(0.02, 0, 0), lean: 0.45, bars: 2.6 },
};

/** Grinds: how the scooter turns on the rail (yaw, + turns the front away), front down, and the point of the deck on the rail. */
const GRINDS: Record<string, { yaw: number; pitch: number; at: number }> = {
  '50-50': { yaw: 0.12, pitch: 0, at: -0.02 },
  Boardslide: { yaw: Math.PI / 2 * 0.92, pitch: 0, at: -0.02 },
  Feeble: { yaw: 0.45, pitch: -0.1, at: -0.2 },
  Smith: { yaw: -0.45, pitch: -0.12, at: -0.2 },
};

function placeholderScooter(kind: ScooterKind): [THREE.Object3D, THREE.Object3D] {
  const deck = new THREE.Group(), bars = new THREE.Group();
  const metal = toon(0x3a7bd5), grip = toon(0x222222), wheel = toon(0xf2f2f2), ski = toon(0xe8402a);
  const lift = kind === 'snow' ? SNOW_LIFT : 0;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.03, 0.115), metal);
  plate.position.set(-0.02 - AXLE_F, (DECK_TOP + DECK_BASE) / 2 + lift, 0);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 10), metal);
  tube.position.set(0, 0.24 + lift, 0);
  deck.add(plate, tube);
  const rear = kind === 'snow'
    ? new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.14), ski)
    : new THREE.Mesh(new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.024, 16), wheel);
  if (kind === 'snow') rear.position.set(AXLE_B - AXLE_F, 0.01, 0);
  else { rear.rotation.x = Math.PI / 2; rear.position.set(AXLE_B - AXLE_F, WHEEL_R, 0); }
  deck.add(rear);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, GRIP_Y - 0.2, 8), metal);
  stem.position.set(0, (GRIP_Y + 0.2) / 2 + lift, 0);
  const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, GRIP_Z * 2 + 0.1, 8), grip);
  cross.rotation.x = Math.PI / 2;
  cross.position.set(0, GRIP_Y + lift, 0);
  const front = kind === 'snow'
    ? new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.02, 0.14), ski)
    : new THREE.Mesh(new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.024, 16), wheel);
  if (kind === 'snow') front.position.set(0.05, 0.01, 0);
  else { front.rotation.x = Math.PI / 2; front.position.set(0, WHEEL_R, 0); }
  bars.add(stem, cross, front);
  return [deck, bars];
}

export class ScooterRig {
  readonly root = new THREE.Group();
  private body = new THREE.Group();
  /** Rider and scooter together: turns and drops onto a rail for a grind. */
  private unit = new THREE.Group();
  private pivot = new THREE.Group();
  /** The scooter: lifts and tips under the rider for a bunny hop. */
  private scoot = new THREE.Group();
  private steer = new THREE.Group();
  private deckPivot = new THREE.Group();
  private barsPivot = new THREE.Group();
  private p: Record<PartName, THREE.Object3D>;
  private helmet: THREE.Object3D;
  private snowHead: THREE.Object3D;
  private space = spaceKit();
  private decks: Record<ScooterKind, THREE.Object3D>;
  private barsParts: Record<ScooterKind, THREE.Object3D>;
  private shadow: THREE.Mesh;
  private kind: ScooterKind = 'scooter';

  private crouch = 0.15;
  private lift = 0;
  private lean = 0.3;
  private holdW = 0;
  private lastHold: ScooterHold = 'Superman';
  private grindW = 0;
  private grindYaw = 0;
  private grindPitch = 0;
  private grindAt = 0;
  private manualPitch = 0;
  private feetUp = 0;
  private kick = 0;
  private release = 0;
  private barsAngle = 0;
  private deckAngle = 0;
  private pushT = 0;
  private pushW = 0;
  private pumpAnim = 0;
  private bailT = 0;
  /** Bunny hop: time since the pop (-1 for none). */
  private pops = 0;
  private hopT = -1;
  private hopPitch = 0;
  private wasAir = false;
  private airBefore = 0;
  private landT = -1;
  private landW = 0;
  private absorb = 0;
  private wobT = 0;
  private wob = 0;

  /** The shadow can be shared with the skater, as only one of them rides at a time. */
  constructor(parts: Partial<Record<string, THREE.Object3D>> = {}, shadow?: THREE.Mesh) {
    // The skater's own parts, copied so both riders can be in the scene. Only each part's own
    // model is copied: the skater may already have hung his other parts off it.
    const ph = placeholderBody();
    const own = (o: THREE.Object3D) => { const c = o.clone(false); if (o.children[0]) c.add(o.children[0].clone()); return c; };
    this.p = Object.fromEntries(PART_NAMES.map((n) => [n, parts[n] ? own(parts[n]) : ph[n]])) as Record<PartName, THREE.Object3D>;
    const p = this.p;
    this.helmet = parts.head_skatehelmet?.clone() ?? p.head;
    this.snowHead = parts.head_snow?.clone() ?? p.head;
    const [dk, bk] = placeholderScooter('scooter'), [ds, bs] = placeholderScooter('snow');
    this.decks = { scooter: parts.scooter_deck?.clone() ?? dk, snow: parts.snowscoot_deck?.clone() ?? ds };
    this.barsParts = { scooter: parts.scooter_bars?.clone() ?? bk, snow: parts.snowscoot_bars?.clone() ?? bs };

    this.root.add(this.body);
    this.body.add(this.pivot);
    this.pivot.add(this.unit);
    this.unit.add(this.scoot);
    this.scoot.add(this.steer);
    this.steer.position.x = AXLE_F;
    this.steer.add(this.deckPivot, this.barsPivot);
    for (const k of ['scooter', 'snow'] as const) {
      this.deckPivot.add(this.decks[k]);
      this.barsPivot.add(this.barsParts[k]);
    }
    this.unit.add(p.pelvis);
    p.pelvis.add(p.torso);
    p.pelvis.rotation.y = Math.PI / 2;
    for (const h of [this.helmet, this.snowHead]) { p.torso.add(h); h.position.y = 0.5; }
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
    // The skater's deck isn't used.
    p.deck.visible = false;
    this.setKind('scooter');

    const sh = shadow ?? new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }),
    );
    sh.rotation.x = -Math.PI / 2;
    sh.scale.set(1.3, 0.5, 1);
    (sh.material as THREE.Material).userData.outlineParameters = { visible: false };
    this.shadow = sh;
  }

  get shadowMesh() { return this.shadow; }

  /** The space helmet, on the moon. */
  setSpace(on: boolean) { this.space.visible = on; }

  /** A snow scooter, beanie and goggles on the snow; a scooter and helmet everywhere else. */
  setKind(kind: ScooterKind) {
    this.kind = kind;
    for (const k of ['scooter', 'snow'] as const) {
      this.decks[k].visible = k === kind;
      this.barsParts[k].visible = k === kind;
    }
    this.helmet.visible = kind === 'scooter';
    this.snowHead.visible = kind === 'snow';
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
    return [this.root, this.body, this.pivot, this.unit, this.scoot, this.steer, this.deckPivot, this.barsPivot,
      ...Object.values(this.p), this.helmet, this.snowHead, ...Object.values(this.decks), ...Object.values(this.barsParts), this.shadow];
  }

  pumpKick() { this.pumpAnim = 1; }

  update(dt: number, r: Rider, groundY: (x: number) => number, groundSlope: (x: number) => number) {
    const p = this.p;
    const k = 1 - Math.exp(-dt * 14);
    const cap = (d: number, rate: number) => Math.max(-rate * dt, Math.min(rate * dt, d));
    const lift0 = this.kind === 'snow' ? SNOW_LIFT : 0;

    // Pose targets, as for the skater.
    let crouchT = 0.2, liftT = 0, leanT = 0.3;
    if (r.pumpTimer > 0) { crouchT = 0.55; leanT = 0.45; }
    this.pumpAnim = Math.max(0, this.pumpAnim - dt * 3);
    if (r.pushing) crouchT = 0.32;
    const air = !r.grounded && !r.grind && !r.loop;
    if (air) {
      crouchT = 0.35;
      liftT = 0.14 * Math.min(1, r.airTime * 4);
    }
    if (r.grind) { crouchT = 0.35; liftT = 0; }
    if (r.loop) { crouchT = 0.5; liftT = 0; leanT = 0.5; }
    if (r.flipping) { crouchT = 0.7; liftT = 0.3; leanT = 0.5; }
    if (r.manual) crouchT = 0.3;

    const hop = this.hopUpdate(dt, r, groundY);
    if (hop && !r.current && !r.flipping) {
      // Knees tuck at the top of the hop, then reach down for the landing.
      const tk = hop.tuck * (1 - hop.reach);
      crouchT = 0.3 + 0.4 * tk;
      liftT = 0.1 + 0.3 * tk;
    }

    // Whips and barspins: the feet lift off for the deck to go round, the hands let go of the bars.
    const tr = r.current?.axis === 'whip' ? r.current : null;
    const whipTurns = tr?.whip ?? 0, barTurns = tr?.bars ?? 0;
    const wp = whipTurns ? r.whipT / Math.abs(whipTurns) : 0;
    const bp = barTurns ? r.barsT / barTurns : 0;
    const feetT = whipTurns ? bump(wp, 0.1 / Math.abs(whipTurns), 1 - 0.12 / Math.abs(whipTurns)) : 0;
    this.feetUp += cap((feetT - this.feetUp) * (1 - Math.exp(-dt * 30)), 6);
    // The back foot kicks the deck round to start a whip.
    this.kick += ((whipTurns ? Math.sin(Math.min(1, r.whipT * 4) * Math.PI) : 0) - this.kick) * (1 - Math.exp(-dt * 25));
    const relT = barTurns ? bump(bp, 0.12 / barTurns, 1 - 0.15 / barTurns) : 0;
    this.release += (relT - this.release) * (1 - Math.exp(-dt * 30));
    if (tr) { liftT = Math.max(liftT, 0.22); crouchT = Math.max(crouchT, 0.5); }
    // Turn the deck and the bars, easing out to straight when the trick's done.
    const deckTarget = whipTurns ? -Math.sign(whipTurns) * r.whipT * Math.PI * 2 : 0;
    this.deckAngle = whipTurns ? deckTarget : this.deckAngle * Math.exp(-dt * 30);
    const hold = r.grab && r.grab in HOLDS ? r.grab as ScooterHold : null;
    if (hold) this.lastHold = hold;
    // Capped, so the legs swing out and back over a few frames rather than snapping.
    this.holdW += cap(((hold ? 1 : 0) - this.holdW) * (1 - Math.exp(-dt * 14)), 3);
    const hw = this.holdW, H = HOLDS[this.lastHold];
    const barTarget = barTurns ? -r.barsT * Math.PI * 2 : H.bars * hw;
    this.barsAngle = barTurns ? barTarget : this.barsAngle + (H.bars * hw - this.barsAngle) * (1 - Math.exp(-dt * 25));
    this.deckPivot.rotation.y = this.deckAngle;
    this.barsPivot.rotation.y = this.barsAngle + this.wob * 0.3 * Math.sin(this.wobT * 1.3);
    if (hw > 0.01) { crouchT += (0.45 - crouchT) * hw; liftT += (0.3 - liftT) * hw; }
    leanT += (H.lean - leanT) * hw;

    // Eased, and never faster than the legs can follow from one frame to the next.
    this.crouch += cap((crouchT - this.crouch) * k, 5);
    this.lift += cap((liftT - this.lift) * k, 3);
    this.lean += cap((leanT - this.lean) * k, 6);
    // A second landing straight after the first (off the end of a rail) starts its own knee
    // bend from nothing, so the last one fades rather than snapping straight.
    this.absorb = Math.max(this.landUpdate(dt, r), this.absorb - dt * 2.5);
    const absorb = this.absorb;
    const crouch = this.crouch + 0.5 * absorb;

    // Grinds: rider and scooter turn together on the rail, the deck resting on it.
    const style = r.grind?.style;
    const g = style ? GRINDS[style] ?? GRINDS['50-50'] : null;
    this.grindW += cap(((g ? 1 : 0) - this.grindW) * (1 - Math.exp(-dt * 16)), 6);
    const yawTo = g ? g.yaw : 0, pitchTo = g ? g.pitch : 0;
    this.grindYaw += cap((yawTo - this.grindYaw) * (1 - Math.exp(-dt * 16)), 7);
    this.grindPitch += cap((pitchTo - this.grindPitch) * k, 3);
    // Moving the point the scooter turns about swings the whole rider, so it slides there too.
    if (g) this.grindAt += Math.abs(this.grindYaw) + Math.abs(this.grindPitch) < 0.02 ? g.at - this.grindAt : cap((g.at - this.grindAt) * (1 - Math.exp(-dt * 16)), 0.8);
    const gw = this.grindW;
    this.pivot.position.set(this.grindAt, (DECK_BASE + lift0) * (1 - gw), 0);
    this.pivot.rotation.set(0, this.grindYaw, this.grindPitch, 'YXZ');
    this.unit.position.set(-this.grindAt, -(DECK_BASE + lift0), 0);

    // Manuals pitch about the wheel left on the ground, flips about the middle of the body.
    const noseUp = r.manual === 'Manual' || r.manual === 'Tail Press', noseDown = r.manual === 'Nose Manual' || r.manual === 'Nose Press';
    this.manualPitch += ((noseUp ? 0.32 : noseDown ? -0.3 : 0) - this.manualPitch) * k;
    const pitch = r.flipAngle + this.manualPitch;
    const pv = r.flipping ? v3(0, 0.75, 0) : v3(this.manualPitch > 0 ? AXLE_B : AXLE_F, 0.02, 0);
    const spin = r.spin ? r.spin.dir * r.spinProgress * (r.spin.deg === 360 ? Math.PI * 2 : Math.PI) : 0;
    const yaw = r.bodyYaw + spin;
    const ca = Math.cos(r.angle), sa = Math.sin(r.angle), cb = Math.cos(r.angle + pitch), sb = Math.sin(r.angle + pitch);
    const ox = (ca * pv.x - sa * pv.y) - (cb * pv.x - sb * pv.y);
    const oy = (sa * pv.x + ca * pv.y) - (sb * pv.x + cb * pv.y);
    // Next to the face of a ledge, draw back from it so the front half doesn't go into the wall.
    let wallX = 0;
    for (const side of [1, -1]) {
      if (groundY(r.x) - r.y > 0.4) continue;
      let d = 0;
      while (d < 0.6 && groundY(r.x - side * d + side * 0.6) - r.y > 0.4) d += 0.02;
      wallX -= side * d;
    }
    this.root.position.set(r.x + ox + wallX, r.y + oy, r.z);
    this.root.rotation.set(0, yaw, r.angle + pitch, 'ZYX');

    // The scooter: pulled up under the feet in the air, tipped nose up as you hop.
    const scootY = this.lift + lift0;
    // The hop tips it about the back wheel.
    const hc = Math.cos(this.hopPitch), hs = Math.sin(this.hopPitch);
    this.scoot.position.set(AXLE_B - AXLE_B * hc, this.lift - AXLE_B * hs, 0);
    this.scoot.rotation.set(0, 0, this.hopPitch);
    this.scoot.updateMatrix();

    // Where the feet stand, in the scooter's frame, then in the rider's.
    const onDeck = (f: { x: number; z: number }, up: number) => v3(f.x, DECK_TOP + lift0 + ANKLE + up, f.z).applyMatrix4(this.scoot.matrix);
    const up = this.feetUp * (0.24 + 0.06 * this.kick);
    const front = onDeck(FRONT, up);
    const back = onDeck(BACK, up);
    // Kicking the deck round: the back foot sweeps back off the tail.
    back.x -= this.kick * 0.12;

    // Pushing: the back foot steps off beside the deck and kicks along the ground.
    const pushTo = (r.pushing && r.grounded && !r.bailing && !r.manual ? 1 : 0) - this.pushW;
    this.pushW += Math.max(-dt * 6, Math.min(dt * 6, pushTo * (1 - Math.exp(-dt * 12))));
    if (this.pushW > 0.01) {
      this.pushT = (this.pushT + dt * 1.6) % 1;
      const t = this.pushT;
      const foot = v3();
      if (t < 0.55) {
        const s = t / 0.55;
        foot.set(0.05 - 0.55 * s, ANKLE - 0.03, 0.16);
      } else {
        const s = (t - 0.55) / 0.45;
        foot.set(-0.5 + 0.55 * s, ANKLE + Math.sin(s * Math.PI) * 0.16, 0.16);
      }
      back.lerp(foot, this.pushW);
      back.y = Math.max(back.y, this.groundLocalY(back.x, back.z, groundY) + 0.09);
    } else this.pushT = 0;

    // Body: hips over the back of the deck, leaning in to the bars.
    const hold3 = H.hip.clone().multiplyScalar(hw);
    const hipY = STAND_HIP + lift0 - crouch * 0.42 + this.lift * 0.45 + hold3.y + this.feetUp * 0.06;
    const hipX = -0.04 + hold3.x - this.lean * 0.05;
    p.pelvis.position.set(hipX, hipY, 0);
    p.torso.rotation.set(this.lean + crouch * 0.35, 0, 0);
    for (const h of [this.helmet, this.snowHead]) h.rotation.set(-this.lean * 0.85 - crouch * 0.3, 0.12, 0);

    const hipL = v3(hipX, hipY, -HIP_Z), hipR = v3(hipX, hipY, HIP_Z);
    // Into a body trick the legs swing round from the hips (angle and reach eased apart),
    // so the knees follow an arc rather than cutting across.
    const swing = (foot: THREE.Vector3, hip: THREE.Vector3, to: THREE.Vector3 | null) => {
      if (!to || hw < 0.001) return;
      const a = foot.clone().sub(hip), b = to.clone().add(v3(0, scootY, 0)).sub(hip);
      const angA = Math.atan2(a.y, a.x), angB = Math.atan2(b.y, b.x);
      let dAng = angB - angA;
      if (dAng > Math.PI) dAng -= Math.PI * 2;
      if (dAng < -Math.PI) dAng += Math.PI * 2;
      const la = Math.hypot(a.x, a.y), lb = Math.hypot(b.x, b.y);
      const ang = angA + dAng * hw, len = la + (lb - la) * hw;
      foot.set(hip.x + Math.cos(ang) * len, hip.y + Math.sin(ang) * len, foot.z + (to.z - foot.z) * hw);
    };
    swing(front, hipL, H.front);
    swing(back, hipR, H.back);
    // Knees bend forward and down: forward standing on the deck, down with the legs out behind.
    const polL = v3(1, -0.8, -0.25), polR = v3(1, -0.8, 0.3);
    // Feet point along the deck, the back one turned out, swinging round to the push.
    this.leg(p.thigh_L, p.shin_L, p.shoe_L, hipL, front, polL, FRONT.yaw);
    this.leg(p.thigh_R, p.shin_R, p.shoe_R, hipR, back, polR, BACK.yaw + this.pushW * 0.45);

    // Hands on the grips, wherever the bars have turned to; off them for a barspin.
    this.root.updateMatrixWorld(true);
    for (const [side, s] of [['L', -1], ['R', 1]] as const) {
      const gripLocal = v3(0, GRIP_Y + lift0, s * GRIP_Z);
      const grip = this.barsPivot.localToWorld(gripLocal.clone());
      // Let go: hands thrown up and out from the bars.
      const free = this.steer.localToWorld(v3(-0.12, GRIP_Y + lift0 + 0.22, s * (GRIP_Z + 0.18)));
      grip.lerp(free, this.release);
      const target = p.torso.worldToLocal(grip);
      const upper = side === 'L' ? p.upperArm_L : p.upperArm_R, fore = side === 'L' ? p.forearm_L : p.forearm_R;
      // Elbows out to the side and a little back (torso space: +x is his left).
      this.arm(upper, fore, target, v3(side === 'L' ? 1 : -1, -0.4, -0.6));
    }

    // Bail: tumble off; the scooter clatters on ahead.
    if (r.bailing) {
      this.bailT += dt;
      const t = this.bailT;
      this.body.rotation.z = -Math.min(1, t * 2.5) * 1.35;
      this.body.rotation.x = 0;
      this.wob = 0;
      this.body.position.set(-Math.min(1, t * 2.5) * 0.6, 0.2 * Math.sin(Math.min(1, t * 2.5) * Math.PI), 0);
      this.scoot.position.x += t * 1.6;
      this.scoot.position.y += Math.max(0, Math.sin(t * 4) * 0.6);
      this.scoot.rotation.z += t * 7;
      this.body.visible = !(t > 0.9 && Math.floor(t * 14) % 2 === 0);
    } else {
      this.bailT = 0;
      this.body.rotation.z = 0;
      this.body.position.set(0, 0, 0);
      // Riding backwards too long: tipping from side to side, faster and wider as it goes on.
      // Eased, so spinning round to face forwards settles the wobble rather than snapping it straight.
      this.wob += Math.max(-dt * 2, Math.min(dt * 2, r.wobble - this.wob));
      const wob = this.wob;
      this.wobT += dt * (5 + 5 * wob);
      this.body.rotation.x = wob * 0.3 * Math.sin(this.wobT);
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
    this.shadow.scale.set(1.3 * s, 0.5 * s, 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.25 * s;
  }

  /** Bunny hop: tip the nose up off the back wheel as you jump, level out, tuck, reach for the landing. */
  private hopUpdate(dt: number, r: Rider, groundY: (x: number) => number) {
    if (r.pops !== this.pops) {
      this.pops = r.pops;
      if (!r.grounded) this.hopT = 0;
    }
    const active = !(this.hopT < 0 || r.grounded || r.grind || r.loop || r.bailing || r.falling);
    if (!active) {
      this.hopT = -1;
      this.hopPitch *= Math.exp(-dt * 18);
      return null;
    }
    this.hopT += dt;
    const t = this.hopT;
    this.hopPitch += ((0.3 * smooth(0, 0.07, t) * (1 - smooth(0.12, 0.32, t))) - this.hopPitch) * (1 - Math.exp(-dt * 30));
    let reach = 0;
    if (r.vy < 0) {
      const rail = r.track.railAt(r.x);
      const railTop = rail ? railY(rail, r.x) : -Infinity;
      const below = r.y > railTop ? Math.max(groundY(r.x), railTop) : groundY(r.x);
      reach = 1 - smooth(0.15, 0.35, (r.y - below) / Math.max(1, -r.vy));
    }
    return { tuck: smooth(0.15, 0.4, t), reach };
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

  /** Height of the ground in the rider's frame, below a point in that frame. */
  private groundLocalY(x: number, z: number, groundY: (x: number) => number) {
    this.unit.updateMatrixWorld(true);
    const w = this.unit.localToWorld(v3(x, 0, z));
    return this.unit.worldToLocal(w.set(w.x, groundY(w.x), w.z)).y;
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
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), toon(0xf2a020));
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
