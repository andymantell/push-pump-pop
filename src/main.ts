import * as THREE from 'three';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { buildLevel1 } from './level1';
import { Rider, Trick } from './rider';
import { Score, ComboView } from './score';
import { Input } from './input';
import { World } from './world';
import { Skater } from './skater';

const $ = (id: string) => document.getElementById(id)!;
const BEST_KEY = 'push-pump-pop-best-1';

function loadBest(): number {
  try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
}
function saveBest(v: number) {
  try { localStorage.setItem(BEST_KEY, String(v)); } catch { /* storage unavailable */ }
}
const fmt = (n: number) => Math.round(n).toLocaleString('en-GB');

const canvas = $('game') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const effect = new OutlineEffect(renderer, { defaultThickness: 0.006, defaultColor: [0.1, 0.08, 0.08] });

const scene = new THREE.Scene();
{
  const cv = document.createElement('canvas');
  cv.width = 2; cv.height = 256;
  const c = cv.getContext('2d')!;
  const g = c.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#3d9be0');
  g.addColorStop(0.6, '#8fd0f5');
  g.addColorStop(1, '#d8f1ff');
  c.fillStyle = g;
  c.fillRect(0, 0, 2, 256);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  scene.background = t;
}
scene.fog = new THREE.Fog(0xbfe6fb, 60, 190);

scene.add(new THREE.HemisphereLight(0xdff3ff, 0x6b8f4e, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-6, 12, 10);
scene.add(sun);
scene.add(sun.target);

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);

const track = buildLevel1();
const world = new World(track);
scene.add(world.group);

// Clouds drift slowly far behind the track.
const clouds = new THREE.Group();
{
  const mat = new THREE.MeshToonMaterial({ color: 0xffffff });
  mat.userData.outlineParameters = { visible: false };
  for (let i = 0; i < 24; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(2 + (j % 2), 10, 8), mat);
      s.position.set(j * 2.2 - 3, (j % 2) * 0.8, 0);
      c.add(s);
    }
    c.position.set(i * 30 - 20, 18 + (i * 7) % 10, -90 - (i % 4) * 10);
    clouds.add(c);
  }
}
scene.add(clouds);

const score = new Score();
const hud = {
  score: $('score'), time: $('time'), combo: $('combo'), popups: $('popups'),
  speed: $('speedbar'), progress: $('progressbar'),
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
  trick(t: Trick) { score.addTrick(t); popup(t.name); },
  land({ airTime, smooth }) {
    if (airTime > 0.7) score.addBonus(`Air ${airTime.toFixed(1)}s`, Math.round(airTime * 120));
    if (smooth) { score.addBonus('Smooth', 75); popup('Smooth landing', 'good'); }
  },
  bail() { score.lose(); popup('BAIL!', 'bad'); },
  pump(good) { if (good) popup('Pump!', 'good'); },
});

const skater = new Skater();
scene.add(skater.root, skater.shadowMesh);

type State = 'title' | 'playing' | 'finished';
let state: State = 'title';
let time = 0;
let finishTimer = 0;

const input = new Input(canvas);
input.onPump = () => { if (state === 'playing') { rider.pump(); skater.pumpKick(); } };
input.onSwipe = (d) => { if (state === 'playing') rider.swipe(d); };

function start() {
  rider.reset();
  score.reset();
  time = 0;
  finishTimer = 0;
  showCombo(null);
  $('title').classList.add('hidden');
  $('results').classList.add('hidden');
  state = 'playing';
}

function finish() {
  score.bank();
  state = 'finished';
  const best = loadBest();
  const total = score.total;
  if (total > best) saveBest(total);
  $('r-score').textContent = fmt(total);
  $('r-time').textContent = time.toFixed(1) + 's';
  $('r-combo').textContent = fmt(score.bestCombo);
  $('r-best').textContent = total > best ? 'NEW BEST!' : `Best: ${fmt(best)}`;
  $('results').classList.remove('hidden');
}

$('play').addEventListener('click', start);
$('again').addEventListener('click', start);
window.addEventListener('keydown', (e) => {
  if ((e.code === 'Enter' || e.code === 'Space') && state !== 'playing') { e.preventDefault(); start(); }
});
{
  const best = loadBest();
  if (best) $('best').textContent = `Best: ${fmt(best)}`;
}

// Camera follows from the side, pulling back and looking ahead with speed.
const camPos = new THREE.Vector3(track.startX + 3, track.height(track.startX) + 2, 12);
const camLook = new THREE.Vector3();
function updateCamera(dt: number) {
  const aspect = camera.aspect;
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
  clouds.position.x = camPos.x * 0.6;
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
    score.update(dt, rider.grounded);
    if (rider.x >= track.finishX && finishTimer === 0) finishTimer = 0.001;
    if (finishTimer > 0) {
      finishTimer += dt;
      if (finishTimer > 1.2 && rider.grounded) finish();
    }
  } else if (state === 'title') {
    // Idle roll on the start deck behind the title.
  } else {
    rider.update(dt);
  }

  skater.update(dt, rider, (x) => track.height(x), (x) => track.slope(x));
  updateCamera(dt);

  if (comboHold > 0) {
    comboHold -= dt;
    if (comboHold <= 0) showCombo(null);
  } else {
    const c = score.combo;
    showCombo(c);
  }
  hud.score.textContent = fmt(score.total);
  hud.time.textContent = time.toFixed(1);
  hud.speed.style.width = `${Math.min(100, (rider.speed / 20) * 100)}%`;
  hud.progress.style.width = `${Math.min(100, ((rider.x - track.startX) / (track.finishX - track.startX)) * 100)}%`;

  effect.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Handy for automated play testing.
(window as unknown as { __game: unknown }).__game = { rider, score, track, start, get state() { return state; } };
