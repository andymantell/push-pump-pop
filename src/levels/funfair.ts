import { TrackDef, layout, pipe } from './common';

// Funfair: loops chained together. Drop in for speed, loop, and pump the dip before the next
// one to get round that too. Then coaster rails, bumper-car kickers and the Big Dipper.

export const FUNFAIR: TrackDef[] = [
  {
    id: 'funfair-1', biome: 'funfair', name: 'Loop the Loop', difficulty: 6, par: 16000,
    challenges: [
      { text: 'Ride every loop', kind: 'loop', count: 3 },
      { text: 'Do 12 good pumps', kind: 'pumps', count: 12 },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
    ],
    build: layout(30, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      for (let i = 0; i < 3; i++) {
        b.rollers(3, 14, 1.2).flat(4);
        b.sign(i === 0 ? 'LOOP THE LOOP: DROP IN FAST' : 'LOOP!').ease(14, -4).flat(4).loop(2.4).flat(6);
        b.rollers(2, 14, 1.2).flat(4).kicker(4, 1.2).flat(2).land(32, 4).flat(6);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'funfair-2', biome: 'funfair', name: 'Double Trouble', difficulty: 6, par: 17000,
    challenges: [
      { text: 'Ride both loops of a pair', kind: 'loop', count: 2 },
      { text: 'Ride every loop', kind: 'loop', count: 4 },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
    ],
    // Two loops back to back: pump the dip between them or you won't get round the second.
    build: layout(36, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      for (let i = 0; i < 2; i++) {
        b.rollers(3, 14, 1.2).flat(4);
        b.sign(i === 0 ? 'TWO LOOPS: PUMP THE DIP BETWEEN' : 'DOUBLE LOOP!').ease(14, -4).flat(4).loop(2.4).flat(3);
        b.ease(10, -2.5).flat(3).loop(2.4).flat(6);
        b.rollers(2, 14, 1.2).flat(4).kicker(4, 1.2).flat(2).land(32, 4).flat(6);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'funfair-3', biome: 'funfair', name: 'Coaster Rail', difficulty: 6, par: 20500,
    challenges: [
      { text: 'Grind the coaster track', kind: 'grind', count: 3 },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A flip over a gap', kind: 'trick', match: 'flip', overGap: true },
    ],
    // Down the coaster's track: grind the rail down every dip, then over the gaps.
    build: layout(30, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      for (let i = 0; i < 3; i++) {
        b.rollers(3, 14, 1.2).flat(4);
        b.sign(i === 0 ? 'COASTER RAIL: GRIND THE DIP' : 'COASTER').flat(4).downrail(14, -2.5).flat(6);
        b.rollers(2, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(6 + i * 0.4, -0.6).land(26).flat(6);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'funfair-4', biome: 'funfair', name: 'Loop to Gap', difficulty: 7, par: 24500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A loop and a gap in one combo', kind: 'combo', include: ['loop'], gaps: 1 },
      { text: 'A spin over a gap', kind: 'trick', match: 'spin', overGap: true },
    ],
    // Out of the loop and straight up a kicker over a gap.
    build: layout(34, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      for (let i = 0; i < 3; i++) {
        b.rollers(3, 14, 1.2).flat(4);
        b.sign(i === 0 ? 'LOOP, THEN JUMP THE GAP!' : 'LOOP TO GAP').ease(14, -4).flat(4).loop(2.4).flat(4);
        b.kicker(4.5, 1.4).pit(6.4 + i * 0.3, -0.8).land(26).flat(6);
      }
      b.rollers(2, 14, 1.2).flat(4);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'funfair-5', biome: 'funfair', name: 'Helter-Skelter', difficulty: 7, par: 20000,
    challenges: [
      { text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 },
      { text: 'Ride every loop', kind: 'loop', count: 2 },
      { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 },
    ],
    // Round and round down the helter-skelter: drop after drop, then a loop at the bottom.
    build: layout(40, 5, (b) => {
      b.flat(8).sign('HELTER-SKELTER!').ease(12, -3).flat(6);
      for (let i = 0; i < 2; i++) {
        b.rollers(3, 14, 1.2).flat(4);
        b.ease(10, -2).flat(3).ease(10, -2).flat(3).kicker(5, 1.6).flat(2).land(34, 4.4).flat(4);
        b.ease(14, -4).flat(4).loop(2.4).flat(6);
      }
      b.rollers(2, 14, 1.2).flat(4).kicker(5, 1.6).flat(2).land(34, 4.4).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'funfair-6', biome: 'funfair', name: 'Bumper Cars', difficulty: 7, par: 20000,
    challenges: [
      { text: 'A trick off every kicker', kind: 'everyKicker' },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
      { text: 'Clear every gap', kind: 'gaps' },
    ],
    // Kicker after kicker, like bumping round the bumper-car rink, and a gap at each end.
    build: layout(30, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(6.2, -0.6).land(26).flat(6);
      b.sign('BUMPER CARS: TRICK EVERY KICKER');
      for (let i = 0; i < 5; i++) b.rollers(2, 14, 1.2).flat(4).kicker(4, 1.2).flat(2).land(32, 4).flat(4);
      b.rollers(3, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(6.8, -0.6).land(26).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'funfair-7', biome: 'funfair', name: 'Loop and Grind', difficulty: 7, par: 33500,
    challenges: [
      { text: 'Grind every rail', kind: 'grind', count: 3 },
      { text: 'Ride every loop', kind: 'loop', count: 3 },
      { text: 'A loop and a grind in one combo', kind: 'combo', include: ['loop', 'grind'] },
    ],
    // Out of each loop onto a long rail along the queue line.
    build: layout(34, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      for (let i = 0; i < 3; i++) {
        b.rollers(3, 14, 1.2).flat(4);
        b.sign(i === 0 ? 'LOOP, THEN GRIND THE QUEUE RAIL' : 'LOOP AND GRIND').ease(14, -4).flat(4).loop(2.4).flat(6);
        b.rollers(1, 14, 1.0).flat(6).rail(12, 0.6).flat(6);
        b.rollers(2, 14, 1.2).flat(4).kicker(4, 1.2).flat(2).land(32, 4).flat(4);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'funfair-8', biome: 'funfair', name: 'Waltzer Spin', difficulty: 8, par: 15000,
    challenges: [
      { text: 'Land a 360', kind: 'trick', match: '360' },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A spin over every gap', kind: 'trick', match: 'spin', overGap: 'every' },
    ],
    // Spin like the waltzer: big kickers over gaps, a double loop in the middle.
    build: layout(36, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.3).flat(4);
      b.sign('WALTZER: SPIN!').flat(4).kicker(5, 1.6).pit(6.4, -1.0).land(26).flat(6);
      b.rollers(3, 14, 1.3).flat(4).ease(14, -4).flat(4).loop(2.4).flat(3).ease(10, -2.5).flat(3).loop(2.4).flat(6);
      b.rollers(3, 14, 1.3).flat(4).kicker(5, 1.6).pit(7.2, -1.0).land(26).flat(6);
      b.rollers(3, 14, 1.3).flat(4).kicker(5, 1.6).pit(7.4, -1.0).land(26).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'funfair-9', biome: 'funfair', name: 'Night Ride', difficulty: 8, par: 30000,
    challenges: [
      { text: 'Ride every loop', kind: 'loop', count: 4 },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
      { text: 'Clear every gap', kind: 'gaps' },
    ],
    // All the lights on: loops, rails, gaps and a pad, everything at the fair.
    build: layout(40, 5, (b) => {
      b.flat(8).sign('ALL THE LIGHTS ON!').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).ease(14, -4).flat(4).loop(2.4).flat(3).ease(10, -2.5).flat(3).loop(2.4).flat(6);
      b.rollers(2, 14, 1.2).flat(4).rail(12, 0.6).flat(4).pad(8).flat(4);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(7, -1.0).land(26).flat(6);
      b.rollers(2, 14, 1.2).flat(4).downrail(14, -2.5).flat(6);
      b.rollers(3, 14, 1.2).flat(4).ease(14, -4).flat(4).loop(2.4).flat(3).ease(10, -2.5).flat(3).loop(2.4).flat(6);
      b.rollers(2, 14, 1.2).flat(4).kicker(5, 1.6).pit(7.2, -1.0).land(26).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'funfair-10', biome: 'funfair', name: 'Big Dipper', difficulty: 8, par: 19500,
    challenges: [
      { text: 'Clear the final gap', kind: 'gaps', which: [-1] },
      { text: 'Ride every loop', kind: 'loop', count: 4 },
      { text: 'Score 19,500', kind: 'score', points: 19500 },
    ],
    // The Big Dipper: a huge first drop, loops, the coaster rail and the biggest gap at the fair.
    build: layout(46, 5, (b) => {
      b.flat(8).sign('THE BIG DIPPER!').ease(20, -7).flat(6);
      b.loop(2.4).flat(3).ease(10, -2.5).flat(3).loop(2.4).flat(6);
      b.rollers(3, 14, 1.2).flat(4).downrail(14, -2.5).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(7, -1.0).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(4).ease(14, -4).flat(4).loop(2.4).flat(3).ease(10, -2.5).flat(3).loop(2.4).flat(6);
      b.rollers(3, 14, 1.3).flat(4);
      b.sign('THE BIG GAP!').ease(14, -2).flat(3).kicker(6, 2.0).pit(7.4, -3).land(26).flat(10);
    }),
  },
];

export const FUNFAIR_PIPE: TrackDef = {
  id: 'funfair-pipe', biome: 'funfair', name: 'Big Top Halfpipe', kind: 'pipe', par: 22000,
  challenges: [
    { text: 'Land a spin', kind: 'trick', match: 'spin' },
    { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
    { text: 'Score 22,000', kind: 'score', points: 22000 },
  ],
  build: pipe(4.5, 5),
};
