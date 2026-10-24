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
