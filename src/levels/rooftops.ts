import { TrackDef, layout, mega } from './common';

export const ROOFTOPS: TrackDef[] = [
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
    id: 'rooftops-mega', biome: 'rooftops', name: 'Skyscraper Mega Ramp', kind: 'mega', par: 20500,
    challenges: [
      { text: 'Clear the gap on all 3 drops', kind: 'drops', count: 3 },
      { text: 'A trick on both airs of one drop', kind: 'bothAirs' },
      { text: 'Score 20,500', kind: 'score', points: 20500 },
    ],
    build: mega(12, 8, 5),
  },
];
