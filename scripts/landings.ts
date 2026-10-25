// Rides every track at the speeds real players go, from no pumping to pumping every
// downslope, with and without an ollie at each lip, and checks that every air off a ramp
// comes down where the track meant you to: on the downslope (or landing ramp) after it,
// or on a rail. Landing on a flat top, a flat run-out or the next upslope kills the flow.
//
//   npx tsx scripts/landings.ts [track-id-prefix]
import { TRACKS } from '../src/tracks';
import { BIOMES } from '../src/biomes';
import { Rider } from '../src/rider';
import { Track } from '../src/track';

const DT = 1 / 60;
const REACTION = 0.22;
const JITTER = 0.08;
const TIME_LIMIT = 150;
/** Share of downslopes pumped: never, about half, every one. */
const PUMP_RATES = [0, 0.5, 1];
const SEEDS = 3;
/** Takeoffs from ground at least this steep (going up) count as off a ramp. */
const RAMP_SLOPE = 0.15;
/** Airs shorter than this are a bump, not a jump. */
const MIN_AIR = 0.25;
/** The ground must fall at least this steeply where you come down. */
const DOWN_SLOPE = 0.08;

export interface Air {
  /** Where the air left the ground and came down. */
  from: number;
  to: number;
  /** Speed at take-off, and the slope (going down is negative) you came down on. */
  speed: number;
  landSlope: number;
  airTime: number;
  ollie: boolean;
  pumpRate: number;
  /** Came down on a rail, or under one: a kicker up onto a rail is meant to land on it. */
  rail: boolean;
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Distance to the next ramp lip within `range` metres (as the playtest bot spots them). */
export function nextLip(track: Track, x: number, range: number): number | null {
  const gap = track.pits.find((p) => p.x0 - x > 0.1 && p.x0 - x < range && track.slope(p.x0 - 0.5) < 0.35);
  for (let d = 0.2; d < range; d += 0.1) {
    const k0 = track.slope(x + d - 0.2), k1 = track.slope(x + d + 0.2);
    if (k0 > 0.35 && k1 < k0 - 0.6) return d;
    if (gap && d >= gap.x0 - x - 0.05) return gap.x0 - x;
  }
  return null;
}

/** One run with a player who pumps `pumpRate` of the downslopes, and ollies at lips or not. */
export function ride(trackId: string, pumpRate: number, ollie: boolean, seed: number): Air[] {
  const def = TRACKS.find((t) => t.id === trackId)!;
  const track = def.build();
  const biome = BIOMES[def.biome];
  const rand = rng(seed);
  const isMega = def.kind === 'mega';
  const airs: Air[] = [];
  let respawnAt = -1, t = 0;
  const r: Rider = new Rider(track, {
    trick() {}, pump() {}, land() {}, bail() {},
    fall() { respawnAt = isMega ? Infinity : t + 1.2; },
  });
  r.opts = { friction: isMega ? 0.6 : biome.friction, maxSpeed: isMega ? 22 : biome.maxSpeed, mega: isMega, snow: def.biome === 'snow' };
  if (isMega) r.perch();
  const queue: { at: number; act: 'pump' | 'up' }[] = [];
  let lastPump = -1, lastLip = -1;
  let air: { from: number; speed: number; up: number; ollie: boolean; inPipe: boolean } | null = null;
  let ollied = false;
  const press = (act: 'pump' | 'up') => queue.push({ at: t + REACTION + (rand() * 2 - 1) * JITTER, act });
  while (t < TIME_LIMIT && r.x < track.finishX && respawnAt !== Infinity) {
    if (respawnAt > 0 && t >= respawnAt) { r.respawn(r.fallPit!.x1 + 1.5, 6); respawnAt = -1; air = null; }
    // Before any input: an ollie leaves the ground as it lands.
    const wasGrounded = r.grounded && !r.grind;
    const up = track.slope(r.x) * (Math.sign(r.v) || 1);
    const x0 = r.x, v0 = r.speed;
    for (let i = queue.length - 1; i >= 0; i--) {
      if (queue[i].at > t) continue;
      const { act } = queue.splice(i, 1)[0];
      if (act === 'pump') r.pump();
      else { r.swipe('up'); ollied = true; }
    }
    if (r.perched && !queue.length) press('pump');
    if (r.grounded && !r.falling && !r.perched && r.dropT < 0) {
      const lead = Math.abs(r.v) * REACTION;
      if (track.slope(r.x + lead) < -0.12 && t - lastPump > 0.45 && (r.inPipe || nextLip(track, r.x, lead + 0.5) === null)) {
        if (rand() < pumpRate) press('pump');
        lastPump = t;
      }
      const lip = ollie ? nextLip(track, r.x, lead + 1.5) : null;
      if (lip !== null && t - lastLip > 0.6 && Math.abs(lip - lead) < 0.6 + r.v * 0.04) { press('up'); lastLip = t; }
    }
    r.update(DT);
    t += DT;
    if (wasGrounded && !r.grounded && !r.grind && !r.loop && !r.falling) {
      air = { from: x0, speed: v0, up, ollie: ollied, inPipe: r.inPipe };
    }
    if (r.grounded) ollied = false;
    if (air && r.falling) air = null;
    if (air && (r.grounded || r.grind)) {
      const a = air;
      air = null;
      if (a.inPipe || r.inPipe || r.airTime < MIN_AIR || a.up < RAMP_SLOPE) continue;
      // Flying off the top of a roller is pumping too fast, not a jump (the playtest checks
      // those), and a bump on the far edge of a gap is the landing still going on.
      if (track.spots.some((sp) => sp.tag === 'crest' && Math.abs(sp.x - a.from) < 3)) continue;
      if (track.pits.some((p) => Math.abs(a.from - p.x1) < 0.6)) continue;
      // Bounced back off the far wall of a gap: too slow to make it (the playtest checks gaps).
      if (r.v < 0) continue;
      // Just making a gap: the slope that counts is the ground past its edge, not its wall.
      const edge = track.pits.find((p) => r.x > p.x1 - 0.3 && r.x < p.x1 + 0.3);
      const landX = edge ? edge.x1 + 0.4 : r.x;
      airs.push({
        from: a.from, to: r.x, speed: a.speed, airTime: r.airTime, ollie: a.ollie, pumpRate, rail: !!r.grind || !!track.railAt(r.x),
        landSlope: track.slope(landX),
      });
    }
    if (isMega && r.inPipe && r.grounded && r.v < 0) break;
  }
  return airs;
}

export function goodLanding(a: Air) { return a.rail || a.landSlope <= -DOWN_SLOPE; }

/** Every air off a ramp on this track, at each pump rate, with and without ollies. */
export function rampAirs(trackId: string): Air[] {
  const out: Air[] = [];
  for (const rate of PUMP_RATES) for (const ollie of [false, true]) for (let s = 0; s < SEEDS; s++) {
    out.push(...ride(trackId, rate, ollie, 101 + s * 7919 + rate * 17 + (ollie ? 3 : 0)));
  }
  return out;
}

/** The airs that came down somewhere they shouldn't, one line per ramp. */
export function landingProblems(trackId: string): string[] {
  const airs = rampAirs(trackId);
  const ramps = new Map<number, Air[]>();
  for (const a of airs) {
    const key = [...ramps.keys()].find((k) => Math.abs(k - a.from) < 3) ?? a.from;
    ramps.set(key, [...(ramps.get(key) ?? []), a]);
  }
  const out: string[] = [];
  for (const [x, as] of [...ramps].sort((p, q) => p[0] - q[0])) {
    const bad = as.filter((a) => !goodLanding(a));
    if (!bad.length) continue;
    const d = as.map((a) => a.to - a.from), v = as.map((a) => a.speed);
    const why = bad.map((a) => a.landSlope > DOWN_SLOPE ? 'upslope' : `flat ${(a.to - a.from).toFixed(0)} m`);
    out.push(`jump at ${x.toFixed(0)} m (${Math.min(...v).toFixed(0)}-${Math.max(...v).toFixed(0)} m/s) lands ${Math.min(...d).toFixed(0)}-${Math.max(...d).toFixed(0)} m on; ${bad.length}/${as.length} miss the downslope: ${[...new Set(why)].join(', ')}`);
  }
  return out;
}

if (process.argv[1]?.endsWith('landings.ts')) {
  const only = process.argv.slice(2).find((a) => !a.startsWith('--'));
  let failed = 0;
  for (const def of TRACKS) {
    if (def.kind === 'pipe' || (only && !def.id.startsWith(only))) continue;
    const problems = landingProblems(def.id);
    console.log(`${problems.length ? 'FAIL' : 'ok  '} ${def.id}`);
    for (const p of problems) console.log(`       ${p}`);
    if (problems.length) failed++;
  }
  if (failed) {
    console.log(`\n${failed} track(s) have jumps that miss their landing.`);
    process.exit(1);
  }
}
