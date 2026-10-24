import { TrackDef, layout, pipe } from './common';

export const JUNGLE: TrackDef[] = [
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
  { id: 'jungle-pipe', biome: 'jungle', name: 'Temple Pipe', kind: 'pipe', build: pipe(4.2, 4.5) },
];
