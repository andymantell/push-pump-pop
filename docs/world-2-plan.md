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
| 7 | Toxic Factory | conveyor belts and goo pits | 10 | 6 to 9 | Smokestack Mega Ramp | built |
| 8 | Crystal Mine | rail lines and rail-to-rail hops | 10 | 6 to 9 | Mine Shaft Mega Ramp | built |
| 9 | Dino Valley | giant humps to launch off | 10 | 7 to 9 | Long Neck Mega Ramp | built |
| 10 | Moon Base | low gravity (about 7 instead of 14), bigger features | 10 | 7 to 10 | Crater Halfpipe | built |
| 11 | Sky Islands | uphill gaps between floating islands | 10 | 8 to 10 | mega ramp | planned |

New pieces still to build: sky pits (Sky Islands).

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

## Toxic Factory: conveyor belts

`conveyor(len, speed)` is a belt on flat ground. A fast belt (green arrows, speed above yours)
pulls you up to its speed; a backwards one (red arrows, negative speed) drags you back, but
never below 3 m/s, so it can't stop you. Pumping anywhere on a belt pushes you on (and counts
as a good pump), and both bots pump all the way along belts. Put slow belts before gaps (riders
who never pump fall in) and fast ones before rails and kickers, since a fast belt before a gap
lets everyone clear it. Gaps are green goo (`pitFill: 'water'` in green).

| # | id | Name | Diff | New | Landmarks | Mood |
|---|----|------|----:|-----|-----------|------|
| 1 | toxic-1 | Fast Belt | 6 | fast belts | goo vat, cooling tower | smoggy day |
| 2 | toxic-2 | Slow Belt | 6 | slow belts to pump | control room | morning shift |
| 3 | toxic-3 | Goo Gaps | 7 | slow belts into goo gaps | goo vat, robot arm | toxic glow |
| 4 | toxic-4 | Pipe Rails | 7 | pipe rails, one over the goo | cooling tower, control room | grey day |
| 5 | toxic-5 | Barrel Stacks | 7 | kickers between belts | robot arm, goo vat | smoggy sun |
| 6 | toxic-6 | Crusher Room | 8 | everything, no let-up | crusher, cooling tower | drizzle |
| 7 | toxic-7 | Chute Drop | 8 | drop-offs onto belts | control room, crusher | sunset |
| 8 | toxic-8 | Switch Belts | 8 | fast and slow in turn | goo vat, robot arm | smog |
| 9 | toxic-9 | Night Shift | 9 | everything | crusher, control room | night shift |
| 10 | toxic-10 | Reactor Hall | 9 | everything, a 7.4 m goo gap | cooling tower, goo vat | reactor glow |
| bonus | toxic-mega | Smokestack Mega Ramp | - | - | cooling tower | dusk |

## Crystal Mine: rail lines

Underground: `cave: true` swaps the sky for a rock roof with stalactites, and the far scenery is
the cavern wall with glowing crystals in it. Two new pieces. `railchain(n, len, gap, step)` is a
line of rails, each a little lower than the one before: grind off the end of one and you drop
onto the next (the ground under them steps down too, so non-grinders just ride it).
`uprail(len, dy)` is a rail climbing a ramp, which slows you, so pump into it; it can lead
straight into a `downrail`. Leave at least 8 m of ground between a plain rail and a `gapRail`,
or the bots (and players) can't hop on. Gaps are dark mine shafts.

| # | id | Name | Diff | New | Landmarks | Mood |
|---|----|------|----:|-----|-----------|------|
| 1 | mine-1 | Cart Rails | 6 | rails, a 3-rail chain | mine entrance, geode | lantern-lit |
| 2 | mine-2 | Rail Hop | 6 | two rail chains | underground waterfall | crystal glow |
| 3 | mine-3 | Up the Rock | 7 | up-rails | geode, crystal cathedral | blue seam |
| 4 | mine-4 | Dark Shafts | 7 | shafts, a rail over one | mine entrance, waterfall | deep dark |
| 5 | mine-5 | Rail Lines | 7 | two 4-rail chains | cathedral, geode | emerald seam |
| 6 | mine-6 | Mine Mouth | 8 | drop-offs and rails | waterfall, mine entrance | sunset at the mouth |
| 7 | mine-7 | Cart Bridges | 8 | rail bridges over hollows | geode, cathedral | dusty |
| 8 | mine-8 | Deep Seam | 8 | four shafts, up and down rails | mine entrance, waterfall | crystal glow |
| 9 | mine-9 | Down the Shaft | 9 | everything | cathedral, geode | deep dark |
| 10 | mine-10 | Heart of the Mine | 9 | everything, a big final gap | waterfall, cathedral | heart of the mine |
| bonus | mine-mega | Mine Shaft Mega Ramp | - | - | cathedral | blue seam |

## Dino Valley: giant humps

`hump(h)` is a giant hump shaped like a dinosaur's back: a kicker `2.6h + 1` long up to a lip
`h` high (tagged 'kicker' and 'hump'), a 2 m top, then a `land()` sized for it. Hit it fast and
you fly over the top onto the far slope; slow, you roll over it. Sizes 1.6 to 3 pass the
landings check. Gaps are tar pits (`pitFill: 'water'` in near-black brown, "TAR PIT!"); rails
are fallen logs (log grind sound). The far scenery is a smoking volcano that erupts in the
Rumbling volcano and Eruption moods. The top of the track has dinosaur footprints along it and
the front shows fossils in the rock.

| # | id | Name | Diff | New | Landmarks | Mood |
|---|----|------|----:|-----|-----------|------|
| 1 | dino-1 | Dino Humps | 7 | three humps | brachiosaurus, giant nest | prehistoric morning |
| 2 | dino-2 | Tar Pits | 7 | tar pit gaps | T. rex, pterodactyls | golden |
| 3 | dino-3 | Stego Spine | 7 | humps in a row | stegosaurus, brachiosaurus | swamp mist |
| 4 | dino-4 | Log Jam | 7 | log rails, one over the tar | triceratops, pterodactyls | sunset |
| 5 | dino-5 | Big Back | 8 | bigger humps | giant nest, T. rex | rumbling volcano |
| 6 | dino-6 | Swamp Run | 8 | four tar pits | brachiosaurus, stegosaurus | tropical rain |
| 7 | dino-7 | Pterodactyl Ridge | 8 | humps and a drop-off | pterodactyls, triceratops | dusk |
| 8 | dino-8 | T. rex Alley | 8 | humps and logs | T. rex, brachiosaurus | hazy heat |
| 9 | dino-9 | Night Herd | 9 | everything | stegosaurus, giant nest | night, fireflies |
| 10 | dino-10 | Volcano Valley | 9 | the biggest hump, a big final tar pit | brachiosaurus, T. rex | eruption |
| bonus | dino-mega | Long Neck Mega Ramp | - | - | brachiosaurus | sunset |

## Moon Base: low gravity

A biome can set `gravity` (the moon's is 7, half the usual 14). The rider reads it from
`RiderOptions.gravity` (`rider.g`), and both test bots pass it on, so the landings check sizes
moon jumps for real moon flights. Airs go twice as high and hang twice as long, so landings
are longer: `kicker(4, 1.2).flat(2).land(56, 5.6)`, `kicker(5, 1.6).flat(2).land(60, 6.2)`,
`kicker(6, 2+).flat(2).land(64, 6.6)`, and gaps of 8 to 10 m with `land(44)`. Rollers are 18 m
long so you don't take off from every crest. On low gravity the camera pulls back with your
height, like on a mega ramp. The sky is black with stars and the Earth (`earth: true`), and the
rider wears a glass space helmet (`spaceKit()` in src/spacesuit.ts). The bonus track is a half
pipe, as the mega ramp's sizes are tuned for normal gravity.

| # | id | Name | Diff | New | Landmarks | Mood |
|---|----|------|----:|-----|-----------|------|
| 1 | moon-1 | Moon Walk | 7 | low gravity | moon base, space station | earthrise |
| 2 | moon-2 | Crater Hops | 7 | four craters | lunar lander | bright side |
| 3 | moon-3 | Launch Pad | 8 | big kickers | rocket, radio dish | blue shadows |
| 4 | moon-4 | Space Rails | 8 | rails, one over a crater | moon base, lander | long shadows |
| 5 | moon-5 | Loop the Moon | 8 | two loops | radio dish, station | starlight |
| 6 | moon-6 | Moon Humps | 8 | giant humps | rocket, moon base | earthrise |
| 7 | moon-7 | Crater Drops | 9 | big drop-offs | lander, radio dish | bright side |
| 8 | moon-8 | Rocket Run | 9 | everything | station, rocket | long shadows |
| 9 | moon-9 | Dark Side | 10 | five craters and a drop | moon base, radio dish | starlight |
| 10 | moon-10 | Moonshot | 10 | everything, a 10 m final crater | lander, rocket | blue shadows |
| bonus | moon-pipe | Crater Halfpipe | - | - | moon base | earthrise |
