import { TrackDef, layout, mega } from './common';

// Downtown Rooftops: gaps. Gaps between buildings get longer, then land level, then uphill,
// then come close together, then you go into them off stairs and rails.

export const ROOFTOPS: TrackDef[] = [
  {
    id: 'rooftops-1', biome: 'rooftops', name: 'Rooftop Hop', difficulty: 3, par: 5000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Kickflip over a gap', kind: 'trick', match: 'Kickflip', overGap: true },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Three alley gaps, each landing a storey lower, with long run-ups to get your speed.
    build: layout(10, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6);
      b.rollers(3, 14, 1.0).flat(6);
      b.sign('GAP! OLLIE OFF THE KICKER').flat(4).kicker(4, 1.2).pit(2.5, -1.6).ease(6, -0.4).flat(8);
      b.rollers(3, 14, 1.1).flat(6);
      b.sign('GAP!').flat(4).kicker(4, 1.3).pit(2.8, -1.7).ease(6, -0.4).flat(8);
      b.rollers(3, 14, 1.1).flat(6);
      b.sign('KICKFLIP IT!').flat(4).kicker(4.5, 1.4).pit(3, -1.8).ease(6, -0.4).flat(8);
      b.rollers(2, 14, 1.0).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'rooftops-2', biome: 'rooftops', name: 'Stair Street', difficulty: 3, par: 8000,
    challenges: [
      { text: 'Ollie a stair set', kind: 'trick', match: 'Ollie', from: 'stairs' },
      { text: 'Heelflip a stair set', kind: 'trick', match: 'Heelflip', from: 'stairs' },
      { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 },
    ],
    // Roofs joined by stair sets going down: ollie off the top step, or just roll down them.
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6);
      b.rollers(2, 14, 1.0).flat(4);
      b.sign('STAIRS! OLLIE OFF THE TOP').flat(8).stairs(5, 0.17, 0.32, false).flat(10);
      b.rollers(2, 14, 1.0).flat(4);
      b.flat(8).stairs(6, 0.17, 0.32, false).flat(10);
      b.sign('GAP!').flat(4).kicker(4, 1.2).pit(2.5, -1.2).ease(6, -0.3).flat(8);
      b.rollers(3, 14, 1.1).flat(4);
      b.sign('HEELFLIP THE STAIRS').flat(8).stairs(7, 0.17, 0.32, false).flat(10);
      b.rollers(2, 14, 1.0).flat(4);
      b.flat(8).stairs(6, 0.17, 0.32, false).flat(10);
      b.sign('GAP!').flat(4).kicker(4, 1.3).pit(2.5, -1.2).ease(6, -0.3).flat(8);
      b.rollers(2, 14, 1.0).flat(4);
      b.flat(8).stairs(8, 0.17, 0.32, false).flat(10);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'rooftops-3', biome: 'rooftops', name: 'Rush Hour Roofs', difficulty: 4, par: 42000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Grab over 2 gaps', kind: 'trick', match: 'grab', overGap: true, count: 2 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    build: layout(6, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(8, -2).flat(6);
      b.rollers(2, 12, 0.7).flat(4);
      b.sign('GAP!').kicker(3.5, 1.1).pit(2.5, -1.1).flat(6);
      b.rollers(2, 12, 0.84).flat(3);
      b.kicker(3.5, 1.2).pit(3.5, -1.7).flat(5);
      b.drop(-1.2).ease(4, -0.5).flat(5);
      b.kicker(4, 1.2).flat(4).ease(5, -1.2).flat(4);
      b.flat(5).rail(9, 0.6).flat(5);
      b.kicker(4, 1.3).pit(4, -1.8).flat(6);
      b.rollers(2, 12, 0.98).flat(3);
      b.kicker(4, 1.4).pit(4.5, -2.2).flat(5);
      b.drop(-1).ease(6, -1.5).flat(4);
      b.flat(5).stairs(7).flat(8);
      b.sign('BIG GAP').ease(6, -1.5).kicker(5, 1.8).pit(6, -3).ease(5, -1).flat(8);
    }),
  },
  {
    id: 'rooftops-4', biome: 'rooftops', name: 'Handrail Hustle', difficulty: 4, par: 24500,
    challenges: [
      { text: 'Grind a stair rail', kind: 'grind', railKind: 'handrail' },
      { text: 'Grind 2 stair rails', kind: 'grind', railKind: 'handrail', count: 2 },
      { text: 'Stair rail + flip combo', kind: 'combo', include: ['grind', 'flip'] },
    ],
    build: layout(16, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6);
      b.rollers(2, 14, 1.0).flat(4);
      b.sign('STAIR RAIL: OLLIE ON').flat(10).stairs(6).flat(10);
      b.rollers(2, 14, 1.0).flat(4);
      b.sign('GAP!').flat(4).kicker(4, 1.3).pit(3, -1.4).ease(6, -0.3).flat(8);
      b.rollers(2, 14, 1.0).flat(4);
      b.flat(10).stairs(7).flat(10);
      b.rollers(2, 14, 1.0).flat(4);
      b.flat(10).stairs(6).flat(10);
      b.sign('GAP!').flat(4).kicker(4, 1.3).pit(3, -1.4).ease(6, -0.3).flat(8);
      b.rollers(2, 14, 1.0).flat(4);
      b.sign('BIG STAIRS').flat(10).stairs(9).flat(10);
      b.rollers(2, 14, 1.0).flat(4);
      b.flat(10).stairs(7).flat(10);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'rooftops-5', biome: 'rooftops', name: 'Level Best', difficulty: 5, par: 20000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: '180 over a gap', kind: 'trick', match: '180', overGap: true },
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
    ],
    // Four gaps that land at the same height: pump the rollers before each one for speed.
    build: layout(12, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      for (const len of [3, 3.3, 3.6, 4]) {
        b.rollers(3, 14, 1.2).flat(4);
        b.sign(len === 3 ? 'LEVEL GAP: PUMP FOR SPEED' : 'GAP!').flat(4).kicker(4.5, 1.4).pit(len, 0).ease(6, -1.4).flat(8);
      }
      // Kickers and a manual pad close together: one long combo.
      b.sign('KEEP IT GOING!').rollers(2, 14, 1.1).flat(4);
      b.kicker(4, 1.4).flat(2).ease(8, -1.4).flat(2).pad(7).flat(2);
      b.kicker(4, 1.5).flat(2).ease(8, -1.5).flat(2).pad(7).flat(2);
      b.kicker(4, 1.6).flat(2).ease(8, -1.6).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'rooftops-6', biome: 'rooftops', name: 'Neon Nights', difficulty: 5, par: 22000,
    challenges: [
      { text: 'Grind a ledge and clear its gap', kind: 'air', fromRail: true, overGap: true },
      { text: 'Ledge grind + flip over the gap', kind: 'trick', match: 'flip', fromRail: true, overGap: true },
      { text: 'Score 22,000', kind: 'score', points: 22000 },
    ],
    // Roof-edge ledges that run right to the alley: grind, pop off the end, land.
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(3, 14, 1.1).flat(4);
      for (const len of [2.5, 3, 3]) {
        b.sign('GRIND THE LEDGE OFF THE ROOF').ease(8, -1.5).flat(12).ledge(10).pit(len, -1.4).ease(8, -0.5).flat(8);
        b.rollers(3, 14, 1.1).flat(4);
      }
      b.sign('GAP!').ease(8, -1.5).flat(3).kicker(5, 1.6).pit(4, -1.4).ease(8, -0.5).flat(8);
      b.rollers(2, 14, 1.1).flat(4);
      b.sign('GRIND THE LEDGE OFF THE ROOF').ease(8, -1.5).flat(12).ledge(12).pit(3.5, -1.6).ease(8, -0.5).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'rooftops-7', biome: 'rooftops', name: 'Scaffold Scramble', difficulty: 5, par: 10500,
    challenges: [
      { text: 'Clear every uphill gap', kind: 'gaps', which: [1, 3, 5] },
      { text: 'Melon over an uphill gap', kind: 'trick', match: 'Melon', overGap: [1, 3, 5] },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Drop down onto the scaffolding, then gap back up onto the next roof.
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      for (let i = 0; i < 3; i++) {
        b.rollers(2, 14, 1.1).flat(4);
        b.sign(i === 0 ? 'DOWN ONTO THE SCAFFOLD' : 'GAP!').flat(4).kicker(4, 1.2).pit(2.5, -1.6).ease(6, -0.5).flat(6);
        b.rollers(2, 14, 1.1).flat(4);
        b.sign(i === 0 ? 'UPHILL GAP: GO FAST!' : 'UP!').ease(8, -1.2).flat(3).kicker(5, 1.7).pit(3 + i * 0.3, 0.5).flat(8);
      }
      b.rollers(2, 14, 1.0).flat(4);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'rooftops-8', biome: 'rooftops', name: 'Billboard Blast', difficulty: 6, par: 8000,
    challenges: [
      { text: 'Air for 1.5 seconds', kind: 'air', seconds: 1.5 },
      { text: 'Grab and spin in the same air over a gap', kind: 'sameAir', match: ['grab', 'spin'], overGap: true },
      { text: 'Score 8,000', kind: 'score', points: 8000 },
    ],
    // Big kickers up on the billboards, over wide streets.
    build: layout(20, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(3, 15, 1.3).flat(4);
      for (const len of [5, 5.5, 6, 6]) {
        b.sign('BILLBOARD BLAST!').ease(14, -3.5).flat(3).kicker(6, 2.3).pit(len, -2.6).ease(10, -1.0).flat(10);
        b.rollers(3, 15, 1.3).flat(4);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'rooftops-9', biome: 'rooftops', name: 'Skyline Sprint', difficulty: 6, par: 35000,
    challenges: [
      { text: 'Clear a set of three gaps in one combo', kind: 'combo', gaps: 3 },
      { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Gap, roller, gap, roller, gap: four sets. Keep the combo going across each set.
    build: layout(18, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      for (let i = 0; i < 4; i++) {
        b.rollers(3, 14, 1.1).flat(4);
        b.sign(i === 0 ? 'THREE GAPS: ONE COMBO!' : 'GAP SET').ease(6, -1).flat(3);
        for (let k = 0; k < 3; k++) {
          b.kicker(4, 1.3).pit(2.5, -1.0).ease(5, -0.3).flat(2);
          if (k < 2) b.rollers(1, 12, 0.6).flat(2);
        }
        b.flat(8);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'rooftops-10', biome: 'rooftops', name: 'Penthouse Plunge', difficulty: 7, par: 78000,
    challenges: [
      { text: 'Clear the final gap', kind: 'gaps', which: [-1] },
      { text: 'Rail + flip + grab combo', kind: 'combo', include: ['grind', 'flip', 'grab'] },
      { text: 'Score 78,000', kind: 'score', points: 78000 },
    ],
    // From the top of the tower, down stairs and rails, to a 6 m gap onto a lower roof.
    build: layout(26, 5, (b) => {
      b.flat(8).sign('PENTHOUSE').ease(12, -4).flat(6);
      b.rollers(2, 14, 1.1).flat(4);
      b.flat(10).stairs(7).flat(10);
      b.flat(6).rail(10, 0.6).flat(4).kicker(4, 1.3).flat(2).ease(6, -1.3).flat(6);
      b.sign('GAP!').flat(4).kicker(4.5, 1.4).pit(3.5, -1.6).ease(6, -0.4).flat(8);
      b.rollers(2, 14, 1.1).flat(4);
      b.flat(10).stairs(8).flat(10);
      b.flat(6).ledge(10).pit(3, -1.4).ease(8, -0.5).flat(8);
      b.rollers(3, 14, 1.1).flat(4);
      b.flat(6).rail(12, 0.6).flat(4).kicker(4, 1.4).flat(2).ease(6, -1.4).flat(6);
      b.flat(10).stairs(9).flat(10);
      b.rollers(2, 14, 1.1).flat(4);
      b.sign('THE PLUNGE: 6 METRE GAP!').ease(14, -4).flat(3).kicker(6, 2.0).pit(6, -3).ease(10, -1.0).flat(10);
    }),
  },
  {
    id: 'rooftops-mega', biome: 'rooftops', name: 'Skyscraper Mega Ramp', kind: 'mega', par: 20500,
    challenges: [
      { text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 },
      { text: 'A trick on both airs of one drop', kind: 'bothAirs' },
      { text: 'Score 20,500', kind: 'score', points: 20500 },
    ],
    build: mega(12, 8, 5),
  },
];
