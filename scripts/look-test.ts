// Checks the customiser's saved looks and that every choice has its pieces in the wardrobe.
//
//   npx tsx scripts/look-test.ts
import { readFileSync } from 'node:fs';
import {
  DEFAULT_LOOK, parseLook, randomLook, headPieces, bodyPieces, Look, Headgear,
  HAIR_STYLES, HATS, MOUTHS, GLASSES, TOPS, BOTTOMS, SHOES,
} from '../src/look';

let failed = 0;
function check(name: string, ok: boolean) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}

check('nothing saved gives the default look', JSON.stringify(parseLook(null)) === JSON.stringify(DEFAULT_LOOK));
const mine: Look = { ...DEFAULT_LOOK, hair: 'pigtails', hat: 'unicorn', topColour: 0xff5fa8, freckles: true, deck: 'shark' };
check('a saved look comes back the same', JSON.stringify(parseLook(JSON.parse(JSON.stringify(mine)))) === JSON.stringify(mine));
const junk = parseLook({ hair: 'dreadful', hat: 7, topColour: 'pink', freckles: 'yes', pattern: 'tartan', skin: 0xabcdef, extra: 1 });
check('unknown styles and wrong types fall back to the default',
  junk.hair === DEFAULT_LOOK.hair && junk.hat === DEFAULT_LOOK.hat && junk.topColour === DEFAULT_LOOK.topColour
  && junk.freckles === DEFAULT_LOOK.freckles && junk.pattern === DEFAULT_LOOK.pattern && junk.skin === 0xabcdef && !('extra' in junk));
check('a look from an older version gets the new choices filled in', parseLook({ hair: 'bob' }).deck === DEFAULT_LOOK.deck);
let rnd = true;
for (let i = 0; i < 200; i++) {
  const l = randomLook(mine);
  if (JSON.stringify(parseLook(l)) !== JSON.stringify(l) || l.skin !== mine.skin) rnd = false;
}
check('the dice only make valid looks, keeping your skin', rnd);

// Every piece any look can ask for is in the wardrobe.
const glb = readFileSync(new URL('../public/models/wardrobe.glb', import.meta.url));
const json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString('utf8'));
const have = new Set<string>(json.nodes.map((n: { name: string }) => n.name));
const missing = new Set<string>();
const need = (names: string[]) => names.forEach((n) => { if (!have.has(n)) missing.add(n); });
const gears: Headgear[] = ['own', 'skate', 'farm', 'snow'];
for (const hair of HAIR_STYLES) for (const hat of HATS) for (const g of gears) need(headPieces({ ...DEFAULT_LOOK, hair, hat }, g));
for (const mouth of MOUTHS) for (const glasses of GLASSES) need(headPieces({ ...DEFAULT_LOOK, mouth, glasses, freckles: true, cheeks: true, lashes: true }, 'own'));
for (const top of TOPS) for (const bottom of BOTTOMS) for (const shoes of SHOES) need(Object.values(bodyPieces({ ...DEFAULT_LOOK, top, bottom, shoes })).flat());
need(['deck__std']);
check(`every choice has its pieces in wardrobe.glb${missing.size ? ' (missing ' + [...missing].join(', ') + ')' : ''}`, missing.size === 0);

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall passed');
