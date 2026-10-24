import { Track, Pit } from './track';

// Arcade physics for a rider on a 2D height profile.

export const GRAVITY = 14;
const ROLL_FRICTION = 0.18;
const AIR_DRAG = 0.006;
const PUMP_TIME = 0.55;
const PUMP_ACCEL = 9;
const MIN_PUSH_SPEED = 4.5;
const MAX_SPEED = 17;
const OLLIE_POP = 5.6;
const COYOTE_TIME = 0.14;
const BAIL_TIME = 1.3;
/** Arcade grip: the board sticks to convex ground more than real gravity would allow. */
const STICK = 2.2;
/** Share of forward speed always kept on a clean landing. */
const LAND_KEEP = 0.9;
/** Steeper than this is a wall (a drop or gap edge), not something you ride. */
const WALL_SLOPE = 1.5;
/** Grace after take-off before touching the ground counts as a landing. */
const TAKEOFF_TIME = 0.06;

export type GrabName = 'Indy' | 'Melon' | 'Nosegrab' | 'Tailgrab';
export type SpinName = 'FS 180' | 'BS 180' | 'FS 360' | 'BS 360';
export type FlipName = 'Backflip' | 'Frontflip';
export type ManualName = 'Manual' | 'Nose Manual';
export type TrickName = 'Ollie' | 'Kickflip' | 'Heelflip' | 'Pop Shove-it' | GrabName | SpinName | FlipName | ManualName;
/** Tilt of the device: +1 nose up (manual, backflip), -1 nose down (nose manual, frontflip). */
export type Lean = -1 | 0 | 1;
export type Swipe = 'up' | 'down' | 'left' | 'right';

export interface Trick {
  name: TrickName;
  duration: number;
  points: number;
  /** Board rotation axis: 'flip' spins along the board, 'spin' around vertical. */
  axis: 'none' | 'flip' | 'spin' | 'grab' | 'body' | 'manual';
  dir: 1 | -1;
}

export const TRICKS: Record<'Ollie' | 'Kickflip' | 'Heelflip' | 'Pop Shove-it', Trick> = {
  'Ollie': { name: 'Ollie', duration: 0, points: 100, axis: 'none', dir: 1 },
  'Kickflip': { name: 'Kickflip', duration: 0.42, points: 500, axis: 'flip', dir: 1 },
  'Heelflip': { name: 'Heelflip', duration: 0.42, points: 500, axis: 'flip', dir: -1 },
  'Pop Shove-it': { name: 'Pop Shove-it', duration: 0.4, points: 400, axis: 'spin', dir: 1 },
};

/** Swipe and keep holding: grab the board until you let go. */
const SWIPE_GRAB: Record<Swipe, GrabName> = {
  up: 'Indy',
  down: 'Melon',
  left: 'Nosegrab',
  right: 'Tailgrab',
};
/** Hold this long after a grab swipe before the grab starts, so a quick flick is just an ollie. */
const GRAB_HOLD = 0.08;
const GRAB_POINTS = 250;
const GRAB_POINTS_PER_SEC = 900;

/** Body spins: a swipe across the bottom of the screen. Right is frontside. */
const SPIN_TIME = 0.42;
const SPIN_POINTS = { 180: 400, 360: 900 };
/** Body flips from tilting in the air: one full turn takes this long. */
const FLIP_TIME = 0.75;
const FLIP_POINTS = 1200;
/** Landing this far into a flip still counts; less than FLIP_SAFE is just a wobble. */
const FLIP_LAND = 0.85;
const FLIP_SAFE = 0.12;
const MANUAL_POINTS = 100;
const MANUAL_POINTS_PER_SEC = 450;
/** Manuals only hold on gentle ground. */
const MANUAL_SLOPE = 0.45;

const SWIPE_TRICK: Record<Swipe, keyof typeof TRICKS | null> = {
  up: 'Ollie',
  left: 'Kickflip',
  right: 'Heelflip',
  down: 'Pop Shove-it',
};

export interface RiderEvents {
  trick(t: Trick): void;
  land(info: { airTime: number; smooth: boolean; hadTricks: boolean; peakY: number }): void;
  bail(): void;
  grab?(name: GrabName): void;
  manual?(name: ManualName): void;
  pump(good: boolean): void;
  fall(): void;
}

export interface RiderOptions {
  /** Rolling friction multiplier (ice < 1). */
  friction: number;
  maxSpeed: number;
  /** Half pipe: no pushing, and airs off the lips always come back in. */
  pipe?: boolean;
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
  /** Highest point of the current or last air. */
  peakY = 0;
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
  /** Finger still down after a swipe, and for how long. */
  held: Swipe | null = null;
  heldT = 0;
  /** Grab in progress, and how long it has been held. */
  grab: GrabName | null = null;
  grabT = 0;
  /** Body spin in progress: direction (+1 frontside), size in degrees, and time. */
  spin: { dir: 1 | -1; deg: 180 | 360; t: number } | null = null;
  /** Facing from completed spins (0 or PI: riding fakie), for visuals. */
  bodyYaw = 0;
  /** Device tilt, and whether it has been back to level since take-off. */
  lean: Lean = 0;
  private leanArmed = false;
  /** Body flip in progress (+1 backflip), and how far round it is in turns. */
  flipDir: 1 | -1 = 1;
  flipT = 0;
  flipping = false;
  /** Manual in progress and how long it has been held. */
  manual: ManualName | null = null;
  manualT = 0;
  /** Spin of the board from completed shove-its, kept for visuals. */
  boardYaw = 0;
  /** Smoothed values for animation. */
  crouch = 0;

  falling = false;
  /** The gap we last fell into. */
  fallPit: Pit | null = null;
  opts: RiderOptions = { friction: 1, maxSpeed: MAX_SPEED };

  constructor(public track: Track, private ev: RiderEvents) {
    this.reset();
  }

  /** Put the rider back on the track at x, rolling. */
  respawn(x: number, speed: number) {
    this.x = x;
    this.y = this.track.height(x);
    this.v = speed;
    this.grounded = true;
    this.falling = false;
    this.current = null;
    this.grab = null;
    this.held = null;
    this.clearBody();
    this.bailTimer = 0;
    this.boardYaw = 0;
    this.angle = Math.atan(this.track.slope(x));
  }

  reset() {
    this.x = this.track.startX;
    this.y = this.track.height(this.x);
    this.v = 3;
    this.grounded = true;
    this.angle = Math.atan(this.track.slope(this.x));
    this.bailTimer = 0;
    this.current = null;
    this.grab = null;
    this.held = null;
    this.clearBody();
    this.boardYaw = 0;
    this.airTime = 0;
    this.pumpTimer = 0;
    this.falling = false;
  }

  /** Half pipe walls go vertical at the lips and are meant to be ridden. */
  private get wall() { return this.opts.pipe ? Infinity : WALL_SLOPE; }

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
    if (this.bailing || this.grab) return;
    const name = SWIPE_TRICK[dir];
    if (!name) return;
    const canPop = this.grounded || (!this.opts.pipe && this.timeSinceGround < COYOTE_TIME && !this.ollied);
    if (canPop && (name === 'Ollie' || name === 'Kickflip' || name === 'Heelflip' || name === 'Pop Shove-it')) {
      this.pop();
      if (name === 'Ollie') { this.ev.trick(TRICKS.Ollie); return; }
    }
    if (name === 'Ollie') return;
    if (this.grounded || this.current) return;
    this.current = TRICKS[name];
    this.trickT = 0;
  }

  private clearBody() {
    this.spin = null;
    this.bodyYaw = 0;
    this.flipping = false;
    this.flipT = 0;
    this.manual = null;
    this.lean = 0;
  }

  /** Swipe across the bottom of the screen: spin the body, popping first if on the ground. */
  spinSwipe(dir: 'left' | 'right') {
    if (this.bailing || this.spin) return;
    const canPop = this.grounded || (!this.opts.pipe && this.timeSinceGround < COYOTE_TIME && !this.ollied);
    if (canPop) this.pop();
    if (this.grounded) return;
    this.spin = { dir: dir === 'right' ? 1 : -1, deg: 180, t: 0 };
  }

  /** The spin swipe kept going: make it a 360 if there's still time. */
  spinMore() {
    if (this.spin && this.spin.deg === 180 && this.spin.t < SPIN_TIME * 0.7) this.spin.deg = 360;
  }

  /** 0..1 progress of the body spin. */
  get spinProgress() {
    return this.spin ? Math.min(1, this.spin.t / this.spinDuration) : 0;
  }

  private get spinDuration() {
    return this.spin && this.spin.deg === 360 ? SPIN_TIME * 1.7 : SPIN_TIME;
  }

  private finishSpin() {
    const sp = this.spin!;
    if (sp.deg === 180) this.bodyYaw = this.bodyYaw ? 0 : Math.PI;
    this.spin = null;
    this.tricksThisAir++;
    const name = `${sp.dir > 0 ? 'FS' : 'BS'} ${sp.deg}` as SpinName;
    this.ev.trick({ name, duration: SPIN_TIME, points: SPIN_POINTS[sp.deg], axis: 'body', dir: sp.dir });
  }

  /** Device tilt changed. */
  setLean(l: Lean) {
    if (l === this.lean) return;
    this.lean = l;
    if (l === 0) this.leanArmed = true;
  }

  private endManual() {
    if (!this.manual) return;
    const name = this.manual;
    const points = this.manualPoints;
    this.manual = null;
    // Too short to count as a manual: a wobble.
    if (this.manualT < 0.25) return;
    this.ev.trick({ name, duration: this.manualT, points, axis: 'manual', dir: 1 });
  }

  get manualPoints() {
    return this.manual ? Math.round((MANUAL_POINTS + MANUAL_POINTS_PER_SEC * this.manualT) / 10) * 10 : 0;
  }

  /** Body pitch from a flip in progress, radians (+ is nose up / backwards). */
  get flipAngle() {
    return this.flipping ? this.flipDir * this.flipT * Math.PI * 2 : 0;
  }

  /** Swipe on the grab side of the screen: pop if on the ground, then grab while held. */
  grabSwipe(dir: Swipe) {
    if (this.bailing || this.grab) return;
    this.held = dir;
    this.heldT = 0;
    const canPop = this.grounded || (!this.opts.pipe && this.timeSinceGround < COYOTE_TIME && !this.ollied);
    if (canPop) this.pop();
  }

  /** Finger lifted: let go of any grab and score it. */
  release() {
    this.held = null;
    if (!this.grab) return;
    const name = this.grab;
    const points = Math.round((GRAB_POINTS + GRAB_POINTS_PER_SEC * this.grabT) / 10) * 10;
    this.grab = null;
    this.tricksThisAir++;
    this.ev.trick({ name, duration: this.grabT, points, axis: 'grab', dir: 1 });
  }

  /** Points the grab in progress is worth so far. */
  get grabPoints() {
    return this.grab ? Math.round((GRAB_POINTS + GRAB_POINTS_PER_SEC * this.grabT) / 10) * 10 : 0;
  }

  private pop() {
    if (this.grounded && this.opts.pipe && Math.abs(this.track.slope(this.x)) > 0.6) {
      // On a steep wall an ollie would throw you off it: give a kick up the wall instead.
      this.v += Math.sign(this.v || 1) * 1.5;
    } else if (this.grounded) {
      const th = Math.atan(this.track.slope(this.x));
      // Pop straight up: tipping the pop back off a kicker face would stall you mid-jump.
      this.vx = this.v * Math.cos(th);
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
    this.peakY = this.y;
    if (this.opts.pipe && Math.abs(this.vx) < Math.abs(this.vy)) {
      // Cap pipe airs at about 3 m over the lip so the camera can keep you in view.
      this.vy = Math.min(this.vy, 8.5);
      // Going up past a lip: drift back over the ramp so you land on the wall.
      this.vx = -Math.sign(this.vx) * 0.35;
    }
    this.tricksThisAir = 0;
    this.endManual();
    // A tilt held through take-off doesn't flip you: level out, then tilt.
    this.leanArmed = this.lean === 0;
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

    if (this.falling) {
      // Tumbling into a pit: no collisions until respawn.
      if (this.grounded) { this.vx = this.v * 0.5; this.vy = 0; this.grounded = false; }
      this.vy -= GRAVITY * dt;
      this.x += this.vx * 0.5 * dt;
      this.y += this.vy * dt;
      this.angle -= dt * 3;
      return;
    }

    if (this.grounded) {
      this.timeSinceGround = 0;
      const k = tr.slope(this.x);
      // Tilted on gentle ground: balance on two wheels.
      // Too slow and you'd stall without pushing, so it drops back onto four wheels.
      const want: ManualName | null = this.lean && !this.bailing && Math.abs(k) < MANUAL_SLOPE && (this.opts.pipe || Math.abs(this.v) > MIN_PUSH_SPEED * 0.8)
        ? (this.lean > 0 ? 'Manual' : 'Nose Manual') : null;
      if (want !== this.manual) {
        this.endManual();
        if (want) { this.manual = want; this.manualT = 0; this.ev.manual?.(want); }
      }
      if (this.manual) this.manualT += dt;
      const th = Math.atan(k);
      const sin = Math.sin(th), cos = Math.cos(th);
      const dir = Math.sign(this.v) || 1;

      let a = -GRAVITY * sin;
      a -= dir * (ROLL_FRICTION * this.opts.friction + AIR_DRAG * this.v * this.v);

      if (this.pumpTimer > 0 && !this.bailing) {
        // Pumping pays off on the way down a transition and costs a little on the way up.
        const downhill = -sin * dir;
        let f = Math.max(-0.12, Math.min(1, downhill * 3));
        // Half pipe: pumping through the flat bottom counts too, so it's easy to build height.
        if (this.opts.pipe) f = Math.max(f, Math.abs(sin) < 0.3 ? 0.8 : 0.25);
        a += dir * PUMP_ACCEL * f;
      }

      // Auto push on flat ground when slow, so you never get stuck.
      this.pushing = false;
      if (!this.bailing && !this.manual && !this.opts.pipe && this.v < MIN_PUSH_SPEED) {
        a += 4 + GRAVITY * Math.max(0, sin);
        this.pushing = true;
      }

      this.v += a * dt;
      this.v = Math.max(-this.opts.maxSpeed, Math.min(this.opts.maxSpeed, this.v));

      // The ground falls away faster than gravity can hold us: take off.
      const kappa = -tr.curvature(this.x) / Math.pow(1 + k * k, 1.5);
      // Leave along the face we were riding, not the drop ahead of it.
      const behind = tr.slope(this.x - Math.sign(this.v) * 0.15);
      const face = Math.atan(Math.abs(behind) > this.wall ? k : behind);
      const lookX = this.x + this.v * Math.cos(face) * dt * 3;
      const cliff = tr.height(lookX) < this.y + Math.tan(face) * (lookX - this.x) - 0.15;
      if ((cliff && Math.abs(this.v) > 1) || (kappa > 0 && this.v * this.v * kappa > GRAVITY * cos * STICK && (this.opts.pipe || Math.abs(this.v) > 4))) {
        this.vx = this.v * Math.cos(face);
        this.vy = this.v * Math.sin(face);
        if (this.pumpTimer > 0) this.vy += 1.2; // pumping into a lip pops you a little higher
        this.leaveGround();
        this.ollied = false;
        return;
      }

      this.x += this.v * cos * dt;
      this.y = tr.height(this.x);
      this.angle = th;
      if (this.opts.pipe && this.y >= tr.maxY - 1e-3 && Math.abs(k) < 0.05) {
        // Never ride out onto the deck of a half pipe: turn back at the lip.
        this.x -= this.v * cos * dt * 2;
        this.y = tr.height(this.x);
        this.v = -this.v * 0.5;
      }
    } else {
      this.timeSinceGround += dt;
      this.airTime += dt;
      this.vy -= GRAVITY * dt;
      this.vx -= Math.sign(this.vx) * AIR_DRAG * this.vx * this.vx * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      this.peakY = Math.max(this.peakY, this.y);
      // Visual pitch drifts towards the flight path so landings line up.
      const target = Math.max(-0.9, Math.min(0.9, Math.atan2(this.vy, Math.abs(this.vx)) * 0.75)) * Math.sign(this.vx || 1);
      if (!this.opts.pipe) this.angle += (target - this.angle) * Math.min(1, dt * 3);

      if (this.held) {
        this.heldT += dt;
        // Grab once the board is free of any flip and the finger has stayed down.
        if (!this.grab && !this.current && this.heldT >= GRAB_HOLD) {
          this.grab = SWIPE_GRAB[this.held];
          this.grabT = 0;
          this.ev.grab?.(this.grab);
        }
      }
      if (this.grab) this.grabT += dt;

      if (this.spin) {
        this.spin.t += dt;
        if (this.spin.t >= this.spinDuration) this.finishSpin();
      }

      // Tilt in the air: flip the whole body. Each full turn scores; keep tilting for more.
      if (!this.flipping && this.lean && this.leanArmed && !this.bailing) {
        this.flipping = true;
        this.flipDir = this.lean;
        this.flipT = 0;
      }
      if (this.flipping) {
        this.flipT += dt / FLIP_TIME;
        if (this.flipT >= 1) {
          this.tricksThisAir++;
          this.ev.trick({ name: this.flipDir > 0 ? 'Backflip' : 'Frontflip', duration: FLIP_TIME, points: FLIP_POINTS, axis: 'body', dir: this.flipDir });
          if (this.lean === this.flipDir) this.flipT -= 1;
          else { this.flipping = false; this.flipT = 0; }
        }
      }

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
      const k = tr.slope(this.x);
      // Over the top of a drop or a gap edge: the ground is falling away, so keep flying.
      // Landing here would use the wall's slope and kill (or reverse) the speed.
      const overEdge = k * Math.sign(this.vx || 1) < -this.wall && gy - this.y < 0.4;
      if (this.y <= gy && !overEdge) {
        if (!this.opts.pipe && this.airTime < TAKEOFF_TIME && gy - this.y < 0.4) {
          // Just left the lip and still skimming it: slide along it rather than "landing"
          // on the edge, which would read the drop's slope and throw the speed away.
          this.y = gy;
        } else if (gy - this.y > 0.4) {
          // Hit the face of a ledge: bounce off it.
          this.x -= this.vx * dt * 1.5;
          this.vx = -this.vx * 0.05;
          this.vy = Math.min(this.vy, 0);
        } else {
          // Clipping the top corner of a rising wall lands on the flat beyond it,
          // not on the wall, where you would crawl to a stop.
          const dir = Math.sign(this.vx || 1);
          for (let d = 0; d < 0.4 && Math.abs(tr.slope(this.x)) > this.wall; d += 0.02) this.x += dir * 0.02;
          this.land(tr.height(this.x), Math.atan(tr.slope(this.x)));
        }
      }
    }

    const pit = tr.pitAt(this.x);
    // Too slow to clear a gap: you drop in rather than rocking on the lip.
    const slowAtLip = pit && this.grounded && this.x > pit.x0 - 0.8 && this.x < pit.x0 && this.v < 6;
    if (pit && !this.falling && (slowAtLip || this.y < Math.min(pit.lipY, pit.landY) - 1.6)) {
      this.falling = true;
      this.fallPit = pit;
      this.current = null;
      this.grab = null;
      this.spin = null;
      this.flipping = false;
      this.manual = null;
      this.ev.fall();
    }

    if (this.x < 0.5) { this.x = 0.5; this.v = Math.abs(this.v) * 0.3; this.vx = Math.abs(this.vx) * 0.3; }
  }

  private land(gy: number, th: number) {
    const tang = this.vx * Math.cos(th) + this.vy * Math.sin(th);
    // Angle between the flight line and the ground, ignoring direction.
    const flight = Math.abs(this.vx) < 1e-3 ? Math.PI / 2 : Math.atan(this.vy / this.vx);
    const diff = Math.abs(flight - th);
    this.y = gy;
    this.grounded = true;
    this.angle = th;
    this.held = null;

    const midTrick = this.current !== null && this.trickT < this.current.duration * 0.8;
    // Still holding the board when you touch down: you can't stand on it.
    const grabbing = this.grab !== null;
    this.grab = null;
    const midSpin = this.spin !== null && this.spinProgress < 0.8;
    // Upside down or partway round a flip: no way to land that.
    const midFlip = this.flipping && this.flipT > FLIP_SAFE && this.flipT < FLIP_LAND;
    if (this.flipping && this.flipT >= FLIP_LAND) {
      this.tricksThisAir++;
      this.ev.trick({ name: this.flipDir > 0 ? 'Backflip' : 'Frontflip', duration: FLIP_TIME, points: FLIP_POINTS, axis: 'body', dir: this.flipDir });
    }
    this.flipping = false;
    this.flipT = 0;
    if (this.spin && !midSpin) this.finishSpin();
    this.spin = null;
    if (grabbing || midTrick || midSpin || midFlip || (diff > 1.3 && this.airTime > 0.2 && Math.hypot(this.vx, this.vy) > 7)) {
      this.current = null;
      this.bodyYaw = 0;
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
    // Arcade landing: coming down onto an upslope (the back of a roller, a kicker) would
    // shed most of the speed and feel like hitting a wall, so keep most of the forward speed.
    const dir = Math.sign(this.vx) || 1;
    const kept = Math.max(tang * dir, Math.abs(this.vx) * LAND_KEEP);
    this.v = dir * kept * (smooth ? 1.04 : 1);
    this.ev.land({ airTime: this.airTime, smooth, hadTricks: this.tricksThisAir > 0 || this.ollied, peakY: this.peakY });
    this.ollied = false;
  }

  /** 0..1 progress of the current trick, for animation. */
  get trickProgress() {
    return this.current ? Math.min(1, this.trickT / this.current.duration) : 0;
  }
}
