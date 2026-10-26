import { TrackDef, layout, wave } from './common';

// Forest Creek: the kayak's second biome. A steep, narrow creek tumbling through the woods:
// boulder drops to boof, slides of white water, rocks to splat everywhere and holes at the foot
// of the ledges. Steeper than the Whitewater Centre, so the water does more of the work and
// the drops come thick and fast.

export const KAYAK_CREEK: TrackDef[] = [
  {
    id: 'kayak-creek-1', biome: 'kayak-creek', name: 'Into the Woods', difficulty: 2, par: 15000,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Boof off a boulder', kind: 'trick', match: 'Boof', from: 'dropoff' },
      { text: 'Splat 2 rocks', kind: 'trick', match: 'Splat', count: 2 },
    ],
    // Gentle to start: a few boulder drops, rocks to splat and a slide to finish.
    build: layout(32, 6, (b) => {
      b.flat(8).descend(12, 0.05).whoops(3, 11, 0.6, 0.05).descend(6, 0.04).splat().descend(8, 0.05);
      b.sign('BOULDER DROP: BOOF IT').flat(3).dropoff(1.0, 21).descend(8, 0.05).whoops(3, 11, 0.7, 0.06);
      b.descend(6, 0.04).splat().descend(10, 0.06).flat(3).dropoff(0.9, 19).descend(6, 0.05);
      b.sign('SLIDE!').descend(14, 0.12).descend(10, 0.04).hole().descend(14, 0.04);
    }),
  },
  {
    id: 'kayak-creek-2', biome: 'kayak-creek', name: 'Mill Race', difficulty: 2, par: 8000,
    challenges: [
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Do 12 good strokes', kind: 'pumps', count: 12 },
      { text: 'Land an Air Blunt', kind: 'trick', match: 'Air Blunt' },
    ],
    // The fast straight water past the old mill: long wave trains and two ledges.
    build: layout(34, 6, (b) => {
      b.flat(8).descend(10, 0.06).whoops(5, 11, 0.75, 0.06).descend(6, 0.04);
      b.flat(3).dropoff(1.2, 20).descend(6, 0.05).whoops(5, 11, 0.8, 0.06).descend(6, 0.04).splat().descend(8, 0.05);
      b.sign('DRAG HALF ROUND IN THE AIR: AIR BLUNT').flat(3).dropoff(1.4, 22).descend(8, 0.05).whoops(4, 11, 0.8, 0.06).descend(14, 0.04);
    }),
  },
  {
    id: 'kayak-creek-3', biome: 'kayak-creek', name: 'Boulder Garden', difficulty: 2, par: 17500,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Splat 4 rocks', kind: 'trick', match: 'Splat', count: 4 },
      { text: 'Land 4 different tricks', kind: 'variety', count: 4 },
    ],
    // Boulders everywhere: splat one, boof the next.
    build: layout(36, 6, (b) => {
      b.flat(8).descend(10, 0.05).splat().descend(8, 0.05).flat(3).dropoff(0.8, 19).descend(4, 0.05).splat().descend(8, 0.05);
      b.whoops(3, 11, 0.7, 0.06).descend(4, 0.04).splat().descend(6, 0.05).flat(3).dropoff(1.0, 21).descend(6, 0.05);
      b.splat().descend(8, 0.06).whoops(3, 11, 0.75, 0.06).descend(4, 0.04).flat(3).dropoff(1.1, 21).descend(4, 0.04).splat().descend(8, 0.05);
      b.whoops(3, 11, 0.75, 0.06).descend(4, 0.04).splat().descend(14, 0.04);
    }),
  },
  {
    id: 'kayak-creek-4', biome: 'kayak-creek', name: 'Falls Pool', difficulty: 3, par: 16000,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Air for 1 second', kind: 'air', seconds: 1 },
      { text: 'Do 2 end moves', kind: 'trick', match: 'end', count: 2 },
    ],
    // Down past the side falls to a big ledge and the pool at its foot.
    build: layout(36, 6, (b) => {
      b.flat(8).descend(10, 0.06).whoops(4, 11, 0.75, 0.06).descend(4, 0.04).flat(3).dropoff(1.2, 20).descend(4, 0.04).hole().descend(8, 0.05);
      b.whoops(3, 11, 0.8, 0.06).descend(4, 0.04).splat().descend(8, 0.06);
      b.sign('BIG LEDGE: BOOF!').flat(4).dropoff(2.0, 28).descend(4, 0.03).hole().descend(10, 0.04).whoops(3, 11, 0.8, 0.06).descend(14, 0.04);
    }),
  },
  {
    id: 'kayak-creek-5', biome: 'kayak-creek', name: 'Leaf Fall', difficulty: 3, par: 15500,
    challenges: [
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 },
      { text: 'Stall in a pool for 1 second', kind: 'manual', seconds: 1 },
    ],
    // Pools between the drops to stall in, and slides to link tricks down.
    build: layout(38, 6, (b) => {
      b.flat(8).descend(10, 0.06).whoops(3, 11, 0.75, 0.06).sign('POOL: TILT FORWARD TO BOW STALL').descend(16, 0.0, 6).descend(6, 0.05);
      b.flat(3).dropoff(1.3, 20).descend(6, 0.05).splat().descend(6, 0.05).descend(12, 0.12).descend(6, 0.04).hole().descend(8, 0.05);
      b.descend(16, 0.0, 6).descend(6, 0.05).flat(3).dropoff(1.5, 22).descend(6, 0.05).whoops(3, 11, 0.8, 0.06).descend(14, 0.04);
    }),
  },
  {
    id: 'kayak-creek-6', biome: 'kayak-creek', name: 'Foggy Ledges', difficulty: 3, par: 29500,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Boof 3 ledges', kind: 'trick', match: 'Boof', from: 'dropoff', count: 3 },
      { text: 'Land a loop', kind: 'trick', match: 'bodyflip' },
    ],
    // A staircase of ledges in the fog, each with a sticky hole at its foot unless you boof it.
    build: layout(40, 6, (b) => {
      b.flat(8).descend(10, 0.06).whoops(3, 11, 0.75, 0.06).descend(4, 0.04);
      b.sign('LEDGES: BOOF CLEAR OF THE HOLES').flat(3).dropoff(1.2, 21).descend(3, 0.03).hole(9, 0.4, true).descend(8, 0.05);
      b.whoops(2, 11, 0.8, 0.06).flat(3).dropoff(1.3, 23).descend(3, 0.03).hole().descend(8, 0.05);
      b.whoops(2, 11, 0.8, 0.06).flat(3).dropoff(1.4, 23).descend(3, 0.03).hole(9, 0.4, true).descend(8, 0.05);
      b.splat().descend(8, 0.05).flat(3).dropoff(1.6, 27).descend(14, 0.04);
    }),
  },
  {
    id: 'kayak-creek-7', biome: 'kayak-creek', name: 'Golden Slides', difficulty: 4, par: 14000,
    challenges: [
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 },
      { text: 'Loop off a ledge', kind: 'trick', match: 'bodyflip' },
    ],
    // Long white slides that fire you off big ledges.
    build: layout(42, 6, (b) => {
      b.flat(8).descend(10, 0.06).whoops(3, 11, 0.8, 0.06).descend(14, 0.12).descend(4, 0.04);
      b.flat(3).dropoff(1.6, 24).descend(4, 0.04).hole().descend(8, 0.05).splat().descend(6, 0.05);
      b.sign('SLIDE, BOOF, DRAG TO LOOP').descend(16, 0.13).descend(4, 0.04).flat(4).dropoff(2.3, 30).descend(8, 0.04);
      b.whoops(3, 11, 0.8, 0.06).descend(4, 0.04).hole(9, 0.4, true).descend(16, 0.04);
    }),
  },
  {
    id: 'kayak-creek-8', biome: 'kayak-creek', name: 'Flood Water', difficulty: 4, par: 11500,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Do 3 end moves', kind: 'trick', match: 'end', count: 3 },
      { text: 'Blunt in a hole', kind: 'trick', match: 'Blunt' },
    ],
    // The creek in flood: big wave trains and holes everywhere.
    build: layout(42, 6, (b) => {
      b.flat(8).descend(10, 0.06).whoops(4, 11, 0.85, 0.06).descend(4, 0.04).hole().descend(6, 0.05);
      b.whoops(4, 11, 0.9, 0.07).descend(4, 0.04).hole(9, 0.4, true).descend(6, 0.05);
      b.sign('HOLE: CARTWHEEL OVER AND OVER').flat(3).dropoff(1.4, 22).descend(3, 0.03).hole().descend(8, 0.05);
      b.whoops(4, 11, 0.9, 0.07).descend(4, 0.04).hole().descend(8, 0.05).splat().descend(14, 0.04);
    }),
  },
  {
    id: 'kayak-creek-9', biome: 'kayak-creek', name: 'Sunset Run', difficulty: 4, par: 16500,
    challenges: [
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
      { text: 'Splat 3 rocks', kind: 'trick', match: 'Splat', count: 3 },
    ],
    // Everything mixed up: pools, slides, ledges and rocks.
    build: layout(44, 6, (b) => {
      b.flat(8).descend(10, 0.06).whoops(3, 11, 0.8, 0.06).descend(4, 0.04).splat().descend(6, 0.05);
      b.descend(16, 0.0, 6).descend(4, 0.05).flat(3).dropoff(1.5, 22).descend(4, 0.04).hole().descend(6, 0.05);
      b.descend(12, 0.12).descend(4, 0.04).splat().descend(6, 0.05).flat(3).dropoff(1.8, 26).descend(6, 0.05);
      b.whoops(3, 11, 0.85, 0.06).descend(4, 0.04).splat().descend(6, 0.05).descend(16, 0.0, 6).descend(14, 0.04);
    }),
  },
  {
    id: 'kayak-creek-10', biome: 'kayak-creek', name: 'The Big Drop', difficulty: 5, par: 16000,
    challenges: [
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 },
      { text: 'Pan-Am off the big drop', kind: 'trick', match: 'Pan-Am', from: 'bigdrop' },
    ],
    // The whole creek down to the biggest drop in the woods.
    build: layout(48, 6, (b) => {
      b.flat(8).sign('THE BIG DROP!').descend(10, 0.06).whoops(4, 11, 0.85, 0.06).descend(4, 0.04);
      b.flat(3).dropoff(1.4, 22).descend(3, 0.03).hole(9, 0.4, true).descend(8, 0.05).splat().descend(6, 0.05);
      b.descend(14, 0.13).descend(4, 0.04).flat(3).dropoff(1.7, 24).descend(4, 0.04).hole().descend(8, 0.05);
      b.whoops(3, 11, 0.85, 0.06).descend(4, 0.04).sign('BOOF AND LOOP IT').flat(5).spot('bigdrop').dropoff(3.0, 36).descend(8, 0.04);
      b.whoops(3, 11, 0.85, 0.06).descend(4, 0.04).splat().descend(16, 0.04);
    }),
  },
];

/** The standing wave below the mill weir, surfed in a playboat. */
export const KAYAK_CREEK_WAVE: TrackDef = {
  id: 'kayak-creek-wave', biome: 'kayak-creek', name: 'Mill Wave', kind: 'pipe', par: 16500,
  challenges: [
    { text: 'Score 6,000', kind: 'score', points: 6000 },
    { text: 'Blunt in the wave', kind: 'trick', match: 'Blunt' },
    { text: 'Land 4 different tricks', kind: 'variety', count: 4 },
  ],
  build: wave(1.3, 3.2),
};
