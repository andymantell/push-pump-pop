import { Track, TrackBuilder } from './track';

// Track layouts. Each is a chain of shapes describing the ground from left to right.
// See TrackBuilder in track.ts for the pieces; biomes.ts sets the look and feel.

export interface TrackDef {
  id: string;
  biome: string;
  name: string;
  /** 'pipe' is a timed half-pipe bonus level; 'run' rides to a finish line. */
  kind?: 'run' | 'pipe';
  /** Show the pump-timing cue (first track only). */
  tutorial?: boolean;
  build: () => Track;
}

function layout(startY: number, startX: number, fn: (b: TrackBuilder) => void): () => Track {
  return () => {
    const b = new TrackBuilder(startY);
    fn(b);
    const finishX = b.x;
    b.sign('FINISH').flat(40);
    return b.build(startX, finishX);
  };
}

/** Half pipe bonus level: ride back and forth for PIPE_TIME seconds. */
export const PIPE_TIME = 60;
function pipe(radius: number, flatLen: number): () => Track {
  return () => {
    const b = new TrackBuilder(0);
    b.halfpipe(radius, flatLen, 8);
    const centre = 8 + radius * 0.96 + flatLen / 2;
    return b.build(centre, Infinity);
  };
}

const PIPES: [string, string, number, number][] = [
  ['park', 'Sunny Halfpipe', 4.5, 5],
  ['beach', 'Boardwalk Bowl', 4.5, 6],
  ['rooftops', 'Rooftop Halfpipe', 4.2, 5],
  ['snow', 'Ice Pipe', 5, 6],
  ['desert', 'Canyon Pipe', 4.8, 5],
  ['jungle', 'Temple Pipe', 4.2, 4.5],
  ['volcano', 'Magma Pipe', 5, 5],
];

export const TRACKS: TrackDef[] = [
  {
    id: 'park-1', biome: 'park', name: 'First Pump', tutorial: true,
    build: layout(4, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(8);
      // Pump rollers: tap on the way down each bump.
      b.sign('TAP TO PUMP').rollers(3, 13, 0.98).flat(5);
      b.sign('SWIPE UP: OLLIE').kicker(4, 1.3).flat(5).ease(5, -1.3).flat(6);
      b.rollers(2, 12, 1.26).flat(4);
      b.sign('SWIPE LEFT: KICKFLIP').kicker(4.5, 1.6).flat(4).ease(6, -1.6).flat(6);
      b.rollers(2, 12, 0.84).ease(10, -2).rollers(2, 12, 1.12).flat(4);
      b.sign('GAP').kicker(4, 1.5).drop(-1.0).valley(7, 1.2).ease(4, 1.0).ease(6, -1.5).flat(6);
      b.rollers(2, 12, 0.98).kicker(4, 1.8).flat(3).ease(3, 0.8).flat(6).rollers(2, 12, 0.7).flat(3);
      b.sign('DROP').drop(-0.3).ease(7, -2.3).flat(6);
      b.kicker(3.5, 1.2).flat(3.5).ease(4, -1.2).flat(3);
      b.sign('OLLIE ON: GRIND').flat(6).rail(8, 0.5).flat(6);
      b.kicker(3.5, 1.4).flat(3).ease(5, -1.4).flat(5);
      b.rollers(3, 12, 1.05).flat(5);
      b.sign('STAIRS').flat(5).stairs(5).flat(8);
      b.sign('BIG AIR').ease(14, -5).flat(3).kicker(5, 1.9, 2.3).drop(-0.4).ease(4, 0.2).ease(12, -4.2).flat(8);
    }),
  },
  {
    id: 'beach-1', biome: 'beach', name: 'Boardwalk Breeze',
    build: layout(3, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -3).flat(6);
      b.sign('FLOW').rollers(4, 16, 1.4).flat(4);
      b.kicker(4, 1.2).flat(4).ease(6, -1.2).flat(4);
      b.rollers(3, 15, 1.5).flat(3);
      b.sign('WATER GAP').kicker(4, 1.4).pit(4.5, -0.4).ease(6, -1.0).flat(5);
      b.rollers(5, 14, 1.4).flat(4);
      b.flat(6).ledge(8).flat(5);
      b.ease(8, -2).kicker(4.5, 1.7).flat(3).ease(6, -1.7).flat(4);
      b.rollers(2, 16, 1.5).flat(3);
      b.flat(5).stairs(6).flat(8);
      b.sign('BIG AIR').ease(10, -3).kicker(5, 2.0).pit(6, -1.2).ease(8, -2).flat(8);
    }),
  },
  {
    id: 'rooftops-1', biome: 'rooftops', name: 'Rush Hour Roofs',
    build: layout(6, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(8, -2).flat(6);
      b.rollers(2, 12, 0.7).flat(4);
      b.sign('GAP!').kicker(3.5, 1.1).pit(2.5, -1.1).flat(6);
      b.rollers(2, 12, 0.84).flat(3);
      b.kicker(3.5, 1.2).pit(3.5, -1.7).flat(5);
      b.drop(-1.2).ease(4, -0.5).flat(5);
      b.kicker(4, 1.2).flat(4).ease(5, -1.2).flat(4);
      b.flat(5).rail(9, 0.6).flat(5);
      b.kicker(4, 1.3).pit(4, -1.8).flat(6);
      b.rollers(2, 12, 0.98).flat(3);
      b.kicker(4, 1.4).pit(4.5, -2.2).flat(5);
      b.drop(-1).ease(6, -1.5).flat(4);
      b.flat(5).stairs(7).flat(8);
      b.sign('BIG GAP').ease(6, -1.5).kicker(5, 1.8).pit(6, -3).ease(5, -1).flat(8);
    }),
  },
  {
    id: 'snow-1', biome: 'snow', name: 'Powder Run',
    build: layout(12, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(12, -5).flat(5);
      b.sign('ICY!').rollers(2, 16, 1.4);
      b.kicker(5, 1.8).flat(4).ease(8, -3).flat(3);
      b.ease(15, -5);
      b.kicker(5, 2.2).drop(-0.5).ease(12, -5);
      b.rollers(3, 15, 1.5).flat(4);
      b.flat(6).rail(10, 0.6).flat(6);
      b.kicker(4, 1.5).flat(6).ease(6, -1.5).flat(5);
      b.ease(10, -3).rollers(2, 13, 1.26);
      b.kicker(4.5, 1.8).flat(5).ease(7, -2.5).rollers(3, 13, 1.4).flat(4);
      b.kicker(5, 2.0).drop(-0.4).ease(10, -4).flat(4);
      b.sign('HUGE AIR').ease(12, -4).kicker(6, 2.6).drop(-0.6).ease(16, -6).flat(10);
    }),
  },
  {
    id: 'desert-1', biome: 'desert', name: 'Dry Gulch',
    build: layout(4, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      b.sign('PUMP OUT').valley(12, 3).flat(4);
      b.rollers(2, 13, 1.26).flat(3);
      b.kicker(4, 1.3).flat(4).ease(5, -1.3).flat(4);
      b.valley(14, 4).flat(3);
      b.rollers(3, 12, 1.12).flat(3);
      b.flat(5).ledge(8).flat(5);
      b.kicker(4, 1.5).flat(4).ease(6, -1.5).flat(4);
      b.sign('DEEP GULLY').valley(16, 5).flat(4);
      b.flat(5).stairs(6).flat(8);
      b.rollers(2, 13, 1.4);
      b.sign('BIG AIR').ease(8, -2).kicker(5, 2.0).flat(3).ease(8, -2).flat(6);
    }),
  },
  {
    id: 'jungle-1', biome: 'jungle', name: 'Temple Rhythm',
    build: layout(3, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(8, -3).flat(5);
      b.sign('RHYTHM').rollers(4, 12, 0.84).flat(3);
      b.kicker(3.5, 1.1).flat(3).ease(4, -1.1).flat(3);
      b.rollers(3, 12, 0.98).flat(3);
      b.sign('RIVER').kicker(4, 1.3).pit(3, -0.6).flat(4);
      b.drop(-0.6).flat(2).drop(-0.6).flat(2).drop(-0.6).flat(4);
      b.rollers(4, 12, 0.91).flat(3);
      b.sign('TEMPLE STEPS').flat(5).stairs(8).flat(8);
      b.ease(5, -1).kicker(4, 1.5).pit(4, -1.2).flat(4);
      b.rollers(3, 12, 1.12).flat(3);
      b.flat(5).ledge(7).flat(4);
      b.sign('LOOP!').ease(14, -4).flat(4).loop(2.4).flat(6);
      b.ease(8, -2).kicker(4.5, 1.8).flat(3).ease(6, -1.8).flat(6);
    }),
  },
  {
    id: 'volcano-1', biome: 'volcano', name: 'Lava Leap',
    build: layout(6, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      b.rail(8, 0.6).flat(4);
      b.rollers(2, 13, 1.12).flat(3);
      b.sign('LAVA!').kicker(3.5, 1.0).pit(3, -0.5).flat(5);
      b.rollers(2, 12, 1.12).flat(3);
      b.kicker(4, 1.2).pit(4, -0.8).flat(4);
      b.flat(3).ease(10, -2.5).kicker(4, 1.5).pit(3.8, -1.2).flat(4);
      b.rollers(3, 12, 1.26).flat(3);
      b.kicker(4, 1.4).pit(3.8, -1.2).ease(8, -1.5).flat(10);
      b.sign('LOOP!').ease(14, -4).flat(4).loop(2.4).flat(6);
      b.ease(6, -1.5).kicker(4, 1.6).pit(4.5, -1.3).flat(4);
      b.sign('FINAL LEAP').ease(10, -3).kicker(5, 2.0).pit(7, -2).ease(6, -1).flat(8);
    }),
  },
  ...PIPES.map(([biome, name, radius, flatLen]): TrackDef => ({
    id: `${biome}-pipe`, biome, name, kind: 'pipe', build: pipe(radius, flatLen),
  })),
];
