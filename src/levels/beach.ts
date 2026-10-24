import { TrackDef, layout, pipe } from './common';

export const BEACH: TrackDef[] = [
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
  { id: 'beach-pipe', biome: 'beach', name: 'Boardwalk Bowl', kind: 'pipe', build: pipe(4.5, 6) },
];
