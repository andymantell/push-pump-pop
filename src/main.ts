import * as THREE from 'three';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { Rider, Trick, Lean } from './rider';
import { Score, ComboView } from './score';
import { Input } from './input';
import { Tilt } from './tilt';
import { World } from './world';
import { Skater } from './skater';
import { loadAssets } from './assets';
import { TRACKS, TrackDef, PIPE_TIME } from './tracks';
import { BIOMES, BIOME_ORDER } from './biomes';
import { Track } from './track';
import { watchForUpdates } from './version';

const $ = (id: string) => document.getElementById(id)!;
const bestKey = (id: string) => `push-pump-pop-best-${id}`;

function loadBest(id: string): number {
  try { return Number(localStorage.getItem(bestKey(id))) || 0; } catch { return 0; }
}
function saveBest(id: string, v: number) {
  try { localStorage.setItem(bestKey(id), String(v)); } catch { /* storage unavailable */ }
}
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
let world = new World(track, BIOMES[def.biome], assets.props, def.id);
world.applyEnvironment(scene, hemi, sun);
scene.add(world.group);

const score = new Score();
const hud = {
  score: $('score'), time: $('time'), combo: $('combo'), popups: $('popups'),
  speed: $('speedbar'), progress: $('progressbar'), cue: $('pumpcue'),
};

function popup(text: string, cls = '') {
  const el = document.createElement('div');
  el.className = 'popup ' + cls;
  el.textContent = text;
  hud.popups.appendChild(el);
  setTimeout(() => el.remove(), 950);
}

let comboHold = 0;
function showCombo(v: ComboView | null, cls = '') {
  if (!v) { hud.combo.innerHTML = ''; return; }
  hud.combo.className = cls;
  hud.combo.innerHTML = `<div class="names">${v.names.join(' + ')}</div><div class="pts">${fmt(v.base)} <em>x${v.mult}</em></div>`;
}
score.onBank = (pts, v) => { showCombo(v, 'banked'); comboHold = 1.1; if (v.mult > 1) popup(`+${fmt(pts)}`, 'big'); };
score.onLost = (v) => { showCombo(v, 'lost'); comboHold = 1.1; };

const rider = new Rider(track, {
  trick(t: Trick) { score.addTrick(t); if (t.axis !== 'grab' && t.axis !== 'manual') popup(t.name); },
  grab(name) { popup(name + '!'); },
  manual(name) { popup(name + '!'); },
  land({ airTime, smooth, peakY }) {
    if (def.kind === 'pipe') {
      const h = peakY - track.maxY;
      if (h > 0.5) score.addBonus(`Air ${h.toFixed(1)}m`, Math.round(h * 150));
      // Each air in the pipe scores on its own as you land it.
      score.bank();
    } else if (airTime > 0.7) score.addBonus(`Air ${airTime.toFixed(1)}s`, Math.round(airTime * 120));
    if (smooth) { score.addBonus('Smooth', 75); popup('Smooth landing', 'good'); }
  },
  bail() { score.lose(); popup('BAIL!', 'bad'); loseLife(); },
  pump(good) { if (good) popup('Pump!', 'good'); },
  fall() { score.lose(); popup(world.biome.fallText, 'bad'); respawnTimer = 1.2; loseLife(); },
});
let respawnTimer = 0;

// Three lives a run: each bail or fall into a gap costs one, and losing the last
// ends the run so you start the level again. Half pipes are timed and have none.
const LIVES = 3;
let lives = LIVES;
let outTimer = 0;
function drawLives(hit = false) {
  const el = $('lives');
  el.innerHTML = def.kind === 'pipe' ? '' : Array.from({ length: LIVES }, (_, i) => `<span${i < lives ? '' : ' class="gone"'}>&#9829;</span>`).join('');
  el.classList.remove('hit');
  if (hit) { void el.offsetWidth; el.classList.add('hit'); }
}
function loseLife() {
  if (state !== 'playing' || def.kind === 'pipe' || outTimer > 0 || finishTimer > 0) return;
  lives--;
  drawLives(true);
  if (lives <= 0) { outTimer = 0.001; popup('OUT OF LIVES', 'big'); }
}

function loadTrack(d: TrackDef) {
  if (d !== def) {
    def = d;
    scene.remove(world.group);
    track = d.build();
    world = new World(track, BIOMES[d.biome], assets.props, d.id);
    world.applyEnvironment(scene, hemi, sun);
    scene.add(world.group);
  }
  const b = BIOMES[d.biome];
  rider.track = track;
  const isPipe = d.kind === 'pipe';
  rider.opts = { friction: b.friction, maxSpeed: isPipe ? 12.5 : b.maxSpeed, pipe: isPipe };
  rider.reset();
  if (isPipe) rider.v = 6;
  camPos.set(track.startX + 3, track.height(track.startX) + 2, 12);
}

const skater = new Skater(assets.parts);
scene.add(skater.root, skater.shadowMesh);

type State = 'title' | 'select' | 'playing' | 'finished';
let state: State = 'title';
let time = 0;
let finishTimer = 0;

const input = new Input(canvas);
input.onPump = () => { if (state === 'playing') { rider.pump(); skater.pumpKick(); } };
input.onSwipe = (d) => { if (state === 'playing') rider.swipe(d); };
input.onGrab = (d) => { if (state === 'playing') rider.grabSwipe(d); };
input.onRelease = () => { if (state === 'playing') rider.release(); };
input.onSpin = (d) => { if (state === 'playing') rider.spinSwipe(d); };
input.onSpinMore = () => { if (state === 'playing') rider.spinMore(); };
// Lean from the keyboard or from tilting the device, whichever is tipped.
let keyLean: Lean = 0, tiltLean: Lean = 0;
const applyLean = () => rider.setLean(keyLean || tiltLean);
input.onLean = (l) => { keyLean = l; applyLean(); };
const tilt = new Tilt();
tilt.onLean = (l) => { tiltLean = l; applyLean(); };

const panels = ['title', 'select', 'results'];
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
  lives = LIVES;
  outTimer = 0;
  drawLives();
  showCombo(null);
  // However the device is being held right now counts as level.
  tilt.calibrate();
  $('trackname').textContent = d.name;
  show(null);
  state = 'playing';
}

function openSelect() {
  const list = $('tracklist');
  list.innerHTML = '';
  for (const id of BIOME_ORDER) {
    const b = BIOMES[id];
    const tracks = TRACKS.filter((t) => t.biome === id);
    if (!tracks.length) continue;
    const row = document.createElement('div');
    row.className = 'biome';
    row.style.setProperty('--swatch', b.swatch);
    row.innerHTML = `<div class="biome-head"><b>${b.name}</b><span>${b.blurb}</span></div>`;
    const btns = document.createElement('div');
    btns.className = 'tracks';
    tracks.forEach((t, i) => {
      const btn = document.createElement('button');
      const best = loadBest(t.id);
      const tag = t.kind === 'pipe' ? 'BONUS' : String(i + 1);
      if (t.kind === 'pipe') btn.classList.add('bonus');
      btn.innerHTML = `<small>${tag}</small>${t.name}<em>${best ? 'Best ' + fmt(best) : 'New'}</em>`;
      btn.addEventListener('click', () => start(t));
      btns.appendChild(btn);
    });
    row.appendChild(btns);
    list.appendChild(row);
  }
  show('select');
  state = 'select';
}

function nextTrack(): TrackDef {
  return TRACKS[(TRACKS.indexOf(def) + 1) % TRACKS.length];
}

function finish(out = false) {
  score.bank();
  state = 'finished';
  const best = loadBest(def.id);
  const total = score.total;
  // Running out of lives doesn't count towards your best.
  if (!out && total > best) saveBest(def.id, total);
  $('results').classList.toggle('out', out);
  $('next').classList.toggle('hidden', out);
  $('again').textContent = out ? 'TRY AGAIN' : 'RIDE AGAIN';
  $('again').classList.toggle('alt', !out);
  $('r-title').textContent = out ? 'OUT OF LIVES!' : def.kind === 'pipe' ? "TIME'S UP!" : 'FINISHED!';
  $('r-track').textContent = def.name;
  $('r-score').textContent = fmt(total);
  $('r-time').textContent = time.toFixed(1) + 's';
  $('r-combo').textContent = fmt(score.bestCombo);
  $('r-best').textContent = out ? 'Start the level again to finish it' : total > best ? 'NEW BEST!' : `Best: ${fmt(best)}`;
  $('next').textContent = `NEXT: ${nextTrack().name.toUpperCase()}`;
  show('results');
}

$('play').addEventListener('click', openSelect);
$('again').addEventListener('click', () => start(def));
$('next').addEventListener('click', () => start(nextTrack()));
$('tracks').addEventListener('click', openSelect);
$('menu').addEventListener('click', openSelect);
$('back').addEventListener('click', () => { show('title'); state = 'title'; });
window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && state === 'playing') openSelect();
  else if ((e.code === 'Enter' || e.code === 'Space') && state === 'title') { e.preventDefault(); openSelect(); }
  else if ((e.code === 'Enter' || e.code === 'Space') && state === 'finished') { e.preventDefault(); start(def); }
});

watchForUpdates(() => state !== 'playing');

// Camera follows from the side, pulling back and looking ahead with speed.
const camPos = new THREE.Vector3(track.startX + 3, track.height(track.startX) + 2, 12);
const camLook = new THREE.Vector3();
let camOverride: { pos: number[]; look: number[] } | null = null;
function updateCamera(dt: number) {
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
    sun.position.set(camPos.x - 6, camPos.y + 12, 10);
    sun.target.position.set(camPos.x, camPos.y, 0);
    return;
  }
  const spd = rider.speed;
  const portrait = aspect < 1 ? 1 / aspect : 1;
  const dist = (10 + spd * 0.25) * Math.min(1.9, portrait * 0.85 + 0.15);
  const ahead = (2.5 + spd * 0.18) * (aspect < 1 ? 0.45 : 1);
  const ground = track.height(rider.x + ahead);
  const focusY = Math.max(rider.y, ground) * 0.6 + Math.min(rider.y, ground) * 0.4;
  const target = new THREE.Vector3(rider.x + ahead, focusY + (aspect < 1 ? 0.2 : 1.6), dist);
  const k = 1 - Math.exp(-dt * 4);
  camPos.x += (target.x - camPos.x) * (1 - Math.exp(-dt * 10));
  camPos.y += (target.y - camPos.y) * k;
  camPos.z += (target.z - camPos.z) * k;
  camera.position.set(camPos.x, camPos.y + 1.2, camPos.z);
  camLook.set(camPos.x, camPos.y, 0);
  camera.lookAt(camLook);
  sun.position.set(camPos.x - 6, camPos.y + 12, 10);
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

  if (state === 'playing') {
    time += dt;
    rider.update(dt);
    if (outTimer > 0) {
      // Let the bail or fall play out before the out-of-lives screen.
      outTimer += dt;
      if (outTimer > 1.6) finish(true);
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
    } else if (rider.x >= track.finishX && finishTimer === 0 && outTimer === 0) finishTimer = 0.001;
    if (finishTimer > 0) {
      finishTimer += dt;
      if (finishTimer > 1.2 && rider.grounded) finish();
    }
  } else if (state === 'finished') {
    rider.update(dt);
  }

  skater.update(dt, rider, (x) => track.height(x), (x) => track.slope(x));
  updateCamera(dt);
  world.update(dt, camPos.x, camPos.y);

  if (comboHold > 0) {
    comboHold -= dt;
    if (comboHold <= 0) showCombo(null);
  } else {
    const c = score.combo;
    // Show a grab or manual building up as you hold it.
    const holding = rider.grab ?? rider.manual;
    const pts = rider.grab ? rider.grabPoints : rider.manualPoints;
    if (holding) {
      const live = c ?? { names: [], base: 0, mult: 0 };
      showCombo({ names: [...live.names, `${holding} ${fmt(pts)}`], base: live.base + pts, mult: live.mult + 1 }, 'grabbing');
    } else showCombo(c);
  }
  // Tutorial cue: light up while the rider is heading down a slope and could pump.
  const cue = state === 'playing' && !!def.tutorial && rider.grounded && !rider.bailing && rider.pumpTimer === 0
    && track.slope(rider.x + rider.v * 0.12) * Math.sign(rider.v || 1) < -0.12;
  hud.cue.classList.toggle('on', cue);
  hud.score.textContent = fmt(score.total);
  hud.time.textContent = def.kind === 'pipe' ? Math.max(0, PIPE_TIME - time).toFixed(1) : time.toFixed(1);
  hud.speed.style.width = `${Math.min(100, (rider.speed / 20) * 100)}%`;
  const prog = def.kind === 'pipe' ? time / PIPE_TIME : (rider.x - track.startX) / (track.finishX - track.startX);
  hud.progress.style.width = `${Math.min(100, prog * 100)}%`;

  effect.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Handy for automated play testing.
(window as unknown as { __game: unknown }).__game = {
  rider, score, skater, start, openSelect, loseLife, TRACKS, get track() { return track; }, get state() { return state; },
  setCamera(pos: number[] | null, look: number[] = []) { camOverride = pos ? { pos, look } : null; },
};
