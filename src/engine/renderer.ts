import { COLORS, FONT, GROUND_CHAR } from '../config';

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

  /** Fill the screen with a regular grid of ground characters. */
  drawGroundGrid(): void {
    const cols = Math.ceil(this.width / this.cellW);
    const rows = Math.ceil(this.height / this.cellH);
    this.ctx.fillStyle = COLORS.gridDot;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.ctx.fillText(GROUND_CHAR, col * this.cellW, row * this.cellH);
      }
    }
  }
}
