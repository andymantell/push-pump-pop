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

function play(trackId: string, seed: number, pumpOnly = false): Result {
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
    trick() { tricks++; }, land() {}, pump() {},
    bail() { res.bails++; res.livesLost++; },
    fall() { respawnAt = t + 1.2; res.livesLost++; },
  });
  const isPipe = def.kind === 'pipe';
  r.opts = { friction: biome.friction, maxSpeed: isPipe ? 12.5 : biome.maxSpeed, pipe: isPipe };
  if (isPipe) r.v = 6;
  let peakAboveLip = 0, tricks = 0;

  // Inputs the bot has decided on, landing later.
  const queue: { at: number; act: 'pump' | Swipe }[] = [];
  const inputTimes: number[] = [];
  let lastPumpDecision = -1;
  let lipPlanned = -1;
  let trickPlanned = false;
  const passed = new Set<number>();

  const press = (act: 'pump' | Swipe) => {
    queue.push({ at: t + REACTION + (rand() * 2 - 1) * JITTER, act });
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
      while (inputTimes.length && inputTimes[0] < t - 1) inputTimes.shift();
      if (inputTimes.length >= MAX_INPUTS_PER_SEC) continue;
      inputTimes.push(t);
      if (act === 'pump') r.pump(); else r.swipe(act);
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
      } else if (!pumpOnly && !trickPlanned && r.vy > 3 && r.airTime > 0.05) {
        // Only trick on a big air, like a sensible player.
        press(rand() > 0.5 ? 'left' : 'down');
        trickPlanned = true;
      }
    }

    const before = r.x;
    r.update(DT);
    t += DT;
    if (!r.grounded) peakAboveLip = Math.max(peakAboveLip, r.y - track.maxY);
    if (r.grounded && track.slope(r.x) < -0.12) downT += DT;
    else if (downT > 0) { if (downT > 0.1) res.downs.push(downT); downT = 0; }
    // Sudden stops, measured on forward (horizontal) speed so landings don't count.
    const fwd = r.grounded ? Math.abs(r.v) * Math.cos(Math.atan(track.slope(r.x))) : Math.abs(r.vx);
    if (r.falling || r.bailing || track.pitAt(r.x)) recent = [];
    else {
      recent.push({ t, s: fwd });
      while (recent[0].t < t - STOP_WINDOW) recent.shift();
      const peak = Math.max(...recent.map((e) => e.s));
      if (!isPipe && peak > 5 && fwd < peak * STOP_SHARE) { res.stops.push(+r.x.toFixed(1)); recent = []; }
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
  const results = Array.from({ length: RUNS }, (_, i) => play(def.id, 1000 + i * 7919));
  const pumpers = Array.from({ length: RUNS / 4 }, (_, i) => play(def.id, 5000 + i * 7919, true));
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

if (failed) {
  console.log('\nSome tracks are too hard for a human-speed player.');
  process.exit(1);
}
