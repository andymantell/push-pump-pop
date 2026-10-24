// Headless physics run of level 1 with a simple bot, for tuning.
import { buildLevel1 } from '../src/level1';
import { Rider } from '../src/rider';

function run(pump: boolean, tricks: boolean) {
  const track = buildLevel1();
  let n = { tricks: 0, bails: 0, airs: 0, maxV: 0, maxAir: 0 };
  const r: Rider = new Rider(track, {
    trick() { n.tricks++; }, bail() { n.bails++; },
    land(i) { n.airs++; n.maxAir = Math.max(n.maxAir, i.airTime); }, pump() {},
  });
  let t = 0, lastPump = -1, did = false;
  const dt = 1 / 60;
  const stuck: string[] = [];
  let lastX = r.x, lastCheck = 0;
  while (r.x < track.finishX && t < 240) {
    if (r.grounded) {
      did = false;
      if (pump && track.slope(r.x) < -0.15 && t - lastPump > 0.35) { r.pump(); lastPump = t; }
    } else if (tricks && !did && r.airTime > 0.08 && r.vy > 2) { r.swipe('left'); did = true; }
    r.update(dt);
    t += dt;
    n.maxV = Math.max(n.maxV, r.speed);
    if (t - lastCheck > 5) { if (r.x - lastX < 10) stuck.push(r.x.toFixed(0)); lastX = r.x; lastCheck = t; }
  }
  console.log(`pump=${pump} tricks=${tricks} time=${t.toFixed(1)} x=${r.x.toFixed(0)}/${track.finishX.toFixed(0)} maxV=${n.maxV.toFixed(1)} airs=${n.airs} maxAir=${n.maxAir.toFixed(2)} tricks=${n.tricks} bails=${n.bails} slow@${stuck.join(',')}`);
}
run(false, false);
run(true, false);
run(true, true);
