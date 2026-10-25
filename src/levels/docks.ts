import { TrackDef, layout, mega } from './common';

// Harbour Docks: combos. Manual pads, quay-edge ledges, mooring rails, fish market steps and
// rows of shipping containers to manual along the roofs of, close enough together that one
// combo can carry from one to the next. Gaps are the water between the piers.

export const DOCKS: TrackDef[] = [
  {
    id: 'docks-1', biome: 'docks', name: 'Quayside', difficulty: 4, par: 8000,
    challenges: [
      { text: 'Finish the track', kind: 'finish' },
      { text: 'Manual along the containers', kind: 'manual', seconds: 1.5, pad: true },
      { text: 'Manual and grind in one combo', kind: 'combo', include: ['manual', 'grind'] },
    ],
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(3, 14, 1.1).flat(4);
      b.sign('TILT: MANUAL').pad(8).flat(6);
      b.rollers(2, 14, 1.1).flat(4);
      b.sign('GRIND THE QUAY EDGE').flat(6).ledge(10).flat(8);
      b.rollers(2, 14, 1.1).flat(4);
      b.sign('MANUAL THE CONTAINERS').ease(8, -1.5).flat(1).containers(2).ease(8, -1.5).flat(6);
      b.rollers(2, 14, 1.1).flat(4);
      b.sign('MANUAL, THEN GRIND').pad(7).flat(3).ledge(10).flat(8);
      b.rollers(2, 14, 1.0).flat(4);
      b.ease(8, -1.5).flat(1).containers(3).ease(8, -1.5).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'docks-2', biome: 'docks', name: 'Container Yard', difficulty: 4, par: 11000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Manual for 2 seconds on the containers', kind: 'manual', seconds: 2, pad: true },
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
    ],
    // Down a ramp onto a stack, along the roof, off the end over the water to the next quay.
    build: layout(16, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(3, 14, 1.1).flat(4);
      for (let i = 0; i < 3; i++) {
        b.sign(i === 0 ? 'ALONG THE ROOF, OFF THE END!' : 'CONTAINERS').ease(8, -1.5).flat(1).containers(2);
        b.pit(7.4 + i * 0.4, -0.4).land(20).flat(6);
        b.rollers(2, 14, 1.1).flat(4);
      }
      b.sign('MANUAL, OLLIE, MANUAL').pad(7).flat(2).kicker(4, 1.3).flat(3).land(27).flat(2).pad(7).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'docks-3', biome: 'docks', name: 'Fish Market', difficulty: 5, par: 15000,
    challenges: [
      { text: 'Grind a handrail', kind: 'grind', railKind: 'handrail' },
      { text: 'Grind a handrail, then manual, in one combo', kind: 'combo', include: ['grind', 'manual'] },
      { text: 'Score 15,000', kind: 'score', points: 15000 },
    ],
    // Down the market steps, handrails to grind, a manual pad at the bottom of each set.
    build: layout(16, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(3, 14, 1.1).flat(4);
      for (const [i, steps] of [6, 7, 8].entries()) {
        b.sign(i === 0 ? 'MARKET STEPS: GRIND THE RAIL' : 'STEPS').flat(10).stairs(steps).flat(8);
        b.sign(i === 0 ? 'THEN MANUAL!' : 'MANUAL').pad(7).flat(4);
        b.rollers(2, 14, 1.1).flat(4);
      }
      b.sign('GAP!').ease(8, -1.5).flat(3).kicker(4.5, 1.4).pit(6.6, -1.2).land(26).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'docks-4', biome: 'docks', name: 'Crane Line', difficulty: 5, par: 63000,
    challenges: [
      { text: 'Grind 3 different rails', kind: 'grind', count: 3 },
      { text: 'A flip off a rail', kind: 'trick', match: 'flip', fromRail: true },
      { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 },
    ],
    // Mooring rails and quay ledges one after another along the crane tracks.
    build: layout(16, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(3, 14, 1.1).flat(4);
      b.sign('RAIL, THEN LEDGE').flat(6).rail(10, 0.6).flat(9).ledge(10).flat(8);
      b.rollers(2, 14, 1.1).flat(4);
      b.sign('RAIL OVER THE WATER').gapRail(4, 0.6).land(16).flat(6);
      b.rollers(2, 14, 1.1).flat(4);
      b.flat(6).ledge(8).flat(9).rail(10, 0.6).flat(9).ledge(8).flat(8);
      b.rollers(2, 14, 1.1).flat(4);
      b.sign('DOWN THE RAMP RAIL').flat(4).downrail(12, -2).flat(8);
      b.rollers(2, 14, 1.1).flat(4);
      b.flat(6).rail(14, 0.6).flat(4).kicker(4, 1.3).flat(3).land(22).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'docks-5', biome: 'docks', name: 'Pier Gaps', difficulty: 5, par: 13000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: '180 over a gap', kind: 'trick', match: '180', overGap: true },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Pier to pier over the water: pump the rollers before each gap for speed.
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      for (const [i, len] of [4.4, 4.8, 5.2, 5.6].entries()) {
        b.rollers(3, 14, 1.2).flat(4);
        b.sign(i === 0 ? 'PIER GAP: PUMP FOR SPEED' : 'GAP!').flat(4).kicker(4.5, 1.4).pit(len, -0.4).land(28).flat(8);
      }
      b.sign('MANUAL THE JETTY').rollers(2, 14, 1.1).flat(4).pad(8).flat(6);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'docks-6', biome: 'docks', name: 'Ferry Ramp', difficulty: 6, par: 12000,
    challenges: [
      { text: 'Air for 1.5 seconds', kind: 'air', seconds: 1.5 },
      { text: 'A grab over every gap', kind: 'trick', match: 'grab', overGap: 'every' },
      { text: 'Score 12,000', kind: 'score', points: 12000 },
    ],
    // Up the car ferry ramps and out over the water.
    build: layout(20, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(3, 15, 1.3).flat(4);
      for (const [i, len] of [6.6, 6.8, 7].entries()) {
        b.sign(i === 0 ? 'FERRY RAMP: FLY!' : 'FERRY RAMP').ease(14, -1.5).flat(3).kicker(6, 2.3).pit(len, -2.4).land(26).flat(10);
        b.rollers(3, 15, 1.3).flat(4);
      }
      b.ease(8, -1.5).flat(1).containers(2).ease(8, -1.5).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'docks-7', biome: 'docks', name: 'Stack Attack', difficulty: 6, par: 15000,
    challenges: [
      { text: 'Ride three stacks in one combo', kind: 'combo', across: ['stacks', 'stacksend'] },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Stack to stack: manual the roof, ollie the water, keep the combo alive.
    build: layout(18, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(3, 14, 1.1).flat(4);
      for (let set = 0; set < 2; set++) {
        b.sign(set === 0 ? 'THREE STACKS: ONE COMBO!' : 'STACKS').ease(8, -1.5).flat(1).spot('stacks').containers(2);
        b.pit(7.2, -0.3).land(16, 1.8).flat(1).containers(2);
        b.spot('stacksend').pit(7.6, -0.3).land(16, 1.8).flat(1).containers(2);
        b.pit(8, -0.4).land(22).flat(6);
        b.rollers(3, 14, 1.1).flat(4);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'docks-8', biome: 'docks', name: 'Night Shift', difficulty: 6, par: 48000,
    challenges: [
      { text: 'Manual, grind and flip in one combo', kind: 'combo', include: ['manual', 'grind', 'flip'] },
      { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 },
      { text: 'Score 48,000', kind: 'score', points: 48000 },
    ],
    // Under the floodlights: pads, rails and stacks with kickers between.
    build: layout(18, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      b.rollers(3, 14, 1.1).flat(4);
      b.sign('PAD, RAIL, KICKER').pad(7).flat(3).rail(10, 0.6).flat(3).kicker(4, 1.3).flat(3).land(22).flat(6);
      b.rollers(2, 14, 1.1).flat(4);
      b.ease(8, -1.5).flat(1).containers(2).pit(6.8, -1.2).land(22).flat(6);
      b.rollers(2, 14, 1.1).flat(4);
      b.flat(8).stairs(7).flat(6).pad(7).flat(3).ledge(10).flat(8);
      b.rollers(2, 14, 1.1).flat(4);
      b.sign('GAP!').ease(8, -1.5).flat(3).kicker(5, 1.6).pit(6, -1.4).land(26).flat(8);
      b.rollers(2, 14, 1.1).flat(4);
      b.pad(7).flat(3).rail(12, 0.6).flat(3).kicker(4, 1.4).flat(3).land(18).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'docks-9', biome: 'docks', name: 'Storm Surge', difficulty: 7, par: 38500,
    challenges: [
      { text: 'Clear a set of three gaps in one combo', kind: 'combo', gaps: 3 },
      { text: 'Land a 6-trick combo', kind: 'combo', tricks: 6 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Three gaps back to back between the piers, with the sea crashing in.
    build: layout(20, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(6);
      for (let i = 0; i < 3; i++) {
        b.rollers(3, 14, 1.2).flat(4);
        b.sign(i === 0 ? 'THREE GAPS: ONE COMBO!' : 'GAP SET').flat(9);
        for (let k = 0; k < 3; k++) {
          b.kicker(4, 1.3).pit([5.4, 6.4, 7][k], -1.0).land(k === 0 ? 28 : 20, 2.6).flat(k < 2 ? 3 : 1);
        }
        b.flat(8);
      }
      b.rollers(2, 14, 1.1).flat(4).pad(8).flat(3).ledge(10).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'docks-10', biome: 'docks', name: 'Big Ship', difficulty: 7, par: 55000,
    challenges: [
      { text: 'Clear the final gap', kind: 'gaps', which: [-1] },
      { text: 'Grind, manual and grab in one combo', kind: 'combo', include: ['grind', 'manual', 'grab'] },
      { text: 'Score 55,000', kind: 'score', points: 55000 },
    ],
    // Down the gangway, along the deck cargo and off the bow.
    build: layout(26, 5, (b) => {
      b.flat(8).sign('ALL ABOARD').ease(12, -4).flat(6);
      b.rollers(2, 14, 1.1).flat(4);
      b.flat(10).stairs(8).flat(8).pad(7).flat(4);
      b.flat(6).rail(10, 0.6).flat(4).kicker(4, 1.3).flat(3).land(18).flat(6);
      b.rollers(2, 14, 1.1).flat(4);
      b.ease(8, -1.5).flat(1).containers(3).pit(7.2, -1.2).land(22).flat(6);
      b.rollers(2, 14, 1.1).flat(4).ledge(10).pit(7, -1.4).land(18).flat(8);
      b.rollers(3, 14, 1.1).flat(4);
      b.flat(6).rail(12, 0.6).flat(3).pad(7).flat(3).kicker(4, 1.4).flat(3).land(18).flat(6);
      b.flat(10).stairs(9).flat(10);
      b.rollers(2, 14, 1.1).flat(4);
      b.sign('OFF THE BOW: 7 METRE GAP!').ease(14, -2).flat(3).kicker(6, 2.0).pit(7, -3).land(26).flat(10);
    }),
  },
  {
    id: 'docks-mega', biome: 'docks', name: 'Harbour Crane Mega Ramp', kind: 'mega', par: 22500,
    challenges: [
      { text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 },
      { text: 'A trick on both airs of one drop', kind: 'bothAirs' },
      { text: 'Score 22,500', kind: 'score', points: 22500 },
    ],
    build: mega(13, 8.5, 5),
  },
];
