import type { Challenge } from '../challenges';

// The inline skates career: three challenges for every track, like the skateboard's but with
// aggressive inline tricks (flatspins, misty flips, rocket airs, grabs, skate grinds and heel
// rolls), and its own score targets. The first one (two from the third world on) must be done
// to complete the track on skates; completing it on any ride opens the next track for all.
//
// `par` is the skates playtest bot's 75th percentile score, rounded to 500, as for the
// skateboard; Score challenges use it too.

export interface RollerTrack { par: number; challenges: Challenge[] }

export const ROLLER: Record<string, RollerTrack> = {
  // Sunny Park.
  'park-1': { par: 1000, challenges: [{ text: 'Finish the track', kind: 'finish' }, { text: 'Do 3 good pumps', kind: 'pumps', count: 3 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'park-2': { par: 9500, challenges: [{ text: 'Land a jump', kind: 'trick', match: 'Jump' }, { text: 'Jump all 3 kickers', kind: 'everyKicker', match: 'Jump' }, { text: 'Score 9,500', kind: 'score', points: 9500 }] },
  'park-3': { par: 19500, challenges: [{ text: 'Land a flatspin', kind: 'trick', match: 'Flatspin' }, { text: 'Land a misty flip and a rocket air', kind: 'allOf', names: ['Misty Flip', 'Rocket Air'] }, { text: 'Land 3 flatspins', kind: 'trick', match: 'Flatspin', count: 3 }] },
  'park-4': { par: 17500, challenges: [{ text: 'Land a mute grab', kind: 'trick', match: 'Mute' }, { text: 'Hold a grab for 1 second', kind: 'trick', match: 'grab', minTime: 1 }, { text: 'Land all four grabs', kind: 'allOf', names: ['Mute', 'Japan', 'Safety', 'Stalefish'] }] },
  'park-5': { par: 23000, challenges: [{ text: 'Land a 180', kind: 'trick', match: '180' }, { text: 'Land a 360', kind: 'trick', match: '360' }, { text: 'Flatspin and spin in the same air', kind: 'sameAir', match: ['Flatspin', 'spin'] }] },
  'park-6': { par: 12500, challenges: [{ text: 'Heel roll for 1 second', kind: 'manual', seconds: 1 }, { text: 'Toe roll for 1 second', kind: 'manual', seconds: 1, name: 'Toe Roll' }, { text: 'Heel roll a whole pad', kind: 'manual', pad: true }] },
  'park-7': { par: 16000, challenges: [{ text: 'Clear a gap', kind: 'gaps', count: 1 }, { text: 'Misty flip over a gap', kind: 'trick', match: 'Misty Flip', overGap: true }, { text: 'An air trick over every gap', kind: 'trick', match: 'skates', overGap: 'every' }] },
  'park-8': { par: 21500, challenges: [{ text: 'Grind a rail', kind: 'grind' }, { text: 'Soul grind a rail', kind: 'trick', match: 'Soul' }, { text: 'Grind the rail after the kicker', kind: 'grind', rails: [2] }] },
  'park-9': { par: 22000, challenges: [{ text: 'Land a 2-trick combo', kind: 'combo', tricks: 2 }, { text: 'Flatspin + heel roll combo', kind: 'combo', include: ['Flatspin', 'manual'] }, { text: 'Combo worth 3,000', kind: 'combo', points: 3000 }] },
  'park-10': { par: 37500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'Mute grab on the big air', kind: 'trick', match: 'Mute', from: 'bigair' }, { text: 'Score 37,500', kind: 'score', points: 37500 }] },
  'park-pipe': { par: 22000, challenges: [{ text: 'Air of 1.5 metres', kind: 'air', metres: 1.5 }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }, { text: 'Score 22,000', kind: 'score', points: 22000 }] },
  // Beach Boardwalk.
  'beach-1': { par: 29500, challenges: [{ text: 'Clear every water gap', kind: 'gaps' }, { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 }, { text: 'Score 29,500', kind: 'score', points: 29500 }] },
  'beach-2': { par: 1000, challenges: [{ text: 'Get air off a roller top', kind: 'air', from: 'crest', seconds: 0.4 }, { text: 'Grab off a roller top', kind: 'trick', match: 'grab', from: 'crest' }, { text: 'Air for 1 second', kind: 'air', seconds: 1 }] },
  'beach-3': { par: 22500, challenges: [{ text: 'Grind a pier rail', kind: 'grind' }, { text: 'Grind for 2 seconds', kind: 'grind', seconds: 2 }, { text: 'Grab off the end of a rail', kind: 'trick', match: 'grab', fromRail: true }] },
  'beach-4': { par: 4000, challenges: [{ text: 'Clear the end gap', kind: 'gaps', which: [-1] }, { text: 'Do 10 good pumps', kind: 'pumps', count: 10 }, { text: 'Score 4,000', kind: 'score', points: 4000 }] },
  'beach-5': { par: 15500, challenges: [{ text: 'Clear every water gap', kind: 'gaps' }, { text: 'Grab over every gap', kind: 'trick', match: 'grab', overGap: 'every' }, { text: 'Flatspin + Mute combo', kind: 'combo', include: ['Flatspin', 'Mute'] }] },
  'beach-6': { par: 41500, challenges: [{ text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 }, { text: 'Heel roll + air trick + heel roll combo', kind: 'combo', include: ['manual', 'skates', 'manual'] }, { text: 'Combo worth 8,000', kind: 'combo', points: 8000 }] },
  'beach-7': { par: 43500, challenges: [{ text: 'Land a 360', kind: 'trick', match: '360' }, { text: 'Japan over a water gap', kind: 'trick', match: 'Japan', overGap: true }, { text: 'Score 43,500', kind: 'score', points: 43500 }] },
  'beach-8': { par: 20500, challenges: [{ text: 'Grind into the jetty gap and clear it', kind: 'air', fromRail: true, overGap: true }, { text: 'Rail + air trick combo over the gap', kind: 'combo', include: ['grind', 'skates'], gaps: 1 }, { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 }] },
  'beach-9': { par: 26000, challenges: [{ text: 'Clear every water gap', kind: 'gaps' }, { text: 'Do 15 good pumps', kind: 'pumps', count: 15 }, { text: 'Score 26,000', kind: 'score', points: 26000 }] },
  'beach-10': { par: 27500, challenges: [{ text: 'Finish without losing a life', kind: 'noLives' }, { text: '360 + grab off the pier end', kind: 'sameAir', match: ['360', 'grab'], from: 'pierend' }, { text: 'Score 27,500', kind: 'score', points: 27500 }] },
  'beach-pipe': { par: 20500, challenges: [{ text: 'Air of 1.5 metres', kind: 'air', metres: 1.5 }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }, { text: 'Score 20,500', kind: 'score', points: 20500 }] },
  // Downtown Rooftops.
  'rooftops-1': { par: 10500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'Flatspin over a gap', kind: 'trick', match: 'Flatspin', overGap: true }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'rooftops-2': { par: 10000, challenges: [{ text: 'Jump a stair set', kind: 'trick', match: 'Jump', from: 'stairs' }, { text: 'Grab down a stair set', kind: 'trick', match: 'grab', from: 'stairs' }, { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 }] },
  'rooftops-3': { par: 61000, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'Grab over 2 gaps', kind: 'trick', match: 'grab', overGap: true, count: 2 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'rooftops-4': { par: 20500, challenges: [{ text: 'Grind a stair rail', kind: 'grind', railKind: 'handrail' }, { text: 'Grind 2 stair rails', kind: 'grind', railKind: 'handrail', count: 2 }, { text: 'Stair rail + air trick combo', kind: 'combo', include: ['grind', 'skates'] }] },
  'rooftops-5': { par: 27000, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: '180 over a gap', kind: 'trick', match: '180', overGap: true }, { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 }] },
  'rooftops-6': { par: 23000, challenges: [{ text: 'Grind a ledge and clear its gap', kind: 'air', fromRail: true, overGap: true }, { text: 'Ledge grind + air trick over the gap', kind: 'trick', match: 'skates', fromRail: true, overGap: true }, { text: 'Score 23,000', kind: 'score', points: 23000 }] },
  'rooftops-7': { par: 20000, challenges: [{ text: 'Clear every uphill gap', kind: 'gaps', which: [1, 3, 5] }, { text: 'Japan over an uphill gap', kind: 'trick', match: 'Japan', overGap: [1, 3, 5] }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'rooftops-8': { par: 16500, challenges: [{ text: 'Air for 1.5 seconds', kind: 'air', seconds: 1.5 }, { text: 'Grab and spin in the same air over a gap', kind: 'sameAir', match: ['grab', 'spin'], overGap: true }, { text: 'Score 16,500', kind: 'score', points: 16500 }] },
  'rooftops-9': { par: 44500, challenges: [{ text: 'Clear a set of three gaps in one combo', kind: 'combo', gaps: 3 }, { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'rooftops-10': { par: 63500, challenges: [{ text: 'Clear the final gap', kind: 'gaps', which: [-1] }, { text: 'Rail + air trick + grab combo', kind: 'combo', include: ['grind', 'skates', 'grab'] }, { text: 'Score 63,500', kind: 'score', points: 63500 }] },
  'rooftops-mega': { par: 23000, challenges: [{ text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 }, { text: 'A trick on both airs of one drop', kind: 'bothAirs' }, { text: 'Score 23,000', kind: 'score', points: 23000 }] },
  // Snowy Mountain.
  'snow-1': { par: 35000, challenges: [{ text: 'Air for 1.5 seconds', kind: 'air', seconds: 1.5 }, { text: 'Land a 360', kind: 'trick', match: '360' }, { text: 'Score 35,000', kind: 'score', points: 35000 }] },
  'snow-2': { par: 15000, challenges: [{ text: 'Land a backflip', kind: 'trick', match: 'Backflip' }, { text: 'Land a frontflip', kind: 'trick', match: 'Frontflip' }, { text: 'Backflip and grab in the same air', kind: 'sameAir', match: ['Backflip', 'grab'] }] },
  'snow-3': { par: 28000, challenges: [{ text: 'Do 10 good pumps', kind: 'pumps', count: 10 }, { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'snow-4': { par: 9500, challenges: [{ text: 'Clear every crevasse', kind: 'gaps' }, { text: 'Spin over a crevasse', kind: 'trick', match: 'spin', overGap: true }, { text: 'Air trick over a crevasse', kind: 'trick', match: 'skates', overGap: true }] },
  'snow-5': { par: 6500, challenges: [{ text: 'Heel roll for 3 seconds', kind: 'manual', seconds: 3 }, { text: 'One combo across the lake', kind: 'combo', across: ['lake', 'shore'] }, { text: 'Combo worth 5,000', kind: 'combo', points: 5000 }] },
  'snow-6': { par: 73000, challenges: [{ text: 'Grind a box', kind: 'grind', railKind: 'ledge' }, { text: 'Grind 3 rails', kind: 'grind', count: 3 }, { text: 'Rail + backflip combo', kind: 'combo', include: ['grind', 'Backflip'] }] },
  'snow-7': { par: 99500, challenges: [{ text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 }, { text: 'Finish with no bails', kind: 'noLives' }, { text: 'Score 99,500', kind: 'score', points: 99500 }] },
  'snow-8': { par: 15000, challenges: [{ text: 'Clear every crevasse', kind: 'gaps' }, { text: '360 over a level crevasse', kind: 'trick', match: '360', overGap: [3, 4] }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'snow-9': { par: 17000, challenges: [{ text: 'Backflip and grab in the same air', kind: 'sameAir', match: ['Backflip', 'grab'] }, { text: 'Air of 3 metres', kind: 'air', metres: 3 }, { text: 'Combo worth 6,000', kind: 'combo', points: 6000 }] },
  'snow-10': { par: 70500, challenges: [{ text: 'Backflip on the HUGE AIR', kind: 'trick', match: 'Backflip', from: 'hugeair' }, { text: 'Land a 6-trick combo', kind: 'combo', tricks: 6 }, { text: 'Score 70,500', kind: 'score', points: 70500 }] },
  'snow-mega': { par: 22000, challenges: [{ text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 }, { text: 'A trick on both airs of one drop', kind: 'bothAirs' }, { text: 'Score 22,000', kind: 'score', points: 22000 }] },
  // Desert Canyon.
  'desert-1': { par: 19500, challenges: [{ text: 'Do 8 good pumps', kind: 'pumps', count: 8 }, { text: 'Air off a gully lip', kind: 'air', from: 'lip', seconds: 0.4 }, { text: 'Score 19,500', kind: 'score', points: 19500 }] },
  'desert-2': { par: 1000, challenges: [{ text: 'Do 12 good pumps', kind: 'pumps', count: 12 }, { text: 'Air off a gully lip', kind: 'air', from: 'lip', seconds: 0.4 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'desert-3': { par: 27500, challenges: [{ text: 'Jump off a gully kicker', kind: 'trick', match: 'Jump', from: 'kicker' }, { text: 'Air trick + grab combo', kind: 'combo', include: ['skates', 'grab'] }, { text: 'Score 27,500', kind: 'score', points: 27500 }] },
  'desert-4': { par: 9500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'Spin over a gap', kind: 'trick', match: 'spin', overGap: true }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'desert-5': { par: 81000, challenges: [{ text: 'Grind across a gully', kind: 'grind' }, { text: 'Grind every gully rail', kind: 'grind', count: 4 }, { text: 'Grind + air trick combo', kind: 'combo', include: ['grind', 'skates'] }] },
  'desert-6': { par: 4000, challenges: [{ text: 'Do 10 good pumps', kind: 'pumps', count: 10 }, { text: 'Air off the last gully', kind: 'air', from: 'lastlip', seconds: 0.4 }, { text: 'Score 4,000', kind: 'score', points: 4000 }] },
  'desert-7': { par: 37500, challenges: [{ text: 'Clear both gaps', kind: 'gaps' }, { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'desert-8': { par: 9500, challenges: [{ text: 'Ride the loop', kind: 'loop' }, { text: 'Loop + air trick combo', kind: 'combo', include: ['loop', 'skates'] }, { text: 'Score 9,500', kind: 'score', points: 9500 }] },
  'desert-9': { par: 42500, challenges: [{ text: 'Ride both loops', kind: 'loop', count: 2 }, { text: 'Loop + grab + spin combo', kind: 'combo', include: ['loop', 'grab', 'spin'] }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'desert-10': { par: 49000, challenges: [{ text: 'Clear the final gap', kind: 'gaps', which: [-1] }, { text: 'Loop + 2 tricks combo', kind: 'combo', include: ['loop'], tricks: 3 }, { text: 'Score 49,000', kind: 'score', points: 49000 }] },
  'desert-mega': { par: 15500, challenges: [{ text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 }, { text: 'A trick on both airs of one drop', kind: 'bothAirs' }, { text: 'Score 15,500', kind: 'score', points: 15500 }] },
  // Jungle Ruins.
  'jungle-1': { par: 62500, challenges: [{ text: 'Clear both river gaps', kind: 'gaps' }, { text: 'Trick off the 3 jumps in one combo', kind: 'combo', across: ['rhythm', 'rhythmend'] }, { text: 'Score 62,500', kind: 'score', points: 62500 }] },
  'jungle-2': { par: 32500, challenges: [{ text: 'Do 12 good pumps', kind: 'pumps', count: 12 }, { text: 'A trick on every kicker', kind: 'everyKicker', match: 'any' }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'jungle-3': { par: 48500, challenges: [{ text: 'Air trick off a step', kind: 'trick', match: 'skates', from: 'stairs' }, { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 }, { text: 'Score 48,500', kind: 'score', points: 48500 }] },
  'jungle-4': { par: 15000, challenges: [{ text: 'Clear every river gap', kind: 'gaps' }, { text: 'Grab over 3 gaps', kind: 'trick', match: 'grab', overGap: true, count: 3 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'jungle-5': { par: 66500, challenges: [{ text: 'Grind a log', kind: 'grind' }, { text: 'Grind every log', kind: 'grind', count: 6 }, { text: 'Log + air trick + log combo', kind: 'combo', include: ['grind', 'skates', 'grind'] }] },
  'jungle-6': { par: 19000, challenges: [{ text: 'Do 15 good pumps', kind: 'pumps', count: 15 }, { text: 'Finish with no bails', kind: 'noLives' }, { text: 'Score 19,000', kind: 'score', points: 19000 }] },
  'jungle-7': { par: 63500, challenges: [{ text: 'Ride the loop', kind: 'loop' }, { text: 'Loop + air trick combo', kind: 'combo', include: ['loop', 'skates'] }, { text: 'Land a 6-trick combo', kind: 'combo', tricks: 6 }] },
  'jungle-8': { par: 85500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'Rail + gap + rail in one combo', kind: 'combo', include: ['grind', 'grind'], gaps: 1 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'jungle-9': { par: 14000, challenges: [{ text: 'Clear the waterfall gap', kind: 'gaps', which: [1] }, { text: 'Backflip over the waterfall gap', kind: 'trick', match: 'Backflip', overGap: [1] }, { text: 'Score 14,000', kind: 'score', points: 14000 }] },
  'jungle-10': { par: 84000, challenges: [{ text: 'Ride both loops', kind: 'loop', count: 2 }, { text: 'Land a 7-trick combo', kind: 'combo', tricks: 7 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'jungle-pipe': { par: 23500, challenges: [{ text: 'Air of 1.5 metres', kind: 'air', metres: 1.5 }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }, { text: 'Score 23,500', kind: 'score', points: 23500 }] },
  // Volcano.
  'volcano-1': { par: 10500, challenges: [{ text: 'Clear every lava gap', kind: 'gaps' }, { text: 'Flatspin over lava', kind: 'trick', match: 'Flatspin', overGap: true }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'volcano-2': { par: 37000, challenges: [{ text: 'Clear every lava gap', kind: 'gaps' }, { text: 'Grab and spin in the same air over lava', kind: 'sameAir', match: ['grab', 'spin'], overGap: true }, { text: 'Score 37,000', kind: 'score', points: 37000 }] },
  'volcano-3': { par: 33000, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'Do 12 good pumps', kind: 'pumps', count: 12 }, { text: '3-trick combo over a lava gap', kind: 'combo', tricks: 3, gaps: 1 }] },
  'volcano-4': { par: 68000, challenges: [{ text: 'Grind a rail over lava', kind: 'grind', rails: [1] }, { text: 'Stair rail + air trick combo', kind: 'combo', include: ['grind', 'skates'] }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'volcano-5': { par: 30000, challenges: [{ text: 'Ride the lava tube loop', kind: 'loop' }, { text: 'Loop + spin combo', kind: 'combo', include: ['loop', 'spin'] }, { text: 'Score 30,000', kind: 'score', points: 30000 }] },
  'volcano-6': { par: 12000, challenges: [{ text: 'Clear every lava gap', kind: 'gaps' }, { text: 'Air trick over lava from a crater lip', kind: 'trick', match: 'skates', from: 'lip', overGap: true }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'volcano-7': { par: 12500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'A trick over every lava gap', kind: 'trick', match: 'any', overGap: 'every' }, { text: 'Score 12,500', kind: 'score', points: 12500 }] },
  'volcano-8': { par: 21500, challenges: [{ text: 'Clear every uphill gap', kind: 'gaps', which: [2, 4] }, { text: '360 over the 7 m gap', kind: 'trick', match: '360', overGap: [3] }, { text: 'Combo worth 3,000', kind: 'combo', points: 3000 }] },
  'volcano-9': { par: 70500, challenges: [{ text: 'Ride both loops', kind: 'loop', count: 2 }, { text: 'Land an 8-trick combo', kind: 'combo', tricks: 8 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'volcano-10': { par: 45000, challenges: [{ text: 'Clear the crater gap', kind: 'gaps', which: [-1] }, { text: 'Backflip and grab in the same air over the crater gap', kind: 'sameAir', match: ['Backflip', 'grab'], overGap: [-1] }, { text: 'Score 45,000', kind: 'score', points: 45000, noLives: true }] },
  'volcano-mega': { par: 13000, challenges: [{ text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 }, { text: 'A trick on both airs of one drop', kind: 'bothAirs' }, { text: 'Score 13,000', kind: 'score', points: 13000 }] },
  // Autumn Farm.
  'farm-1': { par: 4000, challenges: [{ text: 'Finish the track', kind: 'finish' }, { text: 'Do 8 good pumps', kind: 'pumps', count: 8 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'farm-2': { par: 15000, challenges: [{ text: 'Jump every hay bale', kind: 'everyKicker' }, { text: 'Land a grab', kind: 'trick', match: 'grab' }, { text: 'A trick on every hay bale', kind: 'everyKicker', match: 'any' }] },
  'farm-3': { par: 5500, challenges: [{ text: 'Do 12 good pumps', kind: 'pumps', count: 12 }, { text: 'Heel roll for 1 second', kind: 'manual', seconds: 1 }, { text: 'Score 5,500', kind: 'score', points: 5500 }] },
  'farm-4': { par: 70000, challenges: [{ text: 'Grind a fence rail', kind: 'grind' }, { text: 'Grind 3 different rails', kind: 'grind', count: 3 }, { text: 'Grind for 2 seconds', kind: 'grind', seconds: 2 }] },
  'farm-5': { par: 17500, challenges: [{ text: 'Clear every ditch', kind: 'gaps' }, { text: 'A trick over a ditch', kind: 'trick', match: 'any', overGap: true }, { text: 'A grab over every ditch', kind: 'trick', match: 'grab', overGap: 'every' }] },
  'farm-6': { par: 16000, challenges: [{ text: 'Land 5 different tricks', kind: 'variety', count: 5 }, { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 }, { text: 'Spin and grab in the same air', kind: 'sameAir', match: ['spin', 'grab'] }] },
  'farm-7': { par: 23000, challenges: [{ text: 'Clear every ditch', kind: 'gaps' }, { text: 'Grind the fence rail', kind: 'grind' }, { text: 'One air of 1 second', kind: 'air', seconds: 1 }] },
  'farm-8': { par: 36500, challenges: [{ text: 'Clear every ditch', kind: 'gaps' }, { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'farm-pipe': { par: 16000, challenges: [{ text: 'Land a grab', kind: 'trick', match: 'grab' }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }, { text: 'Score 16,000', kind: 'score', points: 16000 }] },
  // Candy Kingdom.
  'candy-1': { par: 10000, challenges: [{ text: 'Finish the track', kind: 'finish' }, { text: 'A trick off a jelly pad', kind: 'trick', match: 'any', from: 'bouncer' }, { text: 'A grab off every jelly pad', kind: 'trick', match: 'grab', from: 'bouncer', count: 4 }] },
  'candy-2': { par: 8000, challenges: [{ text: 'Pump on a jelly pad for a big bounce', kind: 'air', seconds: 1.3, from: 'bouncer' }, { text: 'Do 10 good pumps', kind: 'pumps', count: 10 }, { text: 'An air trick and a grab in one bounce', kind: 'sameAir', match: ['skates', 'grab'], from: 'bouncer' }] },
  'candy-3': { par: 30000, challenges: [{ text: 'Bounce 3 pads in a row in one combo', kind: 'combo', across: ['chain', 'chainend'] }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }, { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 }] },
  'candy-4': { par: 12000, challenges: [{ text: 'Clear every chocolate river', kind: 'gaps' }, { text: 'A grab over a river', kind: 'trick', match: 'grab', overGap: true }, { text: 'A trick over every river', kind: 'trick', match: 'any', overGap: 'every' }] },
  'candy-5': { par: 52500, challenges: [{ text: 'Grind 2 candy canes', kind: 'grind', count: 2 }, { text: 'Clear every chocolate river', kind: 'gaps' }, { text: 'Grind for 2 seconds', kind: 'grind', seconds: 2 }] },
  'candy-6': { par: 30000, challenges: [{ text: 'Clear every chocolate river', kind: 'gaps' }, { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 }, { text: 'A 360 off a jelly pad', kind: 'trick', match: '360', from: 'bouncer' }] },
  'candy-7': { par: 30500, challenges: [{ text: 'Clear every chocolate river', kind: 'gaps' }, { text: 'One combo across the bounce chain', kind: 'combo', across: ['chain', 'chainend'] }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'candy-8': { par: 37000, challenges: [{ text: 'Clear every chocolate river', kind: 'gaps' }, { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 }, { text: 'Land 8 different tricks', kind: 'variety', count: 8 }] },
  'candy-pipe': { par: 22000, challenges: [{ text: 'Land a spin', kind: 'trick', match: 'spin' }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }, { text: 'Score 22,000', kind: 'score', points: 22000 }] },
  // Harbour Docks.
  'docks-1': { par: 8500, challenges: [{ text: 'Finish the track', kind: 'finish' }, { text: 'Heel roll along the containers', kind: 'manual', seconds: 1.5, pad: true }, { text: 'Heel roll and grind in one combo', kind: 'combo', include: ['manual', 'grind'] }] },
  'docks-2': { par: 12500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'Heel roll for 2 seconds on the containers', kind: 'manual', seconds: 2, pad: true }, { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 }] },
  'docks-3': { par: 16500, challenges: [{ text: 'Grind a handrail', kind: 'grind', railKind: 'handrail' }, { text: 'Grind a handrail, then heel roll, in one combo', kind: 'combo', include: ['grind', 'manual'] }, { text: 'Score 16,500', kind: 'score', points: 16500 }] },
  'docks-4': { par: 65000, challenges: [{ text: 'Grind 3 different rails', kind: 'grind', count: 3 }, { text: 'A grab off a rail', kind: 'trick', match: 'grab', fromRail: true }, { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 }] },
  'docks-5': { par: 13500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: '180 over a gap', kind: 'trick', match: '180', overGap: true }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'docks-6': { par: 12500, challenges: [{ text: 'Air for 1.5 seconds', kind: 'air', seconds: 1.5 }, { text: 'A grab over every gap', kind: 'trick', match: 'grab', overGap: 'every' }, { text: 'Score 12,500', kind: 'score', points: 12500 }] },
  'docks-7': { par: 17500, challenges: [{ text: 'Ride three stacks in one combo', kind: 'combo', across: ['stacks', 'stacksend'] }, { text: 'Land 6 different tricks', kind: 'variety', count: 6 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'docks-8': { par: 47000, challenges: [{ text: 'Heel roll, grind and air trick in one combo', kind: 'combo', include: ['manual', 'grind', 'skates'] }, { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 }, { text: 'Score 47,000', kind: 'score', points: 47000 }] },
  'docks-9': { par: 40000, challenges: [{ text: 'Clear a set of three gaps in one combo', kind: 'combo', gaps: 3 }, { text: 'Land a 6-trick combo', kind: 'combo', tricks: 6 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'docks-10': { par: 56500, challenges: [{ text: 'Clear the final gap', kind: 'gaps', which: [-1] }, { text: 'Grind, heel roll and grab in one combo', kind: 'combo', include: ['grind', 'manual', 'grab'] }, { text: 'Score 56,500', kind: 'score', points: 56500 }] },
  'docks-mega': { par: 23500, challenges: [{ text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 }, { text: 'A trick on both airs of one drop', kind: 'bothAirs' }, { text: 'Score 23,500', kind: 'score', points: 23500 }] },
  // Pirate Cove.
  'pirate-1': { par: 55500, challenges: [{ text: 'Hop every stone', kind: 'gaps' }, { text: 'Do 12 good pumps', kind: 'pumps', count: 12 }, { text: 'A grab between two stones', kind: 'trick', match: 'grab', from: 'stones' }] },
  'pirate-2': { par: 51000, challenges: [{ text: 'Hop every stone', kind: 'gaps' }, { text: 'Hop three stones in one combo', kind: 'combo', across: ['stones', 'stonesend'] }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }] },
  'pirate-3': { par: 64500, challenges: [{ text: 'Grind the plank', kind: 'grind' }, { text: 'Grind, then air trick, in one combo', kind: 'combo', include: ['grind', 'skates'] }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'pirate-4': { par: 67500, challenges: [{ text: 'Hop every stone', kind: 'gaps' }, { text: 'An air trick and a grab on one set of stones', kind: 'combo', include: ['skates', 'grab'], across: ['stones', 'stonesend'] }, { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 }] },
  'pirate-5': { par: 59000, challenges: [{ text: 'Air for 1.5 seconds', kind: 'air', seconds: 1.5 }, { text: 'A spin over every big gap', kind: 'trick', match: 'spin', overGap: [0, 4, 8] }, { text: 'Score 59,000', kind: 'score', points: 59000 }] },
  'pirate-6': { par: 53000, challenges: [{ text: 'Heel roll the jetty', kind: 'manual', pad: true }, { text: 'Land 6 different tricks', kind: 'variety', count: 6 }, { text: 'Land a 6-trick combo', kind: 'combo', tricks: 6 }] },
  'pirate-7': { par: 66500, challenges: [{ text: 'Hop every stone', kind: 'gaps' }, { text: 'Hop four stones in one combo', kind: 'combo', across: ['stones', 'stonesend'] }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'pirate-8': { par: 68000, challenges: [{ text: 'Clear the final gap', kind: 'gaps', which: [-1] }, { text: 'An air trick and a grab in one combo', kind: 'combo', include: ['skates', 'grab'] }, { text: 'Score 68,000', kind: 'score', points: 68000 }] },
  'pirate-pipe': { par: 22000, challenges: [{ text: 'Land a grab', kind: 'trick', match: 'grab' }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }, { text: 'Score 22,000', kind: 'score', points: 22000 }] },
  // Haunted Hollow.
  'haunted-1': { par: 4500, challenges: [{ text: 'Air for half a second off a drop-off', kind: 'air', from: 'dropoff', seconds: 0.5 }, { text: 'Do 12 good pumps', kind: 'pumps', count: 12 }, { text: 'A grab off a drop-off', kind: 'trick', match: 'grab', from: 'dropoff' }] },
  'haunted-2': { par: 7500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'An air trick off a drop-off', kind: 'trick', match: 'skates', from: 'dropoff' }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }] },
  'haunted-3': { par: 16500, challenges: [{ text: 'Grind the crooked bridge', kind: 'grind' }, { text: 'Grind, then a drop-off, in one combo', kind: 'combo', include: ['grind'], tricks: 2 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'haunted-4': { par: 7500, challenges: [{ text: 'Do 14 good pumps', kind: 'pumps', count: 14 }, { text: 'Clear every gap', kind: 'gaps' }, { text: 'Land 6 different tricks', kind: 'variety', count: 6 }] },
  'haunted-5': { par: 12500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'A spin over every gap', kind: 'trick', match: 'spin', overGap: 'every' }, { text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 }] },
  'haunted-6': { par: 25500, challenges: [{ text: 'Ride the ghost train rail', kind: 'grind', count: 3 }, { text: 'A grind and two more tricks in one combo', kind: 'combo', include: ['grind'], tricks: 3 }, { text: 'Clear every gap', kind: 'gaps' }] },
  'haunted-7': { par: 18500, challenges: [{ text: 'Grind a handrail', kind: 'grind', railKind: 'handrail' }, { text: 'Clear the gap', kind: 'gaps' }, { text: 'An air trick down the stairs', kind: 'trick', match: 'skates', from: 'stairs' }] },
  'haunted-8': { par: 21000, challenges: [{ text: 'Clear the final gap', kind: 'gaps', which: [-1] }, { text: 'Land 6 different tricks', kind: 'variety', count: 6 }, { text: 'Score 21,000', kind: 'score', points: 21000 }] },
  'haunted-pipe': { par: 22000, challenges: [{ text: 'Land an air trick', kind: 'trick', match: 'skates' }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }, { text: 'Score 22,000', kind: 'score', points: 22000 }] },
  // Funfair.
  'funfair-1': { par: 16000, challenges: [{ text: 'Ride every loop', kind: 'loop', count: 3 }, { text: 'Do 12 good pumps', kind: 'pumps', count: 12 }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }] },
  'funfair-2': { par: 17000, challenges: [{ text: 'Ride both loops of a pair', kind: 'loop', count: 2 }, { text: 'Ride every loop', kind: 'loop', count: 4 }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }] },
  'funfair-3': { par: 21500, challenges: [{ text: 'Grind the coaster track', kind: 'grind', count: 3 }, { text: 'Clear every gap', kind: 'gaps' }, { text: 'An air trick over a gap', kind: 'trick', match: 'skates', overGap: true }] },
  'funfair-4': { par: 25000, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'A loop and a gap in one combo', kind: 'combo', include: ['loop'], gaps: 1 }, { text: 'A spin over a gap', kind: 'trick', match: 'spin', overGap: true }] },
  'funfair-5': { par: 20500, challenges: [{ text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 }, { text: 'Ride every loop', kind: 'loop', count: 2 }, { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 }] },
  'funfair-6': { par: 21000, challenges: [{ text: 'A trick off every kicker', kind: 'everyKicker' }, { text: 'Land 6 different tricks', kind: 'variety', count: 6 }, { text: 'Clear every gap', kind: 'gaps' }] },
  'funfair-7': { par: 34000, challenges: [{ text: 'Grind every rail', kind: 'grind', count: 3 }, { text: 'Ride every loop', kind: 'loop', count: 3 }, { text: 'A loop and a grind in one combo', kind: 'combo', include: ['loop', 'grind'] }] },
  'funfair-8': { par: 14500, challenges: [{ text: 'Land a 360', kind: 'trick', match: '360' }, { text: 'Clear every gap', kind: 'gaps' }, { text: 'A spin over every gap', kind: 'trick', match: 'spin', overGap: 'every' }] },
  'funfair-9': { par: 30500, challenges: [{ text: 'Ride every loop', kind: 'loop', count: 4 }, { text: 'Land 6 different tricks', kind: 'variety', count: 6 }, { text: 'Clear every gap', kind: 'gaps' }] },
  'funfair-10': { par: 19000, challenges: [{ text: 'Clear the final gap', kind: 'gaps', which: [-1] }, { text: 'Ride every loop', kind: 'loop', count: 4 }, { text: 'Score 19,000', kind: 'score', points: 19000 }] },
  'funfair-pipe': { par: 22000, challenges: [{ text: 'Land a spin', kind: 'trick', match: 'spin' }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }, { text: 'Score 22,000', kind: 'score', points: 22000 }] },
  // Toxic Factory.
  'toxic-1': { par: 15000, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'Do 12 good pumps', kind: 'pumps', count: 12 }, { text: 'A grab over the goo', kind: 'trick', match: 'grab', overGap: true }] },
  'toxic-2': { par: 12500, challenges: [{ text: 'Do 20 good pumps', kind: 'pumps', count: 20 }, { text: 'Clear every gap', kind: 'gaps' }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }] },
  'toxic-3': { par: 12000, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'A spin over the goo', kind: 'trick', match: 'spin', overGap: true }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'toxic-4': { par: 27500, challenges: [{ text: 'Grind 3 pipes', kind: 'grind', count: 3 }, { text: 'Grind a pipe over the goo', kind: 'grind', rails: [1] }, { text: 'Land a 5-trick combo', kind: 'combo', tricks: 5 }] },
  'toxic-5': { par: 19500, challenges: [{ text: 'A trick off every kicker', kind: 'everyKicker' }, { text: 'Clear every gap', kind: 'gaps' }, { text: 'Land 6 different tricks', kind: 'variety', count: 6 }] },
  'toxic-6': { par: 27500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'Grind and air trick in one combo', kind: 'combo', include: ['grind', 'skates'] }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'toxic-7': { par: 13500, challenges: [{ text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 }, { text: 'Clear every gap', kind: 'gaps' }, { text: 'An air trick off a drop', kind: 'trick', match: 'skates', from: 'dropoff' }] },
  'toxic-8': { par: 12500, challenges: [{ text: 'Do 18 good pumps', kind: 'pumps', count: 18 }, { text: 'Clear every gap', kind: 'gaps' }, { text: 'Land 6 different tricks', kind: 'variety', count: 6 }] },
  'toxic-9': { par: 20500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'Grind every pipe', kind: 'grind', count: 3 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'toxic-10': { par: 23000, challenges: [{ text: 'Clear the final gap', kind: 'gaps', which: [-1] }, { text: 'Land 6 different tricks', kind: 'variety', count: 6 }, { text: 'Score 23,000', kind: 'score', points: 23000 }] },
  'toxic-mega': { par: 22000, challenges: [{ text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 }, { text: 'A trick on both airs of one drop', kind: 'bothAirs' }, { text: 'Score 22,000', kind: 'score', points: 22000 }] },
  // Crystal Mine.
  'mine-1': { par: 22000, challenges: [{ text: 'Grind 4 rails', kind: 'grind', count: 4 }, { text: 'Do 12 good pumps', kind: 'pumps', count: 12 }, { text: 'Land 4 different tricks', kind: 'variety', count: 4 }] },
  'mine-2': { par: 33500, challenges: [{ text: 'Grind 6 rails', kind: 'grind', count: 6 }, { text: 'A grab off a rail', kind: 'trick', match: 'grab', fromRail: true }, { text: 'Clear every gap', kind: 'gaps' }] },
  'mine-3': { par: 37000, challenges: [{ text: 'Grind 4 rails', kind: 'grind', count: 4 }, { text: 'Do 14 good pumps', kind: 'pumps', count: 14 }, { text: 'Clear every gap', kind: 'gaps' }] },
  'mine-4': { par: 26500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'Grind a rail over a shaft', kind: 'grind', rails: [1] }, { text: 'An air trick over a shaft', kind: 'trick', match: 'skates', overGap: true }] },
  'mine-5': { par: 48500, challenges: [{ text: 'Grind 8 rails', kind: 'grind', count: 8 }, { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }] },
  'mine-6': { par: 24500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'A grab over a shaft', kind: 'trick', match: 'grab', overGap: true }, { text: 'Grind 4 rails', kind: 'grind', count: 4 }] },
  'mine-7': { par: 26500, challenges: [{ text: 'Grind every bridge', kind: 'grind', count: 3 }, { text: 'Clear every gap', kind: 'gaps' }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'mine-8': { par: 34000, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'A spin over a shaft', kind: 'trick', match: 'spin', overGap: true }, { text: 'Do 16 good pumps', kind: 'pumps', count: 16 }] },
  'mine-9': { par: 43000, challenges: [{ text: 'Grind 5 rails', kind: 'grind', count: 5 }, { text: 'Clear every gap', kind: 'gaps' }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'mine-10': { par: 54000, challenges: [{ text: 'Clear the final gap', kind: 'gaps', which: [-1] }, { text: 'Grind 7 rails', kind: 'grind', count: 7 }, { text: 'Score 54,000', kind: 'score', points: 54000 }] },
  'mine-mega': { par: 22000, challenges: [{ text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 }, { text: 'A trick on both airs of one drop', kind: 'bothAirs' }, { text: 'Score 22,000', kind: 'score', points: 22000 }] },
  // Dino Valley.
  'dino-1': { par: 9500, challenges: [{ text: 'A trick off every hump', kind: 'everyKicker' }, { text: 'Do 12 good pumps', kind: 'pumps', count: 12 }, { text: 'Land 4 different tricks', kind: 'variety', count: 4 }] },
  'dino-2': { par: 13000, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'A grab over the tar', kind: 'trick', match: 'grab', overGap: true }, { text: 'Air for 1 second', kind: 'air', seconds: 1 }] },
  'dino-3': { par: 15000, challenges: [{ text: 'A trick off every hump', kind: 'everyKicker' }, { text: 'An air trick off a hump', kind: 'trick', match: 'skates', from: 'hump' }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }] },
  'dino-4': { par: 19500, challenges: [{ text: 'Grind 3 logs', kind: 'grind', count: 3 }, { text: 'Clear every gap', kind: 'gaps' }, { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 }] },
  'dino-5': { par: 10500, challenges: [{ text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 }, { text: 'A trick off every hump', kind: 'everyKicker' }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'dino-6': { par: 15500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'A spin over the tar', kind: 'trick', match: 'spin', overGap: true }, { text: 'Do 16 good pumps', kind: 'pumps', count: 16 }] },
  'dino-7': { par: 8000, challenges: [{ text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 }, { text: 'A grab off a hump', kind: 'trick', match: 'grab', from: 'hump' }, { text: 'Clear every gap', kind: 'gaps' }] },
  'dino-8': { par: 24000, challenges: [{ text: 'Grind 3 logs', kind: 'grind', count: 3 }, { text: 'Clear every gap', kind: 'gaps' }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'dino-9': { par: 13000, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'A trick off every hump', kind: 'everyKicker' }, { text: 'Land 6 different tricks', kind: 'variety', count: 6 }] },
  'dino-10': { par: 17500, challenges: [{ text: 'Clear the final gap', kind: 'gaps', which: [-1] }, { text: 'Air for 1.4 seconds', kind: 'air', seconds: 1.4 }, { text: 'Score 17,500', kind: 'score', points: 17500 }] },
  'dino-mega': { par: 22000, challenges: [{ text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 }, { text: 'A trick on both airs of one drop', kind: 'bothAirs' }, { text: 'Score 22,000', kind: 'score', points: 22000 }] },
  // Moon Base.
  'moon-1': { par: 11000, challenges: [{ text: 'Air for 1.5 seconds', kind: 'air', seconds: 1.5 }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }, { text: 'Do 12 good pumps', kind: 'pumps', count: 12 }] },
  'moon-2': { par: 14500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'Two tricks in one air', kind: 'sameAir', match: ['skates', 'grab'] }, { text: 'A spin over a crater', kind: 'trick', match: 'spin', overGap: true }] },
  'moon-3': { par: 9500, challenges: [{ text: 'Air for 2 seconds', kind: 'air', seconds: 2 }, { text: 'A trick off every kicker', kind: 'everyKicker' }, { text: 'Land 6 different tricks', kind: 'variety', count: 6 }] },
  'moon-4': { par: 33500, challenges: [{ text: 'Grind 4 rails', kind: 'grind', count: 4 }, { text: 'Grind a rail over a crater', kind: 'grind', rails: [1] }, { text: 'A grab over a crater', kind: 'trick', match: 'grab', overGap: true }] },
  'moon-5': { par: 13500, challenges: [{ text: 'Ride every loop', kind: 'loop', count: 2 }, { text: 'Clear every gap', kind: 'gaps' }, { text: 'Air for 1.8 seconds', kind: 'air', seconds: 1.8 }] },
  'moon-6': { par: 9000, challenges: [{ text: 'A trick off every hump', kind: 'everyKicker' }, { text: 'Air for 2 seconds', kind: 'air', seconds: 2 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'moon-7': { par: 7500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'An air trick off a drop', kind: 'trick', match: 'skates', from: 'dropoff' }, { text: 'Air for 2 seconds', kind: 'air', seconds: 2 }] },
  'moon-8': { par: 31000, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'Grind 3 rails', kind: 'grind', count: 3 }, { text: 'Land 6 different tricks', kind: 'variety', count: 6 }] },
  'moon-9': { par: 17000, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'Land 7 different tricks', kind: 'variety', count: 7 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'moon-10': { par: 23500, challenges: [{ text: 'Clear the final gap', kind: 'gaps', which: [-1] }, { text: 'Air for 2.5 seconds', kind: 'air', seconds: 2.5 }, { text: 'Score 23,500', kind: 'score', points: 23500 }] },
  'moon-pipe': { par: 21500, challenges: [{ text: 'Air for 2 seconds', kind: 'air', seconds: 2 }, { text: 'Land 6 different tricks', kind: 'variety', count: 6 }, { text: 'Score 21,500', kind: 'score', points: 21500 }] },
  // Sky Islands.
  'sky-1': { par: 9000, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'Do 12 good pumps', kind: 'pumps', count: 12 }, { text: 'A grab over the clouds', kind: 'trick', match: 'grab', overGap: true }] },
  'sky-2': { par: 13000, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'An air trick over the clouds', kind: 'trick', match: 'skates', overGap: true }, { text: 'Land 5 different tricks', kind: 'variety', count: 5 }] },
  'sky-3': { par: 19500, challenges: [{ text: 'Grind 3 rope rails', kind: 'grind', count: 3 }, { text: 'Clear every gap', kind: 'gaps' }, { text: 'A grab off a rail', kind: 'trick', match: 'grab', fromRail: true }] },
  'sky-4': { par: 11000, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'An air trick over the clouds', kind: 'trick', match: 'skates', overGap: true }, { text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 }] },
  'sky-5': { par: 12500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'A trick off every kicker', kind: 'everyKicker' }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'sky-6': { par: 19000, challenges: [{ text: 'Grind 3 rails', kind: 'grind', count: 3 }, { text: 'Clear every gap', kind: 'gaps' }, { text: 'Land 6 different tricks', kind: 'variety', count: 6 }] },
  'sky-7': { par: 12000, challenges: [{ text: 'Ride the loop', kind: 'loop' }, { text: 'Clear every gap', kind: 'gaps' }, { text: 'Air for 1.2 seconds', kind: 'air', seconds: 1.2 }] },
  'sky-8': { par: 15000, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'Do 18 good pumps', kind: 'pumps', count: 18 }, { text: 'Finish without losing a life', kind: 'noLives' }] },
  'sky-9': { par: 19500, challenges: [{ text: 'Clear every gap', kind: 'gaps' }, { text: 'Grind both rails', kind: 'grind', count: 2 }, { text: 'Land 6 different tricks', kind: 'variety', count: 6 }] },
  'sky-10': { par: 21000, challenges: [{ text: 'Clear the final gap', kind: 'gaps', which: [-1] }, { text: 'Land 7 different tricks', kind: 'variety', count: 7 }, { text: 'Score 21,000', kind: 'score', points: 21000 }] },
  'sky-mega': { par: 22000, challenges: [{ text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 }, { text: 'A trick on both airs of one drop', kind: 'bothAirs' }, { text: 'Score 22,000', kind: 'score', points: 22000 }] },
};

/** Skateboard words and tricks, the inline skates way. */
const SWAP: Record<string, string> = {
  Ollie: 'Jump', Kickflip: 'Flatspin', Heelflip: 'Misty Flip', 'Pop Shove-it': 'Rocket Air', '360 Flip': 'Flatspin', Hardflip: 'Misty Flip',
  'BS Shifty': 'Flatspin', 'FS Shifty': 'Misty Flip', 'Tuck Knee': 'Rocket Air',
  Indy: 'Mute', Melon: 'Japan', Nosegrab: 'Safety', Tailgrab: 'Stalefish',
  flip: 'skates', '50-50': 'Frontside', Boardslide: 'Soul', '5-0': 'Makio', Nosegrind: 'Royale',
  Manual: 'Heel Roll', 'Nose Manual': 'Toe Roll',
};
// (Plain flips first, so the misty flip they turn into isn't turned again.)
const WORDS: [RegExp, string][] = [
  [/\b360 flip\b/gi, 'flatspin'], [/\bflips?\b/gi, 'air trick'], [/\ba air\b/g, 'an air'], [/\bA air\b/g, 'An air'],
  [/\bollie\b/gi, 'jump'], [/\bkickflip\b/gi, 'flatspin'], [/\bheelflip\b/gi, 'misty flip'], [/\bshove-it\b/gi, 'rocket air'],
  [/\bhardflip\b/gi, 'misty flip'],
  [/\bIndy\b/g, 'Mute'], [/\bMelon\b/g, 'Japan'], [/\bNosegrab\b/g, 'Safety'], [/\bTailgrab\b/g, 'Stalefish'],
  [/\b50-50\b/g, 'frontside'], [/\bboardslide\b/gi, 'soul'], [/\b5-0\b/g, 'makio'], [/\bnosegrind\b/gi, 'royale'],
  [/\bnose manual\b/gi, 'toe roll'], [/\bmanual\b/gi, 'heel roll'],
];

/**
 * For a track that doesn't have inline skates challenges written yet: its skateboard ones with
 * the tricks swapped for skate ones. The playtest lists tracks that still need their own.
 */
export function rollerFallback(def: { par?: number; challenges?: Challenge[] }): RollerTrack {
  const swap = <T,>(v: T): T => (typeof v === 'string' ? (SWAP[v] ?? v) as T : Array.isArray(v) ? v.map(swap) as T : v);
  const challenges = (def.challenges ?? []).map((c) => {
    const out = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, k === 'text' || k === 'kind' ? v : swap(v)])) as Challenge;
    out.text = WORDS.reduce((t, [re, to]) => t.replace(re, to), c.text);
    out.text = out.text.charAt(0).toUpperCase() + out.text.slice(1);
    return out;
  });
  return { par: def.par ?? 0, challenges };
}
