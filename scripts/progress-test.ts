// Checks the unlock rules and that saved progress survives the move to the 70 tracks.
//
//   npx tsx scripts/progress-test.ts
import { Progress, Store } from '../src/progress';
import { TRACKS } from '../src/tracks';
import { BIOME_ORDER } from '../src/biomes';
import { ChallengeRun } from '../src/challenges';

let failed = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}
function store(init: Record<string, string> = {}): Store & { data: Map<string, string> } {
  const data = new Map(Object.entries(init));
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}
const byId = (id: string) => TRACKS.find((t) => t.id === id)!;

{
  const p = new Progress(TRACKS, BIOME_ORDER, store());
  check('a new player has only Sunny Park 1 open', TRACKS.filter((t) => p.unlocked(t)).map((t) => t.id).join() === 'park-1');
  p.record('park-1', 500);
  check('finishing without the required challenge keeps the next track shut', !p.unlocked(byId('park-2')));
  p.markChallenge(byId('park-1'), 0);
  check('finishing plus challenge 1 opens the next track', p.unlocked(byId('park-2')));
  check('stars count challenges', p.stars(byId('park-1')) === 1);
  check('the lock hint names the track to complete', p.gate(byId('park-3'))?.id === 'park-2');
  for (const id of ['park-2', 'park-3']) { p.record(id, 100); p.markChallenge(byId(id), 0); }
  check('track 3 opens the bonus level', p.unlocked(byId('park-pipe')));
  check('the next world stays shut until track 5', !p.biomeOpen('beach'));
  for (const id of ['park-4', 'park-5']) { p.record(id, 100); p.markChallenge(byId(id), 0); }
  check('track 5 opens the next world', p.biomeOpen('beach'));
}
{
  // Someone who played before the 70 tracks: the old First Pump best moves to Big Air Sunday.
  const s = store({ 'push-pump-pop-best-park-1': '15000', 'push-pump-pop-best-beach-1': '6000' });
  const p = new Progress(TRACKS, BIOME_ORDER, s);
  p.migrate();
  check('old First Pump best moves to Big Air Sunday', p.best('park-10') === 15000 && p.best('park-1') === 0);
  check('Big Air Sunday stays open for them', p.unlocked(byId('park-10')));
  check('tracks they finished stay open', p.unlocked(byId('beach-1')));
  p.migrate();
  check('migrating twice changes nothing', p.best('park-10') === 15000 && p.best('park-1') === 0);
}
{
  // The tracker in isolation: a finish and a no-lives challenge.
  const def = byId('park-1');
  const run = new ChallengeRun(def.challenges!, def.build());
  const got: number[] = [];
  run.onDone = (i) => got.push(i);
  run.finish();
  check('finishing does the finish and no-lives challenges', got.join() === '0,2');
  const run2 = new ChallengeRun(def.challenges!, def.build());
  run2.bail();
  run2.finish();
  check('a bail spoils the no-lives challenge', !run2.done[2] && run2.done[0]);
}

if (failed) process.exit(1);
