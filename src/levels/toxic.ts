import { TrackDef, layout, mega } from './common';

// Toxic Factory: conveyor belts. A fast belt (green arrows) carries you up to its speed; a slow
// one (red arrows, running backwards) holds you back, so pump hard all the way along it. Gaps are
// over bubbling green goo.

export const TOXIC: TrackDef[] = [
  {
    id: 'toxic-1', biome: 'toxic', name: 'Fast Belt', difficulty: 6, par: 14500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Do 12 good pumps', kind: 'pumps', count: 12 },
      { text: 'A grab over the goo', kind: 'trick', match: 'grab', overGap: true },
    ],
    build: layout(26, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4);
      b.sign('FAST BELT: GREEN ARROWS SPEED YOU UP').flat(3).conveyor(20, 11).flat(4).kicker(4, 1.2).flat(2).land(32, 4).flat(6);
      for (let i = 0; i < 3; i++) {
        b.rollers(3, 14, 1.2).flat(4);
        b.sign(i === 0 ? 'GOO GAP!' : 'GOO').flat(3).kicker(4.5, 1.4).pit(6 + i * 0.4, -0.6).land(26).flat(6);
        b.conveyor(16, 11).flat(6);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'toxic-2', biome: 'toxic', name: 'Slow Belt', difficulty: 6, par: 12500,
    challenges: [
      { text: 'Do 20 good pumps', kind: 'pumps', count: 20 },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
    ],
    // Belts running backwards: pump all the way along them to keep going.
    build: layout(26, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4);
      b.sign('SLOW BELT: PUMP ALL THE WAY!').flat(3).conveyor(16, -4).flat(4);
      for (let i = 0; i < 3; i++) {
        b.rollers(3, 14, 1.2).flat(4).conveyor(12, -4).flat(3);
        b.kicker(4.5, 1.4).pit(6 + i * 0.3, -0.6).land(26).flat(6);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'toxic-3', biome: 'toxic', name: 'Goo Gaps', difficulty: 7, par: 11000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A spin over the goo', kind: 'trick', match: 'spin', overGap: true },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Pump against the slow belt, then jump the goo.
    build: layout(30, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      for (let i = 0; i < 3; i++) {
        b.rollers(3, 14, 1.2).flat(4).conveyor(10, -4).flat(3);
        b.sign(i === 0 ? 'PUMP THE BELT, JUMP THE GOO' : 'GOO GAP!').kicker(4.5, 1.4).pit(6.4 + (i % 2) * 0.3, -0.8).land(26).flat(6);
      }
      b.rollers(3, 14, 1.2).flat(4).dropoff(1.6, 22).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'toxic-4', biome: 'toxic', name: 'Pipe Rails', difficulty: 7, par: 26000,
    challenges: [
      { text: 'Grind 3 pipes', kind: 'grind', count: 3 },
      { text: 'Grind a pipe over the goo', kind: 'grind', rails: [1] },
      { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 },
    ],
    // Grind the pipes that run along the works, one of them over the goo.
    build: layout(28, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).sign('GRIND THE PIPES').flat(6).rail(12, 0.6).flat(6);
      b.rollers(2, 14, 1.2).flat(4).conveyor(14, 11).flat(2).gapRail(5.5, 0.6).land(16).flat(6);
      b.rollers(3, 14, 1.2).flat(4).ledge(10).flat(4).conveyor(12, 11).flat(4).rail(12, 0.6).flat(6);
      b.rollers(2, 14, 1.2).flat(4).downrail(12, -2).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'toxic-5', biome: 'toxic', name: 'Barrel Stacks', difficulty: 7, par: 18000,
    challenges: [
      { text: 'A trick off every kicker', kind: 'everyKicker' },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
    ],
    // Kickers built from barrel stacks, belts in between.
    build: layout(30, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.sign('BARREL KICKERS');
      for (let i = 0; i < 4; i++) {
        b.rollers(2, 14, 1.2).flat(4).conveyor(10, i % 2 ? -4 : 11).flat(3).kicker(5, 1.6).flat(2).land(34, 4.4).flat(4);
      }
      b.rollers(3, 14, 1.2).flat(4).conveyor(10, -4).flat(3).kicker(4.5, 1.4).pit(6.8, -0.8).land(26).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'toxic-6', biome: 'toxic', name: 'Crusher Room', difficulty: 8, par: 27000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Grind and flip in one combo', kind: 'combo', include: ['grind', 'flip'] },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Past the crushers: slow belts, rails and goo, no let-up.
    build: layout(32, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).conveyor(12, -4).flat(3).kicker(4.5, 1.4).pit(6.6, -0.8).land(26).flat(6);
      b.rollers(2, 14, 1.2).flat(4).rail(12, 0.6).flat(3).kicker(4, 1.2).flat(2).land(32, 4).flat(6);
      b.rollers(3, 14, 1.2).flat(4).conveyor(12, -4).flat(3).kicker(4.5, 1.4).pit(7, -0.8).land(26).flat(6);
      b.rollers(2, 14, 1.2).flat(4).conveyor(14, 11).flat(3).rail(12, 0.6).flat(6);
      b.rollers(3, 14, 1.2).flat(4).conveyor(12, -4).flat(3).kicker(4.5, 1.4).pit(7.2, -0.8).land(26).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'toxic-7', biome: 'toxic', name: 'Chute Drop', difficulty: 8, par: 13000,
    challenges: [
      { text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A flip off a drop', kind: 'trick', match: 'flip', from: 'dropoff' },
    ],
    // Down the waste chutes: drop-offs onto slow belts, and over the goo.
    build: layout(36, 5, (b) => {
      b.flat(8).sign('DOWN THE CHUTE!').ease(12, -3).flat(6);
      for (let i = 0; i < 3; i++) {
        b.rollers(3, 14, 1.2).flat(4).dropoff(1.6, 22).flat(4).conveyor(12, -4).flat(3);
        b.kicker(4.5, 1.4).pit(6.6 + i * 0.3, -0.8).land(26).flat(6);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'toxic-8', biome: 'toxic', name: 'Switch Belts', difficulty: 8, par: 11000,
    challenges: [
      { text: 'Do 18 good pumps', kind: 'pumps', count: 18 },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
    ],
    // Fast, slow, fast, slow: ride the green ones and pump the red ones.
    build: layout(30, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.sign('GREEN: RIDE IT. RED: PUMP IT!').flat(3);
      for (let i = 0; i < 3; i++) {
        b.conveyor(12, 11).flat(2).conveyor(12, -4).flat(3).rollers(2, 14, 1.2).flat(4);
        b.conveyor(10, -4).flat(3).kicker(4.5, 1.4).pit(6.6 + i * 0.3, -0.8).land(26).flat(6);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'toxic-9', biome: 'toxic', name: 'Night Shift', difficulty: 9, par: 20000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Grind every pipe', kind: 'grind', count: 3 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // The night shift under flashing beacons: everything in the works.
    build: layout(36, 5, (b) => {
      b.flat(8).sign('NIGHT SHIFT!').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).conveyor(12, -4).flat(3).kicker(4.5, 1.4).pit(7, -0.8).land(26).flat(6);
      b.rollers(2, 14, 1.2).flat(4).conveyor(12, 11).flat(3).rail(12, 0.6).flat(6);
      b.rollers(3, 14, 1.2).flat(4).dropoff(1.6, 22).flat(4);
      b.rollers(2, 14, 1.2).flat(4).conveyor(14, 11).flat(2).gapRail(6, 0.6).land(16).flat(6);
      b.rollers(3, 14, 1.2).flat(4).conveyor(12, -4).flat(3).kicker(5, 1.6).pit(7.4, -1.0).land(26).flat(6);
      b.rollers(2, 14, 1.2).flat(4).downrail(12, -2).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'toxic-10', biome: 'toxic', name: 'Reactor Hall', difficulty: 9, par: 22500,
    challenges: [
      { text: 'Clear the final gap', kind: 'gaps', which: [-1] },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
      { text: 'Score 22,500', kind: 'score', points: 22500 },
    ],
    // Through the reactor hall and out over the biggest goo pool of all.
    build: layout(40, 5, (b) => {
      b.flat(8).sign('REACTOR HALL').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).conveyor(12, -4).flat(3).kicker(4.5, 1.4).pit(7, -0.8).land(26).flat(6);
      b.rollers(2, 14, 1.2).flat(4).conveyor(14, 11).flat(3).rail(12, 0.6).flat(3).kicker(4, 1.2).flat(2).land(32, 4).flat(6);
      b.rollers(3, 14, 1.2).flat(4).dropoff(1.8, 23).flat(4);
      b.rollers(3, 14, 1.2).flat(4).conveyor(12, -4).flat(3).kicker(5, 1.6).pit(7.2, -1.0).land(26).flat(6);
      b.rollers(3, 14, 1.3).flat(4);
      b.sign('THE BIG GOO POOL!').ease(14, -2).flat(3).kicker(6, 2.0).pit(7.4, -3).land(26).flat(10);
    }),
  },
];

/** The Smokestack Mega Ramp: roll in from the top of a chimney over a goo vat. */
export const TOXIC_MEGA: TrackDef = {
  id: 'toxic-mega', biome: 'toxic', name: 'Smokestack Mega Ramp', kind: 'mega', par: 21500,
  challenges: [
    { text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 },
    { text: 'A trick on both airs of one drop', kind: 'bothAirs' },
    { text: 'Score 21,500', kind: 'score', points: 21500 },
  ],
  build: mega(14, 9, 5.5),
};
