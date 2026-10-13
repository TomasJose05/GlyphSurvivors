import { WORLD } from '../config';

/** The playable area: a finite rectangle measured in character cells, with helpers in pixels. */
export class World {
  readonly cols = WORLD.cols;
  readonly rows = WORLD.rows;
  readonly cellW: number;
  readonly cellH: number;

  constructor(cellW: number, cellH: number) {
    this.cellW = cellW;
    this.cellH = cellH;
  }

  get width(): number {
    return this.cols * this.cellW;
  }

  get height(): number {
    return this.rows * this.cellH;
  }
}
