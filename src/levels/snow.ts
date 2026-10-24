import { TrackDef, layout, pipe } from './common';

export const SNOW: TrackDef[] = [
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
      b.ease(10, -3).rollers(2, 16, 1.26);
      b.kicker(4.5, 1.8).flat(5).ease(7, -2.5).rollers(3, 13, 1.4).flat(4);
      b.kicker(5, 2.0).drop(-0.4).ease(10, -4).flat(4);
      b.sign('HUGE AIR').ease(12, -4).kicker(6, 2.6).drop(-0.6).ease(16, -6).flat(10);
    }),
  },
  { id: 'snow-pipe', biome: 'snow', name: 'Ice Pipe', kind: 'pipe', build: pipe(5, 6) },
];
