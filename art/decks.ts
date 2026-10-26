// Every deck picture on the underside of a board, seen from below, for judging them:
// `npm run dev`, then open /art/decks.html.
import * as THREE from 'three';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { loadAssets } from '../src/assets';
import { DEFAULT_LOOK, Wardrobe, dress, setColours } from '../src/look';
import { DECK_ARTS } from '../src/patterns';
import { COLOURS } from '../src/look';

const cols = 4, CW = 330, CH = 130;
const arts = DECK_ARTS.filter((a) => a !== 'none');
const W = CW * cols, H = CH * Math.ceil(arts.length / cols);
const canvas = document.getElementById('c') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setScissorTest(true);
const effect = new OutlineEffect(renderer, { defaultThickness: 0.006, defaultColor: [0.1, 0.08, 0.08] });
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xdff3ff, 0xdff3ff, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(0, -10, 2);
scene.add(sun);
const assets = await loadAssets();
const w = new Wardrobe(assets.wardrobe);
const deck = new THREE.Group();
deck.userData = {};
dress(deck, ['deck__std'], w);
scene.add(deck);
const cam = new THREE.PerspectiveCamera(30, CW / CH, 0.05, 50);
cam.position.set(0, -0.62, 0.0001);
cam.up.set(0, 0, -1);
cam.lookAt(0, 0, 0);
arts.forEach((art, i) => {
  setColours({ ...DEFAULT_LOOK, deck: art, deckColour: COLOURS[(i * 3) % COLOURS.length], deckArtColour: COLOURS[(i * 7 + 2) % COLOURS.length] });
  const x = (i % cols) * CW, y = H - (Math.floor(i / cols) + 1) * CH;
  renderer.setViewport(x, y, CW, CH);
  renderer.setScissor(x, y, CW, CH);
  renderer.setClearColor(0x8fcff2);
  effect.render(scene, cam);
});
(window as any).ready = true;
