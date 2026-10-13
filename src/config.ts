// Central place for tunable constants, so balance and look can be tweaked without touching logic.

export const COLORS = {
  background: '#090a1a',
  groundDot: '#1d2744',
  groundAccent: '#26335a',
} as const;

export const FONT = {
  family: '"VT323", monospace',
  size: 16, // px, in CSS pixels
} as const;

export const GROUND_CHAR = '.';

// Ramps go from light/sparse to heavy/dense characters; colors go from dark to bright.
// A canopy is shaded like a drawing: bright and heavy where light hits, dark and light at the edges.
export const TREE_RAMP = ['.', ':', 'o', 'O', '0', 'Q', 'W', '@'] as const;
export const TREE_COLORS = ['#27493e', '#35614f', '#4a8068', '#6aa585', '#93cba5', '#c0eac8'] as const;
export const TRUNK_COLOR = '#6b4a32';

export const BUSH_RAMP = ['"', 'o', '%', 'O', '8'] as const;
export const BUSH_COLORS = ['#3d5a2e', '#55792f', '#6f9a3c', '#8cb94d'] as const;
export const FLOWER_COLORS = ['#e0678c', '#e8c25a', '#9b8cf0'] as const;

export const GRASS_CHARS = ['"', "'", ',', ';'] as const;
export const GRASS_COLORS = ['#2f4a35', '#3b5c3d', '#486e45'] as const;

// World decorations are generated per block of cells, so nothing needs to be stored or loaded.
export const DECOR = {
  blockCols: 22,
  blockRows: 11,
} as const;
