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

// speed and maxHp are the *starting* values; upgrades change the live copy in `Stats` (systems/stats.ts).
// Decorative trees, bushes and grass drawn into the ground. Purely visual: nothing collides with them.
export const SCENERY = {
  enabled: true,
  blockCols: 14, // the world is split into blocks of this many cells, with at most one big plant each
  blockRows: 7,
  plantChance: 0.4, // chance that a block gets a tree or bush
  tuftsPerBlock: 3, // attempts per block to place a grass tuft
  tuftChance: 0.5,
  spawnClearing: { cols: 12, rows: 6 }, // keep the area around the player's start free of plants
} as const;

// One color per sprite character, so shading is part of the drawing itself.
export const SCENERY_COLORS: Readonly<Record<string, string>> = {
  '^': '#8fd19e', // treetop highlight
  '/': '#2f6b4a', // pine outline
  '\\': '#2f6b4a',
  '*': '#4f9a68', // mid leaves
  o: '#6fb57f', // light leaves
  '|': '#6b4a32', // trunk
  '"': '#3f6b45', // grass
  "'": '#4d7e50',
  ',': '#365b3c',
  '%': '#c46a8a', // flowers
};

// Particles: the burst of letters left when an enemy dies.
export const PARTICLES = {
  perDeath: 8,
  minSpeed: 50, // px per second
  maxSpeed: 170,
  minLife: 0.35, // seconds
  maxLife: 0.8,
  max: 400, // hard cap on live particles
  extraChars: ['.', '*', ',', ';', '+'],
} as const;

export const ENEMY_FLASH = {
  duration: 0.08, // seconds an enemy is drawn in white after being hit
  color: '#ffffff',
} as const;

export const PLAYER = {
  char: '@',
  speed: 180, // px per second
  maxHp: 10,
  radius: 7, // px, used for collisions
  invulnerableTime: 0.7, // seconds of immunity after being hit
} as const;

// Automatic weapon: fires at the nearest enemy in range, no aiming needed.
// interval, damage and range are starting values (see the note on PLAYER); the rest never change.
export const WEAPON = {
  interval: 0.6, // seconds between shots
  damage: 1,
  range: 380, // px; enemies farther than this are ignored
  projectileSpeed: 420, // px per second
  projectileRadius: 6,
  projectileChar: '*',
  projectileColor: '#ffe27a',
} as const;

export interface EnemyType {
  char: string;
  color: string;
  speed: number; // px per second
  hp: number;
  damage: number; // damage dealt to the player on contact
  xp: number; // experience granted when killed
  minTime: number; // seconds into the run before this type can appear
  weight: number; // relative chance of being picked among the types that are unlocked
}

export const ENEMY_RADIUS = 7; // px, used for collisions

// Base stats; hp and damage are multiplied by DIFFICULTY growth as the run goes on.
// `minTime` is when the type starts to appear, so the roster unlocks in phases:
//   z from the start, s (faster) at 1:00, W (tank) at 2:00, v (bat, faster than the player) at 3:00,
//   M (mini-boss, huge hp) at 6:00.
export const ENEMY_TYPES: readonly EnemyType[] = [
  { char: 'z', color: '#9bbf6a', speed: 55, hp: 2, damage: 1, xp: 1, minTime: 0, weight: 6 },
  { char: 's', color: '#d6a45a', speed: 95, hp: 2, damage: 1, xp: 2, minTime: 60, weight: 3 },
  { char: 'W', color: '#c46a6a', speed: 38, hp: 6, damage: 2, xp: 5, minTime: 120, weight: 1.5 },
  { char: 'v', color: '#b58cf0', speed: 210, hp: 1, damage: 1, xp: 2, minTime: 180, weight: 2 },
  { char: 'M', color: '#f07ab0', speed: 30, hp: 40, damage: 3, xp: 25, minTime: 360, weight: 0.3 },
];

// How the run gets harder over time (t = minutes survived). Tuned with a bot, see git history.
export const DIFFICULTY = {
  // Spawn rate (enemies per second) = startRate + rateGrowthPerMinute * t + rateGrowthQuadratic * t^2.
  // The quadratic term keeps the first minutes gentle and makes the late game steep.
  startRate: 0.9,
  rateGrowthPerMinute: 0.4,
  rateGrowthQuadratic: 0.1,
  maxEnemiesStart: 120, // cap on live enemies at the start...
  maxEnemiesPerMinute: 20, // ...growing by this much per minute...
  maxEnemiesCap: 260, // ...never above this (keeps the frame rate and the screen readable)
  // Enemy hp multiplier = 1 + hpGrowthPerMinute * t + hpGrowthQuadratic * t^2.
  hpGrowthPerMinute: 0.15,
  hpGrowthQuadratic: 0.025,
  damageGrowthPerMinute: 0.2, // enemy contact damage multiplier = 1 + this * t (rounded, min 1)
  // Swarms: a ring of enemies that appears around the screen and closes in on the player.
  swarmFirstAt: 90, // seconds
  swarmEvery: 60, // seconds between swarms
  swarmBaseCount: 8,
  swarmExtraPerMinute: 6,
  swarmAlertTime: 2.5, // seconds the "SWARM" warning stays on screen
} as const;

export const PROGRESSION = {
  firstLevelXp: 5, // XP needed to go from level 1 to 2
  extraXpPerLevel: 4, // each following level needs this much more than the previous one...
  extraXpQuadratic: 0.8, // ...plus this times (level - 1)^2, so late levels slow down a lot more
  choicesPerLevelUp: 3,
} as const;

export const HUD = {
  barWidth: 20, // characters
  margin: 16, // px from the screen edge
} as const;

export const SPAWN = {
  margin: 40, // px outside the visible screen where enemies appear
} as const;

// Enemies closer than this (px) push each other apart, so they don't stack into one glyph.
export const ENEMY_SPACING = 12;
