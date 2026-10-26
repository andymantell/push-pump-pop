import { TrackDef, layout, mega } from './common';

// Sky Islands: floating islands high above the clouds. Most gaps go up: launch off a kicker and
// land on the next island, higher than the last, so pump hard on the way in. Fall and you drop
// into the clouds. Rope rails cross some of the gaps.

export const SKY: TrackDef[] = [
  {
    id: 'sky-1', biome: 'sky', name: 'Island Hop', difficulty: 8, par: 8500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Do 12 good pumps', kind: 'pumps', count: 12 },
      { text: 'A grab over the clouds', kind: 'trick', match: 'grab', overGap: true },
    ],
    build: layout(30, 5, (b) => {
      b.flat(8).sign('ISLAND HOP').ease(12, -3).flat(6);
      for (let i = 0; i < 3; i++) b.rollers(3, 14, 1.2).flat(4).sign(i === 0 ? 'UPHILL GAP: PUMP IN FAST!' : 'GAP').flat(3).kicker(5, 1.6).pit(6, 0.4 + i * 0.2).land(26).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'sky-2', biome: 'sky', name: 'Up and Up', difficulty: 8, par: 12000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A flip over the clouds', kind: 'trick', match: 'flip', overGap: true },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
    ],
    build: layout(30, 5, (b) => {
      b.flat(8).sign('UP AND UP').ease(12, -3).flat(6);
      for (let i = 0; i < 4; i++) b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(i === 3 ? 5.6 : 6 + (i % 2) * 0.2, i === 3 ? 0.5 : 0.6 + (i % 2) * 0.2).land(26).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'sky-3', biome: 'sky', name: 'Rope Bridges', difficulty: 8, par: 18500,
    challenges: [
      { text: 'Grind 3 rope rails', kind: 'grind', count: 3 },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A grab off a rail', kind: 'trick', match: 'grab', fromRail: true },
    ],
    // Rope rails across the gaps: grind over, or jump it.
    build: layout(30, 5, (b) => {
      b.flat(8).sign('ROPE BRIDGES').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(8).sign('GRIND ACROSS').gapRail(6).land(16).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(6.2, 0.6).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(8).gapRail(6.5).land(16).flat(6);
      b.rollers(3, 14, 1.2).flat(4).rail(12).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'sky-4', biome: 'sky', name: 'Cloud Drops', difficulty: 8, par: 10500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A flip over the clouds', kind: 'trick', match: 'flip', overGap: true },
      { text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 },
    ],
    // Drop down onto a lower island, then jump back up.
    build: layout(34, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      for (let i = 0; i < 3; i++) {
        b.rollers(3, 14, 1.2).flat(4).dropoff(1.6, 22).flat(6);
        b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(6.2, 0.6 + i * 0.2).land(26).flat(6);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'sky-5', biome: 'sky', name: 'Windmill Isle', difficulty: 9, par: 12000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A trick off every kicker', kind: 'everyKicker' },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    build: layout(32, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(6.4, 0.8).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(4).hump(2).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(6.6, 1.0).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(6.8, 0.6).land(26).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'sky-6', biome: 'sky', name: 'Sky Temple', difficulty: 9, par: 18500,
    challenges: [
      { text: 'Grind 3 rails', kind: 'grind', count: 3 },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
    ],
    build: layout(34, 5, (b) => {
      b.flat(8).sign('THE SKY TEMPLE').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).ledge(10).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(6.4, 0.8).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(4).stairs(8).flat(8);
      b.rollers(3, 14, 1.2).flat(8).gapRail(6.5).land(16).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(6.6, 0.6).land(26).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'sky-7', biome: 'sky', name: 'Rainbow Road', difficulty: 9, par: 12000,
    challenges: [
      { text: 'Ride the loop', kind: 'loop' },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 },
    ],
    build: layout(34, 5, (b) => {
      b.flat(8).sign('RAINBOW ROAD').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(6.4, 0.8).land(26).flat(6);
      b.rollers(2, 14, 1.2).flat(6).ease(14, -4).flat(4).loop(2.4).flat(8);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(6.6, 1.0).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(4).dropoff(1.6, 22).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(7, 0.6).land(26).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'sky-8', biome: 'sky', name: 'Thunderhead', difficulty: 10, par: 14500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Do 18 good pumps', kind: 'pumps', count: 18 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    build: layout(34, 5, (b) => {
      b.flat(8).sign('INTO THE STORM').ease(12, -3).flat(6);
      for (let i = 0; i < 5; i++) b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(6.4 + (i % 3) * 0.3, 0.6 + (i % 2) * 0.4).land(26).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'sky-9', biome: 'sky', name: 'Sky Castle', difficulty: 10, par: 18500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Grind both rails', kind: 'grind', count: 2 },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
    ],
    build: layout(38, 5, (b) => {
      b.flat(8).sign('TO THE SKY CASTLE').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(6.6, 0.8).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(4).rail(12).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(6.8, 1.0).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(8).gapRail(6.5).land(16).flat(6);
      b.rollers(3, 14, 1.2).flat(4).dropoff(1.8, 23).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(7, 0.8).land(26).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'sky-10', biome: 'sky', name: 'Top of the World', difficulty: 10, par: 19500,
    challenges: [
      { text: 'Clear the final gap', kind: 'gaps', which: [-1] },
      { text: 'Land 7 different tricks', kind: 'variety', count: 7 },
      { text: 'Score 19,500', kind: 'score', points: 19500 },
    ],
    // The last island of all, and the biggest leap up onto it.
    build: layout(40, 5, (b) => {
      b.flat(8).sign('TOP OF THE WORLD').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(6.6, 0.8).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(4).hump(2.2).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(6.6, 0.8).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(8).gapRail(6.5).land(16).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(6.6, 0.6).land(26).flat(6);
      b.rollers(3, 14, 1.3).flat(4);
      b.sign('THE LAST ISLAND!').ease(14, -2).flat(3).kicker(6, 2.0).pit(7, 0.4).land(30).flat(12);
    }),
  },
];

export const SKY_MEGA: TrackDef = {
  id: 'sky-mega', biome: 'sky', name: 'Cloud Top Mega Ramp', kind: 'mega', par: 21500,
  challenges: [
    { text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 },
    { text: 'A trick on both airs of one drop', kind: 'bothAirs' },
    { text: 'Score 21,500', kind: 'score', points: 21500 },
  ],
  build: mega(14, 9, 5.5),
};
