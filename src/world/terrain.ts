import { GROUND_CHARS, GROUND_COLORS, TERRAIN, TREE_COLORS, TREE_RAMP } from '../config';
import { fbm, hash2 } from './noise';

export interface Glyph {
  char: string;
  color: string;
}

/**
 * Decides what to draw in one cell of the world. Pure function of (col, row), so the map is
 * "infinite" in memory terms: nothing is stored, any cell can be computed on demand.
 * `px`/`py` are the cell's position in world pixels, used so noise isn't stretched by non-square cells.
 */
export function glyphAt(col: number, row: number, px: number, py: number): Glyph | null {
  const jitter = hash2(col, row);

  // Tree canopies: big noise blobs, with a finer noise carving dark holes inside them.
  const canopy = fbm(px * TERRAIN.noiseScale, py * TERRAIN.noiseScale, 4);
  if (canopy > TERRAIN.treeThreshold) {
    const holes = fbm(px * 0.06 + 500, py * 0.06 + 500, 2);
    const density = ((canopy - TERRAIN.treeThreshold) / (1 - TERRAIN.treeThreshold)) * (0.5 + holes);
    if (density > 0.08 && jitter < 0.7 + density) {
      const level = Math.min(TREE_RAMP.length - 1, Math.floor((density + jitter * 0.25) * TREE_RAMP.length));
      const shade = Math.min(TREE_COLORS.length - 1, Math.floor(density * TREE_COLORS.length * 1.1));
      return { char: TREE_RAMP[level], color: TREE_COLORS[shade] };
    }
  }

  // Ground: sparse faint glyphs, clustered by a lower-frequency noise so they form patches.
  const patch = fbm(px * 0.006 + 90, py * 0.006 + 90, 2);
  if (jitter < TERRAIN.groundDensity + patch * patch * 0.5) {
    const char = GROUND_CHARS[Math.floor(hash2(col + 7, row + 13) * GROUND_CHARS.length)];
    const color = GROUND_COLORS[Math.floor(hash2(col + 31, row + 3) * GROUND_COLORS.length)];
    return { char, color };
  }

  return null;
}
