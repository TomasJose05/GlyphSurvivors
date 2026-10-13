import { COLORS, DECOR, FONT, GROUND_CHAR } from '../config';
import { getBlock, type Decoration } from '../world/decorations';
import { hash2 } from '../world/rng';

/**
 * Draws characters onto a full-window canvas.
 * The "grid" is only used for the background; later entities move freely in pixels.
 */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;

  // Size of one character cell, measured from the real font (monospace => all glyphs are equal).
  cellW = 0;
  cellH = 0;

  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas is not supported');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /** Match the canvas to the window, scaled by devicePixelRatio so text stays sharp on HiDPI screens. */
  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    // From here on we draw in CSS pixels; the transform handles the DPR scaling.
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.applyFont();
  }

  /** Must be called again once the web font has finished loading, since cell size depends on it. */
  applyFont(): void {
    this.ctx.font = `${FONT.size}px ${FONT.family}`;
    this.ctx.textBaseline = 'top';
    this.cellW = this.ctx.measureText('M').width;
    this.cellH = FONT.size;
  }

  /** Paint the whole canvas with the background color. */
  clear(): void {
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }


  /**
   * Draw the world visible through the camera. (camX, camY) is the world position, in pixels,
   * of the screen's top-left corner. Everything is looked up by world coordinates, so scrolling is free.
   */
  drawWorld(camX: number, camY: number): void {
    const firstCol = Math.floor(camX / this.cellW);
    const firstRow = Math.floor(camY / this.cellH);
    const cols = Math.ceil(this.width / this.cellW) + 1;
    const rows = Math.ceil(this.height / this.cellH) + 1;

    // Changing fillStyle is comparatively slow, so only do it when the color actually changes.
    let lastColor = '';
    const put = (char: string, color: string, col: number, row: number): void => {
      if (color !== lastColor) {
        this.ctx.fillStyle = color;
        lastColor = color;
      }
      this.ctx.fillText(char, col * this.cellW - camX, row * this.cellH - camY);
    };

    // 1. Ground: a regular grid of dots, with a few slightly brighter ones scattered in.
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const col = firstCol + c;
        const row = firstRow + r;
        const accent = hash2(col, row) < 0.03;
        put(GROUND_CHAR, accent ? COLORS.groundAccent : COLORS.groundDot, col, row);
      }
    }

    // 2. Decorations. Sprites reach up to ~14 rows above and ~16 columns beside their anchor,
    // so we also draw blocks just outside the screen: 1 extra block sideways, 2 extra below.
    const bx0 = Math.floor(firstCol / DECOR.blockCols) - 1;
    const bx1 = Math.floor((firstCol + cols) / DECOR.blockCols) + 1;
    const by0 = Math.floor(firstRow / DECOR.blockRows) - 1;
    const by1 = Math.floor((firstRow + rows) / DECOR.blockRows) + 2;

    const visible: Decoration[] = [];
    for (let by = by0; by <= by1; by++) {
      for (let bx = bx0; bx <= bx1; bx++) visible.push(...getBlock(bx, by));
    }
    // Sorted by anchor row so things lower on screen are drawn later, i.e. in front.
    visible.sort((a, b) => a.row - b.row);

    for (const deco of visible) {
      for (const cell of deco.cells) {
        put(cell.char, cell.color, deco.col + cell.dc, deco.row + cell.dr);
      }
    }
  }
}
