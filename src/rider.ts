import { Track, Pit, Rail, railY, Loop, LOOP_SHIFT } from './track';

// Arcade physics for a rider on a 2D height profile.

export const GRAVITY = 14;
const ROLL_FRICTION = 0.18;
const AIR_DRAG = 0.006;
const PUMP_TIME = 0.55;
const PUMP_ACCEL = 9;
/** Pumping on the way down from an air pulls you down harder for a moment, to aim for a landing. */
const AIR_PUMP_TIME = 0.35;
const AIR_PUMP_ACCEL = 16;
const MIN_PUSH_SPEED = 4.5;
const MAX_SPEED = 17;
const OLLIE_POP = 5.6;
const COYOTE_TIME = 0.14;
const BAIL_TIME = 1.3;
/** Arcade grip: the board sticks to convex ground more than real gravity would allow. */
const STICK = 2.2;
/** Share of forward speed always kept on a clean landing. */
const LAND_KEEP = 0.9;
/** Steeper than this is a wall (a drop or gap edge), not something you ride. */
const WALL_SLOPE = 1.5;
/** Grace after take-off before touching the ground counts as a landing. */
const TAKEOFF_TIME = 0.06;
/** Grinding slows you a little more than rolling. */
const GRIND_FRICTION = 0.35;
const GRIND_POINTS = 200;
const GRIND_POINTS_PER_SEC = 700;
/** How far above a rail you can pass on the way down and still lock on to it (arcade magnet). */
const GRIND_CATCH = 0.3;
/** Rolling friction on the loop is a bit higher: it's a tight curve. */
const LOOP_FRICTION = 0.3;
const LOOP_POINTS = 1000;
/** Pumping as you hit a jelly pad bounces you this much higher. */
const PUMP_BOUNCE = 1.25;
/** Mud drags you back: a steady pull plus more the faster you go. */
const MUD_DRAG = 1.2;
const MUD_DRAG_PER_SPEED = 0.16;
/** A fast belt pulls you up to its speed, at most this hard... */
const BELT_PUSH = 3.5;
const BELT_GRIP = 0.6;
/** ...and a backwards one drags you back this hard, but never below a crawl. */
const BELT_DRAG = 1.6;
const BELT_CRAWL = 3;
/** Pumping on a belt pushes you on as if you were going downhill. */
const BELT_PUMP = 0.5;
/** Half pipe start: standing on the coping, nose up over the pipe. */
const PERCH_ANGLE = 0.3;
/** How far over the coping the board sits while perched, and how long dropping in takes. */
const PERCH_OVER = 0.3;
const DROP_TIME = 0.2;
/** Dropping in gives you a shove down the wall, so the first pass already gets a little air. */
const DROP_SPEED = 4;
/** Rail assist: an ollie this many seconds before a rail starts hops you onto it. */
const RAIL_REACH = 0.7;
/** ...as long as there's this much rail left to land on. */
const RAIL_ROOM = 1.2;

/** Held tricks from the left-hand swipes: board grabs on a skateboard, body tricks on a scooter. */
export type GrabName = BoardGrab | ScooterHold | BikeHold | KayakHold | SkateGrab;
export type BoardGrab = 'Indy' | 'Melon' | 'Nosegrab' | 'Tailgrab';
export type ScooterHold = 'Superman' | 'No Footer' | 'Can Can' | 'X-Up';
/**
 * On aggressive inline skates: a mute (the opposite hand grabs a skate in front), a japan (a
 * skate pulled up behind, grabbed behind the back), a safety (the same side hand grabs its own
 * skate) and a stalefish (reaching behind to the outside of the opposite skate).
 */
export type SkateGrab = 'Mute' | 'Japan' | 'Safety' | 'Stalefish';
/** On a downhill bike: the same body tricks, but hands off the bars instead of an X-Up. */
export type BikeHold = 'Superman' | 'No Footer' | 'Can Can' | 'No Hander';
/**
 * In a kayak, held on the left in a hole: end moves. A cartwheel throws the boat end over end
 * for as long as you hold it; a blunt stands it up on the bow and swings it round; a McNasty is
 * a spinning loop; a Space Godzilla a loop thrown off to one side.
 */
export type KayakHold = 'Cartwheel' | 'Blunt' | 'McNasty' | 'Space Godzilla';
/** A kayak spins flat on the water (a flatspin) rather than in the air. */
export type SpinName = 'FS 180' | 'BS 180' | 'FS 360' | 'BS 360' | 'Flatspin 180' | 'Flatspin 360';
/** Spins added up through one air: 180 + 180 is a 360, and so on. */
export type SpinTotal = `${'FS' | 'BS'} ${number}`;
/** Body flips: a kayak's are loops, the boat going end over end in the air. */
export type FlipName = 'Backflip' | 'Frontflip' | 'Back Loop' | 'Front Loop';
/**
 * Tricks done one after another in the same air that riders call by one name: a backflip with
 * a 180 (flair) or a 360 (cash roll), a frontflip with a backside 540 or more (misty), a 360
 * with a barspin (truckdriver), a 360 flip with the body turning 180 backside with it (bigspin flip).
 */
export type ComboName = 'Flair' | 'Cash Roll' | 'Misty' | `Misty ${number}` | 'Truckdriver' | 'Bigspin Flip';
/** Manuals on a skateboard, presses on a snowboard, stalls in a kayak (standing on its stern or bow): nose up first. */
export type ManualName = 'Manual' | 'Nose Manual' | 'Tail Press' | 'Nose Press' | 'Stoppie' | 'Stern Stall' | 'Bow Stall' | 'Heel Roll' | 'Toe Roll';
export type GrindName = '50-50' | 'Boardslide' | '5-0' | 'Nosegrind' | 'Feeble' | 'Smith' | 'Skinny' | 'Skinny Manual' | 'Skinny Stoppie' | SkateGrind;
/**
 * Aggressive inline grinds: frontside (both skates across the rail, in the gap between the
 * middle wheels), soul (the front skate across, the back one along the rail on its soul plate),
 * makio (one skate along it on its soul plate, the other leg up), royale (the back skate along
 * the rail on its outside, the front one turned back across behind it), unity (legs crossed,
 * both skates on their outsides).
 */
export type SkateGrind = 'Frontside' | 'Soul' | 'Makio' | 'Royale' | 'Unity';
export type LoopName = 'Loop';
/** Riding a whole rock garden on a bike without falling off. */
export type GardenName = 'Rock Garden';
type BoardTrick = 'Ollie' | 'Bunny Hop' | SkateTrick | 'Kickflip' | 'Heelflip' | 'Pop Shove-it' | '360 Flip' | 'Hardflip' | 'BS Shifty' | 'FS Shifty' | 'Tuck Knee' | BikeTrick | KayakTrick;
/**
 * Kayak air moves off a wave or a drop: a boof (the kayak's ollie, a big stroke that launches the
 * bow), an airscrew (a flat roll right round in the air), a helix (an upside-down 360), and a
 * Pan-Am (the boat thrown up past vertical and back).
 */
export type KayakTrick = 'Boof' | 'Airscrew' | 'Helix' | 'Pan-Am';
/**
 * Aggressive inline airs: a jump (the skates' ollie), a flatspin (a backflip turned on its
 * side), a misty flip (a frontflip with a 180 in it, so you land backwards) and a rocket air
 * (legs out straight in front, hands down to the skates).
 */
export type SkateTrick = 'Jump' | 'Flatspin' | 'Misty Flip' | 'Rocket Air';
/** Downhill bike: the bike thrown sideways (whip), laid flat (tabletop), or bars twisted down with the bike tucked under them (turndown). */
export type BikeTrick = 'Whip' | 'Tabletop' | 'Turndown';
/** Scooter tricks: the deck whipped round the bars, the bars spun round, or both at once. */
export type WhipName = 'Tailwhip' | 'Double Whip' | 'Heelwhip' | 'Double Heelwhip' | 'Barspin' | 'Double Barspin' | 'Tailwhip Barspin' | 'Heelwhip Barspin';
/** Paddling a kayak into a rock as you pass, so it stands up vertical against it. */
export type SplatName = 'Splat';
export type TrickName = BoardTrick | WhipName | GrabName | SpinName | SpinTotal | ComboName | FlipName | ManualName | GrindName | LoopName | GardenName | SplatName;
/** Tilt of the device: +1 nose up (manual, backflip), -1 nose down (nose manual, frontflip). */
export type Lean = -1 | 0 | 1;
export type Swipe = 'up' | 'down' | 'left' | 'right';

export interface Trick {
  name: TrickName;
  duration: number;
  points: number;
  /** Board rotation axis: 'flip' spins along the board, 'spin' around vertical. */
  axis: 'none' | 'flip' | 'spin' | 'grab' | 'body' | 'manual' | 'shifty' | 'tuck' | 'grind' | 'loop' | 'whip' | 'bike' | 'garden' | 'kayak' | 'splat' | 'skates';
  dir: 1 | -1;
  /** Shove-its: half turns the board spins round flat (+ backside, - frontside), on its own or in a flip. */
  shove?: number;
  /** Scooter whips: turns of the deck round the bars (+ tailwhip, - heelwhip), and of the bars. */
  whip?: number;
  bars?: number;
  /** Several tricks in one air put together (see combined): the tricks it's made of. */
  parts?: TrickName[];
  /** Tells this trick apart in the combo list, so a later one can take its place. */
  id?: number;
  /** Earlier tricks (by id) this one was put together from: it takes their place. */
  replaces?: number[];
}

export const TRICKS: Record<BoardTrick, Trick> = {
  'Ollie': { name: 'Ollie', duration: 0, points: 100, axis: 'none', dir: 1 },
  // A scooter's ollie: jump and pull the scooter up with the bars.
  'Bunny Hop': { name: 'Bunny Hop', duration: 0, points: 100, axis: 'none', dir: 1 },
  'Kickflip': { name: 'Kickflip', duration: 0.42, points: 500, axis: 'flip', dir: 1 },
  'Heelflip': { name: 'Heelflip', duration: 0.42, points: 500, axis: 'flip', dir: -1 },
  'Pop Shove-it': { name: 'Pop Shove-it', duration: 0.4, points: 400, axis: 'spin', dir: 1, shove: 1 },
  // A kickflip with a shove-it in it: all the way round backside (a tre flip), or half round frontside.
  '360 Flip': { name: '360 Flip', duration: 0.55, points: 1000, axis: 'flip', dir: 1, shove: 2 },
  'Hardflip': { name: 'Hardflip', duration: 0.5, points: 850, axis: 'flip', dir: 1, shove: -1 },
  // Snowboard: your feet are strapped in, so the board twists or tucks up with you.
  'BS Shifty': { name: 'BS Shifty', duration: 0.42, points: 450, axis: 'shifty', dir: -1 },
  'FS Shifty': { name: 'FS Shifty', duration: 0.42, points: 450, axis: 'shifty', dir: 1 },
  'Tuck Knee': { name: 'Tuck Knee', duration: 0.45, points: 400, axis: 'tuck', dir: 1 },
  // Downhill bike: a triple crown fork stops the bars going round, so the bike is thrown about instead.
  'Whip': { name: 'Whip', duration: 0.5, points: 450, axis: 'bike', dir: 1 },
  'Tabletop': { name: 'Tabletop', duration: 0.55, points: 500, axis: 'bike', dir: 1 },
  'Turndown': { name: 'Turndown', duration: 0.5, points: 500, axis: 'bike', dir: -1 },
  // Kayak: a boof launches you like an ollie; the rest throw the boat about in the air.
  'Boof': { name: 'Boof', duration: 0, points: 100, axis: 'none', dir: 1 },
  'Airscrew': { name: 'Airscrew', duration: 0.5, points: 500, axis: 'kayak', dir: 1 },
  'Helix': { name: 'Helix', duration: 0.6, points: 650, axis: 'kayak', dir: -1 },
  'Pan-Am': { name: 'Pan-Am', duration: 0.5, points: 550, axis: 'kayak', dir: 1 },
  // Inline skates: nothing to flip but yourself.
  'Jump': { name: 'Jump', duration: 0, points: 100, axis: 'none', dir: 1 },
  'Flatspin': { name: 'Flatspin', duration: 0.6, points: 550, axis: 'skates', dir: 1 },
  'Misty Flip': { name: 'Misty Flip', duration: 0.7, points: 650, axis: 'skates', dir: -1 },
  'Rocket Air': { name: 'Rocket Air', duration: 0.5, points: 450, axis: 'skates', dir: 1 },
};

/** Flip-side swipes while grinding: change grind. */
const SWIPE_GRIND: Record<Exclude<Swipe, 'up'>, GrindName> = {
  left: 'Boardslide',
  right: 'Nosegrind',
  down: '5-0',
};
/** On a scooter: the deck across the rail, or the back of the deck on it with the front wheel over the far side (feeble) or the near side (smith). */
const SWIPE_GRIND_SCOOTER: Record<Exclude<Swipe, 'up'>, GrindName> = {
  left: 'Boardslide',
  right: 'Feeble',
  down: 'Smith',
};
/** On inline skates: you land in a frontside; swipes turn it into the others (a diagonal down for a unity). */
const SWIPE_GRIND_SKATES: Record<Exclude<Swipe, 'up'>, GrindName> = {
  left: 'Soul',
  right: 'Royale',
  down: 'Makio',
};
/** The fancier grinds are worth more than a plain 50-50. */
const GRIND_STYLE_POINTS: Record<GrindName, number> = {
  '50-50': 1, 'Boardslide': 1.2, '5-0': 1.3, 'Nosegrind': 1.4, 'Smith': 1.3, 'Feeble': 1.4, 'Skinny': 1, 'Skinny Manual': 1.6, 'Skinny Stoppie': 1.8,
  'Frontside': 1, 'Soul': 1.3, 'Makio': 1.4, 'Royale': 1.4, 'Unity': 1.5,
};

/** Scooter: one turn of a whip, or of a barspin, takes this long. */
const WHIP_TIME = 0.45;
const BARS_TIME = 0.4;
/** A second swipe adds a turn only while there's this much of a turn still to go. */
const WHIP_ROOM = 0.25;
/** Whips by turns of the deck (+ tailwhip, - heelwhip) and of the bars. */
const WHIPS: Record<string, WhipName> = {
  '1,0': 'Tailwhip', '2,0': 'Double Whip', '-1,0': 'Heelwhip', '-2,0': 'Double Heelwhip',
  '0,1': 'Barspin', '0,2': 'Double Barspin', '1,1': 'Tailwhip Barspin', '-1,1': 'Heelwhip Barspin',
};
const WHIP_POINTS = 500, HEELWHIP_POINTS = 550, BARSPIN_POINTS = 450;
/** Two turns in one trick (a double, or a whip and a barspin together) score this much extra. */
const WHIP_DOUBLE = 1.3;

/** The trick a scooter does with these turns, or null if there isn't one. */
export function whipTrick(whip: number, bars: number): Trick | null {
  const name = WHIPS[`${whip},${bars}`];
  if (!name) return null;
  const pts = Math.abs(whip) * (whip < 0 ? HEELWHIP_POINTS : WHIP_POINTS) + bars * BARSPIN_POINTS;
  return {
    name, axis: 'whip', dir: whip < 0 ? -1 : 1, whip, bars,
    duration: Math.max(Math.abs(whip) * WHIP_TIME, bars * BARS_TIME),
    points: Math.round(pts * (Math.abs(whip) + bars > 1 ? WHIP_DOUBLE : 1) / 50) * 50,
  };
}

/** Body spins and the tricks that join up with them into one: barspins, body flips, 360 flips. */
/** A kayak's flatspins and loops stand alone. */
const KAYAK_BODY = ['Flatspin 180', 'Flatspin 360', 'Back Loop', 'Front Loop'];
const JOINS = (t: Trick) => (t.axis === 'body' && !t.parts && !KAYAK_BODY.includes(t.name)) || t.name === 'Barspin' || t.name === '360 Flip';
const isSpin = (t: Trick) => t.axis === 'body' && t.name !== 'Backflip' && t.name !== 'Frontflip';

/**
 * Tricks done one after another in the same air, put together. Spins the same way add up
 * (FS 180 + FS 180 is an FS 360); spins back the other way don't, and give null. With other
 * tricks in, it's the name riders give them together, or null if there isn't one.
 */
export function combined(parts: Trick[]): Trick | null {
  if (parts.length < 2) return null;
  const spins = parts.filter(isSpin);
  const rest = parts.filter((t) => !isSpin(t)).map((t) => t.name).sort().join('+');
  const dir = spins[0]?.dir ?? 1;
  if (!spins.length || spins.some((t) => t.dir !== dir)) return null;
  const deg = spins.reduce((d, t) => d + (t.name.endsWith('360') ? 360 : 180), 0);
  let name: TrickName | null = null;
  if (!rest) name = `${dir > 0 ? 'FS' : 'BS'} ${deg}`;
  else if (rest === 'Backflip' && deg === 180) name = 'Flair';
  else if (rest === 'Backflip' && deg === 360) name = 'Cash Roll';
  // A frontflip spun backside, 540 or more.
  else if (rest === 'Frontflip' && dir < 0 && deg === 540) name = 'Misty';
  else if (rest === 'Frontflip' && dir < 0 && deg > 540) name = `Misty ${deg}`;
  else if (rest === 'Barspin' && deg === 360) name = 'Truckdriver';
  else if (rest === '360 Flip' && deg === 180 && dir < 0) name = 'Bigspin Flip';
  if (!name) return null;
  const sum = parts.reduce((p, t) => p + t.points, 0);
  return {
    name, parts: parts.map((t) => t.name), axis: 'body', dir,
    duration: parts.reduce((d, t) => d + t.duration, 0),
    // Spins alone: 400 a half turn, plus 100 for each half turn after the first (a 360 is 900, as swiped).
    // Named tricks: a quarter more than their parts.
    points: rest ? Math.round(sum * 1.25 / 50) * 50 : (deg / 180) * 500 - 100,
  };
}

/** Flip-side swipes on a snowboard or mountain board, where flipping the board out from under you can't happen. */
const SWIPE_TRICK_SNOW: Record<Swipe, BoardTrick> = {
  up: 'Ollie',
  left: 'BS Shifty',
  right: 'FS Shifty',
  down: 'Tuck Knee',
};

/** Flip-side swipes on a downhill bike. */
const SWIPE_TRICK_BIKE: Record<Swipe, BoardTrick> = {
  up: 'Bunny Hop',
  left: 'Whip',
  right: 'Tabletop',
  down: 'Turndown',
};

/** Flip-side swipes on inline skates. */
const SWIPE_TRICK_SKATES: Record<Swipe, BoardTrick> = {
  up: 'Jump',
  left: 'Flatspin',
  right: 'Misty Flip',
  down: 'Rocket Air',
};

/** Flip-side swipes in a kayak. */
const SWIPE_TRICK_KAYAK: Record<Swipe, BoardTrick> = {
  up: 'Boof',
  left: 'Airscrew',
  right: 'Helix',
  down: 'Pan-Am',
};

/** Swipe and keep holding: grab the board until you let go. */
const SWIPE_GRAB: Record<Swipe, GrabName> = {
  up: 'Indy',
  down: 'Melon',
  left: 'Nosegrab',
  right: 'Tailgrab',
};
/** On a scooter: legs out behind you, both feet off, one leg kicked over the deck, or arms crossed. */
const SWIPE_HOLD: Record<Swipe, GrabName> = {
  up: 'Superman',
  down: 'No Footer',
  left: 'Can Can',
  right: 'X-Up',
};
/** On a downhill bike: as on a scooter, but arms out wide, hands off the bars, for the right swipe. */
const SWIPE_HOLD_BIKE: Record<Swipe, GrabName> = {
  up: 'Superman',
  down: 'No Footer',
  left: 'Can Can',
  right: 'No Hander',
};
/** On inline skates: grabs. */
const SWIPE_GRAB_SKATES: Record<Swipe, GrabName> = {
  up: 'Mute',
  down: 'Japan',
  left: 'Safety',
  right: 'Stalefish',
};
/** In a kayak, held in a hole: end moves, for as long as you hold on and stay in the hole. */
const SWIPE_HOLD_KAYAK: Record<Swipe, KayakHold> = {
  up: 'Cartwheel',
  down: 'Blunt',
  left: 'McNasty',
  right: 'Space Godzilla',
};
/** Hold this long after a grab swipe before the grab starts, so a quick flick is just an ollie. */
const GRAB_HOLD = 0.08;
const GRAB_POINTS = 250;
const GRAB_POINTS_PER_SEC = 900;

/** Body spins: a swipe across the bottom of the screen. Right is frontside. */
const SPIN_TIME = 0.42;
const SPIN_POINTS = { 180: 400, 360: 900 };
/** Body flips from tilting in the air: one full turn takes this long. */
const FLIP_TIME = 0.75;
const FLIP_POINTS = 1200;
/** On a scooter, riding backwards (after a 180) starts to wobble after this long on the ground, and you fall off at FAKIE_FALL. */
export const FAKIE_SAFE = 3, FAKIE_FALL = 10;
/** A downhill bike is even harder to ride backwards. */
export const BIKE_FAKIE_SAFE = 1.5, BIKE_FAKIE_FALL = 5;
/** Landing this far into a flip still counts; less than FLIP_SAFE is just a wobble. */
const FLIP_LAND = 0.85;
const FLIP_SAFE = 0.12;
/** How fast a kayak eases back upright in the air once the device is level. */
const KAYAK_RIGHT = 4;
/** Seconds for a kayak loop with the device tipped all the way. */
const KAYAK_LOOP_TIME = 0.6;
const MANUAL_POINTS = 100;
const MANUAL_POINTS_PER_SEC = 450;
/** Manuals only hold on gentle ground. */
const MANUAL_SLOPE = 0.45;

/**
 * Rock gardens, on a bike: each rock the front wheel rides up throws your weight forward, and
 * each one it drops off pitches you back, harder the faster you go; leaning tips the balance
 * back (tilt nose up) or forward (nose down). The balance also runs away by itself a little,
 * so you can't just leave it. Reach 1 either way and you're off: over the bars or looped out.
 */
const GARDEN_KICK = 0.22;
/** Above this speed the rocks knock you no harder, or a fast garden would be hopeless. */
const GARDEN_KICK_SPEED = 10;
const GARDEN_RUNAWAY = 1.2;
const GARDEN_BACK = 0.55;
const GARDEN_LEAN = 2.2;
/** Settling back to the middle once you're out of the rocks. */
const GARDEN_SETTLE = 4;
/** Rocks slow you down a little. */
const GARDEN_DRAG = 1.0;
/**
 * The downhill bike: big wheels and a tuck let it run away down the steep bits. Less drag
 * (so it's quicker everywhere, most of all down steep hills, where drag is what holds you
 * back) and a higher top speed.
 */
const BIKE_DRAG = 0.8;
const BIKE_TOP_SPEED = 1.12;
/**
 * The mountain board on the farm: big pneumatic tyres roll on over dirt and through mud, so it
 * keeps its speed a little better than a skateboard would there.
 */
const BOARD_FRICTION = 0.75;
const BOARD_DRAG = 1;
const BOARD_MUD = 0.75;
const BOARD_TOP_SPEED = 1;
const GARDEN_POINTS = 150, GARDEN_POINTS_PER_M = 40;
/** Where the front wheel is, ahead of the rider's point (see mtb.ts). */
const FRONT_WHEEL = 0.65;

/**
 * Kayak. A tap is a paddle stroke: it drives you on a little anywhere, and like a pump it pays
 * best down the face of a wave. Crash a landing and you capsize: tap ROLL_TAPS times within
 * ROLL_TIME to roll back up (an Eskimo roll), or you swim, and that costs a life.
 */
const KAYAK_STROKE = 0.3;
export const ROLL_TIME = 2.2, ROLL_TAPS = 3;
/** Holes slow you down while you're in them. */
const HOLE_DRAG = 1.2;
/** Drag in a hole while an end move is held: the boat is wheeling, not running. */
const END_DRAG = 4;
/**
 * A sticky hole grabs a kayak going slower than this through its trough, and holds it, surfing
 * back and forth, until enough strokes (STICKY_TAPS, and they wear off) paddle it out, or until
 * STICKY_TIME, when it flips you over.
 */
/** On a standing wave: how hard the current pulls you back to the trough (per metre away), and how fast the rocking dies away. */
/** How fast a capsized boat drifts with the current. */
const ROLL_DRIFT = 3.5;
const WAVE_PULL = 1.6, WAVE_DAMP = 0.35, WAVE_TOP = 6.5;
export const STICKY_SPEED = 7, STICKY_TAPS = 3, STICKY_TIME = 4;
const SPLAT_POINTS = 600;

const SWIPE_TRICK: Record<Swipe, keyof typeof TRICKS | null> = {
  up: 'Ollie',
  left: 'Kickflip',
  right: 'Heelflip',
  down: 'Pop Shove-it',
};

export interface RiderEvents {
  trick(t: Trick): void;
  land(info: { airTime: number; smooth: boolean; hadTricks: boolean; peakY: number }): void;
  bail(): void;
  grab?(name: GrabName): void;
  manual?(name: ManualName): void;
  grind?(rail: Rail): void;
  /** Entered a loop (done false), or came out of it (true). */
  loop?(done: boolean): void;
  pump(good: boolean): void;
  fall(): void;
  /** A kayak went over (it can still roll back up), and rolled back up. */
  capsize?(): void;
  rolled?(): void;
  /** A sticky hole caught the kayak (true), or it paddled out (false). */
  stuck?(caught: boolean): void;
}

export interface RiderOptions {
  /** Rolling friction multiplier (ice < 1). */
  friction: number;
  maxSpeed: number;
  /** Half pipe: no pushing, and airs off the lips always come back in. */
  pipe?: boolean;
  /** Snowboard: strapped-in tricks and presses instead of flips and manuals. */
  snow?: boolean;
  /** Mountain board: feet bound in, so the snowboard's swipe tricks instead of flips. */
  mountain?: boolean;
  /** Mega ramp: no pushing, and its quarter pipe rides like a half pipe wall. */
  mega?: boolean;
  /** Scooter: whips and barspins on the right, body tricks on the left, scooter grinds. */
  scooter?: boolean;
  /** Aggressive inline skates: flatspins, misty flips and rocket airs on the right, grabs on the left, skate grinds. */
  roller?: boolean;
  /** Downhill bike: whips, tabletops and turndowns on the right, body tricks on the left, rails ridden as skinnies. */
  mtb?: boolean;
  /** White water kayak: the track is a river; taps are paddle strokes, crashes capsize. */
  kayak?: boolean;
  /** Gravity, if not the usual (lower on the moon). */
  gravity?: number;
}

export class Rider {
  x = 0;
  y = 0;
  /** Speed along the ground (signed, +x is forward). */
  v = 0;
  vx = 0;
  vy = 0;
  grounded = true;
  /** Board/body pitch in radians. */
  angle = 0;
  airTime = 0;
  /** Highest point of the current or last air. */
  peakY = 0;
  timeSinceGround = 0;
  pumpTimer = 0;
  /** Time left on a pump tapped in the air, pulling you down. */
  airPump = 0;
  pushPhase = 0;
  pushing = false;
  bailTimer = 0;
  ollied = false;
  /** Counts pops off the ground or a rail, and the height popped from, for the ollie animation. */
  pops = 0;
  /** Counts bounces off jelly pads, for the boing. */
  bounces = 0;
  popY = 0;
  tricksThisAir = 0;
  /** Trick in progress: the board is spinning. */
  current: Trick | null = null;
  trickT = 0;
  /** Scooter whip in progress: turns of the deck and of the bars done so far. */
  whipT = 0;
  barsT = 0;
  /** Finger still down after a swipe, and for how long. */
  held: Swipe | null = null;
  heldT = 0;
  /** Grab in progress, and how long it has been held. */
  grab: GrabName | null = null;
  grabT = 0;
  /** Body spin in progress: direction (+1 frontside), size in degrees, and time. */
  /**
   * `turn`: the bike turning round on a pipe air (see pipeYaw), over `dur` seconds; `auto`
   * while it's the bike's own turn (no trick), until a spin swipe makes it the player's 180.
   */
  spin: { dir: 1 | -1; deg: 180 | 360; t: number; turn?: boolean; auto?: boolean; dur?: number } | null = null;
  /** Facing from completed spins (0 or PI: riding fakie), for visuals. */
  bodyYaw = 0;
  /**
   * On a bike in a pipe: which way the bike faces, turned round on each air so it rides back
   * down forwards. Only for looks; the game still reckons from bodyYaw.
   */
  pipeYaw = 0;
  /** Time spent riding backwards on a scooter (see FAKIE_SAFE). */
  fakieT = 0;
  /**
   * Tricks this air so far that the next one could join up with (see combined): all of them,
   * what they show as now (one name for the lot, or the spins added up and the rest on their own).
   */
  private chain: { tricks: Trick[]; whole: number | null; spins: number | null; rest: number[] } = { tricks: [], whole: null, spins: null, rest: [] };
  private trickId = 0;
  /** Device tilt, and whether it has been back to level since take-off. */
  lean: Lean = 0;
  private leanArmed = false;
  private manualBlocked = false;
  /** Body flip in progress (+1 backflip), and how far round it is in turns. */
  flipDir: 1 | -1 = 1;
  flipT = 0;
  flipping = false;
  /** How far the device is tipped, -1 to 1: a kayak pitches in the air at a rate that follows it. */
  tilt = 0;
  /** On a bike in a rock garden: your weight, -1 (looped out) to +1 (over the bars). */
  balance = 0;
  /** The rock garden being ridden, and where you came into it. */
  garden: { x0: number; g: { x0: number; x1: number } } | null = null;
  /** Upside down in a kayak, rolling back up: time since capsizing, and strokes so far. */
  roll: { t: number; taps: number } | null = null;
  /** Held in a sticky hole: how long, how hard you've paddled to get out, and where its trough is. */
  stuck: { t: number; push: number; x: number; hole: { x0: number; x1: number } } | null = null;
  /** Counts splats, for the animation. */
  splats = 0;
  /** Manual in progress and how long it has been held. */
  manual: ManualName | null = null;
  manualT = 0;
  /** Spin of the board from completed shove-its, kept for visuals. */
  boardYaw = 0;
  /** Smoothed values for animation. */
  crouch = 0;

  /** Grind in progress: the rail, and how long you've been on it. */
  grind: { rail: Rail; t: number; style: GrindName } | null = null;
  /** Depth: 0 on the riding line, the rail's z while grinding. */
  z = 0;
  /** Loop in progress, and how far round (radians from the bottom). */
  loop: { L: Loop; phi: number } | null = null;
  /** Fell off a loop: tumbling down inside it, landing on the ground. */
  loopFall = false;

  /** Waiting on the coping of a half pipe for a tap to drop in. */
  perched = false;
  /** Past the finish: brake to a standstill by this x, with no pushing. */
  stopAt: number | null = null;
  /** Dropping in: how far through leaning onto the wall (0 to 1), or -1. */
  dropT = -1;
  private lipX = 0;

  falling = false;
  /** The gap we last fell into. */
  fallPit: Pit | null = null;
  opts: RiderOptions = { friction: 1, maxSpeed: MAX_SPEED };
  /** Gravity for this ride. */
  get g() { return this.opts.gravity ?? GRAVITY; }
  /** Riding backwards (fakie): turned round with a spin. */
  get backwards() { return this.bodyYaw !== 0; }
  /** The downhill bike rolls faster than the rest, except in a pipe or on a mega ramp. */
  private get fastBike() { return !!this.opts.mtb && !this.opts.pipe && !this.opts.mega; }
  private get fastBoard() { return !!this.opts.mountain && !this.opts.roller && !this.opts.pipe && !this.opts.mega; }

  constructor(public track: Track, private ev: RiderEvents) {
    this.reset();
  }

  /** Put the rider back on the track at x, rolling. */
  respawn(x: number, speed: number) {
    this.x = x;
    this.y = this.track.height(x);
    this.v = speed;
    this.grounded = true;
    this.falling = false;
    this.current = null;
    this.grab = null;
    this.held = null;
    this.grind = null;
    this.loop = null;
    this.loopFall = false;
    this.z = 0;
    this.clearBody();
    this.bailTimer = 0;
    this.boardYaw = 0;
    this.angle = Math.atan(this.track.slope(x));
  }

  reset() {
    this.x = this.track.startX;
    this.y = this.track.height(this.x);
    this.v = 3;
    this.grounded = true;
    this.angle = Math.atan(this.track.slope(this.x));
    this.bailTimer = 0;
    this.current = null;
    this.grab = null;
    this.held = null;
    this.grind = null;
    this.loop = null;
    this.loopFall = false;
    this.z = 0;
    this.clearBody();
    this.boardYaw = 0;
    this.airTime = 0;
    this.pumpTimer = 0;
    this.falling = false;
    this.perched = false;
    this.dropT = -1;
    this.stopAt = null;
  }

  /** Stand on the coping of the first wall, tail on the deck, ready to drop in. */
  perch() {
    const tr = this.track;
    let x = 0;
    while (x < tr.length && tr.height(x) > tr.maxY - 0.005) x += 0.01;
    this.lipX = x;
    this.x = x + PERCH_OVER;
    this.y = tr.maxY + PERCH_OVER * Math.sin(PERCH_ANGLE);
    this.v = 0;
    this.vx = 0;
    this.vy = 0;
    this.grounded = true;
    this.angle = PERCH_ANGLE;
    this.perched = true;
  }

  /** Half pipe walls go vertical at the lips and are meant to be ridden. */
  private get wall() { return this.inPipe ? Infinity : WALL_SLOPE; }
  /** On a half pipe, or on a mega ramp's quarter pipe: walls are ridden, airs come back in. */
  get inPipe() {
    if (this.opts.pipe) return true;
    if (!this.opts.mega) return false;
    const qp = this.track.spots.find((s) => s.tag === 'qpstart');
    return !!qp && this.x >= qp.x - 0.5;
  }

  get bailing() { return this.bailTimer > 0; }
  /** 0 to 1: how wobbly riding backwards on a scooter has got. */
  get wobble() { const [safe, fall] = this.fakieTimes; return Math.max(0, Math.min(1, (this.fakieT - safe) / (fall - safe))); }
  /** How long you can ride backwards before wobbling, and before falling off. */
  private get fakieTimes() { return this.opts.mtb ? [BIKE_FAKIE_SAFE, BIKE_FAKIE_FALL] : [FAKIE_SAFE, FAKIE_FALL]; }
  get speed() { return this.grounded || this.grind || this.loop ? Math.abs(this.v) : Math.hypot(this.vx, this.vy); }

  pump() {
    // On the coping: lean forward and drop in.
    if (this.perched) { this.perched = false; this.dropT = 0; return; }
    if (this.bailing || this.dropT >= 0) return;
    // Upside down: each tap is a sweep of the paddle towards rolling back up.
    if (this.roll) { this.roll.taps++; return; }
    // Held in a sticky hole: each stroke drives you towards the far side.
    if (this.stuck) { this.stuck.push += 1; this.ev.pump(true); }
    this.pumpTimer = PUMP_TIME;
    // On the way down only: a late pump at a lip shouldn't cut the air short.
    if (!this.grounded && !this.grind && !this.loop && !this.inPipe && this.vy < 0) this.airPump = AIR_PUMP_TIME;
    if (this.grounded) {
      const s = Math.sin(Math.atan(this.track.slope(this.x))) * Math.sign(this.v || 1);
      // Downhill, or on a conveyor belt, where pumping always pushes you on.
      this.ev.pump(s < -0.08 || !!this.track.beltAt(this.x));
    }
  }

  /**
   * Swipe down and to one side: a 360 flip (left) or a hardflip (right). On a rail, a scooter,
   * or a board you're strapped into, it's just a swipe down.
   */
  comboSwipe(dir: 'left' | 'right') {
    // On skates on a rail, a diagonal down crosses your legs into a unity.
    if (this.grind && this.opts.roller) { this.setGrind('Unity'); return; }
    if (this.grind || this.opts.scooter || this.opts.mtb || this.opts.kayak || this.opts.snow || this.opts.mountain || this.opts.roller) { this.swipe('down'); return; }
    this.swipe('down', dir === 'left' ? '360 Flip' : 'Hardflip');
  }

  swipe(dir: Swipe, combo?: '360 Flip' | 'Hardflip') {
    if (this.perched || this.dropT >= 0) return;
    if (this.bailing || this.grab || this.roll) return;
    // A sticky hole won't let you boof out of it: paddle out.
    if (this.stuck) return;
    // On a rail the flip-side swipes change how you grind it (up still ollies off).
    // A bike on a skinny just rolls along it: only a hop takes it off.
    if (this.grind && dir !== 'up' && this.opts.mtb) return;
    if (this.grind && dir !== 'up') {
      this.setGrind((this.opts.roller ? SWIPE_GRIND_SKATES : this.opts.scooter ? SWIPE_GRIND_SCOOTER : SWIPE_GRIND)[dir]);
      return;
    }
    if (this.opts.scooter && dir !== 'up') { this.whipSwipe(dir); return; }
    // Off-road skates on the farm's dirt: grabs only, no flips.
    const name = combo ?? (this.opts.scooter ? 'Bunny Hop' : this.opts.roller ? (this.opts.mountain ? 'Jump' : SWIPE_TRICK_SKATES[dir]) : (this.opts.kayak ? SWIPE_TRICK_KAYAK : this.opts.mtb ? SWIPE_TRICK_BIKE : this.opts.snow || this.opts.mountain ? SWIPE_TRICK_SNOW : SWIPE_TRICK)[dir]);
    if (!name) return;
    const hop = TRICKS[name].axis === 'none';
    const canPop = this.grounded || this.grind !== null || (!this.inPipe && this.timeSinceGround < COYOTE_TIME && !this.ollied);
    if (canPop) {
      // An ollie with a rail coming up hops you straight onto it.
      if (!(hop && this.railHop())) this.pop();
      if (hop) { this.emit(TRICKS[name]); return; }
    }
    if (hop) return;
    if (this.grounded || this.current) return;
    this.current = TRICKS[name];
    this.trickT = 0;
  }

  /** Change how you're grinding the rail you're on. */
  private setGrind(style: GrindName) {
    if (!this.grind || style === this.grind.style) return;
    const rail = this.grind.rail;
    this.endGrind();
    this.grind = { rail, t: 0, style };
  }

  /**
   * Scooter, right-hand swipes: left whips the deck round (tailwhip), down the other way
   * (heelwhip), right spins the bars. Swiping again while it's still turning adds a turn:
   * a double, or a whip and a barspin at once.
   */
  private whipSwipe(dir: Exclude<Swipe, 'up'>) {
    const canPop = this.grounded || this.grind !== null || (!this.inPipe && this.timeSinceGround < COYOTE_TIME && !this.ollied);
    if (canPop) this.pop();
    if (this.grounded) return;
    const c = this.current;
    if (c && c.axis !== 'whip') return;
    const w = c?.whip ?? 0, b = c?.bars ?? 0;
    const dw = dir === 'right' ? 0 : dir === 'left' ? 1 : -1, db = dir === 'right' ? 1 : 0;
    if (dw && w && (Math.sign(w) !== dw || this.whipT > Math.abs(w) - WHIP_ROOM)) return;
    if (db && b && this.barsT > b - WHIP_ROOM) return;
    const t = whipTrick(w + dw, b + db);
    if (!t) return;
    if (!c) { this.trickT = 0; this.whipT = 0; this.barsT = 0; }
    this.current = t;
  }

  /** The trick in progress turns on; once it's all the way round it scores. */
  private advanceTrick(dt: number) {
    const c = this.current;
    if (!c) return;
    this.trickT += dt;
    if (c.axis === 'whip') {
      this.whipT = Math.min(Math.abs(c.whip ?? 0), this.whipT + dt / WHIP_TIME);
      this.barsT = Math.min(c.bars ?? 0, this.barsT + dt / BARS_TIME);
    }
    if (this.trickProgress < 1) return;
    this.boardYaw += (c.shove ?? 0) * Math.PI;
    // A misty flip has a 180 in it: you come out of it facing backwards.
    if (c.name === 'Misty Flip') this.bodyYaw = this.bodyYaw ? 0 : Math.PI;
    this.current = null;
    this.tricksThisAir++;
    this.emit(c);
  }

  private clearBody() {
    this.roll = null;
    this.stuck = null;
    this.garden = null;
    this.balance = 0;
    this.spin = null;
    this.chain = { tricks: [], whole: null, spins: null, rest: [] };
    this.bodyYaw = 0;
    this.pipeYaw = 0;
    this.fakieT = 0;
    this.flipping = false;
    this.flipT = 0;
    this.manual = null;
    this.lean = 0;
  }

  /** Swipe across the bottom of the screen: spin the body, popping first if on the ground. */
  spinSwipe(dir: 'left' | 'right') {
    if (this.perched || this.dropT >= 0) return;
    // On a bike's pipe air the turn is already under way: swiping makes it your 180.
    if (this.spin?.auto && !this.bailing) { this.spin.auto = false; this.spin.dir = dir === 'right' ? 1 : -1; return; }
    if (this.bailing || this.spin || this.roll) return;
    // Spinning out of a manual ends it: level out and tilt again for the next one,
    // or you'd land it turned round (on a bike, a stoppie the wrong way).
    if (this.manual) { this.endManual(); this.manualBlocked = this.lean !== 0; }
    // A kayak spins flat on the water, without leaving it.
    if (this.opts.kayak && this.grounded) { this.spin = { dir: dir === 'right' ? 1 : -1, deg: 180, t: 0 }; return; }
    const canPop = this.grounded || this.grind !== null || (!this.inPipe && this.timeSinceGround < COYOTE_TIME && !this.ollied);
    if (canPop) this.pop();
    if (this.grounded) return;
    this.spin = { dir: dir === 'right' ? 1 : -1, deg: 180, t: 0 };
  }

  /** The spin swipe kept going: make it a 360 if there's still time. */
  spinMore() {
    if (this.spin && !this.spin.turn && this.spin.deg === 180 && this.spin.t < SPIN_TIME * 0.7) this.spin.deg = 360;
  }

  /** 0..1 progress of the body spin. */
  get spinProgress() {
    return this.spin ? Math.min(1, this.spin.t / this.spinDuration) : 0;
  }

  private get spinDuration() {
    return this.spin?.dur ?? (this.spin && this.spin.deg === 360 ? SPIN_TIME * 1.7 : SPIN_TIME);
  }

  private finishSpin() {
    const sp = this.spin!;
    this.spin = null;
    if (sp.turn) this.pipeYaw = this.pipeYaw ? 0 : Math.PI;
    else if (sp.deg === 180) this.bodyYaw = this.bodyYaw ? 0 : Math.PI;
    if (sp.auto) return;
    this.tricksThisAir++;
    const name = (this.opts.kayak ? `Flatspin ${sp.deg}` : `${sp.dir > 0 ? 'FS' : 'BS'} ${sp.deg}`) as SpinName;
    this.emit({ name, duration: SPIN_TIME, points: SPIN_POINTS[sp.deg], axis: 'body', dir: sp.dir });
  }

  /**
   * Score a trick. One that follows on from tricks earlier in this air is put together with
   * them in their place: another 180 the same way adds to the spin, and a backflip and a 180
   * become a Flair.
   */
  private emit(t: Trick) {
    const id = ++this.trickId;
    const c = this.chain;
    if (!JOINS(t) || this.grounded && !c.tricks.length || this.grind) {
      this.chain = { tricks: [], whole: null, spins: null, rest: [] };
      this.ev.trick({ ...t, id });
      return;
    }
    const all = [...c.tricks, t];
    const named = combined(all);
    const shown = c.whole !== null ? [c.whole] : [...c.rest, ...(c.spins !== null ? [c.spins] : [])];
    if (named && !all.every(isSpin)) {
      // The whole lot has a name: one trick in place of them all.
      this.chain = { tricks: all, whole: id, spins: null, rest: [] };
      this.ev.trick({ ...named, id, replaces: shown });
      return;
    }
    const spins = all.filter(isSpin);
    const total = isSpin(t) && c.whole === null ? combined(spins) : null;
    if (total) {
      // Spinning further the same way: the spins add up, the other tricks stay as they are.
      this.chain = { tricks: all, whole: null, spins: id, rest: c.rest };
      this.ev.trick({ ...total, id, replaces: c.spins !== null ? [c.spins] : [] });
      return;
    }
    if (c.whole !== null || (isSpin(t) && spins.length > 1)) {
      // Spun back the other way, or past what the named trick can be: start again from here.
      this.chain = { tricks: [t], whole: null, spins: isSpin(t) ? id : null, rest: isSpin(t) ? [] : [id] };
    } else {
      this.chain = { tricks: all, whole: null, spins: isSpin(t) ? id : c.spins, rest: isSpin(t) ? c.rest : [...c.rest, id] };
    }
    this.ev.trick({ ...t, id });
  }

  /** Device tilt changed. */
  setLean(l: Lean, amount: number = l) {
    this.tilt = amount;
    if (l === this.lean) return;
    this.lean = l;
    if (l === 0) { this.leanArmed = true; this.manualBlocked = false; }
  }

  private endManual() {
    if (!this.manual) return;
    const name = this.manual;
    const points = this.manualPoints;
    this.manual = null;
    // Too short to count as a manual: a wobble.
    if (this.manualT < 0.25) return;
    this.emit({ name, duration: this.manualT, points, axis: 'manual', dir: 1 });
  }

  get manualPoints() {
    return this.manual ? Math.round((MANUAL_POINTS + MANUAL_POINTS_PER_SEC * this.manualT) / 10) * 10 : 0;
  }

  /** A body flip in the air: on a kayak, a loop. */
  private get flipName(): FlipName {
    return this.opts.kayak ? (this.flipDir > 0 ? 'Back Loop' : 'Front Loop') : this.flipDir > 0 ? 'Backflip' : 'Frontflip';
  }

  /** Body pitch from a flip in progress, radians (+ is nose up / backwards). */
  get flipAngle() {
    return this.flipping ? this.flipDir * this.flipT * Math.PI * 2 : 0;
  }

  private get grindSlope() {
    const r = this.grind!.rail;
    return (r.y1 - r.y0) / (r.x1 - r.x0);
  }

  /** Points the grind in progress is worth so far. */
  get grindPoints() {
    return this.grind ? Math.round((GRIND_POINTS + GRIND_POINTS_PER_SEC * this.grind.t) * GRIND_STYLE_POINTS[this.grind.style] / 10) * 10 : 0;
  }

  /** Riding round a loop: gravity along the curve, and fall off the top if too slow. */
  private stepLoop(dt: number) {
    const lp = this.loop!, L = lp.L;
    this.v -= (this.g * Math.sin(lp.phi) + LOOP_FRICTION * this.opts.friction + AIR_DRAG * this.v * this.v) * dt;
    lp.phi += (this.v / L.r) * dt;
    this.x = L.x + L.r * Math.sin(lp.phi);
    this.y = L.y + L.r - L.r * Math.cos(lp.phi);
    this.angle = lp.phi;
    // The loop drifts back on the track as it goes round, so the exit clears the entry.
    this.z = -LOOP_SHIFT * Math.min(1, lp.phi / (Math.PI * 2));
    if (lp.phi >= Math.PI * 2) {
      // Round! Back on the flat, past the entry.
      this.loop = null;
      this.x = L.x + 0.02;
      this.y = this.track.height(this.x);
      this.angle = 0;
      this.grounded = true;
      this.ev.loop?.(true);
      this.emit({ name: 'Loop', duration: 0, points: LOOP_POINTS, axis: 'loop', dir: 1 });
      return;
    }
    // Too slow to stay on (the curve can't hold you up), or rolling back: you fall off.
    if (this.v * this.v / L.r < -this.g * Math.cos(lp.phi) || this.v <= 0) {
      this.loop = null;
      this.vx = this.v * Math.cos(lp.phi);
      this.vy = this.v * Math.sin(lp.phi);
      this.grounded = false;
      this.loopFall = true;
      this.falling = true;
      // Pick up past the loop, as you would past a gap.
      this.fallPit = { x0: L.x, x1: L.x, lipY: L.y, landY: L.y, floorY: L.y };
      this.current = null;
      this.grab = null;
      this.spin = null;
      this.flipping = false;
      this.ev.fall();
    }
  }

  private endGrind() {
    if (!this.grind) return;
    const points = this.grindPoints, t = this.grind.t, style = this.grind.style;
    this.grind = null;
    // Barely touched it: no grind.
    if (t < 0.12) return;
    this.emit({ name: style, duration: t, points, axis: 'grind', dir: 1 });
  }

  /** Come down onto a rail: lock into a grind, finishing any trick that's nearly done. */
  private catchRail(rail: Rail) {
    const almost = (!this.current || this.trickProgress >= 0.8)
      && (!this.spin || this.spinProgress >= 0.8) && !this.grab && !this.flipping;
    // Mid-trick you can't stand on it: you pass by the rail instead.
    if (!almost) return;
    this.chain = { tricks: [], whole: null, spins: null, rest: [] };
    // A flip or spin that's nearly round finishes on the rail (see the grind step).
    const th = Math.atan((rail.y1 - rail.y0) / (rail.x1 - rail.x0));
    const dir = Math.sign(this.vx) || 1;
    // Keep your forward speed, like a clean landing.
    this.v = dir * Math.max((this.vx * Math.cos(th) + this.vy * Math.sin(th)) * dir, Math.abs(this.vx) * LAND_KEEP);
    this.y = railY(rail, this.x);
    this.angle = th;
    this.held = null;
    this.ollied = false;
    this.grind = { rail, t: 0, style: this.opts.mtb ? 'Skinny' : this.opts.roller ? 'Frontside' : '50-50' };
    this.ev.grind?.(rail);
  }

  /** Swipe on the grab side of the screen: pop if on the ground, then grab while held. */
  grabSwipe(dir: Swipe) {
    if (this.perched || this.dropT >= 0) return;
    if (this.bailing || this.grab || this.roll) return;
    this.held = dir;
    this.heldT = 0;
    // A kayak's end moves happen on the water, in a hole: no pop.
    if (this.opts.kayak) return;
    const canPop = this.grounded || this.grind !== null || (!this.inPipe && this.timeSinceGround < COYOTE_TIME && !this.ollied);
    if (canPop) this.pop();
  }

  /** Finger lifted: let go of any grab and score it. */
  release() {
    this.held = null;
    if (!this.grab) return;
    const name = this.grab;
    const points = Math.round((GRAB_POINTS + GRAB_POINTS_PER_SEC * this.grabT) / 10) * 10;
    this.grab = null;
    this.tricksThisAir++;
    this.emit({ name, duration: this.grabT, points, axis: 'grab', dir: 1 });
  }

  /** Points the grab in progress is worth so far. */
  get grabPoints() {
    return this.grab ? Math.round((GRAB_POINTS + GRAB_POINTS_PER_SEC * this.grabT) / 10) * 10 : 0;
  }

  /**
   * Rail assist: by the time you've seen a rail, swiped and flown a full ollie, you'd only
   * catch its very end. So an ollie on the ground with a rail starting within RAIL_REACH
   * seconds ahead (or one alongside with room left) is a short, quick hop that comes down
   * onto the rail near its start. Returns false if there's no rail to hop onto.
   */
  private railHop(): boolean {
    if (!this.grounded || this.inPipe || this.v < 2) return false;
    const rail = this.track.rails.find((r) => r.x0 - this.x < this.v * RAIL_REACH && this.x < r.x1 - RAIL_ROOM);
    if (!rail) return false;
    const y0 = this.y;
    // Come down a little way along the rail, or a quick hop ahead if you're already beside it:
    // the first spot far enough on that you'd be on your way down when you get there.
    let xt = Math.max(rail.x0 + 0.4, this.x + this.v * 0.2);
    const T = () => (xt - this.x) / this.v;
    while (xt < rail.x1 - RAIL_ROOM && railY(rail, xt) - y0 > this.g * T() * T() / 2 * 0.7) xt += 0.1;
    if (xt >= rail.x1 - RAIL_ROOM) return false;
    const t = T();
    this.vx = this.v;
    this.vy = (railY(rail, xt) - y0 + this.g * t * t / 2) / t;
    this.popY = this.y;
    this.pops++;
    this.y += 0.02;
    this.leaveGround();
    this.ollied = true;
    return true;
  }

  private pop() {
    if (this.grind) {
      // Ollie off the rail.
      const th = Math.atan(this.grindSlope);
      this.vx = this.v * Math.cos(th);
      this.vy = this.v * Math.sin(th) + OLLIE_POP;
      this.popY = this.y;
      this.pops++;
      this.y += 0.02;
      this.endGrind();
      this.leaveGround();
    } else if (this.grounded && this.inPipe && Math.abs(this.track.slope(this.x)) > 0.6) {
      // On a steep wall an ollie would throw you off it: give a kick up the wall instead.
      this.v += Math.sign(this.v || 1) * 1.5;
    } else if (this.grounded) {
      const th = Math.atan(this.track.slope(this.x));
      // Pop straight up: tipping the pop back off a kicker face would stall you mid-jump.
      this.vx = this.v * Math.cos(th);
      this.vy = this.v * Math.sin(th) + OLLIE_POP * Math.cos(th);
      this.popY = this.y;
      this.pops++;
      this.y += 0.02;
      this.leaveGround();
    } else {
      this.vy = Math.max(this.vy, 0) + OLLIE_POP * 0.85;
    }
    this.ollied = true;
  }

  private leaveGround() {
    this.grounded = false;
    this.airTime = 0;
    this.peakY = this.y;
    // (Only off a near-vertical wall: a mega ramp's kicker is ridden in pipe mode too.)
    if (this.inPipe && Math.abs(this.vx) < Math.abs(this.vy) * 0.5) {
      // Cap pipe airs at about 3 m over the lip so the camera can keep you in view.
      this.vy = Math.min(this.vy, 8.5);
      // Going up past a lip: drift back over the ramp so you land on the wall.
      this.vx = -Math.sign(this.vx) * 0.35;
      // A bike turns round in the air by itself, to ride back down facing forwards: done by
      // the top of the air, so even a little air lands it.
      if (this.opts.mtb && this.dropT < 0 && !this.spin && (this.v > 0 ? Math.PI : 0) !== this.pipeYaw) this.spin = { dir: this.pipeYaw ? -1 : 1, deg: 180, t: 0, turn: true, auto: true, dur: Math.max(0.15, Math.min(SPIN_TIME, this.vy / this.g * 0.9)) };
    }
    this.tricksThisAir = 0;
    this.chain = { tricks: [], whole: null, spins: null, rest: [] };
    this.airPump = 0;
    this.endManual();
    // An end move in a hole is done once the boat leaves the water.
    if (this.opts.kayak && this.grab) this.release();
    // A tilt held through take-off doesn't flip you: level out, then tilt.
    this.leanArmed = this.lean === 0;
  }

  update(dt: number) {
    const steps = Math.ceil(dt / (1 / 240));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) this.step(h);
  }

  private step(dt: number) {
    const tr = this.track;
    if (this.perched) return;
    if (this.dropT >= 0) { this.stepDropIn(dt); return; }
    // The bike's turn on a pipe air is always done by the time it's back on the wall.
    if (this.spin?.turn && (this.grounded || this.grind)) this.finishSpin();
    this.pumpTimer = Math.max(0, this.pumpTimer - dt);

    if (this.bailTimer > 0) {
      this.bailTimer -= dt;
      if (this.bailTimer <= 0) {
        this.bailTimer = 0;
        this.boardYaw = 0;
      }
    }

    // A scooter only really goes forwards: ride it backwards and it gets wobblier and wobblier
    // until you fall off, unless you spin a 180 to face forwards again.
    if (!this.bodyYaw || !(this.opts.scooter || this.opts.mtb || this.opts.roller)) this.fakieT = 0;
    else if (!this.bailing && (this.grounded || this.grind)) {
      this.fakieT += dt;
      if (this.fakieT >= this.fakieTimes[1] && this.grounded && !this.loop) {
        this.bodyYaw = 0;
        this.fakieT = 0;
        this.manual = null;
        this.v *= 0.35;
        this.bailTimer = BAIL_TIME;
        this.ev.bail();
      }
    }

    if (this.roll) this.stepRoll(dt);

    if (this.falling) {
      // Tumbling into a pit: no collisions until respawn.
      if (this.grounded) { this.vx = this.v * 0.5; this.vy = 0; this.grounded = false; }
      this.vy -= this.g * dt;
      this.x += this.vx * 0.5 * dt;
      this.y += this.vy * dt;
      this.angle -= dt * 3;
      // Off a loop there's ground to land on: lie there until the respawn.
      if (this.loopFall && this.y < tr.height(this.x)) { this.y = tr.height(this.x); this.vx = 0; this.vy = 0; }
      return;
    }

    if (this.loop) { this.stepLoop(dt); return; }
    this.z += ((this.grind ? this.grind.rail.z : 0) - this.z) * Math.min(1, dt * 14);

    if (this.grind) {
      const rail = this.grind.rail;
      const th = Math.atan(this.grindSlope);
      const dir = Math.sign(this.v) || 1;
      this.timeSinceGround = 0;
      this.v += (-this.g * Math.sin(th) - dir * (GRIND_FRICTION * this.opts.friction + AIR_DRAG * this.v * this.v)) * dt;
      this.x += this.v * Math.cos(th) * dt;
      this.grind.t += dt;
      // A manual or stoppie along a skinny is worth more, for the whole of it.
      if (this.opts.mtb && this.lean && this.grind.style === 'Skinny') this.grind.style = this.lean > 0 ? 'Skinny Manual' : 'Skinny Stoppie';
      this.angle = th;
      this.advanceTrick(dt);
      if (this.spin) {
        this.spin.t += dt;
        if (this.spin.t >= this.spinDuration) this.finishSpin();
      }
      if (this.x > rail.x1 || this.x < rail.x0 || Math.abs(this.v) < 1) {
        // Off the end of the rail (or stalled on it): drop off and fly on.
        this.y = railY(rail, Math.max(rail.x0, Math.min(rail.x1, this.x)));
        this.vx = this.v * Math.cos(th);
        this.vy = this.v * Math.sin(th);
        this.endGrind();
        this.leaveGround();
        this.ollied = false;
      } else {
        this.y = railY(rail, this.x);
      }
      return;
    }

    if (this.grounded) {
      this.timeSinceGround = 0;
      const k = tr.slope(this.x);
      // Tilted on gentle ground: balance on two wheels.
      // Too slow and you'd stall without pushing, so it drops back onto four wheels.
      // Once it drops, level out before the next one, so it can't flicker on and off.
      // On a bike the tilt is your balance in a rock garden, not a manual.
      if (this.opts.mtb) this.stepGarden(dt);
      if (this.opts.kayak && this.stepWater(dt)) return;
      const want: ManualName | null = this.lean && !this.garden && !this.roll && !this.manualBlocked && !this.bailing && Math.abs(k) < MANUAL_SLOPE && (this.opts.pipe || Math.abs(this.v) > MIN_PUSH_SPEED * 0.8)
        ? (this.lean > 0 ? (this.opts.snow ? 'Tail Press' : this.opts.kayak ? 'Stern Stall' : this.opts.roller ? 'Heel Roll' : 'Manual') : (this.opts.snow ? 'Nose Press' : this.opts.mtb ? 'Stoppie' : this.opts.kayak ? 'Bow Stall' : this.opts.roller ? 'Toe Roll' : 'Nose Manual')) : null;
      if (want !== this.manual) {
        if (this.manual && this.lean) this.manualBlocked = true;
        this.endManual();
        if (want) { this.manual = want; this.manualT = 0; this.ev.manual?.(want); }
      }
      if (this.manual) this.manualT += dt;
      // A kayak's flatspin turns on the water.
      if (this.opts.kayak && this.spin) {
        this.spin.t += dt;
        if (this.spin.t >= this.spinDuration) this.finishSpin();
      }
      // A jelly pad: boing.
      const pad = !this.bailing && !this.inPipe ? tr.bouncerAt(this.x) : null;
      if (pad && Math.abs(this.v) > 1) {
        this.vx = this.v;
        this.vy = pad.lift * (this.pumpTimer > 0 ? PUMP_BOUNCE : 1);
        this.popY = this.y;
        this.bounces++;
        this.y += 0.02;
        this.leaveGround();
        this.ollied = false;
        return;
      }
      const th = Math.atan(k);
      const sin = Math.sin(th), cos = Math.cos(th);
      const dir = Math.sign(this.v) || 1;

      let a = -this.g * sin;
      a -= dir * (ROLL_FRICTION * this.opts.friction * (this.fastBoard ? BOARD_FRICTION : 1) + AIR_DRAG * (this.fastBike ? BIKE_DRAG : this.fastBoard ? BOARD_DRAG : 1) * this.v * this.v);
      if (tr.inMud(this.x)) a -= dir * (MUD_DRAG + MUD_DRAG_PER_SPEED * Math.abs(this.v)) * (this.fastBoard ? BOARD_MUD : 1);
      if (this.garden) a -= dir * GARDEN_DRAG;
      // An end move digs the boat into the hole's foam and holds it back.
      if (this.opts.kayak && tr.holeAt(this.x)) a -= dir * (this.grab ? END_DRAG : HOLE_DRAG);
      const belt = !this.inPipe ? tr.beltAt(this.x) : null;
      if (belt && belt.speed > this.v) a += Math.min(BELT_PUSH, BELT_GRIP * (belt.speed - this.v));
      else if (belt && belt.speed < 0 && this.v > BELT_CRAWL) a -= BELT_DRAG;

      if (this.pumpTimer > 0 && !this.bailing) {
        // Pumping pays off on the way down a transition and costs a little on the way up.
        const downhill = -sin * dir;
        let f = Math.max(-0.12, Math.min(1, downhill * 3));
        if (belt) f = Math.max(f, BELT_PUMP);
        // Half pipe: pumping through the flat bottom counts too, so it's easy to build height.
        if (this.opts.pipe) f = Math.max(f, Math.abs(sin) < 0.3 ? 0.8 : 0.25);
        // A paddle stroke drives a kayak on anywhere, a little.
        if (this.opts.kayak && !this.roll) f = Math.max(f, KAYAK_STROKE);
        a += dir * PUMP_ACCEL * f;
      }

      // Auto push on flat ground when slow, so you never get stuck.
      this.pushing = false;
      // Past the finish: brake hard enough to stop by stopAt, gently if there's room.
      const braking = this.stopAt !== null && !this.bailing && this.v >= 0;
      if (braking) a -= Math.min(8, Math.max(1.5, this.v * this.v / (2 * Math.max(0.5, this.stopAt! - this.x))));
      if (!braking && !this.bailing && !this.manual && !this.roll && !this.opts.pipe && !this.opts.mega && this.v < MIN_PUSH_SPEED) {
        a += 4 + this.g * Math.max(0, sin);
        this.pushing = true;
      }

      this.v += a * dt;
      const top = this.opts.maxSpeed * (this.fastBike ? BIKE_TOP_SPEED : this.fastBoard ? BOARD_TOP_SPEED : 1);
      this.v = Math.max(-top, Math.min(top, this.v));
      if (braking && this.v < 0) this.v = 0;

      // The ground falls away faster than gravity can hold us: take off.
      const kappa = -tr.curvature(this.x) / Math.pow(1 + k * k, 1.5);
      // Leave along the face we were riding, not the drop ahead of it.
      const behind = tr.slope(this.x - Math.sign(this.v) * 0.15);
      const face = Math.atan(Math.abs(behind) > this.wall ? k : behind);
      const lookX = this.x + this.v * Math.cos(face) * dt * 3;
      const cliff = tr.height(lookX) < this.y + Math.tan(face) * (lookX - this.x) - 0.15;
      // A hole is water, not a ramp: the boat runs down into it and through the foam pile
      // without taking off (a standing wave's crest still throws you).
      const inHole = tr.holeAt(this.x) ?? tr.holeAt(lookX);
      const pinned = this.opts.kayak && !!inHole && !inHole.wave;
      if (!pinned && ((cliff && Math.abs(this.v) > 1) || (kappa > 0 && this.v * this.v * kappa > this.g * cos * STICK && (this.inPipe || Math.abs(this.v) > 4)))) {
        this.vx = this.v * Math.cos(face);
        this.vy = this.v * Math.sin(face);
        if (this.pumpTimer > 0) this.vy += 1.2; // pumping into a lip pops you a little higher
        this.leaveGround();
        this.ollied = false;
        return;
      }

      const before = this.x;
      this.x += this.v * cos * dt;
      this.y = tr.height(this.x);
      this.angle = th;
      // Rolled into a loop: ride round it.
      const L = this.v > 0 && !this.bailing ? tr.loops.find((l) => before < l.x && this.x >= l.x) : undefined;
      if (L) {
        this.endManual();
        this.manual = null;
        this.x = L.x;
        this.loop = { L, phi: 0 };
        this.grounded = false;
        this.ev.loop?.(false);
        return;
      }
      const lip = this.opts.pipe ? null : tr.spots.find((s) => s.tag === 'qp');
      if (this.inPipe && !this.opts.kayak && (lip ? this.x >= lip.x : this.y >= tr.maxY - 1e-3) && Math.abs(k) < 0.05) {
        // Never ride out onto the deck of a half pipe: turn back at the lip.
        this.x -= this.v * cos * dt * 2;
        this.y = tr.height(this.x);
        this.v = -this.v * 0.5;
      }
    } else {
      this.timeSinceGround += dt;
      this.airTime += dt;
      const px = this.x, py = this.y;
      this.vy -= this.g * dt;
      if (this.airPump > 0) { this.vy -= AIR_PUMP_ACCEL * dt; this.airPump -= dt; }
      this.vx -= Math.sign(this.vx) * AIR_DRAG * this.vx * this.vx * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      this.peakY = Math.max(this.peakY, this.y);
      // Visual pitch drifts towards the flight path so landings line up.
      const target = Math.max(-0.9, Math.min(0.9, Math.atan2(this.vy, Math.abs(this.vx)) * 0.75)) * Math.sign(this.vx || 1);
      if (!this.inPipe) this.angle += (target - this.angle) * Math.min(1, dt * 3);

      if (this.held && !this.opts.kayak) {
        this.heldT += dt;
        // Grab once the board is free of any flip and the finger has stayed down.
        if (!this.grab && !this.current && this.heldT >= GRAB_HOLD) {
          this.grab = (this.opts.mtb ? SWIPE_HOLD_BIKE : this.opts.scooter ? SWIPE_HOLD : this.opts.roller ? SWIPE_GRAB_SKATES : SWIPE_GRAB)[this.held];
          this.grabT = 0;
          this.ev.grab?.(this.grab);
        }
      }
      if (this.grab) this.grabT += dt;

      if (this.spin) {
        this.spin.t += dt;
        if (this.spin.t >= this.spinDuration) this.finishSpin();
      }

      // A kayak in the air pitches as fast as the device is tipped: a little tilt noses it
      // down for the landing, a big one throws a loop, and the other way brings it back.
      // Level the device and it eases back to the nearest upright.
      if (this.opts.kayak && !this.bailing) {
        const a = this.leanArmed ? this.tilt : 0;
        if (!this.flipping && Math.abs(a) > 0.02) { this.flipping = true; this.flipDir = a > 0 ? 1 : -1; this.flipT = 0; }
        if (this.flipping) {
          if (Math.abs(a) > 0.02) this.flipT += (a * this.flipDir * dt) / KAYAK_LOOP_TIME;
          else this.flipT += ((this.flipT < 0.5 ? -0.01 : 1.01) - this.flipT) * Math.min(1, dt * KAYAK_RIGHT);
          if (this.flipT >= 1) {
            this.tricksThisAir++;
            this.emit({ name: this.flipName, duration: FLIP_TIME, points: FLIP_POINTS, axis: 'body', dir: this.flipDir });
            this.flipT -= 1;
          }
          if (this.flipT <= 0) { this.flipping = false; this.flipT = 0; }
        }
      }
      // Tilt in the air: flip the whole body. Each full turn scores; keep tilting for more.
      if (!this.opts.kayak && !this.flipping && this.lean && this.leanArmed && !this.bailing) {
        this.flipping = true;
        this.flipDir = this.lean;
        this.flipT = 0;
      }
      if (this.flipping && !this.opts.kayak) {
        this.flipT += dt / FLIP_TIME;
        if (this.flipT >= 1) {
          this.tricksThisAir++;
          this.emit({ name: this.flipName, duration: FLIP_TIME, points: FLIP_POINTS, axis: 'body', dir: this.flipDir });
          if (this.lean === this.flipDir) this.flipT -= 1;
          else { this.flipping = false; this.flipT = 0; }
        }
      }

      this.advanceTrick(dt);

      // Coming down onto a rail: grind it.
      // Only with some rail left ahead: catching the very end would just flick you on and off.
      const ahead = (rl: Rail) => (this.vx >= 0 ? rl.x1 - this.x : this.x - rl.x0) > 0.6;
      const rail = this.vy < 0 && !this.falling ? tr.railAt(this.x) : null;
      if (rail && ahead(rail) && py >= railY(rail, px) - 0.05 && this.y <= railY(rail, this.x) + GRIND_CATCH && this.y > tr.height(this.x)) {
        this.catchRail(rail);
        if (this.grind) return;
      }

      const gy = tr.height(this.x);
      const k = tr.slope(this.x);
      // Over the top of a drop or a gap edge: the ground is falling away, so keep flying.
      // Landing here would use the wall's slope and kill (or reverse) the speed.
      const overEdge = k * Math.sign(this.vx || 1) < -this.wall && gy - this.y < 0.4;
      if (this.y <= gy && !overEdge) {
        if (!this.inPipe && this.airTime < TAKEOFF_TIME && gy - this.y < 0.4) {
          // Just left the lip and still skimming it: slide along it rather than "landing"
          // on the edge, which would read the drop's slope and throw the speed away.
          this.y = gy;
        } else if (gy - this.y > 0.4) {
          // Hit the face of a ledge: bounce off it.
          this.x -= this.vx * dt * 1.5;
          this.vx = -this.vx * 0.05;
          this.vy = Math.min(this.vy, 0);
        } else {
          // Clipping the top corner of a rising wall lands on the flat beyond it,
          // not on the wall, where you would crawl to a stop.
          const dir = Math.sign(this.vx || 1);
          for (let d = 0; d < 0.4 && Math.abs(tr.slope(this.x)) > this.wall; d += 0.02) this.x += dir * 0.02;
          this.land(tr.height(this.x), Math.atan(tr.slope(this.x)));
        }
      }
    }

    const pit = tr.pitAt(this.x);
    // Too slow to clear a gap: you drop in rather than rocking on the lip.
    const slowAtLip = pit && this.grounded && this.x > pit.x0 - 0.8 && this.x < pit.x0 && this.v < 6;
    if (pit && !this.falling && (slowAtLip || this.y < Math.min(pit.lipY, pit.landY) - 1.6)) {
      this.falling = true;
      this.fallPit = pit;
      this.current = null;
      this.grab = null;
      this.spin = null;
      this.flipping = false;
      this.manual = null;
      this.grind = null;
      this.ev.fall();
    }

    if (this.x < 0.5) { this.x = 0.5; this.v = Math.abs(this.v) * 0.3; this.vx = Math.abs(this.vx) * 0.3; }
  }

  private land(gy: number, th: number) {
    const tang = this.vx * Math.cos(th) + this.vy * Math.sin(th);
    // Angle between the flight line and the ground, ignoring direction.
    const flight = Math.abs(this.vx) < 1e-3 ? Math.PI / 2 : Math.atan(this.vy / this.vx);
    const diff = Math.abs(flight - th);
    this.y = gy;
    this.grounded = true;
    this.angle = th;
    this.held = null;
    this.airPump = 0;

    const midTrick = this.current !== null && this.trickProgress < 0.8;
    // Still holding the board when you touch down: you can't stand on it.
    const grabbing = this.grab !== null;
    this.grab = null;
    const midSpin = this.spin !== null && !this.spin.turn && this.spinProgress < 0.8;
    // Upside down or partway round a flip: no way to land that.
    const midFlip = this.flipping && this.flipT > FLIP_SAFE && this.flipT < FLIP_LAND;
    if (this.flipping && this.flipT >= FLIP_LAND) {
      this.tricksThisAir++;
      this.emit({ name: this.flipName, duration: FLIP_TIME, points: FLIP_POINTS, axis: 'body', dir: this.flipDir });
    }
    this.flipping = false;
    this.flipT = 0;
    if (this.spin && !midSpin) this.finishSpin();
    this.spin = null;
    if (grabbing || midTrick || midSpin || midFlip || (diff > 1.3 && this.airTime > 0.2 && Math.hypot(this.vx, this.vy) > 7)) {
      this.current = null;
      this.bodyYaw = 0;
      this.v = tang * 0.35;
      // In a kayak you go over, and get a moment to roll back up.
      if (this.opts.kayak) { this.capsize(); return; }
      this.bailTimer = BAIL_TIME;
      this.chain = { tricks: [], whole: null, spins: null, rest: [] };
      this.ev.bail();
      return;
    }
    if (this.current) {
      // Close enough: count it.
      const done = this.current;
      this.boardYaw += (done.shove ?? 0) * Math.PI;
      if (done.name === 'Misty Flip') this.bodyYaw = this.bodyYaw ? 0 : Math.PI;
      this.current = null;
      this.tricksThisAir++;
      this.emit(done);
    }
    const smooth = diff < 0.3 && this.airTime > 0.35;
    // Arcade landing: coming down onto an upslope (the back of a roller, a kicker) would
    // shed most of the speed and feel like hitting a wall, so keep most of the forward speed.
    const dir = Math.sign(this.vx) || 1;
    const kept = Math.max(tang * dir, Math.abs(this.vx) * LAND_KEEP);
    this.v = dir * kept * (smooth ? 1.04 : 1);
    this.ev.land({ airTime: this.airTime, smooth, hadTricks: this.tricksThisAir > 0 || this.ollied, peakY: this.peakY });
    this.chain = { tricks: [], whole: null, spins: null, rest: [] };
    this.ollied = false;
  }

  /** Over you go: upside down in the water, with ROLL_TIME to roll back up. */
  private capsize() {
    this.roll = { t: 0, taps: 0 };
    this.stuck = null;
    this.grab = null;
    this.held = null;
    this.spin = null;
    this.flipping = false;
    this.endManual();
    this.manual = null;
    this.current = null;
    this.ev.capsize?.();
  }

  private stepRoll(dt: number) {
    const roll = this.roll!;
    roll.t += dt;
    // Upside down you just drift with the current, no faster than it flows.
    if (this.v > ROLL_DRIFT) this.v = Math.max(ROLL_DRIFT, this.v - 6 * dt);
    if (roll.taps >= ROLL_TAPS) {
      // Back up! You keep going, a bit slower.
      this.roll = null;
      this.v *= 0.8;
      this.ev.rolled?.();
    } else if (roll.t >= ROLL_TIME) {
      // Couldn't roll up: out of the boat for a swim.
      this.roll = null;
      this.v *= 0.4;
      this.bodyYaw = 0;
      this.bailTimer = BAIL_TIME;
      this.ev.bail();
    }
  }

  /**
   * A kayak on the water, each step: end moves held in a hole, sticky holes, and rocks to splat.
   * Returns true when a sticky hole has the boat and has moved it itself.
   */
  private stepWater(dt: number): boolean {
    const tr = this.track;
    const hole = tr.holeAt(this.x);
    // A swipe held on the left in a hole is an end move, for as long as you hold on in there.
    if (this.held && !this.bailing && !this.roll) this.heldT += dt;
    if (this.held && hole && !this.grab && !this.current && !this.roll && !this.bailing && this.heldT >= GRAB_HOLD) {
      this.grab = SWIPE_HOLD_KAYAK[this.held];
      this.grabT = 0;
      this.ev.grab?.(this.grab);
    }
    if (this.grab && !hole && !this.stuck) { this.held = null; this.release(); }
    if (this.grab) this.grabT += dt;
    // On a standing wave the current holds you on the face: drift up it and the water pushes
    // you back down; ride down into the trough and the wave pulls you back. Strokes build the
    // rocking, and an end move holds you in the trough, wheeling on the spot.
    const wh = this.opts.pipe ? tr.holes.find((h) => h.wave) : undefined;
    if (wh?.wave && !this.roll) {
      const d = this.x - wh.wave.trough;
      // Over the crest or up onto the tongue, the water shoves you back hard.
      const out = Math.max(0, this.x - (wh.x1 - 1.5), wh.wave.crest + 0.5 - this.x);
      this.v += (-d * WAVE_PULL - Math.sign(d) * out * 8 - this.v * (this.grab ? 3 : WAVE_DAMP)) * dt;
      this.v = Math.max(-WAVE_TOP, Math.min(WAVE_TOP, this.v));
    }
    // Paddle into a rock as you reach it: splat!
    const ahead = this.x + this.v * dt;
    if (this.pumpTimer > 0 && !this.roll && !this.bailing && this.v > 0) {
      for (const s of tr.splats) {
        if (this.x < s.x && ahead >= s.x) {
          this.splats++;
          this.emit({ name: 'Splat', duration: 0.6, points: SPLAT_POINTS, axis: 'splat', dir: 1 });
        }
      }
    }
    // A sticky hole: going too slowly through its trough, it holds you.
    if (!this.stuck && hole?.sticky && !this.roll && !this.bailing && this.v < STICKY_SPEED && this.v > -1) {
      const u = (this.x - hole.x0) / (hole.x1 - hole.x0);
      if (u > 0.2 && u < 0.5) {
        this.stuck = { t: 0, push: 0, x: hole.x0 + (hole.x1 - hole.x0) * 0.35, hole };
        this.endManual();
        this.manual = null;
        this.ev.stuck?.(true);
      }
    }
    const st = this.stuck;
    if (!st) return false;
    st.t += dt;
    st.push = Math.max(0, st.push - dt * 0.6);
    const h = st.hole;
    if (st.push >= STICKY_TAPS) {
      // Paddled out over the foam pile.
      this.stuck = null;
      this.x = h.x1 + 0.1;
      this.y = tr.height(this.x);
      this.v = 6;
      this.ev.stuck?.(false);
      return true;
    }
    if (st.t >= STICKY_TIME) {
      // Held too long: it flips you over and flushes you out.
      this.stuck = null;
      if (this.grab) { this.held = null; this.release(); }
      this.x = h.x1 + 0.1;
      this.y = tr.height(this.x);
      this.v = 4;
      this.capsize();
      return true;
    }
    // Surfing back and forth in the trough, pushed further up the pile by each stroke.
    const back = st.x + 0.5 * Math.sin(st.t * 4.5) + st.push * 0.4;
    this.v = (back - this.x) / dt;
    this.x = back;
    this.y = tr.height(this.x);
    this.angle = Math.atan(tr.slope(this.x));
    if (this.spin) {
      this.spin.t += dt;
      if (this.spin.t >= this.spinDuration) this.finishSpin();
    }
    return true;
  }

  /** A rock garden on a bike: rocks knock your balance about, tilting puts it back. */
  private stepGarden(dt: number) {
    const tr = this.track;
    const g = this.bailing ? null : tr.gardenAt(this.x);
    if (g && !this.garden) { this.garden = { x0: this.x, g }; this.balance = 0; }
    if (!g) {
      if (this.garden && !this.bailing) {
        // Out the other side: points for every metre ridden.
        const m = Math.max(0, this.x - this.garden.x0);
        if (m > 2) this.emit({ name: 'Rock Garden', duration: m / Math.max(1, Math.abs(this.v)), points: Math.round((GARDEN_POINTS + GARDEN_POINTS_PER_M * m) / 10) * 10, axis: 'garden', dir: 1 });
      }
      this.garden = null;
      this.balance *= Math.exp(-dt * GARDEN_SETTLE);
      return;
    }
    // The front wheel climbing a rock face throws you forward, dropping off one pitches you back.
    const fx = this.x + FRONT_WHEEL * Math.sign(this.v || 1);
    const rise = (tr.rough(fx + 0.05) - tr.rough(fx - 0.05)) / 0.1;
    // (Climbing a rock stops the front wheel hard; dropping off one is gentler.)
    const kick = rise > 0 ? rise : rise * GARDEN_BACK;
    this.balance += (GARDEN_KICK * kick * Math.min(Math.abs(this.v), GARDEN_KICK_SPEED) + GARDEN_RUNAWAY * this.balance - GARDEN_LEAN * this.lean) * dt;
    if (Math.abs(this.balance) >= 1) {
      // Over the bars, or looped out off the back.
      this.garden = null;
      this.manual = null;
      this.v *= 0.3;
      this.bailTimer = BAIL_TIME;
      this.ev.bail();
    }
  }

  /** Tip the nose down onto the wall, then roll away down it. */
  private stepDropIn(dt: number) {
    const tr = this.track;
    this.dropT = Math.min(1, this.dropT + dt / DROP_TIME);
    const e = this.dropT * this.dropT;
    // Tip forward over the coping onto the top of the wall, already moving, then ride away.
    const x0 = this.lipX + PERCH_OVER, x1 = this.lipX + 0.2;
    const y0 = tr.maxY + PERCH_OVER * Math.sin(PERCH_ANGLE);
    const th = Math.atan(tr.slope(x1));
    this.x = x0 + (x1 - x0) * e;
    this.y = y0 + (tr.height(x1) - y0) * e;
    this.angle = PERCH_ANGLE + (th - PERCH_ANGLE) * e;
    if (this.dropT >= 1) {
      this.dropT = -1;
      this.x = x1;
      this.y = tr.height(x1);
      this.v = DROP_SPEED;
      // Leaning into the drop works like a short pump down the wall.
      this.pumpTimer = PUMP_TIME * 0.5;
    }
  }


  /** 0..1 progress of the current trick, for animation. */
  get trickProgress() {
    const c = this.current;
    if (!c) return 0;
    if (c.axis === 'whip') return Math.min(c.whip ? this.whipT / Math.abs(c.whip) : 1, c.bars ? this.barsT / c.bars : 1);
    return Math.min(1, this.trickT / c.duration);
  }
}
