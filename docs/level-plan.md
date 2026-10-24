# Push Pump Pop: level plan (70 tracks + 7 half pipes)

Status: **plan for review**. Nothing here is built yet. Numbers marked *(verify)* are
design targets that must be checked with `scripts/sim.ts` / `npm test` when the track is built.

7 biomes x 10 run tracks, plus one half-pipe bonus per biome. The game is played on an
iPad by a young child, so the first biome teaches one thing per track and nothing in the
first six tracks can make you lose a life by accident.

---

## 1. Ground rules for every track

These apply to all 70 tracks and come from what the game and the playtest already enforce.

- **Pump feel.** Every roller's downslope must last at least ~0.5 s at the speed you
  arrive at it. In practice: roller length (one full bump) >= 12 m in normal biomes,
  >= 16 m in Snowy Mountain (top speed 21 m/s instead of 17). Never shorter than the
  12 m rollers already in `jungle-1`. The playtest fails anything with a median downslope
  under 0.3 s; aim for 0.35 s or more.
- **Playtest gates stay as they are** (`npm test`): every bot run finishes with lives left,
  at least 50% of runs finish without losing a life, no sudden stops, every gap cleared by
  at least 60% of attempts.
- **Extra gate for gentle tracks (new, proposed).** Tracks with difficulty 1 to 3 must also be
  finished by the pump-only bot (it never ollies) without losing a life. That means
  **no gaps** in those tracks, only things you can roll over. Park 7 ("Mind the Gap") is the
  first track that is allowed to fail the pump-only bot.
- **New moves are optional first.** A move is "introduced" with a sign and an easy place to
  do it, and is worth points, but the track can be finished without it. The only move that
  is ever *required* is the ollie (to clear gaps). Grinds and loops stay optional for score
  unless the grind/loop implementation makes a missed grind or a stalled loop harmless.
- **Lengths.** The playtest gives up at 120 s. Keep the bot's median time under 90 s, so the
  longest track is about 900 m (bots average about 9 to 11 m/s, a bit more on snow).
- **Signs.** Each new idea gets a sign the first time it appears (e.g. `TILT: MANUAL`,
  `GRIND!`, `LOOP!`). Later tracks only sign hazards (`GAP!`, `LAVA!`).
- **Changelog.** Each batch of tracks that ships adds a kid-friendly line to `changelog.json`.

### Difficulty scale (1 to 10)

One global scale so the whole game ramps smoothly. A track's difficulty is set by the
hardest thing on it, using these knobs:

| Diff | Gaps | Gap length | Landing vs lip | Rest between hazards | Other |
|-----:|------|-----------|----------------|----------------------|-------|
| 1-2  | none | - | - | lots | small kickers only (<= 1.6 m), rollers amp <= 1.2 m |
| 3    | none, or 1 tiny | 2-2.5 m | >= 1 m lower | 30 m+ flat run-up | first manual pads, first rails |
| 4    | 2-3 | 2.5-4 m | >= 1 m lower | 20 m+ | combos encouraged |
| 5    | 3-4 | 3-4.5 m | lower or level | 15 m+ | steep valleys 4-5 m deep |
| 6    | 4-5 | 4-5.5 m | level allowed | 12 m+ | rail-to-gap, first loop |
| 7    | 5-6 | 5-6 m | +0.5 m (uphill) allowed | 10 m+ | speed must come from pumping |
| 8    | 6-7 | 5-6.5 m | up to +0.8 m *(verify)* | 8 m+ | two hazards in one rhythm |
| 9    | 7-8 | 6-7 m | any | 8 m+ | loops into gaps |
| 10   | 8+  | 6-8 m *(verify: longest today is 7 m at 79% clears)* | any | 6 m+ | everything |

### Par and stars (proposed)

- Each track has a **par score**. Finishing gives 1 star, half par gives 2, par gives 3.
  Stars are shown on the level select next to the best score. They never lock anything.
- The par numbers below are design targets. When a track is built, **calibrate**: run the
  trick bot's 24 runs, take the 75th-percentile score and round to the nearest 500. If that
  is more than 25% away from the target, change the layout (more or fewer airs) rather than
  the par, so scores keep climbing through the game.
- For reference, the bot's scores today (median / 90th percentile): park-1 14.9k / 17.4k,
  beach-1 5.6k / 6.4k, rooftops-1 17.5k / 20.8k, snow-1 18.4k / 20.8k,
  desert-1 5.0k / 7.0k, jungle-1 4.4k / 5.7k, volcano-1 16.7k / 25.7k. Half pipes 15.8k
  to 23.6k median.

---

## 2. Unlock order

Confirmed by Andy (2026-10-24): the next biome opens after track 5.

- The game opens with **Sunny Park 1** only.
- Finishing a track (reaching the finish with a life left) unlocks the next track in that biome.
- **Finishing track 5 of a biome unlocks track 1 of the next biome.** So there are always two
  biomes on the go and a stuck child can go somewhere new. Biome order stays
  Park, Beach, Rooftops, Snow, Desert, Jungle, Volcano.
- **Finishing track 3 of a biome unlocks its half pipe.**
- Because of the T5 rule, anything taught in tracks 6 to 10 of a biome (e.g. grinds in
  Park 8) can't be relied on in the next biome's tracks 1 to 5. Those stay optional there.
- A parent/debug "unlock all" (e.g. long-press the title) is worth having for testing.

The level select will need paging or a scroll per biome once there are 11 buttons in a row.

---

## 3. When each move appears

| Move | Introduced | First required / central | Escalated in |
|------|-----------|--------------------------|--------------|
| Pump | Park 1 | Beach 4 (no downhill, pump or stop) | Beach, Desert, Jungle |
| Ollie | Park 2 | Park 7 (first gaps) | everywhere |
| Kickflip / Heelflip / Shove-it | Park 3 | (score only) | combos from Park 9 |
| Grabs | Park 4 | (score only) | big airs in Snow |
| Spins 180 / 360 | Park 5 | (score only) | Snow, half pipes |
| Manuals (tilt) | Park 6 (manual pads) | (score only, links combos) | Beach 6, Snow 5 |
| Gaps | Park 7 | Park 7 | Rooftops (the gap biome), Volcano |
| Grinds, flat rail | Park 8 | (score only) | Beach 3, 8 |
| Combos | Park 9 | (score only) | every later track |
| Stairs and stair rails | Rooftops 2 / 4 | stairs: Rooftops 2 | Jungle 3, Volcano 4 |
| Body flips (tilt in air) | Snow 2 | (score only) | Snow, half pipes |
| Loops | Desert 8 | Desert 8 if a stalled loop is safe, otherwise optional | Jungle 7+, Volcano 5+ |

Manual pads link combos for free: the combo timer only runs while you are on the ground
and **not** in a manual (`score.update(dt, grounded && !manual)`), so a pad between two
kickers keeps the combo alive.

Tilt direction on a real iPad isn't confirmed yet, so Park 6 and Snow 2 should be built
after that is checked.

---

## 4. Track list

Columns: **#**, **id**, **name**, **length** (metres to the finish), **diff** (1-10),
**new** (what it introduces), **uses**, **layout** (one line), **par** (target).
"Existing" means the track is already in `src/tracks.ts`; its id is kept so saved best
scores survive.

### Sunny Park: learn every move, one per track

Mechanic: basics. Concrete, grass, no water. Each track teaches exactly one new thing with a
sign and three or four easy goes at it, then a short mix of everything so far. No gaps until
track 7.

| # | id | Name | Length | Diff | New | Uses | Layout | Par |
|---|----|------|-------:|----:|-----|------|--------|----:|
| 1 | park-1 | First Pump | 180 | 1 | pump (keeps the pump-timing cue) | - | Drop in, three long gentle rollers, flat, three more, one big easy downhill to the finish. Nothing to ollie. Rebuilt from today's First Pump, which moves to Park 10. | 1,000 |
| 2 | park-2 | Little Ollies | 220 | 1 | ollie | pump | Three small kickers (1.0-1.2 m) with long rolling landings and `SWIPE UP` signs, rollers between. All can be rolled over. | 3,000 |
| 3 | park-3 | Flip Out | 260 | 2 | kickflip, heelflip, shove-it | ollie | One sign and two kickers (1.3-1.6 m) per flip, then a row of three kickers to try any. | 6,000 |
| 4 | park-4 | Grab Bag | 300 | 2 | grabs (left thumb, hold) | flips | Bigger kickers (1.6-1.9 m) dropping onto long downhill landings so airs are long and holding a grab is easy. | 8,000 |
| 5 | park-5 | Spin Cycle | 330 | 2 | 180 / 360 spins | grabs, flips | Kickers from a drop-in for big airs, the last one a `BIG AIR` big enough for a 360. | 10,000 |
| 6 | park-6 | Wheelie Way | 360 | 3 | manuals (tilt) | all so far | Low flat manual pads (0.3-0.4 m high, 6-10 m long) between rollers, with `TILT: MANUAL` signs. | 11,000 |
| 7 | park-7 | Mind the Gap | 400 | 3 | gaps | ollie | Three small gaps (2-2.5 m, landing 1 m+ lower) after long flat run-ups and `GAP!` signs, rollers between. | 13,000 |
| 8 | park-8 | Rail Ride | 420 | 3 | flat grind rail | manuals | Two low rails on flat ground, then a rail just after a kicker. Needs the grind work to land first. | 15,000 |
| 9 | park-9 | Combo Park | 460 | 4 | combo linking | everything | Sets of kicker, manual pad, kicker spaced so one combo carries through each set; `LINK IT!` sign. | 18,000 |
| 10 | park-10 | Big Air Sunday | 520 | 4 | - | everything | Today's First Pump layout extended: three gaps up to 4 m, a rail, and the big final air. | 22,000 |

Half pipe: **Sunny Halfpipe** (existing `park-pipe`), unlocks after Park 3.

### Beach Boardwalk: flow

Mechanic: long wooden rollers. Taught as "rollers give you speed", escalated until rollers are
the *only* speed you get, then you need that speed for water gaps.

| # | id | Name | Length | Diff | New | Uses | Layout | Par |
|---|----|------|-------:|----:|-----|------|--------|----:|
| 1 | beach-1 | Boardwalk Breeze (existing) | 350 | 2 | flow (long rollers) | pump, ollie | Existing layout, but shrink the final 6 m water gap to 4 m so it fits a first track. | 6,000 |
| 2 | beach-2 | Sandy Swells | 300 | 3 | popping off roller tops | pump, grabs | Big rollers (16 m, 1.6-1.8 m high) where a well-timed ollie at the crest gives air. No gaps. | 8,000 |
| 3 | beach-3 | Pier Pressure | 340 | 3 | long flat rails (8-12 m) | grinds | Pier rails between roller sets, one water gap 3 m. | 10,000 |
| 4 | beach-4 | Low Tide | 380 | 3 | pump or stop: no downhill | pump | The whole track is level overall. Ten rollers, then a small gap at the very end that needs the speed you pumped. | 10,000 |
| 5 | beach-5 | Surf's Up | 420 | 4 | gaps fed by rollers | flow | Three water gaps (3.5-4.5 m), each after four rollers on level ground. | 13,000 |
| 6 | beach-6 | Sunset Strip | 450 | 4 | one-combo sections | manuals, flips | Crests and manual pads arranged so a whole section can be one combo; `KEEP IT GOING!`. | 16,000 |
| 7 | beach-7 | Lifeguard Lookout | 480 | 4 | - | grabs, spins | Launch ramps over lifeguard towers onto long landings, two 5 m water gaps. | 17,000 |
| 8 | beach-8 | Jetty Jump | 520 | 5 | rail-to-gap | grinds, gaps | A pier rail ending at the lip of a water gap: pop off the end. Riders who skip the rail ollie the lip as normal. | 19,000 |
| 9 | beach-9 | Riptide | 560 | 5 | changing roller lengths | flow | Roller sets of 12, 16 and 20 m in a row, so pump timing changes; three water gaps. | 21,000 |
| 10 | beach-10 | End of the Pier | 620 | 5 | - | everything | One long unbroken flow: rollers, rails, three gaps, and a giant launch off the pier end. | 25,000 |

Half pipe: **Boardwalk Bowl** (existing `beach-pipe`).

### Downtown Rooftops: gaps

Mechanic: gaps between buildings. Escalated by length, then by landing height (lower, then
level, then uphill), then by putting gaps close together, then by entering them from stairs
and rails.

| # | id | Name | Length | Diff | New | Uses | Layout | Par |
|---|----|------|-------:|----:|-----|------|--------|----:|
| 1 | rooftops-1 | Rooftop Hop | 240 | 3 | alley gaps | ollie | Three 2.5-3 m gaps, each landing a full storey (1.5 m+) lower, long run-ups. Takes over the `rooftops-1` id. | 9,000 |
| 2 | rooftops-2 | Stair Street | 280 | 3 | stair sets | gaps | Roofs linked by stair sets going down; ollie the stairs or roll them. Two small gaps. | 12,000 |
| 3 | rooftops-3 | Rush Hour Roofs (existing) | 240 | 4 | - | gaps, rollers | Today's `rooftops-1` layout, moved here (five gaps is too many for track 1). Best scores move with it. | 19,000 |
| 4 | rooftops-4 | Handrail Hustle | 360 | 4 | stair rails | stairs, grinds | Stair sets with handrails down them, gaps between buildings. | 18,000 |
| 5 | rooftops-5 | Level Best | 400 | 5 | level landings | gaps | Four 3-4 m gaps landing at the same height, so you need speed from the rollers before each. | 20,000 |
| 6 | rooftops-6 | Neon Nights | 440 | 5 | ledge grind into a gap | grinds, gaps | Roof-edge ledges ending at an alley; grind, pop, land. | 23,000 |
| 7 | rooftops-7 | Scaffold Scramble | 480 | 5 | uphill landings (+0.5 m) | gaps | Drops down onto scaffolding then gaps up onto the next roof. | 25,000 |
| 8 | rooftops-8 | Billboard Blast | 520 | 6 | long gaps (5-6 m) | big airs | Big kickers built on billboards over wide streets. | 27,000 |
| 9 | rooftops-9 | Skyline Sprint | 560 | 6 | gaps in a row | rhythm | Gap, one roller, gap, one roller, gap: four of these sets. | 29,000 |
| 10 | rooftops-10 | Penthouse Plunge | 640 | 7 | - | everything | Start at the top of a tower, drop down stairs and rails, finish with a 6 m gap to a lower roof. | 34,000 |

Half pipe: **Rooftop Halfpipe** (existing `rooftops-pipe`).

### Snowy Mountain: ice and huge air (snowboard)

Mechanic: low friction (0.35) and a higher top speed (21 m/s). You barely lose speed, so the
challenge is timing at speed and handling big airs. Taught on open slopes, escalated with
crevasse gaps at speed and long flat ice where you keep what you have. Rollers are 16 m+.

| # | id | Name | Length | Diff | New | Uses | Layout | Par |
|---|----|------|-------:|----:|-----|------|--------|----:|
| 1 | snow-1 | Powder Run (existing) | 340 | 4 | ice, snowboard | big airs | Existing layout (no gaps). | 20,000 |
| 2 | snow-2 | Flip Hill | 380 | 4 | backflip / frontflip (tilt in air) | grabs | Three huge kickers onto long downhill landings with `TILT: FLIP` signs. | 24,000 |
| 3 | snow-3 | Pine Glades | 420 | 5 | timing at speed | pump, ollie | Long 18 m rollers and kickers through trees, coming at you fast. | 24,000 |
| 4 | snow-4 | Crevasse Crossing | 480 | 5 | crevasse gaps | gaps at speed | Three 4-5 m crevasses landing downhill. | 27,000 |
| 5 | snow-5 | Frozen Lake | 520 | 5 | long flat ice | manuals | A frozen lake you glide across keeping your speed, with manual pads for one long combo. | 30,000 |
| 6 | snow-6 | Chairlift Line | 560 | 6 | snowboard boxes and down rails | grinds | Rails and boxes under the chairlift, kickers between. | 32,000 |
| 7 | snow-7 | Avalanche Alley | 620 | 6 | kickers in quick succession | rhythm at speed | Steep run with kickers every 25-30 m. | 35,000 |
| 8 | snow-8 | Glacier Gaps | 680 | 6 | level landing at speed | gaps | Five crevasses, the last two landing level. | 37,000 |
| 9 | snow-9 | Yeti Ridge | 740 | 7 | - | flips, spins, gaps | Giant kickers (2.6 m+) with room for a flip plus a grab; two crevasses. | 40,000 |
| 10 | snow-10 | Summit Send | 820 | 7 | - | everything | Top to bottom: big drop, rails, crevasses, and a giant final `HUGE AIR`. | 45,000 |

Half pipe: **Ice Pipe** (existing `snow-pipe`).

### Desert Canyon: steep valleys

Mechanic: deep gullies you must pump out of. Taught with shallow dips, escalated by depth and
steepness, then gullies chained together, then gullies that feed a gap. Loops are introduced
here (track 8) as the next step after "steep".

| # | id | Name | Length | Diff | New | Uses | Layout | Par |
|---|----|------|-------:|----:|-----|------|--------|----:|
| 1 | desert-1 | Dry Gulch (existing) | 300 | 4 | pumping out of gullies | pump | Existing layout, lengthened with one more 3 m valley. | 6,000 |
| 2 | desert-2 | Rattlesnake Ravine | 340 | 5 | back-to-back valleys | pump | Pairs of 4-5 m deep valleys with little flat between. | 9,000 |
| 3 | desert-3 | Cactus Coulee | 380 | 5 | kicker on the valley exit | pump, ollie | Pump out of each gully straight into a kicker for air. | 13,000 |
| 4 | desert-4 | Mesa Top | 420 | 6 | gullies that feed a gap | gaps | Pump a gully to get the speed for a dry-riverbed gap (3.5-4.5 m). | 16,000 |
| 5 | desert-5 | Tumbleweed Trail | 460 | 6 | rail across a gully | grinds | A rail bridging a valley; skip it and you ride the gully instead. | 19,000 |
| 6 | desert-6 | The Big Dip | 500 | 7 | 6 m deep, steep walls | pump | Three very deep gullies that each need two good pumps (pump-only bot check). | 21,000 |
| 7 | desert-7 | Sandstorm Slalom | 540 | 7 | mixed sizes | valleys, rollers | Valleys and rollers alternating in changing sizes, two gaps. | 24,000 |
| 8 | desert-8 | Arch Loop | 580 | 7 | **loops** | pump | A sandstone arch loop after a long pump valley, `PUMP FOR SPEED` then `LOOP!`. Gentle radius, one loop only. | 28,000 |
| 9 | desert-9 | Canyon Run | 640 | 8 | - | loops, valleys, gaps | Two loops, deep valleys, three gaps. | 32,000 |
| 10 | desert-10 | Grand Gully | 720 | 8 | - | everything | The deepest valley (7 m), a loop out of it, and a big final gap. | 38,000 |

Half pipe: **Canyon Pipe** (existing `desert-pipe`).

### Jungle Ruins: rhythm

Mechanic: regular patterns you can feel as a beat: pump, pump, ollie. Taught with steady
12 m rollers, escalated by skipping beats, changing the tempo, and putting hazards (river
gaps, rails, loops) on the beat. Roller length never drops below 12 m.

| # | id | Name | Length | Diff | New | Uses | Layout | Par |
|---|----|------|-------:|----:|-----|------|--------|----:|
| 1 | jungle-1 | Temple Rhythm (existing) | 320 | 5 | rhythm | pump, gaps | Existing layout, lengthened with one more rhythm set. | 5,000 |
| 2 | jungle-2 | Drum Beat | 360 | 6 | skipped beats | pump, ollie | Steady rollers with a flat "missing beat", then kickers that land on the beat. | 9,000 |
| 3 | jungle-3 | Temple Steps | 400 | 6 | step-downs on the beat | stairs | Temple stair step-downs between roller sets. | 12,000 |
| 4 | jungle-4 | Croc Creek | 440 | 7 | gaps on the beat | gaps | A river gap after every fourth roller. | 15,000 |
| 5 | jungle-5 | Log Grind | 480 | 7 | rails in the rhythm | grinds | Roller, fallen-log rail, roller, rail. | 19,000 |
| 6 | jungle-6 | Tempo Shift | 520 | 7 | tempo changes | pump | Roller length steps 12, 16, 12, 20 m so the timing keeps changing. | 22,000 |
| 7 | jungle-7 | Serpent Loop | 560 | 8 | loops in the rhythm | loops | Rhythm sets that end in a loop. | 26,000 |
| 8 | jungle-8 | Lost Idol | 620 | 8 | syncopation | gaps, rails | Gap, roller, rail, gap, roller in a repeating pattern. | 30,000 |
| 9 | jungle-9 | Waterfall Drop | 680 | 8 | - | gaps, loops | Big drop beside a waterfall, a 6 m river gap, a loop. | 34,000 |
| 10 | jungle-10 | Heart of the Temple | 760 | 9 | - | everything | All jungle patterns in one run, two loops. | 40,000 |

Half pipe: **Temple Pipe** (existing `jungle-pipe`).

### Volcano: lava, everything combined

Mechanic: lava gaps everywhere. Each track takes another biome's skill and puts lava under
it, so the final biome is a tour of the whole game.

| # | id | Name | Length | Diff | New | Uses | Layout | Par |
|---|----|------|-------:|----:|-----|------|--------|----:|
| 1 | volcano-1 | Ember Trail | 360 | 6 | lava | gaps | Three 3-4 m lava gaps with long run-ups. Takes over the `volcano-1` id. | 15,000 |
| 2 | volcano-2 | Lava Leap (existing) | 400 | 7 | - | gaps | Today's `volcano-1` layout moved here and lengthened. Best scores move with it. | 20,000 |
| 3 | volcano-3 | Magma Rollers | 450 | 7 | (Beach) pump for lava gaps | flow | Level roller sets, each ending in a lava gap that needs the pumped speed. | 24,000 |
| 4 | volcano-4 | Basalt Steps | 500 | 8 | (Rooftops) stairs and rails over lava | stairs, grinds | Basalt stair sets and rails with lava gaps between. | 28,000 |
| 5 | volcano-5 | Lava Tube | 550 | 8 | (Desert) loop and gaps | loops | A loop inside a lava tube, then gaps. | 32,000 |
| 6 | volcano-6 | Caldera Rim | 600 | 8 | (Desert) craters | valleys | Deep craters to pump out of, each with a lava gap on the exit. | 35,000 |
| 7 | volcano-7 | Fire Rhythm | 660 | 9 | (Jungle) lava on the beat | rhythm | Rhythm sets with a lava gap every third roller. | 40,000 |
| 8 | volcano-8 | Eruption Run | 720 | 9 | - | gaps | Level and uphill landings across 6-7 m of lava. | 45,000 |
| 9 | volcano-9 | Pyroclastic Dash | 800 | 10 | - | everything | Few rests: two loops, rails over lava, eight gaps. | 50,000 |
| 10 | volcano-10 | Into the Crater | 900 | 10 | - | everything | Grand finale: one section per biome, then the longest gap in the game *(verify)* into the crater and the finish. | 60,000 |

Half pipe: **Magma Pipe** (existing `volcano-pipe`).

### Half pipes

All seven already exist (60 s score attack, no lives, pending Andy's confirmation). Each
unlocks after track 3 of its biome. Par is calibrated the same way (bot 75th percentile);
today's bot medians are about 22.5k (Sunny), 21.3k (Boardwalk), 23.5k (Rooftop),
17.0k (Ice), 16.9k (Canyon), 23.6k (Temple), 15.8k (Magma). No layout changes planned.

---

## 5. Changes to existing tracks

| Today | Becomes | Why |
|-------|---------|-----|
| park-1 First Pump | layout moves to park-10 Big Air Sunday; park-1 is rebuilt as a short pump-only track | it currently teaches ollies, kickflips, gaps and big air all at once |
| beach-1 | stays, final gap 6 m to 4 m | a first track shouldn't end on a 6 m gap |
| rooftops-1 Rush Hour Roofs | moves to rooftops-3 (new gentle rooftops-1) | five gaps is too many for track 1 |
| snow-1, desert-1, jungle-1 | stay as track 1 (desert and jungle lengthened slightly) | they already fit |
| volcano-1 Lava Leap | moves to volcano-2 (new gentler volcano-1) | six gaps and a 7 m gap is too hard to open a biome |

Moving a layout to a new id means copying its saved best score across
(`push-pump-pop-best-<id>` in localStorage) once on load, so nobody loses a record.

---

## 6. New pieces the builder needs

The current DSL (`flat`, `ease`, `kicker`, `rollers`, `valley`, `drop`, `rise`, `pit`,
`halfpipe`, `sign`, `prop`) covers most of this plan. Still needed:

- **Rails and stairs**: being added in the grind rails thread. Needed from Park 8
  (rails) and Rooftops 2 (stairs). Use whatever names that thread lands.
- **Loops**: the track is a height profile `y = h(x)`, which can't double back, so a loop
  has to be a special segment the rider follows on its own path. Needed from Desert 8.
  Being designed in another thread.
- **Manual pad**: a low flat box. Can be a helper over `rise`, `flat` and `drop`
  (or `kicker`/`ease` for soft edges). Needed from Park 6.
- **Unlocks and stars**: new level select logic (section 2), plus paging per biome.
- **Pump-only gate**: the extra playtest check for difficulty 1 to 3 (section 1).
  Tracks would need a `difficulty` field on `TrackDef` for this.

---

## 7. Suggested build order

1. Unlock logic, stars, `difficulty` on `TrackDef`, the pump-only gate, and the best-score
   migration, with the existing tracks re-slotted (section 5).
2. Park 1 to 7 (no grinds needed), then Beach 2 to 5 and Rooftops 1 to 2 so the first
   two biomes connect.
3. Park 8 to 10 and the rest of Beach and Rooftops once rails and stairs have landed.
4. Snow, then Desert 1 to 7.
5. Loops, then Desert 8 to 10, Jungle, Volcano.

Per track: build it in `src/tracks.ts`, add its signs, run `npm test` (fix the layout until
it passes), calibrate the par, and add a changelog line for the batch.
