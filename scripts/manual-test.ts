// Checks that a spin out of a manual ends it on every ride, and that you have to level out
// and tilt again for the next one (it used to land as a stoppie the wrong way on the bike).
//
//   npx tsx scripts/manual-test.ts
import { TRACKS } from '../src/tracks';
import { Rider, type RiderOptions } from '../src/rider';

let failed = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}

const def = TRACKS.find((d) => d.id === 'park-1')!;
const rides: [string, Partial<RiderOptions>][] = [['skate', {}], ['scooter', { scooter: true }], ['mtb', { mtb: true }], ['roller', { roller: true }]];
for (const [ride, opts] of rides) {
  const tricks: string[] = [];
  const r = new Rider(def.build(), { trick(t) { tricks.push(t.name); }, land() {}, pump() {}, bail() {}, fall() {} });
  r.opts = { friction: 1, maxSpeed: 17, ...opts };
  const run = (secs: number) => { for (let t = 0; t < secs; t += 1 / 60) { if (r.grounded && Math.abs(r.v) < 7) r.v = 7; r.update(1 / 60); } };
  r.pump(); // drop in
  run(3);
  r.setLean(1);
  run(0.6);
  const before = r.manual;
  r.spinSwipe('right');
  run(1.5);
  check(`${ride}: ${before} ends when you spin`, before !== null && r.manual === null && tricks.includes(before) && r.backwards);
  run(1);
  check(`${ride}: still tilted, no manual after landing`, r.manual === null);
  r.setLean(0);
  run(0.1);
  r.setLean(1);
  run(0.3);
  check(`${ride}: tilt again for the next one`, r.manual !== null);
}

if (failed) { console.log(`${failed} failed`); process.exit(1); }
