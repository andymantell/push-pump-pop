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

export { PIPE_TIME } from './levels/common';
export type { TrackDef } from './levels/common';

export const TRACKS = [...PARK, ...BEACH, ...ROOFTOPS, ...SNOW, ...DESERT, ...JUNGLE, ...VOLCANO, ...FARM];
