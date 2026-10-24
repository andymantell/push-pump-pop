import { Track } from './track';

// Arcade physics for a rider on a 2D height profile.

export const GRAVITY = 14;
const ROLL_FRICTION = 0.18;
const AIR_DRAG = 0.0035;
const PUMP_TIME = 0.36;
const PUMP_ACCEL = 10;
const MIN_PUSH_SPEED = 4.5;
const MAX_SPEED = 26;
const OLLIE_POP = 5.6;
const COYOTE_TIME = 0.14;
const BAIL_TIME = 1.3;
/** Arcade grip: the board sticks to convex ground more than real gravity would allow. */
const STICK = 1.8;

export type TrickName = 'Ollie' | 'Kickflip' | 'Heelflip' | 'Pop Shove-it';
export type Swipe = 'up' | 'down' | 'left' | 'right';

export interface Trick {
  name: TrickName;
  duration: number;
  points: number;
  /** Board rotation axis: 'flip' spins along the board, 'spin' around vertical. */
  axis: 'none' | 'flip' | 'spin';
  dir: 1 | -1;
}

export const TRICKS: Record<TrickName, Trick> = {
  'Ollie': { name: 'Ollie', duration: 0, points: 100, axis: 'none', dir: 1 },
  'Kickflip': { name: 'Kickflip', duration: 0.42, points: 500, axis: 'flip', dir: 1 },
  'Heelflip': { name: 'Heelflip', duration: 0.42, points: 500, axis: 'flip', dir: -1 },
  'Pop Shove-it': { name: 'Pop Shove-it', duration: 0.4, points: 400, axis: 'spin', dir: 1 },
};

const SWIPE_TRICK: Record<Swipe, TrickName | null> = {
  up: 'Ollie',
  left: 'Kickflip',
  right: 'Heelflip',
  down: 'Pop Shove-it',
};

export interface RiderEvents {
  trick(t: Trick): void;
  land(info: { airTime: number; smooth: boolean; hadTricks: boolean }): void;
  bail(): void;
  pump(good: boolean): void;
}

export class Rider {
  x = 0;
  y = 0;
  /** Speed along the ground (signed, +x is forward). */
  v = 0;
  vx = 0;
  vy = 0;
  grounded = true;
  /** Board/body pitch in radians. */
  angle = 0;
  airTime = 0;
  timeSinceGround = 0;
  pumpTimer = 0;
  pushPhase = 0;
  pushing = false;
  bailTimer = 0;
  ollied = false;
  tricksThisAir = 0;
  /** Trick in progress: the board is spinning. */
  current: Trick | null = null;
  trickT = 0;
  /** Spin of the board from completed shove-its, kept for visuals. */
  boardYaw = 0;
  /** Smoothed values for animation. */
  crouch = 0;

  constructor(private track: Track, private ev: RiderEvents) {
    this.reset();
  }

  reset() {
    this.x = this.track.startX;
    this.y = this.track.height(this.x);
    this.v = 3;
    this.grounded = true;
    this.angle = Math.atan(this.track.slope(this.x));
    this.bailTimer = 0;
    this.current = null;
    this.boardYaw = 0;
    this.airTime = 0;
    this.pumpTimer = 0;
  }

  get bailing() { return this.bailTimer > 0; }
  get speed() { return this.grounded ? Math.abs(this.v) : Math.hypot(this.vx, this.vy); }

  pump() {
    if (this.bailing) return;
    this.pumpTimer = PUMP_TIME;
    if (this.grounded) {
      const s = Math.sin(Math.atan(this.track.slope(this.x))) * Math.sign(this.v || 1);
      this.ev.pump(s < -0.08);
    }
  }

  swipe(dir: Swipe) {
    if (this.bailing) return;
    const name = SWIPE_TRICK[dir];
    if (!name) return;
    const canPop = this.grounded || (this.timeSinceGround < COYOTE_TIME && !this.ollied);
    if (canPop && (name === 'Ollie' || name === 'Kickflip' || name === 'Heelflip' || name === 'Pop Shove-it')) {
      this.pop();
      if (name === 'Ollie') { this.ev.trick(TRICKS.Ollie); return; }
    }
    if (name === 'Ollie') return;
    if (this.grounded || this.current) return;
    this.current = TRICKS[name];
    this.trickT = 0;
  }

  private pop() {
    if (this.grounded) {
      const th = Math.atan(this.track.slope(this.x));
      this.vx = this.v * Math.cos(th) - OLLIE_POP * Math.sin(th) * 0.5;
      this.vy = this.v * Math.sin(th) + OLLIE_POP * Math.cos(th);
      this.y += 0.02;
      this.leaveGround();
    } else {
      this.vy = Math.max(this.vy, 0) + OLLIE_POP * 0.85;
    }
    this.ollied = true;
  }

  private leaveGround() {
    this.grounded = false;
    this.airTime = 0;
    this.tricksThisAir = 0;
  }

  update(dt: number) {
    const steps = Math.ceil(dt / (1 / 240));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) this.step(h);
  }

  private step(dt: number) {
    const tr = this.track;
    this.pumpTimer = Math.max(0, this.pumpTimer - dt);

    if (this.bailTimer > 0) {
      this.bailTimer -= dt;
      if (this.bailTimer <= 0) {
        this.bailTimer = 0;
        this.boardYaw = 0;
      }
    }

    if (this.grounded) {
      this.timeSinceGround = 0;
      const k = tr.slope(this.x);
      const th = Math.atan(k);
      const sin = Math.sin(th), cos = Math.cos(th);
      const dir = Math.sign(this.v) || 1;

      let a = -GRAVITY * sin;
      a -= dir * (ROLL_FRICTION + AIR_DRAG * this.v * this.v);

      if (this.pumpTimer > 0 && !this.bailing) {
        // Pumping pays off on the way down a transition and costs a little on the way up.
        const downhill = -sin * dir;
        const f = Math.max(-0.35, Math.min(1, downhill * 2.6));
        a += dir * PUMP_ACCEL * f;
      }

      // Auto push on flat ground when slow, so you never get stuck.
      this.pushing = false;
      if (!this.bailing && this.v < MIN_PUSH_SPEED) {
        a += 4 + GRAVITY * Math.max(0, sin);
        this.pushing = true;
      }

      this.v += a * dt;
      this.v = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, this.v));

      // The ground falls away faster than gravity can hold us: take off.
      const kappa = -tr.curvature(this.x) / Math.pow(1 + k * k, 1.5);
      if (kappa > 0 && this.v * this.v * kappa > GRAVITY * cos * STICK && Math.abs(this.v) > 4) {
        this.vx = this.v * cos;
        this.vy = this.v * sin;
        if (this.pumpTimer > 0) this.vy += 1.2; // pumping into a lip pops you a little higher
        this.leaveGround();
        this.ollied = false;
        return;
      }

      this.x += this.v * cos * dt;
      this.y = tr.height(this.x);
      this.angle = th;
    } else {
      this.timeSinceGround += dt;
      this.airTime += dt;
      this.vy -= GRAVITY * dt;
      this.vx -= Math.sign(this.vx) * AIR_DRAG * this.vx * this.vx * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Visual pitch drifts towards the flight path so landings line up.
      const target = Math.max(-0.9, Math.min(0.9, Math.atan2(this.vy, Math.abs(this.vx)) * 0.75)) * Math.sign(this.vx || 1);
      this.angle += (target - this.angle) * Math.min(1, dt * 3);

      if (this.current) {
        this.trickT += dt;
        if (this.trickT >= this.current.duration) {
          const done = this.current;
          if (done.axis === 'spin') this.boardYaw += Math.PI;
          this.current = null;
          this.tricksThisAir++;
          this.ev.trick(done);
        }
      }

      const gy = tr.height(this.x);
      if (this.y <= gy) this.land(gy);
    }

    if (this.x < 0.5) { this.x = 0.5; this.v = Math.abs(this.v) * 0.3; this.vx = Math.abs(this.vx) * 0.3; }
  }

  private land(gy: number) {
    const tr = this.track;
    const th = Math.atan(tr.slope(this.x));
    const tang = this.vx * Math.cos(th) + this.vy * Math.sin(th);
    // Angle between the flight line and the ground, ignoring direction.
    const flight = Math.abs(this.vx) < 1e-3 ? Math.PI / 2 : Math.atan(this.vy / this.vx);
    const diff = Math.abs(flight - th);
    this.y = gy;
    this.grounded = true;
    this.angle = th;

    const midTrick = this.current !== null && this.trickT < this.current.duration * 0.8;
    if (midTrick || (diff > 1.3 && this.airTime > 0.2 && Math.hypot(this.vx, this.vy) > 7)) {
      this.current = null;
      this.v = tang * 0.35;
      this.bailTimer = BAIL_TIME;
      this.ev.bail();
      return;
    }
    if (this.current) {
      // Close enough: count it.
      const done = this.current;
      if (done.axis === 'spin') this.boardYaw += Math.PI;
      this.current = null;
      this.tricksThisAir++;
      this.ev.trick(done);
    }
    const smooth = diff < 0.3 && this.airTime > 0.35;
    this.v = tang * (smooth ? 1.04 : 1);
    this.ev.land({ airTime: this.airTime, smooth, hadTricks: this.tricksThisAir > 0 || this.ollied });
    this.ollied = false;
  }

  /** 0..1 progress of the current trick, for animation. */
  get trickProgress() {
    return this.current ? Math.min(1, this.trickT / this.current.duration) : 0;
  }
}
