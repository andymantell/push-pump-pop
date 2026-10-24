import type { Rider } from './rider';

// Mega ramps: three drops, each from the top. A drop ends a moment after you fall into
// the gap, roll back down from the quarter pipe, or come to a stop. The game and the
// playtest both run drops with this.

export const MEGA_DROPS = 3;
/** Longest a drop can take, in case you stop somewhere odd. */
const DROP_LIMIT = 30;

export class MegaRun {
  drop = 1;
  private endIn = 0;
  private reachedQP = false;
  private time = 0;

  /** The drop is over and about to restart: bank the score and ignore input. */
  get ending() { return this.endIn > 0; }

  /** Advance one step. Returns true when this drop is over. */
  update(dt: number, r: Rider): boolean {
    if (r.perched || r.dropT >= 0) return false;
    this.time += dt;
    if (r.inPipe) this.reachedQP = true;
    if (this.endIn === 0) {
      const rolledBack = this.reachedQP && r.grounded && r.v < 0;
      const stopped = r.grounded && !r.inPipe && Math.abs(r.v) < 0.3 && !r.bailing;
      if (r.falling) this.endIn = 1.2;
      else if (rolledBack || stopped || this.time > DROP_LIMIT) this.endIn = 0.5;
      else return false;
    }
    this.endIn -= dt;
    return this.endIn <= 0;
  }

  /** Back to the top for the next drop. Returns false when all the drops are done. */
  next(r: Rider): boolean {
    if (this.drop >= MEGA_DROPS) return false;
    this.drop++;
    this.endIn = 0;
    this.reachedQP = false;
    this.time = 0;
    r.reset();
    r.perch();
    return true;
  }
}
