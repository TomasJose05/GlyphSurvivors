// Central place for tunable constants, so balance and look can be tweaked without touching logic.

export const COLORS = {
  background: '#0b0d10',
  gridDot: '#2c3a45',
  border: '#4a5d6b',
  player: '#e8f0ff',
} as const;

export const FONT = {
  family: '"VT323", monospace',
  size: 20, // px, in CSS pixels
} as const;

// Character used to draw the empty ground and the world's border.
export const GROUND_CHAR = '.';
export const BORDER_CHAR = '#';

// The world is finite. Its size is given in character cells; pixel size is derived from the font.
export const WORLD = {
  cols: 240,
  rows: 90,
} as const;

export const PLAYER = {
  char: '@',
  speed: 180, // px per second
} as const;

export interface EnemyType {
  char: string;
  color: string;
  speed: number; // px per second
  minTime: number; // seconds into the run before this type can appear
  weight: number; // relative chance of being picked among the types that are unlocked
}

// Enemies must be slower than the player (180) so the player can always kite them.
export const ENEMY_TYPES: readonly EnemyType[] = [
  { char: 'z', color: '#9bbf6a', speed: 55, minTime: 0, weight: 6 },
  { char: 's', color: '#d6a45a', speed: 95, minTime: 20, weight: 3 },
  { char: 'W', color: '#c46a6a', speed: 38, minTime: 45, weight: 1 },
];

export const SPAWN = {
  startInterval: 1.2, // seconds between spawns at the start of a run
  minInterval: 0.25, // never spawn faster than this
  rampPerSecond: 0.012, // how much the interval shrinks for every second survived
  maxEnemies: 150, // hard cap, keeps the frame rate and the screen readable
  margin: 40, // px outside the visible screen where enemies appear
} as const;

// Enemies closer than this (px) push each other apart, so they don't stack into one glyph.
export const ENEMY_SPACING = 12;
