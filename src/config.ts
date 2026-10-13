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
