import { TrackDef, layout, wave } from './common';

// Waterfall Gorge: the kayak's last biome. A jungle river dropping through a gorge in a
// staircase of waterfalls, each taller than the last: boof the lips, fly, and land the right
// way up. Steep chutes and holes between them, and pools at the foot of the big falls.

export const KAYAK_GORGE: TrackDef[] = [
  {
    id: 'kayak-gorge-1', biome: 'kayak-gorge', name: 'Jungle Put In', difficulty: 3, par: 9000,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Boof 3 falls', kind: 'trick', match: 'Boof', count: 3 },
      { text: 'Air for 1 second', kind: 'air', seconds: 1 },
    ],
    // A friendly start: three falls, each a bit taller.
    build: layout(36, 5, (b) => {
      b.flat(8).sign('WATERFALLS! TAP UP ON THE LIP').descend(10, 0.05).whoops(3, 11, 0.8, 0.06).flat(4).dropoff(2.0, 28).descend(10, 0.04);
      b.whoops(3, 11, 0.8, 0.06).flat(4).dropoff(2.4, 30).descend(12, 0.0).hole(14, 0.4).descend(8, 0.04);
      b.whoops(2, 11, 0.8, 0.06).flat(4).dropoff(2.8, 34).descend(16, 0.04);
    }),
  },
  {
    id: 'kayak-gorge-2', biome: 'kayak-gorge', name: 'Misty Steps', difficulty: 3, par: 36500,
    challenges: [
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Land a Helix', kind: 'trick', match: 'Helix' },
      { text: 'Do an end move', kind: 'trick', match: 'end' },
    ],
    // A staircase of short falls in the mist.
    build: layout(36, 5, (b) => {
      b.flat(8).descend(10, 0.05);
      for (let k = 0; k < 4; k++) b.flat(4).dropoff(1.8 + k * 0.2, 24).descend(6, 0.04);
      b.descend(12, 0.0).hole(14, 0.4).descend(8, 0.04).whoops(3, 11, 0.8, 0.06).flat(4).dropoff(2.4, 30).descend(14, 0.04);
    }),
  },
  {
    id: 'kayak-gorge-3', biome: 'kayak-gorge', name: 'Rope Bridge Rapid', difficulty: 3, par: 15500,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Splat the rock', kind: 'trick', match: 'Splat' },
      { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 },
    ],
    // Chutes and rocks under the rope bridge.
    build: layout(38, 5, (b) => {
      b.flat(8).descend(10, 0.06).descend(14, 0.12).descend(6, 0.04).splat().descend(8, 0.05);
      b.flat(4).dropoff(2.4, 30).descend(12, 0.0).hole(14, 0.4).descend(8, 0.04).whoops(3, 11, 0.85, 0.06);
      b.descend(14, 0.12).descend(6, 0.04).splat().descend(6, 0.04).flat(4).dropoff(2.6, 32).descend(14, 0.04);
    }),
  },
  {
    id: 'kayak-gorge-4', biome: 'kayak-gorge', name: 'The Tall One', difficulty: 4, par: 14000,
    challenges: [
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 },
      { text: 'Loop off a fall', kind: 'trick', match: 'bodyflip' },
    ],
    // One huge waterfall in front of the big two-tier fall.
    build: layout(38, 5, (b) => {
      b.flat(8).descend(10, 0.05).whoops(3, 11, 0.8, 0.06).flat(4).dropoff(2.2, 28).descend(10, 0.04);
      b.sign('THE TALL ONE! BOOF IT').flat(5).spot('bigdrop').dropoff(3.6, 42).descend(12, 0.0).hole(14, 0.4).descend(8, 0.04);
      b.whoops(3, 11, 0.85, 0.06).descend(14, 0.04);
    }),
  },
  {
    id: 'kayak-gorge-5', biome: 'kayak-gorge', name: 'Temple Falls', difficulty: 4, par: 15000,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Land a Pan-Am', kind: 'trick', match: 'Pan-Am' },
      { text: 'Land 4 different tricks', kind: 'variety', count: 4 },
    ],
    // Falls past the old temple in the rain.
    build: layout(40, 5, (b) => {
      b.flat(8).descend(10, 0.05).flat(4).dropoff(2.4, 30).descend(8, 0.04).whoops(3, 11, 0.85, 0.06);
      b.flat(4).dropoff(2.8, 34).descend(12, 0.0).hole(14, 0.4).descend(8, 0.04).splat().descend(6, 0.04);
      b.descend(12, 0.12).descend(4, 0.04).flat(4).dropoff(3.0, 36).descend(14, 0.04);
    }),
  },
  {
    id: 'kayak-gorge-6', biome: 'kayak-gorge', name: 'Sunset Cascade', difficulty: 4, par: 15000,
    challenges: [
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Do 2 end moves', kind: 'trick', match: 'end', count: 2 },
      { text: 'Airscrew off a fall', kind: 'trick', match: 'Airscrew', from: 'dropoff' },
    ],
    // A long cascade of falls and holes at sunset.
    build: layout(40, 5, (b) => {
      b.flat(8).descend(10, 0.05).flat(4).dropoff(2.2, 28).descend(12, 0.0).hole(14, 0.4).descend(8, 0.04);
      b.flat(4).dropoff(2.6, 32).descend(12, 0.0).hole(14, 0.4).descend(8, 0.04).whoops(3, 11, 0.85, 0.06);
      b.flat(4).dropoff(3.0, 36).descend(12, 0.0).hole(14, 0.4).descend(14, 0.04);
    }),
  },
  {
    id: 'kayak-gorge-7', biome: 'kayak-gorge', name: 'Thunder Gorge', difficulty: 5, par: 12500,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
    ],
    // Sticky holes at the foot of the falls: boof clear of them.
    build: layout(40, 5, (b) => {
      b.flat(8).descend(10, 0.05).sign('STICKY! BOOF FAR').flat(4).dropoff(2.4, 30).descend(4, 0.03).hole(9, 0.4, true).descend(8, 0.04);
      b.whoops(4, 13, 0.9, 0.05).flat(4).dropoff(2.8, 34).descend(4, 0.03).hole(9, 0.4, true).descend(8, 0.04).splat().descend(6, 0.04);
      b.whoops(3, 13, 0.9, 0.05).descend(4, 0.04).flat(4).dropoff(3.2, 38).descend(12, 0.0).hole(14, 0.4).descend(14, 0.04);
    }),
  },
  {
    id: 'kayak-gorge-8', biome: 'kayak-gorge', name: 'Golden Plunge', difficulty: 5, par: 14500,
    challenges: [
      { text: 'Air for 1.3 seconds', kind: 'air', seconds: 1.3 },
      { text: 'Boof the big drop', kind: 'trick', match: 'Boof', from: 'bigdrop' },
      { text: 'Land a Helix', kind: 'trick', match: 'Helix' },
    ],
    // Two big plunges in the evening light.
    build: layout(42, 5, (b) => {
      b.flat(8).descend(10, 0.05).whoops(3, 11, 0.85, 0.06).flat(4).dropoff(2.6, 32).descend(12, 0.0).hole(14, 0.4).descend(8, 0.04);
      b.sign('BIG DROP!').flat(5).spot('bigdrop').dropoff(3.8, 44).descend(10, 0.04).splat().descend(8, 0.04);
      b.whoops(3, 11, 0.85, 0.06).flat(5).dropoff(3.4, 40).descend(14, 0.04);
    }),
  },
  {
    id: 'kayak-gorge-9', biome: 'kayak-gorge', name: 'Dusk Drops', difficulty: 5, par: 20500,
    challenges: [
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Do 3 end moves', kind: 'trick', match: 'end', count: 3 },
      { text: 'Loop off a fall', kind: 'trick', match: 'bodyflip' },
    ],
    // Falls, chutes and holes, one after another, as the light goes.
    build: layout(44, 5, (b) => {
      b.flat(8).descend(10, 0.05).flat(4).dropoff(2.4, 30).descend(12, 0.0).hole(14, 0.4).descend(8, 0.04);
      b.descend(12, 0.12).descend(4, 0.04).flat(4).dropoff(2.8, 34).descend(12, 0.0).hole(14, 0.4).descend(8, 0.04);
      b.whoops(3, 11, 0.85, 0.06).flat(4).dropoff(3.2, 38).descend(12, 0.0).hole(14, 0.4).descend(8, 0.04).splat().descend(12, 0.04);
    }),
  },
  {
    id: 'kayak-gorge-10', biome: 'kayak-gorge', name: 'The Big Plunge', difficulty: 5, par: 21500,
    challenges: [
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 },
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
    ],
    // The whole gorge by moonlight, ending with the tallest fall of all.
    build: layout(48, 5, (b) => {
      b.flat(8).sign('THE WHOLE GORGE!').descend(10, 0.05).flat(4).dropoff(2.4, 30).descend(12, 0.0).hole(14, 0.4).descend(8, 0.04);
      b.whoops(3, 11, 0.85, 0.06).flat(4).dropoff(2.8, 34).descend(4, 0.03).hole(9, 0.4, true).descend(8, 0.04).splat().descend(6, 0.04);
      b.descend(12, 0.12).descend(4, 0.04).flat(4).dropoff(3.2, 38).descend(12, 0.0).hole(14, 0.4).descend(8, 0.04);
      b.sign('THE BIG PLUNGE!').flat(5).spot('bigdrop').dropoff(4.2, 48).descend(18, 0.04);
    }),
  },
];

/** A standing wave at the foot of the gorge's tallest fall, surfed in a playboat. */
export const KAYAK_GORGE_WAVE: TrackDef = {
  id: 'kayak-gorge-wave', biome: 'kayak-gorge', name: 'Gorge Wave', kind: 'pipe', par: 6000,
  challenges: [
    { text: 'Score 7,000', kind: 'score', points: 7000 },
    { text: 'Space Godzilla in the wave', kind: 'trick', match: 'Space Godzilla' },
    { text: 'Air 1.2 m off the wave', kind: 'air', metres: 1.2 },
  ],
  build: wave(1.4, 3.4),
};
