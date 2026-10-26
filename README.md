# Push Pump Pop

A mobile-friendly side-on skateboarding game inspired by Pumped BMX, built with three.js.

**Play:** on this repo's GitHub Pages site (Settings → Pages shows the URL).

## Controls

| Action | Touch | Keyboard |
| --- | --- | --- |
| Pump (tap on the way down a slope; in the air, on the way down, it drops you faster onto a landing) | Tap | Space |
| Ollie | Swipe up | Up arrow / W |
| Kickflip | Swipe left | Left arrow / A |
| Heelflip | Swipe right | Right arrow / D |
| Pop shove-it | Swipe down | Down arrow / S |
| 360 flip (tre flip) | Swipe down and to the left, on a slant | C |
| Hardflip | Swipe down and to the right, on a slant | V |
| Grab (Indy, Melon, Nosegrab, Tailgrab) | On the left half of the screen, swipe up, down, left or right and keep holding | Hold I / K / J / L |
| Spin (FS/BS 180, 360) | Swipe left or right along the bottom of the screen; a longer swipe makes a 360 | Z / X (press again for a 360) |
| Manual / Nose manual | Tilt the device like a steering wheel on the ground: right side up, or right side down | Hold Q / E |
| Backflip / Frontflip | The same tilt in the air | Hold Q / E |

Flip tricks pop off the ground too. Chain tricks into combos; land before the board finishes spinning or you bail and lose the combo.
A grab scores more the longer you hold it, and starts once any flip has finished, so flip with your right thumb, then swipe and hold with your left for a Kickflip + Nosegrab. Flips are swiped on the right half of the screen. Let go before you land, or you bail.
Land a spin or flip before it's nearly round and you bail too. A manual keeps your combo going while you're on the ground.
On the Snowy Mountain tracks the skater rides a snowboard: no pushing, and since your feet are strapped in, the flip-side swipes become snowboard tricks (left BS Shifty, right FS Shifty, down Tuck Knee) and manuals become tail and nose presses. On Autumn Farm he rides a mountain board with big tyres and a helmet: feet strapped in again, so no pushing and the same swipe tricks as the snowboard (manuals stay manuals, on wheels).
Tilt is measured from however the device was held when the run started. On iPhone and iPad the game asks for motion access on your first tap.

Tap the ☰ button at the top during a run to pause. The pause menu has a big **RETRY** button at the top that starts the same track again on the same ride, plus Keep riding and All tracks. Keyboard: Escape pauses and resumes.

Land a combo worth 1,500 points or more and a **REPLAY** button pops up for a few seconds: tap it to watch the combo back in slow motion (the run, and the half-pipe timer, wait for you). Drag along the bar to scrub, tap the picture or the play button to pause, and pick 1×, ½× or ¼× speed. The results screen keeps your five best combos from the run to watch. Keyboard: R to open, Space to pause, left/right arrows to step, up/down for speed, Escape to close.

Sound starts on your first tap (iPhone and iPad need one). Every surface sounds different, and each world has its own ambience. Turn sound off with the SOUND button on the title screen, or M on a keyboard. On iPhone and iPad the ring/silent switch or the mute setting silences it too. All sound is synthesised in `src/audio.ts`; credits and the rules for adding recorded sounds are in `SOUNDS.md`.

### Scooter career

Pick **SKATE** or **SCOOTER** above the world tabs on the level select. The scooter is a second career with its own challenges on every track, its own stars and best scores (`src/levels/scooter.ts`, `src/ride.ts`), but tracks open for both: completing a track on either ride opens the next one for both. Pumping, spins and tilt work the same; the swipes are scooter tricks:

| Action | Touch | Keyboard |
| --- | --- | --- |
| Bunny hop | Swipe up | Up arrow / W |
| Tailwhip / Barspin / Heelwhip | Swipe left / right / down; swipe again in the air for a Double Whip, Double Barspin, Double Heelwhip, Tailwhip Barspin or Heelwhip Barspin | Arrows / WASD |
| Superman, No Footer, Can Can, X-Up | On the left half, swipe up, down, left or right and keep holding | Hold I / K / J / L |
| Grinds | 50-50 by default; on a rail swipe left for a Boardslide, right for a Feeble, down for a Smith | Arrows |

A 180 on a scooter leaves you riding backwards: landing like that adds **Fakie** to the combo, but after 3 s on the ground fakie the rider starts to wobble, more and more, and falls off at 10 s (`FAKIE_SAFE`, `FAKIE_FALL` in `src/rider.ts`) unless another 180 turns them forwards. On the Snowy Mountain tracks the scooter is a snow scooter, on skis..

### Downhill MTB career

Pick **MTB** for a full-suspension downhill bike (`src/mtb.ts`, modelled in `art/build_assets.py` after a modern 29in DH bike), with its own challenges and stars like the scooter (`src/levels/mtb.ts`). It rides every track, and has a world only it reaches, **DOWNHILL**: courses that all run down a hill (`src/levels/dh-*.ts`, plan in `docs/mtb-plan.md`). The rider wears a full-face helmet and goggles, and the tyres get ice studs on snow.

| Action | Touch | Keyboard |
| --- | --- | --- |
| Bunny hop | Swipe up | Up arrow / W |
| Whip / Tabletop / Turndown | Swipe left / right / down | Arrows / WASD |
| Superman, No Footer, Can Can, No Hander | On the left half, swipe up, down, left or right and keep holding | Hold I / K / J / L |
| Manual / Stoppie | Tilt as for a manual / nose manual (on a skinny too); in the air the same tilt flips | Hold Q / E |

Rails are wooden skinnies on the bike. Rock gardens knock your weight forwards and back (the balance meter shows it): tilt against it, or go over the bars or loop out. Riding backwards wobbles from 1.5 s and bails at 5 s.

You get three lives per track. Each bail or fall into a gap costs one, and losing the third means starting the track again: the game freezes behind the Out of Lives screen and ignores taps, swipes and tilt until you do. Half-pipe bonus levels are timed and have no lives.

## Development

```sh
npm install
npm run dev      # local dev server
npm run build    # type check and build to dist/
npm test                 # human-speed bot plays every track on both rides; fails if one is too hard
npx tsx scripts/playtest.ts --ride=scooter [track]   # just the scooter career
npx tsx scripts/playtest.ts --ride=mtb [track]       # just the MTB career
npx tsx scripts/sim.ts   # quick physics stats per track, for tuning
```

The deploy workflow runs `npm test` first, so a track that is too hard, or that brings the rider to a sudden stop (losing over half their speed in a moment without a bail or fall), or that throws the rider over a dip onto its far upslope without an ollie (so the downslope can't be pumped), or that has a jump which comes down past its landing, or on a flat or an upslope when the rider is doing well (pumping and ollieing at the lip), or a gap that riders who pump some of the time can't clear or that riders who never pump clear too often (`scripts/landings.ts`, also runnable on its own), blocks the deploy.
Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

### Release notes

**Every change a player would notice needs a line in `changelog.json`,** in the same
commit as the change. Add it at the top of the top entry's `items`. Write it in plain
words for a kid, starting with `New:`, `Better:` or `Fixed:`, e.g. `"New: grind rails!"`.

The build groups lines into updates by the commit that added them (via `git blame`, so
the deploy checks out full history), and the game shows them that way: the update
prompt lists the lines the running copy doesn't have, and after an update the What's
New screen opens with the new updates marked. Don't reword old lines: a reworded line
moves to the commit that changed it and shows up as new.

### Picture quality

`src/quality.ts` holds 60fps on slower devices. On AUTO (the title screen's QUALITY
button) it averages frame times; when they run slow it steps down a ladder of levels:
render resolution first (the biggest cost), then smaller and then no sun shadows, fewer
weather particles and lamp lights, and last the ink outlines. After a smooth spell it
tries a step back up, waiting twice as long after each try that turns out too slow, so it
doesn't flicker. If going all the way down gains nothing (a battery saver holding the
screen at 30fps) it goes back to full quality. Each device remembers its level for next
time, and devices that ended up near the bottom start without antialiasing. HIGH,
MEDIUM and LOW lock a level. `scripts/quality-test.ts` (in `npm test`) checks this.

### Home screen app

The game installs to the home screen (Android: Install app; iPad: Share, then Add to
Home Screen) via `public/manifest.webmanifest`, `public/sw.js` and the
apple-mobile-web-app tags in `index.html`. On Android it opens fullscreen and stays
landscape; iPadOS ignores the orientation, so use the iPad's rotation lock. The service
worker fetches the page and models fresh and only falls back to its cache offline, so
installed copies update like the website does. Icons are a screenshot of the game (`art/icon/shoot.cjs`), cropped to `art/icon/icon.png` and `icon-maskable.png`.
On the iPad the home screen app doesn't share storage with Safari, so the title screen's
My Stars panel (`src/transfer.ts`) copies progress as a code and merges it in the
other copy, keeping the better of each score and challenge. The same code goes into a
backup file (Save backup shares it to Files / iCloud Drive / Google Drive, or downloads
it; Load backup picks it). Installed copies also ask `navigator.storage.persist()`.

## Tracks and biomes

- `src/biomes.ts`: look and feel of each biome (sky, surfaces, scenery, friction).
- `src/tracks.ts` and `src/levels/` (one file per world, tracks in play order): track layouts as chains of shapes (`flat`, `ease`, `kicker`, `land`, `rollers`, `valley`, `drop`, `pit`, `rail`, `ledge`, `stairs`, `loop`, `pad`, `sign`, `spot`), see `TrackBuilder` in `src/track.ts`. Follow every kicker or gap with `land(len)`, a slope down sized for the fastest jump. A kicker gets a short flat deck before it (`kicker(...).flat(d).land(len)`): a slow hop lands on the deck and loses speed, a good one clears it onto the slope. From difficulty 4, riders who never pump should fall into a good share of the gaps (at most half of them clear, a quarter from difficulty 7), while three in four riders who pump some of the time clear each one. `npx tsx scripts/landings.ts <track>` checks all of this and says how far each jump flies, so you can size decks, gaps and `len`. Rails, ledges and stair handrails are grindable: ollie on and you lock into a 50-50; the playtest bot aims for each one and fails a track if no run manages to grind one. Loops (`loop(radius)`) need about 15 m/s to get round, so put a long downhill and rollers before them and keep them for later tracks; fall off and you lose a life and pick up past the loop. The playtest needs 95% of loop attempts to make it round.

Keep rollers long (12 m or more) so there's time to tap on each downslope.

Mud (`mud(len)`, or `muddy(fn)` around any pieces) drags you back while you roll through it, so pump the muddy dips. Jelly pads (`bouncer(len, lift)`) fling you up at `lift` m/s, a quarter higher if you pump as you hit them; put a gap or a landing after one like a kicker. Containers (`containers(n)`) are a row of shipping containers to ride along the top of: reach them down a ramp and leave off the end. Stepping stones (`stones(n, gap)`) are rocks out of the water, each a landing to pump and a kicker to the next: start them off a kicker on the flat and finish with a `pit` and a `land`. Drop-offs (`dropoff(h, len)`) drop the ground away at a lip onto a landing: give them a landing of 20 m or more. Conveyor belts (`conveyor(len, speed)`) speed you up (positive speed) or hold you back (negative); pumping on a belt always pushes you on.

The plan for the first 70 tracks is `docs/level-plan.md`; World 2 (opens after Volcano 5) is planned in `docs/world-2-plan.md`. `art/props.html?names=a,b` shows a contact sheet of props from `props.glb`.

### Challenges and unlocking

Every track has three `challenges` (see `src/challenges.ts` for the kinds). Each one done is
a star, saved the moment it's done. A track is complete once it's finished and its required
challenges are done (challenge 1 in the first two worlds, 1 and 2 after that); completing a
track opens the next one, track 3 opens the world's bonus level, and track 5 opens the next
world (`src/progress.ts`). Hold the title for two seconds to open every track.

Challenges point at places on the track with `spot(tag)` (kickers, roller crests and valley
lips are tagged for you) and at manual pads made with `pad()`. The playtest has a bot go
for each challenge the way a player would: every required challenge must be done in half
its tries (90% for Sunny Park 1 to 6), and every optional one at least once. Tracks of
difficulty 3 or less without gaps must also be finished by the pump-only bot without losing
a life. Each track's line shows `p75`, the bot's 75th percentile score, which is what `par`
is set to.

## Models

The skater, board and scenery are modelled in Blender from code. To rebuild them:

```sh
python3 -m venv .venv && .venv/bin/pip install bpy
.venv/bin/python art/build_assets.py   # writes public/models/*.glb
.venv/bin/python art/build_assets.py skater   # just the skater (or `scooter`, `props`)
```

To check the skater from all sides, run `npm run dev` and open `/art/preview.html`
(`?pose=crouch`, `?pose=air`, `?close=1` for the head, or `?t=<height>&d=<distance>`).
`/art/ollie.html` films a trick frame by frame from the real physics; add `?ride=scooter`
for the scooter (`?swipe=left&then=right` for a Tailwhip Barspin, `?grab=up` for a Superman,
`?rail=1&then=down` for a Smith grind, `?snow=1` for the snow scooter).
To judge trick animation frame by frame, open `/art/ollie.html`: a filmstrip of a real ollie from the physics
(`?swipe=left` for a kickflip, `?grab=up`, `?spin=right`, `?snow=1`, `?rail=1`, `?at=0,0.05,...` for the frame times).
