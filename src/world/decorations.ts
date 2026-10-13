import { DECOR } from '../config';
import { hash2, mulberry32 } from './rng';
import { buildBush, buildTree, buildTuft, type SpriteCell } from './sprites';

/** A sprite placed in the world. (col, row) is the cell where its base touches the ground. */
export interface Decoration {
  col: number;
  row: number;
  cells: SpriteCell[];
}

const cache = new Map<string, Decoration[]>();

/**
 * Decorations for one block of the world. The block's coordinates are the only seed, so the same
 * block always produces the same trees/bushes/grass, and blocks are generated lazily and cached.
 */
export function getBlock(bx: number, by: number): Decoration[] {
  const key = `${bx},${by}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const rand = mulberry32(Math.floor(hash2(bx, by) * 4294967296));
  // A coarse hash (one value per 3x3 blocks) makes forests and meadows instead of uniform scatter.
  const forest = hash2(Math.floor(bx / 3) + 1000, Math.floor(by / 3) + 1000);

  const decorations: Decoration[] = [];
  const place = (cells: SpriteCell[]): void => {
    decorations.push({
      col: bx * DECOR.blockCols + Math.floor(rand() * DECOR.blockCols),
      row: by * DECOR.blockRows + Math.floor(rand() * DECOR.blockRows),
      cells,
    });
  };

  for (let i = 0; i < 2; i++) if (rand() < forest * 0.7) place(buildTree(rand));
  for (let i = 0; i < 3; i++) if (rand() < 0.3 + forest * 0.2) place(buildBush(rand));
  for (let i = 0; i < 5; i++) if (rand() < 0.6) place(buildTuft(rand));

  cache.set(key, decorations);
  return decorations;
}
