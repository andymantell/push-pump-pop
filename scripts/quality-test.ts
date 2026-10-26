// Checks the auto quality: a device that keeps up stays on full quality, a slow one steps down
// until it keeps up and then stays put instead of flickering, and a screen held to 30fps by a
// battery saver isn't made to look worse for nothing.
//
//   npx tsx scripts/quality-test.ts
import { Quality, LEVELS, Level } from '../src/quality';

let failed = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}

const store = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

/** Rough drawing cost of a level, relative to full quality: pixels, then shadows and outlines. */
const cost = (l: Level) => (0.25 + 0.75 * l.scale * l.scale) * (l.shadows ? 1 : 0.7) * (l.outlines ? 1 : 0.92);

/** Run for `seconds` on a 60Hz screen where full quality takes `fullMs` to draw, optionally capped. */
function run(q: Quality, fullMs: number, seconds: number, cap = 0) {
  const vsync = 1000 / 60;
  let t = 0, changes = 0, last = q.level;
  while (t < seconds) {
    const work = fullMs * cost(q.current) * (1 + (Math.random() - 0.5) * 0.1);
    const ms = Math.max(cap, Math.ceil(work / vsync - 0.02) * vsync);
    q.frame(ms / 1000);
    t += ms / 1000;
    if (q.level !== last) { changes++; last = q.level; }
  }
  return changes;
}

const ipad = new Quality(store());
run(ipad, 12, 600);
check('a device that keeps up stays on full quality', ipad.level === 0);

const s = store();
const phone = new Quality(s);
run(phone, 30, 60);
const settled = phone.level;
check(`a slow device steps down until it keeps up (level ${settled})`, settled > 0 && 30 * cost(LEVELS[settled]) < 1000 / 60);
const later = run(phone, 30, 600);
check(`then it barely changes over ten minutes (${later} changes)`, later <= 12);
check('and never ends up below what it needs', phone.level <= settled + 1);
check('it remembers the level for next time', new Quality(s).level === phone.level);

const capped = new Quality(store());
run(capped, 10, 120, 1000 / 30);
check(`a screen held at 30fps goes back to full quality (level ${capped.level})`, capped.level === 0);

const fixed = new Quality(store());
fixed.set('high');
run(fixed, 40, 60);
check('HIGH stays high however slow', fixed.level === 0);
fixed.set('low');
check('LOW drops straight down', fixed.level > 3);

if (failed) { console.log(`${failed} failed`); process.exit(1); }
