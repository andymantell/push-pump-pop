// Picture quality that steps itself down to hold 60fps on slower phones and tablets, and back up
// when there's room. Resolution goes first (the biggest cost on phones, and hard to spot), then
// shadows, weather particles, the ink outlines and lamp lights.
//
// A frame that keeps up with a 60Hz screen takes ~16.7ms however much spare time it has, so
// frame times only say when we're too slow, never how much headroom there is. So: step down
// when frames run slow, and after a good spell try one step up. If that step is too slow again
// it waits twice as long before the next try, so the picture doesn't keep flipping.

export type Level = {
  /** Fraction of the screen's pixel ratio to render at. */
  scale: number;
  /** Shadow map size; 0 turns sun shadows off. */
  shadows: number;
  /** Share of the weather particles (snow, rain, fireflies...) drawn. */
  particles: number;
  outlines: boolean;
  /** Real lamp lights on night tracks (each one costs on every pixel). */
  lamps: number;
};

/** Best first. Each step costs a bit less to draw than the one before. */
export const LEVELS: Level[] = [
  { scale: 1, shadows: 1024, particles: 1, outlines: true, lamps: 4 },
  { scale: 0.85, shadows: 1024, particles: 1, outlines: true, lamps: 4 },
  { scale: 0.72, shadows: 1024, particles: 1, outlines: true, lamps: 4 },
  { scale: 0.72, shadows: 512, particles: 0.6, outlines: true, lamps: 4 },
  { scale: 0.72, shadows: 0, particles: 0.6, outlines: true, lamps: 2 },
  { scale: 0.6, shadows: 0, particles: 0.4, outlines: true, lamps: 2 },
  { scale: 0.5, shadows: 0, particles: 0.3, outlines: false, lamps: 2 },
];

export type Setting = 'auto' | 'high' | 'medium' | 'low';
export const SETTINGS: Setting[] = ['auto', 'high', 'medium', 'low'];
/** The level each fixed setting locks to. */
const FIXED: Record<Exclude<Setting, 'auto'>, number> = { high: 0, medium: 3, low: 5 };

/** Below this (in ms, about 54fps) a frame counts as slow. */
const SLOW_MS = 18.5;
/** How long to average frame times over before judging. */
const WINDOW = 1.5;
/** Good time needed before the first try at a step up; doubles each time a try fails. */
const FIRST_TRY = 10;
const MAX_TRY = 600;

type Store = Pick<Storage, 'getItem' | 'setItem'> | null;

export class Quality {
  setting: Setting = 'auto';
  /** Index into LEVELS. */
  level = 0;
  /** Called when the level changes. */
  onChange: (l: Level) => void = () => {};

  private sum = 0;
  private frames = 0;
  private held = 0;
  private good = 0;
  /** Per level: good time needed before stepping up to it again. */
  private wait = LEVELS.map(() => FIRST_TRY);
  /** The level last stepped up from, to blame if the new one is too slow. */
  private tried = -1;
  /** While stepping down: the frame time and level it started from. */
  private before = 0;
  private top = 0;
  /** Slow, but not because of drawing: don't step down until frames are quick again. */
  private capped = false;

  constructor(private store: Store) {
    const s = this.read('quality') as Setting;
    if (SETTINGS.includes(s)) this.setting = s;
    // Start where this device ended up last time, so a slow phone isn't slow for the first seconds.
    const saved = Number(this.read('qualityLevel'));
    this.level = this.setting === 'auto' ? (Number.isInteger(saved) ? clamp(saved) : 0) : FIXED[this.setting];
    this.hold(2);
  }

  get current(): Level {
    return LEVELS[this.level];
  }

  /** Antialiasing is fixed when the renderer is made, so only devices that ended up near the bottom last time go without. */
  get antialias(): boolean {
    return this.level < FIXED.low;
  }

  set(s: Setting) {
    this.setting = s;
    this.write('quality', s);
    this.wait = LEVELS.map(() => FIRST_TRY);
    this.tried = -1;
    this.before = 0;
    this.capped = false;
    this.go(s === 'auto' ? Math.min(this.level, FIXED.medium) : FIXED[s]);
  }

  /** Ignore frame times for a while: loading a track, compiling shaders, a level change settling. */
  hold(seconds: number) {
    this.held = Math.max(this.held, seconds);
    this.sum = this.frames = 0;
  }

  /** Feed in the real time between frames, in seconds (not the clamped game dt). */
  frame(dt: number) {
    if (this.setting !== 'auto') return;
    // A hidden tab or a long hitch (the app in the background, a phone call) says nothing about drawing speed.
    if (dt > 1) { this.hold(1); return; }
    if (this.held > 0) { this.held -= dt; return; }
    this.sum += dt;
    this.frames++;
    if (this.sum < WINDOW) return;
    const ms = (this.sum / this.frames) * 1000;
    const span = this.sum;
    this.sum = this.frames = 0;

    if (ms > SLOW_MS) {
      this.good = 0;
      if (this.capped) return;
      if (!this.before) { this.before = ms; this.top = this.level; }
      if (this.level === LEVELS.length - 1) {
        // All the way down and no quicker than at the start: something else sets the pace, like a
        // battery saver holding the screen to 30fps. Go back to how it looked and leave it.
        if (ms > this.before * 0.9) { this.capped = true; this.go(this.top); }
        return;
      }
      // A step up that didn't hold: wait longer before trying it again.
      if (this.tried >= 0 && this.level === this.tried - 1) this.wait[this.level] = Math.min(MAX_TRY, this.wait[this.level] * 2);
      this.tried = -1;
      // Way too slow (under 25fps) skips a step. Only then: a frame that just misses the screen's
      // refresh waits for the next one, so a little too slow already looks like 30fps.
      this.go(Math.min(LEVELS.length - 1, this.level + (ms > 40 ? 2 : 1)));
      return;
    }
    this.before = 0;
    this.capped = false;
    if (this.level === 0) return;
    this.good += span;
    // Held long enough that a later slow patch isn't the step up's fault.
    if (this.good > 30) this.tried = -1;
    if (this.good >= this.wait[this.level - 1]) {
      this.tried = this.level;
      this.go(this.level - 1);
    }
  }

  private go(level: number) {
    this.good = 0;
    if (level === this.level) return;
    this.level = level;
    if (this.setting === 'auto') this.write('qualityLevel', String(level));
    this.hold(1.5);
    this.onChange(this.current);
  }

  private read(k: string) {
    try { return this.store?.getItem(k) ?? null; } catch { return null; }
  }
  private write(k: string, v: string) {
    try { this.store?.setItem(k, v); } catch { /* private mode */ }
  }
}

const clamp = (n: number) => Math.max(0, Math.min(LEVELS.length - 1, n));
