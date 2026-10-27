import type { TrickName } from './rider';

// A kayak's attitude, steered directly. Nothing here is a canned trick: you move the boat, the
// water decides what it lets you do, and when the boat's motion matches a real playboating
// move, that's the trick you get.
//
// - Tilt the device and the bow (or stern) lifts to match: the angle follows the tilt all the
//   time, a little tilt a little lift, on the water and in the air.
// - Drag a thumb sideways and the boat spins round the paddler, with the paddler's body as the
//   axle (head to bum): half a turn swaps the ends. Level, that's a flat spin; with the bow
//   tilted up, the ends swing up and over, the way a blunt or a cartwheel goes.
//
// What it's called (on flat water a spin just turns the boat, and scores nothing):
// - In a hole or on a wave: tilted up, one end swapped is a blunt, two or more a cartwheel;
//   level, a flatspin (180 or 360).
// - In the air: half a turn is an air blunt (a Pan-Am with the bow tilted up), a whole one a
//   helix, one and a half or more a McNasty.
//
// Pitch (the tilt's lift) is + bow up; the spin (`wheel`) is round the paddler's spine. Both in
// radians; the spin isn't wrapped.

export interface BoatMove { name: TrickName; points: number; duration: number }

/** Where the boat is: flying, in moving water that lets it play (a hole or a wave), or on flat water. */
export type Water = 'air' | 'feature' | 'flat';

const TAU = Math.PI * 2;
const near = (a: number, unit: number) => Math.round(a / unit) * unit;

/** The lift for the device tipped all the way, radians: the boat stood almost on end. */
const MAX_PITCH = 1.35;
/** How quickly the boat follows the tilt (per second): quick, but never a snap. */
const PITCH_FOLLOW = 7;
/** Spinning, in radians a second. */
const WHEEL_RATE = 26;
/** Tilted up at least this far during a spin, it's a blunt or a cartwheel rather than a flatspin. */
const END_LIFT = 0.6;
/** How fast the boat settles once your thumb's off it (half as fast on flat water). */
const SETTLE = 6;
/** Landing this far off level (lift) or off the line of the river (spin) still works. */
const LAND_PITCH = 1.0, LAND_WHEEL = 0.7;

const POINTS = { cartwheelEnd: 300, blunt: 700, flatspin180: 400, flatspin360: 900, airBlunt: 800, panam: 1100, helix: 1400, mcnasty: 1800 };

export class Boat {
  /** The bow lifted (or the stern, negative) by the tilt. */
  pitch = 0;
  /** Spun round the paddler's spine by your thumb. A multiple of π points along the river. */
  wheel = 0;
  /** A thumb is down and dragging the boat round. */
  dragging = false;
  /** Spin asked for by the drag that the boat hasn't made yet. */
  private wheelLeft = 0;
  /** A move on the water in progress: where it started, the most lift, how long. */
  private move: { t: number; wheel0: number; maxP: number } | null = null;
  /** The air in progress: the spin at take-off, the most lift, how long. */
  private air: { wheel0: number; maxP: number; t: number } | null = null;

  /** Drag the boat round by this much (radians). */
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
    this.wheelLeft = 0;
    this.move = null;
    this.air = null;
  }

  /** Tipped, spinning or being dragged round: the boat is doing something. */
  get busy(): boolean {
    return Math.abs(this.pitch) > 0.35 || Math.abs(this.wheel - near(this.wheel, Math.PI)) > 0.35 || this.dragging || Math.abs(this.wheelLeft) > 0.05;
  }

  /** Step the boat; `tilt` is how far the device is tipped, -1 to 1. Returns any move finished on the water. */
  step(dt: number, tilt: number, water: Water): BoatMove[] {
    // The lift follows the tilt.
    this.pitch += (tilt * MAX_PITCH - this.pitch) * (1 - Math.exp(-dt * PITCH_FOLLOW));

    // The spin follows the thumb. Let go and it settles pointing along the river: on flat water
    // the current swings it back round to face downstream.
    const d = Math.max(-WHEEL_RATE * dt, Math.min(WHEEL_RATE * dt, this.wheelLeft));
    this.wheel += d;
    this.wheelLeft -= d;
    if (!this.dragging && Math.abs(this.wheelLeft) < 0.02) {
      this.wheelLeft = 0;
      const home = water === 'flat' ? near(this.wheel, TAU) : near(this.wheel, Math.PI);
      this.wheel += (home - this.wheel) * (1 - Math.exp(-dt * (water === 'flat' ? SETTLE / 2 : SETTLE)));
    }

    if (water === 'air') {
      const a = this.air;
      if (a) { a.t += dt; a.maxP = Math.max(a.maxP, Math.abs(this.pitch)); }
      return [];
    }
    if (water === 'flat') { this.move = null; return []; }
    // In a hole or on a wave: a move starts once the boat spins, and ends when it's settled.
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
    if (!ends) return [];
    if (m.maxP < END_LIFT) return [ends >= 2 ? { name: 'Flatspin 360', points: POINTS.flatspin360, duration: m.t } : { name: 'Flatspin 180', points: POINTS.flatspin180, duration: m.t }];
    if (ends >= 2) return [{ name: 'Cartwheel', points: POINTS.cartwheelEnd * ends, duration: m.t }];
    return [{ name: 'Blunt', points: POINTS.blunt, duration: m.t }];
  }

  /**
   * Back on the water. Stood up on an end, or landing across the current mid-spin: over you go
   * (ok false). Otherwise the boat lands and you get whatever the air was.
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
    if (H >= 3) return { ok: true, moves: [{ name: 'McNasty', points: POINTS.mcnasty + (H - 3) * POINTS.helix / 2, duration: t }] };
    if (H === 2) return { ok: true, moves: [{ name: 'Helix', points: POINTS.helix, duration: t }] };
    if (H === 1) return { ok: true, moves: [a.maxP >= END_LIFT ? { name: 'Pan-Am', points: POINTS.panam, duration: t } : { name: 'Air Blunt', points: POINTS.airBlunt, duration: t }] };
    return { ok: true, moves: [] };
  }
}
