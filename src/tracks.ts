// Every level in the game, world by world in progression order. The layouts live in
// src/levels, one file per world.
import { PARK } from './levels/park';
import { BEACH } from './levels/beach';
import { ROOFTOPS } from './levels/rooftops';
import { SNOW } from './levels/snow';
import { DESERT } from './levels/desert';
import { JUNGLE } from './levels/jungle';
import { VOLCANO } from './levels/volcano';
import { FARM } from './levels/farm';
import { CANDY, CANDY_PIPE } from './levels/candy';
import { DOCKS } from './levels/docks';
import { SCOOTER, scooterFallback } from './levels/scooter';
import { MTB, mtbFallback } from './levels/mtb';
import { ROLLER, rollerFallback } from './levels/roller';
import { PIRATE, PIRATE_PIPE } from './levels/pirate';
import { HAUNTED, HAUNTED_PIPE } from './levels/haunted';
import { FUNFAIR, FUNFAIR_PIPE } from './levels/funfair';
import { TOXIC, TOXIC_MEGA } from './levels/toxic';
import { MINE, MINE_MEGA } from './levels/mine';
import { DINO, DINO_MEGA } from './levels/dino';
import { MOON, MOON_PIPE } from './levels/moon';
import { SKY, SKY_MEGA } from './levels/sky';
import { DH_URBAN } from './levels/dh-urban';
import { DH_MUD } from './levels/dh-mud';
import { DH_ROCKY } from './levels/dh-rocky';
import { DH_SHORE } from './levels/dh-shore';

export { PIPE_TIME, STOP_AFTER_FINISH } from './levels/common';
export type { TrackDef } from './levels/common';

export const TRACKS = [...PARK, ...BEACH, ...ROOFTOPS, ...SNOW, ...DESERT, ...JUNGLE, ...VOLCANO, ...FARM, ...CANDY, CANDY_PIPE, ...DOCKS, ...PIRATE, PIRATE_PIPE, ...HAUNTED, HAUNTED_PIPE, ...FUNFAIR, FUNFAIR_PIPE, ...TOXIC, TOXIC_MEGA, ...MINE, MINE_MEGA, ...DINO, DINO_MEGA, ...MOON, MOON_PIPE, ...SKY, SKY_MEGA, ...DH_URBAN, ...DH_MUD, ...DH_ROCKY, ...DH_SHORE];

// Every track's scooter challenges. New tracks get their skateboard ones with scooter tricks
// swapped in until they have their own (the scooter playtest lists them).
for (const t of TRACKS) t.scooter = SCOOTER[t.id] ?? scooterFallback(t);
export const SCOOTER_TODO = TRACKS.filter((t) => !SCOOTER[t.id] && !t.biome.startsWith('dh-')).map((t) => t.id);
// The inline skates' too.
for (const t of TRACKS) if (!t.biome.startsWith('dh-')) t.roller = ROLLER[t.id] ?? rollerFallback(t);
export const ROLLER_TODO = TRACKS.filter((t) => !ROLLER[t.id] && !t.biome.startsWith('dh-')).map((t) => t.id);
// And the downhill bike's, the same way.
// The bike's own downhill courses are written for it: their challenges are the MTB ones.
for (const t of TRACKS) t.mtb = MTB[t.id] ?? (t.biome.startsWith('dh-') ? { par: t.par ?? 0, challenges: t.challenges ?? [] } : mtbFallback(t));
export const MTB_TODO = TRACKS.filter((t) => !MTB[t.id] && !t.biome.startsWith('dh-')).map((t) => t.id);
