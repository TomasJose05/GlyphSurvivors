import { SCENERY, SCENERY_COLORS } from '../config';
import { mulberry32 } from './rng';
import type { World } from './world';

/** One character of scenery at a world cell. */
export interface SceneryCell {
  col: number;
  row: number;
  char: string;
  color: string;
}

// Hand-drawn sprites. Each row is drawn from the left; a space leaves the ground visible.
// The anchor is the bottom-center of the sprite, so (col, row) is where the trunk meets the ground.
const PINE = ['   ^   ', '  /*\\  ', ' /*o*\\ ', '/*o*o*\\', '  |||  '];
const ROUND = ['  ooo  ', ' o*o*o ', 'o*o*o*o', ' o*o*o ', '   |   '];
const BUSH = [' ooo ', 'o*o*o', '%o*o ']; // the '%' is a little flower
const PLANTS = [PINE, ROUND, BUSH];
const TUFTS = ['"', "'", ',', '"\''];

function colorOf(char: string): string {
  return SCENERY_COLORS[char] ?? '#4f9a68';
}

function addSprite(cells: SceneryCell[], sprite: string[], anchorCol: number, anchorRow: number): void {
  const left = anchorCol - Math.floor(sprite[0].length / 2);
  const top = anchorRow - (sprite.length - 1);
  sprite.forEach((line, r) => {
    for (let c = 0; c < line.length; c++) {
      if (line[c] === ' ') continue;
      cells.push({ col: left + c, row: top + r, char: line[c], color: colorOf(line[c]) });
    }
  });
}

/**
 * Scatters plants over the whole world. Uses a fixed seed, so every run has the same landscape,
 * and it runs once at start-up: the result is baked into the ground image.
 */
export function generateScenery(world: World): SceneryCell[] {
  if (!SCENERY.enabled) return [];
  const rand = mulberry32(1337);
  const cells: SceneryCell[] = [];
  const centerCol = Math.floor(world.cols / 2);
  const centerRow = Math.floor(world.rows / 2);
  const inClearing = (col: number, row: number): boolean =>
    Math.abs(col - centerCol) < SCENERY.spawnClearing.cols && Math.abs(row - centerRow) < SCENERY.spawnClearing.rows;

  const blocksX = Math.ceil(world.cols / SCENERY.blockCols);
  const blocksY = Math.ceil(world.rows / SCENERY.blockRows);

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      const baseCol = bx * SCENERY.blockCols;
      const baseRow = by * SCENERY.blockRows;

      if (rand() < SCENERY.plantChance) {
        const sprite = PLANTS[Math.floor(rand() * PLANTS.length)];
        const col = baseCol + Math.floor(rand() * SCENERY.blockCols);
        const row = baseRow + Math.floor(rand() * SCENERY.blockRows);
        const halfW = Math.ceil(sprite[0].length / 2);
        // Keep whole sprites inside the world (the top of a tall tree needs room above the anchor).
        const fits =
          col - halfW >= 1 && col + halfW <= world.cols - 2 && row - sprite.length >= 1 && row <= world.rows - 2;
        if (fits && !inClearing(col, row)) addSprite(cells, sprite, col, row);
      }

      for (let i = 0; i < SCENERY.tuftsPerBlock; i++) {
        if (rand() >= SCENERY.tuftChance) continue;
        const tuft = TUFTS[Math.floor(rand() * TUFTS.length)];
        const col = baseCol + Math.floor(rand() * SCENERY.blockCols);
        const row = baseRow + Math.floor(rand() * SCENERY.blockRows);
        if (col < 1 || col > world.cols - 3 || row < 1 || row > world.rows - 2 || inClearing(col, row)) continue;
        addSprite(cells, [tuft], col, row);
      }
    }
  }
  return cells;
}
