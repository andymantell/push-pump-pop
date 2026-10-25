// A biome sets the look, scenery and feel of a track. Track layouts live in src/tracks.

export type SurfaceKind = 'concrete' | 'planks' | 'tar' | 'windows' | 'snow' | 'ice' | 'strata' | 'stone' | 'basalt' | 'dirt' | 'soil' | 'biscuit' | 'cake' | 'quay' | 'quaywall' | 'covesand' | 'cobbles' | 'fairboards' | 'lattice';

export interface Surface {
  kind: SurfaceKind;
  base: string;
  seam: string;
  accent?: string;
}

export interface Biome {
  id: string;
  name: string;
  blurb: string;
  sky: [string, string, string];
  fog: [number, number, number];
  hemi: [number, number, number];
  sun: [number, number];
  top: Surface;
  front: Surface;
  band: number;
  ground: [number, number, number];
  /** How the ground behind the track rises or falls away. */
  groundShape: 'hills' | 'shore' | 'roof' | 'mountain' | 'flat' | 'quay';
  far: 'hills' | 'sea' | 'skyline' | 'mountains' | 'mesas' | 'volcano' | 'fields' | 'scoops' | 'harbour' | 'hollow' | 'fair';
  farColors: number[];
  clouds: number | null;
  particles: Particles | null;
  /** Scenery scattered behind the track, with weights. */
  back: [string, number][];
  backZ: [number, number];
  fence?: { kind: string; z: number; spacing: number };
  posts?: { kind: string; z: number; spacing: number };
  edge?: { kind: string; z: number; spacing: number };
  pitFill: 'dark' | 'water' | 'lava';
  pitFillColor?: number;
  fallText: string;
  sign: string;
  friction: number;
  maxSpeed: number;
  /** Colour of the swatch on the level select. */
  swatch: string;
  // Set by a track's mood (src/moods.ts) rather than by the biome itself.
  /** Name of the mood, e.g. 'Night'. */
  mood?: string;
  /** Where the sun shines from, relative to the camera. */
  sunPos?: [number, number, number];
  cloudCount?: number;
  /** 0 to 1: how much the far scenery fades into the sky. */
  haze?: number;
  stars?: boolean;
  aurora?: boolean;
  /** The volcano is erupting. */
  eruption?: boolean;
  /** Lamps and windows light up. */
  lights?: boolean;
  /** Recolour the leaves of the park trees and bushes (blossom, autumn). */
  leafTint?: number;
  /** A big low moon on the horizon (harvest moon). */
  bigMoon?: boolean;
}

export type Particles = 'snow' | 'heavysnow' | 'embers' | 'ash' | 'rain' | 'petals' | 'leaves' | 'dust' | 'fireflies' | 'sprinkles' | 'wisps';

export const BIOMES: Record<string, Biome> = {
  park: {
    id: 'park', name: 'Sunny Park', blurb: 'Concrete, grass and sunshine. Learn to pump.',
    sky: ['#3d9be0', '#8fd0f5', '#d8f1ff'], fog: [0xbfe6fb, 60, 190],
    hemi: [0xdff3ff, 0x6b8f4e, 1.4], sun: [0xffffff, 2.2],
    top: { kind: 'concrete', base: '#d9d4cc', seam: 'rgba(0,0,0,0.18)' },
    front: { kind: 'concrete', base: '#9d958c', seam: 'rgba(0,0,0,0.12)' },
    band: 0xf2a33a,
    ground: [0x7fc75a, 0x5aa64a, 0x9bd36f], groundShape: 'hills',
    far: 'hills', farColors: [0x8cc7a0, 0x7ab894], clouds: 0xffffff, particles: null,
    back: [['tree', 3], ['pine', 2], ['bush', 2], ['rock', 1]], backZ: [-6, -28],
    fence: { kind: 'fence', z: -3.2, spacing: 2.4 },
    posts: { kind: 'lamp', z: -2.6, spacing: 18 },
    edge: { kind: 'cone', z: -2.1, spacing: 35 },
    pitFill: 'dark', fallText: 'WIPEOUT!', sign: '#1f3b57',
    friction: 1, maxSpeed: 17, swatch: '#7fc75a',
  },
  beach: {
    id: 'beach', name: 'Beach Boardwalk', blurb: 'Long wooden rollers by the sea. Find the flow.',
    sky: ['#2f8fe0', '#7fd0f6', '#ffe9c4'], fog: [0xd8eefa, 70, 230],
    hemi: [0xfff4dd, 0xe0c890, 1.5], sun: [0xfff2d0, 2.3],
    top: { kind: 'planks', base: '#c8945c', seam: '#8a5a30' },
    front: { kind: 'planks', base: '#9c6c3c', seam: '#6a4422' },
    band: 0x2bc4c0,
    ground: [0xf0d9a0, 0xe6c98a, 0xf6e4b4], groundShape: 'shore',
    far: 'sea', farColors: [0x2aa6d9, 0x7fd6f0], clouds: 0xffffff, particles: null,
    back: [['palm', 5], ['umbrella', 2], ['lifeguard', 1], ['shack', 1], ['beachball', 1], ['surfboard', 1]], backZ: [-5, -18],
    fence: { kind: 'ropefence', z: -2.8, spacing: 2.4 },
    edge: { kind: 'surfboard', z: -2.2, spacing: 30 },
    pitFill: 'water', pitFillColor: 0x2aa6d9, fallText: 'SPLASH!', sign: '#1d6f8f',
    friction: 1, maxSpeed: 17, swatch: '#f0d9a0',
  },
  rooftops: {
    id: 'rooftops', name: 'Downtown Rooftops', blurb: 'Gap the alleys between buildings at sunset.',
    sky: ['#2b1d55', '#c8508a', '#ffb36b'], fog: [0x9a5a80, 60, 200],
    hemi: [0xffc7a8, 0x40305a, 1.35], sun: [0xffa070, 2.1],
    top: { kind: 'tar', base: '#5d5f66', seam: '#46484e' },
    front: { kind: 'windows', base: '#7a6a78', seam: '#5a4a58', accent: '#ffd27a' },
    band: 0xe84aa0,
    ground: [0x6c6e76, 0x62646b, 0x76787f], groundShape: 'roof',
    far: 'skyline', farColors: [0x3a2f5c, 0x4c3a6e, 0x2c2448], clouds: 0xf7b0c0, particles: null,
    back: [['watertank', 2], ['acunit', 3], ['antenna', 1], ['chimney', 2], ['vent', 3]], backZ: [-4, -11],
    fence: { kind: 'railing', z: -1.9, spacing: 2.4 },
    pitFill: 'dark', fallText: 'WIPEOUT!', sign: '#3a1f5c',
    friction: 1, maxSpeed: 17, swatch: '#c8508a',
  },
  snow: {
    id: 'snow', name: 'Snowy Mountain', blurb: 'Icy and fast. Hold on for huge airs.',
    sky: ['#5aa8e6', '#b5dcf5', '#f0f8ff'], fog: [0xe6f2fb, 50, 190],
    hemi: [0xf0f8ff, 0x9fb8d0, 1.5], sun: [0xffffff, 2.0],
    top: { kind: 'snow', base: '#f2f6fb', seam: '#d6e4f2' },
    front: { kind: 'ice', base: '#a9cbe6', seam: '#86b0d6' },
    band: 0x3d7fd0,
    ground: [0xf4f8fc, 0xe2ecf6, 0xffffff], groundShape: 'mountain',
    far: 'mountains', farColors: [0x8fa8c8, 0xffffff, 0x7a94b8], clouds: 0xffffff, particles: 'snow',
    back: [['snowpine', 5], ['snowrock', 1], ['cabin', 1], ['snowman', 1]], backZ: [-6, -30],
    fence: { kind: 'snowfence', z: -3.0, spacing: 2.4 },
    posts: { kind: 'liftpylon', z: -7, spacing: 40 },
    pitFill: 'dark', fallText: 'WIPEOUT!', sign: '#2a5b8f',
    friction: 0.35, maxSpeed: 21, swatch: '#cfe4f7',
  },
  desert: {
    id: 'desert', name: 'Desert Canyon', blurb: 'Deep dry gullies. Pump hard to climb out.',
    sky: ['#3a8fd8', '#9fd2ee', '#ffe2b0'], fog: [0xf3dcb4, 60, 210],
    hemi: [0xfff0d8, 0xc08050, 1.4], sun: [0xfff0d0, 2.5],
    top: { kind: 'concrete', base: '#e2c08a', seam: 'rgba(120,70,30,0.25)' },
    front: { kind: 'strata', base: '#c9784a', seam: '#a85a34', accent: '#e09a64' },
    band: 0x7a3e22,
    ground: [0xe8b878, 0xdca868, 0xf0c88a], groundShape: 'flat',
    far: 'mesas', farColors: [0xd99868, 0xe8b07a], clouds: 0xffffff, particles: null,
    back: [['cactus', 3], ['barrelcactus', 2], ['desertrock', 2], ['tumbleweed', 1], ['skull', 1]], backZ: [-5, -26],
    fence: { kind: 'fence', z: -3.4, spacing: 2.4 },
    posts: { kind: 'signpost', z: -2.4, spacing: 45 },
    pitFill: 'dark', fallText: 'WIPEOUT!', sign: '#7a3e22',
    friction: 1.1, maxSpeed: 17, swatch: '#e2a060',
  },
  jungle: {
    id: 'jungle', name: 'Jungle Ruins', blurb: 'Tight temple rollers. Keep the rhythm.',
    sky: ['#4aa0c8', '#a8dcc8', '#e8f8e0'], fog: [0xa8d0b0, 40, 150],
    hemi: [0xe8ffe0, 0x2f5a30, 1.4], sun: [0xfff6d0, 2.0],
    top: { kind: 'stone', base: '#b4b49a', seam: '#78786a' },
    front: { kind: 'stone', base: '#8a8c74', seam: '#5e604e', accent: '#5a9a40' },
    band: 0x5aa040,
    ground: [0x3f8f3f, 0x2f7a36, 0x58a848], groundShape: 'hills',
    far: 'hills', farColors: [0x3f7f50, 0x2f6a44], clouds: 0xffffff, particles: null,
    back: [['jungletree', 4], ['fern', 3], ['pillar', 1], ['stonehead', 1], ['ruinwall', 1]], backZ: [-4, -24],
    posts: { kind: 'pillar', z: -2.6, spacing: 30 },
    edge: { kind: 'fern', z: -2.0, spacing: 9 },
    pitFill: 'water', pitFillColor: 0x2f9a9a, fallText: 'SPLASH!', sign: '#3d5a2a',
    friction: 1, maxSpeed: 17, swatch: '#3f8f3f',
  },
  volcano: {
    id: 'volcano', name: 'Volcano', blurb: 'Lava gaps everywhere. The hardest ride.',
    sky: ['#1a0f14', '#5a1f1a', '#d8602a'], fog: [0x6a2e22, 50, 190],
    hemi: [0xffc0a0, 0x502028, 1.6], sun: [0xff9060, 2.4],
    top: { kind: 'basalt', base: '#56505a', seam: '#2e2a30' },
    front: { kind: 'basalt', base: '#3a3336', seam: '#221e22', accent: '#ff6a1a' },
    band: 0xff6a1a,
    ground: [0x3a3438, 0x2e2a2e, 0x48404a], groundShape: 'hills',
    far: 'volcano', farColors: [0x2a2226, 0xff6a1a, 0x4a3a3a], clouds: 0x4a3a3a, particles: 'embers',
    back: [['basalt', 3], ['deadtree', 2], ['lavarock', 2], ['vent_rock', 1]], backZ: [-4, -26],
    pitFill: 'lava', pitFillColor: 0xff5a10, fallText: 'TOO HOT!', sign: '#5a1a10',
    friction: 1, maxSpeed: 17, swatch: '#ff6a1a',
  },
  farm: {
    id: 'farm', name: 'Autumn Farm', blurb: 'Muddy lanes and hay bales. Pump through the mud.',
    sky: ['#4a92d8', '#a6d2ee', '#fbe6c0'], fog: [0xf0e6cc, 60, 200],
    hemi: [0xfff2dc, 0x7a8a4a, 1.4], sun: [0xfff0d0, 2.3],
    top: { kind: 'dirt', base: '#b08458', seam: '#8a6440', accent: '#c89a6a' },
    front: { kind: 'soil', base: '#7a5434', seam: '#5e3e24', accent: '#9a9488' },
    band: 0x5aa040,
    ground: [0x8cbf58, 0x78a84a, 0xb4c868], groundShape: 'hills',
    far: 'fields', farColors: [0x8cc060, 0xe0c060, 0x6aa84a, 0xb08a5a], clouds: 0xffffff, particles: 'leaves',
    back: [['appletree', 2], ['tree', 1.5], ['haybale', 2], ['strawbale', 1], ['corn', 3], ['sunflower', 2], ['scarecrow', 0.6],
      ['chicken', 1], ['cart', 0.5], ['milkchurn', 0.6], ['trough', 0.5], ['bush', 1], ['pumpkin', 1]], backZ: [-5, -24],
    fence: { kind: 'farmfence', z: -3.2, spacing: 2.4 },
    posts: { kind: 'farmpost', z: -2.5, spacing: 42 },
    edge: { kind: 'pumpkin', z: -2.1, spacing: 22 },
    pitFill: 'water', pitFillColor: 0x7a5a32, fallText: 'SPLAT!', sign: '#8a2a20',
    friction: 1, maxSpeed: 17, swatch: '#d88a3a', leafTint: 0xe08a2a,
  },
  candy: {
    id: 'candy', name: 'Candy Kingdom', blurb: 'Jelly pads bounce you sky high. Pump on them to go higher.',
    sky: ['#58a8f0', '#b8d8f8', '#ffd8ec'], fog: [0xffe0f0, 60, 200],
    hemi: [0xfff0f8, 0xc890b0, 1.45], sun: [0xfff4e8, 2.2],
    top: { kind: 'biscuit', base: '#e8b870', seam: '#c88c48', accent: '#ffffff' },
    front: { kind: 'cake', base: '#f4d8a0', seam: '#ff8ab8', accent: '#fff8f0' },
    band: 0xff7ab8,
    ground: [0xa8ecc8, 0x8ee0b8, 0xc8f6dc], groundShape: 'hills',
    far: 'scoops', farColors: [0xffb0d0, 0xb0f0d0, 0xfff0c0, 0x9a6040, 0xc8b0f8], clouds: 0xffd0ec, particles: null,
    back: [['lollipop', 2], ['candytree', 3], ['gumdrop', 2], ['candycane', 2], ['cupcake', 1], ['icecream', 1], ['donut', 1], ['sweet', 1.5]], backZ: [-5, -24],
    fence: { kind: 'canefence', z: -3.2, spacing: 2.4 },
    posts: { kind: 'gumlamp', z: -2.5, spacing: 30 },
    edge: { kind: 'gumdrop', z: -2.1, spacing: 16 },
    pitFill: 'water', pitFillColor: 0x6a3a1a, fallText: 'SPLOSH!', sign: '#c8387a',
    friction: 1, maxSpeed: 17, swatch: '#ff8ac8',
  },
  docks: {
    id: 'docks', name: 'Harbour Docks', blurb: 'Manual along the containers, grind the quay. Keep the combo going.',
    sky: ['#3a88d0', '#9ccbec', '#e4eef4'], fog: [0xc8dce8, 60, 210],
    hemi: [0xeef6ff, 0x6a7680, 1.45], sun: [0xfff4e4, 2.1],
    top: { kind: 'quay', base: '#b4b0a8', seam: 'rgba(0,0,0,0.22)', accent: '#f2c428' },
    front: { kind: 'quaywall', base: '#7c7a74', seam: '#5a5852', accent: '#3e5a3a' },
    band: 0xf2c428,
    ground: [0xa8a49c, 0x9c9890, 0xb4b0a8], groundShape: 'quay',
    far: 'harbour', farColors: [0x2a7aa8, 0x8ac8e0, 0x6a7a88, 0xe85a2a, 0x3a6a9a], clouds: 0xffffff, particles: null,
    back: [['container', 2], ['container2', 2], ['container3', 1.5], ['crate', 2], ['barrel', 2], ['pallets', 1.5], ['ropecoil', 1.5],
      ['lobsterpots', 1], ['net', 1], ['forklift', 0.6], ['anchor', 0.4], ['gull', 1.2], ['lifebuoy', 0.6]], backZ: [-4.5, -19],
    fence: { kind: 'chainrail', z: -3.0, spacing: 2.4 },
    posts: { kind: 'docklamp', z: -2.5, spacing: 26 },
    edge: { kind: 'bollard', z: -2.1, spacing: 14 },
    pitFill: 'water', pitFillColor: 0x2a6a90, fallText: 'SPLASH!', sign: '#1f4a6a',
    friction: 1, maxSpeed: 17, swatch: '#3a88d0',
  },
  pirate: {
    id: 'pirate', name: 'Pirate Cove', blurb: 'Hop the stepping stones across the cove. Pump on every landing!',
    sky: ['#1f88d8', '#86d4f4', '#fff2d4'], fog: [0xcfeef8, 60, 210],
    hemi: [0xfff4e0, 0xc8b080, 1.5], sun: [0xfff0d0, 2.3],
    top: { kind: 'covesand', base: '#e8d0a0', seam: '#c8a878', accent: '#fff4f0' },
    front: { kind: 'strata', base: '#b88a5a', seam: '#9a6a44', accent: '#d0a474' },
    band: 0x18b0c0,
    ground: [0xf0d8a4, 0xe6c88e, 0xf6e4b8], groundShape: 'shore',
    far: 'sea', farColors: [0x18a8c8, 0x9ae8f0], clouds: 0xffffff, particles: null,
    back: [['palm', 5], ['barrel', 1.5], ['crate', 1], ['cannon', 1], ['chest', 0.8], ['cannonballs', 1], ['shell', 2], ['ropecoil', 1], ['anchor', 0.4], ['parrot', 0.8]], backZ: [-5, -18],
    fence: { kind: 'ropefence', z: -2.8, spacing: 2.4 },
    posts: { kind: 'jollyflag', z: -2.4, spacing: 46 },
    edge: { kind: 'shell', z: -2.1, spacing: 14 },
    pitFill: 'water', pitFillColor: 0x18a8c0, fallText: 'SPLASH!', sign: '#5a2a1a',
    friction: 1, maxSpeed: 17, swatch: '#18b0c0',
  },
  haunted: {
    id: 'haunted', name: 'Haunted Hollow', blurb: 'Drop off ledges in a spooky wood. Land on the slope to keep your speed!',
    sky: ['#120e2e', '#3e2a62', '#c8705a'], fog: [0x3a2e52, 45, 170],
    hemi: [0xb8a8e8, 0x2a2232, 1.0], sun: [0xd0c8ff, 1.0],
    top: { kind: 'cobbles', base: '#7a7684', seam: '#4a4654', accent: '#5e7a52' },
    front: { kind: 'stone', base: '#5a5266', seam: '#3a3444', accent: '#4e6a48' },
    band: 0xf08a2a,
    ground: [0x3e4a3e, 0x323e36, 0x4a5644], groundShape: 'hills',
    far: 'hollow', farColors: [0x2e2846, 0x3a3254], clouds: 0x5a4a78, particles: null,
    back: [['spookytree', 4], ['gravestone', 3], ['gravecross', 1.5], ['jackolantern', 1.5], ['pumpkin', 1], ['ghost', 0.5], ['cauldron', 0.3], ['crow', 0.7], ['rock', 1]], backZ: [-5, -22],
    fence: { kind: 'ironfence', z: -3.0, spacing: 2.4 },
    posts: { kind: 'gaslamp', z: -2.6, spacing: 22 },
    edge: { kind: 'jackolantern', z: -2.1, spacing: 26 },
    pitFill: 'dark', fallText: 'BOO!', sign: '#3a2a4a',
    friction: 1, maxSpeed: 17, swatch: '#7a5aaa',
    sunPos: [-10, 10, 5], stars: true, lights: true, haze: 0.2,
  },
  funfair: {
    id: 'funfair', name: 'Funfair', blurb: 'Loop after loop at the fair. Pump between them to keep your speed!',
    sky: ['#2f8ee0', '#8fd0f5', '#fff0d8'], fog: [0xd8eefa, 60, 200],
    hemi: [0xfff4e8, 0x7a9a5a, 1.45], sun: [0xfff4e0, 2.2],
    top: { kind: 'fairboards', base: '#d8b07a', seam: '#9a6a3a', accent: '#e84a3a' },
    front: { kind: 'lattice', base: '#3a2a3a', seam: '#f4ecd8', accent: '#e84a3a' },
    band: 0xf2c040,
    ground: [0x7ac75a, 0x62b04a, 0x96d46a], groundShape: 'flat',
    far: 'fair', farColors: [0x8cc7a0, 0x7ab894], clouds: 0xffffff, particles: null,
    back: [['tent', 3], ['candyfloss', 1.5], ['balloons', 1.5], ['popcorn', 1.2], ['teddy', 0.8], ['tree', 1], ['bush', 1]], backZ: [-6, -24],
    fence: { kind: 'bunting', z: -3.0, spacing: 2.4 },
    posts: { kind: 'fairlamp', z: -2.6, spacing: 20 },
    edge: { kind: 'balloon', z: -2.1, spacing: 17 },
    pitFill: 'dark', fallText: 'WIPEOUT!', sign: '#c8302a',
    friction: 1, maxSpeed: 17, swatch: '#e84a3a',
  },
};

/** The worlds, each a list of biomes in play order. World 2 opens once Volcano 5 is complete. */
export const WORLDS: string[][] = [
  ['park', 'beach', 'rooftops', 'snow', 'desert', 'jungle', 'volcano'],
  ['farm', 'candy', 'docks', 'pirate', 'haunted', 'funfair'],
];
export const BIOME_ORDER = WORLDS.flat();
export const worldOf = (biome: string) => WORLDS.findIndex((w) => w.includes(biome));
