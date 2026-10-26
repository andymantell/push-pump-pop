import type { Challenge } from '../challenges';

// The downhill bike (MTB) career: three challenges for every track, with bike tricks (whips,
// tabletops, turndowns, body tricks, skinnies, stoppies), and its own score targets. Its own
// downhill courses live in their own world files; this file holds the bike's challenges for
// the skateboard and scooter tracks it can ride too.
//
// `par` is the MTB playtest bot's 75th percentile score, rounded to 500, as for the other rides.

export interface MtbTrack { par: number; challenges: Challenge[] }

export const MTB: Record<string, MtbTrack> = {
  'beach-3': {
    par: 18000,
    challenges: [
      { text: 'Ride a pier skinny', kind: 'grind' },
      { text: 'Ride skinnies for 2 seconds', kind: 'grind', seconds: 2 },
      { text: 'Manual along a skinny', kind: 'trick', match: 'Skinny Manual' },
    ],
  },
  'rooftops-2': {
    par: 9500,
    challenges: [
      { text: 'Bunny hop a stair set', kind: 'trick', match: 'Bunny Hop', from: 'stairs' },
      { text: 'Body trick off a stair set', kind: 'trick', match: 'hold', from: 'stairs' },
      { text: 'Land a 3-trick combo', kind: 'combo', tricks: 3 },
    ],
  },
  'rooftops-4': {
    par: 22000,
    challenges: [
      { text: 'Ride a stair skinny', kind: 'grind', railKind: 'handrail' },
      { text: 'Ride 2 stair skinnies', kind: 'grind', railKind: 'handrail', count: 2 },
      { text: 'Manual along a skinny', kind: 'trick', match: 'Skinny Manual' },
    ],
  },
  'rooftops-10': {
    par: 59000,
    challenges: [
      { text: 'Clear the final gap', kind: 'gaps', which: [-1] },
      { text: 'Skinny + body trick combo', kind: 'combo', include: ['skinny', 'hold'] },
      { text: 'Score 59,000', kind: 'score', points: 59000 },
    ],
  },
  'toxic-4': {
    par: 22000,
    challenges: [
      { text: 'Ride 3 pipes', kind: 'grind', count: 3 },
      { text: 'Ride a pipe over the goo', kind: 'grind', rails: [1] },
      { text: 'Land a 4-trick combo', kind: 'combo', tricks: 4 },
    ],
  },
  'mine-10': {
    par: 38500,
    challenges: [
      { text: 'Clear the final gap', kind: 'gaps', which: [-1] },
      { text: 'Ride 7 skinnies', kind: 'grind', count: 7 },
      { text: 'Score 38,500', kind: 'score', points: 38500 },
    ],
  },
  'volcano-9': {
    par: 59500,
    challenges: [
      { text: 'Ride both loops', kind: 'loop', count: 2 },
      { text: 'Land a 6-trick combo', kind: 'combo', tricks: 6 },
      { text: 'Finish without losing a life', kind: 'noLives' },
    ],
  },
};

/** Skateboard words and tricks, the downhill bike way. */
const SWAP: Record<string, string> = {
  Ollie: 'Bunny Hop', Kickflip: 'Whip', Heelflip: 'Tabletop', 'Pop Shove-it': 'Turndown',
  'BS Shifty': 'Whip', 'FS Shifty': 'Tabletop', 'Tuck Knee': 'Turndown',
  Indy: 'Superman', Melon: 'No Footer', Nosegrab: 'Can Can', Tailgrab: 'No Hander',
  'Nose Manual': 'Stoppie', 'Nose Press': 'Stoppie', 'Tail Press': 'Manual',
  flip: 'bike', grab: 'hold', grind: 'skinny', '50-50': 'Skinny', '5-0': 'Skinny Manual', Nosegrind: 'Skinny Stoppie', Boardslide: 'Skinny',
};
const WORDS: [RegExp, string][] = [
  [/\bollie\b/gi, 'bunny hop'], [/\bkickflip\b/gi, 'whip'], [/\bheelflip\b/gi, 'tabletop'], [/\bshove-it\b/gi, 'turndown'],
  [/\bflip\b/gi, 'whip'], [/\bgrab\b/gi, 'body trick'], [/\bIndy\b/g, 'Superman'], [/\bMelon\b/g, 'No Footer'],
  [/\bNose manual\b/gi, 'Stoppie'], [/\bGrind\b/g, 'Ride'], [/\bgrind\b/g, 'ride'], [/\brails\b/g, 'skinnies'], [/\brail\b/g, 'skinny'],
];

/**
 * For a track that doesn't have MTB challenges written yet: its skateboard ones with the
 * tricks swapped for bike ones. The playtest lists tracks that still need their own.
 */
export function mtbFallback(def: { par?: number; challenges?: Challenge[] }): MtbTrack {
  const swap = <T,>(v: T): T => (typeof v === 'string' ? (SWAP[v] ?? v) as T : Array.isArray(v) ? v.map(swap) as T : v);
  const challenges = (def.challenges ?? []).map((c) => {
    const out = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, k === 'text' || k === 'kind' || k === 'railKind' ? v : swap(v)])) as Challenge;
    out.text = WORDS.reduce((t, [re, to]) => t.replace(re, to), c.text);
    return out;
  });
  return { par: def.par ?? 0, challenges };
}
