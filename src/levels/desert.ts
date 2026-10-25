import { TrackDef, layout, mega } from './common';

// Desert Canyon: deep gullies you pump out of. They get deeper and steeper, then come in
// pairs, then feed a gap. Loops start here (track 8). Gullies are long for their depth so
// you can pump through them at speed instead of flying into the far side.

export const DESERT: TrackDef[] = [
  {
    id: 'desert-1', biome: 'desert', name: 'Dry Gulch', difficulty: 4, par: 14500,
    challenges: [
      { text: 'Do 8 good pumps', kind: 'pumps', count: 8 },
      { text: 'Climb out of every gully first time', kind: 'climb' },
      { text: 'Score 14,500', kind: 'score', points: 14500 },
    ],
    build: layout(4, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      b.sign('PUMP OUT').valley(24, 3).flat(4);
      b.rollers(2, 13, 1.26).flat(3);
      b.kicker(4, 1.3).flat(4).land(27).flat(4);
      b.valley(27, 4).flat(3);
      b.rollers(3, 12, 1.12).flat(3);
      b.flat(5).ledge(8).flat(5);
      b.kicker(4, 1.5).flat(3).land(22).flat(4);
      b.sign('DEEP GULLY').valley(30, 5).flat(4);
      b.flat(5).stairs(6).flat(8);
      b.rollers(2, 13, 1.4).flat(4);
      b.valley(24, 3).flat(4);
      b.sign('BIG AIR').ease(8, -2).kicker(5, 2.0).flat(4).land(32).flat(6);
    }),
  },
  {
    id: 'desert-2', biome: 'desert', name: 'Rattlesnake Ravine', difficulty: 5, par: 1000,
    challenges: [
      { text: 'Climb out of every gully first time', kind: 'climb' },
      { text: 'Air off a gully lip', kind: 'air', from: 'lip', seconds: 0.4 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Pairs of deep gullies with hardly any flat between.
    build: layout(6, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      b.sign('TWO IN A ROW').valley(27, 4).flat(2).valley(27, 4).flat(6);
      b.rollers(2, 13, 1.26).flat(4);
      b.sign('POP OFF THE LIP!').valley(27, 4).flat(2).valley(30, 5).flat(6);
      b.rollers(2, 13, 1.26).flat(4);
      b.valley(30, 5).flat(2).valley(27, 4).flat(6);
      b.rollers(2, 13, 1.26).flat(4);
      b.valley(30, 5).flat(2).valley(30, 5).flat(6);
      b.ease(10, -2).flat(10);
    }),
  },
  {
    id: 'desert-3', biome: 'desert', name: 'Cactus Coulee', difficulty: 5, par: 33500,
    challenges: [
      { text: 'Ollie off a gully kicker', kind: 'trick', match: 'Ollie', from: 'kicker' },
      { text: 'Flip + grab combo', kind: 'combo', include: ['flip', 'grab'] },
      { text: 'Score 33,500', kind: 'score', points: 33500 },
    ],
    // Pump out of each gully straight into a kicker.
    build: layout(6, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      for (let i = 0; i < 5; i++) {
        if (i === 0) b.sign('PUMP OUT, THEN OLLIE');
        if (i === 2) b.sign('FLIP, THEN GRAB');
        b.valley(27, 4).flat(3);
        b.kicker(4, 1.4).flat(3).land(18).flat(4);
        b.kicker(4, 1.4).flat(4).land(18).flat(6);
      }
      b.ease(10, -2).flat(10);
    }),
  },
  {
    id: 'desert-4', biome: 'desert', name: 'Mesa Top', difficulty: 6, par: 8500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Spin over a gap', kind: 'trick', match: 'spin', overGap: true },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Pump a gully for the speed to jump a dry riverbed.
    build: layout(10, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      for (const len of [3.5, 4, 4.5]) {
        b.rollers(2, 13, 1.26).flat(4);
        if (len === 3.5) b.sign('PUMP THE GULLY FOR SPEED');
        b.valley(27, 4).flat(4);
        b.sign('RIVERBED GAP!').kicker(4.5, 1.4).pit(len, -1.0).land(18).flat(8);
      }
      b.rollers(2, 13, 1.26).flat(4);
      b.ease(10, -2).flat(10);
    }),
  },
  {
    id: 'desert-5', biome: 'desert', name: 'Tumbleweed Trail', difficulty: 6, par: 73000,
    challenges: [
      { text: 'Grind across a gully', kind: 'grind' },
      { text: 'Grind every gully rail', kind: 'grind', count: 4 },
      { text: 'Grind + flip combo', kind: 'combo', include: ['grind', 'flip'] },
    ],
    // Rails bridging the gullies: ollie on and grind across, or ride down through.
    build: layout(8, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      b.rollers(2, 13, 1.26).flat(6);
      for (let i = 0; i < 4; i++) {
        if (i === 0) b.sign('OLLIE ONTO THE RAIL');
        b.flat(10).bridge(24 + i * 2, 3 + (i % 2)).flat(6);
        b.kicker(4, 1.3).flat(3).land(18).flat(4);
        b.rollers(2, 13, 1.26).flat(4);
      }
      b.ease(10, -2).flat(10);
    }),
  },
  {
    id: 'desert-6', biome: 'desert', name: 'The Big Dip', difficulty: 7, par: 3500,
    challenges: [
      { text: 'Climb out of every gully first time', kind: 'climb' },
      { text: 'Air off the last gully', kind: 'air', from: 'lastlip', seconds: 0.4 },
      { text: 'Score 3,500', kind: 'score', points: 3500 },
    ],
    // Three very deep gullies that each need two good pumps.
    build: layout(6, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      b.rollers(2, 13, 1.26).flat(4);
      b.sign('6 METRES DEEP! PUMP TWICE').valley(34, 6).flat(6);
      b.rollers(2, 13, 1.26).flat(4);
      b.valley(34, 6).flat(6);
      b.rollers(2, 13, 1.26).flat(4);
      b.sign('POP OFF THE TOP').valley(34, 6).spot('lastlip').flat(8);
      b.kicker(4.5, 1.6).flat(1.5).land(18).flat(6);
      b.ease(10, -2).flat(10);
    }),
  },
  {
    id: 'desert-7', biome: 'desert', name: 'Sandstorm Slalom', difficulty: 7, par: 35500,
    challenges: [
      { text: 'Clear both gaps', kind: 'gaps' },
      { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Gullies and rollers of changing sizes, and two gaps.
    build: layout(10, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      b.valley(24, 3).flat(2).rollers(2, 12, 1.0).flat(2).valley(30, 5).flat(4);
      b.rollers(3, 15, 1.4).flat(4);
      b.sign('GAP!').kicker(4.5, 1.4).pit(4.1, -1.0).land(18).flat(6);
      b.sign('KEEP IT GOING!').kicker(4, 1.3).flat(4).land(18).flat(2).kicker(4, 1.4).flat(4).land(18).flat(2).kicker(4, 1.5).flat(4).land(18).flat(6);
      b.valley(27, 4).flat(2).rollers(2, 14, 1.2).flat(2).valley(24, 3).flat(4);
      b.rollers(2, 13, 1.26).flat(4);
      b.sign('GAP!').kicker(4.5, 1.5).pit(4, -1.0).land(22).flat(6);
      b.kicker(4, 1.3).flat(4).land(22).flat(2).kicker(4, 1.4).flat(4).land(18).flat(6);
      b.ease(10, -2).flat(10);
    }),
  },
  {
    id: 'desert-8', biome: 'desert', name: 'Arch Loop', difficulty: 7, par: 5500,
    challenges: [
      { text: 'Ride the loop', kind: 'loop' },
      { text: 'Loop + flip combo', kind: 'combo', include: ['loop', 'flip'] },
      { text: 'Score 5,500', kind: 'score', points: 5500 },
    ],
    // A sandstone arch loop after a long pump gully.
    build: layout(10, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      b.rollers(2, 13, 1.26).flat(4);
      b.valley(27, 4).flat(4);
      b.sign('PUMP FOR SPEED').valley(30, 5).flat(4);
      b.sign('LOOP!').ease(14, -4).flat(4).loop(2.4).flat(4);
      b.sign('FLIP OFF THE KICKER').kicker(4, 1.4).flat(4).land(26).flat(6);
      b.rollers(3, 13, 1.26).flat(4);
      b.valley(27, 4).flat(4);
      b.ease(10, -2).flat(10);
    }),
  },
  {
    id: 'desert-9', biome: 'desert', name: 'Canyon Run', difficulty: 8, par: 38500,
    challenges: [
      { text: 'Ride both loops', kind: 'loop', count: 2 },
      { text: 'Loop + grab + spin combo', kind: 'combo', include: ['loop', 'grab', 'spin'] },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Two loops, deep gullies and three gaps.
    build: layout(16, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      b.valley(27, 4).flat(4);
      b.sign('GAP!').kicker(4.5, 1.4).pit(3.8, -1.0).land(18).flat(6);
      b.rollers(2, 13, 1.26).flat(4);
      b.sign('LOOP!').ease(14, -4).flat(4).loop(2.4).flat(4);
      b.flat(4).kicker(4, 1.4).flat(1.5).land(25).flat(3).kicker(4, 1.4).flat(4).land(18).flat(8);
      b.valley(30, 5).flat(4);
      b.sign('GAP!').kicker(4.5, 1.5).pit(4, -1.0).land(18).flat(6);
      b.rollers(2, 13, 1.26).flat(4);
      b.sign('LOOP!').ease(14, -4).flat(4).loop(2.4).flat(4);
      b.flat(4).kicker(4, 1.4).flat(1.5).land(25).flat(3).kicker(4, 1.4).flat(4).land(18).flat(8);
      b.valley(27, 4).flat(4);
      b.sign('GAP!').ease(8, -1.5).kicker(4.5, 1.6).pit(4.5, -1.2).land(22).flat(6);
      b.ease(10, -2).flat(10);
    }),
  },
  {
    id: 'desert-10', biome: 'desert', name: 'Grand Gully', difficulty: 8, par: 30000,
    challenges: [
      { text: 'Clear the final gap', kind: 'gaps', which: [-1] },
      { text: 'Loop + 2 tricks combo', kind: 'combo', include: ['loop'], tricks: 3 },
      { text: 'Score 30,000', kind: 'score', points: 30000 },
    ],
    // The deepest gully of all, a loop straight out of it, and a big last gap.
    build: layout(18, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      b.rollers(2, 13, 1.26).flat(4);
      b.valley(27, 4).flat(4);
      b.sign('GAP!').kicker(4.5, 1.4).pit(3.5, -1.0).land(18).flat(6);
      b.flat(10).bridge(26, 4).flat(6);
      b.rollers(2, 13, 1.26).flat(4);
      b.ease(12, -2).flat(4);
      b.sign('GRAND GULLY: 7 METRES!').valley(40, 7).flat(4);
      b.sign('LOOP!').ease(16, -5).flat(4).loop(2.4).flat(4);
      b.flat(4).kicker(4, 1.4).flat(1.5).land(25).flat(3).kicker(4, 1.4).flat(4).land(18).flat(8);
      b.valley(30, 5).flat(4);
      b.rollers(2, 13, 1.26).flat(4);
      b.sign('FINAL GAP').ease(10, -1).kicker(5, 2.0).pit(7, -2).land(26).flat(10);
    }),
  },
  {
    id: 'desert-mega', biome: 'desert', name: 'Canyon Mega Ramp', kind: 'mega', par: 15500,
    challenges: [
      { text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 },
      { text: 'A trick on both airs of one drop', kind: 'bothAirs' },
      { text: 'Score 15,500', kind: 'score', points: 15500 },
    ],
    build: mega(18, 12, 6),
  },
];
