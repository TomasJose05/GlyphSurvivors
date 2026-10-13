import { COLORS, FONT } from '../config';
import { glyphAt } from '../world/terrain';

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
   * Draw the terrain visible through the camera. (camX, camY) is the world position, in pixels,
   * of the screen's top-left corner. Cells are looked up by world coordinates, so scrolling is free.
   */
  drawTerrain(camX: number, camY: number): void {
    const firstCol = Math.floor(camX / this.cellW);
    const firstRow = Math.floor(camY / this.cellH);
    const cols = Math.ceil(this.width / this.cellW) + 1;
    const rows = Math.ceil(this.height / this.cellH) + 1;

    // Changing fillStyle is comparatively slow, so only do it when the color actually changes.
    let lastColor = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const col = firstCol + c;
        const row = firstRow + r;
        const glyph = glyphAt(col, row, col * this.cellW, row * this.cellH);
        if (!glyph) continue;
        if (glyph.color !== lastColor) {
          this.ctx.fillStyle = glyph.color;
          lastColor = glyph.color;
        }
        this.ctx.fillText(glyph.char, col * this.cellW - camX, row * this.cellH - camY);
      }
    }
  }
}
