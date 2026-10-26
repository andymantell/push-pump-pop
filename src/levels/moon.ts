import { TrackDef, layout, pipe } from './common';

// Moon Base: low gravity (7 instead of 14). Every air goes twice as high and hangs twice as
// long, so there's time for big tricks, and the jumps, gaps and landings are all bigger to
// match. Gaps are craters.

export const MOON: TrackDef[] = [
  {
    id: 'moon-1', biome: 'moon', name: 'Moon Walk', difficulty: 7, par: 10000,
    challenges: [
      { text: 'Air for 1.5 seconds', kind: 'air', seconds: 1.5 },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
      { text: 'Do 12 good pumps', kind: 'pumps', count: 12 },
    ],
    build: layout(30, 5, (b) => {
      b.flat(8).sign('LOW GRAVITY: FLOAT!').ease(12, -3).flat(6);
      b.rollers(3, 18, 1.2).flat(4).kicker(4, 1.2).flat(2).land(56, 5.6).flat(8);
      b.rollers(3, 18, 1.2).flat(4).sign('CRATER!').flat(3).kicker(4.5, 1.4).pit(8, -0.8).land(44).flat(8);
      b.rollers(3, 18, 1.2).flat(4).kicker(5, 1.6).flat(2).land(60, 6.2).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'moon-2', biome: 'moon', name: 'Crater Hops', difficulty: 7, par: 13000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Two tricks in one air', kind: 'sameAir', match: ['flip', 'grab'] },
      { text: 'A spin over a crater', kind: 'trick', match: 'spin', overGap: true },
    ],
    build: layout(30, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      for (let i = 0; i < 4; i++) b.rollers(3, 18, 1.2).flat(4).kicker(4.5 + (i % 2) * 0.5, 1.4 + (i % 2) * 0.2).pit(8 + i * 0.6, -0.8 - (i % 2) * 0.2).land(44).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'moon-3', biome: 'moon', name: 'Launch Pad', difficulty: 8, par: 8500,
    challenges: [
      { text: 'Air for 2 seconds', kind: 'air', seconds: 2 },
      { text: 'A trick off every kicker', kind: 'everyKicker' },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
    ],
    // Big kickers: launch into space.
    build: layout(34, 5, (b) => {
      b.flat(8).sign('BIG KICKERS: BLAST OFF!').ease(12, -3).flat(6);
      for (let i = 0; i < 3; i++) b.rollers(3, 18, 1.2).flat(4).kicker(6, 2 + i * 0.3).flat(2).land(64, 6.6).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'moon-4', biome: 'moon', name: 'Space Rails', difficulty: 8, par: 32500,
    challenges: [
      { text: 'Grind 4 rails', kind: 'grind', count: 4 },
      { text: 'Grind a rail over a crater', kind: 'grind', rails: [1] },
      { text: 'A grab over a crater', kind: 'trick', match: 'grab', overGap: true },
    ],
    build: layout(32, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 18, 1.2).flat(4).sign('GRIND THE PIPELINE').flat(6).rail(14).flat(8);
      b.rollers(3, 18, 1.2).flat(8).gapRail(7).land(20).flat(8);
      b.rollers(3, 18, 1.2).flat(4).kicker(4.5, 1.4).pit(8.4, -0.8).land(44).flat(8);
      b.rollers(3, 18, 1.2).flat(4).downrail(14, -2.4).flat(8).rail(12).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'moon-5', biome: 'moon', name: 'Loop the Moon', difficulty: 8, par: 13500,
    challenges: [
      { text: 'Ride every loop', kind: 'loop', count: 2 },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Air for 1.8 seconds', kind: 'air', seconds: 1.8 },
    ],
    build: layout(32, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(2, 18, 1.2).flat(6).sign('MOON LOOP').ease(14, -4).flat(4).loop(3).flat(8);
      b.rollers(3, 18, 1.2).flat(4).kicker(4.5, 1.4).pit(8.6, -0.8).land(44).flat(8);
      b.rollers(2, 18, 1.2).flat(6).ease(14, -4).flat(4).loop(3).flat(8);
      b.rollers(3, 18, 1.2).flat(4).kicker(5, 1.6).pit(9, -1.0).land(44).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'moon-6', biome: 'moon', name: 'Moon Humps', difficulty: 8, par: 8500,
    challenges: [
      { text: 'A trick off every hump', kind: 'everyKicker' },
      { text: 'Air for 2 seconds', kind: 'air', seconds: 2 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    build: layout(36, 5, (b) => {
      b.flat(8).sign('MOON HUMPS').ease(12, -3).flat(6);
      for (let i = 0; i < 3; i++) b.rollers(3, 18, 1.2).flat(4).kicker(2.6 * (2 + i * 0.4) + 1, 2 + i * 0.4).spot('hump').flat(2).land(64 + i * 6, 6.8 + i * 1.0).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'moon-7', biome: 'moon', name: 'Crater Drops', difficulty: 9, par: 7500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A flip off a drop', kind: 'trick', match: 'flip', from: 'dropoff' },
      { text: 'Air for 2 seconds', kind: 'air', seconds: 2 },
    ],
    build: layout(40, 5, (b) => {
      b.flat(8).sign('DOWN INTO THE CRATER').ease(12, -3).flat(6);
      b.rollers(3, 18, 1.2).flat(4).dropoff(2.4, 32).flat(8);
      b.rollers(3, 18, 1.2).flat(4).kicker(4.5, 1.4).pit(9, -1.0).land(44).flat(8);
      b.rollers(3, 18, 1.2).flat(4).dropoff(2.4, 32).flat(8);
      b.rollers(3, 18, 1.2).flat(4).kicker(5, 1.6).pit(9.6, -1.0).land(44).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'moon-8', biome: 'moon', name: 'Rocket Run', difficulty: 9, par: 29000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Grind 3 rails', kind: 'grind', count: 3 },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
    ],
    build: layout(36, 5, (b) => {
      b.flat(8).sign('ROCKET RUN!').ease(12, -3).flat(6);
      b.rollers(3, 18, 1.2).flat(4).kicker(4.5, 1.4).pit(9, -0.8).land(44).flat(8);
      b.rollers(3, 18, 1.2).flat(4).rail(14).flat(8);
      b.rollers(3, 18, 1.2).flat(4).kicker(6, 2.2).flat(2).land(64, 6.6).flat(8);
      b.rollers(3, 18, 1.2).flat(8).gapRail(7).land(20).flat(8);
      b.rollers(3, 18, 1.2).flat(4).downrail(14, -2.4).flat(8);
      b.rollers(3, 18, 1.2).flat(4).kicker(5, 1.6).pit(9.6, -1.0).land(44).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'moon-9', biome: 'moon', name: 'Dark Side', difficulty: 10, par: 16500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Land 7 different tricks', kind: 'variety', count: 7 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    build: layout(40, 5, (b) => {
      b.flat(8).sign('THE DARK SIDE').ease(12, -3).flat(6);
      for (let i = 0; i < 5; i++) {
        b.rollers(3, 18, 1.2).flat(4).kicker(4.5 + (i % 2) * 0.5, 1.4 + (i % 2) * 0.2).pit(9 + i * 0.4, -0.8 - (i % 2) * 0.2).land(44).flat(8);
        if (i === 2) b.rollers(3, 18, 1.2).flat(4).dropoff(2.4, 32).flat(8);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'moon-10', biome: 'moon', name: 'Moonshot', difficulty: 10, par: 23000,
    challenges: [
      { text: 'Clear the final gap', kind: 'gaps', which: [-1] },
      { text: 'Air for 2.5 seconds', kind: 'air', seconds: 2.5 },
      { text: 'Score 23,000', kind: 'score', points: 23000 },
    ],
    // Everything on the moon, then the biggest crater of all.
    build: layout(46, 5, (b) => {
      b.flat(8).sign('MOONSHOT!').ease(12, -3).flat(6);
      b.rollers(3, 18, 1.2).flat(4).kicker(4.5, 1.4).pit(9, -0.8).land(44).flat(8);
      b.rollers(2, 18, 1.2).flat(6).ease(14, -4).flat(4).loop(3).flat(8);
      b.rollers(3, 18, 1.2).flat(4).kicker(5, 1.6).pit(9.6, -1.0).land(44).flat(8);
      b.rollers(3, 18, 1.2).flat(4).rail(14).flat(8);
      b.rollers(3, 18, 1.2).flat(4).dropoff(2.4, 32).flat(8);
      b.rollers(3, 18, 1.2).flat(4).kicker(5, 1.6).pit(10, -1.0).land(44).flat(8);
      b.rollers(3, 18, 1.3).flat(4);
      b.sign('THE BIGGEST CRATER!').ease(14, -2).flat(3).kicker(6, 2.0).pit(10, -3).land(54, 7).flat(12);
    }),
  },
];

export const MOON_PIPE: TrackDef = {
  id: 'moon-pipe', biome: 'moon', name: 'Crater Halfpipe', kind: 'pipe', par: 21500,
  challenges: [
    { text: 'Air for 2 seconds', kind: 'air', seconds: 2 },
    { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
    { text: 'Score 21,500', kind: 'score', points: 21500 },
  ],
  build: pipe(4.5, 5),
};
