import { TrackDef, layout, mega } from './common';

// Snowy Mountain: ice and huge air, on a snowboard. You barely lose speed, so it's about
// timing at speed and handling big airs. Rollers are 16 m or longer.

export const SNOW: TrackDef[] = [
  {
    id: 'snow-1', biome: 'snow', name: 'Powder Run', difficulty: 4, par: 22500,
    challenges: [
      { text: 'Air for 1.5 seconds', kind: 'air', seconds: 1.5 },
      { text: 'Land a 360', kind: 'trick', match: '360' },
      { text: 'Score 22,500', kind: 'score', points: 22500 },
    ],
    build: layout(12, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -5).flat(5);
      b.sign('ICY!').rollers(2, 16, 1.4);
      b.kicker(5, 1.8).flat(4).ease(8, -3).flat(3);
      b.ease(15, -5);
      b.kicker(5, 2.2).drop(-0.5).ease(12, -5);
      b.rollers(3, 15, 1.5).flat(4);
      b.flat(6).rail(10, 0.6).flat(6);
      b.kicker(4, 1.5).flat(6).ease(6, -1.5).flat(5);
      b.ease(10, -3).rollers(2, 16, 1.26);
      b.kicker(4.5, 1.8).flat(5).ease(7, -2.5).rollers(3, 16, 1.4).flat(4);
      b.kicker(5, 2.0).drop(-0.4).ease(10, -4).flat(4);
      b.sign('HUGE AIR').ease(12, -4).kicker(6, 2.6).drop(-0.6).ease(16, -6).flat(10);
    }),
  },
  {
    id: 'snow-2', biome: 'snow', name: 'Flip Hill', difficulty: 4, par: 6500,
    challenges: [
      { text: 'Land a backflip', kind: 'trick', match: 'Backflip' },
      { text: 'Land a frontflip', kind: 'trick', match: 'Frontflip' },
      { text: 'Backflip and grab in the same air', kind: 'sameAir', match: ['Backflip', 'grab'] },
    ],
    // Huge kickers onto long downhill landings: room to tilt round a whole flip.
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -5).flat(5);
      b.rollers(2, 16, 1.4).flat(4);
      b.sign('TILT BACK IN THE AIR: BACKFLIP').ease(14, -3).flat(6).kicker(6, 2.4).drop(-0.5).ease(16, -6).flat(6);
      b.rollers(2, 16, 1.4).flat(4);
      b.sign('TILT FORWARD: FRONTFLIP').ease(14, -3).flat(6).kicker(6, 2.4).drop(-0.5).ease(16, -6).flat(6);
      b.rollers(2, 16, 1.4).flat(4);
      b.sign('TILT: FLIP').ease(14, -3).flat(6).kicker(6, 2.5).drop(-0.5).ease(16, -6).flat(6);
      b.rollers(2, 16, 1.4).flat(4);
      b.ease(14, -3).flat(6).kicker(6, 2.6).drop(-0.6).ease(16, -6).flat(20);
    }),
  },
  {
    id: 'snow-3', biome: 'snow', name: 'Pine Glades', difficulty: 5, par: 8500,
    challenges: [
      { text: 'Do 10 good pumps', kind: 'pumps', count: 10 },
      { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Long rollers and kickers through the trees, coming at you fast.
    build: layout(12, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(5);
      for (let i = 0; i < 4; i++) {
        b.rollers(3, 18, 1.5).flat(4);
        b.kicker(4.5, 1.6).flat(2).ease(8, -1.6).flat(3);
        b.kicker(4.5, 1.7).flat(2).ease(8, -1.7).flat(4);
        b.ease(10, -1.5).flat(4);
      }
      b.rollers(2, 18, 1.5).flat(10);
    }),
  },
  {
    id: 'snow-4', biome: 'snow', name: 'Crevasse Crossing', difficulty: 5, par: 5500,
    challenges: [
      { text: 'Clear every crevasse', kind: 'gaps' },
      { text: 'Spin over a crevasse', kind: 'trick', match: 'spin', overGap: true },
      { text: 'Flip over a crevasse', kind: 'trick', match: 'flip', overGap: true },
    ],
    // Three crevasses landing downhill.
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(5);
      for (const len of [4, 4.5, 5]) {
        b.rollers(3, 16, 1.4).flat(4);
        b.sign(len === 4 ? 'CREVASSE! JUMP IT' : 'CREVASSE!').ease(8, -1.5).flat(3).kicker(5, 1.6).pit(len, -1.6).ease(12, -2).flat(8);
      }
      b.rollers(3, 16, 1.4).flat(4);
      b.ease(12, -3).flat(10);
    }),
  },
  {
    id: 'snow-5', biome: 'snow', name: 'Frozen Lake', difficulty: 5, par: 4500,
    challenges: [
      { text: 'Manual for 3 seconds', kind: 'manual', seconds: 3 },
      { text: 'One combo across the lake', kind: 'combo', across: ['lake', 'shore'] },
      { text: 'Combo worth 5,000', kind: 'combo', points: 5000 },
    ],
    // A frozen lake you glide across keeping your speed, with pads for one long combo.
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(14, -6).flat(5);
      b.rollers(3, 16, 1.4).flat(4);
      b.sign('TILT: MANUAL').flat(6).pad(10).flat(8);
      b.rollers(2, 16, 1.4).flat(4).ease(12, -3).flat(6);
      // The lake: flat ice all the way, so a manual can go on and on.
      b.sign('FROZEN LAKE: MANUAL ACROSS IT').flat(8).spot('lake').flat(60).spot('shore');
      b.flat(8).kicker(4, 1.3).flat(2).ease(8, -1.3).flat(8).pad(10);
      b.flat(6).ease(12, -3).flat(6);
      b.rollers(2, 16, 1.4).flat(10);
    }),
  },
  {
    id: 'snow-6', biome: 'snow', name: 'Chairlift Line', difficulty: 6, par: 78500,
    challenges: [
      { text: 'Grind a box', kind: 'grind', railKind: 'ledge' },
      { text: 'Grind 3 rails', kind: 'grind', count: 3 },
      { text: 'Rail + backflip combo', kind: 'combo', include: ['grind', 'Backflip'] },
    ],
    // Boxes and down rails under the chairlift, with kickers in between.
    build: layout(18, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(5);
      b.rollers(2, 16, 1.4).flat(4);
      b.sign('BOX: OLLIE ON').flat(10).ledge(10).flat(10);
      b.kicker(5, 1.8).flat(3).ease(12, -3).flat(6);
      b.sign('DOWN RAIL').flat(10).downrail(10, -2).flat(10);
      b.rollers(2, 16, 1.4).flat(4);
      b.flat(10).ledge(12).flat(6).kicker(5, 2.0).flat(3).ease(14, -4).flat(6);
      b.flat(10).rail(12).flat(10);
      b.rollers(2, 16, 1.4).flat(4);
      b.flat(10).downrail(12, -2.5).flat(10);
      b.kicker(5, 2.2).flat(3).ease(14, -4).flat(6);
      b.flat(10).ledge(12).flat(10);
      b.ease(12, -3).flat(10);
    }),
  },
  {
    id: 'snow-7', biome: 'snow', name: 'Avalanche Alley', difficulty: 6, par: 37000,
    challenges: [
      { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 },
      { text: 'Finish with no bails', kind: 'noLives' },
      { text: 'Score 37,000', kind: 'score', points: 37000 },
    ],
    // A steep run with kickers every 25 to 30 metres.
    build: layout(30, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -4).flat(5);
      b.sign('AVALANCHE! KEEP GOING');
      for (let i = 0; i < 10; i++) {
        b.ease(12 + (i % 3) * 2, -2.5).kicker(5.5, 1.5).flat(1).ease(10, -1.5).flat(1);
      }
      b.flat(6).rollers(2, 16, 1.4).flat(10);
    }),
  },
  {
    id: 'snow-8', biome: 'snow', name: 'Glacier Gaps', difficulty: 6, par: 7500,
    challenges: [
      { text: 'Clear every crevasse', kind: 'gaps' },
      { text: '360 over a level crevasse', kind: 'trick', match: '360', overGap: [3, 4] },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Five crevasses; the last two land level, so carry your speed into them.
    build: layout(20, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -5).flat(5);
      for (const len of [4, 4.5, 5]) {
        b.rollers(2, 16, 1.4).flat(4);
        b.sign('CREVASSE!').ease(8, -1.5).flat(3).kicker(5, 1.7).pit(len, -1.6).ease(12, -2).flat(8);
      }
      for (const len of [4, 4.5]) {
        b.rollers(2, 16, 1.4).flat(4);
        b.sign(len === 4 ? 'LEVEL LANDING: GO FAST' : 'CREVASSE!').ease(14, -3).flat(3).kicker(5, 1.8).pit(len, 0).ease(8, -1.8).flat(8);
      }
      b.rollers(2, 16, 1.4).flat(4);
      b.ease(12, -3).flat(10);
    }),
  },
  {
    id: 'snow-9', biome: 'snow', name: 'Yeti Ridge', difficulty: 7, par: 11000,
    challenges: [
      { text: 'Backflip and grab in the same air', kind: 'sameAir', match: ['Backflip', 'grab'] },
      { text: 'Air of 3 metres', kind: 'air', metres: 3 },
      { text: 'Combo worth 6,000', kind: 'combo', points: 6000 },
    ],
    // Giant kickers with room for a flip and a grab, and two crevasses.
    build: layout(26, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -5).flat(5);
      b.rollers(2, 16, 1.4).flat(4);
      b.sign('GIANT KICKER: FLIP AND GRAB').ease(16, -4).flat(6).kicker(7.5, 2.8).drop(-0.6).ease(26, -7).flat(6);
      b.rollers(2, 16, 1.4).flat(4);
      b.sign('CREVASSE!').ease(8, -1.5).flat(3).kicker(5, 1.8).pit(4.5, -1.6).ease(12, -2).flat(8);
      b.ease(16, -4).flat(6).kicker(7.5, 2.8).drop(-0.6).ease(26, -7).flat(6);
      b.rollers(2, 16, 1.4).flat(4);
      b.sign('CREVASSE!').ease(8, -1.5).flat(3).kicker(5, 1.9).pit(5, -1.6).ease(12, -2).flat(8);
      b.sign('YETI JUMP').ease(18, -5).flat(6).kicker(7.5, 3.0).drop(-0.6).ease(30, -8).flat(30);
    }),
  },
  {
    id: 'snow-10', biome: 'snow', name: 'Summit Send', difficulty: 7, par: 66500,
    challenges: [
      { text: 'Backflip on the HUGE AIR', kind: 'trick', match: 'Backflip', from: 'hugeair' },
      { text: 'Land a 6-trick combo', kind: 'combo', tricks: 6 },
      { text: 'Score 66,500', kind: 'score', points: 66500 },
    ],
    // Top to bottom: a big drop, rails, crevasses and a giant last jump.
    build: layout(36, 5, (b) => {
      b.flat(8).sign('SUMMIT').ease(16, -7).flat(5);
      b.rollers(2, 16, 1.4).flat(4);
      b.flat(10).ledge(10).flat(6).kicker(5, 1.8).flat(3).ease(12, -3).flat(6);
      b.flat(10).downrail(12, -2.5).flat(10);
      b.sign('CREVASSE!').ease(8, -1.5).flat(3).kicker(5, 1.7).pit(4.5, -1.6).ease(12, -2).flat(8);
      b.rollers(3, 16, 1.4).flat(4);
      for (let i = 0; i < 4; i++) b.ease(12, -2.5).kicker(4.5, 1.5).flat(2).ease(8, -1.5).flat(1);
      b.flat(6).rail(12).flat(10);
      b.sign('CREVASSE!').ease(8, -1.5).flat(3).kicker(5, 1.8).pit(5, -1.6).ease(12, -2).flat(8);
      b.rollers(2, 16, 1.4).flat(4);
      b.sign('HUGE AIR').ease(14, -5).kicker(6, 2.8).spot('hugeair').drop(-0.6).ease(30, -8).flat(30);
    }),
  },
  {
    id: 'snow-mega', biome: 'snow', name: 'Ski Jump Mega Ramp', kind: 'mega', par: 22000,
    challenges: [
      { text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 },
      { text: 'A trick on both airs of one drop', kind: 'bothAirs' },
      { text: 'Score 22,000', kind: 'score', points: 22000 },
    ],
    build: mega(16, 10, 6),
  },
];
