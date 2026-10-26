# Push Pump Pop: downhill MTB plan

Andy asked (2026-10-25) for a downhill mountain bike mode: ride every existing course on a
full-suspension bike, plus 40 MTB-only courses (10 rocky, 10 muddy, 10 North Shore, 10 urban).
The design was agreed with him on 2026-10-26 (see project memory, `mtb-mode`).

## The bike

- Its own career: own stars and bests, three MTB challenges per existing track (`src/levels/mtb.ts`;
  tracks without their own use their skateboard ones with bike tricks swapped in).
- Tricks: right-half swipes are Bunny Hop (up), Whip (left), Tabletop (right) and Turndown (down);
  left-half holds are Superman, No Footer, Can Can and No Hander; bottom swipes spin 180/360;
  tilt is a Manual or Stoppie on the ground, a Backflip or Frontflip in the air. No tailwhips or
  barspins (triple-crown forks can't). Rails are ridden as skinnies (tilt for a skinny manual or
  stoppie). Riding backwards wobbles from 1.5 s and bails at 5 s.
- Rock gardens (`rocky()`): the bumps knock your weight forward and back, shown on a balance
  meter; tilt to correct it. Too far forward is over the bars, too far back is looping out.
  Manuals are off in a garden. Riding a whole garden scores a Rock Garden trick.
- Full-face helmet and goggles, studded tyres on snow, tap still pumps.

## The downhill world

A third world, the bike's own: World 3 in the level select, only on the MTB. Its first track is
open from the start, and it unlocks like World 1 (track 5 of a biome opens the next). Every
course runs downhill, at grades that change along it (`descend(len, grade)`), with its features
laid on the slope. Pars are the MTB bot's p75.

| # | Biome | Main idea | Difficulty |
|---|-------|-----------|-----------|
| 1 | Hillside Town (`dh-urban`) | steps, wall drops, handrails as skinnies, gaps over alleys | 2 to 5 |
| 2 | Muddy Woods (`dh-mud`) | mud that drags you, whoops to pump, slippery chutes | 3 to 6 |
| 3 | Boulder Peak (`dh-rocky`) | rock gardens, boulder drops, steep scree | 5 to 8 |
| 4 | North Shore (`dh-shore`) | wooden skinnies, ladder bridges over gaps, wooden drops | 6 to 10 |

New pieces: `descend(len, grade)` (smoothly changes grade, so no kinks), `whoops(n, len, amp, grade)`
(rollers down a slope), `skinny(len, dy, height)` (a wooden plank on legs, a rail the bike rides),
`gapSkinny(len)` (a ladder bridge over a gap).
