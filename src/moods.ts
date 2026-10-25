import { Biome } from './biomes';

// Each track gets a time of day or a bit of weather on top of its biome, so tracks in the
// same world don't all look alike. Moods only change the look: never the layout or physics.

export type Mood = Partial<Biome> & {
  label: string;
  /** Fog colour, if not the horizon colour of the sky. */
  fogColor?: number;
};

const MOODS: Record<string, Mood> = {
  morning: {
    label: 'Morning',
    sky: ['#4f9ee0', '#a9d6f2', '#ffe6c8'], hemi: [0xfff0e0, 0x7a8f5e, 1.35], sun: [0xffe2b8, 2.0],
    sunPos: [-12, 7, 5], clouds: 0xfff4ea,
  },
  golden: {
    label: 'Golden hour',
    sky: ['#3a78c8', '#f2b46a', '#ffd89a'], hemi: [0xfff0dc, 0x807050, 1.35], sun: [0xffd49a, 2.2],
    sunPos: [10, 6, 5], clouds: 0xffd8a8, fogColor: 0xf4e2c4,
  },
  sunset: {
    label: 'Sunset',
    sky: ['#2c2a6a', '#e0607a', '#ffb060'], hemi: [0xffdcd0, 0x504060, 1.3], sun: [0xffa880, 2.0],
    sunPos: [12, 4, 4], clouds: 0xf7a0b0, fogColor: 0xf0bca8,
  },
  dusk: {
    label: 'Dusk',
    sky: ['#1a1f4a', '#5a4a8a', '#e08a7a'], hemi: [0xb8b0e0, 0x403850, 1.0], sun: [0xffb0a0, 1.1],
    sunPos: [12, 3, 4], clouds: 0x8a7aa8, lights: true,
  },
  night: {
    label: 'Night',
    sky: ['#070b22', '#16224a', '#2c3a6a'], hemi: [0x9fb0e0, 0x30304a, 0.6], sun: [0xc8d8ff, 0.7],
    sunPos: [-9, 12, 5], clouds: 0x3a4468, stars: true, lights: true, haze: 0.25,
  },
  overcast: {
    label: 'Cloudy',
    sky: ['#8a9aac', '#b8c4cf', '#d8dee4'], hemi: [0xe8eef4, 0x707a70, 1.6], sun: [0xffffff, 1.2],
    clouds: 0xd0d6dc, cloudCount: 40, haze: 0.15,
  },
  rain: {
    label: 'Rain',
    sky: ['#56606e', '#7c8794', '#a4adb6'], hemi: [0xd8e0ea, 0x505a58, 1.5], sun: [0xe0e8f0, 1.0],
    clouds: 0x8a929c, cloudCount: 44, particles: 'rain', haze: 0.3,
  },
  mist: {
    label: 'Misty',
    hemi: [0xf0f6f0, 0x607060, 1.5], sun: [0xffffff, 1.4], haze: 0.45,
  },
};

function mood(id: keyof typeof MOODS, extra: Partial<Mood> = {}): Mood {
  return { ...MOODS[id], ...extra };
}

/** The look of each track, by id. Tracks not listed use their biome as it is. */
const TRACK_MOODS: Record<string, Mood> = {
  'park-2': mood('morning'),
  'park-4': { label: 'Spring', particles: 'petals', leafTint: 0xf2a6c8 },
  'park-5': mood('golden'),
  'park-6': mood('overcast'),
  'park-8': { ...mood('golden'), sky: ['#4a90d8', '#a8d0ec', '#f4e4c8'], label: 'Autumn', particles: 'leaves', leafTint: 0xe08a2a, ground: [0x9ab858, 0x7e9a48, 0xb8c070] },
  'park-9': mood('sunset'),
  'park-10': mood('night'),
  'park-pipe': mood('dusk'),

  'beach-2': mood('morning'),
  'beach-4': mood('golden'),
  'beach-5': { ...mood('overcast'), label: 'Windy', particles: 'dust' },
  'beach-7': mood('sunset'),
  'beach-8': mood('rain'),
  'beach-9': mood('dusk'),
  'beach-10': mood('night'),
  'beach-pipe': mood('golden'),

  // Downtown starts at sunset, so it runs on into the night.
  'rooftops-2': mood('golden'),
  'rooftops-4': mood('dusk'),
  'rooftops-5': mood('night'),
  'rooftops-6': { ...mood('rain'), label: 'Rainy night', sky: ['#0a0e24', '#1e2648', '#3a3a5a'], hemi: [0xa0b0d8, 0x30304a, 0.6], sun: [0xc8d8ff, 0.65], lights: true },
  'rooftops-7': mood('dusk'),
  'rooftops-8': { ...mood('morning'), label: 'Dawn', sky: ['#3a4a8a', '#d890a8', '#ffd0a0'] },
  'rooftops-9': mood('night'),
  'rooftops-10': { ...mood('night'), label: 'Stormy night', clouds: 0x2a3050, cloudCount: 40, particles: 'rain' },
  'rooftops-mega': mood('night'),

  'snow-2': { label: 'Bluebird day', sky: ['#1f78d8', '#7ec0f0', '#e0f2ff'], clouds: null, particles: null },
  'snow-3': { ...mood('overcast'), label: 'Snowing', particles: 'snow' },
  'snow-4': mood('morning', { particles: 'snow' }),
  'snow-5': { ...mood('overcast'), label: 'Heavy snow', particles: 'heavysnow', haze: 0.35 },
  'snow-6': { ...mood('golden'), label: 'Alpenglow', fogColor: 0xf4e8e2 },
  'snow-8': { label: 'Bluebird day', sky: ['#1f78d8', '#7ec0f0', '#e0f2ff'], clouds: null, particles: null },
  'snow-9': { ...mood('sunset'), label: 'Alpenglow', particles: null, fogColor: 0xe8ccd4 },
  'snow-10': { ...mood('night'), label: 'Northern lights', aurora: true, particles: 'snow' },
  'snow-mega': { label: 'Bluebird day', sky: ['#1f78d8', '#7ec0f0', '#e0f2ff'], clouds: null, particles: null },

  'desert-2': mood('morning'),
  'desert-4': { label: 'Heatwave', sky: ['#5aa0d8', '#c8dce4', '#fff0d0'], sun: [0xfff8e0, 2.8], haze: 0.2 },
  'desert-5': mood('golden'),
  'desert-6': {
    label: 'Sandstorm', sky: ['#b88a58', '#d8a870', '#e8c088'], hemi: [0xffe0b0, 0x906040, 1.5], sun: [0xffd8a0, 1.6],
    clouds: 0xc89868, particles: 'dust', haze: 0.45,
  },
  'desert-8': mood('sunset'),
  'desert-9': mood('dusk'),
  'desert-10': mood('night'),
  'desert-mega': mood('sunset'),

  'jungle-2': { ...mood('mist'), label: 'Misty morning', sky: ['#7ab0c8', '#c8e0d8', '#f0f4e8'] },
  'jungle-4': mood('rain'),
  'jungle-5': mood('golden'),
  'jungle-6': mood('mist'),
  'jungle-7': { ...mood('rain'), label: 'Thunderstorm', sky: ['#2a3040', '#4a5464', '#6a7480'], cloudCount: 50 },
  'jungle-9': mood('sunset', { particles: 'fireflies' }),
  'jungle-10': mood('night', { particles: 'fireflies' }),
  'jungle-pipe': mood('golden'),

  'volcano-2': { label: 'Ash fall', sky: ['#2a2426', '#4a3e3c', '#7a6058'], particles: 'ash', haze: 0.15 },
  'volcano-4': { label: 'Eruption', sky: ['#2a0808', '#8a1a10', '#ff6a20'], hemi: [0xffb090, 0x601818, 1.7], eruption: true },
  'volcano-5': { label: 'Night', sky: ['#05040a', '#1a0c14', '#4a1a14'], hemi: [0xe0a090, 0x301018, 0.9], sun: [0xff9060, 1.2], stars: true },
  'volcano-6': { label: 'Ash fall', sky: ['#2a2426', '#4a3e3c', '#7a6058'], particles: 'ash', haze: 0.15 },
  'volcano-8': { label: 'Eruption', sky: ['#2a0808', '#8a1a10', '#ff6a20'], hemi: [0xffb090, 0x601818, 1.7], eruption: true },
  'volcano-9': { label: 'Smoky', sky: ['#3a3032', '#5a4644', '#8a6a5a'], haze: 0.4 },
  'volcano-10': { label: 'Eruption', sky: ['#2a0808', '#8a1a10', '#ff6a20'], hemi: [0xffb090, 0x601818, 1.7], eruption: true },
  'farm-1': mood('morning', { label: 'Morning' }),
  'farm-2': mood('golden'),
  'farm-3': { ...mood('rain'), label: 'Rainy day' },
  'farm-4': { ...mood('morning'), label: 'Morning mist', haze: 0.4, sky: ['#8ab0d0', '#cfdde4', '#f4ead8'] },
  'farm-5': { ...mood('golden'), label: 'Harvest sun', sun: [0xffd090, 2.4], fogColor: 0xf6dcae },
  'farm-6': mood('sunset'),
  'farm-7': { ...mood('overcast'), label: 'Windy', particles: 'leaves', cloudCount: 34 },
  'farm-8': {
    label: 'Harvest moon', sky: ['#0c1030', '#28305a', '#7a5a5a'], hemi: [0xc8b8d8, 0x3a3048, 0.75], sun: [0xffc890, 0.8],
    sunPos: [12, 5, 5], clouds: 0x4a4868, stars: true, lights: true, bigMoon: true, haze: 0.2, fogColor: 0x4a4058,
  },
  'farm-pipe': mood('dusk'),
  'candy-2': { ...mood('morning'), label: 'Sugar morning', sky: ['#7ab8f0', '#c8e4ff', '#ffe0f0'] },
  'candy-3': { ...mood('sunset'), label: 'Candyfloss sunset', sky: ['#6a4ab0', '#ff8ac8', '#ffc8a0'], clouds: 0xffb8e0, fogColor: 0xf8c0d8 },
  'candy-4': { ...mood('golden'), label: 'Golden caramel', sun: [0xffc880, 2.3], fogColor: 0xf8dcb0 },
  'candy-5': { label: 'Candyfloss clouds', clouds: 0xffd0ec, cloudCount: 44 },
  'candy-6': { label: 'Sprinkle shower', particles: 'sprinkles', clouds: 0xfff0f8, cloudCount: 36 },
  'candy-7': { ...mood('dusk'), label: 'Candy dusk', sky: ['#2a1a5a', '#8a4aa8', '#ff9ab8'], clouds: 0xb08ac8 },
  'candy-8': {
    label: 'Night lights', sky: ['#120a30', '#3a1a5a', '#7a3a7a'], hemi: [0xe0b8f0, 0x40304a, 0.8], sun: [0xffc8f0, 0.8],
    sunPos: [-9, 12, 5], clouds: 0x5a3a78, stars: true, lights: true, haze: 0.2, fogColor: 0x4a2a5a,
  },
  'candy-pipe': { ...mood('sunset'), label: 'Candyfloss sunset', sky: ['#6a4ab0', '#ff8ac8', '#ffc8a0'], clouds: 0xffb8e0, fogColor: 0xf8c0d8 },
  'volcano-mega': { label: 'Eruption', sky: ['#2a0808', '#8a1a10', '#ff6a20'], hemi: [0xffb090, 0x601818, 1.7], eruption: true },
};

/** The biome as this track sees it, with its mood applied. */
export function biomeFor(base: Biome, trackId: string): Biome {
  const m = TRACK_MOODS[trackId];
  if (!m) return base;
  const { label, fogColor, ...look } = m;
  const b: Biome = { ...base, ...look, mood: label };
  // Fog takes the colour of the horizon so distant things fade into this sky, not the biome's.
  if (m.sky || fogColor !== undefined) b.fog = [fogColor ?? parseInt(m.sky![2].slice(1), 16), base.fog[1], base.fog[2]];
  if (m.haze) b.fog = [b.fog[0], base.fog[1] * (1 - m.haze), base.fog[2] * (1 - m.haze * 0.8)];
  return b;
}
