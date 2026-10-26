import type { Challenge, Match, GapFilter } from '../challenges';
import type { TrickName } from '../rider';

// The scooter career: three challenges for every track, like the skateboard's but with
// scooter tricks (whips, barspins, body tricks, scooter grinds), and its own score targets.
// The first one (two from the third world on) must be done to complete the track on a
// scooter; completing it on either ride opens the next track for both.
//
// `par` is the scooter playtest bot's 75th percentile score, rounded to 500, as for the
// skateboard; Score challenges use it too.

export interface ScooterTrack { par: number; challenges: Challenge[] }

const n = (x: number) => x.toLocaleString('en-GB');
// Shorthands for the common kinds.
const trick = (text: string, match: Match, o: { count?: number; overGap?: GapFilter; from?: string; fromRail?: boolean; minTime?: number } = {}): Challenge => ({ text, kind: 'trick', match, ...o });
const same = (text: string, match: Match[], o: { overGap?: GapFilter; from?: string } = {}): Challenge => ({ text, kind: 'sameAir', match, ...o });
const combo = (text: string, o: { tricks?: number; include?: Match[]; points?: number; gaps?: number; across?: [string, string] }): Challenge => ({ text, kind: 'combo', ...o });
const gaps = (text: string, o: { which?: number[]; count?: number } = {}): Challenge => ({ text, kind: 'gaps', ...o });
const grind = (text: string, o: { count?: number; rails?: number[]; seconds?: number; railKind?: 'rail' | 'handrail' | 'ledge' } = {}): Challenge => ({ text, kind: 'grind', ...o });
const pumps = (count: number): Challenge => ({ text: `Do ${count} good pumps`, kind: 'pumps', count });
const air = (text: string, o: { seconds?: number; metres?: number; from?: string; fromRail?: boolean; overGap?: GapFilter }): Challenge => ({ text, kind: 'air', ...o });
const allOf = (text: string, names: TrickName[]): Challenge => ({ text, kind: 'allOf', names });
const variety = (count: number): Challenge => ({ text: `Land ${count} different tricks`, kind: 'variety', count });
const tricks = (k: number): Challenge => combo(`Land a ${k}-trick combo`, { tricks: k });
const worth = (points: number): Challenge => combo(`Combo worth ${n(points)}`, { points });
const loop = (text = 'Ride the loop', count?: number): Challenge => ({ text, kind: 'loop', ...(count ? { count } : {}) });
const climb = (text = 'Climb out of every gully first time'): Challenge => ({ text, kind: 'climb' });
const noLives = (text = 'Finish without losing a life'): Challenge => ({ text, kind: 'noLives' });
const finish = (): Challenge => ({ text: 'Finish the track', kind: 'finish' });
const manual = (text: string, seconds?: number, name?: 'Nose Manual'): Challenge => ({ text, kind: 'manual', ...(seconds ? { seconds } : {}), ...(name ? { name } : {}) });
const everyKicker = (text: string, match?: Match): Challenge => ({ text, kind: 'everyKicker', ...(match ? { match } : {}) });
const drops = (): Challenge => ({ text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 });
const bothAirs = (): Challenge => ({ text: 'A trick on both airs of one drop', kind: 'bothAirs' });

/** A track whose last challenge is "Score <par>". */
const scored = (par: number, a: Challenge, b: Challenge): ScooterTrack => ({ par, challenges: [a, b, { text: `Score ${n(par)}`, kind: 'score', points: par }] });
const set = (par: number, ...challenges: Challenge[]): ScooterTrack => ({ par, challenges });

export const SCOOTER: Record<string, ScooterTrack> = {
  // Sunny Park: every scooter move, one per track.
  'park-1': set(1000, finish(), pumps(5), noLives()),
  'park-2': scored(9500, trick('Land a bunny hop', 'Bunny Hop'), everyKicker('Bunny hop all 3 kickers')),
  'park-3': set(19500, trick('Land a tailwhip', 'Tailwhip'), allOf('Land a barspin and a heelwhip', ['Barspin', 'Heelwhip']), trick('Land a double whip', 'Double Whip')),
  'park-4': set(17000, trick('Land a Superman', 'Superman'), trick('Hold a body trick for 1 second', 'hold', { minTime: 1 }), allOf('Land all four body tricks', ['Superman', 'No Footer', 'Can Can', 'X-Up'])),
  'park-5': set(23000, trick('Land a 180', '180'), trick('Land a 360', '360'), same('Tailwhip and spin in the same air', ['Tailwhip', 'spin'])),
  'park-6': set(11500, manual('Manual for 1 second', 1), manual('Nose manual for 1 second', 1, 'Nose Manual'), { text: 'Manual a whole pad', kind: 'manual', pad: true }),
  'park-7': set(17000, gaps('Clear a gap', { count: 1 }), trick('Barspin over a gap', 'Barspin', { overGap: true }), trick('A whip over every gap', 'whip', { overGap: 'every' })),
  'park-8': set(21000, grind('Grind a rail'), trick('Feeble grind a rail', 'Feeble'), grind('Grind the rail after the kicker', { rails: [2] })),
  'park-9': set(22500, tricks(2), combo('Whip + manual combo', { include: ['whip', 'manual'] }), worth(3000)),
  'park-10': scored(37000, gaps('Clear every gap'), trick('Superman on the big air', 'Superman', { from: 'bigair' })),
  'park-pipe': scored(22500, air('Air of 1.5 metres', { metres: 1.5 }), variety(5)),

  // Beach.
  'beach-1': scored(29500, gaps('Clear every water gap'), grind('Grind the ledge', { railKind: 'ledge' })),
  'beach-2': set(1000, air('Get air off a roller top', { from: 'crest', seconds: 0.4 }), trick('A whip off a roller top', 'whip', { from: 'crest' }), air('Air for 1 second', { seconds: 1 })),
  'beach-3': set(21500, grind('Grind a pier rail'), trick('Smith grind for 1 second', 'Smith', { minTime: 1 }), trick('Tailwhip off the end of a rail', 'Tailwhip', { fromRail: true })),
  'beach-4': scored(4000, gaps('Clear the end gap', { which: [-1] }), pumps(10)),
  'beach-5': set(16000, gaps('Clear every water gap'), trick('A body trick over every gap', 'hold', { overGap: 'every' }), combo('Tailwhip + Superman combo', { include: ['Tailwhip', 'Superman'] })),
  'beach-6': set(40500, tricks(4), combo('Manual + whip + manual combo', { include: ['manual', 'whip', 'manual'] }), worth(8000)),
  'beach-7': scored(37500, trick('Land a 360', '360'), trick('No Footer over a water gap', 'No Footer', { overGap: true })),
  'beach-8': set(20000, air('Grind into the jetty gap and clear it', { fromRail: true, overGap: true }), combo('Rail + whip combo over the gap', { include: ['grind', 'whip'], gaps: 1 }), tricks(5)),
  'beach-9': scored(26500, gaps('Clear every water gap'), pumps(15)),
  'beach-10': scored(27000, noLives(), same('360 + Superman off the pier end', ['360', 'Superman'], { from: 'pierend' })),
  'beach-pipe': scored(21500, air('Air of 1.5 metres', { metres: 1.5 }), allOf('Land a tailwhip and a barspin', ['Tailwhip', 'Barspin'])),

  // Rooftops: two challenges needed from here on.
  'rooftops-1': set(10000, gaps('Clear every gap'), trick('Tailwhip over a gap', 'Tailwhip', { overGap: true }), noLives()),
  'rooftops-2': set(10000, trick('Bunny hop a stair set', 'Bunny Hop', { from: 'stairs' }), trick('Barspin a stair set', 'Barspin', { from: 'stairs' }), tricks(3)),
  'rooftops-3': set(60500, gaps('Clear every gap'), trick('A body trick over 2 gaps', 'hold', { overGap: true, count: 2 }), noLives()),
  'rooftops-4': set(20500, grind('Grind a stair rail', { railKind: 'handrail' }), grind('Grind 2 stair rails', { railKind: 'handrail', count: 2 }), combo('Stair rail + whip combo', { include: ['grind', 'whip'] })),
  'rooftops-5': set(26500, gaps('Clear every gap'), trick('180 over a gap', '180', { overGap: true }), tricks(4)),
  'rooftops-6': scored(22500, air('Grind a ledge and clear its gap', { fromRail: true, overGap: true }), trick('Ledge grind, then whip the gap', 'whip', { fromRail: true, overGap: true })),
  'rooftops-7': set(19500, gaps('Clear every uphill gap', { which: [1, 3, 5] }), trick('Can Can over an uphill gap', 'Can Can', { overGap: [1, 3, 5] }), noLives()),
  'rooftops-8': scored(16500, air('Air for 1.5 seconds', { seconds: 1.5 }), same('A body trick and a spin in one air over a gap', ['hold', 'spin'], { overGap: true })),
  'rooftops-9': set(43500, combo('Clear a set of three gaps in one combo', { gaps: 3 }), tricks(5), noLives()),
  'rooftops-10': scored(61500, gaps('Clear the final gap', { which: [-1] }), combo('Rail + whip + body trick combo', { include: ['grind', 'whip', 'hold'] })),
  'rooftops-mega': scored(23500, drops(), trick('Double whip off the mega kicker', 'Double Whip', { from: 'kicker' })),

  // Snowy Mountain: a snow scooter, on skis.
  'snow-1': scored(34500, air('Air for 1.5 seconds', { seconds: 1.5 }), trick('Land a double whip', 'Double Whip')),
  'snow-2': set(14500, trick('Land a backflip', 'Backflip'), trick('Land a frontflip', 'Frontflip'), same('Backflip and tailwhip in the same air', ['Backflip', 'Tailwhip'])),
  'snow-3': set(27000, pumps(10), tricks(3), noLives()),
  'snow-4': set(9500, gaps('Clear every crevasse'), trick('Spin over a crevasse', 'spin', { overGap: true }), trick('Whip over a crevasse', 'whip', { overGap: true })),
  'snow-5': set(6500, manual('Manual for 3 seconds', 3), combo('One combo across the lake', { across: ['lake', 'shore'] }), worth(5000)),
  'snow-6': set(71500, grind('Grind a box', { railKind: 'ledge' }), grind('Grind 3 rails', { count: 3 }), combo('Rail + backflip combo', { include: ['grind', 'Backflip'] })),
  'snow-7': scored(103500, tricks(5), noLives('Finish with no bails')),
  'snow-8': set(15500, gaps('Clear every crevasse'), trick('360 over a level crevasse', '360', { overGap: [3, 4] }), noLives()),
  'snow-9': set(17000, same('Backflip and a body trick in the same air', ['Backflip', 'hold']), air('Air of 3 metres', { metres: 3 }), worth(6000)),
  'snow-10': scored(65500, trick('Backflip on the HUGE AIR', 'Backflip', { from: 'hugeair' }), tricks(6)),
  'snow-mega': scored(23000, drops(), bothAirs()),

  // Desert.
  'desert-1': scored(19000, pumps(8), climb()),
  'desert-2': set(1000, climb(), air('Air off a gully lip', { from: 'lip', seconds: 0.4 }), noLives()),
  'desert-3': scored(27000, trick('Bunny hop off a gully kicker', 'Bunny Hop', { from: 'kicker' }), combo('Whip + body trick combo', { include: ['whip', 'hold'] })),
  'desert-4': set(9000, gaps('Clear every gap'), trick('Spin over a gap', 'spin', { overGap: true }), noLives()),
  'desert-5': set(78500, grind('Grind across a gully'), grind('Grind every gully rail', { count: 4 }), combo('Smith + whip combo', { include: ['Smith', 'whip'] })),
  'desert-6': scored(3500, climb(), air('Air off the last gully', { from: 'lastlip', seconds: 0.4 })),
  'desert-7': set(39000, gaps('Clear both gaps'), tricks(5), noLives()),
  'desert-8': scored(9500, loop(), combo('Loop + whip combo', { include: ['loop', 'whip'] })),
  'desert-9': set(43000, loop('Ride both loops', 2), combo('Loop + body trick + spin combo', { include: ['loop', 'hold', 'spin'] }), noLives()),
  'desert-10': scored(47500, gaps('Clear the final gap', { which: [-1] }), combo('Loop + 2 tricks combo', { include: ['loop'], tricks: 3 })),
  'desert-mega': scored(17500, drops(), bothAirs()),

  // Jungle.
  'jungle-1': scored(58500, gaps('Clear both river gaps'), combo('One combo across a rhythm set', { across: ['rhythm', 'rhythmend'] })),
  'jungle-2': set(32000, pumps(12), everyKicker('A whip on every kicker', 'whip'), noLives()),
  'jungle-3': scored(48000, trick('Whip off a step', 'whip', { from: 'stairs' }), tricks(4)),
  'jungle-4': set(15500, gaps('Clear every river gap'), trick('A body trick over 3 gaps', 'hold', { overGap: true, count: 3 }), noLives()),
  'jungle-5': set(66000, grind('Grind a log'), grind('Grind every log', { count: 6 }), combo('Log + whip + log combo', { include: ['grind', 'whip', 'grind'] })),
  'jungle-6': scored(18500, pumps(15), noLives('Finish with no bails')),
  'jungle-7': set(62500, loop(), combo('Loop + whip combo', { include: ['loop', 'whip'] }), tricks(6)),
  'jungle-8': set(83500, gaps('Clear every gap'), combo('Rail + gap + rail in one combo', { include: ['grind', 'grind'], gaps: 1 }), noLives()),
  'jungle-9': scored(14000, gaps('Clear the waterfall gap', { which: [1] }), trick('Backflip over the waterfall gap', 'Backflip', { overGap: [1] })),
  'jungle-10': set(84000, loop('Ride both loops', 2), tricks(7), noLives()),
  'jungle-pipe': scored(24000, air('Air of 1.5 metres', { metres: 1.5 }), variety(6)),

  // Volcano.
  'volcano-1': set(10000, gaps('Clear every lava gap'), trick('Heelwhip over lava', 'Heelwhip', { overGap: true }), noLives()),
  'volcano-2': scored(35500, gaps('Clear every lava gap'), same('A body trick and a spin in one air over lava', ['hold', 'spin'], { overGap: true })),
  'volcano-3': set(31500, gaps('Clear every gap'), pumps(12), combo('3-trick combo over a lava gap', { tricks: 3, gaps: 1 })),
  'volcano-4': set(68500, grind('Grind a rail over lava', { rails: [1] }), combo('Stair rail + whip combo', { include: ['grind', 'whip'] }), noLives()),
  'volcano-5': scored(25000, loop('Ride the lava tube loop'), combo('Loop + spin combo', { include: ['loop', 'spin'] })),
  'volcano-6': set(12000, climb('Climb out of every crater first time'), trick('Whip over lava from a crater lip', 'whip', { from: 'lip', overGap: true }), noLives()),
  'volcano-7': scored(12000, gaps('Clear every gap'), trick('A trick over every lava gap', 'any', { overGap: 'every' })),
  'volcano-8': set(21500, gaps('Clear every uphill gap', { which: [2, 4] }), trick('360 over the 7 m gap', '360', { overGap: [3] }), worth(3000)),
  'volcano-9': set(61500, loop('Ride both loops', 2), tricks(8), noLives()),
  'volcano-10': set(46000, gaps('Clear the crater gap', { which: [-1] }), same('Backflip and a body trick in one air over the crater gap', ['Backflip', 'hold'], { overGap: [-1] }), { text: 'Score 32,000 with no lives lost', kind: 'score', points: 32000, noLives: true }),
  'volcano-mega': scored(13000, drops(), bothAirs()),

  // World 2: Autumn Farm.
  'farm-1': set(4500, finish(), pumps(8), noLives()),
  'farm-2': set(18500, everyKicker('Bunny hop every hay bale'), trick('Land a Superman', 'Superman'), everyKicker('A whip on every hay bale', 'whip')),
  'farm-3': set(6500, pumps(12), manual('Manual for 1 second', 1), climb('Never roll backwards')),
  'farm-4': set(67500, grind('Grind a fence rail'), grind('Grind 3 different rails', { count: 3 }), trick('Feeble grind a fence', 'Feeble')),
  'farm-5': set(23000, gaps('Clear every ditch'), trick('A trick over a ditch', 'any', { overGap: true }), trick('A body trick over every ditch', 'hold', { overGap: 'every' })),
  'farm-6': set(19500, variety(5), tricks(3), same('Spin and a body trick in the same air', ['spin', 'hold'])),
  'farm-7': set(24500, gaps('Clear every ditch'), grind('Grind the fence rail'), air('One air of 1 second', { seconds: 1 })),
  'farm-8': set(45000, gaps('Clear every ditch'), tricks(4), noLives()),
  'farm-pipe': scored(22500, trick('Land a Superman', 'Superman'), variety(5)),

  // World 2: Candy Kingdom.
  'candy-1': set(10000, finish(), trick('A whip off a jelly pad', 'whip', { from: 'bouncer' }), trick('A body trick off every jelly pad', 'hold', { from: 'bouncer', count: 4 })),
  'candy-2': set(8500, air('Pump on a jelly pad for a big bounce', { seconds: 1.3, from: 'bouncer' }), pumps(10), same('A whip and a body trick in one bounce', ['whip', 'hold'], { from: 'bouncer' })),
  'candy-3': set(28500, combo('Bounce 3 pads in a row in one combo', { across: ['chain', 'chainend'] }), variety(5), tricks(4)),
  'candy-4': set(12000, gaps('Clear every chocolate river'), trick('A body trick over a river', 'hold', { overGap: true }), trick('A trick over every river', 'any', { overGap: 'every' })),
  'candy-5': set(51000, grind('Grind 2 candy canes', { count: 2 }), gaps('Clear every chocolate river'), grind('Grind for 2 seconds', { seconds: 2 })),
  'candy-6': set(30000, gaps('Clear every chocolate river'), tricks(4), trick('A double whip off a jelly pad', 'Double Whip', { from: 'bouncer' })),
  'candy-7': set(30000, gaps('Clear every chocolate river'), combo('One combo across the bounce chain', { across: ['chain', 'chainend'] }), noLives()),
  'candy-8': set(36000, gaps('Clear every chocolate river'), tricks(5), variety(8)),
  'candy-pipe': scored(22500, trick('Land a barspin', 'Barspin'), variety(5)),

  // Harbour Docks
  'docks-1': set(8000, finish(), { text: 'Manual along the containers', kind: 'manual', seconds: 1.5, pad: true }, combo('Manual and grind in one combo', { include: ['manual', 'grind'] })),
  'docks-2': set(11500, gaps('Clear every gap'), trick('Tailwhip a gap', 'Tailwhip', { overGap: true }), tricks(4)),
  'docks-3': scored(15000, grind('Grind a handrail', { railKind: 'handrail' }), combo('Grind a handrail, then manual, in one combo', { include: ['grind', 'manual'] })),
  'docks-4': set(64000, grind('Grind 3 different rails', { count: 3 }), trick('A whip off a rail', 'whip', { fromRail: true }), tricks(5)),
  'docks-5': set(14000, gaps('Clear every gap'), trick('Barspin over a gap', 'Barspin', { overGap: true }), noLives()),
  'docks-6': scored(12000, air('Air for 1.5 seconds', { seconds: 1.5 }), trick('A body trick over every gap', 'hold', { overGap: 'every' })),
  'docks-7': set(15500, combo('Ride three stacks in one combo', { across: ['stacks', 'stacksend'] }), variety(6), noLives()),
  'docks-8': scored(50500, combo('Manual, grind and whip in one combo', { include: ['manual', 'grind', 'whip'] }), tricks(5)),
  'docks-9': set(38500, combo('Clear a set of three gaps in one combo', { gaps: 3 }), tricks(6), noLives()),
  'docks-10': scored(57000, gaps('Clear the final gap', { which: [-1] }), combo('Grind, manual and body trick in one combo', { include: ['grind', 'manual', 'hold'] })),
  'docks-mega': scored(23500, drops(), bothAirs()),

  // Pirate Cove: stepping stones.
  'pirate-1': set(54000, gaps('Hop every stone'), pumps(12), trick('A body trick between two stones', 'hold', { from: 'stones' })),
  'pirate-2': set(50500, gaps('Hop every stone'), combo('Hop three stones in one combo', { across: ['stones', 'stonesend'] }), variety(5)),
  'pirate-3': set(58000, grind('Grind the plank'), combo('Grind, then whip, in one combo', { include: ['grind', 'whip'] }), noLives()),
  'pirate-4': set(70500, gaps('Hop every stone'), combo('A whip and a body trick on one set of stones', { include: ['whip', 'hold'], across: ['stones', 'stonesend'] }), tricks(5)),
  'pirate-5': scored(58000, air('Air for 1.5 seconds', { seconds: 1.5 }), trick('A spin over every big gap', 'spin', { overGap: [0, 4, 8] })),
  'pirate-6': set(53000, { text: 'Manual the jetty', kind: 'manual', pad: true }, variety(6), tricks(6)),
  'pirate-7': set(72000, gaps('Hop every stone'), combo('Hop four stones in one combo', { across: ['stones', 'stonesend'] }), noLives()),
  'pirate-8': scored(67500, gaps('Clear the final gap', { which: [-1] }), combo('A whip and a body trick in one combo', { include: ['whip', 'hold'] })),
  'pirate-pipe': scored(22500, trick('Land a body trick', 'hold'), variety(5)),

  // Haunted Hollow: drop-offs.
  'haunted-1': set(4500, air('Air for half a second off a drop-off', { from: 'dropoff', seconds: 0.5 }), pumps(12), trick('A body trick off a drop-off', 'hold', { from: 'dropoff' })),
  'haunted-2': set(8000, gaps('Clear every gap'), trick('A whip off a drop-off', 'whip', { from: 'dropoff' }), variety(5)),
  'haunted-3': set(16000, grind('Grind the crooked bridge'), combo('Grind, then a drop-off, in one combo', { include: ['grind'], tricks: 2 }), noLives()),
  'haunted-4': set(7500, pumps(14), gaps('Clear every gap'), variety(6)),
  'haunted-5': set(12500, gaps('Clear every gap'), trick('A spin over every gap', 'spin', { overGap: 'every' }), air('Air for 1.2 seconds', { seconds: 1.2 })),
  'haunted-6': set(25500, grind('Ride the ghost train rail', { count: 3 }), combo('A grind and two more tricks in one combo', { include: ['grind'], tricks: 3 }), gaps('Clear every gap')),
  'haunted-7': set(12500, grind('Grind a handrail', { railKind: 'handrail' }), gaps('Clear the gap'), trick('A whip down the stairs', 'whip', { from: 'stairs' })),
  'haunted-8': scored(19500, gaps('Clear the final gap', { which: [-1] }), variety(6)),
  'haunted-pipe': scored(22500, trick('Land a whip', 'whip'), variety(5)),

  // Funfair: loops back to back.
  'funfair-1': set(16000, loop('Ride every loop', 3), pumps(12), variety(5)),
  'funfair-2': set(17000, loop('Ride both loops of a pair', 2), loop('Ride every loop', 4), variety(5)),
  'funfair-3': set(20500, grind('Grind the coaster track', { count: 3 }), gaps('Clear every gap'), trick('A whip over a gap', 'whip', { overGap: true })),
  'funfair-4': set(25000, gaps('Clear every gap'), combo('A loop and a gap in one combo', { include: ['loop'], gaps: 1 }), trick('A spin over a gap', 'spin', { overGap: true })),
  'funfair-5': set(21000, air('Air for 1.2 seconds', { seconds: 1.2 }), loop('Ride every loop', 2), tricks(5)),
  'funfair-6': set(20500, everyKicker('A trick off every kicker'), variety(6), gaps('Clear every gap')),
  'funfair-7': set(33500, grind('Grind every rail', { count: 3 }), loop('Ride every loop', 3), combo('A loop and a grind in one combo', { include: ['loop', 'grind'] })),
  'funfair-8': set(15000, trick('Land a 360', '360'), gaps('Clear every gap'), trick('A spin over every gap', 'spin', { overGap: 'every' })),
  'funfair-9': set(30000, loop('Ride every loop', 4), variety(6), gaps('Clear every gap')),
  'funfair-10': scored(19500, gaps('Clear the final gap', { which: [-1] }), loop('Ride every loop', 4)),
  'funfair-pipe': scored(22500, trick('Land a spin', 'spin'), variety(5)),

  // Toxic Factory: conveyor belts.
  'toxic-1': set(15000, gaps('Clear every gap'), pumps(12), trick('A body trick over the goo', 'hold', { overGap: true })),
  'toxic-2': set(13000, pumps(20), gaps('Clear every gap'), variety(5)),
  'toxic-3': set(11500, gaps('Clear every gap'), trick('A spin over the goo', 'spin', { overGap: true }), noLives()),
  'toxic-4': set(26000, grind('Grind 3 pipes', { count: 3 }), grind('Grind a pipe over the goo', { rails: [1] }), tricks(5)),
  'toxic-5': set(18500, everyKicker('A trick off every kicker'), gaps('Clear every gap'), variety(6)),
  'toxic-6': set(27000, gaps('Clear every gap'), combo('Grind and whip in one combo', { include: ['grind', 'whip'] }), noLives()),
  'toxic-7': set(13500, air('Air for 1.2 seconds', { seconds: 1.2 }), gaps('Clear every gap'), trick('A whip off a drop', 'whip', { from: 'dropoff' })),
  'toxic-8': set(11000, pumps(18), gaps('Clear every gap'), variety(6)),
  'toxic-9': set(20000, gaps('Clear every gap'), grind('Grind every pipe', { count: 3 }), noLives()),
  'toxic-10': scored(22500, gaps('Clear the final gap', { which: [-1] }), variety(6)),
  'toxic-mega': scored(22500, drops(), bothAirs()),

  // Crystal Mine: rail lines.
  'mine-1': set(21500, grind('Grind 4 rails', { count: 4 }), pumps(12), variety(4)),
  'mine-2': set(32500, grind('Grind 6 rails', { count: 6 }), trick('A body trick off a rail', 'hold', { fromRail: true }), gaps('Clear every gap')),
  'mine-3': set(36500, grind('Grind 4 rails', { count: 4 }), pumps(14), gaps('Clear every gap')),
  'mine-4': set(26500, gaps('Clear every gap'), grind('Grind a rail over a shaft', { rails: [1] }), trick('A whip over a shaft', 'whip', { overGap: true })),
  'mine-5': set(46000, grind('Grind 8 rails', { count: 8 }), tricks(4), variety(5)),
  'mine-6': set(24500, gaps('Clear every gap'), trick('A body trick over a shaft', 'hold', { overGap: true }), grind('Grind 4 rails', { count: 4 })),
  'mine-7': set(25000, grind('Grind every bridge', { count: 3 }), gaps('Clear every gap'), noLives()),
  'mine-8': set(33500, gaps('Clear every gap'), trick('A spin over a shaft', 'spin', { overGap: true }), pumps(16)),
  'mine-9': set(40500, grind('Grind 5 rails', { count: 5 }), gaps('Clear every gap'), noLives()),
  'mine-10': scored(52500, gaps('Clear the final gap', { which: [-1] }), grind('Grind 7 rails', { count: 7 })),
  'mine-mega': scored(22500, drops(), bothAirs()),
};

/** Skateboard words and tricks, the scooter way. */
const SWAP: Record<string, string> = {
  Ollie: 'Bunny Hop', Kickflip: 'Tailwhip', Heelflip: 'Barspin', 'Pop Shove-it': 'Heelwhip',
  'BS Shifty': 'Tailwhip', 'FS Shifty': 'Barspin', 'Tuck Knee': 'Heelwhip',
  Indy: 'Superman', Melon: 'No Footer', Nosegrab: 'Can Can', Tailgrab: 'X-Up',
  flip: 'whip', grab: 'hold', '5-0': 'Smith', Nosegrind: 'Feeble',
};
const WORDS: [RegExp, string][] = [
  [/\bollie\b/gi, 'bunny hop'], [/\bkickflip\b/gi, 'tailwhip'], [/\bheelflip\b/gi, 'barspin'], [/\bshove-it\b/gi, 'heelwhip'],
  [/\bflip\b/gi, 'whip'], [/\bgrab\b/gi, 'body trick'], [/\bIndy\b/g, 'Superman'], [/\bMelon\b/g, 'No Footer'],
];

/**
 * For a track that doesn't have scooter challenges written yet: its skateboard ones with
 * the tricks swapped for scooter ones. The playtest lists tracks that still need their own.
 */
export function scooterFallback(def: { par?: number; challenges?: Challenge[] }): ScooterTrack {
  const swap = <T,>(v: T): T => (typeof v === 'string' ? (SWAP[v] ?? v) as T : Array.isArray(v) ? v.map(swap) as T : v);
  const challenges = (def.challenges ?? []).map((c) => {
    const out = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, k === 'text' || k === 'kind' ? v : swap(v)])) as Challenge;
    out.text = WORDS.reduce((t, [re, to]) => t.replace(re, to), c.text);
    return out;
  });
  return { par: def.par ?? 0, challenges };
}
