import type { TrickName } from './rider';

// A kayak's attitude, steered directly. Nothing here is a canned trick: you move the boat, the
// water decides what it lets you do, and when the boat's motion matches a real playboating
// move, that's the trick you get.
//
// - Tilt the device and the bow (or stern) lifts to match: the angle follows the tilt all the
//   time, a little tilt a little lift, on the water and in the air.
// - Drag a thumb sideways and the boat wheels end over end round the paddler, on its edge, the
//   way a cartwheel goes: half a turn swaps the ends. A hole, a wave or the air lets it go right
//   round; flat water only lets an end dip and come back.
//
// What it's called:
// - In a hole or on a wave: one end swapped is a blunt; two or more, a cartwheel.
// - In the air: half a wheel is an air blunt (a Pan-Am with the bow thrown right up), a whole
//   one a loop (back or front, by which way it went), one and a half a McNasty.
//
// Pitch (the tilt's lift) and wheel are both + bow up, in radians; the wheel isn't wrapped.

export interface BoatMove { name: TrickName; points: number; duration: number }

/** Where the boat is: flying, in moving water that lets it play (a hole or a wave), or on flat water. */
export type Water = 'air' | 'feature' | 'flat';

const TAU = Math.PI * 2;
const near = (a: number, unit: number) => Math.round(a / unit) * unit;

/** The lift for the device tipped all the way, radians: the boat stood almost on end. */
const MAX_PITCH = 1.35;
/** How quickly the boat follows the tilt (per second): quick, but never a snap. */
const PITCH_FOLLOW = 7;
/** Wheeling, in radians a second: quick in a hole or the air; on flat water just a dip. */
const WHEEL_RATE = 20;
/** On flat water a drag only dips an end this far before the water pushes it back. */
const FLAT_DIP = 0.5;
/** How fast the boat settles once your thumb's off it. */
const SETTLE = 6;
/** Landing this far off level (lift or wheel) still works. */
const LAND_PITCH = 1.0, LAND_WHEEL = 0.7;

const POINTS = { cartwheelEnd: 300, blunt: 700, airBlunt: 800, panam: 1100, loop: 1200, mcnasty: 1800 };

export class Boat {
  /** The bow lifted (or the stern, negative) by the tilt. */
  pitch = 0;
  /** End over end round the paddler, from your thumb. A multiple of π is flat on the water. */
  wheel = 0;
  /** Turned round on the surface (only when it comes off a move facing backwards onto flat water). */
  yaw = 0;
  /** A thumb is down and dragging the boat round. */
  dragging = false;
  /** Wheel asked for by the drag that the boat hasn't made yet. */
  private wheelLeft = 0;
  /** A move on the water in progress: where it started, and how far it's gone. */
  private move: { t: number; wheel0: number; maxP: number } | null = null;
  /** The air in progress: the wheel at take-off, the most lift, how long. */
  private air: { wheel0: number; maxP: number; t: number } | null = null;

  /** Drag the boat round by this much (radians, + bow up and over). */
  turn(d: number) {
    this.wheelLeft += d;
    this.dragging = true;
  }

  turnEnd() { this.dragging = false; }

  /** Off the water into the air: anything you were doing on the water ends there. */
  takeoff(): BoatMove[] {
    const done = this.endMove();
    this.air = { wheel0: near(this.wheel, Math.PI), maxP: Math.abs(this.pitch), t: 0 };
    return done;
  }

  /** The boat's thrown about out of your hands (capsized, swimming): straighten it out. */
  reset() {
    this.wheel = near(this.wheel, TAU);
    this.yaw = 0;
    this.wheelLeft = 0;
    this.move = null;
    this.air = null;
  }

  /** Tipped, wheeling or being dragged round: the boat is doing something. */
  get busy(): boolean {
    return Math.abs(this.pitch) > 0.35 || Math.abs(this.wheel - near(this.wheel, Math.PI)) > 0.35 || this.dragging || Math.abs(this.wheelLeft) > 0.05;
  }

  /**
   * How far the boat is rolled about its length for the wheel. It wheels on its edge, so past
   * vertical it comes down the right way up, pointing the other way, with the paddler on top.
   */
  get wheelRoll(): number { return this.wheel; }

  /** Step the boat; `tilt` is how far the device is tipped, -1 to 1. Returns any move finished on the water. */
  step(dt: number, tilt: number, water: Water): BoatMove[] {
    // The lift follows the tilt.
    const k = 1 - Math.exp(-dt * PITCH_FOLLOW);
    this.pitch += (tilt * MAX_PITCH - this.pitch) * k;

    // The wheel follows the thumb.
    const home = water === 'flat' ? near(this.wheel, TAU) : near(this.wheel, Math.PI);
    if (water === 'flat') {
      // Flat water won't let it go over: an end dips and the water pushes it back.
      this.wheelLeft = Math.max(home - FLAT_DIP - this.wheel, Math.min(home + FLAT_DIP - this.wheel, this.wheelLeft));
    }
    const d = Math.max(-WHEEL_RATE * dt, Math.min(WHEEL_RATE * dt, this.wheelLeft));
    this.wheel += d;
    this.wheelLeft -= d;
    if (water === 'flat') this.wheelLeft *= Math.exp(-dt * SETTLE);
    if (!this.dragging && Math.abs(this.wheelLeft) < 0.02) {
      this.wheelLeft = 0;
      this.wheel += (home - this.wheel) * (1 - Math.exp(-dt * SETTLE));
    }
    // Back onto flat water facing upstream (a move left it backwards): the paddler spins it round.
    if (water === 'flat' && !this.dragging && Math.abs(this.wheel - near(this.wheel, TAU)) > 2.5) {
      this.wheel -= Math.PI * Math.sign(this.wheel - near(this.wheel, TAU));
      this.yaw += Math.PI;
    }
    this.yaw += (near(this.yaw, TAU) - this.yaw) * (1 - Math.exp(-dt * SETTLE));

    if (water === 'air') {
      const a = this.air;
      if (a) { a.t += dt; a.maxP = Math.max(a.maxP, Math.abs(this.pitch)); }
      return [];
    }
    if (water === 'flat') return this.endMove();
    // In a hole or on a wave: a move starts once the boat wheels, and ends when it's settled.
    const going = this.dragging || Math.abs(this.wheelLeft) > 0.05 || Math.abs(this.wheel - near(this.wheel, Math.PI)) > 0.35;
    if (!this.move && going) this.move = { t: 0, wheel0: near(this.wheel, Math.PI), maxP: 0 };
    const m = this.move;
    if (!m) return [];
    m.t += dt;
    m.maxP = Math.max(m.maxP, Math.abs(this.pitch));
    return going ? [] : this.endMove();
  }

  /** The move on the water is over (settled, or left the hole): what was it? */
  private endMove(): BoatMove[] {
    const m = this.move;
    this.move = null;
    if (!m) return [];
    const ends = Math.round(Math.abs(near(this.wheel, Math.PI) - m.wheel0) / Math.PI);
    if (ends >= 2) return [{ name: 'Cartwheel', points: POINTS.cartwheelEnd * ends, duration: m.t }];
    if (ends === 1) return [{ name: 'Blunt', points: POINTS.blunt, duration: m.t }];
    return [];
  }

  /**
   * Back on the water. Stood up on an end, or landing on its edge mid-wheel: over you go (ok
   * false). Otherwise the boat lands flat and you get whatever the air was.
   */
  land(): { ok: boolean; moves: BoatMove[] } {
    const a = this.air;
    this.air = null;
    if (!a) return { ok: true, moves: [] };
    const halfs = Math.round((this.wheel - a.wheel0) / Math.PI);
    if (Math.abs(this.pitch) > LAND_PITCH || Math.abs(this.wheel - a.wheel0 - halfs * Math.PI) > LAND_WHEEL) return { ok: false, moves: [] };
    this.wheel = a.wheel0 + halfs * Math.PI;
    this.wheelLeft = 0;
    const H = Math.abs(halfs), t = a.t;
    if (H >= 3) return { ok: true, moves: [{ name: 'McNasty', points: POINTS.mcnasty + (H - 3) * POINTS.loop / 2, duration: t }] };
    if (H === 2) return { ok: true, moves: [{ name: halfs > 0 ? 'Back Loop' : 'Front Loop', points: POINTS.loop, duration: t }] };
    if (H === 1) return { ok: true, moves: [a.maxP >= 0.9 ? { name: 'Pan-Am', points: POINTS.panam, duration: t } : { name: 'Air Blunt', points: POINTS.airBlunt, duration: t }] };
    return { ok: true, moves: [] };
  }
}
