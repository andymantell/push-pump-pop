// The track is a 2D height profile y = h(x), sampled every DX metres.
// Levels are built from a small set of shape primitives chained end to end.

export const DX = 0.05;

export type PropKind = 'tree' | 'bush' | 'lamp' | 'fence' | 'cone' | 'bench' | 'rock';

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

  constructor(heights: number[], startX: number, finishX: number, props: Prop[], signs: { x: number; text: string }[]) {
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
    return this.run(len, (t) => height * Math.pow(t, power));
  }

  /** Smooth bumps for pumping. */
  rollers(count: number, len: number, amp: number): this {
    for (let i = 0; i < count; i++) this.run(len, (t) => amp * (1 - Math.cos(2 * Math.PI * t)) / 2);
    return this;
  }

  /** A dip that rises back to the same height. */
  valley(len: number, depth: number): this {
    return this.run(len, (t) => -depth * (1 - Math.cos(2 * Math.PI * t)) / 2);
  }

  /** Near vertical drop (a lip edge). */
  drop(dy: number): this {
    this.y += dy;
    this.h.push(this.y);
    return this;
  }

  prop(kind: PropKind, dx: number, z: number, scale = 1, rot = 0): this {
    this.props.push({ kind, x: this.x + dx, z, scale, rot });
    return this;
  }

  sign(text: string): this {
    this.signs.push({ x: this.x, text });
    return this;
  }

  build(startX: number, finishX: number): Track {
    return new Track(this.h, startX, finishX, this.props, this.signs);
  }
}
