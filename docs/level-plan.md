# Push Pump Pop: level plan (70 tracks + 7 bonus levels)

Status: **plan for review**. Nothing here is built yet. Numbers marked *(verify)* are
design targets that must be checked with `scripts/sim.ts` / `npm test` when the track is built.

7 biomes x 10 run tracks, plus one bonus level per biome (a half pipe or a mega ramp, see the Bonus levels section). The game is played on an
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
- **Moves are never needed to reach the finish, except the ollie** (to clear gaps). Grinds
  and loops can always be skipped on the way to the finish. Challenges (section 2a) are what
  ask for specific moves, and a challenge only asks for a move the player has been taught
  (see the rule in 2a).
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

### Par

- Each track has a **par score**. It is used by "Score N" challenges and shown on the
  results screen. Stars now come from challenges (section 2a), not from par.
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

Confirmed by Andy (2026-10-24): the next biome opens after track 5. Updated the same day:
finishing alone isn't enough, you also need the track's required challenges.

- The game opens with **Sunny Park 1** only.
- A track is **complete** when you have finished it (reached the finish with a life left) at
  least once **and** done its required challenges (section 2a). Completing a track unlocks
  the next track in that biome.
- **Completing track 5 of a biome unlocks track 1 of the next biome.** So there are always two
  biomes on the go and a stuck child can go somewhere new. Biome order stays
  Park, Beach, Rooftops, Snow, Desert, Jungle, Volcano.
- **Completing track 3 of a biome unlocks its bonus level** (half pipe or mega ramp).
- Because of the T5 rule, anything taught in tracks 6 to 10 of a biome (e.g. grinds in
  Park 8) may not have been played before the next biome. See the challenge rule in 2a.
- A parent/debug "unlock all" (e.g. long-press the title) is worth having for testing.

The level select will need paging or a scroll per biome once there are 11 buttons in a row.

---

## 2a. Challenges

Andy (2026-10-24): every track has challenges, specific tricks and combos you need to land
to progress, and they get harder through the game.

### Rules

- Every run track has **3 challenges**. Each one done is a **star** (0 to 3 stars per track).
- **Required to complete the track:** challenge 1 in Sunny Park and Beach Boardwalk;
  challenges 1 and 2 from Downtown Rooftops on. Challenge 3 is always optional, the hard one.
- Challenges are **saved as soon as they are done**, even in a run that then runs out of lives.
  You don't have to do them all in one run. Finishing the track is a separate requirement
  (also saved once done).
- **Taught moves only.** A required challenge may only ask for a move that is either taught
  earlier on the guaranteed path (tracks 1 to 5 of earlier biomes, or earlier tracks in this
  biome) or taught by a sign on this same track. Where a later track uses a move from
  outside that path (manuals in Snow 5, loops in Jungle 7 and Volcano 5), that track repeats
  the move's sign (`TILT: MANUAL`, `LOOP!`) before the first chance to do it.
- **Sunny Park 1 to 6 stay very easy:** challenge 1 is one simple thing with three or more
  chances to do it on the track.
- **Bonus levels** have 3 challenges too, but they never gate anything.

### Challenge kinds (for the builder)

`TrackDef.challenges: Challenge[]`, three per track, each with `text` (shown to the player)
and one of these kinds. "Over gap N" means the trick is landed in the air that clears pit N.

| Kind | Params | Example text |
|------|--------|--------------|
| `finish` | - | Finish the track |
| `trick` | name, or a group (`flip`, `grab`, `spin`, `bodyflip`), count, optional `overGap` | Land a kickflip / Grab over a gap |
| `allOf` | list of trick names, in one run | Land all four grabs |
| `sameAir` | list of names or groups | Grab and spin in the same air |
| `combo` | min tricks, optional must-include list, optional min points, optional `overGap` | Land a 3-trick combo |
| `grind` | count of rails or a specific rail, optional min seconds | Grind both flat rails |
| `manual` | min seconds | Manual for 1 second |
| `loop` | count | Ride the loop |
| `air` | min seconds or min metres | Air for 1.5 seconds |
| `pumps` | count of good pumps in one run | Do 10 good pumps |
| `gaps` | all gaps cleared in one run (no falls) | Clear every gap |
| `climb` | every valley exited without rolling back | Climb out of every gully first time |
| `noLives` | finish without losing a life | Finish without losing a life |
| `score` | points (usually par) | Score 10,000 |

A loop counts as a trick in combos ("Loop + flip combo"). A grind counts as a trick in combos
too, if the grind thread makes it one.

### How challenges show in the game

- **Level select:** each track button shows 0 to 3 stars and a lock. Tapping a locked track
  says what to do, e.g. "Do challenge 1 on Grab Bag to open this".
- **Before a run:** a card with the track name and its 3 challenges, each with an icon (the
  trick's swipe arrow, a rail, a loop, a gap), ticked if already done, and "needed" next to
  the required ones. One big GO button. Kept short enough to read aloud to a child.
- **During the run:** the 3 challenges sit small in the top-left corner as icons with ticks.
  When one is done: its tick fills in, a "CHALLENGE!" popup and a sound, and it's saved
  straight away. Challenges with a count show it (e.g. 2/3).
- **Results screen:** score and par, then the 3 challenges with ticks. Ones done this run get a
  "NEW!" badge. Then either "Next track unlocked!" or exactly what's still missing ("Finish
  the track" / "Do challenge 2 to open the next track").
- **Out of Lives screen:** also shows any challenges done in that run, so it still feels like
  progress.

### Playtest gate for challenges

The trick bot gets a "go for the challenges" mode (it does the asked tricks at the planned
places). Each **required** challenge must be done in at least 50% of that bot's runs; each
optional challenge at least once in 24 runs. Park 1 to 6 required challenges: at least 90%.

### Challenges by track

★ = required. Sunny Park and Beach need ★1; Rooftops onwards need ★1 and ★2.

**Sunny Park**

| # | Name | 1 | 2 | 3 |
|---|------|---|---|---|
| 1 | First Pump | ★ Finish the track | Do 3 good pumps | Finish without losing a life |
| 2 | Little Ollies | ★ Land an ollie | Ollie all 3 kickers | Score 3,000 |
| 3 | Flip Out | ★ Land a kickflip | Land a heelflip and a shove-it | Land all three flips in one run |
| 4 | Grab Bag | ★ Land a grab | Hold a grab for 1 second | Land all four grabs |
| 5 | Spin Cycle | ★ Land a 180 | Land a 360 | Grab and spin in the same air |
| 6 | Wheelie Way | ★ Manual for 1 second | Nose manual for 1 second | Manual a whole pad |
| 7 | Mind the Gap | ★ Clear a gap | Clear every gap | Kickflip over a gap |
| 8 | Rail Ride | ★ Grind a rail | Grind both flat rails | Grind the rail after the kicker |
| 9 | Combo Park | ★ Land a 2-trick combo | Land a 3-trick combo | Combo worth 3,000 |
| 10 | Big Air Sunday | ★ Clear every gap | Indy on the big air | Score 22,000 |

**Beach Boardwalk**

| # | Name | 1 | 2 | 3 |
|---|------|---|---|---|
| 1 | Boardwalk Breeze | ★ Clear every water gap | Land a 3-trick combo | Score 6,000 |
| 2 | Sandy Swells | ★ Get air off a roller top | Grab off a roller top | Air for 1 second |
| 3 | Pier Pressure | ★ Grind a pier rail | Grind for 2 seconds | Kickflip off the end of a rail |
| 4 | Low Tide | ★ Clear the end gap | Do 10 good pumps | Score 10,000 |
| 5 | Surf's Up | ★ Clear every water gap | Grab over every gap | Kickflip + Indy combo |
| 6 | Sunset Strip | ★ Land a 4-trick combo | Manual + flip + manual combo | Combo worth 8,000 |
| 7 | Lifeguard Lookout | ★ Land a 360 | Melon over a water gap | Score 17,000 |
| 8 | Jetty Jump | ★ Grind into the jetty gap and clear it | Rail + flip combo over the gap | Land a 5-trick combo |
| 9 | Riptide | ★ Clear every water gap | Do 15 good pumps | Score 21,000 |
| 10 | End of the Pier | ★ Finish without losing a life | 360 + grab off the pier end | Score 25,000 |

**Downtown Rooftops**

| # | Name | 1 | 2 | 3 |
|---|------|---|---|---|
| 1 | Rooftop Hop | ★ Clear every gap | ★ Kickflip over a gap | Finish without losing a life |
| 2 | Stair Street | ★ Ollie a stair set | ★ Heelflip a stair set | Land a 3-trick combo |
| 3 | Rush Hour Roofs | ★ Clear every gap | ★ Grab over 2 gaps | Finish without losing a life |
| 4 | Handrail Hustle | ★ Grind a stair rail | ★ Grind 2 stair rails | Stair rail + flip combo |
| 5 | Level Best | ★ Clear every gap | ★ 180 over a gap | Land a 4-trick combo |
| 6 | Neon Nights | ★ Grind a ledge and clear its gap | ★ Ledge grind + flip over the gap | Score 23,000 |
| 7 | Scaffold Scramble | ★ Clear every uphill gap | ★ Melon over an uphill gap | Finish without losing a life |
| 8 | Billboard Blast | ★ Air for 1.5 seconds | ★ Grab and spin in the same air over a gap | Score 27,000 |
| 9 | Skyline Sprint | ★ Clear a set of three gaps in one combo | ★ Land a 5-trick combo | Finish without losing a life |
| 10 | Penthouse Plunge | ★ Clear the final gap | ★ Rail + flip + grab combo | Score 34,000 |

**Snowy Mountain**

| # | Name | 1 | 2 | 3 |
|---|------|---|---|---|
| 1 | Powder Run | ★ Air for 1.5 seconds | ★ Land a 360 | Score 20,000 |
| 2 | Flip Hill | ★ Land a backflip | ★ Land a frontflip | Backflip and grab in the same air |
| 3 | Pine Glades | ★ Do 10 good pumps | ★ Land a 3-trick combo | Finish without losing a life |
| 4 | Crevasse Crossing | ★ Clear every crevasse | ★ Spin over a crevasse | Flip over a crevasse |
| 5 | Frozen Lake | ★ Manual for 3 seconds | ★ One combo across the lake | Combo worth 10,000 |
| 6 | Chairlift Line | ★ Grind a box | ★ Grind 3 rails | Rail + backflip combo |
| 7 | Avalanche Alley | ★ Land a 5-trick combo | ★ Finish with no bails | Score 35,000 |
| 8 | Glacier Gaps | ★ Clear every crevasse | ★ 360 over a level crevasse | Finish without losing a life |
| 9 | Yeti Ridge | ★ Backflip and grab in the same air | ★ Air of 3 metres | Combo worth 15,000 |
| 10 | Summit Send | ★ Backflip on the HUGE AIR | ★ Land a 6-trick combo | Score 45,000 |

**Desert Canyon**

| # | Name | 1 | 2 | 3 |
|---|------|---|---|---|
| 1 | Dry Gulch | ★ Do 8 good pumps | ★ Climb out of every gully first time | Score 6,000 |
| 2 | Rattlesnake Ravine | ★ Climb out of every gully first time | ★ Air off a gully lip | Finish without losing a life |
| 3 | Cactus Coulee | ★ Ollie off a gully kicker | ★ Flip + grab combo | Score 13,000 |
| 4 | Mesa Top | ★ Clear every gap | ★ Spin over a gap | Finish without losing a life |
| 5 | Tumbleweed Trail | ★ Grind across a gully | ★ Grind every gully rail | Grind + flip combo |
| 6 | The Big Dip | ★ Climb out of every gully first time | ★ Air off the last gully | Score 21,000 |
| 7 | Sandstorm Slalom | ★ Clear both gaps | ★ Land a 5-trick combo | Finish without losing a life |
| 8 | Arch Loop | ★ Ride the loop | ★ Loop + flip combo | Score 28,000 |
| 9 | Canyon Run | ★ Ride both loops | ★ Loop + grab + spin combo | Finish without losing a life |
| 10 | Grand Gully | ★ Clear the final gap | ★ Loop + 2 tricks combo | Score 38,000 |

**Jungle Ruins**

| # | Name | 1 | 2 | 3 |
|---|------|---|---|---|
| 1 | Temple Rhythm | ★ Clear both river gaps | ★ One combo across a rhythm set | Score 5,000 |
| 2 | Drum Beat | ★ Do 12 good pumps | ★ A trick on every kicker | Finish without losing a life |
| 3 | Temple Steps | ★ Flip off a step | ★ Land a 4-trick combo | Score 12,000 |
| 4 | Croc Creek | ★ Clear every river gap | ★ Grab over 3 gaps | Finish without losing a life |
| 5 | Log Grind | ★ Grind a log | ★ Grind every log | Log + flip + log combo |
| 6 | Tempo Shift | ★ Do 15 good pumps | ★ Finish with no bails | Score 22,000 |
| 7 | Serpent Loop | ★ Ride the loop | ★ Loop + flip combo | Land a 6-trick combo |
| 8 | Lost Idol | ★ Clear every gap | ★ Rail + gap + rail in one combo | Finish without losing a life |
| 9 | Waterfall Drop | ★ Clear the waterfall gap | ★ Backflip over the waterfall gap | Score 34,000 |
| 10 | Heart of the Temple | ★ Ride both loops | ★ Land a 7-trick combo | Finish without losing a life |

**Volcano**

| # | Name | 1 | 2 | 3 |
|---|------|---|---|---|
| 1 | Ember Trail | ★ Clear every lava gap | ★ Kickflip over lava | Finish without losing a life |
| 2 | Lava Leap | ★ Clear every lava gap | ★ Grab and spin in the same air over lava | Score 20,000 |
| 3 | Magma Rollers | ★ Clear every gap | ★ Do 12 good pumps | 3-trick combo over a lava gap |
| 4 | Basalt Steps | ★ Grind a rail over lava | ★ Stair rail + flip combo | Finish without losing a life |
| 5 | Lava Tube | ★ Ride the lava tube loop | ★ Loop + spin combo | Score 32,000 |
| 6 | Caldera Rim | ★ Climb out of every crater first time | ★ Flip over lava from a crater lip | Finish without losing a life |
| 7 | Fire Rhythm | ★ Clear every gap | ★ A trick over every lava gap | Score 40,000 |
| 8 | Eruption Run | ★ Clear every uphill gap | ★ 360 over the 6 m gap | Combo worth 20,000 |
| 9 | Pyroclastic Dash | ★ Ride both loops | ★ Land an 8-trick combo | Finish without losing a life |
| 10 | Into the Crater | ★ Clear the crater gap | ★ Backflip and grab in the same air over the crater gap | Score 60,000 with no lives lost |

**Bonus levels** (never required): half pipes: "Air of 2 metres", "Land 5 different
tricks", "Score par". Mega ramps: "Clear the gap on all 3 drops", "A trick on both airs of
one drop", "Score par".

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

Bonus: **Skyscraper Mega Ramp** (`rooftops-mega`, replaces Rooftop Halfpipe).

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

Bonus: **Ski Jump Mega Ramp** (`snow-mega`, replaces Ice Pipe).

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

Bonus: **Canyon Mega Ramp** (`desert-mega`, replaces Canyon Pipe).

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

Bonus: **Volcano Mega Ramp** (`volcano-mega`, replaces Magma Pipe).

### Bonus levels: half pipes and mega ramps

Andy (2026-10-24): some bonus levels should be mega ramps instead of half pipes. The big-air
biomes get mega ramps, the others keep their half pipes:

| Biome | Bonus | Kind |
|-------|-------|------|
| Sunny Park | Sunny Halfpipe (existing `park-pipe`) | half pipe |
| Beach Boardwalk | Boardwalk Bowl (existing `beach-pipe`) | half pipe |
| Downtown Rooftops | Skyscraper Mega Ramp (`rooftops-mega`) | mega ramp, smallest |
| Snowy Mountain | Ski Jump Mega Ramp (`snow-mega`) | mega ramp |
| Desert Canyon | Canyon Mega Ramp (`desert-mega`) | mega ramp |
| Jungle Ruins | Temple Pipe (existing `jungle-pipe`) | half pipe |
| Volcano | Volcano Mega Ramp (`volcano-mega`) | mega ramp, biggest |

Every bonus level unlocks after track 3 of its biome and has no lives.

**Half pipes** stay as they are: 60 s score attack. Par is calibrated the same way as run
tracks (bot 75th percentile). Today's bot medians: about 22.5k (Sunny), 21.3k (Boardwalk),
23.6k (Temple).

**Mega ramps** (new kind, `kind: 'mega'`): three drops, and the score is the total of all three.
One drop is:

1. Start on a tall platform and roll in down a long steep ramp. No pushing; speed comes from
   the roll-in (pumping still works).
2. A run-out, then a huge kicker over a big gap onto a long downhill landing ramp. Come up
   short and you fall in the gap: that drop ends with no score, but it doesn't cost a life.
3. A flat, then a giant quarter pipe for a second air, then you roll back and the drop ends.
4. The game puts you back at the top for the next drop.

The combo stays alive from the kicker through the quarter pipe, so a drop with tricks on both
airs scores best. The four mega ramps grow through the game:

| Mega ramp | Roll-in drop | Gap | Quarter pipe | Theme |
|-----------|-------------:|----:|-------------:|-------|
| Skyscraper | ~12 m | ~8 m | ~5 m | scaffold ramp off a tower roof |
| Ski Jump | ~16 m | ~10 m | ~6 m | ski-jump in-run, ice quarter pipe |
| Canyon | ~18 m | ~12 m | ~6 m | across a canyon between mesas |
| Volcano | ~20 m | ~14 m, over lava | ~7 m | down the volcano's side |

All sizes are *(verify)*: none of them has been checked against the physics, and the
playtest should require the bot to clear the gap on at least 60% of drops. Par is the
bot's 75th percentile, as for everything else.

The old Rooftop, Ice, Canyon and Magma half pipes are removed; their best scores are dropped
because a mega ramp score isn't comparable.

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
- **Unlocks, challenges and stars**: challenge tracking and saving, the pre-run card, HUD
  ticks and results (section 2a), new level select logic (section 2), plus paging per biome.
- **Mega ramps**: a `quarterpipe` piece (half of `halfpipe`), a three-drop mode that puts the
  rider back at the top after each drop, and a camera that zooms out for very big airs (half
  pipe airs are capped at about 3 m today so the camera can keep up).
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
6. Mega ramps can be built any time after step 1; they don't depend on the run tracks.

Per track: build it in `src/tracks.ts`, add its signs, run `npm test` (fix the layout until
it passes), calibrate the par, and add a changelog line for the batch.
