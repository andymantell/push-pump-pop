import { TrackDef, layout } from './common';

// Muddy Woods: the downhill bike's second biome. Singletrack down through beech woods after
// rain: muddy chutes that drag at the tyres (steep enough to keep rolling, but pump through
// them), whoops to pump, roots and log drops, fallen logs ridden as skinnies, and brown
// puddles to jump. Every course falls all the way (descend), steeper and gentler by turns.

export const DH_MUD: TrackDef[] = [
  {
    id: 'dh-mud-1', biome: 'dh-mud', name: 'Squelch Lane', difficulty: 3, par: 7000,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Do 10 good pumps', kind: 'pumps', count: 10 },
      { text: 'Land a turndown', kind: 'trick', match: 'Turndown' },
    ],
    // First mud: a chute steep enough to roll through, then whoops to pump the speed back.
    build: layout(44, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.1).descend(8, 0.05);
      b.sign('MUD! PUMP THROUGH IT').muddy((m) => m.descend(12, 0.14)).descend(8, 0.08);
      b.sign('PUMP THE WHOOPS').whoops(3, 12, 0.8, 0.06).descend(10, 0.06);
      b.kicker(5, 1.0, 1.8).flat(2).land(41).descend(12, 0.1);
      b.muddy((m) => m.descend(10, 0.15)).whoops(3, 12, 0.8, 0.07).descend(10, 0.06);
      b.sign('SWIPE DOWN IN THE AIR: TURNDOWN').kicker(5, 1.0, 1.8).flat(2).land(41).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-mud-2', biome: 'dh-mud', name: 'Root Drops', difficulty: 3, par: 1500,
    challenges: [
      { text: 'Finish without losing a life', kind: 'noLives' },
      { text: 'Air for 0.8 seconds', kind: 'air', seconds: 0.8 },
      { text: 'A whip off a drop', kind: 'trick', match: 'Whip', from: 'dropoff' },
    ],
    // Down the roots: little drops between muddy chutes.
    build: layout(46, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.1).descend(8, 0.05);
      b.sign('ROOT DROP: KEEP ROLLING').flat(3).dropoff(0.7, 16).descend(10, 0.06);
      b.muddy((m) => m.descend(10, 0.14)).whoops(2, 12, 0.8, 0.06).flat(3).dropoff(1.0, 24).descend(10, 0.07);
      b.whoops(3, 12, 0.8, 0.06).flat(3).dropoff(1.2, 25).descend(12, 0.06);
      b.muddy((m) => m.descend(12, 0.15)).whoops(2, 12, 0.8, 0.07).flat(3).dropoff(0.9, 22).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-mud-3', biome: 'dh-mud', name: 'Puddle Jumps', difficulty: 4, par: 9500,
    challenges: [
      { text: 'Clear every puddle', kind: 'gaps' },
      { text: 'A trick over a puddle', kind: 'trick', match: 'any', overGap: true },
      { text: 'Do 12 good pumps', kind: 'pumps', count: 12 },
    ],
    // Brown puddles across the trail: pump the whoops before each for the speed to clear it.
    build: layout(48, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.1).descend(8, 0.04);
      b.whoops(2, 12, 0.8, 0.06).flat(3).sign('PUDDLE! JUMP IT').kicker(4.5, 1.0).pit(4.5, -0.6).land(36).descend(12, 0.06);
      b.muddy((m) => m.descend(10, 0.14)).whoops(3, 12, 0.8, 0.06).flat(3).kicker(4.5, 1.0).pit(5, -0.6).land(36).descend(12, 0.06);
      b.whoops(3, 12, 0.8, 0.06).flat(3).kicker(4.5, 1.0).pit(5.5, -0.8).land(36).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-mud-4', biome: 'dh-mud', name: 'Log Skinnies', difficulty: 4, par: 17500,
    challenges: [
      { text: 'Ride a log skinny', kind: 'grind' },
      { text: 'Ride 3 log skinnies', kind: 'grind', count: 3 },
      { text: 'Manual along a log', kind: 'trick', match: 'Skinny Manual' },
    ],
    // Fallen trunks along the trail: hop up and ride them like skinnies.
    build: layout(46, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(14, 0.08).descend(8, 0.03);
      b.sign('HOP ON THE LOG').flat(6).skinny(10).flat(8).descend(10, 0.06);
      b.whoops(3, 12, 0.8, 0.07).descend(8, 0.02);
      b.flat(6).skinny(12, -0.6).flat(8).descend(10, 0.06);
      b.muddy((m) => m.descend(10, 0.14)).whoops(2, 12, 0.8, 0.06).descend(8, 0.02);
      b.flat(6).skinny(14).flat(8).descend(14, 0.1).descend(10, 0.05);
    }),
  },
  {
    id: 'dh-mud-5', biome: 'dh-mud', name: 'The Slither', difficulty: 4, par: 4500,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Do 16 good pumps', kind: 'pumps', count: 16 },
      { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 },
    ],
    // A long muddy chute in sections, with whoops between to pump back up to speed.
    build: layout(52, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.12).descend(8, 0.05);
      b.sign('THE SLITHER').muddy((m) => m.descend(14, 0.16)).whoops(3, 12, 0.8, 0.06).descend(8, 0.04);
      b.muddy((m) => m.descend(14, 0.16)).whoops(3, 12, 0.8, 0.06).descend(8, 0.04);
      b.kicker(5, 1.0, 1.8).flat(2).land(38).descend(10, 0.08);
      b.muddy((m) => m.descend(16, 0.17)).whoops(4, 12, 0.9, 0.06).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-mud-6', biome: 'dh-mud', name: 'Brook Crossing', difficulty: 5, par: 14000,
    challenges: [
      { text: 'Clear the brook', kind: 'gaps', which: [-1] },
      { text: 'Ride the log bridge', kind: 'grind', rails: [0] },
      { text: 'A body trick over a gap', kind: 'trick', match: 'hold', overGap: true },
    ],
    // Down to the brook: ride the log bridge over the first gully, jump the brook itself.
    build: layout(52, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.1).descend(8, 0.03);
      b.sign('LOG BRIDGE').gapSkinny(6).land(16).descend(10, 0.06);
      b.whoops(3, 12, 0.8, 0.06).flat(3).kicker(4.5, 1.0).pit(5, -0.6).land(36).descend(10, 0.06);
      b.muddy((m) => m.descend(12, 0.15)).whoops(2, 12, 0.8, 0.06).flat(3).dropoff(1.0, 24).descend(8, 0.04);
      b.whoops(3, 12, 0.8, 0.06).flat(3).sign('THE BROOK').kicker(4.5, 1.0).pit(6, -1.0).land(36).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-mud-7', biome: 'dh-mud', name: 'Beech Gully', difficulty: 5, par: 12500,
    challenges: [
      { text: 'Finish without losing a life', kind: 'noLives' },
      { text: 'Air for 1 second', kind: 'air', seconds: 1 },
      { text: 'Two tricks in one air', kind: 'sameAir', match: ['bike', 'spin'] },
    ],
    // A steep gully: big drops into it and a big jump out the bottom.
    build: layout(56, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(18, 0.14).descend(8, 0.04);
      b.flat(3).dropoff(1.3, 21).descend(10, 0.1).descend(6, 0.03);
      b.muddy((m) => m.descend(12, 0.16)).whoops(2, 12, 0.8, 0.06).flat(3).dropoff(1.5, 24).descend(8, 0.03);
      b.whoops(2, 12, 0.8, 0.06).flat(3).kicker(5, 1.1).pit(6, -1.0).land(36).descend(12, 0.1).descend(6, 0.03);
      b.sign('GULLY JUMP').flat(3).kicker(7, 2.0, 2.0).flat(3).land(52).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-mud-8', biome: 'dh-mud', name: 'Rainy Race', difficulty: 6, par: 18000,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Ride 2 log skinnies', kind: 'grind', count: 2 },
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
    ],
    // Race day in the rain: a bit of everything, and long muddy stretches.
    build: layout(56, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.12).whoops(2, 12, 0.8, 0.06).descend(8, 0.02);
      b.flat(6).skinny(10).flat(8).descend(8, 0.04);
      b.muddy((m) => m.descend(14, 0.16)).whoops(3, 12, 0.8, 0.06).flat(3).kicker(4.5, 1.0).pit(5, -0.6).land(34).descend(8, 0.02);
      b.flat(6).skinny(12, -0.6).flat(8).descend(8, 0.05);
      b.flat(3).dropoff(1.2, 20).descend(8, 0.04);
      b.sign('PUMP!').muddy((m) => m.descend(10, 0.15)).whoops(5, 12, 0.9, 0.06).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-mud-9', biome: 'dh-mud', name: 'Mudslide', difficulty: 6, par: 15500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Backflip or frontflip', kind: 'trick', match: 'bodyflip' },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // The steepest woods: a muddy slide down to a big step-down, then a run of puddle gaps.
    build: layout(64, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(20, 0.16).descend(8, 0.05);
      b.sign('MUDSLIDE').muddy((m) => m.descend(18, 0.2)).descend(8, 0.05);
      b.flat(3).dropoff(1.6, 25).descend(12, 0.1).descend(6, 0.03);
      b.whoops(2, 12, 0.8, 0.06).flat(3).kicker(5, 1.1).pit(6, -1.0).land(36).descend(12, 0.1).descend(6, 0.03);
      b.sign('BIG JUMP: TILT BACK TO BACKFLIP').flat(3).kicker(7, 2.0, 2.0).flat(3).land(52).descend(10, 0.06);
      b.whoops(2, 12, 0.8, 0.06).flat(3).kicker(4.5, 1.0).pit(5.5, -0.8).land(34).descend(16, 0.04);
    }),
  },
  {
    id: 'dh-mud-10', biome: 'dh-mud', name: 'Woods Downhill', difficulty: 6, par: 24500,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Do 20 good pumps', kind: 'pumps', count: 20 },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
    ],
    // The full woods race, top to bottom: everything Muddy Woods has, back to back.
    build: layout(68, 5, (b) => {
      b.flat(8).sign('THE WOODS DOWNHILL').descend(18, 0.12).descend(8, 0.03);
      b.muddy((m) => m.descend(12, 0.15)).whoops(3, 12, 0.8, 0.06).descend(8, 0.04);
      b.flat(6).skinny(10).flat(8).descend(8, 0.05);
      b.flat(3).dropoff(1.2, 20).descend(8, 0.04);
      b.whoops(2, 12, 0.8, 0.06).flat(3).kicker(4.5, 1.0).pit(5.5, -0.8).land(38).descend(10, 0.06);
      b.kicker(5, 1.0, 1.8).flat(2).land(36).descend(8, 0.04);
      b.muddy((m) => m.descend(14, 0.16)).whoops(3, 12, 0.8, 0.06).descend(8, 0.03);
      b.sign('LOG BRIDGE').gapSkinny(6).land(16).descend(10, 0.06);
      b.whoops(2, 12, 0.8, 0.06).flat(3).dropoff(1.4, 22).descend(10, 0.05).sign('THE LAST JUMP').kicker(6, 1.6, 2.0).flat(3).land(46).descend(16, 0.04);
    }),
  },
];
