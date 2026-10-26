// Rides every track at the speeds real players go, from no pumping to pumping every
// downslope, with and without an ollie at each lip, and checks the balance of every jump:
// - Doing well (pumping, ollieing at the lip), you come down on the downslope after it, or
//   on a rail. Overshooting onto the flat run-out or the next upslope kills the flow.
//   Rolling off a drop-off's lip counts as a jump too.
// - Too slow, or rolling off without an ollie, you may land short on the flat deck on top:
//   a gentle penalty, as you lose the downslope. Nobody ever overshoots.
// - Gaps need speed: past the learning tracks, riders who never pump fall into many of
//   them, while riders who pump some of the time clear each one most of the time.
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
/** A flat landing with a downslope this close ahead is short (on the deck), not past it. */
const DECK_AHEAD = 6;
/** Pump rate of a rider doing well enough to be owed the downslope and to clear gaps. */
const SKILLED = 0.5;
/** Hardly faster than pushing: whatever you did before, you're too slow to be owed the downslope. */
const SKILLED_SPEED = 6;
/** Runs per pump rate for gap clear rates. */
const GAP_SEEDS = 8;
/** Gaps on tracks this gentle are for learning: anyone can clear them. */
const LEARN_MAX_DIFFICULTY = 3;
/** Most of a track's gaps a never-pumping rider may clear, by difficulty, and least of each a skilled one must. */
const SLOW_CLEAR = (difficulty: number) => (difficulty <= 6 ? 0.5 : 0.25);
const SKILLED_CLEAR = 0.75;

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
  /** Came down on flat ground before the downslope: on the deck. */
  short: boolean;
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
    if (k0 > 0.35 && k1 < k0 - 0.3) return d;
    if (gap && d >= gap.x0 - x - 0.05) return gap.x0 - x;
  }
  return null;
}

/** One run with a player who pumps `pumpRate` of the downslopes, and ollies at lips or not. */
/** `gaps` gets whether each gap was cleared, and `late` the ones met after falling off a loop. */
export function ride(trackId: string, pumpRate: number, ollie: boolean, seed: number, gaps?: boolean[], late?: number[]): Air[] {
  const def = TRACKS.find((t) => t.id === trackId)!;
  const track = def.build();
  const biome = BIOMES[def.biome];
  const rand = rng(seed);
  const isMega = def.kind === 'mega';
  const airs: Air[] = [];
  let respawnAt = -1, t = 0, loopFell = false;
  const r: Rider = new Rider(track, {
    trick() {}, pump() {}, land() {}, bail() {},
    fall() {
      respawnAt = isMega ? Infinity : t + 1.2;
      const i = track.pits.indexOf(r.fallPit!);
      if (gaps && i >= 0 && gaps[i] === undefined) { gaps[i] = false; if (loopFell) late?.push(i); }
      // Fell off a loop: the rider is back on at walking pace.
      if (i < 0) loopFell = true;
    },
  });
  r.opts = { friction: isMega ? 0.6 : biome.friction, maxSpeed: isMega ? 22 : biome.maxSpeed, mega: isMega, snow: def.biome === 'snow', mountain: def.biome === 'farm' };
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
    const x0 = r.x, v0 = r.speed, bounces = r.bounces;
    for (let i = queue.length - 1; i >= 0; i--) {
      if (queue[i].at > t) continue;
      const { act } = queue.splice(i, 1)[0];
      if (act === 'pump') r.pump();
      else { r.swipe('up'); ollied = true; }
    }
    if (r.perched && !queue.length) press('pump');
    if (r.grounded && !r.falling && !r.perched && r.dropT < 0) {
      const lead = Math.abs(r.v) * REACTION;
      if ((track.slope(r.x + lead) < -0.12 || track.beltAt(r.x + lead)) && t - lastPump > 0.45 && (r.inPipe || nextLip(track, r.x, lead + 0.5) === null)) {
        if (rand() < pumpRate) press('pump');
        lastPump = t;
      }
      const lip = ollie ? nextLip(track, r.x, lead + 1.5) : null;
      if (lip !== null && t - lastLip > 0.6 && Math.abs(lip - lead) < 0.6 + r.v * 0.04) { press('up'); lastLip = t; }
    }
    r.update(DT);
    t += DT;
    if (gaps && !r.falling) track.pits.forEach((p, i) => { if (gaps[i] === undefined && r.x > p.x1 + 0.5) { gaps[i] = true; if (loopFell) late?.push(i); } });
    if (wasGrounded && !r.grounded && !r.grind && !r.loop && !r.falling) {
      // A jelly pad throws you like a ramp does.
      air = { from: x0, speed: v0, up: r.bounces !== bounces ? 1 : up, ollie: ollied, inPipe: r.inPipe };
    }
    if (r.grounded) ollied = false;
    if (air && r.falling) air = null;
    if (air && (r.grounded || r.grind)) {
      const a = air;
      air = null;
      // Off a ramp, or rolling off a drop-off's lip.
      const dropoff = track.spots.some((sp) => sp.tag === 'dropoff' && a.from > sp.x - 2 && a.from < sp.x + 0.5);
      if (a.inPipe || r.inPipe || r.airTime < MIN_AIR || (a.up < RAMP_SLOPE && !dropoff)) continue;
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
        landSlope: track.slope(landX), short: isShort(track, landX),
      });
    }
    if (isMega && r.inPipe && r.grounded && r.v < 0) break;
  }
  return airs;
}

/** On flat ground with the downslope just ahead (and no upslope before it). */
function isShort(track: Track, x: number): boolean {
  if (Math.abs(track.slope(x)) > DOWN_SLOPE) return false;
  for (let d = 0; d < DECK_AHEAD; d += 0.1) {
    const k = track.slope(x + d);
    if (k > DOWN_SLOPE) return false;
    if (k < -DOWN_SLOPE) return true;
  }
  return false;
}

/** Doing well: pumping, ollieing at the lip, and going faster than just pushing along. */
const skilled = (a: Air) => a.pumpRate >= SKILLED && a.ollie && a.speed >= SKILLED_SPEED;

export function goodLanding(a: Air) {
  return a.rail || a.landSlope <= -DOWN_SLOPE || (a.short && !skilled(a));
}

/** Every air off a ramp on this track, at each pump rate, with and without ollies. */
export function rampAirs(trackId: string): Air[] {
  const out: Air[] = [];
  for (const rate of PUMP_RATES) for (const ollie of [false, true]) for (let s = 0; s < SEEDS; s++) {
    out.push(...ride(trackId, rate, ollie, 101 + s * 7919 + rate * 17 + (ollie ? 3 : 0)));
  }
  return out;
}

/** Share of runs clearing each gap, at each pump rate (all ollieing at the lip). */
export function gapRates(trackId: string): number[][] {
  const pits = TRACKS.find((t) => t.id === trackId)!.build().pits;
  return PUMP_RATES.map((rate) => {
    const cleared = pits.map(() => 0), tried = pits.map(() => 0);
    for (let s = 0; s < GAP_SEEDS; s++) {
      const gaps: boolean[] = [], late: number[] = [];
      ride(trackId, rate, true, 300 + s * 7919 + rate * 17, gaps, late);
      // A rider who pumps makes the loops in the playtest: a gap met after falling off one
      // doesn't count against it. One who never pumps really does come off, so it counts.
      pits.forEach((_, i) => { if (rate > 0 && late.includes(i)) return; tried[i]++; if (gaps[i]) cleared[i]++; });
    }
    return cleared.map((n, i) => tried[i] ? n / tried[i] : 1);
  });
}

/** Jumps that land somewhere they shouldn't, and gaps out of balance: one line each. */
export function landingProblems(trackId: string): string[] {
  const def = TRACKS.find((t) => t.id === trackId)!;
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
    const why = bad.map((a) => a.landSlope > DOWN_SLOPE ? 'upslope' : a.short ? `short of the downslope ${(a.to - a.from).toFixed(0)} m` : `past the downslope ${(a.to - a.from).toFixed(0)} m`);
    out.push(`jump at ${x.toFixed(0)} m (${Math.min(...v).toFixed(0)}-${Math.max(...v).toFixed(0)} m/s) lands ${Math.min(...d).toFixed(0)}-${Math.max(...d).toFixed(0)} m on; ${bad.length}/${as.length} miss: ${[...new Set(why)].join(', ')}`);
  }
  if (def.kind === 'mega') return out;
  const track = def.build();
  const [slow, some] = gapRates(trackId);
  track.pits.forEach((p, i) => {
    if (some[i] < SKILLED_CLEAR) out.push(`gap at ${p.x0.toFixed(0)} m (${(p.x1 - p.x0).toFixed(1)} m) cleared by ${Math.round(some[i] * 100)}% of riders who pump some of the time (needs ${SKILLED_CLEAR * 100}%)`);
  });
  // A rail over a gap is crossed by grinding it, at any speed: only the jumped gaps count.
  const jumped = track.pits.map((p, i) => i).filter((i) => !track.rails.some((r) => r.x0 < track.pits[i].x0 && r.x1 > track.pits[i].x1));
  const difficulty = def.difficulty ?? 10;
  if (jumped.length && difficulty > LEARN_MAX_DIFFICULTY) {
    const rate = jumped.reduce((s, i) => s + slow[i], 0) / jumped.length;
    if (rate > SLOW_CLEAR(difficulty)) out.push(`riders who never pump clear ${Math.round(rate * 100)}% of the gaps (at most ${SLOW_CLEAR(difficulty) * 100}% at difficulty ${difficulty}): ${jumped.map((i) => `${track.pits[i].x0.toFixed(0)} m ${Math.round(slow[i] * 100)}%`).join(', ')}`);
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
    console.log(`\n${failed} track(s) have jumps or gaps out of balance.`);
    process.exit(1);
  }
}
