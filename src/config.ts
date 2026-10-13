// Central place for tunable constants, so balance and look can be tweaked without touching logic.

export const COLORS = {
  background: '#090a1a',
} as const;

export const FONT = {
  family: '"VT323", monospace',
  size: 16, // px, in CSS pixels. Small glyphs are what make dense areas read as "texture".
} as const;

// Ramps go from sparse/light to dense/heavy characters.
export const TREE_RAMP = ['.', ':', 'o', 'O', '0', 'Q', 'W', '@'] as const;
export const GROUND_CHARS = ['.', 'o', '0', 'Q', 'O'] as const;

// Color levels, dark to bright. Brightness encodes density, like in a shaded drawing.
export const TREE_COLORS = ['#27493e', '#35614f', '#4a8068', '#6aa585', '#93cba5', '#c0eac8'] as const;
export const GROUND_COLORS = ['#141b30', '#1b2540', '#25314f'] as const;

export const TERRAIN = {
  noiseScale: 0.0075, // lower = bigger features. Applied to world pixels, so shapes aren't stretched.
  treeThreshold: 0.5, // noise value above which a tree canopy starts
  groundDensity: 0.1, // base chance that an empty cell shows a faint ground glyph
} as const;
