import { TrackDef, layout, pipe } from './common';

export const VOLCANO: TrackDef[] = [
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
  { id: 'volcano-pipe', biome: 'volcano', name: 'Magma Pipe', kind: 'pipe', build: pipe(5, 5) },
];
