// Checks the lives rules: three lives, game over stops all control and freezes the
// rider once the last crash has played out, and half pipes have no lives.
//
//   npx tsx scripts/lives-test.ts
import { Lives, LIVES, OUT_DELAY } from '../src/lives';
import { TRACKS } from '../src/tracks';
import { Rider } from '../src/rider';

let failed = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}

const l = new Lives();
check(`starts with ${LIVES} lives`, l.left === LIVES && l.controllable && !l.out);
check('first crashes are not game over', !l.lose() && !l.lose() && l.controllable);
check('last crash is game over', l.lose() && l.out && !l.controllable);
check('no lives go below zero', !l.lose() && l.left === 0);
check('the last crash keeps playing', l.simulate(true));
check('a rider not crashing is frozen at once', !l.simulate(false));
let shown = 0;
for (let t = 0; t < OUT_DELAY + 1; t += 1 / 60) if (l.tick(1 / 60)) shown++;
check('Out of Lives screen shows once', shown === 1);
check('frozen behind the screen, even mid-crash', !l.simulate(true) && !l.simulate(false) && !l.controllable);
l.reset(true);
check('starting again restores lives and control', l.left === LIVES && l.controllable && l.simulate(false));
const pipe = new Lives(false);
for (let i = 0; i < 10; i++) pipe.lose();
check('half pipes never run out', !pipe.out && pipe.controllable);

// Drive a rider the way the game loop does and make sure nothing moves it after game over.
const def = TRACKS.find((d) => d.kind !== 'pipe')!;
const lives = new Lives();
const rider = new Rider(def.build(), { trick() {}, land() {}, pump() {}, bail() { lives.lose(); }, fall() { lives.lose(); } });
rider.opts = { friction: 1, maxSpeed: 17 };
for (let t = 0; t < 3; t += 1 / 60) rider.update(1 / 60);
while (!lives.out) lives.lose();
let screen = false;
for (let t = 0; !screen && t < 10; t += 1 / 60) {
  if (lives.simulate(rider.bailing || rider.falling)) rider.update(1 / 60);
  screen = lives.tick(1 / 60);
}
const x = rider.x, y = rider.y;
for (let t = 0; t < 5; t += 1 / 60) {
  // Taps and swipes are dropped by the game when not controllable; the loop must not move the rider either.
  if (lives.controllable) { rider.pump(); rider.swipe('up'); }
  if (lives.simulate(rider.bailing || rider.falling)) rider.update(1 / 60);
}
check('rider stays put behind the Out of Lives screen', screen && rider.x === x && rider.y === y);

if (failed) { console.log(`\n${failed} lives check(s) failed.`); process.exit(1); }
