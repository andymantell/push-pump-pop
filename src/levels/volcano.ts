import { TrackDef, layout, mega } from './common';

// Volcano: lava gaps everywhere. Each track takes another world's skill and puts lava under
// it, so the last world is a tour of the whole game.

export const VOLCANO: TrackDef[] = [
  {
    id: 'volcano-1', biome: 'volcano', name: 'Ember Trail', difficulty: 6, par: 6500,
    challenges: [
      { text: 'Clear every lava gap', kind: 'gaps' },
      { text: 'Kickflip over lava', kind: 'trick', match: 'Kickflip', overGap: true },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Three lava gaps with long run-ups.
    build: layout(8, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      for (const len of [3, 3.5, 4]) {
        b.rollers(3, 13, 1.12).flat(6);
        b.sign(len === 3 ? 'LAVA! JUMP IT' : 'LAVA!').ease(8, -1.5).flat(3).kicker(4.5, 1.4).pit(len, -1.0).land(30).flat(8);
      }
      b.rollers(2, 13, 1.12).flat(4);
      b.ease(10, -2).flat(10);
    }),
  },
  {
    id: 'volcano-2', biome: 'volcano', name: 'Lava Leap', difficulty: 7, par: 21000,
    challenges: [
      { text: 'Clear every lava gap', kind: 'gaps' },
      { text: 'Grab and spin in the same air over lava', kind: 'sameAir', match: ['grab', 'spin'], overGap: true },
      { text: 'Score 21,000', kind: 'score', points: 21000 },
    ],
    build: layout(10, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      b.rail(8, 0.6).flat(4);
      b.rollers(2, 13, 1.12).flat(3);
      b.sign('LAVA!').kicker(3.5, 1.0).pit(3, -0.5).land(27).flat(5);
      b.rollers(2, 12, 1.12).flat(3);
      b.kicker(4, 1.2).pit(4, -0.8).land(21).flat(4);
      b.flat(3).ease(10, -2.5).kicker(4, 1.5).pit(3.8, -1.2).land(30).flat(4);
      b.rollers(3, 12, 1.26).flat(3);
      b.kicker(4, 1.4).pit(3.8, -1.2).land(23).flat(10);
      b.sign('LOOP!').ease(14, -4).flat(4).loop(2.4).flat(6);
      b.ease(6, -1.5).kicker(4, 1.6).pit(4.5, -1.3).land(27).flat(4);
      // Lengthened: one more big lava leap before the last one.
      b.rollers(3, 13, 1.26).flat(4);
      b.sign('BIG LEAP').ease(12, -3).flat(3).kicker(5, 2.0).pit(5, -2).land(26).flat(8);
      b.rollers(2, 13, 1.12).flat(4);
      b.sign('FINAL LEAP').ease(10, -3).kicker(5, 2.0).pit(7, -2).land(25).flat(8);
    }),
  },
  {
    id: 'volcano-3', biome: 'volcano', name: 'Magma Rollers', difficulty: 7, par: 17500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Do 12 good pumps', kind: 'pumps', count: 12 },
      { text: '3-trick combo over a lava gap', kind: 'combo', tricks: 3, gaps: 1 },
    ],
    // Level roller sets, each ending in a lava gap that needs the speed you pumped.
    build: layout(4, 5, (b) => {
      b.flat(8).sign('PUMP FOR SPEED').ease(10, -3).flat(6);
      for (const len of [3, 3.5, 3.5, 4]) {
        b.ease(6, -0.8).rollers(4, 13, 1.26).flat(3);
        b.sign('LAVA!').flat(4).kicker(4, 1.3).pit(len, -1.0).land(26).flat(8);
        b.kicker(4, 1.1).land(26).flat(6);
      }
      b.rollers(2, 13, 1.12).flat(10);
    }),
  },
  {
    id: 'volcano-4', biome: 'volcano', name: 'Basalt Steps', difficulty: 8, par: 69000,
    challenges: [
      { text: 'Grind a rail over lava', kind: 'grind', rails: [1] },
      { text: 'Stair rail + flip combo', kind: 'combo', include: ['grind', 'flip'] },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Basalt stair sets and rails, with lava between.
    build: layout(16, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      b.rollers(2, 13, 1.12).flat(4);
      b.sign('BASALT STEPS').flat(10).stairs(7).flat(8);
      b.kicker(4, 1.3).land(18).flat(6);
      b.sign('RAIL OVER LAVA: OLLIE ON').flat(6).gapRail(3).flat(8);
      b.rollers(2, 13, 1.12).flat(4);
      b.sign('LAVA!').ease(8, -1.5).flat(3).kicker(4.5, 1.4).pit(3.5, -1.0).land(23).flat(8);
      b.flat(10).stairs(8).flat(8);
      b.kicker(4, 1.3).land(18).flat(6);
      b.rollers(2, 13, 1.12).flat(4);
      b.flat(6).gapRail(3.5).flat(8);
      b.flat(10).stairs(9).flat(8);
      b.kicker(4, 1.4).land(18).flat(6);
      b.sign('LAVA!').ease(8, -1.5).flat(3).kicker(4.5, 1.5).pit(4, -1.0).land(18).flat(8);
      b.ease(10, -2).flat(10);
    }),
  },
  {
    id: 'volcano-5', biome: 'volcano', name: 'Lava Tube', difficulty: 8, par: 36000,
    challenges: [
      { text: 'Ride the lava tube loop', kind: 'loop' },
      { text: 'Loop + spin combo', kind: 'combo', include: ['loop', 'spin'] },
      { text: 'Score 36,000', kind: 'score', points: 36000 },
    ],
    // A loop inside a lava tube, then gaps.
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      b.rollers(3, 13, 1.12).flat(4);
      b.valley(27, 4).flat(4);
      b.sign('LAVA TUBE LOOP!').ease(14, -4).flat(4).loop(2.4).flat(4);
      b.sign('SPIN IT').flat(2).kicker(4, 1.3).land(26).flat(6);
      b.sign('LAVA!').kicker(4.5, 1.4).pit(3.5, -1.0).land(18).flat(8);
      b.rollers(3, 13, 1.12).flat(4);
      b.sign('LAVA!').ease(8, -1.5).flat(3).kicker(4.5, 1.5).pit(4, -1.0).land(28).flat(8);
      b.rollers(2, 13, 1.12).flat(4);
      b.sign('LOOP!').ease(14, -4).flat(4).loop(2.4).flat(4);
      b.flat(2).kicker(4, 1.3).land(26).flat(6);
      b.sign('LAVA!').kicker(4.5, 1.5).pit(4.5, -1.2).land(18).flat(10);
    }),
  },
  {
    id: 'volcano-6', biome: 'volcano', name: 'Caldera Rim', difficulty: 8, par: 9500,
    challenges: [
      { text: 'Climb out of every crater first time', kind: 'climb' },
      { text: 'Flip over lava from a crater lip', kind: 'trick', match: 'flip', from: 'lip', overGap: true },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Deep craters to pump out of, each with a lava gap at the top of the far side.
    build: layout(10, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      for (const [len, depth, gap] of [[27, 4, 2.5], [30, 5, 2.5], [27, 4, 3], [30, 5, 3]]) {
        b.rollers(2, 13, 1.12).flat(4);
        if (gap === 2.5 && depth === 4) b.sign('PUMP OUT, OLLIE THE LAVA');
        b.valley(len, depth).pit(gap, -0.6).land(18).flat(8);
      }
      b.rollers(2, 13, 1.12).flat(4);
      b.ease(10, -2).flat(10);
    }),
  },
  {
    id: 'volcano-7', biome: 'volcano', name: 'Fire Rhythm', difficulty: 9, par: 6000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A trick over every lava gap', kind: 'trick', match: 'any', overGap: 'every' },
      { text: 'Score 6,000', kind: 'score', points: 6000 },
    ],
    // Rhythm sets with a lava gap after every third roller.
    build: layout(10, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      for (let i = 0; i < 4; i++) {
        if (i === 0) b.sign('PUMP, PUMP, PUMP, JUMP');
        b.rollers(3, 12, 1.0).flat(3);
        b.kicker(4, 1.5).pit(3 + (i % 3) * 0.5, -1.2).land(29).flat(5);
      }
      b.rollers(2, 12, 1.0).flat(10);
    }),
  },
  {
    id: 'volcano-8', biome: 'volcano', name: 'Eruption Run', difficulty: 9, par: 9000,
    challenges: [
      { text: 'Clear every uphill gap', kind: 'gaps', which: [2, 4] },
      { text: '360 over the 6 m gap', kind: 'trick', match: '360', overGap: [3] },
      { text: 'Combo worth 3,000', kind: 'combo', points: 3000 },
    ],
    // Level and uphill landings across wide lava.
    build: layout(24, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -5).flat(6);
      b.rollers(2, 13, 1.12).flat(4);
      b.sign('LEVEL LANDING').ease(12, -3).flat(3).kicker(5, 1.8).pit(5, 0).land(25).flat(8);
      b.rollers(2, 13, 1.12).flat(4);
      b.sign('LEVEL LANDING').ease(12, -3).flat(3).kicker(5, 1.8).pit(5.5, 0).land(24).flat(8);
      b.rollers(2, 13, 1.12).flat(4);
      b.sign('UPHILL! GO FAST').ease(14, -4).flat(3).kicker(5, 1.9).pit(5, 0.5).land(25).flat(8);
      b.rollers(2, 13, 1.12).flat(4);
      b.sign('6 METRES: SPIN IT!').ease(16, -5).flat(3).kicker(6, 2.2).pit(6, -1.5).land(24).flat(8);
      b.rollers(2, 13, 1.12).flat(4);
      b.sign('UPHILL! GO FAST').ease(14, -4).flat(3).kicker(5, 2.0).pit(5.5, 0.5).land(24).flat(8);
      b.rollers(2, 13, 1.12).flat(4);
      b.sign('7 METRES').ease(16, -5).flat(3).kicker(6, 2.3).pit(7, -2).land(30).flat(10);
    }),
  },
  {
    id: 'volcano-9', biome: 'volcano', name: 'Pyroclastic Dash', difficulty: 10, par: 63000,
    challenges: [
      { text: 'Ride both loops', kind: 'loop', count: 2 },
      { text: 'Land an 8-trick combo', kind: 'combo', tricks: 8 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Few rests: two loops, rails over lava and eight gaps.
    build: layout(24, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      b.rollers(2, 13, 1.12).flat(3);
      b.kicker(4, 1.3).pit(3, -0.8).land(29).flat(8).ease(8, -1).flat(2).kicker(4, 1.3).pit(3.5, -0.8).land(23).flat(5);
      b.flat(4).gapRail(3).flat(6);
      b.sign('LOOP!').ease(14, -4).flat(4).loop(2.4).flat(4);
      b.flat(2).kicker(4, 1.3).pit(3, -1.0).land(23).flat(6);
      b.rollers(3, 13, 1.12).flat(3);
      b.kicker(4, 1.4).pit(3.5, -0.8).land(22).flat(8).ease(8, -1).flat(2).kicker(4, 1.4).pit(4, -0.8).land(23).flat(5);
      b.flat(10).stairs(7).flat(6);
      b.flat(4).gapRail(3.5).flat(6);
      b.sign('LOOP!').ease(14, -4).flat(4).loop(2.4).flat(4);
      b.flat(2).kicker(4, 1.3).pit(3.5, -1.0).land(22).flat(6);
      b.rollers(2, 13, 1.12).flat(3);
      b.sign('LAST LEAP').ease(12, -3).flat(3).kicker(5, 2.0).pit(6, -2).land(25).flat(10);
    }),
  },
  {
    id: 'volcano-10', biome: 'volcano', name: 'Into the Crater', difficulty: 10, par: 32000,
    challenges: [
      { text: 'Clear the crater gap', kind: 'gaps', which: [-1] },
      { text: 'Backflip and grab in the same air over the crater gap', kind: 'sameAir', match: ['Backflip', 'grab'], overGap: [-1] },
      { text: 'Score 32,000 with no lives lost', kind: 'score', points: 32000, noLives: true },
    ],
    // The finale: a bit of every world, then the longest gap of all, into the crater.
    build: layout(36, 5, (b) => {
      b.flat(8).sign('THE LAST RIDE').ease(10, -4).flat(6);
      // Park: kickers.
      b.kicker(4, 1.3).land(31).flat(4).kicker(4, 1.4).land(24).flat(6);
      // Beach: flow and a gap.
      b.rollers(3, 15, 1.4).flat(4).kicker(4.5, 1.4).pit(3.5, -1.0).land(23).flat(6);
      // Rooftops: stairs and a rail.
      b.flat(8).stairs(7).flat(8).rail(10, 0.6).flat(6);
      // Snow: a big kicker onto a long landing.
      b.ease(12, -3).flat(4).kicker(6, 2.2).land(29).flat(8);
      // Desert: a gully and a loop.
      b.valley(27, 4).flat(4).sign('LOOP!').ease(14, -4).flat(4).loop(2.4).flat(4);
      b.flat(2).kicker(4, 1.3).land(26).flat(6);
      // Jungle: a rhythm set over lava.
      b.rollers(3, 12, 1.0).flat(3).kicker(4, 1.3).pit(3, -0.8).land(22).flat(5);
      b.rollers(3, 12, 1.0).flat(3).kicker(4, 1.3).pit(3.5, -0.8).land(22).flat(5);
      // The crater.
      b.rollers(2, 13, 1.12).flat(4);
      b.sign('INTO THE CRATER!').ease(18, -6).flat(4).kicker(6, 2.6).pit(9, -3).land(18).flat(12);
    }),
  },
  {
    id: 'volcano-mega', biome: 'volcano', name: 'Volcano Mega Ramp', kind: 'mega', par: 15500,
    challenges: [
      { text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 },
      { text: 'A trick on both airs of one drop', kind: 'bothAirs' },
      { text: 'Score 15,500', kind: 'score', points: 15500 },
    ],
    build: mega(20, 14, 7),
  },
];
