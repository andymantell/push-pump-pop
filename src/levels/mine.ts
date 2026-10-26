import { TrackDef, layout, mega } from './common';

// Crystal Mine: rail lines. The old mine-cart rails run all through the caves. Grind off the end
// of one and you drop onto the next one down (a rail chain); some climb up over the rock, which
// slows you, so pump into them. Gaps are dark shafts.

export const MINE: TrackDef[] = [
  {
    id: 'mine-1', biome: 'mine', name: 'Cart Rails', difficulty: 6, par: 21500,
    challenges: [
      { text: 'Grind 4 rails', kind: 'grind', count: 4 },
      { text: 'Do 12 good pumps', kind: 'pumps', count: 12 },
      { text: 'Land 4 different tricks', kind: 'variety', count: 4 },
    ],
    build: layout(26, 5, (b) => {
      b.flat(8).sign('INTO THE MINE').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).sign('GRIND THE CART RAILS').flat(6).rail(12).flat(6);
      b.rollers(3, 14, 1.2).flat(4).sign('RAIL TO RAIL: GRIND OFF THE END').flat(6).railchain(3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(4, 1.2).flat(2).land(32, 4).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'mine-2', biome: 'mine', name: 'Rail Hop', difficulty: 6, par: 32500,
    challenges: [
      { text: 'Grind 6 rails', kind: 'grind', count: 6 },
      { text: 'A grab off a rail', kind: 'trick', match: 'grab', fromRail: true },
      { text: 'Clear every gap', kind: 'gaps' },
    ],
    build: layout(28, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).sign('RAIL CHAIN').flat(6).railchain(3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).sign('MINE SHAFT!').flat(3).kicker(4.5, 1.4).pit(6, -0.6).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(4).flat(6).railchain(3).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'mine-3', biome: 'mine', name: 'Up the Rock', difficulty: 7, par: 36500,
    challenges: [
      { text: 'Grind 4 rails', kind: 'grind', count: 4 },
      { text: 'Do 14 good pumps', kind: 'pumps', count: 14 },
      { text: 'Clear every gap', kind: 'gaps' },
    ],
    // Rails that climb up over the rock: pump hard into them, grinding uphill slows you down.
    build: layout(26, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).sign('UP RAIL: PUMP INTO IT!').flat(6).uprail(10, 1.2).downrail(12, -2).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(6.2, -0.6).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(6).uprail(10, 1.2).railchain(2).ramp(6, -1).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(6.6, -0.8).land(26).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'mine-4', biome: 'mine', name: 'Dark Shafts', difficulty: 7, par: 26000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Grind a rail over a shaft', kind: 'grind', rails: [1] },
      { text: 'A flip over a shaft', kind: 'trick', match: 'flip', overGap: true },
    ],
    build: layout(30, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).sign('MIND THE SHAFTS').flat(3).kicker(4.5, 1.4).pit(6.2, -0.8).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(4).rail(10).flat(8).sign('GRIND ACROSS').gapRail(5.5).land(16).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(6.8, -0.8).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(7.2, -1.0).land(26).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'mine-5', biome: 'mine', name: 'Rail Lines', difficulty: 7, par: 46000,
    challenges: [
      { text: 'Grind 8 rails', kind: 'grind', count: 8 },
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
    ],
    // The long rail lines down through the workings.
    build: layout(30, 5, (b) => {
      b.flat(8).sign('THE RAIL LINES').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(10).railchain(4).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(4, 1.2).flat(2).land(32, 4).flat(6);
      b.rollers(3, 14, 1.2).flat(10).railchain(4, 6).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'mine-6', biome: 'mine', name: 'Mine Mouth', difficulty: 8, par: 24000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A grab over a shaft', kind: 'trick', match: 'grab', overGap: true },
      { text: 'Grind 4 rails', kind: 'grind', count: 4 },
    ],
    // Out at the mine mouth: ledges of rock to drop off, and rails along the edge.
    build: layout(34, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).dropoff(1.6, 22).flat(6);
      b.rollers(3, 14, 1.2).flat(10).railchain(3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(6.8, -0.8).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(4).dropoff(1.6, 22).flat(6).rail(12).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(7, -1.0).land(26).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'mine-7', biome: 'mine', name: 'Cart Bridges', difficulty: 8, par: 24500,
    challenges: [
      { text: 'Grind every bridge', kind: 'grind', count: 3 },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Old cart bridges over the hollows: grind across, or ride down through.
    build: layout(30, 5, (b) => {
      b.flat(8).sign('CART BRIDGES').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(10).bridge(22, 3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(6.6, -0.8).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(10).bridge(24, 3.5).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(7, -1.0).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(10).bridge(24, 4).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'mine-8', biome: 'mine', name: 'Deep Seam', difficulty: 8, par: 32500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A spin over a shaft', kind: 'trick', match: 'spin', overGap: true },
      { text: 'Do 16 good pumps', kind: 'pumps', count: 16 },
    ],
    build: layout(32, 5, (b) => {
      b.flat(8).sign('DOWN THE DEEP SEAM').ease(12, -3).flat(6);
      for (let i = 0; i < 4; i++) {
        b.rollers(3, 14, 1.2).flat(4).kicker(4.5 + (i % 2) * 0.5, 1.4 + (i % 2) * 0.2).pit(6.6 + i * 0.25, -0.8 - (i % 2) * 0.2).land(26).flat(6);
        if (i === 1) b.flat(4).uprail(10, 1.2).downrail(12, -2).flat(6);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'mine-9', biome: 'mine', name: 'Down the Shaft', difficulty: 9, par: 40500,
    challenges: [
      { text: 'Grind 5 rails', kind: 'grind', count: 5 },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    build: layout(38, 5, (b) => {
      b.flat(8).sign('DOWN THE SHAFT!').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).downrail(12, -2).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(7, -0.8).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(10).railchain(3).flat(4).dropoff(1.6, 22).flat(6);
      b.rollers(3, 14, 1.2).flat(4).rail(8).flat(8).gapRail(6).land(16).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(7.4, -1.0).land(26).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'mine-10', biome: 'mine', name: 'Heart of the Mine', difficulty: 9, par: 52500,
    challenges: [
      { text: 'Clear the final gap', kind: 'gaps', which: [-1] },
      { text: 'Grind 7 rails', kind: 'grind', count: 7 },
      { text: 'Score 52,500', kind: 'score', points: 52500 },
    ],
    // Right down in the crystal cavern at the heart of the mine.
    build: layout(40, 5, (b) => {
      b.flat(8).sign('HEART OF THE MINE').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(10).railchain(4).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(7, -0.8).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(6).uprail(10, 1.2).downrail(12, -2).flat(6);
      b.rollers(3, 14, 1.2).flat(4).dropoff(1.8, 23).flat(6);
      b.rollers(3, 14, 1.2).flat(4).rail(8).flat(8).gapRail(6).land(16).flat(6);
      b.rollers(3, 14, 1.3).flat(4);
      b.sign('THE CRYSTAL CAVERN!').ease(14, -2).flat(3).kicker(6, 2.0).pit(7.4, -3).land(26).flat(10);
    }),
  },
];

export const MINE_MEGA: TrackDef = {
  id: 'mine-mega', biome: 'mine', name: 'Mine Shaft Mega Ramp', kind: 'mega', par: 21500,
  challenges: [
    { text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 },
    { text: 'A trick on both airs of one drop', kind: 'bothAirs' },
    { text: 'Score 21,500', kind: 'score', points: 21500 },
  ],
  build: mega(14, 9, 5.5),
};
