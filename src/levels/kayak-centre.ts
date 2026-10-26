import { TrackDef, layout, wave } from './common';

// Whitewater Centre: the kayak's first biome. A man-made course of concrete channels, like
// the ones built for slalom racing, with pumps sending water down past fake rocks: gentle wave
// trains to learn paddling on, little weirs to drop off, holes to play in and rocks to splat.
// Every river runs downhill (descend), and wave trains are pumped like rollers: a tap is a
// paddle stroke, best timed going down the face of a wave.

export const KAYAK_CENTRE: TrackDef[] = [
  {
    id: 'kayak-centre-1', biome: 'kayak-centre', name: 'First Strokes', difficulty: 1, par: 3500, tutorial: true,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Do 6 good strokes', kind: 'pumps', count: 6 },
      { text: 'Splat the rock', kind: 'trick', match: 'Splat' },
    ],
    // Out of the start pool and down the channel: wave trains, a little weir and a rock to splat.
    build: layout(30, 5, (b) => {
      b.flat(8).sign('TAP TO PADDLE').descend(14, 0.04);
      b.sign('TAP DOWN EACH WAVE').whoops(3, 12, 0.6, 0.04).descend(10, 0.05);
      b.sign('LITTLE WEIR').dropoff(0.6, 14).descend(12, 0.04);
      b.whoops(3, 12, 0.6, 0.04).descend(8, 0.04);
      b.sign('TAP AT THE ROCK: SPLAT').descend(6, 0.03).splat().descend(14, 0.04);
      b.whoops(4, 12, 0.6, 0.05).descend(16, 0.03);
    }),
  },
  {
    id: 'kayak-centre-2', biome: 'kayak-centre', name: 'Wave Train', difficulty: 1, par: 2500,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Do 10 good strokes', kind: 'pumps', count: 10 },
      { text: 'Stern stall for 1 second', kind: 'manual', name: 'Stern Stall', seconds: 1 },
    ],
    // Long trains of waves to stroke down, with flat pools between to stall in.
    build: layout(32, 5, (b) => {
      b.flat(8).sign('TAP DOWN EACH WAVE').descend(10, 0.04);
      b.whoops(5, 12, 0.7, 0.04).descend(10, 0.03);
      b.sign('POOL: TILT BACK TO STERN STALL').descend(18, 0.0, 6).descend(8, 0.04);
      b.whoops(5, 12, 0.75, 0.05).descend(8, 0.03).splat().descend(10, 0.03);
      b.sign('TILT FORWARD: BOW STALL').descend(16, 0.0, 6).descend(8, 0.04);
      b.whoops(4, 12, 0.8, 0.05).descend(14, 0.03);
    }),
  },
  {
    id: 'kayak-centre-3', biome: 'kayak-centre', name: 'Weir Drops', difficulty: 2, par: 12500,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Boof off a weir', kind: 'trick', match: 'Boof', from: 'dropoff' },
      { text: 'Air for 0.8 seconds', kind: 'air', seconds: 0.8 },
    ],
    // Three weirs, each a little higher: swipe up at the lip to boof off it.
    build: layout(34, 5, (b) => {
      b.flat(8).descend(12, 0.04).whoops(3, 12, 0.6, 0.04).descend(8, 0.03);
      b.sign('SWIPE UP AT THE LIP: BOOF').flat(4).dropoff(0.8, 18).descend(12, 0.04);
      b.whoops(3, 12, 0.7, 0.05).descend(8, 0.03).flat(4).dropoff(1.0, 20).descend(12, 0.04);
      b.whoops(3, 12, 0.7, 0.05).descend(6, 0.03).sign('BIG ONE: BOOF IT!').flat(4).dropoff(1.3, 22).descend(16, 0.03);
    }),
  },
  {
    id: 'kayak-centre-4', biome: 'kayak-centre', name: 'Play Hole', difficulty: 2, par: 8000,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Do an end move in a hole', kind: 'trick', match: 'end' },
      { text: 'Cartwheel in a hole', kind: 'trick', match: 'Cartwheel' },
    ],
    // Holes below the weirs: swipe and hold on the left as you go through to throw end moves.
    build: layout(34, 5, (b) => {
      b.flat(8).descend(12, 0.04).whoops(3, 12, 0.6, 0.04).descend(6, 0.03);
      b.sign('HOLE: SWIPE UP ON THE LEFT AND HOLD').flat(3).hole().descend(14, 0.04);
      b.whoops(3, 12, 0.7, 0.05).descend(6, 0.03).flat(4).dropoff(0.8, 18).descend(4, 0.03).hole().descend(12, 0.04);
      b.whoops(3, 12, 0.7, 0.05).sign('HOLD DOWN: BLUNT').descend(6, 0.03).hole().descend(10, 0.04);
      b.splat().descend(8, 0.03).whoops(3, 12, 0.7, 0.05).descend(14, 0.03);
    }),
  },
  {
    id: 'kayak-centre-5', biome: 'kayak-centre', name: 'Slalom Gates', difficulty: 3, par: 16500,
    challenges: [
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Splat 2 rocks', kind: 'trick', match: 'Splat', count: 2 },
      { text: 'Land a Pan-Am', kind: 'trick', match: 'Pan-Am' },
    ],
    // The slalom course: rocks to splat between the gates, weirs to boof and a hole at the end.
    build: layout(36, 5, (b) => {
      b.flat(8).descend(12, 0.05).whoops(3, 12, 0.7, 0.05).descend(6, 0.03).splat().descend(10, 0.04);
      b.flat(4).dropoff(1.0, 20).descend(8, 0.04).whoops(3, 12, 0.75, 0.05).descend(6, 0.03);
      b.sign('SWIPE DOWN IN THE AIR: PAN-AM').flat(4).dropoff(1.3, 22).descend(8, 0.04).splat().descend(10, 0.04);
      b.whoops(4, 12, 0.75, 0.05).descend(6, 0.03).hole().descend(10, 0.04).splat().descend(14, 0.03);
    }),
  },
  {
    id: 'kayak-centre-6', biome: 'kayak-centre', name: 'Sticky Hole', difficulty: 3, par: 9000,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Do 3 end moves', kind: 'trick', match: 'end', count: 3 },
    ],
    // Foamy sticky holes hold a slow boat: stroke hard down the waves before them to punch through.
    build: layout(36, 5, (b) => {
      b.flat(8).descend(12, 0.05).whoops(3, 12, 0.7, 0.05).descend(6, 0.03).hole().descend(12, 0.04);
      b.sign('STICKY HOLE: GO FAST!').whoops(4, 12, 0.8, 0.06).descend(4, 0.03).hole(9, 0.4, true).descend(12, 0.04);
      b.whoops(3, 12, 0.75, 0.05).descend(6, 0.03).flat(4).dropoff(1.0, 20).descend(6, 0.03).hole().descend(12, 0.04);
      b.whoops(4, 12, 0.8, 0.06).descend(4, 0.03).hole(9, 0.4, true).descend(10, 0.04).splat().descend(14, 0.03);
    }),
  },
  {
    id: 'kayak-centre-7', biome: 'kayak-centre', name: 'Boof Line', difficulty: 3, par: 13500,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Air trick off a weir', kind: 'trick', match: 'kayak', from: 'dropoff' },
      { text: 'Land a helix', kind: 'trick', match: 'Helix' },
    ],
    // Weir after weir: boof each one and throw the boat about in the air.
    build: layout(40, 5, (b) => {
      b.flat(8).descend(12, 0.05).whoops(3, 12, 0.7, 0.05).descend(6, 0.03);
      b.sign('BOOF, THEN SWIPE LEFT: AIRSCREW').flat(4).dropoff(1.2, 22).descend(8, 0.04).whoops(2, 12, 0.7, 0.05);
      b.flat(4).dropoff(1.3, 22).descend(8, 0.04).whoops(2, 12, 0.7, 0.05);
      b.sign('SWIPE RIGHT: HELIX').flat(4).dropoff(1.5, 24).descend(8, 0.04).whoops(2, 12, 0.7, 0.05);
      b.flat(4).dropoff(1.4, 24).descend(8, 0.04).hole().descend(14, 0.03);
    }),
  },
  {
    id: 'kayak-centre-8', biome: 'kayak-centre', name: 'Big Weir', difficulty: 4, par: 13500,
    challenges: [
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Air for 1.1 seconds', kind: 'air', seconds: 1.1 },
      { text: 'Loop off the big weir', kind: 'trick', match: 'bodyflip' },
    ],
    // Down to the biggest weir on the course: boof it and tilt to loop the boat.
    build: layout(42, 5, (b) => {
      b.flat(8).descend(12, 0.05).whoops(4, 12, 0.75, 0.05).descend(6, 0.03);
      b.flat(4).dropoff(1.2, 22).descend(8, 0.04).hole().descend(10, 0.04).whoops(3, 12, 0.8, 0.06).descend(6, 0.03);
      b.sign('BIG WEIR: BOOF AND TILT TO LOOP').flat(5).dropoff(2.2, 30).descend(10, 0.04);
      b.whoops(3, 12, 0.8, 0.06).descend(4, 0.03).hole(9, 0.4, true).descend(10, 0.04).splat().descend(14, 0.03);
    }),
  },
  {
    id: 'kayak-centre-9', biome: 'kayak-centre', name: 'Spin Pools', difficulty: 4, par: 22000,
    challenges: [
      { text: 'Flatspin on the water', kind: 'trick', match: 'Flatspin 180' },
      { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
    ],
    // Calm pools between the drops: swipe along the bottom to spin the boat flat on the water.
    build: layout(42, 5, (b) => {
      b.flat(8).descend(10, 0.05).whoops(3, 12, 0.75, 0.05).descend(4, 0.03);
      b.sign('POOL: SWIPE ALONG THE BOTTOM TO FLATSPIN').descend(20, 0.0, 6).descend(6, 0.04);
      b.flat(4).dropoff(1.3, 22).descend(6, 0.04).hole().descend(8, 0.04).whoops(3, 12, 0.8, 0.06);
      b.descend(20, 0.0, 6).descend(6, 0.04).flat(4).dropoff(1.5, 24).descend(8, 0.04).splat().descend(8, 0.04);
      b.whoops(3, 12, 0.8, 0.06).descend(4, 0.03).hole().descend(10, 0.04).descend(18, 0.0, 6).descend(10, 0.03);
    }),
  },
  {
    id: 'kayak-centre-10', biome: 'kayak-centre', name: 'Grand Final', difficulty: 5, par: 23500,
    challenges: [
      { text: 'Finish without a swim', kind: 'noLives' },
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
      { text: 'McNasty in a hole', kind: 'trick', match: 'McNasty' },
    ],
    // The whole course, top to bottom: every wave, weir and hole.
    build: layout(48, 5, (b) => {
      b.flat(8).sign('THE WHOLE COURSE!').descend(12, 0.05).whoops(4, 12, 0.8, 0.06).descend(6, 0.03);
      b.flat(4).dropoff(1.3, 22).descend(4, 0.03).hole().descend(10, 0.04).splat().descend(8, 0.04);
      b.whoops(4, 12, 0.8, 0.06).descend(4, 0.03).hole(9, 0.4, true).descend(10, 0.04);
      b.sign('HOLD LEFT: MCNASTY').flat(4).dropoff(1.6, 26).descend(4, 0.03).hole().descend(10, 0.04);
      b.whoops(3, 12, 0.8, 0.06).descend(6, 0.03).flat(5).dropoff(2.0, 28).descend(8, 0.04).splat().descend(6, 0.04);
      b.whoops(3, 12, 0.8, 0.06).descend(4, 0.03).hole().descend(16, 0.03);
    }),
  },
];

/** The standing wave at the bottom of the course, surfed in a playboat. */
export const KAYAK_CENTRE_WAVE: TrackDef = {
  id: 'kayak-centre-wave', biome: 'kayak-centre', name: 'The Centre Wave', kind: 'pipe', par: 8000,
  challenges: [
    { text: 'Score 5,000', kind: 'score', points: 5000 },
    { text: 'Cartwheel for 1 second', kind: 'trick', match: 'Cartwheel', minTime: 1 },
    { text: 'Air 1 m off the wave', kind: 'air', metres: 1 },
  ],
  build: wave(1.1, 3),
};
