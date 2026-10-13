import {
  BUSH_COLORS,
  BUSH_RAMP,
  FLOWER_COLORS,
  GRASS_CHARS,
  GRASS_COLORS,
  TREE_COLORS,
  TREE_RAMP,
  TRUNK_COLOR,
} from '../config';

/** One character of a sprite, positioned relative to the sprite's anchor (its base on the ground). */
export interface SpriteCell {
  dc: number; // column offset
  dr: number; // row offset (negative = above the anchor)
  char: string;
  color: string;
}

export type Rand = () => number;

const pick = <T>(list: readonly T[], rand: Rand): T => list[Math.floor(rand() * list.length)];

/**
 * A rounded, lit-from-the-top-left blob of characters. Used for tree canopies and bushes.
 * (rx, ry) are the radii in cells; cells are ~2.5x taller than wide, so rx is scaled up to look round.
 */
function blob(
  rand: Rand,
  rx: number,
  ry: number,
  centerRow: number,
  ramp: readonly string[],
  colors: readonly string[],
): SpriteCell[] {
  const cells: SpriteCell[] = [];
  // Two sine waves along the outline make the silhouette lumpy instead of a perfect ellipse.
  const p1 = rand() * Math.PI * 2;
  const p2 = rand() * Math.PI * 2;

  for (let dr = Math.floor(-ry * 1.3); dr <= Math.ceil(ry * 1.3); dr++) {
    for (let dc = Math.floor(-rx * 1.3); dc <= Math.ceil(rx * 1.3); dc++) {
      const nx = dc / rx;
      const ny = dr / ry;
      const angle = Math.atan2(ny, nx);
      const edge = 1 + 0.15 * Math.sin(3 * angle + p1) + 0.1 * Math.sin(5 * angle + p2);
      const dist = Math.hypot(nx, ny);
      if (dist > edge) continue;

      const depth = 1 - dist / edge; // 0 at the outline, 1 at the center
      if (depth > 0.25 && rand() < 0.07) continue; // small gaps in the foliage

      const light = 0.5 - (nx + ny) * 0.25; // brighter toward the top-left
      const shade = Math.min(0.999, Math.max(0, depth * 0.55 + light * 0.5 + (rand() - 0.5) * 0.3));
      cells.push({
        dc,
        dr: centerRow + dr,
        char: ramp[Math.floor(shade * ramp.length)],
        color: colors[Math.floor(shade * colors.length)],
      });
    }
  }
  return cells;
}

export function buildTree(rand: Rand): SpriteCell[] {
  const ry = 2 + rand() * 2;
  const rx = ry * 2.4;
  const trunkHeight = 1;

  // Trunk first, so the canopy is drawn on top of its upper part.
  const cells: SpriteCell[] = [];
  for (let t = 0; t <= trunkHeight; t++) {
    cells.push({ dc: -1, dr: -t, char: '|', color: TRUNK_COLOR });
    cells.push({ dc: 0, dr: -t, char: '|', color: TRUNK_COLOR });
  }
  cells.push(...blob(rand, rx, ry, -(trunkHeight + Math.round(ry)), TREE_RAMP, TREE_COLORS));
  return cells;
}

export function buildBush(rand: Rand): SpriteCell[] {
  const ry = 1 + rand() * 0.8;
  const rx = ry * 2.6;
  const cells = blob(rand, rx, ry, -1, BUSH_RAMP, BUSH_COLORS);

  // Some bushes have a few flowers.
  if (rand() < 0.3) {
    const flower = pick(FLOWER_COLORS, rand);
    for (let i = 0; i < 1 + Math.floor(rand() * 3); i++) {
      const target = cells[Math.floor(rand() * cells.length)];
      target.char = '*';
      target.color = flower;
    }
  }
  return cells;
}

export function buildTuft(rand: Rand): SpriteCell[] {
  const cells: SpriteCell[] = [];
  const width = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < width; i++) {
    cells.push({ dc: i, dr: 0, char: pick(GRASS_CHARS, rand), color: pick(GRASS_COLORS, rand) });
  }
  return cells;
}
