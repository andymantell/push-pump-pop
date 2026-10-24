// Headless physics runs of every track with simple bots, for tuning.
import { TRACKS } from '../src/tracks';
import { BIOMES } from '../src/biomes';
import { Rider } from '../src/rider';

type Bot = 'coast' | 'pump' | 'pro';

function run(id: string, bot: Bot) {
  const def = TRACKS.find((t) => t.id === id)!;
  const biome = BIOMES[def.biome];
  const track = def.build();
  const n = { tricks: 0, bails: 0, falls: 0, maxV: 0, maxAir: 0 };
  let respawnAt = -1;
  const r: Rider = new Rider(track, {
    trick() { n.tricks++; }, bail() { n.bails++; },
    land(i) { n.maxAir = Math.max(n.maxAir, i.airTime); }, pump() {},
    fall() { n.falls++; respawnAt = t + 0.6; },
  });
  r.opts = { friction: biome.friction, maxSpeed: biome.maxSpeed };
  let t = 0, lastPump = -1, did = false;
  const dt = 1 / 60;
  const fallsAt: string[] = [];
  const downs: number[] = [];
  let downT = 0;
  while (r.x < track.finishX && t < 240) {
    if (respawnAt > 0 && t >= respawnAt) {
      const p = r.fallPit!;
      fallsAt.push(p.x0.toFixed(0));
      r.respawn(p.x1 + 1.5, 8);
      respawnAt = -1;
    }
    if (r.grounded) {
      did = false;
      if (bot !== 'coast' && track.slope(r.x) < -0.15 && t - lastPump > 0.35) { r.pump(); lastPump = t; }
      // Pro: ollie at kicker lips.
      if (bot === 'pro' && track.slope(r.x) > 0.55 && track.curvature(r.x + 0.3) < -2) { r.swipe('up'); r.release(); }
    } else if (bot === 'pro' && !did && r.airTime > 0.05 && r.vy > 2.5) { r.swipe('left'); r.release(); did = true; }
    r.update(dt);
    t += dt;
    if (r.grounded && track.slope(r.x) < -0.12) downT += dt;
    else if (downT > 0) { downs.push(downT); downT = 0; }
    n.maxV = Math.max(n.maxV, r.speed);
  }
  downs.sort((a, b) => a - b);
  const med = downs.length ? downs[Math.floor(downs.length / 2)].toFixed(2) : '-';
  const p25 = downs.length ? downs[Math.floor(downs.length / 4)].toFixed(2) : '-';
  const done = r.x >= track.finishX ? 'done' : `STUCK x=${r.x.toFixed(0)}`;
  console.log(`${id.padEnd(11)} ${bot.padEnd(5)} ${done} t=${t.toFixed(1)}s len=${track.finishX.toFixed(0)} maxV=${n.maxV.toFixed(1)} maxAir=${n.maxAir.toFixed(2)} tricks=${n.tricks} bails=${n.bails} falls=${n.falls} down p25/med=${p25}/${med}s${fallsAt.length ? ' @' + fallsAt.join(',') : ''}`);
}

const only = process.argv[2];
for (const t of TRACKS) {
  if (only && !t.id.startsWith(only)) continue;
  for (const bot of ['coast', 'pump', 'pro'] as Bot[]) run(t.id, bot);
}
