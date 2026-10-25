import { TrackDef, layout, pipe } from './common';

// Beach Boardwalk: flow. Long wooden rollers give you speed, then they're the only speed
// you get, and you need it for the water gaps.

export const BEACH: TrackDef[] = [
  {
    id: 'beach-1', biome: 'beach', name: 'Boardwalk Breeze', difficulty: 2, par: 18000,
    challenges: [
      { text: 'Clear every water gap', kind: 'gaps' },
      { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 },
      { text: 'Score 18,000', kind: 'score', points: 18000 },
    ],
    build: layout(3, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6);
      b.sign('FLOW').rollers(4, 16, 1.4).flat(4);
      b.kicker(4, 1.2).land(33).flat(4);
      b.rollers(3, 15, 1.5).flat(3);
      b.sign('WATER GAP').kicker(4, 1.4).pit(4.5, -0.4).land(27).flat(5);
      b.rollers(5, 14, 1.4).flat(4);
      b.flat(6).ledge(8).flat(5);
      b.ease(8, -2).kicker(4.5, 1.7).land(33).flat(4);
      b.rollers(2, 16, 1.5).flat(3);
      b.flat(5).stairs(6).flat(8);
      b.sign('BIG AIR').ease(10, -3).kicker(5, 2.0).pit(4, -1.2).land(28).flat(8);
    }),
  },
  {
    id: 'beach-2', biome: 'beach', name: 'Sandy Swells', difficulty: 3, par: 1000,
    challenges: [
      { text: 'Get air off a roller top', kind: 'air', from: 'crest', seconds: 0.4 },
      { text: 'Grab off a roller top', kind: 'trick', match: 'grab', from: 'crest' },
      { text: 'Air for 1 second', kind: 'air', seconds: 1 },
    ],
    build: layout(8, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.sign('OLLIE ON TOP OF A ROLLER').rollers(3, 16, 1.6).flat(6);
      b.ease(10, -1.5).rollers(3, 16, 1.7).flat(6);
      b.sign('POP AT THE TOP!').rollers(3, 16, 1.8).flat(6);
      b.ease(10, -1.5).rollers(3, 16, 1.7).flat(6);
      b.rollers(2, 16, 1.6).flat(6);
      // One big swell to finish: pop at its top for your longest air.
      b.sign('BIG SWELL').ease(12, -2.5).rollers(1, 22, 2.4).flat(6);
      b.ease(12, -2).flat(10);
    }),
  },
  {
    id: 'beach-3', biome: 'beach', name: 'Pier Pressure', difficulty: 3, par: 21000,
    challenges: [
      { text: 'Grind a pier rail', kind: 'grind' },
      { text: 'Grind for 2 seconds', kind: 'grind', seconds: 2 },
      { text: 'Kickflip off the end of a rail', kind: 'trick', match: 'Kickflip', fromRail: true },
    ],
    build: layout(8, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(3, 15, 1.4).flat(6);
      b.sign('PIER RAIL: OLLIE ON').flat(12).rail(10, 0.5).flat(10);
      b.rollers(3, 15, 1.5).flat(6);
      b.sign('LONG RAIL').flat(12).rail(32, 0.5).flat(10);
      b.rollers(2, 15, 1.4).flat(4);
      b.sign('WATER GAP').flat(6).kicker(4, 1.3).pit(3, -1.0).land(18).flat(8);
      b.rollers(3, 15, 1.5).flat(6);
      b.flat(10).rail(12, 0.6).flat(10);
      b.ease(12, -2).flat(10);
    }),
  },
  {
    id: 'beach-4', biome: 'beach', name: 'Low Tide', difficulty: 3, par: 2000,
    challenges: [
      { text: 'Clear the end gap', kind: 'gaps', which: [-1] },
      { text: 'Do 10 good pumps', kind: 'pumps', count: 10 },
      { text: 'Score 2,000', kind: 'score', points: 2000 },
    ],
    // No downhill: the only speed is what you pump out of the rollers.
    build: layout(3, 5, (b) => {
      b.flat(8).sign('PUMP OR STOP!').flat(6);
      b.rollers(4, 14, 1.2).flat(4);
      b.sign('NO HILLS HERE').rollers(3, 14, 1.3).flat(4);
      b.rollers(3, 14, 1.3).flat(6);
      b.sign('GAP! YOU NEED SPEED').flat(8).kicker(4, 1.2).pit(2.5, -1.2).land(28).flat(10);
    }),
  },
  {
    id: 'beach-5', biome: 'beach', name: "Surf's Up", difficulty: 4, par: 13500,
    challenges: [
      { text: 'Clear every water gap', kind: 'gaps' },
      { text: 'Grab over every gap', kind: 'trick', match: 'grab', overGap: 'every' },
      { text: 'Kickflip + Indy combo', kind: 'combo', include: ['Kickflip', 'Indy'] },
    ],
    build: layout(6, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      for (const [len, amp] of [[3.5, 1.4], [4, 1.5], [4.5, 1.5]]) {
        b.rollers(4, 15, amp).flat(6);
        b.sign('WATER GAP').flat(4).kicker(4, 1.4).pit(len, -1.0).land(27).flat(8);
      }
      // Two kickers close together: one combo over both.
      b.sign('DOUBLE UP').rollers(2, 15, 1.4).flat(6);
      b.kicker(4, 1.5).land(26).flat(4).kicker(4, 1.6).land(24).flat(8);
      b.ease(12, -2).flat(10);
    }),
  },
  {
    id: 'beach-6', biome: 'beach', name: 'Sunset Strip', difficulty: 4, par: 46500,
    challenges: [
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
      { text: 'Manual + flip + manual combo', kind: 'combo', include: ['manual', 'flip', 'manual'] },
      { text: 'Combo worth 8,000', kind: 'combo', points: 8000 },
    ],
    build: layout(8, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(2, 15, 1.4).flat(4);
      b.sign('KEEP IT GOING! TRICK, MANUAL, TRICK').flat(6);
      // Each section: kicker, pad, kicker, pad, kicker, close enough to be one combo.
      for (let i = 0; i < 3; i++) {
        b.kicker(4, 1.4).land(31).flat(2).pad(7).flat(2);
        b.kicker(4, 1.5).land(24).flat(2).pad(7).flat(2);
        b.kicker(4, 1.6).land(18).flat(8);
        b.ease(10, -1.5).rollers(2, 15, 1.4).flat(6);
      }
      b.ease(12, -2).flat(10);
    }),
  },
  {
    id: 'beach-7', biome: 'beach', name: 'Lifeguard Lookout', difficulty: 4, par: 32000,
    challenges: [
      { text: 'Land a 360', kind: 'trick', match: '360' },
      { text: 'Melon over a water gap', kind: 'trick', match: 'Melon', overGap: true },
      { text: 'Score 32,000', kind: 'score', points: 32000 },
    ],
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(2, 15, 1.4).flat(4);
      // Launch ramps over the lifeguard towers, onto long landings.
      b.sign('LAUNCH!').ease(10, -2).flat(3).kicker(5, 2.0).prop('lifeguard', 3, -3.5, 1.2).land(32).flat(8);
      b.rollers(2, 15, 1.5).flat(4).kicker(4, 1.5).land(26).flat(6).kicker(4, 1.6).land(22).flat(6);
      b.sign('WATER GAP').ease(10, -2).flat(3).kicker(5, 1.8).pit(5, -1.6).land(21).flat(8);
      b.rollers(2, 15, 1.5).flat(4).kicker(4, 1.5).land(28).flat(6).kicker(4, 1.6).land(22).flat(6);
      b.sign('LAUNCH!').ease(10, -2).flat(3).kicker(5, 2.1).prop('lifeguard', 3, -3.5, 1.2).land(27).flat(8);
      b.rollers(2, 15, 1.4).flat(4);
      b.sign('WATER GAP').ease(10, -2).flat(3).kicker(5, 1.9).pit(5, -1.6).land(26).flat(8);
      b.ease(12, -2).flat(10);
    }),
  },
  {
    id: 'beach-8', biome: 'beach', name: 'Jetty Jump', difficulty: 5, par: 15000,
    challenges: [
      { text: 'Grind into the jetty gap and clear it', kind: 'air', fromRail: true, overGap: true },
      { text: 'Rail + flip combo over the gap', kind: 'combo', include: ['grind', 'flip'], gaps: 1 },
      { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 },
    ],
    build: layout(10, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(3, 15, 1.5).flat(4);
      // The jetty rail runs right to the lip of the water: grind off the end and fly.
      for (const len of [3, 3.5]) {
        b.sign('GRIND OFF THE JETTY').ease(10, -2).flat(12).rail(10, 0.5).pit(len, -1.2).ease(8, -0.5).flat(8);
        b.rollers(3, 15, 1.5).flat(4);
      }
      b.sign('WATER GAP').ease(8, -1.5).flat(3).kicker(5, 1.7).pit(4.5, -1.4).land(28).flat(8);
      b.rollers(2, 15, 1.4).flat(4);
      b.sign('GRIND OFF THE JETTY').ease(10, -2).flat(12).rail(12, 0.5).pit(4, -1.4).ease(8, -0.5).flat(8);
      b.ease(12, -2).flat(10);
    }),
  },
  {
    id: 'beach-9', biome: 'beach', name: 'Riptide', difficulty: 5, par: 24500,
    challenges: [
      { text: 'Clear every water gap', kind: 'gaps' },
      { text: 'Do 15 good pumps', kind: 'pumps', count: 15 },
      { text: 'Score 24,500', kind: 'score', points: 24500 },
    ],
    build: layout(8, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      // Rollers that keep changing length, so the pump timing changes too.
      for (const len of [12, 16, 20]) {
        b.sign(len === 12 ? 'SHORT ROLLERS' : len === 16 ? 'LONGER' : 'LONGEST').rollers(3, len, len / 12 * 1.1).flat(4).kicker(4, 1.4).land(31).flat(6);
        b.sign('WATER GAP').flat(4).kicker(4.5, 1.5).pit(3.5 + (len - 12) / 8, -1.2).land(18).flat(8);
      }
      b.rollers(2, 16, 1.5).flat(4).rollers(2, 12, 1.1).flat(6);
      b.ease(12, -2).flat(10);
    }),
  },
  {
    id: 'beach-10', biome: 'beach', name: 'End of the Pier', difficulty: 5, par: 18500,
    challenges: [
      { text: 'Finish without losing a life', kind: 'noLives' },
      { text: '360 + grab off the pier end', kind: 'sameAir', match: ['360', 'grab'], from: 'pierend' },
      { text: 'Score 18,500', kind: 'score', points: 18500 },
    ],
    build: layout(16, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(3, 15, 1.5).flat(4);
      b.sign('WATER GAP').flat(3).kicker(4.5, 1.5).pit(3.5, -1.2).land(28).flat(6);
      b.rollers(3, 15, 1.5).flat(6).rail(12, 0.5).flat(8);
      b.rollers(3, 16, 1.6).flat(4);
      b.sign('WATER GAP').ease(8, -1.5).flat(3).kicker(5, 1.7).pit(4, -1.4).land(28).flat(6);
      b.rollers(3, 15, 1.5).flat(6).ledge(10).flat(8);
      b.sign('WATER GAP').ease(8, -1.5).flat(3).kicker(5, 1.8).pit(4.5, -1.4).land(26).flat(6);
      b.rollers(3, 16, 1.6).flat(6);
      // The pier end: one giant launch out over the sea.
      b.sign('PIER END: BIG AIR').ease(14, -5).flat(3).kicker(6, 2.4).spot('pierend').land(31).flat(10);
    }),
  },
  {
    id: 'beach-pipe', biome: 'beach', name: 'Boardwalk Bowl', kind: 'pipe', par: 20500,
    challenges: [
      { text: 'Air of 1.5 metres', kind: 'air', metres: 1.5 },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
      { text: 'Score 20,500', kind: 'score', points: 20500 },
    ],
    build: pipe(4.5, 6),
  },
];
