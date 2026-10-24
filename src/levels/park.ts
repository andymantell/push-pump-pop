import { TrackBuilder } from '../track';
import { TrackDef, layout, pipe } from './common';

// Sunny Park: learn every move, one per track. No gaps until track 7, and nothing in the
// first six tracks can cost a life if you only pump.

/** A small jump: kicker, a short flat top, and a long easy roll back down. */
function hop(b: TrackBuilder, h: number, len = 4) {
  return b.kicker(len, h).flat(2).ease(6 + 3 * h, -h);
}

export const PARK: TrackDef[] = [
  {
    id: 'park-1', biome: 'park', name: 'First Pump', tutorial: true, difficulty: 1, par: 1000,
    challenges: [
      { text: 'Finish the track', kind: 'finish' },
      { text: 'Do 3 good pumps', kind: 'pumps', count: 3 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
    build: layout(6, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6);
      // Pump rollers: tap on the way down each bump.
      b.sign('TAP TO PUMP').rollers(3, 14, 1.0).flat(8);
      b.sign('TAP ON THE WAY DOWN').rollers(3, 14, 1.1).flat(8);
      b.rollers(2, 14, 1.0).flat(6);
      b.ease(14, -3).flat(10);
    }),
  },
  {
    id: 'park-2', biome: 'park', name: 'Little Ollies', difficulty: 1, par: 6500,
    challenges: [
      { text: 'Land an ollie', kind: 'trick', match: 'Ollie' },
      { text: 'Ollie all 3 kickers', kind: 'everyKicker' },
      { text: 'Score 6,500', kind: 'score', points: 6500 },
    ],
    build: layout(6, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(2, 14, 0.9).flat(6);
      b.sign('SWIPE UP: OLLIE').flat(6);
      hop(b, 1.0).flat(8).rollers(2, 14, 0.9).flat(6);
      b.sign('SWIPE UP!');
      hop(b, 1.1).flat(8).rollers(2, 14, 1.0).flat(6);
      hop(b, 1.2).flat(8);
      b.ease(12, -2).flat(10);
    }),
  },
  {
    id: 'park-3', biome: 'park', name: 'Flip Out', difficulty: 2, par: 16000,
    challenges: [
      { text: 'Land a kickflip', kind: 'trick', match: 'Kickflip' },
      { text: 'Land a heelflip and a shove-it', kind: 'allOf', names: ['Heelflip', 'Pop Shove-it'] },
      { text: 'Land all three flips in one run', kind: 'allOf', names: ['Kickflip', 'Heelflip', 'Pop Shove-it'] },
    ],
    build: layout(8, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(1, 14, 0.9).flat(4);
      for (const [sign, h] of [['SWIPE LEFT: KICKFLIP', 1.3], ['SWIPE RIGHT: HEELFLIP', 1.4], ['SWIPE DOWN: SHOVE-IT', 1.5]] as const) {
        b.sign(sign).flat(6);
        hop(b, h).flat(6).rollers(1, 14, 0.9).flat(4);
      }
      b.sign('ANY FLIP!').flat(4);
      hop(b, 1.4).flat(4).rollers(1, 14, 0.9).flat(4);
      hop(b, 1.5).flat(4).rollers(1, 14, 0.9).flat(4);
      hop(b, 1.6, 4.5).flat(6);
      b.ease(12, -2).flat(10);
    }),
  },
  {
    id: 'park-4', biome: 'park', name: 'Grab Bag', difficulty: 2, par: 19500,
    challenges: [
      { text: 'Land a grab', kind: 'trick', match: 'grab' },
      { text: 'Hold a grab for 1 second', kind: 'trick', match: 'grab', minTime: 1 },
      { text: 'Land all four grabs', kind: 'allOf', names: ['Indy', 'Melon', 'Nosegrab', 'Tailgrab'] },
    ],
    build: layout(18, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(1, 14, 0.9).flat(4);
      b.sign('SWIPE AND HOLD ON THE LEFT: GRAB').flat(6);
      // Big kickers onto long downhill landings: long airs, so holding a grab is easy.
      for (const h of [1.6, 1.7, 1.8, 1.8, 1.9]) {
        b.kicker(5, h).flat(1.5).ease(14, -h - 1.4).flat(6).rollers(1, 14, 0.9).flat(5);
      }
      b.sign('LET GO BEFORE YOU LAND!').flat(4);
      b.kicker(5, 1.9).flat(1.5).ease(14, -3.3).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'park-5', biome: 'park', name: 'Spin Cycle', difficulty: 2, par: 18500,
    challenges: [
      { text: 'Land a 180', kind: 'trick', match: '180' },
      { text: 'Land a 360', kind: 'trick', match: '360' },
      { text: 'Grab and spin in the same air', kind: 'sameAir', match: ['grab', 'spin'] },
    ],
    build: layout(26, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6);
      b.sign('SWIPE ALONG THE BOTTOM: SPIN').flat(6);
      // Each kicker comes off a little drop-in, for a big air to spin in.
      for (const h of [1.5, 1.6, 1.7, 1.7, 1.8, 1.8]) {
        b.ease(8, -1.5).flat(3).kicker(5, h).flat(1.5).ease(14, -h - 1.2).flat(6).rollers(1, 14, 0.9).flat(4);
      }
      b.sign('BIG AIR: SWIPE FURTHER FOR 360').ease(12, -3).flat(3);
      b.kicker(5.5, 2.1).spot('bigair').flat(1.5).ease(16, -4.5).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    id: 'park-6', biome: 'park', name: 'Wheelie Way', difficulty: 3, par: 13000,
    challenges: [
      { text: 'Manual for 1 second', kind: 'manual', seconds: 1 },
      { text: 'Nose manual for 1 second', kind: 'manual', seconds: 1, name: 'Nose Manual' },
      { text: 'Manual a whole pad', kind: 'manual', pad: true },
    ],
    build: layout(10, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(1, 14, 0.9).flat(4);
      b.sign('TILT: MANUAL').flat(10).pad(8).flat(6).rollers(1, 14, 0.9).flat(4);
      b.sign('TILT THE OTHER WAY: NOSE MANUAL').flat(10).pad(8).flat(6).rollers(1, 14, 1.0).flat(4);
      hop(b, 1.4).flat(8);
      b.pad(10).flat(6).rollers(2, 14, 1.0).flat(4);
      hop(b, 1.5).flat(8);
      hop(b, 1.6).flat(6).rollers(1, 14, 1.0).flat(4);
      b.pad(9, 0.4).flat(6).rollers(1, 14, 1.0).flat(6);
      b.ease(12, -2).flat(10);
    }),
  },
  {
    id: 'park-7', biome: 'park', name: 'Mind the Gap', difficulty: 3, par: 15000,
    challenges: [
      { text: 'Clear a gap', kind: 'gaps', count: 1 },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Kickflip over a gap', kind: 'trick', match: 'Kickflip', overGap: true },
    ],
    build: layout(12, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(1, 14, 0.9).flat(4);
      // Small gaps after long flat run-ups, landing well below the lip.
      for (const len of [2, 2.3, 2.5]) {
        b.sign('GAP! SWIPE UP').flat(16).kicker(4, 1.0).pit(len, -1.0).ease(8, -1.0).flat(8);
        b.rollers(2, 14, 1.0).flat(6);
      }
      hop(b, 1.4).flat(6);
      b.ease(12, -2).flat(10);
    }),
  },
  {
    id: 'park-8', biome: 'park', name: 'Rail Ride', difficulty: 3, par: 25000,
    challenges: [
      { text: 'Grind a rail', kind: 'grind' },
      { text: 'Grind both flat rails', kind: 'grind', rails: [0, 1] },
      { text: 'Grind the rail after the kicker', kind: 'grind', rails: [2] },
    ],
    build: layout(10, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(1, 14, 0.9).flat(4);
      b.sign('OLLIE ON: GRIND').flat(12).rail(10, 0.5).flat(10);
      b.rollers(2, 14, 1.0).flat(6);
      b.sign('SWIPE ON A RAIL: NEW GRIND').flat(12).rail(12, 0.5).flat(10);
      b.rollers(2, 14, 1.0).flat(6);
      hop(b, 1.4).flat(6).rollers(1, 14, 1.0).flat(6);
      // Fly off the kicker and come down on the rail.
      b.sign('KICKER TO RAIL').flat(8).kicker(4, 0.9).flat(2).rail(12, 0.6).flat(8);
      b.rollers(2, 14, 1.0).flat(6);
      hop(b, 1.5).flat(6);
      b.ease(12, -2).flat(10);
    }),
  },
  {
    id: 'park-9', biome: 'park', name: 'Combo Park', difficulty: 4, par: 29500,
    challenges: [
      { text: 'Land a 2-trick combo', kind: 'combo', tricks: 2 },
      { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 },
      { text: 'Combo worth 3,000', kind: 'combo', points: 3000 },
    ],
    build: layout(14, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6).rollers(1, 14, 0.9).flat(4);
      b.sign('LINK IT! TRICK, MANUAL, TRICK').flat(8);
      // Each set: kicker, manual pad, kicker, close enough that one combo carries through.
      for (const h of [1.4, 1.5, 1.6]) {
        hop(b, h).flat(3).pad(7).flat(3);
        hop(b, h + 0.1).flat(8).rollers(2, 14, 1.0).flat(6);
      }
      b.ease(8, -1.5).flat(3).kicker(5, 1.8).flat(1.5).ease(14, -3).flat(8);
      b.ease(10, -1.5).flat(10);
    }),
  },
  {
    // Was First Pump: the original park layout, now the park's finale with real gaps.
    id: 'park-10', biome: 'park', name: 'Big Air Sunday', difficulty: 4, par: 41500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Indy on the big air', kind: 'trick', match: 'Indy', from: 'bigair' },
      { text: 'Score 41,500', kind: 'score', points: 41500 },
    ],
    build: layout(4, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(8);
      b.rollers(3, 13, 0.98).flat(5);
      b.kicker(4, 1.3).flat(5).ease(5, -1.3).flat(6);
      b.rollers(2, 12, 1.26).flat(4);
      b.sign('GAP!').flat(6).kicker(4, 1.4).pit(3, -1.4).ease(8, -0.8).flat(6);
      b.rollers(2, 12, 0.84).ease(10, -2).rollers(2, 14, 1.12).flat(4);
      b.sign('GAP!').flat(6).kicker(4.5, 1.6).pit(3.5, -1.6).ease(8, -0.8).flat(6);
      b.rollers(2, 12, 0.98).kicker(4, 1.8).flat(3).ease(3, 0.8).flat(6).rollers(2, 12, 0.7).flat(3);
      b.sign('DROP').drop(-0.3).ease(7, -2.3).flat(6);
      b.kicker(3.5, 1.2).flat(3.5).ease(4, -1.2).flat(3);
      b.sign('OLLIE ON: GRIND').flat(6).rail(8, 0.5).flat(6);
      b.sign('BIG GAP!').flat(3).ease(10, -2.5).flat(4).kicker(5, 1.7).pit(4, -1.7).ease(8, -0.8).flat(6);
      b.rollers(3, 12, 1.05).flat(5);
      b.sign('STAIRS').flat(5).stairs(5).flat(8);
      b.sign('BIG AIR').ease(14, -5).flat(3).kicker(5, 1.9, 2.3).spot('bigair').drop(-0.4).ease(4, 0.2).ease(12, -4.2).flat(8);
    }),
  },
  {
    id: 'park-pipe', biome: 'park', name: 'Sunny Halfpipe', kind: 'pipe', par: 22000,
    challenges: [
      { text: 'Air of 1.5 metres', kind: 'air', metres: 1.5 },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
      { text: 'Score 22,000', kind: 'score', points: 22000 },
    ],
    build: pipe(4.5, 5),
  },
];
