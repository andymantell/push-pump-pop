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
  /** The scooter career's par and challenges (src/levels/scooter.ts, joined on in tracks.ts). */
  scooter?: { par: number; challenges: Challenge[] };
  /** The downhill bike career's (src/levels/mtb.ts, joined on in tracks.ts). */
  mtb?: { par: number; challenges: Challenge[] };
  /** The kayak career's: only on its own rivers, written for it. */
  kayak?: { par: number; challenges: Challenge[] };
  build: () => Track;
}

/** After the finish line the rider brakes to a stop this far on. */
export const STOP_AFTER_FINISH = 20;
/** Flat ground past the stop, so the finish camera never sees the end of the world. */
const RUN_OUT = 20;

export function layout(startY: number, startX: number, fn: (b: TrackBuilder) => void): () => Track {
  return () => {
    const b = new TrackBuilder(startY);
    fn(b);
    const finishX = b.x;
    b.flat(STOP_AFTER_FINISH + RUN_OUT);
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
    // A long deck behind the quarter pipe, so big airs never show the end of the world.
    b.sign('QUARTER PIPE').quarterpipe(qp, 20);
    return b.build(3, Infinity);
  };
}

/** Half pipe bonus level: ride back and forth for PIPE_TIME seconds. */
export const PIPE_TIME = 60;
export function pipe(radius: number, flatLen: number): () => Track {
  return () => {
    const b = new TrackBuilder(0);
    // Long decks, so the camera never sees past the ends.
    const deck = 16;
    b.halfpipe(radius, flatLen, deck);
    const centre = deck + radius * 0.96 + flatLen / 2;
    return b.build(centre, Infinity);
  };
}

/**
 * A standing wave bonus level for the kayak, surfed in place for PIPE_TIME seconds. The river
 * flows right to left: smooth water pours down the tongue into the trough and piles up into a
 * breaking wave, and you surf the wave's green face facing upstream, held there by the current.
 * Paddle to rock up and down the face, swipe up to pop off it, and the whole wave is a hole
 * for end moves.
 */
export function wave(height: number, face: number): () => Track {
  return () => {
    const b = new TrackBuilder(0);
    b.flat(30);
    const x0 = b.x;
    // The back of the wave, up to the crest where it breaks.
    b.ease(4, height);
    const crest = b.x;
    // The green face down into the trough.
    b.ease(face, -height - 0.35);
    const trough = b.x;
    b.flat(1.2);
    // The tongue: the river pouring down from upstream.
    b.ease(6, height + 1.1);
    const x1 = b.x;
    b.flat(30);
    b.holes.push({ x0, x1, sticky: false, wave: { crest, trough: trough + 0.6 } });
    return b.build(trough + 0.6, Infinity);
  };
}
