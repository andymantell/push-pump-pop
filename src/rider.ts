import { Track, Pit, Rail, railY, Loop, LOOP_SHIFT } from './track';

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
/** Grinding slows you a little more than rolling. */
const GRIND_FRICTION = 0.35;
const GRIND_POINTS = 200;
const GRIND_POINTS_PER_SEC = 700;
/** How far above a rail you can pass on the way down and still lock on to it (arcade magnet). */
const GRIND_CATCH = 0.3;
/** Rolling friction on the loop is a bit higher: it's a tight curve. */
const LOOP_FRICTION = 0.3;
const LOOP_POINTS = 1000;
/** Half pipe start: standing on the coping, nose up over the pipe. */
const PERCH_ANGLE = 0.3;
/** How far over the coping the board sits while perched, and how long dropping in takes. */
const PERCH_OVER = 0.3;
const DROP_TIME = 0.2;
/** Dropping in gives you a shove down the wall, so the first pass already gets a little air. */
const DROP_SPEED = 4;
/** Rail assist: an ollie this many seconds before a rail starts hops you onto it. */
const RAIL_REACH = 0.7;
/** ...as long as there's this much rail left to land on. */
const RAIL_ROOM = 1.2;

export type GrabName = 'Indy' | 'Melon' | 'Nosegrab' | 'Tailgrab';
export type SpinName = 'FS 180' | 'BS 180' | 'FS 360' | 'BS 360';
export type FlipName = 'Backflip' | 'Frontflip';
/** Manuals on a skateboard, presses on a snowboard: nose up first. */
export type ManualName = 'Manual' | 'Nose Manual' | 'Tail Press' | 'Nose Press';
export type GrindName = '50-50' | 'Boardslide' | '5-0' | 'Nosegrind';
export type LoopName = 'Loop';
type BoardTrick = 'Ollie' | 'Kickflip' | 'Heelflip' | 'Pop Shove-it' | 'BS Shifty' | 'FS Shifty' | 'Tuck Knee';
export type TrickName = BoardTrick | GrabName | SpinName | FlipName | ManualName | GrindName | LoopName;
/** Tilt of the device: +1 nose up (manual, backflip), -1 nose down (nose manual, frontflip). */
export type Lean = -1 | 0 | 1;
export type Swipe = 'up' | 'down' | 'left' | 'right';

export interface Trick {
  name: TrickName;
  duration: number;
  points: number;
  /** Board rotation axis: 'flip' spins along the board, 'spin' around vertical. */
  axis: 'none' | 'flip' | 'spin' | 'grab' | 'body' | 'manual' | 'shifty' | 'tuck' | 'grind' | 'loop';
  dir: 1 | -1;
}

export const TRICKS: Record<BoardTrick, Trick> = {
  'Ollie': { name: 'Ollie', duration: 0, points: 100, axis: 'none', dir: 1 },
  'Kickflip': { name: 'Kickflip', duration: 0.42, points: 500, axis: 'flip', dir: 1 },
  'Heelflip': { name: 'Heelflip', duration: 0.42, points: 500, axis: 'flip', dir: -1 },
  'Pop Shove-it': { name: 'Pop Shove-it', duration: 0.4, points: 400, axis: 'spin', dir: 1 },
  // Snowboard: your feet are strapped in, so the board twists or tucks up with you.
  'BS Shifty': { name: 'BS Shifty', duration: 0.42, points: 450, axis: 'shifty', dir: -1 },
  'FS Shifty': { name: 'FS Shifty', duration: 0.42, points: 450, axis: 'shifty', dir: 1 },
  'Tuck Knee': { name: 'Tuck Knee', duration: 0.45, points: 400, axis: 'tuck', dir: 1 },
};

/** Flip-side swipes while grinding: change grind. */
const SWIPE_GRIND: Record<Exclude<Swipe, 'up'>, GrindName> = {
  left: 'Boardslide',
  right: 'Nosegrind',
  down: '5-0',
};
/** The fancier grinds are worth more than a plain 50-50. */
const GRIND_STYLE_POINTS: Record<GrindName, number> = { '50-50': 1, 'Boardslide': 1.2, '5-0': 1.3, 'Nosegrind': 1.4 };

/** Flip-side swipes on a snowboard, where flipping the board out from under you can't happen. */
const SWIPE_TRICK_SNOW: Record<Swipe, BoardTrick> = {
  up: 'Ollie',
  left: 'BS Shifty',
  right: 'FS Shifty',
  down: 'Tuck Knee',
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
  grind?(rail: Rail): void;
  /** Entered a loop (done false), or came out of it (true). */
  loop?(done: boolean): void;
  pump(good: boolean): void;
  fall(): void;
}

export interface RiderOptions {
  /** Rolling friction multiplier (ice < 1). */
  friction: number;
  maxSpeed: number;
  /** Half pipe: no pushing, and airs off the lips always come back in. */
  pipe?: boolean;
  /** Snowboard: strapped-in tricks and presses instead of flips and manuals. */
  snow?: boolean;
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
  /** Counts pops off the ground or a rail, and the height popped from, for the ollie animation. */
  pops = 0;
  popY = 0;
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
  private manualBlocked = false;
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

  /** Grind in progress: the rail, and how long you've been on it. */
  grind: { rail: Rail; t: number; style: GrindName } | null = null;
  /** Depth: 0 on the riding line, the rail's z while grinding. */
  z = 0;
  /** Loop in progress, and how far round (radians from the bottom). */
  loop: { L: Loop; phi: number } | null = null;
  /** Fell off a loop: tumbling down inside it, landing on the ground. */
  loopFall = false;

  /** Waiting on the coping of a half pipe for a tap to drop in. */
  perched = false;
  /** Dropping in: how far through leaning onto the wall (0 to 1), or -1. */
  dropT = -1;
  private lipX = 0;

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
    this.grind = null;
    this.loop = null;
    this.loopFall = false;
    this.z = 0;
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
    this.grind = null;
    this.loop = null;
    this.loopFall = false;
    this.z = 0;
    this.clearBody();
    this.boardYaw = 0;
    this.airTime = 0;
    this.pumpTimer = 0;
    this.falling = false;
    this.perched = false;
    this.dropT = -1;
  }

  /** Stand on the coping of the first wall, tail on the deck, ready to drop in. */
  perch() {
    const tr = this.track;
    let x = 0;
    while (x < tr.length && tr.height(x) > tr.maxY - 0.005) x += 0.01;
    this.lipX = x;
    this.x = x + PERCH_OVER;
    this.y = tr.maxY + PERCH_OVER * Math.sin(PERCH_ANGLE);
    this.v = 0;
    this.vx = 0;
    this.vy = 0;
    this.grounded = true;
    this.angle = PERCH_ANGLE;
    this.perched = true;
  }

  /** Half pipe walls go vertical at the lips and are meant to be ridden. */
  private get wall() { return this.opts.pipe ? Infinity : WALL_SLOPE; }

  get bailing() { return this.bailTimer > 0; }
  get speed() { return this.grounded || this.grind || this.loop ? Math.abs(this.v) : Math.hypot(this.vx, this.vy); }

  pump() {
    // On the coping: lean forward and drop in.
    if (this.perched) { this.perched = false; this.dropT = 0; return; }
    if (this.bailing || this.dropT >= 0) return;
    this.pumpTimer = PUMP_TIME;
    if (this.grounded) {
      const s = Math.sin(Math.atan(this.track.slope(this.x))) * Math.sign(this.v || 1);
      this.ev.pump(s < -0.08);
    }
  }

  swipe(dir: Swipe) {
    if (this.perched || this.dropT >= 0) return;
    if (this.bailing || this.grab) return;
    // On a rail the flip-side swipes change how you grind it (up still ollies off).
    if (this.grind && dir !== 'up') {
      const style = SWIPE_GRIND[dir];
      if (style === this.grind.style) return;
      const rail = this.grind.rail;
      this.endGrind();
      this.grind = { rail, t: 0, style };
      return;
    }
    const name = (this.opts.snow ? SWIPE_TRICK_SNOW : SWIPE_TRICK)[dir];
    if (!name) return;
    const canPop = this.grounded || this.grind !== null || (!this.opts.pipe && this.timeSinceGround < COYOTE_TIME && !this.ollied);
    if (canPop) {
      // An ollie with a rail coming up hops you straight onto it.
      if (!(name === 'Ollie' && this.railHop())) this.pop();
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
    if (this.perched || this.dropT >= 0) return;
    if (this.bailing || this.spin) return;
    const canPop = this.grounded || this.grind !== null || (!this.opts.pipe && this.timeSinceGround < COYOTE_TIME && !this.ollied);
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
    if (l === 0) { this.leanArmed = true; this.manualBlocked = false; }
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

  private get grindSlope() {
    const r = this.grind!.rail;
    return (r.y1 - r.y0) / (r.x1 - r.x0);
  }

  /** Points the grind in progress is worth so far. */
  get grindPoints() {
    return this.grind ? Math.round((GRIND_POINTS + GRIND_POINTS_PER_SEC * this.grind.t) * GRIND_STYLE_POINTS[this.grind.style] / 10) * 10 : 0;
  }

  /** Riding round a loop: gravity along the curve, and fall off the top if too slow. */
  private stepLoop(dt: number) {
    const lp = this.loop!, L = lp.L;
    this.v -= (GRAVITY * Math.sin(lp.phi) + LOOP_FRICTION * this.opts.friction + AIR_DRAG * this.v * this.v) * dt;
    lp.phi += (this.v / L.r) * dt;
    this.x = L.x + L.r * Math.sin(lp.phi);
    this.y = L.y + L.r - L.r * Math.cos(lp.phi);
    this.angle = lp.phi;
    // The loop drifts back on the track as it goes round, so the exit clears the entry.
    this.z = -LOOP_SHIFT * Math.min(1, lp.phi / (Math.PI * 2));
    if (lp.phi >= Math.PI * 2) {
      // Round! Back on the flat, past the entry.
      this.loop = null;
      this.x = L.x + 0.02;
      this.y = this.track.height(this.x);
      this.angle = 0;
      this.grounded = true;
      this.ev.loop?.(true);
      this.ev.trick({ name: 'Loop', duration: 0, points: LOOP_POINTS, axis: 'loop', dir: 1 });
      return;
    }
    // Too slow to stay on (the curve can't hold you up), or rolling back: you fall off.
    if (this.v * this.v / L.r < -GRAVITY * Math.cos(lp.phi) || this.v <= 0) {
      this.loop = null;
      this.vx = this.v * Math.cos(lp.phi);
      this.vy = this.v * Math.sin(lp.phi);
      this.grounded = false;
      this.loopFall = true;
      this.falling = true;
      // Pick up past the loop, as you would past a gap.
      this.fallPit = { x0: L.x, x1: L.x, lipY: L.y, landY: L.y, floorY: L.y };
      this.current = null;
      this.grab = null;
      this.spin = null;
      this.flipping = false;
      this.ev.fall();
    }
  }

  private endGrind() {
    if (!this.grind) return;
    const points = this.grindPoints, t = this.grind.t, style = this.grind.style;
    this.grind = null;
    // Barely touched it: no grind.
    if (t < 0.12) return;
    this.ev.trick({ name: style, duration: t, points, axis: 'grind', dir: 1 });
  }

  /** Come down onto a rail: lock into a grind, finishing any trick that's nearly done. */
  private catchRail(rail: Rail) {
    const almost = (!this.current || this.trickT >= this.current.duration * 0.8)
      && (!this.spin || this.spinProgress >= 0.8) && !this.grab && !this.flipping;
    // Mid-trick you can't stand on it: you pass by the rail instead.
    if (!almost) return;
    // A flip or spin that's nearly round finishes on the rail (see the grind step).
    const th = Math.atan((rail.y1 - rail.y0) / (rail.x1 - rail.x0));
    const dir = Math.sign(this.vx) || 1;
    // Keep your forward speed, like a clean landing.
    this.v = dir * Math.max((this.vx * Math.cos(th) + this.vy * Math.sin(th)) * dir, Math.abs(this.vx) * LAND_KEEP);
    this.y = railY(rail, this.x);
    this.angle = th;
    this.held = null;
    this.ollied = false;
    this.grind = { rail, t: 0, style: '50-50' };
    this.ev.grind?.(rail);
  }

  /** Swipe on the grab side of the screen: pop if on the ground, then grab while held. */
  grabSwipe(dir: Swipe) {
    if (this.perched || this.dropT >= 0) return;
    if (this.bailing || this.grab) return;
    this.held = dir;
    this.heldT = 0;
    const canPop = this.grounded || this.grind !== null || (!this.opts.pipe && this.timeSinceGround < COYOTE_TIME && !this.ollied);
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

  /**
   * Rail assist: by the time you've seen a rail, swiped and flown a full ollie, you'd only
   * catch its very end. So an ollie on the ground with a rail starting within RAIL_REACH
   * seconds ahead (or one alongside with room left) is a short, quick hop that comes down
   * onto the rail near its start. Returns false if there's no rail to hop onto.
   */
  private railHop(): boolean {
    if (!this.grounded || this.opts.pipe || this.v < 2) return false;
    const rail = this.track.rails.find((r) => r.x0 - this.x < this.v * RAIL_REACH && this.x < r.x1 - RAIL_ROOM);
    if (!rail) return false;
    const y0 = this.y;
    // Come down a little way along the rail, or a quick hop ahead if you're already beside it:
    // the first spot far enough on that you'd be on your way down when you get there.
    let xt = Math.max(rail.x0 + 0.4, this.x + this.v * 0.2);
    const T = () => (xt - this.x) / this.v;
    while (xt < rail.x1 - RAIL_ROOM && railY(rail, xt) - y0 > GRAVITY * T() * T() / 2 * 0.7) xt += 0.1;
    if (xt >= rail.x1 - RAIL_ROOM) return false;
    const t = T();
    this.vx = this.v;
    this.vy = (railY(rail, xt) - y0 + GRAVITY * t * t / 2) / t;
    this.popY = this.y;
    this.pops++;
    this.y += 0.02;
    this.leaveGround();
    this.ollied = true;
    return true;
  }

  private pop() {
    if (this.grind) {
      // Ollie off the rail.
      const th = Math.atan(this.grindSlope);
      this.vx = this.v * Math.cos(th);
      this.vy = this.v * Math.sin(th) + OLLIE_POP;
      this.popY = this.y;
      this.pops++;
      this.y += 0.02;
      this.endGrind();
      this.leaveGround();
    } else if (this.grounded && this.opts.pipe && Math.abs(this.track.slope(this.x)) > 0.6) {
      // On a steep wall an ollie would throw you off it: give a kick up the wall instead.
      this.v += Math.sign(this.v || 1) * 1.5;
    } else if (this.grounded) {
      const th = Math.atan(this.track.slope(this.x));
      // Pop straight up: tipping the pop back off a kicker face would stall you mid-jump.
      this.vx = this.v * Math.cos(th);
      this.vy = this.v * Math.sin(th) + OLLIE_POP * Math.cos(th);
      this.popY = this.y;
      this.pops++;
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
    if (this.perched) return;
    if (this.dropT >= 0) { this.stepDropIn(dt); return; }
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
      // Off a loop there's ground to land on: lie there until the respawn.
      if (this.loopFall && this.y < tr.height(this.x)) { this.y = tr.height(this.x); this.vx = 0; this.vy = 0; }
      return;
    }

    if (this.loop) { this.stepLoop(dt); return; }
    this.z += ((this.grind ? this.grind.rail.z : 0) - this.z) * Math.min(1, dt * 14);

    if (this.grind) {
      const rail = this.grind.rail;
      const th = Math.atan(this.grindSlope);
      const dir = Math.sign(this.v) || 1;
      this.timeSinceGround = 0;
      this.v += (-GRAVITY * Math.sin(th) - dir * (GRIND_FRICTION * this.opts.friction + AIR_DRAG * this.v * this.v)) * dt;
      this.x += this.v * Math.cos(th) * dt;
      this.grind.t += dt;
      this.angle = th;
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
      if (this.spin) {
        this.spin.t += dt;
        if (this.spin.t >= this.spinDuration) this.finishSpin();
      }
      if (this.x > rail.x1 || this.x < rail.x0 || Math.abs(this.v) < 1) {
        // Off the end of the rail (or stalled on it): drop off and fly on.
        this.y = railY(rail, Math.max(rail.x0, Math.min(rail.x1, this.x)));
        this.vx = this.v * Math.cos(th);
        this.vy = this.v * Math.sin(th);
        this.endGrind();
        this.leaveGround();
        this.ollied = false;
      } else {
        this.y = railY(rail, this.x);
      }
      return;
    }

    if (this.grounded) {
      this.timeSinceGround = 0;
      const k = tr.slope(this.x);
      // Tilted on gentle ground: balance on two wheels.
      // Too slow and you'd stall without pushing, so it drops back onto four wheels.
      // Once it drops, level out before the next one, so it can't flicker on and off.
      const want: ManualName | null = this.lean && !this.manualBlocked && !this.bailing && Math.abs(k) < MANUAL_SLOPE && (this.opts.pipe || Math.abs(this.v) > MIN_PUSH_SPEED * 0.8)
        ? (this.lean > 0 ? (this.opts.snow ? 'Tail Press' : 'Manual') : (this.opts.snow ? 'Nose Press' : 'Nose Manual')) : null;
      if (want !== this.manual) {
        if (this.manual && this.lean) this.manualBlocked = true;
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

      const before = this.x;
      this.x += this.v * cos * dt;
      this.y = tr.height(this.x);
      this.angle = th;
      // Rolled into a loop: ride round it.
      const L = this.v > 0 && !this.bailing ? tr.loops.find((l) => before < l.x && this.x >= l.x) : undefined;
      if (L) {
        this.endManual();
        this.manual = null;
        this.x = L.x;
        this.loop = { L, phi: 0 };
        this.grounded = false;
        this.ev.loop?.(false);
        return;
      }
      if (this.opts.pipe && this.y >= tr.maxY - 1e-3 && Math.abs(k) < 0.05) {
        // Never ride out onto the deck of a half pipe: turn back at the lip.
        this.x -= this.v * cos * dt * 2;
        this.y = tr.height(this.x);
        this.v = -this.v * 0.5;
      }
    } else {
      this.timeSinceGround += dt;
      this.airTime += dt;
      const px = this.x, py = this.y;
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

      // Coming down onto a rail: grind it.
      // Only with some rail left ahead: catching the very end would just flick you on and off.
      const ahead = (rl: Rail) => (this.vx >= 0 ? rl.x1 - this.x : this.x - rl.x0) > 0.6;
      const rail = this.vy < 0 && !this.falling ? tr.railAt(this.x) : null;
      if (rail && ahead(rail) && py >= railY(rail, px) - 0.05 && this.y <= railY(rail, this.x) + GRIND_CATCH && this.y > tr.height(this.x)) {
        this.catchRail(rail);
        if (this.grind) return;
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
      this.grind = null;
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

  /** Tip the nose down onto the wall, then roll away down it. */
  private stepDropIn(dt: number) {
    const tr = this.track;
    this.dropT = Math.min(1, this.dropT + dt / DROP_TIME);
    const e = this.dropT * this.dropT;
    // Tip forward over the coping onto the top of the wall, already moving, then ride away.
    const x0 = this.lipX + PERCH_OVER, x1 = this.lipX + 0.06;
    const y0 = tr.maxY + PERCH_OVER * Math.sin(PERCH_ANGLE);
    const th = Math.atan(tr.slope(x1));
    this.x = x0 + (x1 - x0) * e;
    this.y = y0 + (tr.height(x1) - y0) * e;
    this.angle = PERCH_ANGLE + (th - PERCH_ANGLE) * e;
    if (this.dropT >= 1) {
      this.dropT = -1;
      this.x = x1;
      this.y = tr.height(x1);
      this.v = DROP_SPEED;
      // Leaning into the drop works like a short pump down the wall.
      this.pumpTimer = PUMP_TIME * 0.5;
    }
  }


  /** 0..1 progress of the current trick, for animation. */
  get trickProgress() {
    return this.current ? Math.min(1, this.trickT / this.current.duration) : 0;
  }
}
