import { Track, TrackBuilder } from '../track';
import type { Challenge } from '../challenges';

// Shared pieces for the level files: one file per world, tracks in play order.
// Each layout is a chain of shapes describing the ground from left to right;
// see TrackBuilder in track.ts for the pieces and biomes.ts for the look and feel.

export interface TrackDef {
  id: string;
  biome: string;
  name: string;
  /** 'pipe' is a timed half-pipe bonus level, 'mega' a three-drop mega ramp; 'run' rides to a finish line. */
  kind?: 'run' | 'pipe' | 'mega';
  /** Show the pump-timing cue (first track only). */
  tutorial?: boolean;
  /** 1 (gentlest) to 10, on one scale across the whole game (see docs/level-plan.md). */
  difficulty?: number;
  /** A good score for the track, used by "Score N" challenges and shown on the results screen. */
  par?: number;
  /** Three challenges; the first one (two from the third world on) must be done to open the next track. */
  challenges?: Challenge[];
  build: () => Track;
}

export function layout(startY: number, startX: number, fn: (b: TrackBuilder) => void): () => Track {
  return () => {
    const b = new TrackBuilder(startY);
    fn(b);
    const finishX = b.x;
    b.sign('FINISH').flat(40);
    return b.build(startX, finishX);
  };
}

/**
 * A mega ramp: a platform, a roll-in dropping `drop` metres, a run-out, a huge kicker over a
 * `gap`, a long landing ramp, then a quarter pipe of radius `qp` for a second air.
 */
export function mega(drop: number, gap: number, qp: number): () => Track {
  return () => {
    const kick = 2.6 + gap * 0.12;
    const land = drop * 0.55;
    const b = new TrackBuilder(drop);
    b.flat(6).rollIn(drop * 1.7, drop).flat(14);
    b.sign('GAP!').kicker(7, kick, 1.8).pit(gap, -1.2);
    // Steepest where you come down, curving out flat at the bottom.
    b.rollIn(land / 0.2, land).flat(18);
    b.sign('QUARTER PIPE').quarterpipe(qp, 8);
    return b.build(3, Infinity);
  };
}

/** Half pipe bonus level: ride back and forth for PIPE_TIME seconds. */
export const PIPE_TIME = 60;
export function pipe(radius: number, flatLen: number): () => Track {
  return () => {
    const b = new TrackBuilder(0);
    b.halfpipe(radius, flatLen, 8);
    const centre = 8 + radius * 0.96 + flatLen / 2;
    return b.build(centre, Infinity);
  };
}
