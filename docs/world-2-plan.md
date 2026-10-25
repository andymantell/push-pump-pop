# Push Pump Pop: World 2 plan

Andy approved the biomes on 2026-10-25 and chose a **World 2** that opens when Volcano 5 is
complete (same rule as every world: complete track 5, the next world opens). The level select
has a WORLD 1 / WORLD 2 tab. Biomes are built one per batch, each with the full polish pass
(mood and landmarks per track, Blender props, ambience, screenshot review, `npm test`).
The ground rules, difficulty scale, challenges and par calibration in `level-plan.md` all apply.

| # | Biome | Main idea | Tracks | Difficulty | Bonus | Status |
|---|-------|-----------|-------:|-----------|-------|--------|
| 1 | Autumn Farm | mud patches you pump through | 8 | 2 to 5 | Barn Halfpipe | built |
| 2 | Candy Kingdom | jelly bounce pads | 8 | 3 to 6 | Jelly Bowl | built |
| 3 | Harbour Docks | long manual and ledge combos on containers | 10 | 4 to 7 | Harbour Crane Mega Ramp | built |
| 4 | Pirate Cove | stepping-stone gaps close together | 8 | 5 to 7 | Galleon Bowl | built |
| 5 | Haunted Hollow | big drop-offs in the dark | 8 | 5 to 8 | Graveyard Halfpipe | built |
| 6 | Funfair | loops chained together, coaster rails | 10 | 6 to 8 | Big Top Halfpipe | built |
| 7 | Toxic Factory | conveyor belts and goo pits | 10 | 6 to 9 | mega ramp | planned |
| 8 | Crystal Mine | rail lines and rail-to-rail hops | 10 | 6 to 9 | mega ramp | planned |
| 9 | Dino Valley | giant humps to launch off | 10 | 7 to 9 | mega ramp | planned |
| 10 | Moon Base | low gravity (about 7 instead of 14), bigger features | 10 | 7 to 10 | mega ramp | planned |
| 11 | Sky Islands | uphill gaps between floating islands | 10 | 8 to 10 | mega ramp | planned |

New pieces still to build: `conveyor` (Toxic Factory), up-rails (Crystal
Mine), giant humps (Dino), gravity per biome and a tall-air camera (Moon), sky pits (Sky Islands).

## Autumn Farm: mud

`mud(len)` lays a flat muddy patch and `muddy(fn)` makes whatever `fn` lays muddy (a valley,
rollers). On the ground in mud the rider loses `MUD_DRAG + MUD_DRAG_PER_SPEED * speed` m/s²
(about 2.8 at 10 m/s), so an 8 m patch takes 3 to 4 m/s off you. Pumping a muddy dip or roller
wins most of it back. Mud is drawn as a wet strip with puddles and drips, throws up clods, and
squelches.

Andy asked (2026-10-25) for the farm to be ridden on a **mountain board**: big tyres, feet bound
in, a helmet. Bound in means no board flips, so it has the snowboard's swipe tricks (BS Shifty,
FS Shifty, Tuck Knee), as Andy suggested. Grabs, spins and tilt flips (Andy chose to keep these),
manuals and grinds work as everywhere else.

| # | id | Name | Diff | New | Landmarks | Mood |
|---|----|------|----:|-----|-----------|------|
| 1 | farm-1 | Muddy Lane | 2 | mud on the flat, muddy dips | barn | morning |
| 2 | farm-2 | Hay Hop | 2 | hay bale kickers | tractor, silos | golden |
| 3 | farm-3 | Puddle Pump | 3 | muddy rollers, manual pads | haystack, windmill | rain |
| 4 | farm-4 | Fence Line | 3 | fence rails | coop, farmhouse | morning mist |
| 5 | farm-5 | Maize Run | 4 | muddy ditches (gaps) | maize maze | harvest sun |
| 6 | farm-6 | Pumpkin Patch | 4 | trick sets | pumpkin patch, barn | sunset |
| 7 | farm-7 | Tractor Tracks | 5 | muddy downhill, trailer ramps | combine, silos | windy |
| 8 | farm-8 | Harvest Home | 5 | everything | balloons, farmhouse | harvest moon |
| bonus | farm-pipe | Barn Halfpipe | - | - | barn | dusk |

## Candy Kingdom: jelly pads

`bouncer(len, lift)` lays a jelly pad on the flat. Rolling onto it at more than 1 m/s flings you
up at `lift` m/s (25% more if you pump as you hit it), so the distance comes from your speed.
Pads chained with `.land(22).flat(1)` between them make bounce combos; tag the chain with
`spot('chain')` before the first pad and `spot('chainend')` before the last. Gaps after pads are
the chocolate river (water fill drawn as chocolate). The path is biscuit on layer cake, rails are
candy canes (a glassy grind), and the ambience is music-box twinkles and chocolate bubbles.

| # | id | Name | Diff | New | Landmarks | Mood |
|---|----|------|----:|-----|-----------|------|
| 1 | candy-1 | Jelly Jump | 3 | jelly pads | lollipop arch | sunny |
| 2 | candy-2 | Gumdrop Hills | 3 | pump on the pad for height | giant cupcake, gingerbread house | sugar morning |
| 3 | candy-3 | Bounce House | 4 | bounce chains | gumball machine, doughnut wheel | candyfloss sunset |
| 4 | candy-4 | Chocolate River | 4 | pads over gaps | chocolate waterfall | golden caramel |
| 5 | candy-5 | Candy Cane Lane | 5 | candy cane rails | layer cake, lollipop arch | candyfloss clouds |
| 6 | candy-6 | Sprinkle Storm | 5 | trick sets | gingerbread house, gumball machine | sprinkle shower |
| 7 | candy-7 | Sugar Rush | 6 | long chains, gaps | doughnut wheel, giant cupcake | candy dusk |
| 8 | candy-8 | Candy Castle | 6 | everything | gingerbread castle | night lights |
| bonus | candy-pipe | Jelly Bowl | - | - | doughnut wheel | candyfloss sunset |

## Harbour Docks: containers and combos

`containers(n)` lays `n` shipping containers (6.1 m each) for the track to ride along the
roof of. They're flat and count as a manual pad; the quay behind them sits two boxes down, so
reach them down a ramp (`ease`) and leave off the end over the water (`pit` then `land`). The
quay is level behind the track (smoothed over 24 m), with a granite harbour wall down to the
water 22 m back; the water follows the quay's level along the track (`seaY`) so it's always in
view. Gaps are harbour water.

| # | id | Name | Diff | New | Landmarks | Mood |
|---|----|------|----:|-----|-----------|------|
| 1 | docks-1 | Quayside | 4 | manual pads, quay ledges, containers | harbour clock, tug | morning |
| 2 | docks-2 | Container Yard | 4 | off the containers over the water | gantry crane, cargo ship | grey sky |
| 3 | docks-3 | Fish Market | 5 | market steps and handrails | fish market, warehouse | early market |
| 4 | docks-4 | Crane Line | 5 | rails and ledges in a row | gantry crane, tug | golden |
| 5 | docks-5 | Pier Gaps | 5 | gaps over the water | lighthouse, ferry | sea fog |
| 6 | docks-6 | Ferry Ramp | 6 | big kickers | ferry, harbour clock | sunset |
| 7 | docks-7 | Stack Attack | 6 | stack to stack combos | cargo ship, gantry crane | drizzle |
| 8 | docks-8 | Night Shift | 6 | everything under floodlights | warehouse, tug | night |
| 9 | docks-9 | Storm Surge | 7 | three-gap sets | lighthouse, cargo ship | thunderstorm |
| 10 | docks-10 | Big Ship | 7 | everything, a 7 m gap | gantry crane, ferry | sailing day |
| bonus | docks-mega | Harbour Crane Mega Ramp | - | - | gantry crane | dusk |

## Pirate Cove: stepping stones

`stones(n, gap)` lays `n` rocks standing out of the sea, each gap a little wider than the
last (up to 7.6 m). Each rock is a landing slope to pump, a metre of flat and a kicker to the
next. Start it off a kicker on the flat (no run-in slope, or riders who never pump clear it
all) and finish with a `pit` and a `land`. The first rock's landing is longer (28 m), as you
come off the first kicker fastest. Rocks are drawn as weathered stone with a craggy face, the
sea in front and boulders around. Combo challenges run between the 'stones' and 'stonesend'
spots, so keep sets to four rocks: the bot can't hold a combo through five.

| # | id | Name | Diff | New | Landmarks | Mood |
|---|----|------|----:|-----|-----------|------|
| 1 | pirate-1 | Stepping Stones | 5 | stepping stones | treasure, pirate ship | sunny |
| 2 | pirate-2 | Shipwreck Shallows | 5 | three-stone combos, a gap | shipwreck, tavern | low tide |
| 3 | pirate-3 | Plank Walk | 5 | plank rails onto the stones | fort | golden |
| 4 | pirate-4 | Skull Rock | 6 | wider stones | skull rock, treasure | squall |
| 5 | pirate-5 | Cannon Run | 6 | big cannon-ramp gaps | fort, pirate ship | sunset |
| 6 | pirate-6 | Treasure Trail | 6 | jetty manuals, everything | tavern, skull rock | treasure hunt |
| 7 | pirate-7 | Kraken Reef | 7 | four-stone reefs | shipwreck, lighthouse | kraken mist |
| 8 | pirate-8 | Captain's Revenge | 7 | everything, a 7 m gap | pirate ship, fort | torchlit night |
| bonus | pirate-pipe | Galleon Bowl | - | - | pirate ship | dusk |

## Haunted Hollow: drop-offs

`dropoff(h, len, fall)` drops the ground `h` metres at a lip onto a landing `len` long (20 m
or more, or fast riders overshoot it). Roll off with speed and you land on the slope; slowly
and you thump onto its top. The landings check counts rolling off a drop-off's lip as a jump.
Always after dark: gas lamps, glowing jack-o'-lanterns, a castle on the skyline, and
will-o'-the-wisps (a new `wisps` particle). Friendly cartoon ghosts, not scary ones.

| # | id | Name | Diff | New | Landmarks | Mood |
|---|----|------|----:|-----|-----------|------|
| 1 | haunted-1 | Spooky Steps | 5 | drop-offs | graveyard gate, spooky oak | dusk |
| 2 | haunted-2 | Graveyard Drop | 5 | bigger drops, open graves | manor | full moon |
| 3 | haunted-3 | Crooked Bridge | 6 | rails over the ravine | witch's hut, graveyard gate | graveyard fog |
| 4 | haunted-4 | Pumpkin Patch | 6 | pumpkin rollers | giant pumpkin, spooky oak | pumpkin night |
| 5 | haunted-5 | Into the Dark | 7 | drops into gaps | manor, witch's hut | will-o'-the-wisps |
| 6 | haunted-6 | Ghost Train | 7 | down-rails then drops | spooky oak, giant pumpkin | stormy night |
| 7 | haunted-7 | Manor Stairs | 7 | stairs and handrails | graveyard gate, manor | harvest moon |
| 8 | haunted-8 | Off the Roof | 8 | everything, a 7.4 m gap | manor | midnight |
| bonus | haunted-pipe | Graveyard Halfpipe | - | - | manor | full moon |

## Funfair: loops back to back

Two loops in a row work with the existing `loop()`: drop in (`ease(14, -4)`), loop, then
`flat(3).ease(10, -2.5).flat(3)` before the second, and the bot gets round both every time.
Leave a roller and some flat between a loop and a rail, or the bot can't get on the rail.
The track is a painted boardwalk on a wooden coaster frame, with tents, a coaster and a big
wheel on the skyline.

| # | id | Name | Diff | New | Landmarks | Mood |
|---|----|------|----:|-----|-----------|------|
| 1 | funfair-1 | Loop the Loop | 6 | loops | balloon arch, big wheel | sunny |
| 2 | funfair-2 | Double Trouble | 6 | two loops in a row | carousel, coaster hill | morning |
| 3 | funfair-3 | Coaster Rail | 6 | coaster down-rails | coaster hill | afternoon |
| 4 | funfair-4 | Loop to Gap | 7 | loop into a gap | helter-skelter, big top | breezy |
| 5 | funfair-5 | Helter-Skelter | 7 | drop after drop | helter-skelter, carousel | golden |
| 6 | funfair-6 | Bumper Cars | 7 | kicker after kicker | big top, big wheel | candyfloss sky |
| 7 | funfair-7 | Loop and Grind | 7 | loop then a rail | carousel, coaster hill | sunset |
| 8 | funfair-8 | Waltzer Spin | 8 | big gaps, a double loop | big top, helter-skelter | dusk |
| 9 | funfair-9 | Night Ride | 8 | everything | big wheel, carousel | fair lights |
| 10 | funfair-10 | Big Dipper | 8 | huge first drop, a 7.4 m gap | coaster hill, balloon arch | last ride |
| bonus | funfair-pipe | Big Top Halfpipe | - | - | big top | showtime |
