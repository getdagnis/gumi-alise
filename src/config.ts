export type SoundAnimation = 'slow' | 'fast';

export type SoundOption = {
  id: string;
  name: string;
  path: string;
  colorToken: string;
  animation: SoundAnimation;
};

export type CharacterOption = {
  img: string;
  name: string;
};

export const BACKGROUND_IMAGES = ['/bg1.jpg', '/bg2.jpg'];

export const CHARACTERS: CharacterOption[] = [
  { img: '/gumi-1.png', name: 'GUMI' },
  { img: '/gumi-1.png', name: 'GUMI' },
];

const SOUND_COLOR_TOKENS = [
  '--color-mood-tokyo-1',
  '--color-mood-tokyo-2',
  '--color-mood-tokyo-3',
  '--color-mood-tokyo-4',
  '--color-mood-tokyo-5',
  '--color-mood-tokyo-6',
  '--color-mood-tokyo-7',
  '--color-mood-tokyo-8',
  '--color-mood-tokyo-9',
  '--color-mood-tokyo-10',
  '--color-mood-tokyo-11',
] as const;

const BASE_SOUNDS: Omit<SoundOption, 'colorToken'>[] = [
  { id: 'ok', name: 'Ok', path: '/sounds/ok.mp3', animation: 'slow' },
  { id: 'yokune', name: 'Yokune', path: '/sounds/Yokune.mp3', animation: 'slow' },
  {
    id: 'candy-machine',
    name: 'Candy Machine',
    path: '/sounds/candy-machine.mp3',
    animation: 'slow',
  },
  { id: 'cartoon', name: 'Cartoon', path: '/sounds/cartoon.wav', animation: 'slow' },
  {
    id: 'synth-forest',
    name: 'Synth Forest',
    path: '/sounds/synth%20forest.wav',
    animation: 'fast',
  },
  {
    id: 'synth-garden',
    name: 'Synth Garden',
    path: '/sounds/synth%20garden.wav',
    animation: 'fast',
  },
  {
    id: 'synth-grow',
    name: 'Synth Grow',
    path: '/sounds/synth%20grow.wav',
    animation: 'fast',
  },
  {
    id: 'synth-night',
    name: 'Synth Night',
    path: '/sounds/synth%20night.mp3',
    animation: 'fast',
  },
  {
    id: 'synth-rise',
    name: 'Synth Rise',
    path: '/sounds/synth%20rise.wav',
    animation: 'fast',
  },
  {
    id: 'synth-space',
    name: 'Synth Space',
    path: '/sounds/synth%20space.wav',
    animation: 'fast',
  },
  { id: 'oh-boy', name: 'Oh Boy', path: '/sounds/oh-boy.mp3', animation: 'slow' },
  { id: 'fly-me', name: 'Fly Me', path: '/sounds/fly-me.wav', animation: 'slow' },
  { id: 'sad', name: 'Sad', path: '/sounds/sad.mp3', animation: 'slow' },
  { id: 'peace-1', name: 'Peace 1', path: '/sounds/peace1.wav', animation: 'slow' },
  { id: 'drama', name: 'Drama', path: '/sounds/drama.wav', animation: 'slow' },
  { id: 'busy', name: 'Busy', path: '/sounds/busy.wav', animation: 'slow' },
  { id: 'energy', name: 'Energy', path: '/sounds/energy.wav', animation: 'slow' },
  { id: 'grow', name: 'Grow', path: '/sounds/grow.mp3', animation: 'slow' },
  { id: 'kick-1', name: 'Kick 1', path: '/sounds/kick1.wav', animation: 'slow' },
  { id: 'machines', name: 'Machines', path: '/sounds/machines.wav', animation: 'slow' },
  { id: 'noise-1', name: 'Noise 1', path: '/sounds/noise1.wav', animation: 'slow' },
  { id: 'tomorrow', name: 'Tomorrow', path: '/sounds/tomorrow.wav', animation: 'slow' },
  { id: 'alien', name: 'Alien', path: '/sounds/alien.wav', animation: 'slow' },
];

export const SOUNDS: SoundOption[] = BASE_SOUNDS.map((sound, index) => ({
  ...sound,
  colorToken: SOUND_COLOR_TOKENS[index % SOUND_COLOR_TOKENS.length],
}));
