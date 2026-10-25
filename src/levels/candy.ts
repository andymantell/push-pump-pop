import { TrackDef, layout, pipe } from './common';

// Candy Kingdom: bounce. Jelly pads throw you up wherever you touch them, so you get big
// airs without big ramps, and lots of time for tricks. Pump as you hit a pad to bounce
// higher. Then pads in a row, pads over chocolate rivers, and candy cane rails.

export const CANDY: TrackDef[] = [
  {
    id: 'candy-1', biome: 'candy', name: 'Jelly Jump', difficulty: 3, par: 9500,
    challenges: [
      { text: 'Finish the track', kind: 'finish' },
      { text: 'A trick off a jelly pad', kind: 'trick', match: 'any', from: 'bouncer' },
      { text: 'A grab off every jelly pad', kind: 'trick', match: 'grab', from: 'bouncer', count: 4 },
    ],
    build: layout(10, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(2, 14, 1.0).flat(6);
      b.sign('JELLY! BOING!').flat(6).bouncer(2.5, 6).land(30).flat(8);
      b.rollers(2, 14, 1.0).flat(6);
      b.bouncer(2.5, 6.5).land(32).flat(8);
      b.rollers(2, 14, 1.1).flat(6);
      b.bouncer(2.5, 7).land(36).flat(8);
      b.ease(10, -2).flat(6).bouncer(2.5, 7).land(40).flat(10);
    }),
  },
  {
    id: 'candy-2', biome: 'candy', name: 'Gumdrop Hills', difficulty: 3, par: 7500,
    challenges: [
      { text: 'Pump on a jelly pad for a big bounce', kind: 'air', seconds: 1.3, from: 'bouncer' },
      { text: 'Do 10 good pumps', kind: 'pumps', count: 10 },
      { text: 'A flip and a grab in one bounce', kind: 'sameAir', match: ['flip', 'grab'], from: 'bouncer' },
    ],
    build: layout(10, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6);
      b.sign('GUMDROP HILLS').rollers(3, 14, 1.1).flat(6);
      b.sign('PUMP ON THE JELLY: HIGHER!').flat(6).bouncer(2.5, 7).land(38).flat(6);
      for (let i = 0; i < 3; i++) {
        b.rollers(3, 14, 1.1).flat(6);
        b.bouncer(2.5, 7).land(38).flat(6);
      }
      b.rollers(2, 14, 1.0).flat(10);
    }),
  },
  {
    id: 'candy-3', biome: 'candy', name: 'Bounce House', difficulty: 4, par: 26000,
    challenges: [
      { text: 'Bounce 3 pads in a row in one combo', kind: 'combo', across: ['chain', 'chainend'] },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
    ],
    // Pads in a row: each landing rolls you straight onto the next pad.
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(2, 14, 1.0).flat(6);
      for (let set = 0; set < 3; set++) {
        if (set === 0) b.sign('BOUNCE, BOUNCE, BOUNCE!');
        b.flat(4).spot('chain');
        b.bouncer(2.5, 5.5).land(22).flat(1);
        b.bouncer(2.5, 5.5).land(22).flat(1);
        b.spot('chainend').bouncer(2.5, 5.5).land(30).flat(6);
        b.rollers(2, 14, 1.1).flat(6);
      }
      b.flat(8);
    }),
  },
  {
    id: 'candy-4', biome: 'candy', name: 'Chocolate River', difficulty: 4, par: 11500,
    challenges: [
      { text: 'Clear every chocolate river', kind: 'gaps' },
      { text: 'A grab over a river', kind: 'trick', match: 'grab', overGap: true },
      { text: 'A trick over every river', kind: 'trick', match: 'any', overGap: 'every' },
    ],
    // Pads at the edge of chocolate rivers: pump the rollers, then pump the pad.
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(2, 14, 1.0).flat(6);
      b.sign('CHOCOLATE RIVER! PUMP THE JELLY').flat(4).bouncer(2.5, 7).pit(8.0, -1.0).land(32).flat(6);
      b.rollers(3, 14, 1.1).flat(6);
      b.bouncer(2.5, 7).pit(9.5, -1.0).land(32).flat(6);
      b.rollers(3, 14, 1.1).flat(6);
      b.bouncer(2.5, 7).pit(10.0, -1.0).land(34).flat(6);
      b.rollers(2, 14, 1.1).flat(6);
      b.ease(8, -1.5).flat(4).bouncer(2.5, 7).pit(10.5, -1.0).land(36).flat(10);
    }),
  },
  {
    id: 'candy-5', biome: 'candy', name: 'Candy Cane Lane', difficulty: 5, par: 49500,
    challenges: [
      { text: 'Grind 2 candy canes', kind: 'grind', count: 2 },
      { text: 'Clear every chocolate river', kind: 'gaps' },
      { text: 'Grind for 2 seconds', kind: 'grind', seconds: 2 },
    ],
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(2, 14, 1.0).flat(6);
      b.sign('CANDY CANE: GRIND IT').flat(6).rail(14).flat(6);
      b.bouncer(2.5, 7).land(36).flat(6);
      b.rollers(2, 14, 1.1).flat(6).rail(20).flat(4).ease(8, -1.5).flat(3);
      b.bouncer(2.5, 7).pit(7.5, -1.0).land(32).flat(6);
      b.rollers(3, 14, 1.1).flat(6);
      b.flat(4).rail(32).flat(6);
      b.ease(8, -1.5).flat(4).bouncer(2.5, 7).pit(10.0, -1.0).land(34).flat(6);
      b.rollers(2, 14, 1.1).flat(4).ledge(10).flat(10);
    }),
  },
  {
    id: 'candy-6', biome: 'candy', name: 'Sprinkle Storm', difficulty: 5, par: 28500,
    challenges: [
      { text: 'Clear every chocolate river', kind: 'gaps' },
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
      { text: 'A 360 off a jelly pad', kind: 'trick', match: '360', from: 'bouncer' },
    ],
    build: layout(16, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(2, 14, 1.1).flat(6);
      for (let i = 0; i < 3; i++) {
        b.kicker(4, 1.4).flat(2.5).land(30).flat(3).pad(6).flat(3);
        b.bouncer(2.5, 7).land(36).flat(4);
        b.rollers(2, 14, 1.1).flat(4);
        b.bouncer(2.5, 7).pit(9.5 + i * 0.5, -1.0).land(34).flat(6);
        b.rollers(2, 14, 1.1).flat(6);
      }
      b.flat(8);
    }),
  },
  {
    id: 'candy-7', biome: 'candy', name: 'Sugar Rush', difficulty: 6, par: 29000,
    challenges: [
      { text: 'Clear every chocolate river', kind: 'gaps' },
      { text: 'One combo across the bounce chain', kind: 'combo', across: ['chain', 'chainend'] },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    // Bounce chains that end over a river.
    build: layout(16, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(2, 14, 1.1).flat(6);
      b.sign('SUGAR RUSH!').flat(4).spot('chain');
      b.bouncer(2.5, 5.5).land(22).flat(1).bouncer(2.5, 5.5).land(22).flat(1);
      b.spot('chainend').bouncer(2.5, 7).pit(9.0, -1.0).land(34).flat(6);
      b.rollers(3, 14, 1.1).flat(6);
      b.bouncer(2.5, 7).pit(9.5, -1.0).land(34).flat(4).rail(14).flat(6);
      b.rollers(2, 14, 1.1).flat(6);
      b.bouncer(2.5, 5.5).land(22).flat(1).bouncer(2.5, 7).pit(10.0, -1.0).land(36).flat(6);
      b.rollers(3, 14, 1.1).flat(6);
      b.ease(8, -1.5).flat(4).bouncer(2.5, 7.5).pit(11.0, -1.0).land(38).flat(10);
    }),
  },
  {
    id: 'candy-8', biome: 'candy', name: 'Candy Castle', difficulty: 6, par: 34500,
    challenges: [
      { text: 'Clear every chocolate river', kind: 'gaps' },
      { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 },
      { text: 'Land 8 different tricks', kind: 'variety', count: 8 },
    ],
    build: layout(18, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(2, 14, 1.1).flat(6);
      b.bouncer(2.5, 7).land(36).flat(4).rollers(2, 14, 1.1).flat(4);
      b.flat(4).rail(14).flat(4).bouncer(2.5, 7).pit(7.5, -1.0).land(34).flat(6);
      b.pad(8).flat(4).rollers(3, 14, 1.1).flat(4);
      b.kicker(4.5, 1.6).pit(4.5, -1.0).land(24).flat(6);
      b.flat(4).spot('chain').bouncer(2.5, 5.5).land(22).flat(1).spot('chainend').bouncer(2.5, 5.5).land(30).flat(6);
      b.rollers(3, 14, 1.1).flat(6);
      b.bouncer(2.5, 7).pit(10.5, -1.0).land(36).flat(4).ledge(8).flat(6);
      b.rollers(2, 14, 1.1).flat(4);
      b.sign('CANDY CASTLE!').ease(8, -1.5).flat(4).bouncer(2.5, 8).land(44).flat(10);
    }),
  },
];

export const CANDY_PIPE: TrackDef = {
  id: 'candy-pipe', biome: 'candy', name: 'Jelly Bowl', kind: 'pipe', par: 22000,
  challenges: [
    { text: 'Land a spin', kind: 'trick', match: 'spin' },
    { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
    { text: 'Score 22,000', kind: 'score', points: 22000 },
  ],
  build: pipe(4.5, 5),
};
