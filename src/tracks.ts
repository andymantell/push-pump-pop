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
import { PIRATE, PIRATE_PIPE } from './levels/pirate';
import { HAUNTED, HAUNTED_PIPE } from './levels/haunted';
import { FUNFAIR, FUNFAIR_PIPE } from './levels/funfair';
import { TOXIC, TOXIC_MEGA } from './levels/toxic';
import { MINE, MINE_MEGA } from './levels/mine';

export { PIPE_TIME, STOP_AFTER_FINISH } from './levels/common';
export type { TrackDef } from './levels/common';

export const TRACKS = [...PARK, ...BEACH, ...ROOFTOPS, ...SNOW, ...DESERT, ...JUNGLE, ...VOLCANO, ...FARM, ...CANDY, CANDY_PIPE, ...DOCKS, ...PIRATE, PIRATE_PIPE, ...HAUNTED, HAUNTED_PIPE, ...FUNFAIR, FUNFAIR_PIPE, ...TOXIC, TOXIC_MEGA, ...MINE, MINE_MEGA];

// Every track's scooter challenges. New tracks get their skateboard ones with scooter tricks
// swapped in until they have their own (the scooter playtest lists them).
for (const t of TRACKS) t.scooter = SCOOTER[t.id] ?? scooterFallback(t);
export const SCOOTER_TODO = TRACKS.filter((t) => !SCOOTER[t.id]).map((t) => t.id);
