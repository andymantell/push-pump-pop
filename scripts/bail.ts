import { buildLevel1 } from '../src/level1';
import { Rider } from '../src/rider';
const track = buildLevel1();
const r: Rider = new Rider(track, { trick() {}, bail() { console.log('bail at', r.x.toFixed(1), 'y', r.y.toFixed(2), 'v', r.v.toFixed(1)); }, land(i) { if (i.airTime > 0.4) console.log('land', r.x.toFixed(1), i.airTime.toFixed(2), i.smooth); }, pump() {} });
let t = 0, lp = -1;
while (r.x < track.finishX && t < 100) { if (r.grounded && track.slope(r.x) < -0.15 && t - lp > 0.35) { r.pump(); lp = t; } r.update(1/60); t += 1/60; }
for (let x = 280; x < 341; x += 2) console.log(x, track.height(x).toFixed(2), track.slope(x).toFixed(2));
