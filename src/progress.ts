// What you've unlocked, finished and scored, kept in localStorage.
//
// - Sunny Park 1 is always open.
// - A track is complete once you've finished it and done its required challenges
//   (challenge 1 in the first two worlds, challenges 1 and 2 after that).
// - Completing a track opens the next one in its world.
// - Completing track 5 of a world opens track 1 of the next world.
// - Completing track 3 of a world opens its bonus level.
// - Anything you've already finished stays open, whatever moves around.
// - Stars: one per challenge done. Tracks without challenges yet: 1 for finishing,
//   2 for half par, 3 for par.
// - Each ride (src/ride.ts) has its own challenges, stars and best scores, but tracks open for
//   every ride: a track completed on any ride counts as complete for opening the next one.

import { requiredCount } from './challenges';
import { RIDES, RideId } from './ride';

export interface Level {
  id: string;
  biome: string;
  kind?: 'run' | 'pipe' | 'mega';
  par?: number;
  challenges?: unknown[];
  /** The scooter career's par and challenges for this track. */
  scooter?: { par?: number; challenges?: unknown[] };
  /** The downhill bike career's. */
  mtb?: { par?: number; challenges?: unknown[] };
  /** The kayak's (its rivers only). */
  kayak?: { par?: number; challenges?: unknown[] };
}

/** A track's challenges on a ride. */
export function challengesOf<T>(l: { challenges?: T[]; scooter?: { challenges?: T[] }; mtb?: { challenges?: T[] }; kayak?: { challenges?: T[] } }, ride: RideId): T[] {
  return (ride === 'skate' ? l.challenges : l[ride]?.challenges) ?? [];
}
/** A track's par on a ride. */
export function parOf(l: Level, ride: RideId): number | undefined {
  return ride === 'skate' ? l.par : l[ride]?.par;
}

export interface Store {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

/** Skateboard keys predate rides, so they keep their names; other rides put theirs in front. */
const key = (what: string) => (id: string, ride: RideId = 'skate') => `push-pump-pop-${ride === 'skate' ? '' : ride + '-'}${what}-${id}`;
const bestKey = key('best');
const doneKey = key('done');
const chKey = key('ch');
const ALL_KEY = 'push-pump-pop-unlock-all';
const MIGRATED_KEY = 'push-pump-pop-levels-v2';

/** Layouts that moved to a new slot when the 70 tracks went in: old id -> new id. */
export const MOVED: [string, string][] = [
  ['park-1', 'park-10'],
  ['rooftops-1', 'rooftops-3'],
  ['volcano-1', 'volcano-2'],
];
/** Bonus levels that were replaced by something you can't compare scores with. */
export const DROPPED = ['rooftops-pipe', 'snow-pipe', 'desert-pipe', 'volcano-pipe'];

/** Reads and writes progress, falling back to memory if storage is unavailable. */
export class Progress {
  private mem = new Map<string, string>();

  /** The ride whose stars and scores the methods below read and write, unless given another. */
  ride: RideId = 'skate';

  /**
   * `firstOpen`: worlds whose first track is always open, rather than opening after the world
   * before (the MTB's own world, which other rides can't reach).
   */
  constructor(private levels: Level[], private biomes: string[], private store: Store | null, private firstOpen: string[] = []) {}

  private get(k: string): string | null {
    try { if (this.store) return this.store.getItem(k); } catch { /* fall through */ }
    return this.mem.get(k) ?? null;
  }
  private set(k: string, v: string) {
    this.mem.set(k, v);
    try { this.store?.setItem(k, v); } catch { /* memory only */ }
  }
  private remove(k: string) {
    this.mem.delete(k);
    try { this.store?.removeItem(k); } catch { /* memory only */ }
  }

  best(id: string, ride = this.ride): number { return Number(this.get(bestKey(id, ride))) || 0; }
  /** Finished on this ride. */
  done(id: string, ride = this.ride): boolean { return this.get(doneKey(id, ride)) === '1' || this.best(id, ride) > 0; }
  /** Finished on any ride: it stays open. */
  doneAny(id: string): boolean { return RIDES.some((r) => this.done(id, r.id)); }

  /** Record a finished run. Returns true for a new best. */
  record(id: string, score: number, ride = this.ride): boolean {
    this.set(doneKey(id, ride), '1');
    if (score <= this.best(id, ride)) return false;
    this.set(bestKey(id, ride), String(Math.round(score)));
    return true;
  }

  /** Which of a track's challenges you've done, saved the moment each is done. */
  challenges(l: Level, ride = this.ride): boolean[] {
    const s = this.get(chKey(l.id, ride)) ?? '';
    return challengesOf(l, ride).map((_, i) => s[i] === '1');
  }
  markChallenge(l: Level, i: number, ride = this.ride) {
    const got = this.challenges(l, ride);
    got[i] = true;
    this.set(chKey(l.id, ride), got.map((g) => (g ? '1' : '0')).join(''));
  }
  /** Required challenges for a track. */
  required(l: Level, ride = this.ride): number {
    return challengesOf(l, ride).length ? requiredCount(this.biomes.indexOf(l.biome), l.kind ?? 'run', l.biome) : 0;
  }
  /** Finished, with the required challenges done, on this ride. */
  completeOn(l: Level, ride = this.ride): boolean {
    return this.done(l.id, ride) && this.challenges(l, ride).slice(0, this.required(l, ride)).every(Boolean);
  }
  /** Complete on any ride: this is what opens the next track. */
  complete(l: Level): boolean {
    return RIDES.some((r) => this.completeOn(l, r.id));
  }
  /** The first thing still needed to complete a track on this ride, for hints. */
  missing(l: Level, ride = this.ride): { finish: boolean; challenges: number[] } {
    const got = this.challenges(l, ride);
    return { finish: !this.done(l.id, ride), challenges: got.slice(0, this.required(l, ride)).map((g, i) => (g ? -1 : i)).filter((i) => i >= 0) };
  }
  /** The track you need to complete to open this one, or null if it's open. */
  gate(l: Level): Level | null {
    if (this.unlocked(l)) return null;
    const runs = this.runs(l.biome);
    if ((l.kind ?? 'run') !== 'run') return runs[2] ?? null;
    const i = runs.findIndex((r) => r.id === l.id);
    if (i > 0) return runs[i - 1];
    const prev = this.runs(this.biomes[this.biomes.indexOf(l.biome) - 1]);
    return prev[Math.min(4, prev.length - 1)] ?? null;
  }

  get unlockAll() { return this.get(ALL_KEY) === '1'; }
  set unlockAll(on: boolean) { if (on) this.set(ALL_KEY, '1'); else this.remove(ALL_KEY); }

  /** Run tracks of a world in order (bonus levels left out). */
  runs(biome: string) { return this.levels.filter((l) => l.biome === biome && (l.kind ?? 'run') === 'run'); }

  unlocked(l: Level): boolean {
    if (this.unlockAll || this.doneAny(l.id)) return true;
    const runs = this.runs(l.biome);
    if ((l.kind ?? 'run') !== 'run') return runs.length >= 3 && this.complete(runs[2]);
    const i = runs.findIndex((r) => r.id === l.id);
    if (i > 0) return this.complete(runs[i - 1]);
    const b = this.biomes.indexOf(l.biome);
    if (b <= 0 || this.firstOpen.includes(l.biome)) return true;
    // While a world is still being built it may have fewer than five tracks: its last one opens the next.
    const prev = this.runs(this.biomes[b - 1]);
    return prev.length > 0 && this.complete(prev[Math.min(4, prev.length - 1)]);
  }

  /** A world is open once its first track is. */
  biomeOpen(biome: string) { const r = this.runs(biome); return r.length > 0 && this.unlocked(r[0]); }

  stars(l: Level, ride = this.ride): number {
    if (challengesOf(l, ride).length) return this.challenges(l, ride).filter(Boolean).length;
    if (!this.done(l.id, ride)) return 0;
    const best = this.best(l.id, ride), par = parOf(l, ride);
    if (par && best >= par) return 3;
    if (par && best >= par / 2) return 2;
    return 1;
  }

  /** Stars a score would earn, for the results screen. */
  starsFor(l: Level, score: number, ride = this.ride): number {
    if (challengesOf(l, ride).length) return this.stars(l, ride);
    const par = parOf(l, ride);
    if (par && score >= par) return 3;
    if (par && score >= par / 2) return 2;
    return 1;
  }

  /**
   * Once per change, as the 70 tracks arrive world by world: move saved bests with the
   * layouts that changed slot (once the new slot exists), and drop scores for bonus levels
   * that became mega ramps (once they're gone). Old finishes stay open.
   */
  migrate() {
    const has = (id: string) => this.levels.some((l) => l.id === id);
    for (const [from, to] of MOVED) {
      const flag = `${MIGRATED_KEY}-${from}`;
      if (!has(to) || this.get(flag)) continue;
      // Old saves are all skateboard ones.
      const best = this.best(from, 'skate'), wasDone = this.done(from, 'skate');
      this.remove(bestKey(from));
      this.remove(doneKey(from));
      // Challenges belong to the layout's new slot, so old ones don't carry over.
      this.remove(chKey(from));
      if (best > this.best(to, 'skate')) this.set(bestKey(to), String(best));
      if (wasDone) this.set(doneKey(to), '1');
      this.set(flag, '1');
    }
    for (const id of DROPPED) {
      if (has(id)) continue;
      this.remove(bestKey(id));
      this.remove(doneKey(id));
    }
  }
}
