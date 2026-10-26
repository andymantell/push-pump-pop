import { TrackDef, layout } from './common';

// Boulder Peak: the downhill bike's third biome, high in the mountains above the trees. Rock
// gardens to balance through (tilt against the rocks or go over the bars), boulder drops,
// steep scree chutes, and gaps between the crags. Every course falls all the way (descend).

export const DH_ROCKY: TrackDef[] = [
  {
    id: 'dh-rocky-1', biome: 'dh-rocky', name: 'First Rocks', difficulty: 5, par: 5000,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Ride through a rock garden', kind: 'trick', match: 'Rock Garden' },
      { text: 'Ride 3 rock gardens', kind: 'trick', match: 'Rock Garden', count: 3 },
    ],
    // First rocks: short gardens on gentle slopes, with room to settle between them.
    build: layout(44, 6, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.1).descend(8, 0.05);
      b.sign('ROCKS! TILT TO BALANCE').rocky((r) => r.descend(10, 0.06), 0.14).descend(12, 0.08);
      b.rocky((r) => r.descend(12, 0.07), 0.16).descend(14, 0.1).descend(8, 0.04);
      b.kicker(5, 1.0, 1.8).flat(2).land(38).descend(10, 0.08);
      b.rocky((r) => r.descend(12, 0.07), 0.16).descend(16, 0.06);
    }),
  },
  {
    id: 'dh-rocky-2', biome: 'dh-rocky', name: 'Boulder Steps', difficulty: 5, par: 2500,
    challenges: [
      { text: 'Finish without losing a life', kind: 'noLives' },
      { text: 'Air for 0.6 seconds', kind: 'air', seconds: 0.6 },
      { text: 'A whip off a boulder', kind: 'trick', match: 'Whip', from: 'dropoff' },
    ],
    // Down a staircase of boulders: a drop, a run-out, a drop.
    build: layout(46, 6, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.1).descend(8, 0.04);
      b.sign('BOULDER DROP').flat(3).dropoff(1.0, 22).descend(10, 0.07);
      b.flat(3).dropoff(1.3, 24).descend(12, 0.08);
      b.rocky((r) => r.descend(10, 0.06), 0.14).descend(10, 0.06);
      b.flat(3).dropoff(1.5, 25).descend(10, 0.06);
      b.flat(3).dropoff(1.2, 22).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-rocky-3', biome: 'dh-rocky', name: 'Scree Chute', difficulty: 6, par: 17500,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Air for 1 second', kind: 'air', seconds: 1 },
      { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 },
    ],
    // Loose scree, steep: fast chutes, and jumps at the bottom of each to use the speed.
    build: layout(50, 6, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.12).descend(8, 0.05);
      b.sign('SCREE CHUTE').descend(14, 0.2).descend(8, 0.04).kicker(5, 1.1, 1.9).flat(2).land(42).descend(8, 0.05);
      b.rocky((r) => r.descend(10, 0.06), 0.14).descend(8, 0.05);
      b.descend(14, 0.22).descend(8, 0.04).kicker(6, 1.5, 2.0).flat(3).land(46).descend(8, 0.05);
      b.descend(12, 0.18).descend(8, 0.04).kicker(5, 1.1, 1.9).flat(2).land(42).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-rocky-4', biome: 'dh-rocky', name: 'Crag Gaps', difficulty: 6, par: 26000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A trick over a gap', kind: 'trick', match: 'any', overGap: true },
      { text: 'A body trick over a gap', kind: 'trick', match: 'hold', overGap: true },
    ],
    // Cracks in the mountain to jump: steeper run-ins for the bigger ones.
    build: layout(52, 6, (b) => {
      b.flat(8).sign('DROP IN').descend(18, 0.12).descend(8, 0.04);
      b.flat(3).sign('GAP! FULL SPEED').kicker(4.5, 1.0).pit(5, -0.6).land(36).descend(12, 0.1).descend(6, 0.03);
      b.rocky((r) => r.descend(10, 0.06), 0.15).descend(10, 0.1).descend(6, 0.03);
      b.flat(3).kicker(5, 1.1).pit(6, -1.0).land(36).descend(12, 0.12).descend(6, 0.03);
      b.flat(3).kicker(5, 1.1).pit(6.5, -1.0).land(36).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-rocky-5', biome: 'dh-rocky', name: 'The Rattler', difficulty: 6, par: 6500,
    challenges: [
      { text: 'Finish without losing a life', kind: 'noLives' },
      { text: 'Ride 4 rock gardens', kind: 'trick', match: 'Rock Garden', count: 4 },
      { text: 'Do 8 good pumps', kind: 'pumps', count: 8 },
    ],
    // Long rock gardens, one after another: keep your balance all the way down.
    build: layout(52, 6, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.1).descend(8, 0.04);
      b.sign('THE RATTLER').rocky((r) => r.descend(12, 0.07), 0.15).descend(10, 0.08);
      b.whoops(3, 12, 0.8, 0.06).descend(10, 0.02);
      b.rocky((r) => r.descend(12, 0.07), 0.15).descend(10, 0.08);
      b.rocky((r) => r.descend(12, 0.07), 0.16).descend(10, 0.08);
      b.whoops(3, 12, 0.8, 0.06).descend(10, 0.02);
      b.rocky((r) => r.descend(12, 0.07), 0.16).descend(16, 0.06);
    }),
  },
  {
    id: 'dh-rocky-6', biome: 'dh-rocky', name: 'Ridge Line', difficulty: 7, par: 25000,
    challenges: [
      { text: 'Ride a rock slab', kind: 'grind' },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
    ],
    // Along the knife-edge ridge: narrow slabs to ride and gaps between the rocks.
    build: layout(54, 6, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.1).descend(8, 0.03);
      b.sign('RIDE THE SLAB').flat(6).skinny(10).flat(8).descend(12, 0.12).descend(6, 0.03);
      b.flat(3).kicker(4.5, 1.0).pit(5.5, -0.8).land(36).descend(10, 0.08).descend(6, 0.03);
      b.rocky((r) => r.descend(12, 0.07), 0.16).descend(8, 0.04);
      b.flat(6).skinny(12, -0.6).flat(8).descend(10, 0.08);
      b.flat(3).kicker(5, 1.1).pit(6, -1.0).land(36).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-rocky-7', biome: 'dh-rocky', name: 'Big Boulders', difficulty: 7, par: 5500,
    challenges: [
      { text: 'Finish without losing a life', kind: 'noLives' },
      { text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 },
      { text: 'Backflip or frontflip', kind: 'trick', match: 'bodyflip' },
    ],
    // Bigger drops off bigger boulders, and the big jump at the bottom.
    build: layout(58, 6, (b) => {
      b.flat(8).sign('DROP IN').descend(18, 0.13).descend(8, 0.04);
      b.flat(3).dropoff(1.5, 25).descend(10, 0.08);
      b.rocky((r) => r.descend(12, 0.07), 0.18).descend(8, 0.05);
      b.flat(3).dropoff(1.8, 26).descend(10, 0.1).descend(6, 0.03);
      b.flat(3).dropoff(1.4, 24).descend(12, 0.12).descend(6, 0.03);
      b.sign('BIG JUMP: TILT BACK TO BACKFLIP').flat(3).kicker(7, 2.0, 2.0).flat(3).land(52).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-rocky-8', biome: 'dh-rocky', name: 'Avalanche Run', difficulty: 7, par: 24000,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Two tricks in one air', kind: 'sameAir', match: ['bike', 'spin'] },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
    ],
    // Straight down the avalanche track: steep, fast, and jumps all the way.
    build: layout(62, 6, (b) => {
      b.flat(8).sign('DROP IN').descend(20, 0.16).descend(8, 0.04);
      b.kicker(6, 1.5, 2.0).flat(3).land(46).descend(12, 0.18).descend(6, 0.04);
      b.kicker(6, 1.5, 2.0).flat(3).land(46).descend(8, 0.06);
      b.rocky((r) => r.descend(12, 0.07), 0.18).descend(12, 0.2).descend(6, 0.04);
      b.flat(3).kicker(5, 1.1).pit(6, -1.0).land(36).descend(12, 0.16).descend(6, 0.04);
      b.sign('LAST KICKER').kicker(7, 2.0, 2.0).flat(3).land(52).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-rocky-9', biome: 'dh-rocky', name: 'Eagle Crag', difficulty: 8, par: 21500,
    challenges: [
      { text: 'Clear the crag gap', kind: 'gaps', which: [-1] },
      { text: 'A trick over the crag gap', kind: 'trick', match: 'any', overGap: true },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // The crag: rock gardens on the steep, a big drop off the crag itself, then the crag gap.
    build: layout(64, 6, (b) => {
      b.flat(8).sign('DROP IN').descend(18, 0.13).descend(8, 0.04);
      b.rocky((r) => r.descend(14, 0.08), 0.18).descend(10, 0.1).descend(6, 0.03);
      b.flat(3).sign('EAGLE CRAG').dropoff(2.0, 28).descend(12, 0.08);
      b.rocky((r) => r.descend(12, 0.07), 0.2).descend(8, 0.05);
      b.flat(6).skinny(12, -0.6).flat(8).descend(12, 0.14).descend(6, 0.03);
      b.flat(3).sign('THE CRAG GAP').kicker(6, 1.6, 2.0).pit(8, -1.2).land(46).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-rocky-10', biome: 'dh-rocky', name: 'Peak Downhill', difficulty: 8, par: 29500,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Ride 5 rock gardens', kind: 'trick', match: 'Rock Garden', count: 5 },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
    ],
    // The whole mountain, summit to valley: everything Boulder Peak has, back to back.
    build: layout(70, 6, (b) => {
      b.flat(8).sign('THE PEAK DOWNHILL').descend(18, 0.13).descend(8, 0.04);
      b.rocky((r) => r.descend(14, 0.07), 0.18).descend(8, 0.05);
      b.flat(3).dropoff(1.5, 25).descend(10, 0.07);
      b.rocky((r) => r.descend(12, 0.07), 0.18).descend(12, 0.2).descend(6, 0.04);
      b.kicker(6, 1.5, 2.0).flat(3).land(46).descend(8, 0.05);
      b.rocky((r) => r.descend(14, 0.08), 0.2).descend(8, 0.05);
      b.flat(6).skinny(10).flat(8).descend(10, 0.08);
      b.flat(3).kicker(5, 1.1).pit(6, -1.0).land(36).descend(10, 0.08);
      b.rocky((r) => r.descend(12, 0.07), 0.18).descend(8, 0.05);
      b.rocky((r) => r.descend(10, 0.07), 0.16).descend(10, 0.1).descend(6, 0.03);
      b.flat(3).dropoff(1.8, 26).descend(10, 0.06).sign('THE LAST JUMP').kicker(7, 2.0, 2.0).flat(3).land(52).descend(16, 0.04);
    }),
  },
];
