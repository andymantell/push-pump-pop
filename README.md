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
| Grab (Indy, Melon, Nosegrab, Tailgrab) | On the left half of the screen, swipe up, down, left or right and keep holding | Hold I / K / J / L |
| Spin (FS/BS 180, 360) | Swipe left or right along the bottom of the screen; a longer swipe makes a 360 | Z / X (press again for a 360) |
| Manual / Nose manual | Tilt the device like a steering wheel on the ground: right side up, or right side down | Hold Q / E |
| Backflip / Frontflip | The same tilt in the air | Hold Q / E |

Flip tricks pop off the ground too. Chain tricks into combos; land before the board finishes spinning or you bail and lose the combo.
A grab scores more the longer you hold it, and starts once any flip has finished, so flip with your right thumb, then swipe and hold with your left for a Kickflip + Nosegrab. Flips are swiped on the right half of the screen. Let go before you land, or you bail.
Land a spin or flip before it's nearly round and you bail too. A manual keeps your combo going while you're on the ground.
On the Snowy Mountain tracks the skater rides a snowboard: no pushing, and since your feet are strapped in, the flip-side swipes become snowboard tricks (left BS Shifty, right FS Shifty, down Tuck Knee) and manuals become tail and nose presses.
Tilt is measured from however the device was held when the run started. On iPhone and iPad the game asks for motion access on your first tap.

Land a combo worth 1,500 points or more and a **REPLAY** button pops up for a few seconds: tap it to watch the combo back in slow motion (the run, and the half-pipe timer, wait for you). Drag along the bar to scrub, tap the picture or the play button to pause, and pick 1×, ½× or ¼× speed. The results screen keeps your five best combos from the run to watch. Keyboard: R to open, Space to pause, left/right arrows to step, up/down for speed, Escape to close.

Sound starts on your first tap (iPhone and iPad need one). Every surface sounds different, and each world has its own ambience. Turn sound off with the SOUND button on the title screen, or M on a keyboard. On iPhone and iPad the ring/silent switch or the mute setting silences it too. All sound is synthesised in `src/audio.ts`; credits and the rules for adding recorded sounds are in `SOUNDS.md`.

You get three lives per track. Each bail or fall into a gap costs one, and losing the third means starting the track again: the game freezes behind the Out of Lives screen and ignores taps, swipes and tilt until you do. Half-pipe bonus levels are timed and have no lives.

## Development

```sh
npm install
npm run dev      # local dev server
npm run build    # type check and build to dist/
npm test                 # human-speed bot plays every track; fails if one is too hard
npx tsx scripts/sim.ts   # quick physics stats per track, for tuning
```

The deploy workflow runs `npm test` first, so a track that is too hard, or that brings the rider to a sudden stop (losing over half their speed in a moment without a bail or fall), or that throws the rider over a dip onto its far upslope without an ollie (so the downslope can't be pumped), or that has a jump which comes down on a flat or an upslope instead of its landing at any speed from no pumping to pumping every slope, with or without an ollie (`scripts/landings.ts`, also runnable on its own), blocks the deploy.
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

### Home screen app

The game installs to the home screen (Android: Install app; iPad: Share, then Add to
Home Screen) via `public/manifest.webmanifest`, `public/sw.js` and the
apple-mobile-web-app tags in `index.html`. On Android it opens fullscreen and stays
landscape; iPadOS ignores the orientation, so use the iPad's rotation lock. The service
worker fetches the page and models fresh and only falls back to its cache offline, so
installed copies update like the website does. Icons are rendered from `art/icon/icon.svg`.
On the iPad the home screen app doesn't share storage with Safari, so the title screen's
Move My Stars panel (`src/transfer.ts`) copies progress as a code and merges it in the
other copy, keeping the better of each score and challenge.

## Tracks and biomes

- `src/biomes.ts`: look and feel of each biome (sky, surfaces, scenery, friction).
- `src/tracks.ts` and `src/levels/` (one file per world, tracks in play order): track layouts as chains of shapes (`flat`, `ease`, `kicker`, `land`, `rollers`, `valley`, `drop`, `pit`, `rail`, `ledge`, `stairs`, `loop`, `pad`, `sign`, `spot`), see `TrackBuilder` in `src/track.ts`. Follow every kicker or gap with `land(len)`: it slopes down from the very lip, so slow hops and fast flights both come down on it; `npx tsx scripts/landings.ts <track>` says how far each jump flies, so you can size `len`. Rails, ledges and stair handrails are grindable: ollie on and you lock into a 50-50; the playtest bot aims for each one and fails a track if no run manages to grind one. Loops (`loop(radius)`) need about 15 m/s to get round, so put a long downhill and rollers before them and keep them for later tracks; fall off and you lose a life and pick up past the loop. The playtest needs 95% of loop attempts to make it round.

Keep rollers long (12 m or more) so there's time to tap on each downslope.

The plan for all 70 tracks is `docs/level-plan.md`.

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
.venv/bin/python art/build_assets.py skater   # just the skater (or `props`)
```

To check the skater from all sides, run `npm run dev` and open `/art/preview.html`
(`?pose=crouch`, `?pose=air`, `?close=1` for the head, or `?t=<height>&d=<distance>`).
To judge trick animation frame by frame, open `/art/ollie.html`: a filmstrip of a real ollie from the physics
(`?swipe=left` for a kickflip, `?grab=up`, `?spin=right`, `?snow=1`, `?rail=1`, `?at=0,0.05,...` for the frame times).
