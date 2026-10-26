import { TrackDef, layout, pipe } from './common';

// Autumn Farm: mud. The first world-two biome, and a breather after the volcano. Muddy
// patches drag you back, so you learn to carry speed into them and pump through the muddy
// dips. Hay bale kickers, fence rails and, from track 5, muddy ditches to jump.

export const FARM: TrackDef[] = [
  {
    id: 'farm-1', biome: 'farm', name: 'Muddy Lane', difficulty: 2, par: 4500,
    challenges: [
      { text: 'Finish the track', kind: 'finish' },
      { text: 'Do 8 good pumps', kind: 'pumps', count: 8 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    build: layout(8, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6);
      b.rollers(2, 14, 1.0).flat(6);
      // Mud on the flat: it slows you, so come in fast.
      b.sign('MUD! IT SLOWS YOU DOWN').flat(8).mud(8).flat(8);
      b.rollers(3, 14, 1.1).flat(6);
      b.ease(10, -2).flat(4).mud(10).flat(8);
      // A muddy dip: pump on the way down to get through it.
      b.sign('PUMP THROUGH THE MUD').flat(4).muddy((m) => m.valley(16, 1.4)).flat(8);
      b.rollers(2, 14, 1.0).flat(6);
      b.kicker(4, 1.1).flat(2.5).land(22).flat(6);
      b.muddy((m) => m.valley(16, 1.4)).flat(6).rollers(2, 14, 1.0).flat(6);
      b.ease(12, -2).flat(8);
    }),
  },
  {
    id: 'farm-2', biome: 'farm', name: 'Hay Hop', difficulty: 2, par: 18500,
    challenges: [
      { text: 'Ollie every hay bale', kind: 'everyKicker' },
      { text: 'Land a grab', kind: 'trick', match: 'grab' },
      { text: 'A trick on every hay bale', kind: 'everyKicker', match: 'any' },
    ],
    build: layout(10, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(1, 14, 0.9).flat(4);
      b.sign('HAY BALE: SWIPE UP!').flat(4);
      for (const [h, mud] of [[1.2, 0], [1.3, 6], [1.4, 0], [1.5, 8], [1.5, 0], [1.6, 8]] as const) {
        b.kicker(4, h).flat(2.5).land(24).flat(5);
        if (mud) b.mud(mud).flat(5);
        b.rollers(1, 14, 0.9).flat(5);
      }
      b.ease(12, -2).flat(8);
    }),
  },
  {
    id: 'farm-3', biome: 'farm', name: 'Puddle Pump', difficulty: 3, par: 6500,
    challenges: [
      { text: 'Do 12 good pumps', kind: 'pumps', count: 12 },
      { text: 'Manual for 1 second', kind: 'manual', seconds: 1 },
      { text: 'Score 6,500', kind: 'score', points: 6500 },
    ],
    build: layout(8, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6);
      // Muddy rollers: pump every downslope or the mud wins.
      b.sign('MUDDY ROLLERS: PUMP!').muddy((m) => m.rollers(3, 14, 1.0)).flat(6);
      b.rollers(2, 14, 1.1).flat(4);
      b.sign('TILT: MANUAL').pad(8).flat(6);
      b.muddy((m) => m.rollers(3, 14, 1.1)).flat(6);
      b.kicker(4, 1.3).flat(2.5).land(24).flat(5);
      b.pad(10).flat(4).mud(6).flat(4);
      b.muddy((m) => m.rollers(4, 14, 1.0)).flat(6);
      b.ease(10, -2).kicker(4, 1.4).flat(2.5).land(24).flat(6);
      b.pad(8).flat(8);
    }),
  },
  {
    id: 'farm-4', biome: 'farm', name: 'Fence Line', difficulty: 3, par: 67500,
    challenges: [
      { text: 'Grind a fence rail', kind: 'grind' },
      { text: 'Grind 3 different rails', kind: 'grind', count: 3 },
      { text: 'Grind for 2 seconds', kind: 'grind', seconds: 2 },
    ],
    build: layout(10, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(2, 14, 1.0).flat(4);
      b.sign('GRIND THE FENCE').flat(6).rail(10).flat(8);
      b.mud(6).flat(6).rollers(2, 14, 1.1).flat(6);
      b.flat(6).rail(14).flat(6);
      b.ease(10, -2).flat(4).kicker(4, 1.2).flat(2).land(32).flat(4).rail(20).flat(8);
      b.muddy((m) => m.valley(16, 1.4)).flat(6);
      b.rollers(2, 14, 1.0).flat(6).ledge(8).flat(6);
      b.flat(6).rail(32).flat(8);
      b.mud(8).flat(8);
    }),
  },
  {
    id: 'farm-5', biome: 'farm', name: 'Maize Run', difficulty: 4, par: 22000,
    challenges: [
      { text: 'Clear every ditch', kind: 'gaps' },
      { text: 'A trick over a ditch', kind: 'trick', match: 'any', overGap: true },
      { text: 'A grab over every ditch', kind: 'trick', match: 'grab', overGap: 'every' },
    ],
    // First muddy ditches to jump: pump the rollers after the mud for the speed.
    build: layout(12, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(2, 14, 1.0).flat(4);
      b.sign('DITCH! PUMP FOR SPEED').mud(6).flat(4).rollers(2, 14, 1.1).flat(6);
      b.mud(5).flat(3).rollers(1, 14, 1.0).flat(3).kicker(4, 1.2).pit(3.2, -1.0).land(22).flat(6);
      b.muddy((m) => m.valley(16, 1.4)).flat(4).rollers(2, 14, 1.1).flat(6);
      b.kicker(4, 1.3).pit(3.6, -1.0).land(22).flat(6);
      b.mud(8).flat(4).rollers(3, 14, 1.1).flat(6);
      b.kicker(4, 1.3).pit(3.4, -1.0).land(22).flat(6);
      b.ease(10, -2).flat(6).rail(10).flat(6);
      b.muddy((m) => m.rollers(2, 14, 1.0)).flat(4).rollers(1, 14, 1.0).flat(4);
      b.kicker(4, 1.4).pit(3.6, -1.0).land(24).flat(8);
    }),
  },
  {
    id: 'farm-6', biome: 'farm', name: 'Pumpkin Patch', difficulty: 4, par: 19000,
    challenges: [
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
      { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 },
      { text: 'Spin and grab in the same air', kind: 'sameAir', match: ['spin', 'grab'] },
    ],
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(2, 14, 1.0).flat(4);
      for (let i = 0; i < 4; i++) {
        b.kicker(4, 1.5).flat(2).land(26).flat(3).pad(6).flat(3);
        b.mud(6).flat(4).rollers(2, 14, 1.1).flat(4);
        if (i % 2) b.mud(5).flat(3).rollers(1, 14, 1.0).flat(3).kicker(4, 1.4).pit(4.4, -1.0).land(24).flat(6);
        else b.ease(8, -1.5).flat(4);
      }
      b.kicker(4.5, 1.8).flat(3).land(30).flat(8);
    }),
  },
  {
    id: 'farm-7', biome: 'farm', name: 'Tractor Tracks', difficulty: 5, par: 24000,
    challenges: [
      { text: 'Clear every ditch', kind: 'gaps' },
      { text: 'Grind the fence rail', kind: 'grind' },
      { text: 'One air of 1 second', kind: 'air', seconds: 1 },
    ],
    build: layout(16, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(2, 14, 1.1).flat(4);
      // Long muddy downhill ruts, then trailer ramps over ditches.
      b.sign('TRAILER RAMP').muddy((m) => m.ease(16, -2)).flat(4).rollers(2, 14, 1.1).flat(4);
      b.kicker(4.5, 1.6).pit(4.0, -1.0).land(24).flat(6);
      b.mud(8).flat(4).rollers(3, 14, 1.1).flat(6);
      b.rail(8).flat(4).kicker(4, 1.4).pit(3.8, -1.0).land(22).flat(6);
      b.muddy((m) => m.valley(18, 1.6)).flat(4).rollers(2, 14, 1.2).flat(6);
      b.kicker(4.5, 1.6).pit(4.4, -1.0).land(24).flat(6);
      b.ease(12, -3).flat(4).kicker(5, 2.0).flat(3).land(34).flat(6);
      b.mud(6).flat(4).rollers(2, 14, 1.1).flat(4);
      b.kicker(4.5, 1.6).pit(4.6, -1.0).land(26).flat(8);
    }),
  },
  {
    id: 'farm-8', biome: 'farm', name: 'Harvest Home', difficulty: 5, par: 44500,
    challenges: [
      { text: 'Clear every ditch', kind: 'gaps' },
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    build: layout(18, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(2, 14, 1.1).flat(4);
      b.muddy((m) => m.rollers(2, 14, 1.0)).flat(4).kicker(4, 1.4).flat(2.5).land(24).flat(4);
      b.flat(4).rail(12).flat(6).kicker(4.5, 1.5).pit(4.0, -1.0).land(24).flat(6);
      b.pad(8).flat(4).mud(8).flat(4).rollers(3, 14, 1.1).flat(6);
      b.kicker(4.5, 1.6).pit(4.6, -1.0).land(24).flat(6);
      b.muddy((m) => m.valley(18, 1.6)).flat(4).rollers(2, 14, 1.2).flat(4);
      b.ledge(8).flat(4).kicker(4, 1.4).flat(2.5).land(24).flat(6);
      b.ease(10, -2).flat(4).kicker(4.5, 1.6).pit(5.0, -1.0).land(26).flat(6);
      b.mud(6).flat(4).rollers(2, 14, 1.1).flat(4);
      b.sign('HARVEST HOME!').kicker(5, 2.0).flat(3).land(34).flat(8);
    }),
  },
  {
    id: 'farm-pipe', biome: 'farm', name: 'Barn Halfpipe', kind: 'pipe', par: 22000,
    challenges: [
      { text: 'Land a grab', kind: 'trick', match: 'grab' },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
      { text: 'Score 22,000', kind: 'score', points: 22000 },
    ],
    build: pipe(4.5, 5),
  },
];
