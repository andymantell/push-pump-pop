# White water kayak plan

Agreed with Andy on 2026-10-26, one question at a time. The kayak is a fourth ride with its own
career, its own stars and a world only it reaches, **RIVERS**. It never paddles the other rides' tracks.

## Rivers

Four biomes of ten rivers each, easiest first, unlocking like World 1 (river 5 of a biome opens
the next biome; the first river is open from the start):

1. **Whitewater Centre** (`kayak-centre`): a man-made concrete slalom course. Built.
2. **Forest Creek** (`kayak-creek`): a narrow rocky creek under conifers.
3. **Canyon River** (`kayak-canyon`): a wide river between red canyon walls.
4. **Waterfall Gorge** (`kayak-gorge`): a jungle gorge of waterfalls.

Each river has three challenges, pars from the kayak bot (p75), and three lives (a swim costs one).
Each biome's bonus level is a **standing wave** instead of a half pipe: surfed in a playboat for
60 seconds, rocking between the green face and the foam pile, with the whole trough a hole for end moves.

| # | Whitewater Centre | Features |
| --- | --- | --- |
| 1 | First Strokes | wave trains, little weir, one splat rock (tutorial) |
| 2 | Wave Train | long wave trains, pools to stall in |
| 3 | Weir Drops | three weirs to boof |
| 4 | Play Hole | holes below weirs for end moves |
| 5 | Slalom Gates | splat rocks, weirs, a hole |
| 6 | Sticky Hole | sticky holes to punch through |
| 7 | Boof Line | weir after weir, air tricks |
| 8 | Big Weir | the biggest weir, loops |
| 9 | Spin Pools | flat pools for flatspins, combos |
| 10 | Grand Final | everything |
| wave | The Centre Wave | standing wave bonus |

## Controls (same zones as the other rides)

- **Tap:** a paddle stroke. Best timed down the face of a wave. Tapped as you reach a marked rock: **Splat**.
- **Right-half swipes:** up **Boof** (off a weir lip it launches you), left **Airscrew**, right **Helix**, down **Pan-Am**.
- **Left swipe and hold, only in a hole:** up **Cartwheel** (keeps wheeling while held), down **Blunt**,
  left **McNasty**, right **Space Godzilla**. On a standing wave an end move holds you in the trough.
- **Bottom sideways swipes:** **Flatspin 180 / 360** on the water.
- **Tilt:** on the water **Stern Stall** / **Bow Stall**; in the air **Back Loop** / **Front Loop**.
- No rails or grinds.

## Capsize and holes

- A bad landing capsizes you. Tap fast (3 taps in about 2 s) to **Eskimo roll** back up; the combo breaks.
  Too slow and you **swim**, which costs a life.
- **Play holes** are for end moves. **Sticky holes** hold a slow boat (under 7 m/s) until you tap your
  way out (3 taps) or 4 s pass and you capsize. Speed or a boof clears them.

## Boats and kit

- Rivers: a **half slice** river runner (high volume bow, low slicey stern), procedurally lofted in `src/kayak.ts`.
- Standing waves: a stubby **playboat**.
- White water helmet, buoyancy aid, spray deck and a feathered double paddle. Boat colours are on the
  RIDES tab of MY RIDER; the rider's own look carries over.

## Water

Light, animated toon water (`src/river.ts`): a flowing surface, foam where it breaks (crests, steep
chutes, the foot of drops, holes, rock pillows), a cut-away front so you see the depth, and spray.
Auto quality turns the spray down on slow devices.

## Still to do

- Forest Creek, Canyon River and Waterfall Gorge, each with its own standing wave, with full polish
  (mood, landmarks, trackside detail, lighting, ambience, screenshot review, landings and playtest gates).
- A proper white water helmet model (it borrows the skate helmet for now).
- Slalom gates and more landmarks on the Whitewater Centre.
