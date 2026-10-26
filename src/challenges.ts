import type { Rider, Trick, TrickName, ManualName } from './rider';
import type { Track, Rail } from './track';

// Challenges: three per track, the specific tricks and combos you need to progress
// (docs/level-plan.md, section 2a). ChallengeRun watches one run, in the game and in the
// playtest alike, and says as soon as each challenge is done.

/** A family of tricks a challenge can ask for instead of one name. 'any' is any air trick but an ollie. */
export type Group = 'flip' | 'grab' | 'skates' | 'whip' | 'double' | 'hold' | 'spin' | 'bodyflip' | 'grind' | 'manual' | 'loop' | '180' | '360' | 'bike' | 'skinny' | 'kayak' | 'end' | 'any';
export type Match = TrickName | Group;

/**
 * Whether an air that took off at `x` counts as off this spot. Most spots are a sharp lip to
 * pop at; a gully's far edge is a gentle curve, so an ollie anywhere up its top wall or just
 * past the top counts.
 */
export function offSpot(s: { x: number; tag: string }, x: number): boolean {
  return s.tag === 'lip' || s.tag === 'lastlip' ? x > s.x - 5 && x < s.x + 3 : x > s.x - 2.5 && x < s.x + 1;
}

/** Which gaps an air has to clear: any one, every gap on the track, or these (by index). */
export type GapFilter = true | 'every' | number[];

export type Challenge = { text: string } & (
  | { kind: 'finish' }
  /** Land `count` of a trick (default 1). With overGap, count is the number of different gaps. */
  | { kind: 'trick'; match: Match; count?: number; overGap?: GapFilter; from?: string; fromRail?: boolean; minTime?: number }
  | { kind: 'allOf'; names: TrickName[] }
  | { kind: 'sameAir'; match: Match[]; overGap?: GapFilter; from?: string }
  /** One combo with at least `tricks` tricks, the listed ones in it, `points`, `gaps` cleared, or running from one spot to another. */
  | { kind: 'combo'; tricks?: number; include?: Match[]; points?: number; gaps?: number; across?: [string, string] }
  /** Grind `count` different rails (default 1), or these rails by index, for at least `seconds`. */
  | { kind: 'grind'; count?: number; rails?: number[]; seconds?: number; railKind?: Rail['kind'] }
  | { kind: 'manual'; seconds?: number; name?: ManualName; pad?: boolean }
  | { kind: 'loop'; count?: number }
  /** One air of `seconds` or `metres` above the ground below (above the lip in a half pipe). */
  | { kind: 'air'; seconds?: number; metres?: number; from?: string; fromRail?: boolean; overGap?: GapFilter }
  | { kind: 'pumps'; count: number }
  /** Clear these gaps (default: all of them), or `count` of them. */
  | { kind: 'gaps'; which?: number[]; count?: number }
  /** An air off every kicker, with a trick in it that matches (default: anything, an ollie will do). */
  | { kind: 'everyKicker'; match?: Match }
  /** Reach the finish without ever rolling backwards. */
  | { kind: 'climb' }
  | { kind: 'noLives' }
  | { kind: 'score'; points: number; noLives?: boolean }
  /** Land this many different tricks. */
  | { kind: 'variety'; count: number }
  /** Mega ramp: clear the gap on this many drops. */
  | { kind: 'drops'; count: number }
  /** Mega ramp: a trick off the kicker and off the quarter pipe in the same drop. */
  | { kind: 'bothAirs' }
);

const GROUPS: Record<Group, TrickName[]> = {
  flip: ['Kickflip', 'Heelflip', 'Pop Shove-it', '360 Flip', 'Hardflip', 'BS Shifty', 'FS Shifty', 'Tuck Knee'],
  grab: ['Indy', 'Melon', 'Nosegrab', 'Tailgrab', 'Mute', 'Japan', 'Safety', 'Stalefish'],
  // Inline skates: airs on the right (their grabs are in grab).
  skates: ['Flatspin', 'Misty Flip', 'Rocket Air'],
  // Scooter: whips and barspins on the right, body tricks held on the left.
  whip: ['Tailwhip', 'Heelwhip', 'Barspin', 'Double Whip', 'Double Heelwhip', 'Double Barspin', 'Tailwhip Barspin', 'Heelwhip Barspin'],
  double: ['Double Whip', 'Double Heelwhip', 'Double Barspin', 'Tailwhip Barspin', 'Heelwhip Barspin'],
  hold: ['Superman', 'No Footer', 'Can Can', 'X-Up', 'No Hander'],
  // Downhill bike: the bike thrown about on the right; skinnies ridden along.
  bike: ['Whip', 'Tabletop', 'Turndown'],
  skinny: ['Skinny', 'Skinny Manual', 'Skinny Stoppie'],
  // Kayak: the boat thrown about in the air off a wave or a drop, and end moves held in a hole.
  kayak: ['Airscrew', 'Helix', 'Pan-Am'],
  end: ['Cartwheel', 'Blunt', 'McNasty', 'Space Godzilla'],
  spin: ['FS 180', 'BS 180', 'FS 360', 'BS 360', 'Flatspin 180', 'Flatspin 360'],
  '180': ['FS 180', 'BS 180', 'Flatspin 180'],
  '360': ['FS 360', 'BS 360', 'Flatspin 360'],
  bodyflip: ['Backflip', 'Frontflip', 'Back Loop', 'Front Loop'],
  grind: ['50-50', 'Boardslide', '5-0', 'Nosegrind', 'Feeble', 'Smith', 'Skinny', 'Skinny Manual', 'Skinny Stoppie', 'Frontside', 'Soul', 'Makio', 'Royale', 'Unity'],
  manual: ['Manual', 'Nose Manual', 'Tail Press', 'Nose Press', 'Stoppie', 'Stern Stall', 'Bow Stall', 'Heel Roll', 'Toe Roll'],
  loop: ['Loop'],
  any: [],
};
GROUPS.any = [...GROUPS.flip, ...GROUPS.grab, ...GROUPS.skates, ...GROUPS.whip, ...GROUPS.bike, ...GROUPS.kayak, ...GROUPS.end, ...GROUPS.hold, ...GROUPS.spin, ...GROUPS.bodyflip];

export function matches(m: Match, name: TrickName): boolean {
  return m in GROUPS ? GROUPS[m as Group].includes(name) : m === name;
}
/** The tricks a match could be, for the bot to pick from. */
export function members(m: Match): TrickName[] {
  return m in GROUPS ? GROUPS[m as Group] : [m as TrickName];
}

/** The downhill world's first two biomes, which ask for one challenge like Sunny Park and Beach. */
const EASY_DOWNHILL = ['dh-urban', 'dh-mud'];

/**
 * How many challenges must be done to complete a track: one in the first two biomes (by their
 * place in the game, `worldIndex`), then two. The downhill world and the rivers start again at one.
 */
export function requiredCount(worldIndex: number, kind: string = 'run', biome = ''): number {
  if (kind !== 'run') return 0;
  if (biome.startsWith('dh-')) return EASY_DOWNHILL.includes(biome) ? 1 : 2;
  // The kayak's rivers start again at one too, for their first two biomes.
  if (biome.startsWith('kayak-')) return biome === 'kayak-centre' || biome === 'kayak-creek' ? 1 : 2;
  return worldIndex <= 1 ? 1 : 2;
}

/** A small picture for each challenge. */
export function icon(c: Challenge): string {
  const m = c.kind === 'trick' ? c.match : c.kind === 'sameAir' ? c.match[0] : null;
  if (m) {
    if (matches(m, 'Indy') || m === 'grab' || members(m).every((n) => GROUPS.grab.includes(n))) return '&#9995;';
    if (members(m).every((n) => GROUPS.hold.includes(n))) return '&#129464;';
    if (members(m).every((n) => GROUPS.skates.includes(n))) return '&#128764;';
    if (members(m).every((n) => GROUPS.whip.includes(n) || GROUPS.bike.includes(n))) return '&#128260;';
    if (members(m).every((n) => GROUPS.kayak.includes(n) || GROUPS.end.includes(n) || n === 'Splat' || n === 'Boof')) return '&#128758;';
    if (m === 'Bunny Hop') return '&#128756;';
    if (members(m).every((n) => GROUPS.spin.includes(n))) return '&#127744;';
    if (members(m).every((n) => GROUPS.bodyflip.includes(n))) return '&#129528;';
    if (members(m).every((n) => GROUPS.grind.includes(n))) return '&#128740;';
    return '&#128761;';
  }
  switch (c.kind) {
    case 'finish': return '&#127937;';
    case 'allOf': case 'variety': return '&#127922;';
    case 'combo': return '&#128279;';
    case 'grind': return '&#128740;';
    case 'manual': return '&#9878;';
    case 'loop': return '&#10160;';
    case 'air': return '&#9729;';
    case 'pumps': return '&#128070;';
    case 'gaps': return '&#11157;';
    case 'everyKicker': return '&#11014;';
    case 'climb': return '&#9968;';
    case 'noLives': return '&#10084;';
    case 'score': return '&#11088;';
    case 'drops': return '&#11157;';
    case 'bothAirs': return '&#9729;';
  }
  return '&#9733;';
}

/** An air trick done; one put together from several (see combined in rider.ts) keeps its parts. */
interface Done { name: TrickName; duration: number; parts?: TrickName[]; id?: number }
/** What a trick counts as: its own name and, if it's put together from others, theirs too. */
const aliases = (t: Done) => (t.parts ? [t.name, ...t.parts] : [t.name]);

interface Air {
  x0: number;
  spots: Set<string>;
  /** Index into track.spots of a kicker you took off from, or -1. */
  kicker: number;
  fromRail: boolean;
  tricks: Done[];
  peak: number;
  t0: number;
}

export class ChallengeRun {
  /** Done, this run or before. */
  readonly done: boolean[];
  /** Done in this run. */
  readonly fresh: boolean[];
  onDone: (i: number) => void = () => {};

  private now = 0;
  private x = 0;
  private air: Air | null = null;
  private pending: (Done & { at: number })[] = [];
  private grindEnd = -10;
  private grindRail = -1;
  private manualX0: number | null = null;
  private combo: (Done & { x: number })[] = [];
  private comboGaps = 0;
  private landed = new Set<TrickName>();
  /** Per challenge: things counted towards it (gaps, rails, kickers, tricks). */
  private sets: Set<number | string>[];
  private counts: number[];
  private pumps = 0;
  private total = 0;
  private lostLife = false;
  private rolledBack = false;
  private passed = new Set<number>();
  /** Mega ramps: drops that cleared the gap so far, and where this drop's trick airs took off. */
  private dropClears = 0;
  private dropAirs = new Set<string>();
  private fellIn = new Set<number>();

  constructor(readonly list: Challenge[], private track: Track, before: boolean[] = [], private pipe = false) {
    this.done = list.map((_, i) => !!before[i]);
    this.fresh = list.map(() => false);
    this.sets = list.map(() => new Set());
    this.counts = list.map(() => 0);
  }

  /** Progress towards a challenge with a count, e.g. "2/3", or null. */
  progress(i: number): string | null {
    const c = this.list[i];
    if (this.done[i]) return null;
    const of = (n: number, need: number) => (need > 1 ? `${Math.min(n, need)}/${need}` : null);
    switch (c.kind) {
      case 'trick': return of(c.overGap ? this.sets[i].size : this.counts[i], c.overGap === 'every' ? this.track.pits.length : c.count ?? 1);
      case 'allOf': return of(c.names.filter((n) => this.landed.has(n)).length, c.names.length);
      case 'variety': return of(this.landed.size, c.count);
      case 'grind': return of(this.sets[i].size, c.rails?.length ?? c.count ?? 1);
      case 'loop': return of(this.counts[i], c.count ?? 1);
      case 'pumps': return of(this.pumps, c.count);
      case 'gaps': return of(this.gapsFor(c).filter((g) => this.passed.has(g)).length, c.count ?? this.gapsFor(c).length);
      case 'everyKicker': return of(this.sets[i].size, this.kickers().length);
      case 'drops': return of(this.dropClears, c.count);
    }
    return null;
  }

  private complete(i: number) {
    if (this.done[i]) return;
    this.done[i] = true;
    this.fresh[i] = true;
    this.onDone(i);
  }
  private each(kind: Challenge['kind'], f: (c: any, i: number) => boolean | void) {
    this.list.forEach((c, i) => { if (c.kind === kind && !this.done[i] && f(c, i)) this.complete(i); });
  }

  private kickers() { return this.track.spots.map((s, i) => (s.tag === 'kicker' ? i : -1)).filter((i) => i >= 0); }
  private gapsFor(c: { which?: number[] }) {
    const n = this.track.pits.length;
    return c.which ? c.which.map((g) => (g < 0 ? n + g : g)) : [...Array(n).keys()];
  }
  /** Gaps an air from x0 to x1 jumped clean over. */
  private cleared(x0: number, x1: number) {
    return this.track.pits.map((p, i) => (p.x0 > x0 - 0.6 && p.x1 < x1 ? i : -1)).filter((i) => i >= 0);
  }
  private gapOk(f: GapFilter | undefined, gaps: number[]) {
    if (!f) return true;
    if (f === true || f === 'every') return gaps.length > 0;
    return gaps.some((g) => f.map((n) => (n < 0 ? this.track.pits.length + n : n)).includes(g));
  }

  // --- events from the rider and the score ---

  trick(t: Trick) {
    if (t.axis === 'grind') {
      this.credit(t, null);
      const rail = this.track.rails[this.grindRail];
      this.each('grind', (c, i) => {
        if (!rail || t.duration < (c.seconds ?? 0) || (c.railKind && rail.kind !== c.railKind)) return;
        if (c.rails && !c.rails.includes(this.grindRail)) return;
        this.sets[i].add(this.grindRail);
        return this.sets[i].size >= (c.rails?.length ?? c.count ?? 1);
      });
      return;
    }
    if (t.axis === 'manual') {
      const x0 = this.manualX0 ?? this.x;
      this.each('manual', (c) => {
        if (c.name && c.name !== t.name) return;
        if (c.pad) return this.track.pads.some((p) => x0 <= p.x0 + 0.6 && this.x >= p.x1 - 0.6);
        return t.duration >= (c.seconds ?? 0);
      });
      this.credit(t, null, [], x0);
      return;
    }
    if (t.axis === 'loop') {
      this.each('loop', (c, i) => ++this.counts[i] >= (c.count ?? 1));
      this.credit(t, null);
      return;
    }
    // Air tricks count once you land them. An ollie fires as you pop, just before take-off.
    // One put together from tricks before it (a 180 and another 180) takes their place.
    const gone = (d: Done) => d.id !== undefined && !!t.replaces?.includes(d.id);
    if (this.air) this.air.tricks = this.air.tricks.filter((d) => !gone(d));
    this.pending = this.pending.filter((d) => !gone(d));
    const d = { name: t.name, duration: t.duration, parts: t.parts, id: t.id };
    if (this.air) this.air.tricks.push(d);
    else this.pending.push({ ...d, at: this.now });
  }

  /** A trick landed, with the air it was done in (null on the ground or a rail). */
  private credit(t: Done, air: Air | null, gaps: number[] = [], x = this.x) {
    const { duration } = t;
    for (const n of aliases(t)) this.landed.add(n);
    this.combo.push({ ...t, x });
    this.each('trick', (c, i) => {
      if (!aliases(t).some((n) => matches(c.match, n)) || duration < (c.minTime ?? 0)) return;
      if ((c.overGap || c.from || c.fromRail) && !air) return;
      if (air && c.from && !air.spots.has(c.from)) return;
      if (air && c.fromRail && !air.fromRail) return;
      if (c.overGap) {
        if (!this.gapOk(c.overGap, gaps)) return;
        for (const g of gaps) this.sets[i].add(g);
        return this.sets[i].size >= (c.overGap === 'every' ? this.track.pits.length : c.count ?? 1);
      }
      return ++this.counts[i] >= (c.count ?? 1);
    });
    this.each('allOf', (c) => c.names.every((n: TrickName) => this.landed.has(n)));
    this.each('variety', (c) => this.landed.size >= c.count);
  }

  /** Touched down at x. */
  land(x: number) { this.x = x; this.closeAir(true); }
  bail() { this.closeAir(false); this.pending = []; this.lostLife = true; }
  fall(x: number) {
    this.x = x;
    this.closeAir(false);
    this.pending = [];
    this.lostLife = true;
    const p = this.track.pitAt(this.x);
    if (p) this.fellIn.add(this.track.pits.indexOf(p));
  }
  pump(good: boolean) {
    if (!good) return;
    this.pumps++;
    this.each('pumps', (c) => this.pumps >= c.count);
  }

  /** A combo banked for `points`. */
  bank(points: number) {
    this.total += points;
    // A trick put together from several counts as all of them.
    const names = this.combo.flatMap(aliases);
    const count = this.combo.reduce((n, e) => n + (e.parts?.length ?? 1), 0);
    this.each('combo', (c) => {
      if (count < (c.tricks ?? 0) || points < (c.points ?? 0) || this.comboGaps < (c.gaps ?? 0)) return;
      const left = [...names];
      for (const m of (c.include ?? []) as Match[]) {
        const k = left.findIndex((n) => matches(m, n));
        if (k < 0) return;
        left.splice(k, 1);
      }
      if (c.across) {
        const [a, b] = c.across.map((tag: string) => this.track.spots.find((s) => s.tag === tag)?.x ?? NaN);
        if (!this.combo.length || !(this.combo[0].x <= a + 1 && this.combo[this.combo.length - 1].x >= b - 1)) return;
      }
      return true;
    });
    this.each('score', (c) => !c.noLives && this.total >= c.points);
    this.combo = [];
    this.comboGaps = 0;
  }
  lost() { this.combo = []; this.comboGaps = 0; }

  /** Reached the finish line with a life left. */
  finish() {
    this.each('finish', () => true);
    this.each('noLives', () => !this.lostLife);
    this.each('climb', () => !this.rolledBack);
    this.each('score', (c) => this.total >= c.points && !this.lostLife);
  }

  /** Mega ramps: one drop is over and the next starts from the top. */
  newDrop() {
    this.closeAir(false);
    this.pending = [];
    if (this.track.pits.length && this.passed.size === this.track.pits.length) this.dropClears++;
    this.each('drops', (c) => this.dropClears >= c.count);
    this.passed.clear();
    this.fellIn.clear();
    this.dropAirs.clear();
  }

  /** Called every step, after the rider moves. */
  tick(dt: number, r: Rider) {
    this.now += dt;
    this.x = r.x;
    const flying = !r.grounded && !r.grind && !r.loop && !r.falling && !r.loopFall;
    if (flying && !this.air) {
      const near = this.track.spots.map((s, i) => ({ s, i })).filter(({ s }) => offSpot(s, r.x));
      this.air = {
        x0: r.x, spots: new Set(near.map(({ s }) => s.tag)), kicker: near.find(({ s }) => s.tag === 'kicker')?.i ?? -1,
        fromRail: this.now - this.grindEnd < 0.2, tricks: this.pending.filter((p) => this.now - p.at < 0.35), peak: 0, t0: this.now,
      };
      this.pending = [];
    }
    if (this.air) {
      // In a half pipe, above the lip; on a standing wave or anywhere else, above the water below.
      const h = this.pipe && !this.track.holes.some((w) => w.wave) ? r.y - this.track.maxY : r.y - this.track.height(r.x);
      this.air.peak = Math.max(this.air.peak, h);
      // Caught a rail: that air was clean.
      if (r.grind) this.closeAir(true);
    }
    for (const p of this.pending.filter((p) => this.now - p.at >= 0.35)) this.credit(p, null);
    this.pending = this.pending.filter((p) => this.now - p.at < 0.35);

    if (r.grind) { this.grindRail = this.track.rails.indexOf(r.grind.rail); this.grindEnd = this.now; }
    if (r.manual && this.manualX0 === null) this.manualX0 = r.x;
    if (!r.manual) this.manualX0 = null;
    if (r.grounded && !r.falling && !r.loop && r.v < -0.5) this.rolledBack = true;

    this.track.pits.forEach((p, i) => {
      if (!this.passed.has(i) && !this.fellIn.has(i) && !r.falling && r.x > p.x1 + 0.5) this.passed.add(i);
    });
    this.each('gaps', (c) => {
      const want = this.gapsFor(c);
      const got = want.filter((g) => this.passed.has(g)).length;
      return got >= (c.count ?? want.length);
    });
  }

  private closeAir(clean: boolean) {
    const a = this.air;
    this.air = null;
    if (!a || !clean) return;
    const gaps = this.cleared(a.x0, this.x);
    const airTime = this.now - a.t0;
    // A combo across a stretch counts an air from where it took off.
    for (const t of a.tricks) this.credit(t, a, gaps, a.x0);
    this.comboGaps += gaps.length;
    if (!a.tricks.length && !this.combo.length) this.comboGaps = 0;
    const names = a.tricks.flatMap(aliases);
    this.each('sameAir', (c) => {
      if ((c.from && !a.spots.has(c.from)) || !this.gapOk(c.overGap, gaps)) return;
      const left = [...names];
      return (c.match as Match[]).every((m) => {
        const k = left.findIndex((n) => matches(m, n));
        if (k < 0) return false;
        left.splice(k, 1);
        return true;
      });
    });
    this.each('air', (c) => {
      if ((c.from && !a.spots.has(c.from)) || (c.fromRail && !a.fromRail) || !this.gapOk(c.overGap, gaps)) return;
      return airTime >= (c.seconds ?? 0) && a.peak >= (c.metres ?? 0);
    });
    if (names.some((n) => n !== 'Ollie' && n !== 'Bunny Hop')) for (const tag of a.spots) this.dropAirs.add(tag);
    this.each('bothAirs', () => this.dropAirs.has('kicker') && this.dropAirs.has('qp'));
    if (a.kicker >= 0) this.each('everyKicker', (c, i) => {
      if (c.match ? names.some((n) => matches(c.match, n)) : names.length > 0) this.sets[i].add(a.kicker);
      return this.sets[i].size >= this.kickers().length;
    });
  }
}
