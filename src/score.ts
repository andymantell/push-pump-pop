import { Trick } from './rider';

const COMBO_GRACE = 1.6;

export interface ComboView {
  names: string[];
  base: number;
  mult: number;
}

// Tricks chain into a combo while you keep landing and tricking.
// The combo banks after a short time on the ground and is lost on a bail.
export class Score {
  total = 0;
  bestCombo = 0;
  private names: string[] = [];
  private counts = new Map<string, number>();
  private base = 0;
  /** What each name in the list scored, and which trick it was, for a trick that joins onto it. */
  private entries: { id?: number; name: string; pts: number }[] = [];
  private mult = 0;
  private groundTimer = 0;
  private active = false;

  onBank: (points: number, view: ComboView) => void = () => {};
  onLost: (view: ComboView) => void = () => {};

  get combo(): ComboView | null {
    return this.active ? { names: this.names, base: this.base, mult: this.mult } : null;
  }

  addTrick(t: Trick) {
    // Put together from tricks already in the list (180 + 180 = 360): take those out, this goes in their place.
    // It still counts towards the multiplier, so spinning further never scores less.
    for (const id of t.replaces ?? []) {
      const i = this.entries.findIndex((e) => e.id === id);
      if (i < 0) continue;
      const e = this.entries[i];
      this.base -= e.pts;
      this.counts.set(e.name, (this.counts.get(e.name) ?? 1) - 1);
      this.entries.splice(i, 1);
      this.names.splice(i, 1);
    }
    const n = this.counts.get(t.name) ?? 0;
    this.counts.set(t.name, n + 1);
    // Repeating the same trick in a combo is worth less each time.
    const pts = Math.round(t.points * Math.pow(0.6, n));
    this.names.push(t.name);
    this.entries.push({ id: t.id, name: t.name, pts });
    this.base += pts;
    this.mult += 1;
    this.active = true;
    this.groundTimer = 0;
  }

  addBonus(name: string, pts: number) {
    if (!this.active) return;
    this.names.push(name);
    this.entries.push({ name, pts });
    this.base += pts;
    this.groundTimer = 0;
  }

  update(dt: number, grounded: boolean) {
    if (!this.active) return;
    if (grounded) {
      this.groundTimer += dt;
      if (this.groundTimer > COMBO_GRACE) this.bank();
    } else {
      this.groundTimer = 0;
    }
  }

  bank() {
    if (!this.active) return;
    const view = { names: this.names, base: this.base, mult: this.mult };
    const pts = this.base * this.mult;
    this.total += pts;
    this.bestCombo = Math.max(this.bestCombo, pts);
    this.onBank(pts, view);
    this.clear();
  }

  lose() {
    if (!this.active) return;
    this.onLost({ names: this.names, base: this.base, mult: this.mult });
    this.clear();
  }

  private clear() {
    this.names = [];
    this.entries = [];
    this.counts.clear();
    this.base = 0;
    this.mult = 0;
    this.active = false;
    this.groundTimer = 0;
  }

  reset() {
    this.clear();
    this.total = 0;
    this.bestCombo = 0;
  }
}
