import { TrackDef, layout, pipe } from './common';

// Haunted Hollow: drop-offs. The ground falls away at a lip onto a steep landing: roll off with
// speed and you come down on the slope and keep it; too slow and you thump onto the flat. Then
// drops into gaps, the crooked bridge, the ghost train rail, the manor stairs and the roof.

export const HAUNTED: TrackDef[] = [
  {
    id: 'haunted-1', biome: 'haunted', name: 'Spooky Steps', difficulty: 5, par: 4000,
    challenges: [
      { text: 'Air for half a second off a drop-off', kind: 'air', from: 'dropoff', seconds: 0.5 },
      { text: 'Do 12 good pumps', kind: 'pumps', count: 12 },
      { text: 'A grab off a drop-off', kind: 'trick', match: 'grab', from: 'dropoff' },
    ],
    build: layout(26, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4);
      b.sign('DROP-OFF: PUMP FOR SPEED').flat(4).dropoff(1.0, 20).flat(6);
      b.rollers(2, 14, 1.2).flat(4).dropoff(1.2, 20).flat(6);
      b.rollers(3, 14, 1.2).flat(4).dropoff(1.4, 21).flat(4).dropoff(1.0, 20).flat(6);
      b.rollers(2, 14, 1.2).flat(4).kicker(4, 1.2).flat(2).land(32, 4).flat(6);
      b.rollers(2, 14, 1.2).flat(4).dropoff(1.6, 22).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'haunted-2', biome: 'haunted', name: 'Graveyard Drop', difficulty: 5, par: 7500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A flip off a drop-off', kind: 'trick', match: 'flip', from: 'dropoff' },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
    ],
    // Down through the graveyard: big drops, and the odd open grave to jump.
    build: layout(28, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4);
      b.sign('GRAVEYARD DROP').flat(4).dropoff(1.8, 23).flat(6);
      b.rollers(3, 14, 1.2).flat(4);
      b.sign('OPEN GRAVE: JUMP IT!').flat(4).kicker(4.5, 1.4).pit(5.6, -0.6).land(24).flat(8);
      b.rollers(3, 14, 1.2).flat(4).dropoff(2.0, 24).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(6, -0.6).land(28).flat(8);
      b.rollers(2, 14, 1.2).flat(4).dropoff(1.6, 22).flat(4).dropoff(1.4, 21).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'haunted-3', biome: 'haunted', name: 'Crooked Bridge', difficulty: 6, par: 16000,
    challenges: [
      { text: 'Grind the crooked bridge', kind: 'grind' },
      { text: 'Grind, then a drop-off, in one combo', kind: 'combo', include: ['grind'], tricks: 2 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // A rickety rail bridge over the ravine: grind it, or jump it.
    build: layout(26, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      for (let i = 0; i < 3; i++) {
        b.rollers(3, 14, 1.2).flat(4);
        b.sign(i === 0 ? 'CROOKED BRIDGE: GRIND IT' : 'BRIDGE').gapRail(5 + i * 0.5, 0.6).land(16).flat(3).dropoff(1.4, 21).flat(6);
      }
      b.rollers(2, 14, 1.2).flat(4).dropoff(1.8, 23).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'haunted-4', biome: 'haunted', name: 'Pumpkin Patch', difficulty: 6, par: 7000,
    challenges: [
      { text: 'Do 14 good pumps', kind: 'pumps', count: 14 },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
    ],
    // Pumpkin-patch rollers, every one of them a pump, between drops.
    build: layout(28, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      b.sign('PUMPKIN ROLLERS: PUMP!').rollers(5, 12, 1.3).flat(4).dropoff(1.6, 22).flat(4);
      b.rollers(4, 12, 1.3).flat(4).kicker(4.5, 1.4).pit(6, -0.6).land(24).flat(6);
      b.rollers(5, 12, 1.3).flat(4).dropoff(2.0, 24).flat(4);
      b.rollers(4, 12, 1.3).flat(4).kicker(4.5, 1.4).pit(6.4, -0.6).land(24).flat(6);
      b.rollers(4, 12, 1.3).flat(4).dropoff(1.6, 22).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'haunted-5', biome: 'haunted', name: 'Into the Dark', difficulty: 7, par: 12500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A spin over every gap', kind: 'trick', match: 'spin', overGap: 'every' },
      { text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 },
    ],
    // Off the lip and down over a black gap: the landing is a long way below.
    build: layout(32, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      for (const [i, len] of [6.4, 6.8, 7.2, 7.4].entries()) {
        b.rollers(3, 14, 1.3).flat(4);
        b.sign(i === 0 ? 'DROP INTO THE DARK!' : 'GAP!').flat(4).kicker(4, 1.0).pit(len, -2.2).land(28, 3.4).flat(6);
      }
      b.rollers(2, 14, 1.2).flat(4).dropoff(2.0, 24).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'haunted-6', biome: 'haunted', name: 'Ghost Train', difficulty: 7, par: 25000,
    challenges: [
      { text: 'Ride the ghost train rail', kind: 'grind', count: 3 },
      { text: 'A grind and two more tricks in one combo', kind: 'combo', include: ['grind'], tricks: 3 },
      { text: 'Clear every gap', kind: 'gaps' },
    ],
    // The ghost train's track runs down the hill: grind it, drop off the end.
    build: layout(32, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      for (let i = 0; i < 3; i++) {
        b.rollers(3, 14, 1.2).flat(4);
        b.sign(i === 0 ? 'GHOST TRAIN: GRIND DOWN' : 'GHOST TRAIN').flat(4).downrail(12, -2).flat(3).dropoff(1.4, 21).flat(6);
        b.rollers(2, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(6.4 + i * 0.3, -0.6).land(24).flat(6);
      }
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'haunted-7', biome: 'haunted', name: 'Manor Stairs', difficulty: 7, par: 12500,
    challenges: [
      { text: 'Grind a handrail', kind: 'grind', railKind: 'handrail' },
      { text: 'Clear the gap', kind: 'gaps' },
      { text: 'A flip down the stairs', kind: 'trick', match: 'flip', from: 'stairs' },
    ],
    // Up to the manor door and down its great stairs, terrace by terrace.
    build: layout(30, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -3).flat(6);
      for (const [i, steps] of [6, 8, 9].entries()) {
        b.rollers(3, 14, 1.2).flat(4);
        b.sign(i === 0 ? 'MANOR STAIRS: GRIND THE RAIL' : 'STAIRS').flat(8).stairs(steps).flat(8);
        b.rollers(2, 14, 1.2).flat(4).dropoff(1.6, 22).flat(6);
      }
      b.rollers(2, 14, 1.2).flat(4).kicker(4.5, 1.4).pit(6.6, -0.8).land(24).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'haunted-8', biome: 'haunted', name: 'Off the Roof', difficulty: 8, par: 19500,
    challenges: [
      { text: 'Clear the final gap', kind: 'gaps', which: [-1] },
      { text: 'Land 6 different tricks', kind: 'variety', count: 6 },
      { text: 'Score 19,500', kind: 'score', points: 19500 },
    ],
    // Everything in the hollow, and a last leap off the manor roof.
    build: layout(36, 5, (b) => {
      b.flat(8).sign('MIDNIGHT!').ease(12, -3).flat(6);
      b.rollers(3, 14, 1.2).flat(4).dropoff(1.8, 23).flat(4);
      b.rollers(2, 14, 1.2).flat(4).gapRail(5.5, 0.6).land(16).flat(6);
      b.rollers(3, 14, 1.2).flat(4).kicker(4, 1.0).pit(7, -2.2).land(28, 3.4).flat(6);
      b.rollers(2, 14, 1.2).flat(4).downrail(12, -2).flat(3).dropoff(1.4, 21).flat(6);
      b.rollers(3, 14, 1.2).flat(8).stairs(8).flat(8);
      b.rollers(3, 14, 1.3).flat(4);
      b.sign('OFF THE MANOR ROOF!').ease(14, -2).flat(3).kicker(6, 2.0).pit(7.4, -3).land(26).flat(10);
    }),
  },
];

export const HAUNTED_PIPE: TrackDef = {
  id: 'haunted-pipe', biome: 'haunted', name: 'Graveyard Halfpipe', kind: 'pipe', par: 22000,
  challenges: [
    { text: 'Land a flip', kind: 'trick', match: 'flip' },
    { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
    { text: 'Score 22,000', kind: 'score', points: 22000 },
  ],
  build: pipe(4.5, 5),
};
