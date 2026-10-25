import { TrackDef, layout, pipe } from './common';

// Pirate Cove: stepping stones. Little rocks stand out of the water close together: land on
// the slope down the back of each one, pump, and pop off its front lip to the next. Then
// stones mixed with kickers, plank rails and the odd big gap.

export const PIRATE: TrackDef[] = [
  {
    id: 'pirate-1', biome: 'pirate', name: 'Stepping Stones', difficulty: 5, par: 52000,
    challenges: [
      { text: 'Hop every stone', kind: 'gaps' },
      { text: 'Do 12 good pumps', kind: 'pumps', count: 12 },
      { text: 'A grab between two stones', kind: 'trick', match: 'grab', from: 'stones' },
    ],
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(3, 14, 1.2).flat(4);
      for (const [i, n] of [2, 2, 3].entries()) {
        b.sign(i === 0 ? 'STEPPING STONES: PUMP EACH LANDING' : 'STONES').flat(9).kicker(4, 1.2);
        b.stones(n, 5.2).pit(7, -1.0).land(22).flat(6);
        b.rollers(3, 14, 1.2).flat(4);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'pirate-2', biome: 'pirate', name: 'Shipwreck Shallows', difficulty: 5, par: 48000,
    challenges: [
      { text: 'Hop every stone', kind: 'gaps' },
      { text: 'Hop three stones in one combo', kind: 'combo', across: ['stones', 'stonesend'] },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
    ],
    build: layout(16, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(3, 14, 1.2).flat(4);
      b.sign('THREE STONES, ONE COMBO').flat(9).kicker(4, 1.2).stones(3, 5.4).pit(7, -1.0).land(22).flat(6);
      b.rollers(3, 14, 1.2).flat(4);
      b.sign('GAP!').flat(9).kicker(4.5, 1.4).pit(5.6, -1.2).land(26).flat(8);
      b.rollers(3, 14, 1.2).flat(4);
      b.flat(9).kicker(4, 1.2).stones(3, 5.4).pit(7, -1.0).land(22).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'pirate-3', biome: 'pirate', name: 'Plank Walk', difficulty: 5, par: 55000,
    challenges: [
      { text: 'Grind the plank', kind: 'grind' },
      { text: 'Grind, then flip, in one combo', kind: 'combo', include: ['grind', 'flip'] },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Walk the plank (grind it), off the end and onto the stones.
    build: layout(16, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(3, 14, 1.2).flat(4);
      for (let i = 0; i < 3; i++) {
        b.sign(i === 0 ? 'WALK THE PLANK: GRIND IT' : 'PLANK').flat(6).rail(9, 0.6).flat(3).kicker(4, 1.2);
        b.stones(2, 5.4).pit(7, -1.0).land(22).flat(6);
        b.rollers(3, 14, 1.2).flat(4);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'pirate-4', biome: 'pirate', name: 'Skull Rock', difficulty: 6, par: 66500,
    challenges: [
      { text: 'Hop every stone', kind: 'gaps' },
      { text: 'A flip and a grab on one set of stones', kind: 'combo', include: ['flip', 'grab'], across: ['stones', 'stonesend'] },
      { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 },
    ],
    build: layout(16, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      for (const [i, gap] of [3.8, 4.0, 4.2].entries()) {
        b.rollers(3, 14, 1.2).flat(4);
        b.sign(i === 0 ? 'SKULL ROCK STONES' : 'STONES').flat(9).kicker(4, 1.3);
        b.stones(3, gap + 1.4).pit(7, -1.0).land(22).flat(6);
      }
      b.rollers(2, 14, 1.2).flat(4);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'pirate-5', biome: 'pirate', name: 'Cannon Run', difficulty: 6, par: 56500,
    challenges: [
      { text: 'Air for 1.5 seconds', kind: 'air', seconds: 1.5 },
      { text: 'A spin over every big gap', kind: 'trick', match: 'spin', overGap: [0, 4, 8] },
      { text: 'Score 56,500', kind: 'score', points: 56500 },
    ],
    // Fired off the fort's ramps over the cove, stones in between.
    build: layout(20, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      for (let i = 0; i < 3; i++) {
        b.rollers(3, 15, 1.3).flat(4);
        b.sign(i === 0 ? 'CANNON RAMP: FIRE!' : 'FIRE!').ease(14, -1.5).flat(3).kicker(6, 2.2).pit(6.6, -2.2).land(26).flat(8);
        b.rollers(2, 14, 1.2).flat(4);
        b.flat(9).kicker(4, 1.2).stones(3, 5.4).pit(7, -1.0).land(22).flat(6);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'pirate-6', biome: 'pirate', name: 'Treasure Trail', difficulty: 6, par: 52000,
    challenges: [
      { text: 'Manual the jetty', kind: 'manual', pad: true },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
      { text: 'Land a 6-trick combo', kind: 'combo', tricks: 6 },
    ],
    build: layout(18, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(3, 14, 1.2).flat(4);
      b.sign('MANUAL THE JETTY').pad(8).flat(4).rail(9, 0.6).flat(4);
      b.rollers(3, 14, 1.2).flat(4);
      b.flat(9).kicker(4, 1.3).stones(4, 5.2).pit(7, -1.0).land(22).flat(6);
      b.rollers(2, 14, 1.2).flat(4);
      b.sign('GAP!').ease(8, -1.5).flat(3).kicker(5, 1.6).pit(6.2, -1.4).land(26).flat(8);
      b.rollers(2, 14, 1.2).flat(4).pad(8).flat(4);
      b.flat(9).kicker(4, 1.3).stones(3, 5.6).pit(7, -1.0).land(22).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'pirate-7', biome: 'pirate', name: 'Kraken Reef', difficulty: 7, par: 68000,
    challenges: [
      { text: 'Hop every stone', kind: 'gaps' },
      { text: 'Hop four stones in one combo', kind: 'combo', across: ['stones', 'stonesend'] },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Long reefs of stones, wider apart.
    build: layout(18, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      for (const [i, gap] of [4.2, 4.4].entries()) {
        b.rollers(3, 14, 1.3).flat(4);
        b.sign(i === 0 ? 'KRAKEN REEF: FOUR STONES!' : 'REEF').flat(9).kicker(4.5, 1.4);
        b.stones(4, gap + 1.4).pit(7, -1.0).land(22).flat(6);
      }
      b.rollers(3, 14, 1.3).flat(4);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'pirate-8', biome: 'pirate', name: "Captain's Revenge", difficulty: 7, par: 65000,
    challenges: [
      { text: 'Clear the final gap', kind: 'gaps', which: [-1] },
      { text: 'A flip and a grab in one combo', kind: 'combo', include: ['flip', 'grab'] },
      { text: 'Score 65,000', kind: 'score', points: 65000 },
    ],
    build: layout(24, 5, (b) => {
      b.flat(8).sign('ALL HANDS!').ease(12, -4).flat(6);
      b.rollers(3, 14, 1.2).flat(4);
      b.flat(6).rail(10, 0.6).flat(3).kicker(4, 1.2).stones(3, 5.4).pit(7, -1.0).land(22).flat(6);
      b.rollers(2, 14, 1.2).flat(4);
      b.sign('GAP!').ease(8, -1.5).flat(3).kicker(5, 1.6).pit(6.4, -1.4).land(26).flat(8);
      b.rollers(2, 14, 1.2).flat(4).pad(8).flat(4);
      b.flat(9).kicker(4.5, 1.4).stones(4, 5.6).pit(7, -1.0).land(22).flat(6);
      b.rollers(3, 14, 1.2).flat(4);
      b.flat(6).rail(12, 0.6).flat(4).kicker(4, 1.3).flat(3).land(22).flat(6);
      b.rollers(2, 14, 1.2).flat(4);
      b.sign('THE CAPTAIN\'S GAP!').ease(14, -2).flat(3).kicker(6, 2.0).pit(7, -3).land(26).flat(10);
    }),
  },
];

export const PIRATE_PIPE: TrackDef = {
  id: 'pirate-pipe', biome: 'pirate', name: 'Galleon Bowl', kind: 'pipe', par: 22000,
  challenges: [
    { text: 'Land a grab', kind: 'trick', match: 'grab' },
    { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
    { text: 'Score 22,000', kind: 'score', points: 22000 },
  ],
  build: pipe(4.5, 5),
};
