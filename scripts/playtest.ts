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
import { BIOMES, BIOME_ORDER } from '../src/biomes';
import { requiredCount } from '../src/challenges';
import { Rider, Swipe, TrickName, GRAVITY } from '../src/rider';
import { Score } from '../src/score';
import { ChallengeRun, Challenge, members } from '../src/challenges';
import { Track, Rail, railY } from '../src/track';
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
/** Log every trick and bail (for one track and one goal): TRACE=park-6:0 */
const TRACE_SPEC = process.env.TRACE?.split(':');
let TRACE = false;
const REACTION = 0.22; // seconds from decision to input
const JITTER = 0.08; // +/- seconds of timing error
const MAX_INPUTS_PER_SEC = 3;
const MIN_PIT_CLEAR_RATE = 0.6;
/** Runs of the bot going for one required challenge, and the share that must do it. */
const CHALLENGE_RUNS = 12;
const MIN_CHALLENGE_RATE = 0.5;
/** The first six Sunny Park tracks are for a brand-new player: their required challenge is nearly a sure thing. */
const MIN_EASY_CHALLENGE_RATE = 0.9;
/** Goes at an optional challenge this many times; it must be done at least once. */
const OPTIONAL_TRIES = 24;
/** Tracks this gentle must be finished by the pump-only bot without losing a life. */
const PUMP_ONLY_MAX_DIFFICULTY = 3;
/** Share of loop attempts that must make it round. */
const MIN_LOOP_RATE = 0.95;
/** Average share of a rail a human-speed grind should cover. */
const MIN_GRIND_COVER = 0.6;
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
/**
 * A dip whose top edge is too sharp throws you off the ground without an ollie, and you
 * come down on the far upslope: you miss the whole downslope you should have pumped.
 * Any air you didn't pop for that lands on an upslope steeper than this fails the track.
 */
const DIP_LAUNCH_SLOPE = 0.25;
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
  /** Where the rider was thrown over a dip onto its upslope. */
  dipLaunches: number[];
  grinds: number;
  loopsTried: number;
  loopsDone: number;
  /** Grinds per rail on the track. */
  railHits: number[];
  /** Share of the rail each grind covered. */
  coverage: number[];
  /** Which of the track's challenges this run did. */
  chal: boolean[];
  score: number;
}

/** Every trick the bots landed, across all runs. */
const seen = new Map<string, number>();
const stopNotes: string[] = [];

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
  // Tumbling into a gap goes below the ground on purpose, and the respawn after it is a jump cut.
  if (r.falling) { lastLegs.delete(skater); return; }
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
    r.spin && 'spinning', r.grab, r.grind && 'grinding', r.current?.name, r.bodyYaw && 'fakie',
  ].filter(Boolean).join(' ');
}

function note(key: string, size: number, r: Rider, track: Track, trackId: string, t: number) {
  const prev = legHits.get(key);
  if (!prev || size > prev.depth) {
    legHits.set(key, { depth: size, where: `${trackId} x=${r.x.toFixed(1)} t=${t.toFixed(2)} slope=${track.slope(r.x).toFixed(2)} curv=${track.curvature(r.x).toFixed(2)} v=${r.v.toFixed(1)}` });
  }
}

/** How the bot does each trick: inputs, and when after the first one. */
function trickActs(name: TrickName, hold: number): [string, number][] {
  switch (name) {
    case 'Kickflip': case 'BS Shifty': return [['flick:left', 0]];
    case 'Heelflip': case 'FS Shifty': return [['flick:right', 0]];
    case 'Pop Shove-it': case 'Tuck Knee': return [['flick:down', 0]];
    case 'Indy': return [['grab:up', 0], ['let go', hold]];
    case 'Melon': return [['grab:down', 0], ['let go', hold]];
    case 'Nosegrab': return [['grab:left', 0], ['let go', hold]];
    case 'Tailgrab': return [['grab:right', 0], ['let go', hold]];
    case 'FS 180': return [['spin:right', 0]];
    case 'BS 180': return [['spin:left', 0]];
    case 'FS 360': return [['spin360:right', 0]];
    case 'BS 360': return [['spin360:left', 0]];
    case 'Backflip': return [['lean+', 0], ['lean0', 0.2]];
    case 'Frontflip': return [['lean-', 0], ['lean0', 0.2]];
  }
  return [];
}
/** Air time a trick needs to land clean. */
function trickTime(name: TrickName, hold: number): number {
  if (['Indy', 'Melon', 'Nosegrab', 'Tailgrab'].includes(name)) return hold + 0.2;
  if (name.endsWith('360')) return 0.75;
  if (name === 'Backflip' || name === 'Frontflip') return 0.72;
  if (name === 'Ollie') return 0;
  return 0.42;
}

/**
 * Plays one run. With a goal (a challenge index), the bot goes for that challenge the way a
 * player would: the asked tricks on airs big enough for them, carefully if it's about not
 * falling, and manuals or rails when it needs them.
 */
function play(trackId: string, seed: number, pumpOnly = false, legs = false, goal = -1): Result {
  TRACE = !!TRACE_SPEC && TRACE_SPEC[0] === trackId && Number(TRACE_SPEC[1]) === goal;
  if (TRACE) console.log(`run ${seed}`);
  const def = TRACKS.find((t) => t.id === trackId)!;
  const biome = BIOMES[def.biome];
  const track = def.build();
  const rand = rng(seed);
  const res: Result = { finished: false, time: 0, pitAttempts: track.pits.map(() => 0), pitClears: track.pits.map(() => 0), bails: 0, livesLost: 0, lipSpeeds: track.pits.map(() => []), downs: [], stops: [], dipLaunches: [], grinds: 0, loopsTried: 0, loopsDone: 0, railHits: track.rails.map(() => 0), coverage: [], chal: [], score: 0 };
  const G: Challenge | null = goal >= 0 ? def.challenges![goal] : null;
  const chal = new ChallengeRun(def.challenges ?? [], track, [], def.kind === 'pipe');
  const score = new Score();
  score.onBank = (pts) => { if (alive()) chal.bank(pts); };
  score.onLost = () => chal.lost();
  // Once out of lives the game stops, so nothing after that counts.
  const alive = () => res.livesLost < LIVES;
  let recent: { t: number; s: number }[] = [];
  let downT = 0;
  let t = 0;
  let respawnAt = -1;
  const r: Rider = new Rider(track, {
    loop(done) { if (done) res.loopsDone++; else res.loopsTried++; },
    grind(rail) { res.grinds++; res.railHits[track.rails.indexOf(rail)]++; grindFrom = { rail, x: r.x }; },
    trick(tr) { tricks++; seen.set(tr.name, (seen.get(tr.name) ?? 0) + 1); if (alive()) { chal.trick(tr); score.addTrick(tr); landed.add(tr.name); } if (TRACE) console.log(`  t=${t.toFixed(1)} x=${r.x.toFixed(1)} ${tr.name} ${tr.duration.toFixed(2)}`); },
    pump(good) { if (alive()) chal.pump(good); },
    land({ airTime, smooth, peakY }) {
      if (alive()) chal.land(r.x);
      // Scoring as in the game.
      if (isPipe) { const h = peakY - track.maxY; if (h > 0.5) score.addBonus('Air', Math.round(h * 150)); score.bank(); }
      else if (airTime > 0.7) score.addBonus('Air', Math.round(airTime * 120));
      if (smooth) score.addBonus('Smooth', 75);
      const up = track.slope(r.x) * (Math.sign(r.v) || 1);
      // Only airs that left from a crest or an edge, not up a kicker or ramp.
      if (!isPipe && !r.ollied && takeoffSlope < 0.15 && airTime > 0.3 && up > DIP_LAUNCH_SLOPE) res.dipLaunches.push(+r.x.toFixed(1));
    },
    bail() { if (TRACE) console.log(`  t=${t.toFixed(1)} x=${r.x.toFixed(1)} BAIL was: ${prevState}`); if (alive()) chal.bail(); score.lose(); res.bails++; res.livesLost++; },
    fall() { if (alive()) chal.fall(r.x); score.lose(); respawnAt = t + 1.2; res.livesLost++; },
  });
  const isPipe = def.kind === 'pipe';
  const skater = legs ? new Skater() : null;
  r.opts = { friction: biome.friction, maxSpeed: isPipe ? 12.5 : biome.maxSpeed, pipe: isPipe, snow: def.biome === 'snow' };
  skater?.setSnow(def.biome === 'snow');
  if (isPipe) r.perch();
  let peakAboveLip = 0, tricks = 0;
  let wasGrounded = true, takeoffSlope = 0, prevState = '';

  // Inputs the bot has decided on, landing later.
  type Act = 'pump' | Swipe | 'spin' | 'grab' | 'let go' | 'lean+' | 'lean-' | 'lean0' | string;
  const queue: { at: number; act: Act }[] = [];
  let manualPlanned = -10;
  let grindStyled = false;
  const inputTimes: number[] = [];
  let lastPumpDecision = -1;
  let lipPlanned = -1;
  let trickPlanned = false;
  // Rails are optional: this player goes for them on most runs, and they never block the finish.
  // Going for something that means staying on your feet: no tricks beyond ollies.
  const careful = !!G && (['finish', 'noLives', 'gaps', 'climb', 'pumps'].includes(G.kind) || (G.kind === 'score' && !!G.noLives));
  const wantRails = !!G && (G.kind === 'grind' || ('fromRail' in G && !!G.fromRail) || (G.kind === 'combo' && !!G.include?.includes('grind')));
  const wantManual = !!G && (G.kind === 'manual' || (G.kind === 'combo' && !!G.include?.includes('manual')));
  const pickFrom = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const landed = new Set<TrickName>();
  let takeoffX = 0, grindLeft = -10;
  let airNames: TrickName[] | null = null;
  const railTry = !pumpOnly && (wantRails || (!careful && rand() < 0.7));
  const railsTried = new Set<Rail>();
  // An ollie aimed at a rail is just an ollie: no flip on the way on.
  let railOllie = false, railOllieAt = -10;
  let grindFrom: { rail: Rail; x: number } | null = null;
  const passed = new Set<number>();

  const press = (act: Act, extra = 0) => {
    queue.push({ at: t + REACTION + extra + (rand() * 2 - 1) * JITTER, act });
  };

  /** Where and when the current air comes down, roughly. */
  function flight(): { time: number; x: number } {
    let x = r.x, y = r.y, vy = r.vy, tt = 0;
    while (tt < 4) {
      tt += 0.01; x += r.vx * 0.01; vy -= GRAVITY * 0.01; y += vy * 0.01;
      if (vy < 0 && y <= track.height(x)) break;
    }
    return { time: tt, x };
  }
  /** Goal mode in the air: undefined to fall back to the ordinary bot, else handled. */
  function goalAir(): true | undefined {
    const g = G!;
    if (careful) return true;
    if (!airNames) {
      const pool = (['Kickflip', 'Heelflip', 'Pop Shove-it', 'Indy', 'Melon', 'Nosegrab', 'Tailgrab', 'FS 180', 'BS 180'] as TrickName[])
        .map((n) => (def.biome === 'snow' ? ({ Kickflip: 'BS Shifty', Heelflip: 'FS Shifty', 'Pop Shove-it': 'Tuck Knee' } as Record<string, TrickName>)[n] ?? n : n));
      switch (g.kind) {
        case 'trick': airNames = [pickFrom(members(g.match))]; break;
        case 'sameAir': airNames = g.match.map((m) => pickFrom(members(m))); break;
        case 'allOf': { const left = g.names.filter((n) => !landed.has(n)); airNames = left.length ? [pickFrom(left)] : [pickFrom(g.names)]; break; }
        case 'everyKicker': airNames = g.match ? [pickFrom(members(g.match))] : ['Ollie']; break;
        case 'variety': airNames = [pickFrom(pool.filter((n) => !landed.has(n)))]; break;
        case 'combo': airNames = [pickFrom(g.include?.filter((m) => !['grind', 'manual', 'loop'].includes(m)).flatMap((m) => members(m)) ?? pool)]; break;
        default: return undefined;
      }
      airNames = airNames.filter((n) => n !== 'Ollie');
    }
    if (!airNames.length) return true;
    const filters = g as { overGap?: unknown; from?: string; fromRail?: boolean; minTime?: number };
    const f = flight();
    if (filters.overGap && !track.pits.some((p) => p.x0 > takeoffX - 0.6 && p.x1 < f.x)) return true;
    if (filters.from && !track.spots.some((sp) => sp.tag === filters.from && takeoffX > sp.x - 2.5 && takeoffX < sp.x + 1)) return true;
    const hold = Math.max(0.3, (filters.minTime ?? 0) + 0.15);
    const need = Math.max(...airNames.map((n) => trickTime(n, hold))) + (airNames.length > 1 ? 0.1 : 0);
    if (f.time - REACTION - JITTER < need) return true;
    airNames.forEach((n, k) => { for (const [a, d] of trickActs(n, hold)) press(a, d + k * 0.06); });
    trickPlanned = true;
    return true;
  }

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
      const [kind, arg] = act.split(':') as [string, Swipe];
      if (act === 'pump') r.pump();
      else if (kind === 'grab' && arg) r.grabSwipe(arg);
      else if (kind === 'spin' && arg) r.spinSwipe(arg as 'left' | 'right');
      else if (kind === 'spin360') { r.spinSwipe(arg as 'left' | 'right'); r.spinMore(); }
      else if (kind === 'flick') { r.swipe(arg); r.release(); }
      else if (act === 'grab') r.grabSwipe((['up', 'down', 'left', 'right'] as const)[Math.floor(rand() * 4)]);
      else if (act === 'spin') {
        r.spinSwipe(rand() > 0.5 ? 'left' : 'right');
        // A long swipe on a big air makes it a 360.
        if (r.vy > 5 && rand() > 0.5) r.spinMore();
      }
      else { r.swipe(act as Swipe); r.release(); } // a flick, not a grab
    }

    // Decide. Looks ahead by where it will be when the input lands.
    // Tap to drop in, a moment after the run starts.
    if (r.perched && !queue.some((q) => q.act === 'pump')) press('pump');
    if (!r.falling && !r.bailing && !r.perched && r.dropT < 0) {
      const dir = Math.sign(r.v) || 1;
      const lead = Math.abs(r.v) * REACTION;
      // On a rail, sometimes switch to a fancier grind.
      if (r.grind && r.grind.t < 0.05 && !grindStyled && !(G?.kind === 'grind' && G.seconds) && rand() < 0.5) {
        press((['left', 'right', 'down'] as const)[Math.floor(rand() * 3)]);
        grindStyled = true;
      }
      if (!r.grind) grindStyled = false;
      // Off the end of a rail with a trick to do: ollie off just before it ends.
      if (r.grind && G && 'fromRail' in G && G.fromRail && r.grind.rail.x1 - r.x < Math.abs(r.v) * REACTION + 0.4 && t - grindLeft > 1) {
        press('up');
        grindLeft = t;
      }
      if (r.grounded) {
        trickPlanned = false;
        if (t - railOllieAt > REACTION + JITTER + 0.1) railOllie = false;
        const slopeThen = track.slope(r.x + lead * dir) * dir;
        if (slopeThen < -0.12 && t - lastPumpDecision > 0.45) { press('pump'); lastPumpDecision = t; }
        // Pop at the lip: decide when the lip is about one reaction-time away.
        const lip = isPipe || pumpOnly ? null : nextLip(track, r.x, lead + 1.5);
        if (lip !== null && t - lipPlanned > 0.6 && Math.abs(lip - lead) < 0.6 + r.v * 0.04) {
          press('up');
          lipPlanned = t;
        }
        // Ollie onto a rail coming up, timed so you come down near its start.
        const rail = railTry ? track.rails.find((rl) => !railsTried.has(rl) && rl.x0 > r.x && rl.x0 - r.x < lead + 12) : undefined;
        if (rail) {
          // Swipe once the rail is about half a second away, as a player would on seeing it.
          if (rail.x0 - r.x - lead < Math.abs(r.v) * 0.5) { press('up'); railsTried.add(rail); railOllie = true; railOllieAt = t; }
        }
        // Manual along a flat stretch with no jump coming up.
        const flat = [0, 1, 2, 3, 4].every((d) => Math.abs(track.slope(r.x + d * dir)) < 0.08);
        if (wantManual && !rail) {
          const c = G as Challenge & { seconds?: number; name?: string; pad?: boolean };
          const lean = c.name === 'Nose Manual' || c.name === 'Nose Press' ? 'lean-' : c.kind === 'combo' ? pickFrom(['lean+', 'lean-']) : 'lean+';
          const pad = track.pads.find((p) => p.x0 > r.x && p.x0 - r.x < lead + 0.3);
          const hold = (c.seconds ?? 0.6) + 0.35;
          const room = [...Array(Math.ceil(Math.abs(r.v) * (hold + REACTION)) + 1).keys()].every((d) => Math.abs(track.slope(r.x + d * dir)) < 0.08);
          if (pad && t - manualPlanned > 1) {
            press(lean);
            press('lean0', (pad.x1 - pad.x0) / Math.max(1, Math.abs(r.v)) + 0.3);
            manualPlanned = t;
          } else if (!c.pad && room && nextLip(track, r.x, Math.abs(r.v) * (hold + REACTION)) === null && t - manualPlanned > hold + 0.8) {
            press(lean);
            press('lean0', hold);
            manualPlanned = t;
          }
        } else if (!careful && !pumpOnly && !rail && flat && nextLip(track, r.x, 6) === null && t - manualPlanned > 3 && rand() < 0.02) {
          press(rand() > 0.5 ? 'lean+' : 'lean-');
          press('lean0', 0.6);
          manualPlanned = t;
        }
      } else if (G && !pumpOnly && !trickPlanned && (!railOllie || ('fromRail' in G && G.fromRail)) && r.airTime > 0.02 && goalAir() !== undefined) {
        // Handled by goalAir.
      } else if (!careful && !pumpOnly && !trickPlanned && !railOllie && r.vy > 3 && r.airTime > 0.05) {
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

    if (TRACE) prevState = `${state(r)} lean=${r.lean} flipT=${r.flipT.toFixed(2)} air=${r.airTime.toFixed(2)} v=${r.vx.toFixed(1)},${r.vy.toFixed(1)}`;
    const before = r.x;
    const slopeBefore = track.slope(r.x) * (Math.sign(r.v) || 1);
    r.update(DT);
    if (wasGrounded && !r.grounded) { takeoffSlope = slopeBefore; takeoffX = r.x; }
    if (r.grounded || r.grind) airNames = null;
    wasGrounded = r.grounded;
    score.update(DT, r.grounded && !r.manual);
    if (alive()) chal.tick(DT, r);
    // How much of each rail a grind covered.
    if (grindFrom && !r.grind) {
      const rl = grindFrom.rail;
      res.coverage.push(Math.min(1, (Math.min(r.x, rl.x1) - grindFrom.x) / (rl.x1 - rl.x0)));
      grindFrom = null;
    }
    if (skater) checkLegs(skater, r, track, trackId, t);
    t += DT;
    if (!r.grounded) peakAboveLip = Math.max(peakAboveLip, r.y - track.maxY);
    if (r.grounded && track.slope(r.x) < -0.12) downT += DT;
    else if (downT > 0) { if (downT > 0.1) res.downs.push(downT); downT = 0; }
    // Sudden stops, measured on forward (horizontal) speed so landings don't count.
    // Signed, so rolling back down a slope after a bail doesn't read as a stop.
    const fwd = r.grounded ? r.v * Math.cos(Math.atan(track.slope(r.x))) : r.grind ? r.v : r.vx;
    if (r.falling || r.bailing || r.loop || track.pitAt(r.x)) recent = [];
    else {
      recent.push({ t, s: fwd });
      while (recent[0].t < t - STOP_WINDOW) recent.shift();
      const peak = Math.max(...recent.map((e) => e.s));
      if (!isPipe && peak > 5 && fwd < peak * STOP_SHARE) { res.stops.push(+r.x.toFixed(1)); stopNotes.push(`${trackId} x=${r.x.toFixed(1)} ${peak.toFixed(1)}->${fwd.toFixed(1)} ${state(r)}`); recent = []; }
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
  if (TRACE && isPipe) console.log("peak", peakAboveLip.toFixed(2));
  res.finished = isPipe ? peakAboveLip >= 1 && tricks >= 5 : r.x >= track.finishX && res.livesLost < LIVES;
  score.bank();
  if (isPipe || res.finished) chal.finish();
  res.chal = [...chal.done];
  res.score = score.total;
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
  // Every rail should be reachable with a human-timed ollie.
  // Loops must go round with ordinary pumping, for the bot that tricks and the one that only pumps.
  const all = [...results, ...pumpers];
  const tried = all.reduce((s, r) => s + r.loopsTried, 0), done = all.reduce((s, r) => s + r.loopsDone, 0);
  if (track.loops.length && done < tried * MIN_LOOP_RATE) problems.push(`loops made ${(done / tried * 100).toFixed(0)}% of the time`);
  // Rail assist should put you on near the start, not catching the last metre.
  const cov = results.flatMap((r) => r.coverage);
  const avgCov = cov.length ? cov.reduce((a, b) => a + b, 0) / cov.length : 1;
  if (cov.length && avgCov < MIN_GRIND_COVER) problems.push(`grinds cover only ${(avgCov * 100).toFixed(0)}% of the rail on average`);
  track.rails.forEach((rl, i) => {
    if (!results.some((r) => r.railHits[i] > 0)) problems.push(`no run managed to grind the ${rl.kind} at ${rl.x0.toFixed(0)} m`);
  });
  const dips = [...results, ...pumpers].flatMap((r) => r.dipLaunches);
  if (dips.length) problems.push(`thrown over a dip onto its upslope at ${[...new Set(dips.map((x) => Math.round(x)))].join(', ')} m (soften the dip's top edge)`);
  // Gentle tracks: you can finish without ever ollieing, and without losing a life.
  // (Gaps need an ollie, so a track with gaps is past this stage, whatever its number.)
  if ((def.difficulty ?? 10) <= PUMP_ONLY_MAX_DIFFICULTY && !track.pits.length && pumpers.some((r) => !r.finished || r.livesLost > 0)) {
    problems.push(`pump-only bot lost a life or didn't finish (difficulty ${def.difficulty} must be rideable without ollies)`);
  }
  // Challenges: each required one done by the bot going for it often enough, each optional one at least once.
  const chs = def.challenges ?? [];
  const need = requiredCount(BIOME_ORDER.indexOf(def.biome), def.kind ?? 'run');
  const runIndex = TRACKS.filter((t) => t.biome === def.biome && (t.kind ?? 'run') === 'run').indexOf(def);
  const chalNotes: string[] = [];
  chs.forEach((c, i) => {
    if (i < need) {
      const tries = Array.from({ length: CHALLENGE_RUNS }, (_, k) => play(def.id, 9000 + k * 7919 + i * 31, false, false, i));
      const rate = tries.filter((r) => r.chal[i]).length / tries.length;
      const min = def.biome === 'park' && runIndex < 6 ? MIN_EASY_CHALLENGE_RATE : MIN_CHALLENGE_RATE;
      chalNotes.push(`${i + 1}:${(rate * 100).toFixed(0)}%`);
      if (rate < min) problems.push(`required challenge ${i + 1} "${c.text}" done in ${(rate * 100).toFixed(0)}% of tries (needs ${min * 100}%)`);
    } else {
      let got = results.some((r) => r.chal[i]);
      let k = 0;
      for (; !got && k < OPTIONAL_TRIES; k++) got = play(def.id, 20000 + k * 7919 + i * 31, false, false, i).chal[i];
      chalNotes.push(`${i + 1}:${got ? 'ok' : 'no'}`);
      if (!got) problems.push(`optional challenge ${i + 1} "${c.text}" never done in ${OPTIONAL_TRIES} tries`);
    }
  });
  const scores = results.map((r) => r.score).sort((a, b) => a - b);
  const p75 = scores[Math.floor(scores.length * 0.75)];
  if (stops.length) problems.push(`sudden stops at ${[...new Set(stops.map((x) => Math.round(x)))].join(', ')} m`);
  const bails = results.reduce((s, r) => s + r.bails, 0) / RUNS;
  const lost = results.reduce((s, r) => s + r.livesLost, 0) / RUNS;
  const status = problems.length ? 'FAIL' : 'ok  ';
  console.log(`${status} ${def.id.padEnd(12)} median ${median.toFixed(1)}s  bails/run ${bails.toFixed(1)}  lives lost/run ${lost.toFixed(1)}  downslope ${downMedian.toFixed(2)}s  loops ${track.loops.length ? (all.reduce((s, r) => s + r.loopsDone, 0) / Math.max(1, all.reduce((s, r) => s + r.loopsTried, 0)) * 100).toFixed(0) + '%' : '-'}  grinds/run ${(results.reduce((s, r) => s + r.grinds, 0) / RUNS).toFixed(1)}/${track.rails.length} (${(avgCov * 100).toFixed(0)}%)  gaps ${pitRates.map((r) => (r * 100).toFixed(0) + '%').join(' ') || '-'}${chs.length ? `  challenges ${chalNotes.join(' ')}  p75 ${Math.round(p75 / 500) * 500}${def.par ? '/' + def.par : ''}` : ''}`);
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
  const missing = ['Manual', 'Nose Manual', 'Backflip', 'Frontflip', 'FS 180', 'BS 180', 'FS 360', 'BS 360', 'Indy', 'Melon', 'Nosegrab', 'Tailgrab', 'BS Shifty', 'Tuck Knee', 'Tail Press', 'Nose Press', '50-50', 'Boardslide', '5-0', 'Nosegrind'].filter((n) => !seen.get(n));
  if (missing.length) { console.log(`never landed: ${missing.join(', ')}`); failed = true; }
}

if (failed) {
  console.log('\nSome tracks are too hard for a human-speed player.');
  process.exit(1);
}
