# Push Pump Pop

A mobile-friendly side-on skateboarding game inspired by Pumped BMX, built with three.js.

**Play:** on this repo's GitHub Pages site (Settings → Pages shows the URL).

## Controls

| Action | Touch | Keyboard |
| --- | --- | --- |
| Pump (tap on the way down a slope) | Tap | Space |
| Ollie | Swipe up | Up arrow / W |
| Kickflip | Swipe left | Left arrow / A |
| Heelflip | Swipe right | Right arrow / D |
| Pop shove-it | Swipe down | Down arrow / S |

Flip tricks pop off the ground too. Chain tricks into combos; land before the board finishes spinning or you bail and lose the combo.

You get three lives per track. Each bail or fall into a gap costs one, and losing the third means starting the track again. Half-pipe bonus levels are timed and have no lives.

## Development

```sh
npm install
npm run dev      # local dev server
npm run build    # type check and build to dist/
npm test                 # human-speed bot plays every track; fails if one is too hard
npx tsx scripts/sim.ts   # quick physics stats per track, for tuning
```

The deploy workflow runs `npm test` first, so a track that is too hard, or that brings the rider to a sudden stop (losing over half their speed in a moment without a bail or fall), blocks the deploy.
Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Tracks and biomes

- `src/biomes.ts`: look and feel of each biome (sky, surfaces, scenery, friction).
- `src/tracks.ts`: track layouts as chains of shapes (`flat`, `ease`, `kicker`, `rollers`, `valley`, `drop`, `pit`, `sign`), see `TrackBuilder` in `src/track.ts`.

Keep rollers long (12 m or more) so there's time to tap on each downslope.

## Models

The skater, board and scenery are modelled in Blender from code. To rebuild them:

```sh
python3 -m venv .venv && .venv/bin/pip install bpy
.venv/bin/python art/build_assets.py   # writes public/models/*.glb
.venv/bin/python art/build_assets.py skater   # just the skater (or `props`)
```

To check the skater from all sides, run `npm run dev` and open `/art/preview.html`
(`?pose=crouch`, `?pose=air`, `?close=1` for the head, or `?t=<height>&d=<distance>`).
