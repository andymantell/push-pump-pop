import { TrackDef, layout, mega } from './common';

// Dino Valley: giant humps. Each hump is a steep run up to a lip, a short top, then a long slope
// down the far side: hit it fast and you fly right over the top, land on the slope and pump down
// it for speed. Gaps are sticky tar pits. Fallen logs to grind.

export const DINO: TrackDef[] = [
  {
    id: 'dino-1', biome: 'dino', name: 'Dino Humps', difficulty: 7, par: 9500,
    challenges: [
      { text: 'A trick off every hump', kind: 'everyKicker' },
      { text: 'Do 12 good pumps', kind: 'pumps', count: 12 },
      { text: 'Land 4 different tricks', kind: 'variety', count: 4 },
    ],
    build: layout(30, 5, (b) => {
      b.flat(8).sign('INTO THE VALLEY').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).sign('GIANT HUMP: FLY OVER THE TOP').flat(3).hump(1.6).flat(6);
      b.rollers(3, 14, 1.2).flat(4).hump(1.8).flat(6);
      b.rollers(3, 14, 1.2).flat(4).hump(2).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'dino-2', biome: 'dino', name: 'Tar Pits', difficulty: 7, par: 12000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A grab over the tar', kind: 'trick', match: 'grab', overGap: true },
      { text: 'Air for 1 second', kind: 'air', seconds: 1 },
    ],
    build: layout(30, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).sign('TAR PIT!').flat(3).kicker(4.5, 1.4).pit(6.2, -0.8).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(4).hump(1.8).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(6.6, -0.8).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(7, -1.0).land(26).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'dino-3', biome: 'dino', name: 'Stego Spine', difficulty: 7, par: 14000,
    challenges: [
      { text: 'A trick off every hump', kind: 'everyKicker' },
      { text: 'A flip off a hump', kind: 'trick', match: 'flip', from: 'hump' },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
    ],
    // Humps in a row like the plates on a stegosaurus: pump down each one into the next.
    build: layout(32, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).sign('HUMP AFTER HUMP');
      for (let i = 0; i < 4; i++) b.flat(4).hump(1.6 + (i % 2) * 0.3).flat(2).rollers(1, 14, 1.2);
      b.flat(6).ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'dino-4', biome: 'dino', name: 'Log Jam', difficulty: 7, par: 19000,
    challenges: [
      { text: 'Grind 3 logs', kind: 'grind', count: 3 },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
    ],
    // Fallen tree trunks to grind, one across the tar.
    build: layout(30, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).sign('GRIND THE LOGS').flat(6).rail(12).flat(6);
      b.rollers(3, 14, 1.2).flat(4).hump(1.8).flat(6);
      b.rollers(3, 14, 1.2).flat(8).gapRail(5.5).land(16).flat(6);
      b.rollers(3, 14, 1.2).flat(4).downrail(12, -2).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(6.6, -0.8).land(26).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'dino-5', biome: 'dino', name: 'Big Back', difficulty: 8, par: 10500,
    challenges: [
      { text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 },
      { text: 'A trick off every hump', kind: 'everyKicker' },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Bigger humps: pump hard to clear the top.
    build: layout(34, 5, (b) => {
      b.flat(8).sign('BIG HUMPS!').ease(12, -3).flat(6);
      for (let i = 0; i < 3; i++) b.rollers(3, 14, 1.2).flat(4).hump(2.2 + i * 0.2).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(7, -1.0).land(26).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'dino-6', biome: 'dino', name: 'Swamp Run', difficulty: 8, par: 14500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A spin over the tar', kind: 'trick', match: 'spin', overGap: true },
      { text: 'Do 16 good pumps', kind: 'pumps', count: 16 },
    ],
    build: layout(32, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      for (let i = 0; i < 4; i++) {
        b.rollers(3, 14, 1.2).flat(4).kicker(4.5 + (i % 2) * 0.5, 1.4 + (i % 2) * 0.2).pit(6.6 + i * 0.25, -0.8 - (i % 2) * 0.2).land(26).flat(6);
        if (i === 1) b.rollers(2, 14, 1.2).flat(4).hump(2).flat(6);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'dino-7', biome: 'dino', name: 'Pterodactyl Ridge', difficulty: 8, par: 7500,
    challenges: [
      { text: 'Air for 1.3 seconds', kind: 'air', seconds: 1.3 },
      { text: 'A grab off a hump', kind: 'trick', match: 'grab', from: 'hump' },
      { text: 'Clear every gap', kind: 'gaps' },
    ],
    build: layout(36, 5, (b) => {
      b.flat(8).sign('UP ON THE RIDGE').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).hump(2.2).flat(6);
      b.rollers(3, 14, 1.2).flat(4).dropoff(1.6, 22).flat(6);
      b.rollers(3, 14, 1.2).flat(4).hump(2.5).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(7.2, -1.0).land(26).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'dino-8', biome: 'dino', name: 'T. rex Alley', difficulty: 8, par: 22500,
    challenges: [
      { text: 'Grind 3 logs', kind: 'grind', count: 3 },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    build: layout(34, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).hump(2).flat(6).rail(12).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(7, -0.8).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(8).gapRail(6).land(16).flat(6);
      b.rollers(3, 14, 1.2).flat(4).hump(2.4).flat(6);
      b.rollers(3, 14, 1.2).flat(4).downrail(12, -2).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'dino-9', biome: 'dino', name: 'Night Herd', difficulty: 9, par: 12500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A trick off every hump', kind: 'everyKicker' },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
    ],
    build: layout(38, 5, (b) => {
      b.flat(8).sign('NIGHT HERD').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).hump(2.2).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(7, -0.8).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(4).hump(2.6).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(7.4, -1.0).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(4).hump(2.4).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'dino-10', biome: 'dino', name: 'Volcano Valley', difficulty: 9, par: 17500,
    challenges: [
      { text: 'Clear the final gap', kind: 'gaps', which: [-1] },
      { text: 'Air for 1.4 seconds', kind: 'air', seconds: 1.4 },
      { text: 'Score 17,500', kind: 'score', points: 17500 },
    ],
    // Out of the valley as the volcano blows: the biggest hump of all, then one last tar pit.
    build: layout(42, 5, (b) => {
      b.flat(8).sign('THE VOLCANO IS BLOWING!').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).hump(2.2).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(7, -0.8).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(7.2, -1.0).land(26).flat(6);
      b.rollers(3, 14, 1.2).flat(4).dropoff(1.8, 23).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(5, 1.6).pit(7.4, -1.0).land(26).flat(6);
      b.rollers(3, 14, 1.3).flat(4).sign('THE BIGGEST HUMP!').flat(3).hump(3).flat(6);
      b.rollers(3, 14, 1.3).flat(4);
      b.sign('THE BIG TAR PIT!').ease(14, -2).flat(3).kicker(6, 2.0).pit(7.4, -3).land(26).flat(10);
    }),
  },
];

export const DINO_MEGA: TrackDef = {
  id: 'dino-mega', biome: 'dino', name: 'Long Neck Mega Ramp', kind: 'mega', par: 21500,
  challenges: [
    { text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 },
    { text: 'A trick on both airs of one drop', kind: 'bothAirs' },
    { text: 'Score 21,500', kind: 'score', points: 21500 },
  ],
  build: mega(14, 9, 5.5),
};
