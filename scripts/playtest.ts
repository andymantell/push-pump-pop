// Plays every track with a bot that has human-like limits and fails if a track
// is too hard: a gap nobody can clear, a track that can't be finished in time.
//
//   npx tsx scripts/playtest.ts [track-id-prefix] [--verbose]
//
// The bot "sees" the track ahead like a player does, but its inputs land after a
// reaction delay with random jitter, and it can't tap faster than a person.
// A second bot only pumps and never ollies, like a new player, and every run is
// checked for sudden stops: losing over half your speed in a moment for no reason
// (not a bail or a fall) feels like hitting an invisible wall.
import { TRACKS, PIPE_TIME } from '../src/tracks';
import { BIOMES } from '../src/biomes';
import { Rider, Swipe } from '../src/rider';
import { Track } from '../src/track';
import * as THREE from 'three';
import { Skater } from '../src/skater';

/** Runs per track that also pose the skater and check his legs stay above the ground. */
const LEG_RUNS = 24;
/** How far a knee, heel or toe may dip into the ground before it shows. */
const LEG_SINK = 0.04;
/** How far a knee, heel or toe may move against the body in one frame. */
const LEG_JUMP = 0.12;
/** Where legs went through the ground: rider state -> worst case seen. */
const legHits = new Map<string, { depth: number; where: string }>();

const RUNS = 24;
const REACTION = 0.22; // seconds from decision to input
const JITTER = 0.08; // +/- seconds of timing error
const MAX_INPUTS_PER_SEC = 3;
const MIN_PIT_CLEAR_RATE = 0.6;
const MIN_FINISH_RATE = 1.0;
/** Lives per run, as in the game: each bail or fall costs one. */
const LIVES = 3;
/** Share of runs that must finish without losing any life at all. */
const MIN_CLEAN_RATE = 0.5;
/** Median time spent rolling down a slope: below this, pumping can't be timed. */
const MIN_DOWNSLOPE_TIME = 0.3;
const TIME_LIMIT = 120;
/** A sudden stop: speed falls below this share of its recent peak within STOP_WINDOW. */
const STOP_SHARE = 0.5;
const STOP_WINDOW = 0.25;
const DT = 1 / 60;

interface Result {
  finished: boolean;
  time: number;
  pitAttempts: number[];
  pitClears: number[];
  bails: number;
  /** Lives lost by the time the run reached the finish (or ended). */
  livesLost: number;
  lipSpeeds: number[][];
  downs: number[];
  /** Where the rider suddenly stopped. */
  stops: number[];
}

/** Every trick the bots landed, across all runs. */
const seen = new Map<string, number>();

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Distance to the next lip (where the ground drops away) within `range` metres. */
function nextLip(track: Track, x: number, range: number): number | null {
  for (let d = 0.2; d < range; d += 0.1) {
    const k0 = track.slope(x + d - 0.2), k1 = track.slope(x + d + 0.2);
    if (k0 > 0.35 && k1 < k0 - 0.6) return d;
  }
  return null;
}

function checkLegs(skater: Skater, r: Rider, track: Track, trackId: string, t: number) {
  skater.update(DT, r, (x) => track.height(x), (x) => track.slope(x));
  if (r.falling) return; // tumbling into a gap goes below the ground on purpose
  // Crashing into the far wall of a gap you didn't clear isn't a pose to judge.
  if (skater.legPoints().some((p) => Math.abs(track.slope(p.x)) > 1.5) || Math.abs(track.slope(r.x)) > 1.5) { lastLegs.delete(skater); return; }
  // Legs snapping between poses from one frame to the next read as a glitch too.
  const pts = skater.legPoints().map((p) => skater.root.worldToLocal(p));
  const prev = lastLegs.get(skater);
  lastLegs.set(skater, pts);
  // Snapping back upright when a bail ends is meant to be sudden.
  const wasBailing = bailedLast.get(skater) ?? false;
  bailedLast.set(skater, r.bailing);
  if (prev && !r.bailing && !wasBailing) {
    const jump = Math.max(...pts.map((p, i) => p.distanceTo(prev[i])));
    if (jump > LEG_JUMP) note(`jump ${state(r)}`, jump, r, track, trackId, t);
  }
  let depth = 0;
  for (const p of skater.legPoints()) depth = Math.max(depth, track.height(p.x) - p.y);
  if (depth > LEG_SINK) note(`sink ${state(r)}`, depth, r, track, trackId, t);
}

const lastLegs = new WeakMap<Skater, THREE.Vector3[]>();
const bailedLast = new WeakMap<Skater, boolean>();

function state(r: Rider) {
  return [
    r.bailing ? 'bailing' : r.grounded ? 'ground' : 'air',
    r.pushing && 'pushing', r.manual, r.pumpTimer > 0 && 'pumping', r.flipping && 'flipping',
    r.spin && 'spinning', r.grab, r.current?.name, r.bodyYaw && 'fakie',
  ].filter(Boolean).join(' ');
}

function note(key: string, size: number, r: Rider, track: Track, trackId: string, t: number) {
  const prev = legHits.get(key);
  if (!prev || size > prev.depth) {
    legHits.set(key, { depth: size, where: `${trackId} x=${r.x.toFixed(1)} t=${t.toFixed(2)} slope=${track.slope(r.x).toFixed(2)} curv=${track.curvature(r.x).toFixed(2)} v=${r.v.toFixed(1)}` });
  }
}

function play(trackId: string, seed: number, pumpOnly = false, legs = false): Result {
  const def = TRACKS.find((t) => t.id === trackId)!;
  const biome = BIOMES[def.biome];
  const track = def.build();
  const rand = rng(seed);
  const res: Result = { finished: false, time: 0, pitAttempts: track.pits.map(() => 0), pitClears: track.pits.map(() => 0), bails: 0, livesLost: 0, lipSpeeds: track.pits.map(() => []), downs: [], stops: [] };
  let recent: { t: number; s: number }[] = [];
  let downT = 0;
  let t = 0;
  let respawnAt = -1;
  const r: Rider = new Rider(track, {
    trick(tr) { tricks++; seen.set(tr.name, (seen.get(tr.name) ?? 0) + 1); }, land() {}, pump() {},
    bail() { res.bails++; res.livesLost++; },
    fall() { respawnAt = t + 1.2; res.livesLost++; },
  });
  const isPipe = def.kind === 'pipe';
  const skater = legs ? new Skater() : null;
  r.opts = { friction: biome.friction, maxSpeed: isPipe ? 12.5 : biome.maxSpeed, pipe: isPipe };
  if (isPipe) r.v = 6;
  let peakAboveLip = 0, tricks = 0;

  // Inputs the bot has decided on, landing later.
  type Act = 'pump' | Swipe | 'spin' | 'grab' | 'let go' | 'lean+' | 'lean-' | 'lean0';
  const queue: { at: number; act: Act }[] = [];
  let manualPlanned = -10;
  const inputTimes: number[] = [];
  let lastPumpDecision = -1;
  let lipPlanned = -1;
  let trickPlanned = false;
  const passed = new Set<number>();

  const press = (act: Act, extra = 0) => {
    queue.push({ at: t + REACTION + extra + (rand() * 2 - 1) * JITTER, act });
  };

  while (isPipe ? t < PIPE_TIME : t < TIME_LIMIT && r.x < track.finishX) {
    // Respawn after a fall, as the game does.
    if (respawnAt > 0 && t >= respawnAt) {
      const p = r.fallPit!;
      r.respawn(p.x1 + 1.5, 6);
      respawnAt = -1;
      recent = [];
    }

    // Deliver inputs that are due, respecting the tap-rate cap.
    for (let i = queue.length - 1; i >= 0; i--) {
      if (queue[i].at > t) continue;
      const { act } = queue.splice(i, 1)[0];
      // Tilting the device isn't a tap, so it doesn't count towards the tap rate.
      if (act === 'lean+' || act === 'lean-' || act === 'lean0') { r.setLean(act === 'lean+' ? 1 : act === 'lean-' ? -1 : 0); continue; }
      if (act === 'let go') { r.release(); continue; }
      while (inputTimes.length && inputTimes[0] < t - 1) inputTimes.shift();
      if (inputTimes.length >= MAX_INPUTS_PER_SEC) continue;
      inputTimes.push(t);
      if (act === 'pump') r.pump();
      else if (act === 'grab') r.grabSwipe((['up', 'down', 'left', 'right'] as const)[Math.floor(rand() * 4)]);
      else if (act === 'spin') {
        r.spinSwipe(rand() > 0.5 ? 'left' : 'right');
        // A long swipe on a big air makes it a 360.
        if (r.vy > 5 && rand() > 0.5) r.spinMore();
      }
      else { r.swipe(act); r.release(); } // a flick, not a grab
    }

    // Decide. Looks ahead by where it will be when the input lands.
    if (!r.falling && !r.bailing) {
      const dir = Math.sign(r.v) || 1;
      const lead = Math.abs(r.v) * REACTION;
      if (r.grounded) {
        trickPlanned = false;
        const slopeThen = track.slope(r.x + lead * dir) * dir;
        if (slopeThen < -0.12 && t - lastPumpDecision > 0.45) { press('pump'); lastPumpDecision = t; }
        // Pop at the lip: decide when the lip is about one reaction-time away.
        const lip = isPipe || pumpOnly ? null : nextLip(track, r.x, lead + 1.5);
        if (lip !== null && t - lipPlanned > 0.6 && Math.abs(lip - lead) < 0.6 + r.v * 0.04) {
          press('up');
          lipPlanned = t;
        }
        // Manual along a flat stretch with no jump coming up.
        const flat = [0, 1, 2, 3, 4].every((d) => Math.abs(track.slope(r.x + d * dir)) < 0.08);
        if (!pumpOnly && flat && nextLip(track, r.x, 6) === null && t - manualPlanned > 3 && rand() < 0.02) {
          press(rand() > 0.5 ? 'lean+' : 'lean-');
          press('lean0', 0.6);
          manualPlanned = t;
        }
      } else if (!pumpOnly && !trickPlanned && r.vy > 3 && r.airTime > 0.05) {
        // Only trick on a big air, like a sensible player.
        const pick = rand();
        if (isPipe && r.vy > 6 && pick < 0.3) {
          // A big pipe air: tilt for a flip, then level out.
          const lean = rand() > 0.5 ? 'lean+' : 'lean-';
          press(lean);
          press('lean0', 0.2);
        } else if (r.vy > 5 && pick < 0.5) {
          // A big air: grab with the other thumb, and let go well before landing.
          press('grab');
          press('let go', 0.3);
        } else press(pick < 0.55 ? 'spin' : pick < 0.8 ? 'left' : 'down');
        trickPlanned = true;
      }
    }

    const before = r.x;
    r.update(DT);
    if (skater) checkLegs(skater, r, track, trackId, t);
    t += DT;
    if (!r.grounded) peakAboveLip = Math.max(peakAboveLip, r.y - track.maxY);
    if (r.grounded && track.slope(r.x) < -0.12) downT += DT;
    else if (downT > 0) { if (downT > 0.1) res.downs.push(downT); downT = 0; }
    // Sudden stops, measured on forward (horizontal) speed so landings don't count.
    // Signed, so rolling back down a slope after a bail doesn't read as a stop.
    const fwd = r.grounded ? r.v * Math.cos(Math.atan(track.slope(r.x))) : r.vx;
    if (r.falling || r.bailing || track.pitAt(r.x)) recent = [];
    else {
      recent.push({ t, s: fwd });
      while (recent[0].t < t - STOP_WINDOW) recent.shift();
      const peak = Math.max(...recent.map((e) => e.s));
    }
    track.pits.forEach((p, i) => { if (before < p.x0 - 0.3 && r.x >= p.x0 - 0.3) res.lipSpeeds[i].push(+r.speed.toFixed(1)); });

    // Track gap attempts and clears.
    track.pits.forEach((p, i) => {
      if (passed.has(i)) return;
      if (r.falling && r.fallPit === p) { res.pitAttempts[i]++; passed.add(i); }
      else if (r.x > p.x1 + 0.5 && !r.falling) { res.pitAttempts[i]++; res.pitClears[i]++; passed.add(i); }
    });
    // Allow a gap to count again after a respawn past it? No: one attempt per run.
  }
  // A half pipe counts as done if you can get a proper air (1 m over the lip) and a few tricks.
  // A run only counts as finished if it got there before running out of lives.
  res.finished = isPipe ? peakAboveLip >= 1 && tricks >= 5 : r.x >= track.finishX && res.livesLost < LIVES;
  res.time = t;
  return res;
}

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const only = args.find((a) => !a.startsWith('--'));
let failed = false;

for (const def of TRACKS) {
  if (only && !def.id.startsWith(only)) continue;
  const results = Array.from({ length: RUNS }, (_, i) => play(def.id, 1000 + i * 7919, false, i < LEG_RUNS));
  const pumpers = Array.from({ length: RUNS / 4 }, (_, i) => play(def.id, 5000 + i * 7919, true, true));
  const stops = [...results, ...pumpers].flatMap((r) => r.stops);
  const finishRate = results.filter((r) => r.finished).length / RUNS;
  const cleanRate = results.filter((r) => r.finished && r.livesLost === 0).length / RUNS;
  const times = results.filter((r) => r.finished).map((r) => r.time).sort((a, b) => a - b);
  const median = times.length ? times[Math.floor(times.length / 2)] : NaN;
  const track = def.build();
  const pitRates = track.pits.map((_, i) => {
    const att = results.reduce((s, r) => s + r.pitAttempts[i], 0);
    const clr = results.reduce((s, r) => s + r.pitClears[i], 0);
    return att ? clr / att : 1;
  });
  const downs = results.flatMap((r) => r.downs).sort((a, b) => a - b);
  const downMedian = downs.length ? downs[Math.floor(downs.length / 2)] : 1;
  const problems: string[] = [];
  if (downMedian < MIN_DOWNSLOPE_TIME) problems.push(`downslopes too short to pump (median ${downMedian.toFixed(2)}s)`);
  if (finishRate < MIN_FINISH_RATE) problems.push(`finished ${(finishRate * 100).toFixed(0)}% of runs with lives left`);
  if (def.kind !== 'pipe' && cleanRate < MIN_CLEAN_RATE) problems.push(`only ${(cleanRate * 100).toFixed(0)}% of runs kept all ${LIVES} lives`);
  pitRates.forEach((rate, i) => {
    if (rate < MIN_PIT_CLEAR_RATE) problems.push(`gap at ${track.pits[i].x0.toFixed(0)} m cleared ${(rate * 100).toFixed(0)}%`);
  });
  if (stops.length) problems.push(`sudden stops at ${[...new Set(stops.map((x) => Math.round(x)))].join(', ')} m`);
  const bails = results.reduce((s, r) => s + r.bails, 0) / RUNS;
  const lost = results.reduce((s, r) => s + r.livesLost, 0) / RUNS;
  const status = problems.length ? 'FAIL' : 'ok  ';
  console.log(`${status} ${def.id.padEnd(12)} median ${median.toFixed(1)}s  bails/run ${bails.toFixed(1)}  lives lost/run ${lost.toFixed(1)}  downslope ${downMedian.toFixed(2)}s  gaps ${pitRates.map((r) => (r * 100).toFixed(0) + '%').join(' ') || '-'}`);
  if (problems.length) {
    failed = true;
    for (const p of problems) console.log(`       ${p}`);
  }
  if (verbose) {
    console.log(`       times ${times.map((x) => x.toFixed(0)).join(' ')}`);
    track.pits.forEach((_, i) => console.log(`       gap ${i} lip speeds ${results.map((r) => r.lipSpeeds[i].join('/')).join(' ')}`));
  }
}

// The skater's legs should never poke through the ground.
if (legHits.size) {
  failed = true;
  console.log('\nleg glitches (sink: into the ground, jump: snapping between frames):');
  for (const [state, h] of [...legHits].sort((a, b) => b[1].depth - a[1].depth)) {
    console.log(`  ${(h.depth * 100).toFixed(0).padStart(3)} cm  ${state.padEnd(34)} ${h.where}`);
  }
}

// The bots should be able to land every kind of move, not just survive.
if (!only) {
  console.log(`\ntricks landed: ${[...seen].map(([n, c]) => `${n} ${c}`).join(', ')}`);
  const missing = ['Manual', 'Nose Manual', 'Backflip', 'Frontflip', 'FS 180', 'BS 180', 'FS 360', 'BS 360', 'Indy', 'Melon', 'Nosegrab', 'Tailgrab'].filter((n) => !seen.get(n));
  if (missing.length) { console.log(`never landed: ${missing.join(', ')}`); failed = true; }
}

if (failed) {
  console.log('\nSome tracks are too hard for a human-speed player.');
  process.exit(1);
}
