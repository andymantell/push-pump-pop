# Push Pump Pop: World 2 plan

Andy approved the biomes on 2026-10-25 and chose a **World 2** that opens when Volcano 5 is
complete (same rule as every world: complete track 5, the next world opens). The level select
has a WORLD 1 / WORLD 2 tab. Biomes are built one per batch, each with the full polish pass
(mood and landmarks per track, Blender props, ambience, screenshot review, `npm test`).
The ground rules, difficulty scale, challenges and par calibration in `level-plan.md` all apply.

| # | Biome | Main idea | Tracks | Difficulty | Bonus | Status |
|---|-------|-----------|-------:|-----------|-------|--------|
| 1 | Autumn Farm | mud patches you pump through | 8 | 2 to 5 | Barn Halfpipe | built |
| 2 | Candy Kingdom | jelly bounce pads | 8 | 3 to 6 | half pipe | planned |
| 3 | Harbour Docks | long manual and ledge combos on containers | 10 | 4 to 7 | mega ramp | planned |
| 4 | Pirate Cove | stepping-stone gaps close together | 8 | 5 to 7 | half pipe | planned |
| 5 | Haunted Hollow | big drop-offs in the dark | 8 | 5 to 8 | half pipe | planned |
| 6 | Funfair | loops chained together, coaster rails | 10 | 6 to 8 | half pipe | planned |
| 7 | Toxic Factory | conveyor belts and goo pits | 10 | 6 to 9 | mega ramp | planned |
| 8 | Crystal Mine | rail lines and rail-to-rail hops | 10 | 6 to 9 | mega ramp | planned |
| 9 | Dino Valley | giant humps to launch off | 10 | 7 to 9 | mega ramp | planned |
| 10 | Moon Base | low gravity (about 7 instead of 14), bigger features | 10 | 7 to 10 | mega ramp | planned |
| 11 | Sky Islands | uphill gaps between floating islands | 10 | 8 to 10 | mega ramp | planned |

New pieces still to build: `bouncer` (Candy), `conveyor` (Toxic Factory), up-rails (Crystal
Mine), giant humps (Dino), gravity per biome and a tall-air camera (Moon), sky pits (Sky Islands).

## Autumn Farm: mud

`mud(len)` lays a flat muddy patch and `muddy(fn)` makes whatever `fn` lays muddy (a valley,
rollers). On the ground in mud the rider loses `MUD_DRAG + MUD_DRAG_PER_SPEED * speed` m/s²
(about 2.8 at 10 m/s), so an 8 m patch takes 3 to 4 m/s off you. Pumping a muddy dip or roller
wins most of it back. Mud is drawn as a wet strip with puddles and drips, throws up clods, and
squelches.

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
