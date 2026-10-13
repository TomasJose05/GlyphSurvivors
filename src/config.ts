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
  maxHp: 18,
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

/**
 * How an enemy moves and acts:
 *  - chase:   walk straight at the player
 *  - wave:    walk at the player, weaving left and right on a sine wave (hard to hit)
 *  - swoop:   fly in a straight line across the screen, never turning (comes in flocks)
 *  - shooter: keep some distance and fire at the player
 *  - charger: stop, flash as a warning, then dash in a straight line
 *  - boss:    slow chaser that fires a ring of bullets
 */
export type Behavior = 'chase' | 'wave' | 'swoop' | 'shooter' | 'charger' | 'boss';

export interface EnemyType {
  char: string;
  color: string;
  behavior: Behavior;
  speed: number; // px per second
  hp: number;
  damage: number; // damage dealt to the player on contact (and per bullet, for shooters)
  xp: number; // experience granted when killed
  minTime: number; // seconds into the run before this type can appear
  weight: number; // relative chance of being picked among the types that are unlocked (0 = never random)
  radius?: number; // collision radius in px (default ENEMY_RADIUS)
  size?: number; // how much bigger than a normal character it is drawn (default 1)
  group?: number; // spawns as a flock of this many at once
  ghost?: boolean; // ignores the push-apart between enemies (flocks keep their formation)
  split?: { into: string; count: number }; // on death, spawns `count` enemies of the type with char `into`
  wave?: { amplitude: number; frequency: number }; // wave: sideways swing in px and speed in rad/s
  shoot?: { interval: number; speed: number; range: number; ring?: number }; // shooter/boss: seconds, bullet px/s, max distance; `ring` = bullets per volley
  charge?: { range: number; windup: number; dashTime: number; dashSpeed: number; recover: number };
}

export const ENEMY_RADIUS = 7; // px, used for collisions

// Base stats; hp and damage are multiplied by DIFFICULTY growth as the run goes on.
// `minTime` is when the type starts to appear, so the roster unlocks in phases:
//   z 0:00, w 0:45, s 1:00, v 1:30, W 2:00, a 2:30, c 3:30, O 4:30, and a boss every 2 min from 6:00.
export const ENEMY_TYPES: readonly EnemyType[] = [
  { char: 'z', color: '#9bbf6a', behavior: 'chase', speed: 55, hp: 2, damage: 1, xp: 1, minTime: 0, weight: 6 },
  {
    char: 'w', color: '#6fd3e8', behavior: 'wave', speed: 75, hp: 2, damage: 1, xp: 1, minTime: 45, weight: 3,
    wave: { amplitude: 70, frequency: 2.6 },
  },
  { char: 's', color: '#d6a45a', behavior: 'chase', speed: 95, hp: 2, damage: 1, xp: 2, minTime: 60, weight: 3 },
  {
    char: 'v', color: '#b58cf0', behavior: 'swoop', speed: 230, hp: 1, damage: 1, xp: 1, minTime: 90, weight: 2,
    group: 6, ghost: true,
  },
  { char: 'W', color: '#c46a6a', behavior: 'chase', speed: 38, hp: 6, damage: 2, xp: 5, minTime: 120, weight: 1.5 },
  {
    char: 'a', color: '#6fa8ff', behavior: 'shooter', speed: 62, hp: 3, damage: 1, xp: 3, minTime: 150, weight: 2,
    shoot: { interval: 2.2, speed: 170, range: 520 },
  },
  {
    char: 'c', color: '#ff8a4c', behavior: 'charger', speed: 70, hp: 3, damage: 2, xp: 3, minTime: 210, weight: 1.5,
    charge: { range: 260, windup: 0.7, dashTime: 0.45, dashSpeed: 430, recover: 0.9 },
  },
  {
    char: 'O', color: '#7fe0b0', behavior: 'chase', speed: 45, hp: 8, damage: 2, xp: 4, minTime: 270, weight: 1,
    radius: 9, size: 1.5, split: { into: 'o', count: 3 },
  },
  // Only ever created by splitting an 'O'.
  { char: 'o', color: '#7fe0b0', behavior: 'chase', speed: 85, hp: 2, damage: 1, xp: 1, minTime: Infinity, weight: 0 },
  // Only ever created by the boss schedule (DIFFICULTY.bossFirstAt / bossEvery).
  {
    char: 'M', color: '#f07ab0', behavior: 'boss', speed: 28, hp: 45, damage: 3, xp: 40, minTime: Infinity, weight: 0,
    radius: 14, size: 2.4, shoot: { interval: 3.2, speed: 150, range: 700, ring: 12 },
  },
];

export const ENEMY_SHOT = {
  char: 'o',
  color: '#ff6b5e',
  radius: 5,
  life: 4.5, // seconds before a bullet fades
  maxLive: 160, // hard cap on bullets alive at once
} as const;

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
  hpGrowthQuadratic: 0.03,
  damageGrowthPerMinute: 0.32, // enemy contact damage multiplier = 1 + this * t (rounded, min 1)
  // Swarms: a ring of enemies that appears around the screen and closes in on the player.
  swarmFirstAt: 90, // seconds
  swarmEvery: 60, // seconds between swarms
  swarmBaseCount: 8,
  swarmExtraPerMinute: 6,
  swarmAlertTime: 2.5, // seconds the "SWARM" warning stays on screen
  // Bosses: one 'M' at bossFirstAt and then another every bossEvery seconds.
  bossFirstAt: 360,
  bossEvery: 120,
} as const;

// Bloodthirst upgrade: fraction of max HP recovered per kill, for each level taken. Kept deliberately low;
// it is the only way to heal in the game.
export const LEECH = {
  perLevel: 0.004,
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
