// What you ride: a skateboard or a scooter (an MTB is planned). Each ride is its own career,
// with its own tricks, challenges, stars and best scores, but tracks open for both at once:
// completing a track on either ride opens the next one for both.
//
// A ride lists the worlds it can't go to (none yet). An MTB-only world would list every other
// ride here, and the level select only shows the worlds the picked ride can reach.

export type RideId = 'skate' | 'scooter';

export interface Ride {
  id: RideId;
  /** Button label on the level select. */
  label: string;
  /** Worlds (index into WORLDS) this ride can't go to. */
  skipWorlds?: number[];
}

export const RIDES: Ride[] = [
  { id: 'skate', label: 'SKATE' },
  { id: 'scooter', label: 'SCOOTER' },
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

export function signFor(text: string, ride: RideId): string {
  if (ride !== 'scooter') return text;
  return SCOOTER_SIGNS[text] ?? text.replace(/\bOLLIE\b/g, 'HOP').replace(/(?<!TILT: )\bFLIP\b/g, 'WHIP').replace(/\bGRAB\b/g, 'SUPERMAN');
}
