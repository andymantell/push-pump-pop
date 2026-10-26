import { TrackDef, layout, pipe } from './common';

// Jungle Ruins: rhythm. Regular patterns you can feel as a beat: pump, pump, ollie. Then
// beats get skipped, the tempo changes, and river gaps, logs and loops land on the beat.
// Rollers are never shorter than 12 m.

export const JUNGLE: TrackDef[] = [
  {
    id: 'jungle-1', biome: 'jungle', name: 'Temple Rhythm', difficulty: 5, par: 46000,
    challenges: [
      { text: 'Clear both river gaps', kind: 'gaps' },
      { text: 'Trick off the 3 jumps in one combo', kind: 'combo', across: ['rhythm', 'rhythmend'] },
      { text: 'Score 46,000', kind: 'score', points: 46000 },
    ],
    build: layout(3, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(8, -3).flat(5);
      b.sign('RHYTHM').rollers(4, 12, 0.84).flat(3);
      b.kicker(3.5, 1.1).flat(4).land(28).flat(3);
      b.rollers(3, 12, 0.98).flat(3);
      b.sign('RIVER').kicker(4, 1.3).pit(3.8, -0.6).land(22).flat(4);
      b.drop(-0.6).flat(2).drop(-0.6).flat(2).drop(-0.6).flat(4);
      b.rollers(4, 12, 0.91).flat(3);
      // A rhythm set: hop, hop, hop, close enough together to be one combo.
      b.sign('3 JUMPS: ONE COMBO').ease(8, -1.5).flat(3);
      b.kicker(4, 1.3).spot('rhythm').flat(3).land(31).flat(1);
      b.kicker(4, 1.3).flat(3).land(27).flat(1);
      b.kicker(4, 1.3).spot('rhythmend').flat(2).land(21).flat(4);
      b.sign('TEMPLE STEPS').flat(5).stairs(8).flat(8);
      b.ease(5, -1).kicker(4, 1.5).pit(7.9, -1.2).land(18).flat(4);
      b.rollers(3, 12, 1.12).flat(3);
      b.flat(5).ledge(7).flat(4);
      b.sign('LOOP!').ease(14, -4).flat(4).loop(2.4).flat(6);
      b.ease(8, -2).kicker(4.5, 1.8).flat(4).land(34).flat(6);
    }),
  },
  {
    id: 'jungle-2', biome: 'jungle', name: 'Drum Beat', difficulty: 6, par: 19000,
    challenges: [
      { text: 'Do 12 good pumps', kind: 'pumps', count: 12 },
      { text: 'A trick on every kicker', kind: 'everyKicker', match: 'any' },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Steady rollers with a flat "missing beat", then kickers that land on the beat.
    build: layout(6, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(8, -3).flat(5);
      for (let i = 0; i < 4; i++) {
        if (i === 0) b.sign('PUMP, PUMP, SKIP A BEAT');
        b.rollers(2, 12, 0.98).flat(12).rollers(2, 12, 0.98).flat(4);
        if (i === 0) b.sign('A TRICK ON EVERY KICKER');
        b.kicker(4, 1.3).flat(4).land(28).flat(8);
        b.kicker(4, 1.3).flat(4).land(23).flat(8);
        b.ease(8, -1).flat(2);
      }
      b.flat(10);
    }),
  },
  {
    id: 'jungle-3', biome: 'jungle', name: 'Temple Steps', difficulty: 6, par: 43500,
    challenges: [
      { text: 'Flip off a step', kind: 'trick', match: 'flip', from: 'stairs' },
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
      { text: 'Score 43,500', kind: 'score', points: 43500 },
    ],
    // Temple step-downs between roller sets.
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(8, -3).flat(5);
      for (let i = 0; i < 5; i++) {
        b.rollers(3, 12, 0.98).flat(4);
        if (i === 0) b.sign('FLIP OFF THE TOP STEP');
        b.flat(6).stairs(5 + (i % 3), 0.17, 0.32, i % 2 === 1).flat(8);
        b.ease(10, -2).flat(2).kicker(4, 1.3).flat(4).land(33).flat(6).kicker(4, 1.3).flat(4).land(28).flat(6);
      }
      b.flat(10);
    }),
  },
  {
    id: 'jungle-4', biome: 'jungle', name: 'Croc Creek', difficulty: 7, par: 7500,
    challenges: [
      { text: 'Clear every river gap', kind: 'gaps' },
      { text: 'Grab over 3 gaps', kind: 'trick', match: 'grab', overGap: true, count: 3 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // A river gap after every fourth roller.
    build: layout(8, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(8, -3).flat(5);
      for (const [i, len] of [3.6, 3.8, 3.5, 4, 4].entries()) {
        b.rollers(4, 12, 0.98).flat(3);
        b.sign(i === 0 ? 'CROC CREEK! JUMP IT' : 'RIVER!').kicker(4, 1.3).pit(len, -0.8).land(27).flat(5);
      }
      b.rollers(2, 12, 0.98).flat(10);
    }),
  },
  {
    id: 'jungle-5', biome: 'jungle', name: 'Log Grind', difficulty: 7, par: 65000,
    challenges: [
      { text: 'Grind a log', kind: 'grind' },
      { text: 'Grind every log', kind: 'grind', count: 6 },
      { text: 'Log + flip + log combo', kind: 'combo', include: ['grind', 'flip', 'grind'] },
    ],
    // Roller, fallen log, roller, log.
    build: layout(6, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(8, -3).flat(5);
      for (let i = 0; i < 3; i++) {
        if (i === 0) b.sign('LOG: OLLIE ON');
        b.rollers(2, 12, 0.98).flat(8).rail(8, 0.5).flat(2);
        b.kicker(4, 1.2).flat(2).land(24).flat(6).rail(8, 0.5).flat(6);
        b.ease(8, -1).flat(2);
      }
      b.rollers(2, 12, 0.98).flat(10);
    }),
  },
  {
    id: 'jungle-6', biome: 'jungle', name: 'Tempo Shift', difficulty: 7, par: 9500,
    challenges: [
      { text: 'Do 15 good pumps', kind: 'pumps', count: 15 },
      { text: 'Finish with no bails', kind: 'noLives' },
      { text: 'Score 9,500', kind: 'score', points: 9500 },
    ],
    // Roller length steps 12, 16, 12, 20 m, so the timing keeps changing.
    build: layout(8, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(8, -3).flat(5);
      for (const len of [12, 16, 12, 20, 12, 16]) {
        b.sign(len === 12 ? 'QUICK' : len === 16 ? 'SLOWER' : 'SLOW').rollers(3, len, len / 12 * 0.98).flat(3);
        b.kicker(4, 1.3).flat(3).land(30).flat(4);
      }
      b.flat(10);
    }),
  },
  {
    id: 'jungle-7', biome: 'jungle', name: 'Serpent Loop', difficulty: 8, par: 28500,
    challenges: [
      { text: 'Ride the loop', kind: 'loop' },
      { text: 'Loop + flip combo', kind: 'combo', include: ['loop', 'flip'] },
      { text: 'Land a 6-trick combo', kind: 'combo', tricks: 6 },
    ],
    // Rhythm sets that end in a loop.
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(8, -3).flat(5);
      for (let i = 0; i < 3; i++) {
        b.rollers(3, 12, 0.98).flat(3);
        b.kicker(3.5, 1.1).flat(4).land(30).flat(2).kicker(3.5, 1.1).flat(4).land(30).flat(3);
        if (i === 0) b.sign('LOOP!');
        b.ease(14, -4).flat(4).loop(2.4).flat(4);
        if (i === 0) b.sign('FLIP AFTER THE LOOP');
        b.flat(2).kicker(4, 1.3).flat(4).land(26).flat(6);
      }
      b.flat(10);
    }),
  },
  {
    id: 'jungle-8', biome: 'jungle', name: 'Lost Idol', difficulty: 8, par: 83500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Rail + gap + rail in one combo', kind: 'combo', include: ['grind', 'grind'], gaps: 1 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Gap, roller, rail, gap, roller, over and over.
    build: layout(10, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(8, -3).flat(5);
      b.rollers(3, 12, 0.98).flat(3);
      for (let i = 0; i < 4; i++) {
        if (i === 0) b.sign('RAIL, GAP, RAIL');
        b.flat(8).rail(8, 0.5).flat(3).kicker(4, 1.3).pit(3.5, -0.8).land(22).flat(6).rail(8, 0.5).flat(4);
        b.rollers(2, 12, 0.98).flat(3);
      }
      b.flat(10);
    }),
  },
  {
    id: 'jungle-9', biome: 'jungle', name: 'Waterfall Drop', difficulty: 8, par: 10500,
    challenges: [
      { text: 'Clear the waterfall gap', kind: 'gaps', which: [1] },
      { text: 'Backflip over the waterfall gap', kind: 'trick', match: 'Backflip', overGap: [1] },
      { text: 'Score 10,500', kind: 'score', points: 10500 },
    ],
    // A big drop beside the waterfall, a 6 m river gap, and a loop.
    build: layout(20, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(8, -3).flat(5);
      b.rollers(3, 12, 0.98).flat(3);
      b.sign('RIVER').kicker(4, 1.3).pit(4.1, -0.8).land(26).flat(6);
      b.rollers(2, 12, 0.98).flat(3);
      b.sign('WATERFALL! BACKFLIP IT').ease(16, -2).flat(4).kicker(6, 2.2).pit(7, -2.5).land(25).flat(10);
      b.rollers(3, 12, 0.98).flat(3);
      b.sign('LOOP!').ease(14, -4).flat(4).loop(2.4).flat(4);
      b.flat(2).kicker(4, 1.3).flat(4).land(26).flat(6);
      b.rollers(2, 12, 0.98).flat(10);
    }),
  },
  {
    id: 'jungle-10', biome: 'jungle', name: 'Heart of the Temple', difficulty: 9, par: 91500,
    challenges: [
      { text: 'Ride both loops', kind: 'loop', count: 2 },
      { text: 'Land a 7-trick combo', kind: 'combo', tricks: 7 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Every jungle pattern in one run, with two loops.
    build: layout(22, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(8, -3).flat(5);
      b.rollers(2, 12, 0.98).flat(12).rollers(2, 12, 0.98).flat(4);
      b.kicker(4, 1.3).flat(4).land(28).flat(2).kicker(4, 1.3).flat(4).land(23).flat(2).kicker(4, 1.3).flat(4).land(18).flat(4);
      b.flat(6).stairs(6).flat(8);
      b.rollers(4, 12, 0.98).flat(3).kicker(4, 1.3).pit(3.8, -0.8).land(22).flat(5);
      b.sign('LOOP!').ease(14, -4).flat(4).loop(2.4).flat(4);
      b.flat(2).kicker(4, 1.3).flat(4).land(26).flat(6);
      b.flat(8).rail(8, 0.5).flat(3).kicker(4, 1.3).pit(4.8, -0.8).land(18).flat(6).rail(8, 0.5).flat(4);
      b.rollers(3, 16, 1.3).flat(3).rollers(3, 12, 0.98).flat(3);
      b.sign('LOOP!').ease(14, -4).flat(4).loop(2.4).flat(4);
      b.flat(2).kicker(4, 1.3).flat(4).land(26).flat(6);
      b.sign('HEART OF THE TEMPLE').ease(14, -1).flat(3).kicker(5, 1.9).pit(7, -2).land(27).flat(10);
    }),
  },
  {
    id: 'jungle-pipe', biome: 'jungle', name: 'Temple Pipe', kind: 'pipe', par: 23500,
    challenges: [
      { text: 'Air of 1.5 metres', kind: 'air', metres: 1.5 },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
      { text: 'Score 23,500', kind: 'score', points: 23500 },
    ],
    build: pipe(4.2, 4.5),
  },
];
