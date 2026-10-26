import { TrackDef, layout } from './common';

// Hillside Town: the downhill bike's first biome. An urban downhill race through a town of
// painted houses stacked up the hill: down flights of steps, off walls, along handrails and
// ledges (ridden as skinnies), and over the alleys between the houses. Every course falls all
// the way, steeper and gentler by turns (descend), so the bike is always rolling.

export const DH_URBAN: TrackDef[] = [
  {
    id: 'dh-urban-1', biome: 'dh-urban', name: 'Steep Street', difficulty: 2, par: 7500,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Do 8 good pumps', kind: 'pumps', count: 8 },
      { text: 'Land a whip', kind: 'trick', match: 'Whip' },
    ],
    // Down the main street: a few whoops to pump, a kerb drop and two little kickers.
    build: layout(40, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.1).descend(10, 0.05);
      b.sign('PUMP THE BUMPS').whoops(3, 12, 0.8, 0.06).descend(10, 0.06);
      b.sign('KERB DROP').dropoff(0.6, 15).descend(14, 0.08);
      b.kicker(5, 1.0, 1.8).flat(2).land(41).descend(12, 0.1);
      b.whoops(3, 12, 0.8, 0.07).descend(12, 0.06);
      b.sign('SWIPE LEFT IN THE AIR: WHIP').kicker(5, 1.0, 1.8).flat(2).land(41).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-urban-2', biome: 'dh-urban', name: 'Down the Steps', difficulty: 2, par: 4500,
    challenges: [
      { text: 'Finish without losing a life', kind: 'noLives' },
      { text: 'Do 10 good pumps', kind: 'pumps', count: 10 },
      { text: 'Land a tabletop', kind: 'trick', match: 'Tabletop' },
    ],
    // Flights of steps between the streets: just let the bike roll down them.
    build: layout(44, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(18, 0.12);
      b.sign('STEPS: LET IT ROLL').flat(4).stairs(5, 0.17, 0.32, false).descend(12, 0.05);
      b.whoops(3, 12, 0.8, 0.06).descend(10, 0.05);
      b.flat(3).stairs(7, 0.17, 0.32, false).descend(14, 0.06);
      b.sign('SWIPE RIGHT IN THE AIR: TABLETOP').kicker(5, 1.0, 1.8).flat(2).land(41).descend(10, 0.1);
      b.whoops(2, 12, 0.8, 0.07).flat(3).stairs(6, 0.17, 0.32, false).descend(12, 0.1).descend(10, 0.05);
    }),
  },
  {
    id: 'dh-urban-3', biome: 'dh-urban', name: 'Wall Drops', difficulty: 3, par: 3000,
    challenges: [
      { text: 'Finish the run', kind: 'finish' },
      { text: 'Air for 0.8 seconds', kind: 'air', seconds: 0.8 },
      { text: 'A turndown off a drop', kind: 'trick', match: 'Turndown', from: 'dropoff' },
    ],
    // Off the garden walls from one street down to the next.
    build: layout(46, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.08);
      b.sign('WALL DROP: KEEP ROLLING').flat(3).dropoff(0.8, 18).descend(12, 0.06);
      b.whoops(2, 12, 0.8, 0.06).flat(3).dropoff(1.1, 20).descend(12, 0.07);
      b.kicker(5, 0.7, 1.6).flat(2).land(32).descend(10, 0.06);
      b.whoops(2, 12, 0.8, 0.06).flat(3).sign('BIG WALL').dropoff(1.4, 22).descend(12, 0.06);
      b.whoops(3, 12, 0.8, 0.07).flat(3).dropoff(1.0, 24).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-urban-4', biome: 'dh-urban', name: 'Handrail Alley', difficulty: 3, par: 12000,
    challenges: [
      { text: 'Ride 2 skinnies', kind: 'grind', count: 2 },
      { text: 'Do 8 good pumps', kind: 'pumps', count: 8 },
      { text: 'Stoppie for 1 second', kind: 'manual', name: 'Stoppie', seconds: 1 },
    ],
    // Hop onto the handrails and wall tops and ride them down like skinnies.
    build: layout(46, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(14, 0.08).descend(8, 0.03);
      b.sign('HOP ON THE HANDRAIL').flat(6).stairs(7).flat(8);
      b.whoops(3, 12, 0.8, 0.08).descend(8, 0.02);
      b.sign('WALL TOP').flat(6).ledge(10).flat(6).descend(10, 0.06);
      b.sign('FLAT: TILT FORWARD TO STOPPIE').descend(16, 0.0, 6).descend(10, 0.06);
      b.whoops(3, 12, 0.8, 0.08).descend(8, 0.02).flat(6).stairs(8).flat(8).descend(14, 0.12).descend(10, 0.05);
    }),
  },
  {
    id: 'dh-urban-5', biome: 'dh-urban', name: 'Alley Gaps', difficulty: 4, par: 11000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'A whip over a gap', kind: 'trick', match: 'Whip', overGap: true },
      { text: 'Land 4 different tricks', kind: 'variety', count: 4 },
    ],
    // Jump the alleys between the houses: pump in for speed.
    build: layout(48, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.1).descend(8, 0.04);
      b.whoops(2, 12, 0.8, 0.06).flat(3).sign('ALLEY GAP!').kicker(4.5, 1.0).pit(4.5, -0.6).land(36).descend(12, 0.06);
      b.whoops(3, 12, 0.8, 0.06).flat(3).kicker(4.5, 1.0).pit(5, -0.6).land(36).descend(12, 0.06);
      b.dropoff(1.0, 20).descend(10, 0.06);
      b.whoops(3, 12, 0.8, 0.06).flat(3).kicker(4.5, 1.0).pit(5.5, -0.8).land(36).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-urban-6', biome: 'dh-urban', name: 'Market Steps', difficulty: 4, par: 15500,
    challenges: [
      { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 },
      { text: 'Superman and whip in the same air', kind: 'sameAir', match: ['Superman', 'Whip'] },
      { text: 'Ride a handrail', kind: 'grind', count: 1 },
    ],
    // Through the market: kickers between the stalls for tricks, steps down to the square.
    build: layout(48, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.1).descend(8, 0.04);
      b.sign('TRICK JUMPS').kicker(5, 1.0, 1.8).flat(2).land(36).descend(8, 0.05);
      b.kicker(5, 1.0, 1.8).flat(2).land(36).descend(8, 0.05);
      b.flat(6).stairs(8).flat(8).descend(10, 0.05);
      b.whoops(2, 12, 0.8, 0.06).flat(3).kicker(5, 1.1, 1.8).flat(2).land(38).descend(8, 0.05);
      b.dropoff(1.0, 20).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-urban-7', biome: 'dh-urban', name: 'Rooftop Line', difficulty: 5, par: 10500,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Finish without losing a life', kind: 'noLives' },
      { text: 'A no hander over a gap', kind: 'trick', match: 'No Hander', overGap: true },
    ],
    // Over the rooftops: drop from roof to roof and jump the streets between them.
    build: layout(52, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(14, 0.12).descend(8, 0.03);
      b.sign('ROOF TO ROOF').flat(3).dropoff(1.2, 20).descend(6, 0.03);
      b.whoops(2, 12, 0.8, 0.05).flat(3).kicker(4.5, 1.0).pit(5.5, -0.8).land(34).descend(10, 0.05);
      b.flat(3).dropoff(1.4, 22).descend(6, 0.03);
      b.whoops(2, 12, 0.8, 0.05).flat(3).kicker(4.5, 1.0).pit(6, -1.0).land(34).descend(10, 0.05);
      b.whoops(2, 12, 0.8, 0.06).flat(3).kicker(4.5, 1.0).pit(6, -1.0).land(34).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-urban-8', biome: 'dh-urban', name: 'Night Race', difficulty: 5, par: 20000,
    challenges: [
      { text: 'Do 10 good pumps', kind: 'pumps', count: 10 },
      { text: 'Land a tabletop over a gap', kind: 'trick', match: 'Tabletop', overGap: true },
      { text: 'Ride 3 skinnies', kind: 'grind', count: 3 },
    ],
    // Under the street lamps: steps, rails, a gap and a long pump section at the bottom.
    build: layout(52, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(16, 0.12).whoops(2, 12, 0.8, 0.06).descend(8, 0.02);
      b.flat(6).stairs(7).flat(8).descend(8, 0.04);
      b.whoops(2, 12, 0.8, 0.05).flat(3).kicker(4.5, 1.0).pit(5, -0.6).land(32).descend(8, 0.02);
      b.flat(6).ledge(10).flat(6).descend(8, 0.04).flat(6).stairs(8).flat(8);
      b.sign('PUMP!').whoops(6, 12, 0.9, 0.06).descend(16, 0.05);
    }),
  },
  {
    id: 'dh-urban-9', biome: 'dh-urban', name: 'Harbour Plunge', difficulty: 5, par: 9000,
    challenges: [
      { text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 },
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Land a backflip', kind: 'trick', match: 'Backflip' },
    ],
    // The steepest streets in town, all the way down to the harbour: big drops and a big jump.
    build: layout(60, 5, (b) => {
      b.flat(8).sign('DROP IN').descend(20, 0.16).descend(8, 0.05);
      b.flat(3).dropoff(1.6, 25).descend(14, 0.12).descend(8, 0.03);
      b.whoops(2, 12, 0.8, 0.06).flat(3).kicker(5, 1.1).pit(6, -1.0).land(36).descend(12, 0.1).descend(6, 0.03);
      b.sign('BIG JUMP: TILT BACK TO BACKFLIP').flat(3).kicker(7, 2.0, 2.0).flat(3).land(52).descend(12, 0.06);
      b.flat(3).dropoff(1.4, 22).descend(18, 0.04);
    }),
  },
  {
    id: 'dh-urban-10', biome: 'dh-urban', name: 'Town Downhill', difficulty: 5, par: 23000,
    challenges: [
      { text: 'Clear every gap', kind: 'gaps' },
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
      { text: 'Land 5 different tricks', kind: 'variety', count: 5 },
    ],
    // The whole town, top to bottom: steps, walls, rails, alleys and the harbour jump.
    build: layout(64, 5, (b) => {
      b.flat(8).sign('THE TOWN DOWNHILL').descend(18, 0.12).descend(8, 0.03);
      b.flat(6).stairs(7).flat(8).descend(8, 0.05);
      b.flat(3).dropoff(1.2, 20).descend(8, 0.04);
      b.whoops(2, 12, 0.8, 0.06).flat(3).kicker(4.5, 1.0).pit(5.5, -0.8).land(34).descend(10, 0.06);
      b.kicker(5, 1.0, 1.8).flat(2).land(36).descend(8, 0.04);
      b.flat(6).ledge(10).flat(6).descend(8, 0.05);
      b.whoops(2, 12, 0.8, 0.06).flat(3).kicker(4.5, 1.0).pit(6, -1.0).land(34).descend(12, 0.1);
      b.flat(3).dropoff(1.4, 22).descend(10, 0.05).sign('THE HARBOUR JUMP').kicker(6, 1.6, 2.0).flat(3).land(46).descend(16, 0.04);
    }),
  },
];
