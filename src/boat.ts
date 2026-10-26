import type { TrickName } from './rider';

// A kayak's attitude, steered directly: tilt the device to lift the bow or the stern, drag a
// thumb sideways to turn the boat. Nothing here is a canned trick. The water decides what the
// boat can do (flat water barely lets it turn or tip; a hole or a wave lets it go right over),
// and when the boat's motion matches a real playboating move, that's the trick you get:
//
// - In a hole or on a wave: the ends going over (past vertical, twice or more) is a cartwheel;
//   the bow up while the boat swings round is a blunt; a turn with the boat flat, a flatspin.
// - In the air: a full turn end over end is a loop (back or front); a loop with a 180 in it a
//   McNasty; a 180 with the bow thrown up an air blunt, past vertical a Pan-Am; a 360 that goes
//   past upside down on the way round a helix; a plain turn a flatspin.
//
// Pitch is + bow up, yaw is the turn from facing downstream, both in radians and not wrapped.

export interface BoatMove { name: TrickName; points: number; duration: number }

/** Where the boat is: flying, in moving water that lets it play (a hole or a wave), or on flat water. */
export type Water = 'air' | 'feature' | 'flat';

const TAU = Math.PI * 2;
const near = (a: number, unit: number) => Math.round(a / unit) * unit;

/** Turning, in radians a second: quick in the air or in a hole, a slow pivot on flat water. */
const TURN_RATE = 14, FLAT_TURN_RATE = 3.5;
/** On flat water a turn dies away, so the boat only wiggles. */
const FLAT_TURN_DECAY = 5;
/** Seconds for a loop with the device tipped all the way. */
const LOOP_TIME = 0.6;
/** How fast the boat eases back to level in the air once the device is level. */
const AIR_RIGHT = 4;
/** In a hole, tipped past this share the water takes the end down and over, at this rate. */
const WHEEL_TILT = 0.7, WHEEL_RATE = 7;
/** How far the bow (or stern) lifts in a hole for a full tilt below WHEEL_TILT, radians. */
const HOLE_LIFT = 1.3;
/** Landing this far off level (pitch) or off straight (yaw, either way round) still works. */
const LAND_PITCH = 0.75, LAND_YAW = 0.7;

const POINTS = {
  cartwheelEnd: 250, blunt: 700, flatspin180: 400, flatspin360: 900,
  loop: 1200, mcnasty: 1800, helix: 1600, panam: 1100, airBlunt: 800,
};

export class Boat {
  pitch = 0;
  yaw = 0;
  /** A thumb is down and dragging the boat round. */
  dragging = false;
  /** Turn asked for by the drag that the boat hasn't made yet. */
  private turnLeft = 0;
  /** A move on the water in progress: where it started, and how far it's gone. */
  private move: { t: number; pitch0: number; yaw0: number; maxP: number; ends: number } | null = null;
  /** The air in progress: the attitude at take-off, and how far the boat has been thrown. */
  private air: { pitch0: number; yaw0: number; maxP: number; t: number } | null = null;

  /** Drag the boat round by this much (radians). */
  turn(d: number) {
    this.turnLeft += d;
    this.dragging = true;
  }

  turnEnd() { this.dragging = false; }

  /** Off the water's lip into the air: anything you were doing on the water ends there. */
  takeoff(): BoatMove[] {
    const done = this.endMove();
    this.air = { pitch0: near(this.pitch, TAU), yaw0: near(this.yaw, Math.PI), maxP: 0, t: 0 };
    return done;
  }

  /** The boat's thrown about out of your hands (capsized, swimming): straighten it out. */
  reset() {
    this.pitch = near(this.pitch, TAU);
    this.yaw = near(this.yaw, TAU);
    this.turnLeft = 0;
    this.move = null;
    this.air = null;
  }

  /** In moving water, the boat's tipped or turned off straight: it's doing something. */
  get busy(): boolean {
    return Math.abs(this.pitch - near(this.pitch, TAU)) > 0.35 || Math.abs(this.yaw - near(this.yaw, Math.PI)) > 0.35 || this.dragging || Math.abs(this.turnLeft) > 0.05;
  }

  /** Over past vertical in a hole: the ends are going round. */
  get wheeling(): boolean {
    return !!this.move && Math.abs(this.pitch - this.move.pitch0) > 1.2;
  }

  /**
   * How far a cartwheel has rolled the boat about its length. A cartwheel goes end over end on
   * the boat's edge, so the paddler stays on top: past vertical the boat comes down the right
   * way up, pointing the other way, not upside down. A blunt's lift doesn't roll it.
   */
  get wheelRoll(): number {
    if (!this.move) return 0;
    const r = this.pitch - this.move.pitch0, a = Math.abs(r);
    const k = Math.min(1, Math.max(0, (a - 1.3) / 0.9));
    return r * k * k * (3 - 2 * k);
  }

  /** Step the boat; `tilt` is how far the device is tipped, -1 to 1. Returns any move finished on the water. */
  step(dt: number, tilt: number, water: Water): BoatMove[] {
    // Turning, after the thumb.
    const rate = water === 'flat' ? FLAT_TURN_RATE : TURN_RATE;
    const d = Math.max(-rate * dt, Math.min(rate * dt, this.turnLeft));
    this.yaw += d;
    this.turnLeft -= d;
    if (water === 'flat') this.turnLeft *= Math.exp(-dt * FLAT_TURN_DECAY);
    if (!this.dragging && Math.abs(this.turnLeft) < 0.02) {
      // Let go: settle facing straight, downstream on flat water, either way in a hole or the air.
      this.turnLeft = 0;
      const to = near(this.yaw, water === 'flat' ? TAU : Math.PI);
      this.yaw += (to - this.yaw) * Math.min(1, dt * (water === 'air' ? 3 : 5));
    }

    // Pitch, after the tilt.
    if (water === 'air') {
      if (Math.abs(tilt) > 0.05) this.pitch += (tilt * TAU / LOOP_TIME) * dt;
      else this.pitch += (near(this.pitch, TAU) - this.pitch) * Math.min(1, dt * AIR_RIGHT);
    } else if (water === 'feature' && Math.abs(tilt) > WHEEL_TILT) {
      this.pitch += Math.sign(tilt) * WHEEL_RATE * dt;
    } else {
      // On flat water the boat stays level (a stall stands it up on an end, see the rider);
      // in a hole the tilt lifts the bow or stern, and levelling out lets it fall back.
      const to = near(this.pitch, TAU) + (water === 'feature' ? tilt * HOLE_LIFT : 0);
      this.pitch += (to - this.pitch) * Math.min(1, dt * 8);
    }

    if (water === 'air') {
      const a = this.air;
      if (a) { a.t += dt; a.maxP = Math.max(a.maxP, Math.abs(this.pitch - a.pitch0)); }
      return [];
    }
    if (water === 'flat') return this.endMove();
    // In a hole or on a wave: a move starts as soon as the boat tips or turns, and ends when it's
    // straight again. (Still wheeling counts as busy even as the boat comes past level, so a
    // cartwheel that goes right round keeps going.)
    const busy = this.busy || Math.abs(tilt) > WHEEL_TILT;
    if (!this.move && busy) this.move = { t: 0, pitch0: near(this.pitch, TAU), yaw0: near(this.yaw, Math.PI), maxP: 0, ends: 0 };
    const m = this.move;
    if (!m) return [];
    m.t += dt;
    const r = Math.abs(this.pitch - m.pitch0);
    m.maxP = Math.max(m.maxP, r);
    m.ends = Math.max(m.ends, Math.floor((r + Math.PI / 2) / Math.PI));
    return busy ? [] : this.endMove();
  }

  /** The move on the water is over (straightened out, or left the hole): what was it? */
  private endMove(): BoatMove[] {
    const m = this.move;
    this.move = null;
    if (!m) return [];
    const turns = Math.floor((Math.abs(this.yaw - m.yaw0) + 0.4) / Math.PI);
    if (m.ends >= 2) return [{ name: 'Cartwheel', points: POINTS.cartwheelEnd * m.ends, duration: m.t }];
    if (turns >= 1 && m.maxP >= 0.8) return [{ name: 'Blunt', points: POINTS.blunt, duration: m.t }];
    if (turns >= 2) return [{ name: 'Flatspin 360', points: POINTS.flatspin360, duration: m.t }];
    if (turns === 1) return [{ name: 'Flatspin 180', points: POINTS.flatspin180, duration: m.t }];
    return [];
  }

  /**
   * Back on the water. Not near level, or turned across the current: over you go (ok false).
   * Otherwise the boat straightens and you get whatever the air was.
   */
  land(): { ok: boolean; moves: BoatMove[] } {
    const a = this.air;
    this.air = null;
    if (!a) return { ok: true, moves: [] };
    const rp = this.pitch - a.pitch0, ry = this.yaw - a.yaw0;
    const loops = Math.round(rp / TAU), halfs = Math.round(ry / Math.PI);
    if (Math.abs(rp - loops * TAU) > LAND_PITCH || Math.abs(ry - halfs * Math.PI) > LAND_YAW) return { ok: false, moves: [] };
    this.pitch = a.pitch0 + loops * TAU;
    this.yaw = a.yaw0 + halfs * Math.PI;
    this.turnLeft = 0;
    const L = Math.abs(loops), H = Math.abs(halfs), t = a.t;
    const moves: BoatMove[] = [];
    if (L >= 1 && H >= 1) moves.push({ name: 'McNasty', points: POINTS.mcnasty + (L - 1) * POINTS.loop, duration: t });
    else if (L >= 1) for (let k = 0; k < L; k++) moves.push({ name: loops > 0 ? 'Back Loop' : 'Front Loop', points: POINTS.loop, duration: t / L });
    else if (H >= 2 && a.maxP >= 2.4) moves.push({ name: 'Helix', points: POINTS.helix, duration: t });
    else if (H >= 1 && a.maxP >= Math.PI / 2) moves.push({ name: 'Pan-Am', points: POINTS.panam, duration: t });
    else if (H >= 1 && a.maxP >= 0.7) moves.push({ name: 'Air Blunt', points: POINTS.airBlunt, duration: t });
    else if (H >= 1) moves.push({ name: H >= 2 ? 'Flatspin 360' : 'Flatspin 180', points: H >= 2 ? POINTS.flatspin360 : POINTS.flatspin180, duration: t });
    return { ok: true, moves };
  }
}
