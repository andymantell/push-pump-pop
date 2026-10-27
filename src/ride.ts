// What you ride: a skateboard, a scooter, aggressive inline (roller) skates or a downhill bike (MTB). Each ride is its own career,
// with its own tricks, challenges, stars and best scores, but tracks open for all at once:
// completing a track on any ride opens the next one for all of them.
//
// A ride lists the worlds it can't go to: the MTB's own world (its downhill courses) is only
// for the bike, and the level select only shows the worlds the picked ride can reach.

export type RideId = 'skate' | 'scooter' | 'roller' | 'mtb';
/** The MTB-only world of downhill courses (index into WORLDS). */
export const MTB_WORLD = 2;

export interface Ride {
  id: RideId;
  /** Button label on the level select. */
  label: string;
  /** Worlds (index into WORLDS) this ride can't go to. */
  skipWorlds?: number[];
}

export const RIDES: Ride[] = [
  { id: 'skate', label: 'SKATE', skipWorlds: [MTB_WORLD] },
  { id: 'scooter', label: 'SCOOTER', skipWorlds: [MTB_WORLD] },
  { id: 'roller', label: 'ROLLER', skipWorlds: [MTB_WORLD] },
  { id: 'mtb', label: 'MTB' },
];

export const rideOf = (id: string | null | undefined): Ride => RIDES.find((r) => r.id === id) ?? RIDES[0];
export const rideGoes = (ride: RideId, world: number) => !rideOf(ride).skipWorlds?.includes(world);

const KEY = 'push-pump-pop-ride';

/** The ride picked last time, remembered on this device. */
export function savedRide(): RideId {
  try { return rideOf(localStorage.getItem(KEY)).id; } catch { return 'skate'; }
}
export function saveRide(id: RideId) {
  try { localStorage.setItem(KEY, id); } catch { /* not remembered */ }
}

/** Signs that name skateboard tricks, said the scooter way. */
const SCOOTER_SIGNS: Record<string, string> = {
  'SWIPE LEFT: KICKFLIP': 'SWIPE LEFT: TAILWHIP',
  'SWIPE RIGHT: HEELFLIP': 'SWIPE RIGHT: BARSPIN',
  'SWIPE DOWN: SHOVE-IT': 'SWIPE DOWN: HEELWHIP',
  'SWIPE UP: OLLIE': 'SWIPE UP: BUNNY HOP',
  'ANY FLIP!': 'ANY WHIP!',
  'SWIPE AND HOLD ON THE LEFT: GRAB': 'SWIPE AND HOLD ON THE LEFT: SUPERMAN',
  'KICKFLIP IT!': 'TAILWHIP IT!',
  'HEELFLIP THE STAIRS': 'BARSPIN THE STAIRS',
  'GIANT KICKER: FLIP AND GRAB': 'GIANT KICKER: WHIP AND SUPERMAN',
  'FLIP, THEN GRAB': 'WHIP, THEN SUPERMAN',
};

/** Signs that name skateboard tricks, said the downhill bike way. */
const MTB_SIGNS: Record<string, string> = {
  'SWIPE LEFT: KICKFLIP': 'SWIPE LEFT: WHIP',
  'SWIPE RIGHT: HEELFLIP': 'SWIPE RIGHT: TABLETOP',
  'SWIPE DOWN: SHOVE-IT': 'SWIPE DOWN: TURNDOWN',
  'SWIPE UP: OLLIE': 'SWIPE UP: BUNNY HOP',
  'ANY FLIP!': 'ANY TRICK!',
  'SWIPE AND HOLD ON THE LEFT: GRAB': 'SWIPE AND HOLD ON THE LEFT: SUPERMAN',
  'KICKFLIP IT!': 'WHIP IT!',
  'HEELFLIP THE STAIRS': 'TABLETOP THE STAIRS',
  'GIANT KICKER: FLIP AND GRAB': 'GIANT KICKER: WHIP AND SUPERMAN',
  'FLIP, THEN GRAB': 'WHIP, THEN SUPERMAN',
};

/** Signs that name skateboard tricks, said the inline skates way. */
const ROLLER_SIGNS: Record<string, string> = {
  'SWIPE LEFT: KICKFLIP': 'SWIPE LEFT: FLATSPIN',
  'SWIPE RIGHT: HEELFLIP': 'SWIPE RIGHT: MISTY FLIP',
  'SWIPE DOWN: SHOVE-IT': 'SWIPE DOWN: ROCKET AIR',
  'SWIPE UP: OLLIE': 'SWIPE UP: JUMP',
  'ANY FLIP!': 'ANY AIR TRICK!',
  'KICKFLIP IT!': 'FLATSPIN IT!',
  'HEELFLIP THE STAIRS': 'MISTY FLIP THE STAIRS',
  'GIANT KICKER: FLIP AND GRAB': 'GIANT KICKER: FLATSPIN AND GRAB',
  'FLIP, THEN GRAB': 'FLATSPIN, THEN GRAB',
};

export function signFor(text: string, ride: RideId): string {
  if (ride === 'roller') {
    return ROLLER_SIGNS[text] ?? text.replace(/\bOLLIE\b/g, 'JUMP').replace(/(?<!TILT: )\bFLIP\b/g, 'FLATSPIN')
      .replace(/\bNOSE MANUAL\b/g, 'TOE ROLL').replace(/\bMANUAL\b/g, 'HEEL ROLL');
  }
  if (ride === 'mtb') {
    return MTB_SIGNS[text] ?? text.replace(/\bOLLIE\b/g, 'HOP').replace(/(?<!TILT: )\bFLIP\b/g, 'WHIP').replace(/\bGRAB\b/g, 'SUPERMAN')
      .replace(/\bGRIND\b/g, 'RIDE').replace(/\bRAIL\b/g, 'SKINNY').replace(/\bRAILS\b/g, 'SKINNIES');
  }
  if (ride !== 'scooter') return text;
  return SCOOTER_SIGNS[text] ?? text.replace(/\bOLLIE\b/g, 'HOP').replace(/(?<!TILT: )\bFLIP\b/g, 'WHIP').replace(/\bGRAB\b/g, 'SUPERMAN');
}
