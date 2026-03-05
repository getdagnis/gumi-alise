export type SoundAnimation = 'slow' | 'fast' | 'both';

export type SoundOption = {
  id: string;
  name: string;
  path: string;
  colorToken: string;
  animation: SoundAnimation;
};

type BaseSoundOption = Omit<SoundOption, 'colorToken'>;

export type CharacterOption = {
  id: string;
  name: string;
  img: string;
  mixLabel: string;
  primaryColor: string;
  primaryColorSoft: string;
  dropTargetBottomColor: string;
  dropTargetBottomActiveColor: string;
  sounds: SoundOption[];
};

export const BACKGROUND_IMAGES = ['/bg1.jpg', '/bg2.jpg'];

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
  '--color-mood-tokyo-12',
  '--color-mood-tokyo-13',
  '--color-mood-tokyo-14',
  '--color-mood-tokyo-15',
  '--color-mood-tokyo-16',
  '--color-mood-tokyo-17',
  '--color-mood-tokyo-18',
  '--color-mood-tokyo-19',
  '--color-mood-tokyo-20',
] as const;

const mapSoundColors = (baseSounds: BaseSoundOption[]): SoundOption[] =>
  baseSounds.map((sound, index) => ({
    ...sound,
    colorToken: SOUND_COLOR_TOKENS[index % SOUND_COLOR_TOKENS.length],
  }));

// most common used sounds first. do not reorder alphabetically.
const GUMI_BASE_SOUNDS: BaseSoundOption[] = [
  { id: 'ok', name: 'Ok', path: '/gumi/ok.mp3', animation: 'slow' },
  { id: 'yokune', name: 'Yokune', path: '/gumi/Yokune.mp3', animation: 'slow' },
  { id: 'energy', name: 'Energy', path: '/gumi/energy.wav', animation: 'fast' },
  { id: 'fly-me', name: 'Fly Me', path: '/gumi/fly-me.wav', animation: 'slow' },
  { id: 'grow', name: 'Grow', path: '/gumi/grow.mp3', animation: 'slow' },
  {
    id: 'synth-rise',
    name: 'Synth Rise',
    path: '/gumi/synth%20rise.wav',
    animation: 'fast',
  },
  { id: 'kick-1', name: 'Kick It!', path: '/gumi/kick1.wav', animation: 'fast' },
  { id: 'machines', name: 'Machines', path: '/gumi/machines.wav', animation: 'slow' },
  { id: 'oh-boy', name: 'Oh Boy', path: '/gumi/oh-boy.mp3', animation: 'slow' },
  { id: 'peace-1', name: 'Peace Out', path: '/gumi/peace1.wav', animation: 'slow' },
  { id: 'sad', name: 'Sad', path: '/gumi/sad.mp3', animation: 'slow' },
  { id: 'noise-1', name: 'Noise', path: '/gumi/noise1.wav', animation: 'slow' },
  { id: 'alien', name: 'Alien', path: '/gumi/alien.wav', animation: 'slow' },
  {
    id: 'synth-forest',
    name: 'Synth Forest',
    path: '/gumi/synth%20forest.wav',
    animation: 'fast',
  },
  {
    id: 'synth-garden',
    name: 'Synth Garden',
    path: '/gumi/synth%20garden.wav',
    animation: 'fast',
  },
  { id: 'tomorrow', name: 'Tomorrow', path: '/gumi/tomorrow.wav', animation: 'slow' },
  { id: 'anthenna', name: 'Anthenna', path: '/gumi/anthenna.wav', animation: 'fast' },
  { id: 'busy', name: 'Busy', path: '/gumi/busy.wav', animation: 'slow' },
  {
    id: 'candy-machine',
    name: 'Synth Candy',
    path: '/gumi/candy-machine.mp3',
    animation: 'slow',
  },
  { id: 'cartoon', name: 'Cartoon', path: '/gumi/cartoon.wav', animation: 'slow' },
  { id: 'drama', name: 'Drama', path: '/gumi/drama.wav', animation: 'slow' },
  {
    id: 'synth-grow',
    name: 'Synth Grow',
    path: '/gumi/synth%20grow.wav',
    animation: 'fast',
  },
  {
    id: 'synth-night',
    name: 'Synth Night',
    path: '/gumi/synth%20night.mp3',
    animation: 'fast',
  },
  {
    id: 'synth-space',
    name: 'Synth Space',
    path: '/gumi/synth%20space.wav',
    animation: 'fast',
  },
  { id: 'alert', name: 'Alert', path: '/gumi/alert.wav', animation: 'slow' },
];

const HANAKO_BASE_SOUNDS: BaseSoundOption[] = [
  { id: 'beat-1', name: 'Beat 1', path: '/hanako/beat1.mp3', animation: 'fast' },
  { id: 'beat-2', name: 'Beat 2', path: '/hanako/beat2.mp3', animation: 'fast' },
  { id: 'beat-3', name: 'Beat 3', path: '/hanako/beat3.mp3', animation: 'fast' },
  { id: 'beat-4', name: 'Beat 4', path: '/hanako/beat4.mp3', animation: 'fast' },
  { id: 'choir', name: 'Choir', path: '/hanako/choir.mp3', animation: 'slow' },
  { id: 'christmas', name: 'Christmas', path: '/hanako/christmas.mp3', animation: 'slow' },
  { id: 'cow', name: 'Cow', path: '/hanako/cow.mp3', animation: 'slow' },
  { id: 'cry', name: 'Cry', path: '/hanako/cry.mp3', animation: 'slow' },
  { id: 'drums-1', name: 'Drums 1', path: '/hanako/drums1.mp3', animation: 'fast' },
  { id: 'drums-2', name: 'Drums 2', path: '/hanako/drums2.mp3', animation: 'fast' },
  { id: 'giggle', name: 'Giggle', path: '/hanako/giggle.mp3', animation: 'slow' },
  { id: 'goat', name: 'Goat', path: '/hanako/goat.mp3', animation: 'slow' },
  { id: 'guitar', name: 'Guitar', path: '/hanako/guitar.mp3', animation: 'slow' },
  { id: 'horror', name: 'Horror', path: '/hanako/horror.mp3', animation: 'fast' },
  { id: 'laugh', name: 'Laugh', path: '/hanako/laugh.mp3', animation: 'slow' },
  { id: 'laugh-2', name: 'Laugh 2', path: '/hanako/laugh2.mp3', animation: 'slow' },
  { id: 'laugh-3', name: 'Laugh 3', path: '/hanako/laugh3.mp3', animation: 'slow' },
  { id: 'monks', name: 'Monks', path: '/hanako/monks.mp3', animation: 'slow' },
  { id: 'polyphon', name: 'Polyphon', path: '/hanako/polyphon.mp3', animation: 'slow' },
  { id: 'trombone', name: 'Trombone', path: '/hanako/trombone.mp3', animation: 'slow' },
  { id: 'violins', name: 'Violins', path: '/hanako/violins.mp3', animation: 'slow' },
  { id: 'applause', name: 'Applause', path: '/hanako/applause.mp3', animation: 'slow' },
];

export const SOUNDS = {
  gumi: mapSoundColors(GUMI_BASE_SOUNDS),
  hanako: mapSoundColors(HANAKO_BASE_SOUNDS),
} as const;

export const CHARACTERS: CharacterOption[] = [
  {
    id: 'gumi',
    name: 'GUMI',
    img: '/gumi-1.png',
    mixLabel: "Gumi's Mix!",
    primaryColor: '#6ede3e',
    primaryColorSoft: '#234315a1',
    dropTargetBottomColor: '#5dc630cc',
    dropTargetBottomActiveColor: '#14562800',
    sounds: SOUNDS.gumi,
  },
  {
    id: 'hanako',
    name: 'Hanako Kun',
    img: '/hanako-1.png',
    mixLabel: "Hanako's Mix!",
    primaryColor: '#e4003a',
    primaryColorSoft: '#401521c0',
    dropTargetBottomColor: '#e4003acc',
    dropTargetBottomActiveColor: '#5a001c',
    sounds: SOUNDS.hanako,
  },
];
