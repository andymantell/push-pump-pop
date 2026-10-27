import { TrackDef, layout, wave } from './common';

// Canyon River: the kayak's third biome. A wide, powerful river between red canyon walls. Few
// drops, but huge wave trains to pump down, big holes to play in and some to punch through,
// and long calm pools between the rapids for stalls and flatspins.

export const KAYAK_CANYON: TrackDef[] = [
  {
    id: 'kayak-canyon-1', biome: 'kayak-canyon', name: 'Put In', difficulty: 2, par: 3000,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Do 12 good strokes', kind: 'pumps', count: 12 },
      { text: 'Air for 0.8 seconds', kind: 'air', seconds: 0.8 },
    ],
    // From the raft beach into the first big wave train.
    build: layout(36, 5, (b) => {
      b.flat(8).sign('BIG WATER! TAP DOWN THE WAVES').descend(12, 0.04);
      b.whoops(5, 14, 1.0, 0.04).descend(16, 0.0, 6).descend(8, 0.04);
      b.whoops(5, 14, 1.1, 0.05).descend(6, 0.03).hole().descend(12, 0.04);
      b.whoops(4, 14, 1.1, 0.05).descend(16, 0.03);
    }),
  },
  {
    id: 'kayak-canyon-2', biome: 'kayak-canyon', name: 'Red Walls', difficulty: 2, par: 3000,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Boof the ledge', kind: 'trick', match: 'Boof', from: 'dropoff' },
      { text: 'Land 3 different tricks', kind: 'variety', count: 3 },
    ],
    // Wave trains between calm pools under the cliff houses.
    build: layout(38, 5, (b) => {
      b.flat(8).descend(10, 0.04).whoops(4, 13, 1.3, 0.05).descend(18, 0.0, 6);
      b.descend(6, 0.04).whoops(4, 13, 1.3, 0.05).sign('LEDGE: PADDLE ON THE LIP TO BOOF').flat(4).dropoff(1.8, 26).descend(12, 0.03).hole(16, 0.45).descend(10, 0.04);
      b.descend(18, 0.0, 6).descend(6, 0.04).whoops(4, 13, 1.4, 0.05).descend(14, 0.03);
    }),
  },
  {
    id: 'kayak-canyon-3', biome: 'kayak-canyon', name: 'Condor Rapid', difficulty: 3, par: 7500,
    challenges: [
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Do 2 end moves', kind: 'trick', match: 'end', count: 2 },
      { text: 'Splat the rock', kind: 'trick', match: 'Splat' },
    ],
    // A long rapid of holes and a big rock in the middle of it.
    build: layout(38, 5, (b) => {
      b.flat(8).descend(10, 0.05).whoops(4, 14, 1.1, 0.05).flat(4).dropoff(1.3, 23).descend(12, 0.0).hole(16, 0.45).descend(8, 0.04);
      b.whoops(3, 14, 1.2, 0.05).descend(6, 0.04).splat().descend(6, 0.04).flat(4).dropoff(1.4, 25).descend(12, 0.0).hole(16, 0.45).descend(8, 0.04);
      b.whoops(4, 14, 1.2, 0.05).descend(12, 0.0).hole(16, 0.45).descend(14, 0.04);
    }),
  },
  {
    id: 'kayak-canyon-4', biome: 'kayak-canyon', name: 'Hoodoo Ledge', difficulty: 3, par: 4000,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'End move below the ledge', kind: 'trick', match: 'end' },
      { text: 'Land a Pan-Am', kind: 'trick', match: 'Pan-Am' },
    ],
    // One river-wide ledge with a hole below it, and big waves either side.
    build: layout(38, 5, (b) => {
      b.flat(8).descend(10, 0.05).whoops(5, 14, 1.1, 0.05).descend(6, 0.03);
      b.sign('THE LEDGE!').flat(4).dropoff(1.6, 24).descend(12, 0.0).hole(16, 0.45).descend(10, 0.04);
      b.whoops(5, 14, 1.2, 0.05).descend(4, 0.03).splat().descend(14, 0.04);
    }),
  },
  {
    id: 'kayak-canyon-5', biome: 'kayak-canyon', name: 'Big Water', difficulty: 3, par: 3500,
    challenges: [
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Air for 1 second', kind: 'air', seconds: 1 },
      { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 },
    ],
    // The biggest wave train in the canyon: pump it and fly off the crests.
    build: layout(40, 5, (b) => {
      b.flat(8).descend(10, 0.05).sign('HUGE WAVES: FLY OFF THE TOPS').whoops(6, 15, 1.4, 0.05).descend(6, 0.03);
      b.hole().descend(8, 0.04).whoops(6, 15, 1.5, 0.06).descend(6, 0.03).splat().descend(8, 0.04);
      b.whoops(5, 15, 1.4, 0.05).descend(16, 0.03);
    }),
  },
  {
    id: 'kayak-canyon-6', biome: 'kayak-canyon', name: 'Sticky Situation', difficulty: 4, par: 6500,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Blunt in a hole', kind: 'trick', match: 'Blunt' },
    ],
    // Big sticky holes: carry speed down the waves to punch them.
    build: layout(40, 5, (b) => {
      b.flat(8).descend(10, 0.05).whoops(4, 14, 1.2, 0.06).descend(12, 0.0).hole(16, 0.45).descend(8, 0.04);
      b.sign('STICKY! GO FAST').whoops(4, 14, 1.2, 0.06).descend(8, 0.03).hole(9, 0.4, true).descend(8, 0.04);
      b.whoops(4, 14, 1.2, 0.06).descend(12, 0.0).hole(16, 0.45).descend(8, 0.04).whoops(3, 14, 1.2, 0.06);
      b.descend(8, 0.03).hole(9, 0.4, true).descend(16, 0.04);
    }),
  },
  {
    id: 'kayak-canyon-7', biome: 'kayak-canyon', name: 'Flash Flood', difficulty: 4, par: 14000,
    challenges: [
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Do 3 end moves', kind: 'trick', match: 'end', count: 3 },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
    ],
    // The river up in flood: everything bigger, holes everywhere.
    build: layout(42, 5, (b) => {
      b.flat(8).descend(10, 0.05).whoops(5, 15, 1.4, 0.06).descend(12, 0.0).hole(16, 0.45).descend(6, 0.04);
      b.flat(4).dropoff(1.4, 22).descend(8, 0.03).hole(9, 0.4, true).descend(8, 0.04).whoops(5, 15, 1.5, 0.06);
      b.flat(4).dropoff(1.5, 22).descend(12, 0.0).hole(16, 0.45).descend(6, 0.04).splat().descend(8, 0.04).whoops(4, 15, 1.4, 0.06).descend(14, 0.03);
    }),
  },
  {
    id: 'kayak-canyon-8', biome: 'kayak-canyon', name: 'Golden Canyon', difficulty: 4, par: 5000,
    challenges: [
      { text: 'Land 3 different tricks', kind: 'variety', count: 3 },
      { text: 'Air for 1 second', kind: 'air', seconds: 1 },
      { text: 'Stern stall for 1 second', kind: 'manual', name: 'Stern Stall', seconds: 1 },
    ],
    // Long pools and big waves in the evening light.
    build: layout(42, 5, (b) => {
      b.flat(8).descend(10, 0.05).whoops(5, 15, 1.4, 0.06).descend(18, 0.0, 6).descend(4, 0.04);
      b.sign('BIG LEDGE!').flat(4).dropoff(2.0, 28).descend(12, 0.0).hole(16, 0.45).descend(8, 0.04);
      b.whoops(5, 15, 1.5, 0.06).descend(18, 0.0, 6).descend(6, 0.04).whoops(4, 15, 1.4, 0.06).descend(14, 0.03);
    }),
  },
  {
    id: 'kayak-canyon-9', biome: 'kayak-canyon', name: 'Dusk Rapids', difficulty: 4, par: 14500,
    challenges: [
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Blunt in a hole', kind: 'trick', match: 'Blunt' },
      { text: 'Splat 2 rocks', kind: 'trick', match: 'Splat', count: 2 },
    ],
    // Rapid after rapid as the sun goes down.
    build: layout(44, 5, (b) => {
      b.flat(8).descend(10, 0.05).whoops(4, 15, 1.3, 0.06).descend(12, 0.0).hole(16, 0.45).descend(6, 0.04).splat().descend(8, 0.04);
      b.flat(4).dropoff(1.6, 24).descend(12, 0.0).hole(16, 0.45).descend(8, 0.04).whoops(5, 15, 1.4, 0.06);
      b.descend(8, 0.03).hole(9, 0.4, true).descend(6, 0.04).splat().descend(8, 0.04).whoops(4, 15, 1.4, 0.06).descend(14, 0.03);
    }),
  },
  {
    id: 'kayak-canyon-10', biome: 'kayak-canyon', name: 'Night Run', difficulty: 5, par: 11500,
    challenges: [
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 },
      { text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 },
    ],
    // The whole canyon under the stars.
    build: layout(48, 5, (b) => {
      b.flat(8).sign('THE WHOLE CANYON!').descend(10, 0.05).whoops(5, 15, 1.4, 0.06).descend(12, 0.0).hole(16, 0.45).descend(6, 0.04);
      b.flat(4).dropoff(1.8, 26).descend(8, 0.03).hole(9, 0.4, true).descend(8, 0.04).splat().descend(6, 0.04);
      b.whoops(6, 15, 1.5, 0.06).descend(16, 0.0, 6).descend(4, 0.04).flat(4).dropoff(2.2, 30).descend(6, 0.04);
      b.hole().descend(8, 0.04).whoops(4, 15, 1.4, 0.06).descend(16, 0.03);
    }),
  },
];

/** A big glassy standing wave in the canyon, surfed in a playboat. */
export const KAYAK_CANYON_WAVE: TrackDef = {
  id: 'kayak-canyon-wave', biome: 'kayak-canyon', name: 'Canyon Wave', kind: 'pipe', par: 20500,
  challenges: [
    { text: 'Score 6,000', kind: 'score', points: 6000 },
    { text: 'Blunt in the wave', kind: 'trick', match: 'Blunt' },
    { text: 'Air 1 m off the wave', kind: 'air', metres: 1 },
  ],
  build: wave(1.5, 3.6),
};
