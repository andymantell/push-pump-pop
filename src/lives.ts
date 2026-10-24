// Lives for one run of a track. Each bail or fall into a gap costs one, and losing
// the last is game over: the rider stops taking input, plays out the crash, then
// freezes behind the Out of Lives screen until the track is started again.
// Half pipes are timed and have no lives.

export const LIVES = 3;
/** How long the last crash plays before the Out of Lives screen. */
export const OUT_DELAY = 1.6;

export class Lives {
  left = LIVES;
  /** Time since the last life was lost; 0 while you still have lives. */
  outTime = 0;

  constructor(public enabled = true) {}

  reset(enabled: boolean) {
    this.enabled = enabled;
    this.left = LIVES;
    this.outTime = 0;
  }

  get out() { return this.enabled && this.left <= 0; }

  /** Whether taps, swipes and tilt should reach the rider. */
  get controllable() { return !this.out; }

  /** Lose a life. Returns true if that was the last one. */
  lose(): boolean {
    if (!this.enabled || this.out) return false;
    this.left--;
    return this.out;
  }

  /** Advance the out timer. Returns true once, when the Out of Lives screen should show. */
  tick(dt: number): boolean {
    if (!this.out || this.outTime > OUT_DELAY) return false;
    this.outTime += dt;
    return this.outTime > OUT_DELAY;
  }

  /** Whether the rider should still move: only to finish the crash that ended the run. */
  simulate(crashing: boolean) { return !this.out || (this.outTime <= OUT_DELAY && crashing); }
}
