import * as THREE from 'three';
import { Rider, SkateGrab } from './rider';
import { toon } from './toon';
import { spaceKit } from './spacesuit';
import { railY } from './track';
import { PartName, PART_NAMES, elbowBackBend, reachArm } from './skater';
import { Look, Wardrobe, bodyPieces, headPieces, dress, markModels, paint } from './look';

// The inline skater: the same kid as the skater, in a helmet and pads, facing the way he
// rides with a skate on each foot. Posed like the scooter rider, with two-bone IK from the
// hips to the skates and the shoulders to the hands: skating strides out to the sides,
// crouching to pump, tucking up for grabs, and both skates locked on a rail for a grind.
//
// The skates are the rider's feet: each one hangs off its shoe joint (whose own model is
// hidden), so wherever the legs go the skates go. Airs (flatspins and misty flips) turn the
// whole body about its middle.

export const ROLLER_PART_NAMES = ['roller_skate', 'roller_blade', 'roller_offroad', 'roller_cuff', 'pad_knee', 'pad_elbow'] as const;
export type RollerPartName = (typeof ROLLER_PART_NAMES)[number];
/** Aggressive skates; snowblades (short skis) on the snow; off-road skates with air tyres on the farm. */
export type RollerKind = 'skates' | 'blades' | 'offroad';

const THIGH = 0.44;
const SHIN = 0.44;
/** Height of the ankle above the ground on each kind of skate (see art/build_assets.py build_roller). */
const ANKLE_H: Record<RollerKind, number> = { skates: 0.165, blades: 0.15, offroad: 0.22 };
/** The skate's wheels (or ski) along the foot from the ankle: toe end and heel end. */
const TOE = 0.14, HEEL = -0.13;
/** On a rail the skates sit this far lower: the rail runs between the middle wheels. */
const GRIND_DROP = 0.05;
/** Feet apart, and the left (front) foot a little ahead. */
const FOOT_Z = 0.12, FOOT_X = 0.05;
const HIP_Z = 0.08;
const STAND = (THIGH + SHIN) * 0.9;
/** Skating strides: one a second for each leg, out to the side and back. */
const STRIDE_RATE = 1.1;

const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const DOWN = v3(0, -1, 0);
const smooth = (a: number, b: number, t: number) => {
  const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
/** Up and back down over a trick's progress: 0 at the ends, 1 in the middle. */
const bump = (p: number, a = 0.15, b = 0.85) => smooth(0, a, p) * (1 - smooth(b, 1, p));
/** Flatspins and misty flips start and finish a little gentler than they turn in the middle. */
const ease = (p: number) => 0.4 * p + 0.6 * p * p * (3 - 2 * p);

type Side = 'L' | 'R';
/**
 * Grabs and the rocket air: where each foot goes (rider frame, from the hips), how far the body
 * folds forward, and which hand takes hold of which skate (the other hand's thrown out for style).
 * Toe/heel say where on the skate the hand grabs: -1 heel to +1 toe; out: on its outside.
 */
interface Pose { L: THREE.Vector3; R: THREE.Vector3; lean: number; hip: number; hands: Partial<Record<Side, { foot: Side; along: number; out: number }>> }
const POSES: Record<SkateGrab | 'Rocket Air', Pose> = {
  // Knees tucked up to the chest, the right hand across to the left skate.
  Mute: { L: v3(0.18, -0.32, -0.08), R: v3(0.13, -0.37, 0.1), lean: 1.0, hip: 0.12, hands: { R: { foot: 'L', along: 0.1, out: -1 } } },
  // The left heel kicked up behind and out, grabbed on its outside; the right leg reaches down.
  Japan: { L: v3(-0.12, -0.3, -0.24), R: v3(0.15, -0.8, 0.1), lean: 0.6, hip: 0.06, hands: { L: { foot: 'L', along: 0, out: 1 } } },
  // Knees tucked up, each hand on its own skate.
  Safety: { L: v3(0.17, -0.33, -0.13), R: v3(0.17, -0.33, 0.13), lean: 1.0, hip: 0.12, hands: { L: { foot: 'L', along: 0.2, out: 1 }, R: { foot: 'R', along: 0.2, out: 1 } } },
  // Heels kicked up behind, a hand reaching back to the outside of a skate.
  Stalefish: { L: v3(-0.12, -0.36, -0.1), R: v3(-0.14, -0.3, 0.2), lean: 0.6, hip: 0.08, hands: { R: { foot: 'R', along: -0.3, out: 1 } } },
  // Legs out straight in front, folded over them, both hands down to the skates.
  'Rocket Air': { L: v3(0.8, -0.24, -0.1), R: v3(0.8, -0.24, 0.1), lean: 0.95, hip: 0.18, hands: { L: { foot: 'L', along: 0.4, out: 1 }, R: { foot: 'R', along: 0.4, out: 1 } } },
};

/**
 * Grinds, in the rail's frame (the body turned `yaw` across the rail, facing the camera; z along the rail, + ahead
 * once turned): where each foot goes, its yaw (0 points along the rail, PI/2 across it), and how
 * far it rolls onto its side (onto the soul plate). A foot with `up` is lifted off the rail.
 */
interface FootOnRail { z: number; yaw: number; roll: number; up?: THREE.Vector3 }
const GRINDS: Record<string, { yaw: number; L: FootOnRail; R: FootOnRail; crouch: number }> = {
  // Both skates across the rail.
  Frontside: { yaw: -Math.PI / 2 * 0.95, crouch: 0.35, L: { z: -0.14, yaw: Math.PI / 2, roll: 0 }, R: { z: 0.14, yaw: Math.PI / 2, roll: 0 } },
  // The front skate across, the back one along the rail on its soul plate.
  Soul: { yaw: -Math.PI / 2 * 0.8, crouch: 0.4, L: { z: -0.2, yaw: 0, roll: -0.4 }, R: { z: 0.14, yaw: Math.PI / 2, roll: 0 } },
  // One skate along the rail on its soul plate, the other knee up.
  Makio: { yaw: -Math.PI / 2 * 0.75, crouch: 0.45, L: { z: 0, yaw: 0, roll: -0.4, up: v3(0.12, 0.3, 0.05) }, R: { z: 0.02, yaw: 0, roll: 0.4 } },
  // The back skate along the rail on its outside, the front one turned back across it.
  Royale: { yaw: -Math.PI / 2 * 0.85, crouch: 0.45, L: { z: -0.22, yaw: 0, roll: -0.45 }, R: { z: 0.12, yaw: -Math.PI / 2 * 0.8, roll: 0.15 } },
  // Legs crossed, both skates along the rail on their outsides.
  Unity: { yaw: -Math.PI / 2 * 0.9, crouch: 0.4, L: { z: 0.1, yaw: 0, roll: 0.45 }, R: { z: -0.1, yaw: 0, roll: -0.45 } },
};

function placeholderSkate(kind: RollerKind): THREE.Object3D {
  const g = new THREE.Group();
  const boot = toon(0x222428), frame = toon(0x9aa0aa), wheel = toon(0xf2f2f2), ski = toon(0xe8402a), tyre = toon(0x2a2a2a);
  const shell = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.3), boot);
  shell.position.set(0, -0.01, 0.01);
  g.add(shell);
  const h = ANKLE_H[kind];
  if (kind === 'blades') {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.62), ski);
    s.position.set(0, -h + 0.01, 0.02);
    g.add(s);
  } else {
    const r = kind === 'offroad' ? 0.075 : 0.03;
    const xs = kind === 'offroad' ? [TOE + 0.02, HEEL - 0.02] : [0.11, 0.05, -0.05, -0.11];
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.3), frame);
    f.position.set(0, -h + r + 0.01, 0);
    g.add(f);
    for (const z of xs) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.024, 14), kind === 'offroad' ? tyre : wheel);
      w.rotation.z = Math.PI / 2;
      w.position.set(0, -h + r, z);
      g.add(w);
    }
  }
  return g;
}

function placeholderPad(r: number): THREE.Object3D {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), toon(0x222428));
  m.scale.set(1, 1, 0.6);
  g.add(m);
  return g;
}

export class RollerRig {
  readonly root = new THREE.Group();
  private body = new THREE.Group();
  /** Facing, eased (see update), and the turn of a flatspin or misty flip in progress. */
  private yaw = 0;
  private air = new THREE.Quaternion();
  /** Turns across a rail for a grind. */
  private pivot = new THREE.Group();
  private unit = new THREE.Group();
  private p: Record<PartName, THREE.Object3D>;
  private helmet: THREE.Object3D;
  private snowHead: THREE.Object3D;
  private space = spaceKit();
  private skates: Record<Side, Record<RollerKind, THREE.Object3D>>;
  private pads: THREE.Object3D[] = [];
  private shadow: THREE.Mesh;
  private kind: RollerKind = 'skates';

  private crouch = 0.15;
  private lift = 0;
  private lean = 0.35;
  private poseW = 0;
  private lastPose: SkateGrab | 'Rocket Air' = 'Mute';
  private grindW = 0;
  private grindYaw = 0;
  private lastGrind: string = 'Frontside';
  private grindFeet: Record<Side, { x: number; z: number; yaw: number; roll: number; up: THREE.Vector3 }> = {
    L: { x: 0, z: -FOOT_Z, yaw: 0, roll: 0, up: v3() }, R: { x: 0, z: FOOT_Z, yaw: 0, roll: 0, up: v3() },
  };
  private heelRoll = 0;
  private toeRoll = 0;
  private strideT = 0;
  private strideW = 0;
  private bailT = 0;
  private pops = 0;
  private hopT = -1;
  private wasAir = false;
  private airBefore = 0;
  private landT = -1;
  private landW = 0;
  private absorb = 0;
  private wobT = 0;
  private wob = 0;
  private armSwing = 0;

  /** The shadow can be shared with the skater, as only one of them rides at a time. */
  constructor(parts: Partial<Record<string, THREE.Object3D>> = {}, shadow?: THREE.Mesh) {
    // The skater's own parts, copied so every rider can be in the scene. Only each part's own
    // model is copied: the skater may already have hung his other parts off it.
    const ph = placeholderBody();
    const own = (o: THREE.Object3D) => { const c = o.clone(false); if (o.children[0]) c.add(o.children[0].clone()); return c; };
    this.p = Object.fromEntries(PART_NAMES.map((n) => [n, parts[n] ? own(parts[n]) : ph[n]])) as Record<PartName, THREE.Object3D>;
    const p = this.p;
    this.helmet = parts.head_skatehelmet?.clone() ?? p.head;
    this.snowHead = parts.head_snow?.clone() ?? p.head;
    markModels([...Object.values(p), this.helmet, this.snowHead]);
    const skate = (k: RollerKind) => {
      const name = k === 'skates' ? 'roller_skate' : k === 'blades' ? 'roller_blade' : 'roller_offroad';
      return parts[name]?.clone() ?? placeholderSkate(k);
    };
    this.skates = {
      L: { skates: skate('skates'), blades: skate('blades'), offroad: skate('offroad') },
      R: { skates: skate('skates'), blades: skate('blades'), offroad: skate('offroad') },
    };

    this.root.add(this.body);
    this.body.add(this.pivot);
    this.pivot.add(this.unit);
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
    p.forearm_L.position.y = -0.29;
    p.forearm_R.position.y = -0.29;
    for (const n of ['thigh_L', 'thigh_R', 'shin_L', 'shin_R', 'shoe_L', 'shoe_R'] as const) this.unit.add(p[n]);
    p.deck.visible = false;
    for (const s of ['L', 'R'] as const) {
      for (const k of ['skates', 'blades', 'offroad'] as const) p[`shoe_${s}`].add(this.skates[s][k]);
      // Pads: on the front of each knee and the back of each elbow.
      // The skate's cuff, hinged at the ankle: it leans with the shin.
      if (parts.roller_cuff) {
        const cuff = parts.roller_cuff.clone();
        cuff.position.y = -SHIN;
        p[`shin_${s}`].add(cuff);
        this.pads.push(cuff);
      }
      const knee = parts.pad_knee?.clone() ?? placeholderPad(0.075);
      knee.position.set(0, -0.02, 0);
      p[`shin_${s}`].add(knee);
      const elbow = parts.pad_elbow?.clone() ?? placeholderPad(0.05);
      p[`forearm_${s}`].add(elbow);
      this.pads.push(knee, elbow);
    }
    this.hideShoes();
    this.setKind('skates');

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

  /** The skate boots go on over the shoes. */
  private hideShoes() {
    for (const s of ['L', 'R'] as const) for (const c of this.p[`shoe_${s}`].children) if (c.userData.model) c.visible = false;
  }

  /** The space helmet, on the moon. */
  setSpace(on: boolean) { this.space.visible = on; }

  /** Dress in a look from the customiser, in a skate helmet (or beanie and goggles on the snow). */
  wear(look: Look, w: Wardrobe) {
    if (!w.loaded) return;
    for (const [n, names] of Object.entries(bodyPieces(look))) dress(this.p[n as PartName], names, w);
    dress(this.helmet, headPieces(look, 'skate'), w, look);
    dress(this.snowHead, headPieces(look, 'snow'), w, look);
    this.hideShoes();
    paint(this.root);
  }

  /** Snowblades, beanie and goggles on the snow; off-road skates on the farm; aggressive skates everywhere else. */
  setKind(kind: RollerKind) {
    this.kind = kind;
    for (const s of ['L', 'R'] as const) for (const k of ['skates', 'blades', 'offroad'] as const) this.skates[s][k].visible = k === kind;
    this.helmet.visible = kind !== 'blades';
    this.snowHead.visible = kind === 'blades';
  }

  /** The worst wrong-way elbow bend of the two arms, in radians (for the playtest). */
  elbowBackBend() {
    return Math.max(elbowBackBend(this.p.forearm_L), elbowBackBend(this.p.forearm_R));
  }

  /** World positions of the points that should never go below the ground: knees, and each skate's toe and heel. */
  legPoints(): THREE.Vector3[] {
    const p = this.p;
    this.root.updateMatrixWorld(true);
    const pts: THREE.Vector3[] = [];
    const h = ANKLE_H[this.kind] - 0.01;
    for (const side of ['L', 'R'] as const) {
      pts.push(p[`shin_${side}`].getWorldPosition(new THREE.Vector3()));
      const shoe = p[`shoe_${side}`];
      pts.push(shoe.localToWorld(v3(0, -h, TOE)), shoe.localToWorld(v3(0, -h, HEEL)));
    }
    return pts;
  }

  /** Everything update() moves, for recording replays. */
  get joints(): THREE.Object3D[] {
    return [this.root, this.body, this.pivot, this.unit, ...Object.values(this.p), this.helmet, this.snowHead, this.shadow];
  }

  pumpKick() { /* the crouch follows the rider's pump timer */ }

  update(dt: number, r: Rider, groundY: (x: number) => number, groundSlope: (x: number) => number) {
    const p = this.p;
    const k = 1 - Math.exp(-dt * 14);
    const cap = (d: number, rate: number) => Math.max(-rate * dt, Math.min(rate * dt, d));
    const ankle = ANKLE_H[this.kind];

    // Pose targets.
    let crouchT = 0.22, liftT = 0, leanT = 0.35;
    if (r.pumpTimer > 0) { crouchT = 0.55; leanT = 0.5; }
    const air = !r.grounded && !r.grind && !r.loop;
    if (air) { crouchT = 0.35; liftT = 0.12 * Math.min(1, r.airTime * 4); }
    if (r.loop) { crouchT = 0.5; leanT = 0.5; }
    if (r.flipping) { crouchT = 0.7; liftT = 0.3; leanT = 0.5; }

    const hop = this.hopUpdate(dt, r, groundY);
    if (hop && !r.current && !r.flipping) {
      // Knees tuck at the top of the jump, then reach down for the landing.
      const tk = hop.tuck * (1 - hop.reach);
      crouchT = 0.3 + 0.4 * tk;
      liftT = 0.1 + 0.3 * tk;
    }

    // Grabs held, and the rocket air: legs and hands to their pose, eased in and out.
    const tr = r.current?.axis === 'skates' ? r.current : null;
    const prog = tr ? r.trickProgress : 0;
    const grab = r.grab && r.grab in POSES ? r.grab as SkateGrab : null;
    const rocket = tr?.name === 'Rocket Air' ? bump(prog, 0.3, 0.7) : 0;
    if (grab) this.lastPose = grab;
    else if (rocket) this.lastPose = 'Rocket Air';
    const poseT = grab ? 1 : rocket;
    // Capped, so the legs swing out and back over a few frames rather than snapping.
    this.poseW += grab ? cap((poseT - this.poseW) * (1 - Math.exp(-dt * 14)), 3.5) : cap(poseT - this.poseW, 4);
    const pw = this.poseW, P = POSES[this.lastPose];
    // Tucked up for a flatspin or a misty flip.
    if (tr && tr.name !== 'Rocket Air') { crouchT = 0.6; liftT = 0.3 * bump(prog, 0.2, 0.8); leanT = 0.6; }

    this.crouch += cap((crouchT - this.crouch) * k, 5);
    this.lift += cap((liftT - this.lift) * k, 3);
    this.lean += cap((leanT - this.lean) * k, 6);
    this.absorb = Math.max(this.landUpdate(dt, r), this.absorb - dt * 2.5);
    const crouch = this.crouch + 0.5 * this.absorb;

    // Grinds: the body turns across the rail and drops so the rail runs between the middle wheels.
    const style = r.grind?.style;
    if (style && GRINDS[style]) this.lastGrind = style;
    const G = GRINDS[this.lastGrind];
    this.grindW += cap(((style ? 1 : 0) - this.grindW) * (1 - Math.exp(-dt * 16)), 4);
    const gw = this.grindW;
    this.grindYaw += cap(((style ? G.yaw : 0) - this.grindYaw) * (1 - Math.exp(-dt * 16)), 5);
    for (const s of ['L', 'R'] as const) {
      const f = G[s], g = this.grindFeet[s];
      const e = 1 - Math.exp(-dt * 18);
      g.z += cap((f.z - g.z) * e, 1.5);
      g.yaw += cap((f.yaw - g.yaw) * e, 9);
      g.roll += cap((f.roll - g.roll) * e, 5);
      g.up.lerp(f.up ?? v3(), e);
    }
    this.pivot.rotation.set(0, this.grindYaw, 0);
    this.pivot.position.y = -GRIND_DROP * gw;

    // Heel and toe rolls: up on the back wheels of the front skate, or the front wheels of the back one.
    this.heelRoll += (((r.manual === 'Heel Roll' || r.manual === 'Tail Press') ? 1 : 0) - this.heelRoll) * k;
    this.toeRoll += (((r.manual === 'Toe Roll' || r.manual === 'Nose Press') ? 1 : 0) - this.toeRoll) * k;

    // The whole body: tilt with the ground, spin, flip; airs turn it about its middle.
    const pv = v3(0, 0.75, 0);
    const spin = r.spin ? r.spin.dir * r.spinProgress * (r.spin.deg === 360 ? Math.PI * 2 : Math.PI) : 0;
    // A misty flip's 180 turns the whole rider, so that it carries on smoothly into riding backwards.
    const misty = tr?.name === 'Misty Flip' ? ease(prog) * Math.PI : 0;
    // Eased (fast), so landing a trick just short of done turns you the last bit rather than snapping.
    let dy = r.bodyYaw + spin + misty - this.yaw;
    dy -= Math.round(dy / (Math.PI * 2)) * Math.PI * 2;
    this.yaw += cap(dy, 20);
    if (tr?.name === 'Flatspin') {
      // A backflip laid over on its side.
      this.air.setFromAxisAngle(v3(0, 1, 1).normalize(), ease(prog) * Math.PI * 2);
    } else if (tr?.name === 'Misty Flip') {
      // A frontflip with a 180 turned through it (above): you come out backwards.
      this.air.setFromAxisAngle(v3(0, 0, 1), -ease(prog) * Math.PI * 2);
    } else this.air.rotateTowards(new THREE.Quaternion(), dt * 12);
    // Turned about the middle of the body: the middle stays where it would be standing.
    const base = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.yaw, r.angle, 'ZYX'));
    const full = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.yaw, r.angle + r.flipAngle, 'ZYX')).multiply(this.air);
    const mid = pv.clone().applyQuaternion(base);
    this.root.position.set(r.x, r.y, r.z).add(mid).sub(pv.clone().applyQuaternion(full));
    this.root.quaternion.copy(full);

    // Where the feet go, in the rider's frame (x ahead, z his right).
    const ground = (x: number, z: number) => this.groundLocalY(x, z, groundY);
    const feet: Record<Side, THREE.Vector3> = {
      L: v3(FOOT_X, ankle + this.lift, -FOOT_Z),
      R: v3(-FOOT_X, ankle + this.lift, FOOT_Z),
    };
    const yawOf: Record<Side, number> = { L: Math.PI / 2, R: Math.PI / 2 };
    const rollOf: Record<Side, number> = { L: 0, R: 0 };
    const pitchOf: Record<Side, number> = { L: 0, R: 0 };

    // Heel roll: the front skate out ahead, toes up; toe roll: the back skate behind, heel up.
    const hr = this.heelRoll, tl = this.toeRoll;
    feet.L.x += 0.22 * hr; feet.L.y += 0.05 * hr; pitchOf.L -= 0.4 * hr;
    feet.R.x -= 0.12 * hr;
    feet.R.x -= 0.25 * tl; feet.R.y += 0.05 * tl; pitchOf.R += 0.45 * tl;
    feet.L.x += 0.08 * tl;

    // Skating: each leg in turn pushes out to the side and back, lifts, and comes back under.
    const strideTo = (r.pushing && r.grounded && !r.bailing && !r.manual && !r.grind ? 1 : 0) - this.strideW;
    this.strideW += Math.max(-dt * 5, Math.min(dt * 5, strideTo * (1 - Math.exp(-dt * 12))));
    const sw = this.strideW;
    if (sw > 0.01) this.strideT = (this.strideT + dt * STRIDE_RATE) % 2;
    else this.strideT = 0;
    for (const [s, off] of [['L', 0], ['R', 1]] as const) {
      if (sw < 0.01) continue;
      // 0..1 through this leg's stride: pushing out for the first 60%, lifting back in for the rest.
      const t = ((this.strideT - off + 2) % 2) / 2;
      const side = s === 'L' ? -1 : 1;
      let out = 0, back = 0, up = 0;
      if (t < 0.6) { const u = t / 0.6; out = u; back = u; }
      else { const u = (t - 0.6) / 0.4; out = 1 - u; back = 1 - u; up = Math.sin(u * Math.PI); }
      const f = feet[s];
      f.x -= 0.32 * back * sw;
      f.z += side * 0.26 * out * sw;
      f.y += 0.12 * up * sw;
      // Toes turned out to push off the inside edge.
      yawOf[s] += -side * 0.5 * out * sw;
      rollOf[s] += side * 0.25 * out * sw * (t < 0.6 ? 1 : 0);
    }
    this.armSwing = sw * Math.sin(this.strideT * Math.PI);

    // On a rail: the feet go where the grind puts them (in the turned frame, so turn them back).
    if (gw > 0.001) {
      const cy = Math.cos(this.grindYaw), sy = Math.sin(this.grindYaw);
      for (const s of ['L', 'R'] as const) {
        const g = this.grindFeet[s];
        // Along the rail to the rider's turned frame.
        const lx = g.z * cy, lz = g.z * sy;
        const to = v3(lx, ankle + this.lift * 0.2, lz).add(g.up);
        feet[s].lerp(to, gw);
        yawOf[s] += ((Math.PI / 2 - this.grindYaw - g.yaw) - yawOf[s]) * gw;
        rollOf[s] += (g.roll - rollOf[s]) * gw;
      }
    }

    // Body: hips over the feet, leaning forward.
    const hipY = ankle + STAND - crouch * 0.42 + this.lift * 0.45 - (G.crouch - 0.2) * 0.4 * gw + P.hip * pw;
    const hipX = -0.04 - this.lean * 0.05 + 0.04 * hr;
    // Grabs and the rocket air: the feet go to the pose, measured from the hips.
    if (pw > 0.001) {
      for (const s of ['L', 'R'] as const) feet[s].lerp(v3(hipX, hipY, 0).add(P[s]), pw);
    }
    p.pelvis.position.set(hipX, hipY, 0);
    const lean = this.lean + (pw > 0.001 ? (P.lean - this.lean) * pw : 0);
    p.torso.rotation.set(lean + crouch * 0.3, 0, 0);
    for (const h of [this.helmet, this.snowHead]) h.rotation.set(-lean * 0.8 - crouch * 0.3, 0, 0);

    // Never into the ground while rolling.
    if (r.grounded && !r.grind) {
      for (const s of ['L', 'R'] as const) {
        const f = feet[s];
        f.y = Math.max(f.y, ground(f.x, f.z) + ankle - 0.002);
      }
    }

    const hipL = v3(hipX, hipY, -HIP_Z), hipR = v3(hipX, hipY, HIP_Z);
    // Knees forward and a little out.
    this.leg(p.thigh_L, p.shin_L, p.shoe_L, hipL, feet.L, v3(1, -0.2, -0.35), yawOf.L, rollOf.L, pitchOf.L);
    this.leg(p.thigh_R, p.shin_R, p.shoe_R, hipR, feet.R, v3(1, -0.2, 0.35), yawOf.R, rollOf.R, pitchOf.R);

    // Arms: swinging with the strides, out wide on a rail or in the air, or down to the skates for a grab.
    this.root.updateMatrixWorld(true);
    for (const [side, s] of [['L', 1], ['R', -1]] as const) {
      const swing = (side === 'L' ? 1 : -1) * this.armSwing;
      const rest = v3(s * 0.27, -0.08, 0.2 + 0.22 * swing);
      const wide = v3(s * 0.55, 0.42, 0.08);
      const aw = Math.max(gw, air ? 0.6 : 0, this.heelRoll * 0.7, this.toeRoll * 0.7);
      const hand = rest.lerp(wide, aw);
      const grip = P.hands[side];
      if (grip && pw > 0.001) {
        const shoe = p[`shoe_${grip.foot}`];
        const out = (grip.foot === 'L' ? -1 : 1) * grip.out * 0.08;
        const at = p.torso.worldToLocal(shoe.localToWorld(v3(out, -0.02, grip.along * 0.12)));
        hand.lerp(at, pw);
      } else if (pw > 0.001) {
        // The free hand thrown up and out.
        hand.lerp(v3(s * 0.55, 0.3, 0.05), pw);
      }
      const upper = side === 'L' ? p.upperArm_L : p.upperArm_R, fore = side === 'L' ? p.forearm_L : p.forearm_R;
      const q2 = reachArm(upper.position, hand, v3(s, -0.4, -0.6));
      upper.quaternion.copy(q2.upper);
      fore.quaternion.copy(q2.fore);
    }

    // Bail: tumble off.
    if (r.bailing) {
      this.bailT += dt;
      const t = this.bailT;
      this.body.rotation.z = -Math.min(1, t * 2.5) * 1.35;
      this.body.rotation.x = 0;
      this.wob = 0;
      this.body.position.set(-Math.min(1, t * 2.5) * 0.6, 0.2 * Math.sin(Math.min(1, t * 2.5) * Math.PI), 0);
      this.body.visible = !(t > 0.9 && Math.floor(t * 14) % 2 === 0);
    } else {
      this.bailT = 0;
      this.body.rotation.z = 0;
      this.body.position.set(0, 0, 0);
      // Riding backwards too long: wobbling from side to side, faster and wider as it goes on.
      this.wob += Math.max(-dt * 2, Math.min(dt * 2, r.wobble - this.wob));
      this.wobT += dt * (5 + 5 * this.wob);
      this.body.rotation.x = this.wob * 0.3 * Math.sin(this.wobT);
      this.body.visible = true;
    }

    // Last resort for any pose: lift the body so no knee or skate goes into the ground.
    let sink = 0, wall = false;
    for (const pt of this.legPoints()) {
      sink = Math.max(sink, groundY(pt.x) - pt.y);
      if (Math.abs(groundSlope(pt.x)) > 1.5) wall = true;
    }
    if (sink > 0 && !wall && !r.grind) this.body.position.y += Math.min(sink, 0.6);

    const gy = groundY(r.x);
    const height = Math.max(0, r.y - gy);
    this.shadow.position.set(r.x, gy + 0.02, r.z);
    this.shadow.rotation.set(-Math.PI / 2, 0, 0);
    this.shadow.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), Math.atan(groundSlope(r.x)));
    const s = Math.max(0.3, 1 - height * 0.12);
    this.shadow.scale.set(1.0 * s, 0.6 * s, 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.25 * s;
  }

  /** Jump: tuck, then reach for the landing. */
  private hopUpdate(dt: number, r: Rider, groundY: (x: number) => number) {
    if (r.pops !== this.pops) {
      this.pops = r.pops;
      if (!r.grounded) this.hopT = 0;
    }
    if (this.hopT < 0 || r.grounded || r.grind || r.loop || r.bailing || r.falling) { this.hopT = -1; return null; }
    this.hopT += dt;
    let reach = 0;
    if (r.vy < 0) {
      const rail = r.track.railAt(r.x);
      const railTop = rail ? railY(rail, r.x) : -Infinity;
      const below = r.y > railTop ? Math.max(groundY(r.x), railTop) : groundY(r.x);
      reach = 1 - smooth(0.15, 0.35, (r.y - below) / Math.max(1, -r.vy));
    }
    return { tuck: smooth(0.1, 0.35, this.hopT), reach };
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

  private leg(thigh: THREE.Object3D, shin: THREE.Object3D, shoe: THREE.Object3D, hip: THREE.Vector3, foot: THREE.Vector3, pole: THREE.Vector3, yaw: number, roll: number, pitch: number) {
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
    shoe.rotation.set(pitch, yaw, roll, 'YXZ');
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
    upperArm_L: cap3(0.05, 0.29, 0x2f8fd8), upperArm_R: cap3(0.05, 0.29, 0x2f8fd8),
    forearm_L: cap3(0.042, 0.3, 0xf0c09a), forearm_R: cap3(0.042, 0.3, 0xf0c09a),
    thigh_L: cap3(0.075, THIGH, 0x2f3b4d), thigh_R: cap3(0.075, THIGH, 0x2f3b4d),
    shin_L: cap3(0.06, SHIN, 0x2f3b4d), shin_R: cap3(0.06, SHIN, 0x2f3b4d),
    shoe_L: shoe(), shoe_R: shoe(),
  };
}
