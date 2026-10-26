import { TrackDef, layout } from './common';

// North Shore: the downhill bike's fourth and hardest biome, in a rainforest of giant cedars.
// Wooden skinnies on legs (some running downhill), ladder bridges over gullies, wooden drops
// and step-downs, and big wooden kickers. Every course falls all the way (descend).

export const DH_SHORE: TrackDef[] = [
  {
    id: 'dh-shore-1', biome: 'dh-shore', name: 'First Planks', difficulty: 6, par: 26000,
    challenges: [
      { text: 'Ride a skinny', kind: 'grind' },
      { text: 'Ride 3 skinnies', kind: 'grind', count: 3 },
      { text: 'Manual along a skinny', kind: 'trick', match: 'Skinny Manual' },
    ],
    // The first wooden planks: low, flat and long, with room between them.
    build: layout(44, 7, (b) => {
      b.flat(8).sign('DROP IN').descend(14, 0.08).descend(8, 0.03);
      b.sign('HOP ON THE PLANK').flat(6).skinny(12).flat(8).descend(10, 0.06);
      b.whoops(2, 12, 0.8, 0.06).descend(8, 0.02);
      b.flat(6).skinny(12, -0.6).flat(8).descend(10, 0.06);
      b.descend(10, 0.1).descend(8, 0.02);
      b.flat(6).skinny(14).flat(8).descend(16, 0.06);
    }),
  },
  {
    id: 'dh-shore-2', biome: 'dh-shore', name: 'Plank Drops', difficulty: 6, par: 1500,
    challenges: [
      { text: 'Finish without losing a life', kind: 'noLives' },
      { text: 'Air for 0.6 seconds', kind: 'air', seconds: 0.6 },
      { text: 'A trick off a drop', kind: 'trick', match: 'any', from: 'dropoff' },
    ],
    // Wooden decks that end in thin air: roll off and land on the slope below.
    build: layout(46, 7, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.1).descend(8, 0.04);
      b.sign('WOODEN DROP').flat(3).dropoff(1.0, 22).descend(10, 0.07);
      b.flat(3).dropoff(1.3, 24).descend(12, 0.08);
      b.whoops(2, 12, 0.8, 0.06).descend(8, 0.03);
      b.flat(3).dropoff(1.6, 25).descend(10, 0.06);
      b.flat(3).dropoff(1.2, 23).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-shore-3', biome: 'dh-shore', name: 'Ladder Bridges', difficulty: 7, par: 20000,
    challenges: [
      { text: 'Cross a ladder bridge', kind: 'grind' },
      { text: 'Cross every ladder bridge', kind: 'gaps' },
      { text: 'Ride 3 skinnies', kind: 'grind', count: 3 },
    ],
    // Ladder bridges over the gullies: hop on before the gap and ride it across.
    build: layout(48, 7, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.1).descend(8, 0.03);
      b.sign('LADDER BRIDGE').gapSkinny(5).land(16).descend(10, 0.06);
      b.whoops(2, 12, 0.8, 0.06).descend(8, 0.03);
      b.gapSkinny(6).land(16).descend(12, 0.08).descend(6, 0.02);
      b.gapSkinny(7).land(16).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-shore-4', biome: 'dh-shore', name: 'Cedar Steps', difficulty: 7, par: 9000,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'A whip off a drop', kind: 'trick', match: 'Whip', from: 'dropoff' },
      { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 },
    ],
    // Down past the big cedars: step-downs off wooden decks, then a skinny and a kicker.
    build: layout(50, 7, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.12).descend(8, 0.04);
      b.flat(3).dropoff(1.4, 24).descend(10, 0.07);
      b.flat(6).skinny(10, -0.5).flat(8).descend(10, 0.07);
      b.flat(3).dropoff(1.6, 25).descend(12, 0.1).descend(6, 0.03);
      b.kicker(5, 1.1, 1.9).flat(2).land(40).descend(10, 0.06);
      b.flat(3).dropoff(1.2, 23).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-shore-5', biome: 'dh-shore', name: 'Boardwalk', difficulty: 7, par: 39000,
    challenges: [
      { text: 'Ride a skinny for 1.2 seconds', kind: 'grind', seconds: 1.2 },
      { text: 'Ride 4 skinnies', kind: 'grind', count: 4 },
      { text: 'Stoppie along a skinny', kind: 'trick', match: 'Skinny Stoppie' },
    ],
    // A long boardwalk through the swamp, in pieces: plank after plank, downhill.
    build: layout(52, 7, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.1).descend(8, 0.03);
      b.sign('THE BOARDWALK').flat(6).skinny(14, -0.8).flat(6).descend(8, 0.04);
      b.flat(6).skinny(14, -0.8).flat(6).descend(10, 0.08);
      b.whoops(2, 12, 0.8, 0.06).descend(8, 0.02);
      b.flat(6).skinny(16, -1.0).flat(6).descend(8, 0.04);
      b.flat(6).skinny(14).flat(8).descend(16, 0.06);
    }),
  },
  {
    id: 'dh-shore-6', biome: 'dh-shore', name: 'Gully Gaps', difficulty: 8, par: 26500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A body trick over a gap', kind: 'trick', match: 'hold', overGap: true },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Wooden kickers over the creek gullies, a ladder bridge between them.
    build: layout(54, 7, (b) => {
      b.flat(8).sign('DROP IN').descend(18, 0.12).descend(8, 0.04);
      b.flat(3).sign('GAP! FULL SPEED').kicker(4.5, 1.0).pit(5, -0.6).land(36).descend(12, 0.1).descend(6, 0.03);
      b.gapSkinny(6).land(16).descend(12, 0.1).descend(6, 0.03);
      b.flat(3).kicker(5, 1.1).pit(6, -1.0).land(36).descend(12, 0.12).descend(6, 0.03);
      b.flat(3).kicker(5, 1.1).pit(6.5, -1.0).land(36).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-shore-7', biome: 'dh-shore', name: 'High Wire', difficulty: 8, par: 40000,
    challenges: [
      { text: 'Ride the high skinny', kind: 'grind', rails: [1] },
      { text: 'Ride a skinny for 1.5 seconds', kind: 'grind', seconds: 1.5 },
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
    ],
    // Skinnies higher off the ground, and a long one running down the hill.
    build: layout(56, 7, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.1).descend(8, 0.03);
      b.flat(6).skinny(12, 0, 0.8).flat(8).descend(10, 0.06);
      b.sign('THE HIGH WIRE').flat(6).skinny(18, -1.2, 1.0).flat(8).descend(10, 0.07);
      b.flat(3).dropoff(1.3, 24).descend(10, 0.06);
      b.gapSkinny(6, 0.8).land(16).descend(12, 0.08).descend(6, 0.03);
      b.flat(6).skinny(14, -0.6, 0.8).flat(8).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-shore-8', biome: 'dh-shore', name: 'Big Wood', difficulty: 9, par: 7500,
    challenges: [
      { text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 },
      { text: 'Backflip or frontflip', kind: 'trick', match: 'bodyflip' },
      { text: 'Two tricks in one air', kind: 'sameAir', match: ['bike', 'spin'] },
    ],
    // The big wooden features: tall drops and the giant wooden kicker.
    build: layout(60, 7, (b) => {
      b.flat(8).sign('DROP IN').descend(18, 0.13).descend(8, 0.04);
      b.flat(3).dropoff(1.8, 26).descend(10, 0.08);
      b.kicker(6, 1.5, 2.0).flat(3).land(45).descend(10, 0.06);
      b.flat(3).dropoff(2.0, 27).descend(12, 0.12).descend(6, 0.03);
      b.sign('BIG WOOD: TILT BACK TO BACKFLIP').flat(3).kicker(7, 2.0, 2.0).flat(3).land(45).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-shore-9', biome: 'dh-shore', name: 'Rainforest Run', difficulty: 9, par: 58000,
    challenges: [
      { text: 'Cross every ladder bridge', kind: 'gaps' },
      { text: 'Ride 5 skinnies', kind: 'grind', count: 5 },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
    ],
    // Deep in the rainforest: skinny, bridge, drop, skinny, bridge, all the way down.
    build: layout(64, 7, (b) => {
      b.flat(8).sign('DROP IN').descend(18, 0.12).descend(8, 0.03);
      b.flat(6).skinny(12, -0.6).flat(8).descend(8, 0.05);
      b.gapSkinny(6).land(16).descend(10, 0.08).descend(6, 0.02);
      b.flat(3).dropoff(1.4, 24).descend(8, 0.04);
      b.flat(6).skinny(14, -0.8, 0.8).flat(8).descend(10, 0.07);
      b.gapSkinny(7, 0.8).land(16).descend(10, 0.06);
      b.flat(6).skinny(12).flat(8).descend(8, 0.04);
      b.whoops(2, 12, 0.8, 0.06).descend(8, 0.02);
      b.flat(6).skinny(14, -0.6).flat(8).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-shore-10', biome: 'dh-shore', name: 'Shore Downhill', difficulty: 10, par: 80500,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Ride 6 skinnies', kind: 'grind', count: 6 },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
    ],
    // The big one: every kind of North Shore wood, top of the mountain to the sea.
    build: layout(70, 7, (b) => {
      b.flat(8).sign('THE SHORE DOWNHILL').descend(18, 0.13).descend(8, 0.04);
      b.flat(6).skinny(12, -0.6).flat(8).descend(8, 0.05);
      b.flat(3).dropoff(1.5, 25).descend(10, 0.07);
      b.gapSkinny(6).land(16).descend(10, 0.08).descend(6, 0.02);
      b.kicker(6, 1.5, 2.0).flat(3).land(45).descend(8, 0.05);
      b.flat(6).skinny(16, -1.0, 0.8).flat(8).descend(10, 0.07);
      b.flat(3).kicker(5, 1.1).pit(6, -1.0).land(36).descend(10, 0.08).descend(6, 0.03);
      b.gapSkinny(7, 0.8).land(16).descend(10, 0.06);
      b.flat(6).skinny(12).flat(8).descend(8, 0.04);
      b.flat(3).dropoff(1.8, 26).descend(10, 0.06);
      b.flat(6).skinny(14, -0.6).flat(8).descend(10, 0.06).sign('THE LAST JUMP').kicker(7, 2.0, 2.0).flat(3).land(45).descend(16, 0.04);
    }),
  },
];
