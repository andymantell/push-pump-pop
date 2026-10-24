import { Track, TrackBuilder, PropKind } from './track';

// Level 1: "Sunny Park". A drop-in, then sections that teach pumping,
// tabletops for first tricks, a gap, a step-up and a big finale jump.
export function buildLevel1(): Track {
  const b = new TrackBuilder(4);

  b.flat(8);
  const startX = 5;
  b.sign('DROP IN').ease(10, -4);
  b.flat(8);

  // Pump rollers: tap on the way down each bump.
  b.sign('TAP TO PUMP').rollers(4, 6, 0.7).flat(5);

  // Tabletop: swipe up to ollie off the lip.
  b.sign('SWIPE UP: OLLIE').kicker(4, 1.3).flat(5).ease(5, -1.3).flat(6);

  b.rollers(3, 5.5, 0.9).flat(4);

  // Second tabletop: kickflip.
  b.sign('SWIPE LEFT: KICKFLIP').kicker(4.5, 1.6).flat(4).ease(6, -1.6).flat(6);

  // Downhill rollers to build speed.
  b.rollers(2, 5, 0.6).ease(10, -2).rollers(3, 5, 0.8).flat(4);

  // Gap over a dip.
  b.sign('GAP').kicker(4, 1.5).drop(-1.0).valley(7, 1.2).ease(4, 1.0).ease(6, -1.5).flat(6);

  // Step up onto a higher deck, roll along, drop back down.
  b.rollers(2, 5, 0.7).kicker(4, 1.8).flat(3).ease(3, 0.8).flat(6).rollers(2, 4.5, 0.5).flat(3);
  b.sign('DROP').drop(-0.3).ease(7, -2.3).flat(6);

  // Double tabletops.
  b.kicker(3.5, 1.2).flat(3.5).ease(4, -1.2).flat(3);
  b.kicker(3.5, 1.4).flat(3).ease(5, -1.4).flat(5);

  // Rhythm section.
  b.rollers(5, 4.5, 0.75).flat(5);

  // Finale: long drop then a huge kicker onto a long downhill landing.
  b.sign('BIG AIR').ease(14, -5).flat(3).kicker(5, 1.9, 2.3).drop(-0.4).ease(4, 0.2).ease(12, -4.2).flat(8);

  const finishX = b.x;
  b.sign('FINISH').flat(40);

  scatterProps(b, finishX + 30);
  return b.build(startX, finishX);
}

/** Deterministic background dressing so the level looks the same every run. */
function scatterProps(b: TrackBuilder, length: number) {
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const props = b.props;
  const back: PropKind[] = ['tree', 'tree', 'bush', 'rock', 'pine', 'bush', 'pine'];
  for (let x = -10; x < length; x += 3 + rnd() * 4) {
    const kind = back[Math.floor(rnd() * back.length)];
    props.push({ kind, x, z: -6 - rnd() * 22, scale: 0.8 + rnd() * 0.6, rot: rnd() * Math.PI * 2 });
  }
  for (let x = -6; x < length; x += 2.4) props.push({ kind: 'fence', x, z: -3.2, scale: 1, rot: 0 });
  for (let x = 4; x < length; x += 18) props.push({ kind: 'lamp', x, z: -2.6, scale: 1, rot: 0 });
  for (let x = 10; x < length; x += 37 + rnd() * 20) props.push({ kind: 'bench', x, z: -4.5, scale: 1, rot: 0 });
  for (let x = 6; x < length; x += 25 + rnd() * 30) props.push({ kind: 'cone', x, z: -2.1, scale: 1, rot: rnd() });
}
