// The track is a 2D height profile y = h(x), sampled every DX metres.
// Levels are built from a small set of shape primitives chained end to end.

export const DX = 0.05;

/** Name of a prop model in public/models/props.glb (see art/build_assets.py). */
export type PropKind = string;

/** A gap you must jump. Fall in and you respawn on the far side. */
export interface Pit {
  x0: number;
  x1: number;
  lipY: number;
  landY: number;
  floorY: number;
}

/** Something to grind: a straight bar from (x0, y0) to (x1, y1), at depth z. */
export interface Rail {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  z: number;
  kind: 'rail' | 'ledge' | 'handrail';
}

/** A flight of steps going down from (x0, y0); the ground under it is a straight slope. */
export interface Stairs {
  x0: number;
  y0: number;
  steps: number;
  rise: number;
  run: number;
}

/**
 * A loop-the-loop standing on flat ground: you enter at (x, y) and ride a full circle of
 * radius r, coming out at the same spot a little further back on the track.
 */
export interface Loop {
  x: number;
  y: number;
  r: number;
}

/** How far back on the track a loop's exit is from its entry. */
export const LOOP_SHIFT = 1.1;

/** Rails sit this far back on the track, so you roll past them unless you grind. */
export const RAIL_Z = -0.6;

export function railY(r: Rail, x: number): number {
  return r.y0 + (r.y1 - r.y0) * (x - r.x0) / (r.x1 - r.x0);
}

/**
 * A named place on the track that challenges can point at: 'kicker' lips, roller 'crest's,
 * valley 'lip's (the far edge you ride out over), the tops of 'stairs', and any tag a level adds with sign-like
 * `spot()` calls, such as 'bigair'.
 */
export interface Spot {
  x: number;
  tag: string;
}

/** A low flat box to manual along, from x0 to x1 on its top. */
export interface Pad {
  x0: number;
  x1: number;
}

/** A muddy stretch of ground, from x0 to x1: it drags you back, so pump through it. */
export interface Mud {
  x0: number;
  x1: number;
}

/** A jelly pad from x0 to x1: touch it on the ground and it throws you up at `lift` m/s. */
export interface Bouncer {
  x0: number;
  x1: number;
  lift: number;
}

export interface Prop {
  kind: PropKind;
  x: number;
  z: number;
  scale: number;
  rot: number;
}

export class Track {
  readonly heights: Float32Array;
  readonly length: number;
  readonly finishX: number;
  readonly startX: number;
  readonly props: Prop[];
  readonly signs: { x: number; text: string }[];
  readonly minY: number;
  readonly maxY: number;
  readonly pits: Pit[];
  readonly rails: Rail[];
  readonly stairs: Stairs[];
  readonly loops: Loop[];
  readonly spots: Spot[];
  readonly pads: Pad[];
  readonly mud: Mud[];
  readonly bouncers: Bouncer[];

  constructor(heights: number[], startX: number, finishX: number, props: Prop[], signs: { x: number; text: string }[], pits: Pit[] = [], rails: Rail[] = [], stairs: Stairs[] = [], loops: Loop[] = [], spots: Spot[] = [], pads: Pad[] = [], mud: Mud[] = [], bouncers: Bouncer[] = []) {
    this.mud = mud;
    this.bouncers = bouncers;
    this.spots = spots;
    this.pads = pads;
    this.pits = pits;
    this.rails = rails;
    this.stairs = stairs;
    this.loops = loops;
    this.heights = Float32Array.from(heights);
    this.length = (heights.length - 1) * DX;
    this.startX = startX;
    this.finishX = finishX;
    this.props = props;
    this.signs = signs;
    let lo = Infinity, hi = -Infinity;
    for (const h of heights) { lo = Math.min(lo, h); hi = Math.max(hi, h); }
    this.minY = lo;
    this.maxY = hi;
  }

  height(x: number): number {
    const f = x / DX;
    const n = this.heights.length - 1;
    if (f <= 0) return this.heights[0];
    if (f >= n) return this.heights[n];
    const i = Math.floor(f);
    const t = f - i;
    return this.heights[i] * (1 - t) + this.heights[i + 1] * t;
  }

  /** Height with pits bridged over, for laying scenery. */
  surface(x: number): number {
    for (const p of this.pits) {
      if (x > p.x0 - DX && x < p.x1 + DX) {
        const t = (x - p.x0) / (p.x1 - p.x0);
        return p.lipY + (p.landY - p.lipY) * Math.max(0, Math.min(1, t));
      }
    }
    return this.height(x);
  }

  /** The rail over x, if any. */
  railAt(x: number): Rail | null {
    for (const r of this.rails) if (x >= r.x0 && x <= r.x1) return r;
    return null;
  }

  inMud(x: number): boolean {
    for (const m of this.mud) if (x >= m.x0 && x <= m.x1) return true;
    return false;
  }

  bouncerAt(x: number): Bouncer | null {
    for (const b of this.bouncers) if (x >= b.x0 && x <= b.x1) return b;
    return null;
  }

  pitAt(x: number): Pit | null {
    for (const p of this.pits) if (x > p.x0 - 0.5 && x < p.x1 + 0.5) return p;
    return null;
  }

  /** dh/dx, smoothed over a short window so sample kinks don't jitter. */
  slope(x: number): number {
    const e = 0.08;
    return (this.height(x + e) - this.height(x - e)) / (2 * e);
  }

  /** Second derivative, over a wider window, used to decide when the ground falls away. */
  curvature(x: number): number {
    const e = 0.15;
    return (this.height(x + e) - 2 * this.height(x) + this.height(x - e)) / (e * e);
  }
}

export class TrackBuilder {
  private h: number[] = [];
  private y: number;
  props: Prop[] = [];
  signs: { x: number; text: string }[] = [];
  pits: Pit[] = [];
  rails: Rail[] = [];
  stairSets: Stairs[] = [];
  loops: Loop[] = [];
  spots: Spot[] = [];
  pads: Pad[] = [];
  mudPatches: Mud[] = [];
  bouncers: Bouncer[] = [];

  constructor(startY: number) {
    this.y = startY;
    this.h.push(startY);
  }

  get x(): number { return (this.h.length - 1) * DX; }
  get currentY(): number { return this.y; }

  private run(len: number, f: (t: number) => number): this {
    const n = Math.max(1, Math.round(len / DX));
    const y0 = this.y;
    for (let i = 1; i <= n; i++) this.h.push(y0 + f(i / n));
    this.y = this.h[this.h.length - 1];
    return this;
  }

  flat(len: number): this { return this.run(len, () => 0); }

  /** Smooth S-curve change in height. */
  ease(len: number, dy: number): this {
    return this.run(len, (t) => dy * (1 - Math.cos(Math.PI * t)) / 2);
  }

  /** Concave ramp that gets steeper towards the lip. */
  kicker(len: number, height: number, power = 2.2): this {
    this.run(len, (t) => height * Math.pow(t, power));
    return this.spot('kicker');
  }

  /** Smooth bumps for pumping. */
  rollers(count: number, len: number, amp: number): this {
    for (let i = 0; i < count; i++) {
      this.spots.push({ x: this.x + len / 2, tag: 'crest' });
      this.run(len, (t) => amp * (1 - Math.cos(2 * Math.PI * t)) / 2);
    }
    return this;
  }

  /** A dip that rises back to the same height. */
  valley(len: number, depth: number): this {
    this.run(len, (t) => -depth * (1 - Math.cos(2 * Math.PI * t)) / 2);
    return this.spot('lip');
  }

  /** A gap of `len` with a rail across it at `height` above the lip, starting a little before it. */
  gapRail(len: number, height = 0.6, lead = 6): this {
    this.rails.push({ x0: this.x, y0: this.y + height, x1: this.x + lead + len + 2, y1: this.y + height, z: RAIL_Z, kind: 'rail' });
    return this.flat(lead).pit(len).flat(2);
  }

  /** A valley with a rail bridging it at the height of its rims: grind across or ride through. */
  bridge(len: number, depth: number, height = 0.5): this {
    this.rails.push({ x0: this.x, y0: this.y + height, x1: this.x + len, y1: this.y + height, z: RAIL_Z, kind: 'rail' });
    return this.valley(len, depth);
  }

  /**
   * A low box to manual along: `len` of flat top, `height` up. The edges are long ramps so
   * riding onto it at speed doesn't throw you into the air (where a tilt would be a flip).
   */
  pad(len: number, height = 0.35): this {
    const edge = 10 * height;
    this.ease(edge, height);
    this.pads.push({ x0: this.x, x1: this.x + len });
    return this.flat(len).ease(edge, -height);
  }

  /** A flat muddy patch `len` long. */
  mud(len: number): this {
    return this.muddy((b) => b.flat(len));
  }

  /** Whatever `fn` lays down is muddy, e.g. `muddy((b) => b.rollers(2, 14, 1))`. */
  muddy(fn: (b: this) => void): this {
    const x0 = this.x;
    fn(this);
    this.mudPatches.push({ x0, x1: this.x });
    return this.spot('mud');
  }

  /**
   * A jelly pad `len` long on flat ground: roll onto it (or land on it) and it bounces you up
   * at `lift` m/s, more if you pump as you hit it. Follow it with `land()`, like a kicker.
   */
  bouncer(len = 2.5, lift = 7): this {
    this.spot('bouncer');
    this.bouncers.push({ x0: this.x, x1: this.x + len, lift });
    return this.flat(len);
  }

  /** Near vertical drop (a lip edge). */
  drop(dy: number): this {
    this.y += dy;
    this.h.push(this.y);
    return this;
  }

  /** A gap of `len` metres; the far side is `landDy` higher (negative for lower). */
  pit(len: number, landDy = 0, depth = 10): this {
    const x0 = this.x, lipY = this.y;
    this.drop(-depth).flat(len).drop(depth + landDy);
    this.pits.push({ x0, x1: this.x, lipY, landY: this.y, floorY: lipY - depth });
    return this;
  }

  /** A half pipe: deck, wall down, flat bottom, wall up, deck. Walls are near vertical at the lips. */
  halfpipe(radius = 4.5, flatLen = 5, deck = 6): this {
    const umax = radius * 0.96;
    const H = radius - Math.sqrt(radius * radius - umax * umax);
    this.flat(deck);
    this.run(umax, (t) => {
      const u = umax * (1 - t);
      return radius - Math.sqrt(radius * radius - u * u) - H;
    });
    this.flat(flatLen);
    this.run(umax, (t) => {
      const u = umax * t;
      return radius - Math.sqrt(radius * radius - u * u);
    });
    return this.flat(deck);
  }

  /**
   * A landing ramp after a kicker or gap: a straight slope down that starts right at the
   * top, then curves out flat. Size `len` for the fastest jump (scripts/landings.ts checks
   * it); the slope is `drop / len / 0.7`.
   */
  land(len: number, drop = len * 0.12): this {
    // Straight for 40% of the way, then curving out.
    const a = 0.3, c = 1 / (a + (1 - a) / 2);
    // Off a flat deck (not a gap), round over the top edge so rolling off it slowly is smooth.
    const r = this.pits.some((p) => p.x1 === this.x) ? 0 : Math.min(1.5, len * a) / len, k = drop * c;
    return this.run(len, (t) => -k * (t < r ? t * t / (2 * r) : t < a ? t - r / 2 : a - r / 2 + (t - a) - (t - a) * (t - a) / (2 * (1 - a))) / (1 - r / 2));
  }

  /** A straight slope. */
  ramp(len: number, dy: number): this { return this.run(len, (t) => dy * t); }

  /** A mega ramp roll-in: steepest at the top, curving out flat at the bottom. */
  rollIn(len: number, drop: number): this {
    return this.run(len, (t) => -drop * (1 - (1 - t) * (1 - t)));
  }

  /** One wall of a half pipe on its own, going up, then a deck. Tagged 'qpstart' and 'qp' (the lip). */
  quarterpipe(radius: number, deck = 6): this {
    const umax = radius * 0.96;
    this.spot('qpstart');
    this.run(umax, (t) => {
      const u = umax * t;
      return radius - Math.sqrt(radius * radius - u * u);
    });
    return this.spot('qp').flat(deck);
  }

  /** A flat grind rail `height` above flat ground, `len` long. */
  rail(len: number, height = 0.6): this {
    this.rails.push({ x0: this.x, y0: this.y + height, x1: this.x + len, y1: this.y + height, z: RAIL_Z, kind: 'rail' });
    return this.flat(len);
  }

  /** A rail running down a slope of `dy` (negative) over `len`, `height` above it. */
  downrail(len: number, dy: number, height = 0.6): this {
    this.rails.push({ x0: this.x, y0: this.y + height, x1: this.x + len, y1: this.y + dy + height, z: RAIL_Z, kind: 'rail' });
    return this.ramp(len, dy);
  }

  /** A low box ledge to grind along its edge. */
  ledge(len: number, height = 0.45): this {
    this.rails.push({ x0: this.x, y0: this.y + height, x1: this.x + len, y1: this.y + height, z: RAIL_Z, kind: 'ledge' });
    return this.flat(len);
  }

  /** A flight of steps down, with a handrail to grind. Ride off the top and you jump the set. */
  stairs(steps: number, rise = 0.17, run = 0.32, handrail = true): this {
    const x0 = this.x, y0 = this.y, len = steps * run, drop = steps * rise;
    this.stairSets.push({ x0, y0, steps, rise, run });
    this.spot('stairs');
    // The rail starts out over the top landing so there's room to ollie onto it.
    const lead = 0.5, above = 0.55;
    if (handrail) this.rails.push({ x0: x0 - lead, y0: y0 + above + lead * drop / len, x1: x0 + len, y1: y0 - drop + above, z: RAIL_Z, kind: 'handrail' });
    return this.run(len, (t) => -drop * t);
  }

  /** A loop-the-loop of radius r on flat ground. You need speed to get round. */
  loop(r = 2.4): this {
    this.flat(r * 1.2);
    this.loops.push({ x: this.x, y: this.y, r });
    return this.flat(r * 1.2);
  }

  /** Abrupt step back up (a ledge face). */
  rise(dy: number): this { return this.drop(dy); }

  prop(kind: PropKind, dx: number, z: number, scale = 1, rot = 0): this {
    this.props.push({ kind, x: this.x + dx, z, scale, rot });
    return this;
  }

  /** Mark this place for challenges (see Spot). */
  spot(tag: string): this {
    this.spots.push({ x: this.x, tag });
    return this;
  }

  sign(text: string): this {
    this.signs.push({ x: this.x, text });
    return this;
  }

  build(startX: number, finishX: number): Track {
    return new Track(this.h, startX, finishX, this.props, this.signs, this.pits, this.rails, this.stairSets, this.loops, this.spots, this.pads, this.mudPatches, this.bouncers);
  }
}
