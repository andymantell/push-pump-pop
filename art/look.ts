// Riders in different looks, for judging the customiser's wardrobe: `npm run dev`, then open
// /art/look.html. ?set=a picks a row of preset looks, ?views=front,three-quarter,side,back the
// angles, ?ride=scooter rides the scooter, ?board=snow|mountain, ?close=1 frames heads and shoulders.
import * as THREE from 'three';
import { loadAssets } from '../src/assets';
import { Skater } from '../src/skater';
import { ScooterRig } from '../src/scooter';
import { Rider } from '../src/rider';
import { TrackBuilder } from '../src/track';
import { DEFAULT_LOOK, Look, Wardrobe, setColours } from '../src/look';

const q = new URLSearchParams(location.search);
const L = (o: Partial<Look>): Look => ({ ...DEFAULT_LOOK, ...o });
const SETS: Record<string, Look[]> = {
  a: [
    L({}),
    L({ hair: 'ponytail', hairColour: 0xe8c66c, hat: 'none', top: 'tee', topColour: 0xff5fa8, trimColour: 0xffffff, bottom: 'skirt', bottomColour: 0x8e5cd9, legsColour: 0x2a2a30, lashes: true, cheeks: true, shoes: 'high', shoeColour: 0xffffff, laceColour: 0xff5fa8 }),
    L({ skin: 0x87532e, hair: 'puffs', hairColour: 0x1c1410, hat: 'none', top: 'jacket', topColour: 0x4a6fa5, trimColour: 0xffd23f, bottom: 'leggings', bottomColour: 0x2a2a30, mouth: 'grin', glasses: 'heart', glassesColour: 0xff5fa8 }),
    L({ skin: 0xd69a66, hair: 'mohawk', hairColour: 0x2ec4b6, tips: 0xff40a0, hat: 'none', top: 'vest', topColour: 0x2a2a30, bottom: 'shorts', bottomColour: 0xe8402a, sockColour: 0xffd23f, mouth: 'tongue', glasses: 'sun' }),
    L({ skin: 0xfbe2cc, hair: 'long', hairColour: 0xd8682c, tips: 0xc04cf0, hat: 'catears', hatColour: 0xffa8d0, top: 'hoodie', topColour: 0xc8a2f0, trimColour: 0x8e5cd9, pattern: 'stars', patternColour: 0xffffff, bottom: 'joggers', bottomColour: 0x9aa0a8, freckles: true }),
    L({ skin: 0x6a3f22, hair: 'braids', hairColour: 0x1c1410, tips: 0xffd23f, hat: 'bucket', hatColour: 0x9ad438, top: 'jersey', topColour: 0xffd23f, trimColour: 0x26355a, bottom: 'shorts', bottomColour: 0x26355a, mouth: 'cheeky' }),
  ],
  b: [
    L({ hair: 'bob', hairColour: 0x3a2418, hat: 'headband', hatColour: 0xe8402a, top: 'rash', topColour: 0x2ec4b6, trimColour: 0x26355a, bottom: 'leggings', bottomColour: 0x8e5cd9, pattern: 'flowers', patternColour: 0xffffff }),
    L({ hair: 'curly', hairColour: 0xa4432a, hat: 'capback', hatColour: 0x2a9d5c, top: 'tee', topColour: 0xf4f4f0, pattern: 'stripes', patternColour: 0x2f8fd8, bottom: 'jeans', glasses: 'round' }),
    L({ hair: 'bun', hairColour: 0x8a5a34, hat: 'unicorn', hatColour: 0xffffff, top: 'hoodie', topColour: 0xffa8d0, trimColour: 0xd81e6e, pattern: 'hearts', patternColour: 0xd81e6e, bottom: 'skirt', bottomColour: 0x5cc8f0, legsColour: 0xffffff, lashes: true, cheeks: true }),
    L({ hair: 'spiky', hairColour: 0xf4e6b4, hat: 'none', top: 'tee', topColour: 0x2a2a30, pattern: 'flames', patternColour: 0xff8a1e, bottom: 'joggers', bottomColour: 0x2a2a30, glasses: 'star', glassesColour: 0xffd23f }),
    L({ hair: 'pigtails', hairColour: 0xe8c66c, tips: 0xff6fb5, hat: 'bandana', hatColour: 0x8e5cd9, top: 'vest', topColour: 0xffd23f, pattern: 'rainbow', bottom: 'shorts', bottomColour: 0x4a6fa5, sockColour: 0xff5fa8, shoes: 'high', shoeColour: 0x8e5cd9 }),
    L({ hair: 'buzz', hairColour: 0x1c1410, skin: 0x4e2d18, hat: 'beanie', hatColour: 0xff8a1e, top: 'jacket', topColour: 0x7a4e2d, trimColour: 0xf4f4f0, pattern: 'camo', patternColour: 0x2a9d5c, bottom: 'joggers', bottomColour: 0x2a9d5c }),
  ],
};
const looks = SETS[q.get('set') ?? 'a'];
const views = (q.get('views') ?? 'front,three-quarter,side').split(',');
const angles: Record<string, number> = { front: 0, 'three-quarter': Math.PI / 4, side: Math.PI / 2, back: Math.PI };
const close = q.get('close') === '1';
const scoot = q.get('ride') === 'scooter';
const board = (q.get('board') ?? 'skate') as 'skate' | 'snow' | 'mountain';

const CW = 220, CH = close ? 240 : 330;
const W = CW * looks.length, H = CH * views.length;
const canvas = document.getElementById('c') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setScissorTest(true);
const effect = renderer;
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xdff3ff, 0x6b8f4e, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-6, 12, 10);
scene.add(sun);
const ground = new THREE.Mesh(new THREE.BoxGeometry(40, 0.1, 3), new THREE.MeshLambertMaterial({ color: board === 'snow' ? 0xf2f6fa : 0x9a9a9a }));
ground.position.set(0, -0.05, 0);
scene.add(ground);

const assets = await loadAssets();
const wardrobe = new Wardrobe(assets.wardrobe);
const fig = scoot ? new ScooterRig(assets.parts) : new Skater(assets.parts);
if (fig instanceof ScooterRig) fig.setKind(board === 'snow' ? 'snow' : 'scooter');
else fig.setBoard(board);
scene.add(fig.root);
const b = new TrackBuilder(0);
b.flat(60);
const track = b.build(5, 50);
const noop = () => {};
const r = new Rider(track, { trick: noop, land: noop, bail: noop, pump: noop, fall: noop } as never);
r.opts = { friction: 1, maxSpeed: 17, snow: board === 'snow', mountain: board === 'mountain', scooter: scoot };
r.v = 0.01;
const cam = new THREE.PerspectiveCamera(30, CW / CH, 0.05, 50);
looks.forEach((look, col) => {
  setColours(look);
  fig.wear(look, wardrobe);
  for (let i = 0; i < 90; i++) { r.update(1 / 60); r.v = 0; fig.update(1 / 60, r, (x) => track.height(x), (x) => track.slope(x)); }
  views.forEach((v, row) => {
    const a = angles[v];
    const target = new THREE.Vector3(r.x, r.y + (close ? 1.45 : 0.85), 0);
    const d = close ? 1.5 : 3.6;
    cam.position.set(r.x + Math.sin(a) * d, target.y + 0.2, Math.cos(a) * d);
    cam.lookAt(target);
    const y = H - (row + 1) * CH;
    renderer.setViewport(col * CW, y, CW, CH);
    renderer.setScissor(col * CW, y, CW, CH);
    renderer.setClearColor(row % 2 ? 0x9bd5f4 : 0x8fcff2);
    effect.render(scene, cam);
  });
});
(window as any).ready = true;
