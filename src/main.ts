import * as THREE from 'three';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { Rider, Trick, Lean } from './rider';
import { Score, ComboView } from './score';
import { Input } from './input';
import { Tilt } from './tilt';
import { Lives, LIVES } from './lives';
import { World } from './world';
import { Skater } from './skater';
import { loadAssets } from './assets';
import { TRACKS, TrackDef, PIPE_TIME } from './tracks';
import { Progress } from './progress';
import { MegaRun, MEGA_DROPS } from './mega';
import { ChallengeRun, icon } from './challenges';
import { BIOMES, BIOME_ORDER } from './biomes';
import { biomeFor } from './moods';
import { Track } from './track';
import { watchForUpdates } from './version';
import { Replays, Player, Clip, HudSnap, MAX_CLIPS } from './replay';

const $ = (id: string) => document.getElementById(id)!;
const progress = new Progress(TRACKS, BIOME_ORDER, (() => { try { return localStorage; } catch { return null; } })());
progress.migrate();
const starsHtml = (n: number) => '<span class="stars">' + [1, 2, 3].map((i) => (i <= n ? '&#9733;' : '&#9734;')).join('') + '</span>';
const fmt = (n: number) => Math.round(n).toLocaleString('en-GB');

const canvas = $('game') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const effect = new OutlineEffect(renderer, { defaultThickness: 0.006, defaultColor: [0.1, 0.08, 0.08] });

const scene = new THREE.Scene();
const hemi = new THREE.HemisphereLight(0xdff3ff, 0x6b8f4e, 1.4);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-6, 12, 10);
scene.add(sun);
scene.add(sun.target);

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);

const assets = await loadAssets();
let def: TrackDef = TRACKS[0];
let track: Track = def.build();
let world = new World(track, biomeFor(BIOMES[def.biome], def.id), assets.props, def.id);
world.applyEnvironment(scene, hemi, sun);
scene.add(world.group);

const score = new Score();
const timeLabel = document.querySelector('#hud .time small') as HTMLElement;
const hud = {
  score: $('score'), time: $('time'), combo: $('combo'), popups: $('popups'),
  speed: $('speedbar'), progress: $('progressbar'), cue: $('pumpcue'),
};

function popup(text: string, cls = '') {
  replays.popup(text, cls);
  const el = document.createElement('div');
  el.className = 'popup ' + cls;
  el.textContent = text;
  hud.popups.appendChild(el);
  setTimeout(() => el.remove(), 950);
}

let comboHold = 0;
// What the combo readout shows, kept for replays.
let comboSnap: HudSnap | null = null;
function showCombo(v: ComboView | null, cls = '') {
  const html = v ? `<div class="names">${v.names.join(' + ')}</div><div class="pts">${fmt(v.base)} <em>x${v.mult}</em></div>` : '';
  if (html === (comboSnap?.html ?? '') && cls === (comboSnap?.cls ?? '')) return;
  comboSnap = v ? { html, cls } : null;
  hud.combo.className = cls;
  hud.combo.innerHTML = html;
}
score.onBank = (pts, v) => {
  chal.bank(pts);
  showCombo(v, 'banked'); comboHold = 1.1;
  if (v.mult > 1) popup(`+${fmt(pts)}`, 'big');
  replays.bank(pts, v.names, def.kind === 'pipe');
};
score.onLost = (v) => {
  chal.lost(); showCombo(v, 'lost'); comboHold = 1.1; replays.lost(); };

const rider = new Rider(track, {
  trick(t: Trick) { chal.trick(t); replays.trick(t.duration, rider.grounded); score.addTrick(t); if (t.axis !== 'grab' && t.axis !== 'manual') popup(t.name); },
  grab(name) { popup(name + '!'); },
  manual(name) { popup(name + '!'); },
  land({ airTime, smooth, peakY }) {
    chal.land(rider.x);
    if (def.kind === 'pipe') {
      const h = peakY - track.maxY;
      if (h > 0.5) score.addBonus(`Air ${h.toFixed(1)}m`, Math.round(h * 150));
      // Each air in the pipe scores on its own as you land it.
      score.bank();
    } else if (airTime > 0.7) score.addBonus(`Air ${airTime.toFixed(1)}s`, Math.round(airTime * 120));
    if (smooth) { score.addBonus('Smooth', 75); popup('Smooth landing', 'good'); }
  },
  bail() { chal.bail(); score.lose(); popup('BAIL!', 'bad'); loseLife(); },
  pump(good) { chal.pump(good); if (good) popup('Pump!', 'good'); },
  fall() {
    chal.fall(rider.x); score.lose(); popup(rider.loopFall ? 'WIPEOUT!' : world.biome.fallText, 'bad');
    // On a mega ramp a fall just ends that drop.
    if (def.kind !== 'mega') { respawnTimer = 1.2; loseLife(); }
  },
});
let respawnTimer = 0;
let mega = new MegaRun();

// This run's challenges: saved the moment each one is done, even if you then run out of lives.
let chal = new ChallengeRun([], track);
function newChallenges() {
  chal = new ChallengeRun(def.challenges ?? [], track, progress.challenges(def), def.kind === 'pipe');
  chal.onDone = (i) => {
    progress.markChallenge(def, i);
    popup('CHALLENGE!', 'challenge');
    drawChallenges(i);
  };
  drawChallenges();
}
let chalHud = '';
function drawChallenges(popped = -1) {
  const html = chal.list.map((c, i) => {
    const got = chal.done[i];
    const n = chal.progress(i);
    return `<span class="${got ? 'got' : ''}${i === popped ? ' pop' : ''}">${icon(c)}<b>${got ? '&#10003;' : n ?? '&#9675;'}</b></span>`;
  }).join('');
  if (html === chalHud && popped < 0) return;
  chalHud = html;
  $('chal').innerHTML = html;
}
/** The challenge list for the card and results: icon, text, tick, and needed / NEW! badges. */
function challengeList(d: TrackDef, done: boolean[], fresh: boolean[] = []) {
  const need = progress.required(d);
  return (d.challenges ?? []).map((c, i) =>
    `<li class="${done[i] ? 'got' : ''}"><span class="ic">${icon(c)}</span><span class="tx">${c.text}</span>`
    + `${fresh[i] ? '<span class="new">NEW!</span>' : i < need && !done[i] ? '<span class="need">NEEDED</span>' : ''}`
    + `<span class="tick">${done[i] ? '&#10004;' : '&#9675;'}</span></li>`).join('');
}

let toastTimer = 0;
function toast(html: string) {
  const el = $('toast');
  el.innerHTML = html;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.add('hidden'), 2600);
}

// Three lives a run; see lives.ts.
const lives = new Lives();
function drawLives(hit = false) {
  const el = $('lives');
  el.innerHTML = !lives.enabled ? '' : Array.from({ length: LIVES }, (_, i) => `<span${i < lives.left ? '' : ' class="gone"'}>&#9829;</span>`).join('');
  el.classList.remove('hit');
  if (hit) { void el.offsetWidth; el.classList.add('hit'); }
}
function loseLife() {
  if (state !== 'playing' || finishTimer > 0) return;
  const last = lives.lose();
  drawLives(true);
  if (last) { rider.setLean(0); popup('OUT OF LIVES', 'big'); }
}

function loadTrack(d: TrackDef) {
  if (d !== def) {
    def = d;
    scene.remove(world.group);
    track = d.build();
    world = new World(track, biomeFor(BIOMES[d.biome], d.id), assets.props, d.id);
    world.applyEnvironment(scene, hemi, sun);
    scene.add(world.group);
  }
  const b = BIOMES[d.biome];
  rider.track = track;
  const isPipe = d.kind === 'pipe', isMega = d.kind === 'mega';
  const snow = d.biome === 'snow';
  // Mega ramps are smooth and fast.
  rider.opts = { friction: isMega ? 0.6 : b.friction, maxSpeed: isPipe ? 12.5 : isMega ? 22 : b.maxSpeed, pipe: isPipe, mega: isMega, snow };
  skater.setSnow(snow);
  rider.reset();
  // Half pipes start up on the coping: the first tap drops you in.
  if (isPipe || isMega) rider.perch();
  camPos.set(track.startX + 3, track.height(track.startX) + 2, 12);
}

const skater = new Skater(assets.parts);
scene.add(skater.root, skater.shadowMesh);

// Big combos are recorded for slow-motion replays: see replay.ts.
const replays: Replays = new Replays(skater.joints, camera, skater.shadowMesh);
const player = new Player(replays, () => replays.clips);
const chip = $('replaychip');
let chipClip: Clip | null = null;
let chipTimer = 0;
replays.onClip = (c) => {
  if (state !== 'playing') return;
  chipClip = c;
  chipTimer = 5;
  chip.classList.remove('hidden');
};
function hideChip() { chipTimer = 0; chipClip = null; chip.classList.add('hidden'); }
/** Where the replay was opened from, to go back to. */
let replayFrom: State | null = null;
/** A moment's pause back in the run after a replay, so you're ready to ride. */
let resumeTimer = 0;
function watchReplay(c: Clip | undefined) {
  if (!c || state === 'replay') return;
  replayFrom = state;
  state = 'replay';
  hideChip();
  $('hud').classList.add('hidden');
  $('results').classList.add('hidden');
  $('menu').classList.add('hidden');
  player.show(c, camPos);
}
player.onClose = () => {
  state = replayFrom ?? 'playing';
  replayFrom = null;
  $('hud').classList.remove('hidden');
  if (state === 'finished') show('results');
  else {
    $('menu').classList.remove('hidden');
    // Anything held when the replay opened has been let go of by now.
    if (rider.grab) rider.release();
    keyLean = 0;
    applyLean();
    resumeTimer = 0.8;
    popup('GO!', 'big');
  }
};
chip.addEventListener('click', () => watchReplay(chipClip ?? replays.clips[0]));
$('watch').addEventListener('click', () => { replays.flush(); watchReplay(replays.clips[0]); });

type State = 'title' | 'select' | 'playing' | 'finished' | 'replay';
let state: State = 'title';
let time = 0;
let finishTimer = 0;

const input = new Input(canvas);
// Gameplay input only reaches the rider while you're riding with lives left.
const canRide = () => state === 'playing' && resumeTimer <= 0 && lives.controllable && !(def.kind === 'mega' && mega.ending);
input.onPump = () => { if (canRide()) { rider.pump(); skater.pumpKick(); } };
input.onSwipe = (d) => { if (canRide()) rider.swipe(d); };
input.onGrab = (d) => { if (canRide()) rider.grabSwipe(d); };
input.onRelease = () => { if (canRide()) rider.release(); };
input.onSpin = (d) => { if (canRide()) rider.spinSwipe(d); };
input.onSpinMore = () => { if (canRide()) rider.spinMore(); };
// Lean from the keyboard or from tilting the device, whichever is tipped.
let keyLean: Lean = 0, tiltLean: Lean = 0;
const applyLean = () => rider.setLean(canRide() ? keyLean || tiltLean : 0);
input.onLean = (l) => { keyLean = l; applyLean(); };
const tilt = new Tilt();
tilt.onLean = (l) => { tiltLean = l; applyLean(); };

const panels = ['title', 'select', 'card', 'results', 'guide'];
function show(panel: string | null) {
  for (const p of panels) $(p).classList.toggle('hidden', p !== panel);
  $('menu').classList.toggle('hidden', panel !== null);
}

function start(d: TrackDef = def) {
  loadTrack(d);
  score.reset();
  time = 0;
  finishTimer = 0;
  respawnTimer = 0;
  lives.reset((d.kind ?? 'run') === 'run');
  mega = new MegaRun();
  replays.reset();
  hideChip();
  resumeTimer = 0;
  drawLives();
  newChallenges();
  showCombo(null);
  // However the device is being held right now counts as level.
  tilt.calibrate();
  $('trackname').textContent = d.name;
  show(null);
  state = 'playing';
}

/** Before a run: the track's challenges, then GO. Tracks without challenges go straight in. */
let cardDef: TrackDef | null = null;
function showCard(d: TrackDef) {
  if (!d.challenges?.length) { start(d); return; }
  cardDef = d;
  const b = BIOMES[d.biome];
  const runs = TRACKS.filter((t) => t.biome === d.biome && (t.kind ?? 'run') === 'run');
  const n = runs.indexOf(d);
  $('c-name').textContent = d.name;
  const mood = biomeFor(b, d.id).mood;
  $('c-world').textContent = (n >= 0 ? `${b.name} ${n + 1}` : `${b.name} bonus`) + (mood ? ` \u00b7 ${mood}` : '');
  $('c-list').innerHTML = challengeList(d, progress.challenges(d));
  show('card');
  state = 'select';
}

function openSelect() {
  const list = $('tracklist');
  list.innerHTML = '';
  let scrollTo: HTMLElement | null = null;
  BIOME_ORDER.forEach((id, bi) => {
    const b = BIOMES[id];
    const tracks = TRACKS.filter((t) => t.biome === id);
    if (!tracks.length) return;
    const open = progress.biomeOpen(id);
    const row = document.createElement('div');
    row.className = 'biome' + (open ? '' : ' locked');
    row.style.setProperty('--swatch', b.swatch);
    const runs = tracks.filter((t) => (t.kind ?? 'run') === 'run');
    const got = tracks.reduce((n, t) => n + progress.stars(t), 0);
    const hint = open ? b.blurb : `Complete track 5 of ${BIOMES[BIOME_ORDER[bi - 1]].name} to open`;
    row.innerHTML = `<div class="biome-head"><b>${open ? '' : '&#128274; '}${b.name}</b><span>${hint}</span><i>${got} / ${tracks.length * 3} &#9733;</i></div>`;
    const btns = document.createElement('div');
    btns.className = 'tracks';
    for (const t of tracks) {
      const btn = document.createElement('button');
      const best = progress.best(t.id);
      const bonus = (t.kind ?? 'run') !== 'run';
      const tag = bonus ? 'BONUS' : String(runs.indexOf(t) + 1);
      const unlocked = progress.unlocked(t);
      if (bonus) btn.classList.add('bonus');
      if (!unlocked) {
        btn.classList.add('locked');
        btn.innerHTML = `<small>${tag}</small>&#128274;<em>${bonus ? 'Track 3 opens it' : 'Locked'}</em>`;
        btn.addEventListener('click', () => toast(lockHint(t)));
      } else {
        btn.innerHTML = `<small>${tag}</small>${t.name}<em>${progress.done(t.id) ? starsHtml(progress.stars(t)) + (best ? ' ' + fmt(best) : '') : 'New'}</em>`;
        btn.addEventListener('click', () => showCard(t));
        // Land on the newest open track in the furthest world you've reached.
        if (!bonus && !progress.done(t.id)) scrollTo = btn;
      }
      btns.appendChild(btn);
    }
    row.appendChild(btns);
    list.appendChild(row);
  });
  show('select');
  state = 'select';
  (scrollTo as HTMLElement | null)?.scrollIntoView({ block: 'center', inline: 'center' });
}

/** What to do to open a locked track, e.g. "Do challenge 1 on Grab Bag to open this". */
function lockHint(t: TrackDef): string {
  const g = progress.gate(t) as TrackDef | null;
  if (!g) return 'Locked';
  const m = progress.missing(g);
  const what = m.finish ? `Finish <b>${g.name}</b>`
    : `Do challenge ${m.challenges.map((i) => i + 1).join(' and ')} on <b>${g.name}</b>`;
  return `&#128274; ${what} to open this`;
}

/** The next run track in this world, or the first open one in the next world. */
function nextTrack(): TrackDef | null {
  const runs = TRACKS.filter((t) => (t.kind ?? 'run') === 'run');
  const i = runs.findIndex((t) => t.id === def.id);
  const after = i >= 0 ? runs.slice(i + 1) : runs.filter((t) => t.biome === def.biome);
  return after.find((t) => progress.unlocked(t) && !progress.done(t.id)) ?? after.find((t) => progress.unlocked(t)) ?? null;
}

function finish(out = false) {
  score.bank();
  state = 'finished';
  const best = progress.best(def.id);
  const total = score.total;
  const wasOpen = TRACKS.filter((t) => progress.unlocked(t)).length;
  // Running out of lives doesn't count as finishing, or towards your best.
  if (!out) chal.finish();
  if (!out) progress.record(def.id, total);
  const opened = TRACKS.filter((t) => progress.unlocked(t)).length - wasOpen;
  const next = out ? null : nextTrack();
  $('results').classList.toggle('out', out);
  $('next').classList.toggle('hidden', !next);
  $('again').textContent = out ? 'TRY AGAIN' : 'RIDE AGAIN';
  $('again').classList.toggle('alt', !out);
  $('r-title').textContent = out ? 'OUT OF LIVES!' : def.kind === 'pipe' ? "TIME'S UP!" : def.kind === 'mega' ? 'ALL DROPS DONE!' : 'FINISHED!';
  $('r-track').textContent = def.name;
  $('r-score').textContent = fmt(total);
  $('r-time').textContent = time.toFixed(1) + 's';
  $('r-combo').textContent = fmt(score.bestCombo);
  $('r-chal').innerHTML = challengeList(def, chal.done, chal.fresh);
  const m = progress.missing(def);
  const todo = !out && (def.kind ?? 'run') === 'run' && m.challenges.length
    ? `<br><span class="todo">Do challenge ${m.challenges.map((i) => i + 1).join(' and ')} to open the next track</span>` : '';
  const kept = chal.fresh.some(Boolean) ? 'Your new challenges are saved!<br>' : '';
  $('r-best').innerHTML = out ? `${kept}Start the level again to finish it`
    : `${starsHtml(progress.starsFor(def, total))}<br>${total > best ? 'NEW BEST!' : `Best: ${fmt(best)}`}${def.par ? ` &middot; Par ${fmt(def.par)}` : ''}${opened > 0 ? '<br><b class="unlocked">NEXT TRACK UNLOCKED!</b>' : todo}`;
  if (next) $('next').textContent = `NEXT: ${next.name.toUpperCase()}`;
  hideChip();
  watchCount = -1;
  // The run's last combo banks just now, so its replay is cut when you ask to watch.
  updateWatch();
  show('results');
}

let watchCount = -1;
function updateWatch() {
  const n = Math.min(replays.clips.length + replays.waiting, MAX_CLIPS);
  if (n === watchCount) return;
  watchCount = n;
  $('watch').classList.toggle('hidden', n === 0);
  $('watch').innerHTML = n > 1 ? `&#9654; WATCH REPLAYS (${n})` : '&#9654; WATCH REPLAY';
}

$('play').addEventListener('click', openSelect);
$('guidebtn').addEventListener('click', () => show('guide'));
$('guideback').addEventListener('click', () => show('title'));
$('again').addEventListener('click', () => start(def));
$('next').addEventListener('click', () => { const n = nextTrack(); if (n) showCard(n); });
$('go').addEventListener('click', () => { if (cardDef) start(cardDef); });
$('cardback').addEventListener('click', openSelect);
// Grown-ups: hold the title for two seconds to open (or close again) every track.
let holdTimer = 0;
const title = document.querySelector('#title h1') as HTMLElement;
title.addEventListener('pointerdown', () => {
  holdTimer = window.setTimeout(() => {
    progress.unlockAll = !progress.unlockAll;
    toast(progress.unlockAll ? 'Every track is open' : 'Tracks open as you play again');
  }, 2000);
});
for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) title.addEventListener(ev, () => clearTimeout(holdTimer));
$('tracks').addEventListener('click', openSelect);
$('menu').addEventListener('click', openSelect);
$('back').addEventListener('click', () => { show('title'); state = 'title'; });
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyR' && (state === 'playing' && chipClip || state === 'finished')) { replays.flush(); watchReplay(chipClip ?? replays.clips[0]); }
  else if (e.code === 'Escape' && state === 'playing') openSelect();
  else if ((e.code === 'Enter' || e.code === 'Space') && state === 'title') { e.preventDefault(); openSelect(); }
  else if ((e.code === 'Enter' || e.code === 'Space') && state === 'finished') { e.preventDefault(); start(def); }
  else if ((e.code === 'Enter' || e.code === 'Space') && !$('card').classList.contains('hidden') && cardDef) { e.preventDefault(); start(cardDef); }
});

watchForUpdates(() => state === 'playing' || replayFrom === 'playing', openSelect);

// Camera follows from the side, pulling back and looking ahead with speed.
const camPos = new THREE.Vector3(track.startX + 3, track.height(track.startX) + 2, 12);
const camLook = new THREE.Vector3();
let camOverride: { pos: number[]; look: number[] } | null = null;
function updateCamera(dt: number) {
  const sunOff = world.biome.sunPos ?? [-6, 12, 10];
  if (camOverride) {
    camera.position.fromArray(camOverride.pos);
    camera.lookAt(new THREE.Vector3().fromArray(camOverride.look));
    return;
  }
  const aspect = camera.aspect;
  if (def.kind === 'pipe') {
    // Frame the whole pipe, rising to follow big airs.
    const lip = track.maxY;
    const halfW = 7.8;
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const fitW = halfW / (tanH * aspect);
    const fitH = (lip + 5) / 2 / tanH;
    const pd = Math.max(fitW, fitH, 12);
    const py = (track.minY + lip) / 2 + 1.2 + Math.max(0, rider.y - lip) * 0.6;
    const px = track.startX + (rider.x - track.startX) * 0.25;
    const kk = 1 - Math.exp(-dt * 3);
    camPos.x += (px - camPos.x) * kk;
    camPos.y += (py - camPos.y) * kk;
    camPos.z += (pd - camPos.z) * kk;
    camera.position.set(camPos.x, camPos.y + 1, camPos.z);
    camLook.set(camPos.x, camPos.y, 0);
    camera.lookAt(camLook);
    sun.position.set(camPos.x + sunOff[0], camPos.y + sunOff[1], sunOff[2]);
    sun.target.position.set(camPos.x, camPos.y, 0);
    return;
  }
  const spd = rider.speed;
  const portrait = aspect < 1 ? 1 / aspect : 1;
  // Mega ramps: pull right back for the huge airs, keeping the ground below in view.
  const high = def.kind === 'mega' ? Math.max(0, rider.y - track.height(rider.x)) : 0;
  const dist = (10 + spd * 0.25 + high * 1.3) * Math.min(1.9, portrait * 0.85 + 0.15);
  const ahead = (2.5 + spd * 0.18) * (aspect < 1 ? 0.45 : 1);
  const ground = track.height(rider.x + ahead);
  const focusY = Math.max(rider.y, ground) * 0.6 + Math.min(rider.y, ground) * 0.4 - high * 0.3;
  const target = new THREE.Vector3(rider.x + ahead, focusY + (aspect < 1 ? 0.2 : 1.6), dist);
  const k = 1 - Math.exp(-dt * 4);
  camPos.x += (target.x - camPos.x) * (1 - Math.exp(-dt * 10));
  camPos.y += (target.y - camPos.y) * k;
  camPos.z += (target.z - camPos.z) * k;
  camera.position.set(camPos.x, camPos.y + 1.2, camPos.z);
  camLook.set(camPos.x, camPos.y, 0);
  camera.lookAt(camLook);
  sun.position.set(camPos.x + sunOff[0], camPos.y + sunOff[1], sunOff[2]);
  sun.target.position.set(camPos.x, camPos.y, 0);
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w / h < 1 ? 50 : 40;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (state === 'replay') {
    // Replays pose the skater and camera themselves; the run waits, timer and all.
    const r = player.update(dt);
    world.update(r.dt, r.follow.x, r.follow.y);
    effect.render(scene, camera);
    requestAnimationFrame(frame);
    return;
  }

  if (resumeTimer > 0) resumeTimer -= dt;
  else if (state === 'playing') {
    // The half pipe clock starts once you drop in.
    if (!rider.perched) time += dt;
    if (lives.simulate(rider.bailing || rider.falling)) { rider.update(dt); chal.tick(dt, rider); }
    if (lives.out) {
      // Let the last crash play out, then show the Out of Lives screen.
      if (lives.tick(dt)) finish(true);
    } else if (respawnTimer > 0) {
      respawnTimer -= dt;
      if (respawnTimer <= 0) {
        const pit = rider.fallPit;
        if (pit) rider.respawn(pit.x1 + 1.5, 6);
        else rider.respawn(rider.x, 6);
      }
    }
    // A manual keeps the combo going on the ground.
    score.update(dt, rider.grounded && !rider.manual);
    if (def.kind === 'pipe') {
      if (time >= PIPE_TIME) { time = PIPE_TIME; finish(); }
    } else if (def.kind === 'mega') {
      const over = mega.update(dt, rider);
      if (mega.ending) score.bank();
      if (over) {
        score.bank();
        chal.newDrop();
        if (mega.next(rider)) popup(`DROP ${mega.drop}!`, 'big');
        else finish();
      }
    } else if (rider.x >= track.finishX && finishTimer === 0 && !lives.out) finishTimer = 0.001;
    if (finishTimer > 0) {
      finishTimer += dt;
      if (finishTimer > 1.2 && rider.grounded) finish();
    }
  } else if (state === 'finished' && !lives.out) {
    // Roll on past the finish line; after running out of lives everything stays frozen.
    rider.update(dt);
  }

  skater.update(dt, rider, (x) => track.height(x), (x) => track.slope(x));
  updateCamera(dt);
  // The camera itself, so scenery tied to the sky also follows a camera set by hand.
  world.update(dt, camera.position.x, camera.position.y - 1.2);
  if (state === 'playing' || state === 'finished') replays.record(dt, camPos, rider.grounded, comboSnap);
  if (chipTimer > 0) {
    chipTimer -= dt;
    if (chipTimer <= 0) hideChip();
  }
  if (state === 'finished') updateWatch();

  if (comboHold > 0) {
    comboHold -= dt;
    if (comboHold <= 0) showCombo(null);
  } else {
    const c = score.combo;
    // Show a grab or manual building up as you hold it.
    const holding = rider.grab ?? rider.manual ?? (rider.grind?.style ?? null);
    const pts = rider.grab ? rider.grabPoints : rider.manual ? rider.manualPoints : rider.grindPoints;
    if (holding) {
      const live = c ?? { names: [], base: 0, mult: 0 };
      showCombo({ names: [...live.names, `${holding} ${fmt(pts)}`], base: live.base + pts, mult: live.mult + 1 }, 'grabbing');
    } else showCombo(c);
  }
  // Tutorial cue: light up while the rider is heading down a slope and could pump.
  const cue = state === 'playing' && !!def.tutorial && rider.grounded && !rider.bailing && rider.pumpTimer === 0
    && track.slope(rider.x + rider.v * 0.12) * Math.sign(rider.v || 1) < -0.12;
  const dropIn = state === 'playing' && rider.perched;
  hud.cue.textContent = dropIn ? 'TAP TO DROP IN' : 'TAP!';
  hud.cue.classList.toggle('on', cue || dropIn);
  $('zones').classList.toggle('hidden', state !== 'playing');
  if (state === 'playing') drawChallenges();
  hud.score.textContent = fmt(score.total);
  hud.time.textContent = def.kind === 'pipe' ? Math.max(0, PIPE_TIME - time).toFixed(1) : def.kind === 'mega' ? `${mega.drop}/${MEGA_DROPS}` : time.toFixed(1);
  timeLabel.textContent = def.kind === 'mega' ? 'DROP' : 'TIME';
  hud.speed.style.width = `${Math.min(100, (rider.speed / 20) * 100)}%`;
  const prog = def.kind === 'pipe' ? time / PIPE_TIME : def.kind === 'mega' ? (mega.drop - 1 + Math.max(0, Math.min(1, rider.x / track.length))) / MEGA_DROPS : (rider.x - track.startX) / (track.finishX - track.startX);
  hud.progress.style.width = `${Math.min(100, prog * 100)}%`;

  effect.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Handy for automated play testing.
(window as unknown as { __game: unknown }).__game = {
  rider, score, skater, replays, start, watchReplay, get player() { return player; }, openSelect, loseLife, TRACKS, get track() { return track; }, get state() { return state; },
  setCamera(pos: number[] | null, look: number[] = []) { camOverride = pos ? { pos, look } : null; },
};
