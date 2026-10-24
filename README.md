# Pumped Skate

A mobile-friendly side-on skateboarding game inspired by Pumped BMX, built with three.js.

**Play:** https://andymantell.github.io/pumped-skateboard/

## Controls

| Action | Touch | Keyboard |
| --- | --- | --- |
| Pump (tap on the way down a slope) | Tap | Space |
| Ollie | Swipe up | Up arrow / W |
| Kickflip | Swipe left | Left arrow / A |
| Heelflip | Swipe right | Right arrow / D |
| Pop shove-it | Swipe down | Down arrow / S |

Flip tricks pop off the ground too. Chain tricks into combos; land before the board finishes spinning or you bail and lose the combo.

## Development

```sh
npm install
npm run dev      # local dev server
npm run build    # type check and build to dist/
npx tsx scripts/sim.ts   # headless physics run of level 1, for tuning
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.
