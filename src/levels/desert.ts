import { TrackDef, layout, mega } from './common';

export const DESERT: TrackDef[] = [
  {
    id: 'desert-1', biome: 'desert', name: 'Dry Gulch',
    build: layout(4, 5, (b) => {
      b.flat(8).sign('DROP IN').ease(10, -4).flat(6);
      b.sign('PUMP OUT').valley(24, 3).flat(4);
      b.rollers(2, 13, 1.26).flat(3);
      b.kicker(4, 1.3).flat(4).ease(5, -1.3).flat(4);
      b.valley(27, 4).flat(3);
      b.rollers(3, 12, 1.12).flat(3);
      b.flat(5).ledge(8).flat(5);
      b.kicker(4, 1.5).flat(4).ease(6, -1.5).flat(4);
      b.sign('DEEP GULLY').valley(30, 5).flat(4);
      b.flat(5).stairs(6).flat(8);
      b.rollers(2, 13, 1.4);
      b.sign('BIG AIR').ease(8, -2).kicker(5, 2.0).flat(3).ease(8, -2).flat(6);
    }),
  },
  {
    id: 'desert-mega', biome: 'desert', name: 'Canyon Mega Ramp', kind: 'mega', par: 16000,
    challenges: [
      { text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 },
      { text: 'A trick on both airs of one drop', kind: 'bothAirs' },
      { text: 'Score 16,000', kind: 'score', points: 16000 },
    ],
    build: mega(18, 12, 6),
  },
];
