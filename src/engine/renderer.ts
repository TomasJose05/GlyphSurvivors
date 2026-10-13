import { BORDER_CHAR, COLORS, FONT, GROUND_CHAR } from '../config';
import type { SceneryCell } from '../world/scenery';
import type { World } from '../world/world';

/** Draws characters onto a full-window canvas. */
export class Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private dpr = 1;

  // Window size in CSS pixels.
  width = 0;
  height = 0;

  // Size of one character cell, measured from the real font (monospace => all glyphs are equal).
  cellW = 0;
  cellH = 0;

  // The static ground is drawn once into this hidden canvas and then copied each frame.
  private groundCache: HTMLCanvasElement | null = null;

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
    this.dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.applyFont();
  }

  /** Must be called again once the web font has finished loading, since cell size depends on it. */
  applyFont(): void {
    // Resizing a canvas resets its state, so the font is (re)applied here every time.
    this.ctx.font = `${FONT.size}px ${FONT.family}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.cellW = this.ctx.measureText('M').width;
    this.cellH = FONT.size;
  }

  /** Pre-render the whole ground (dots, scenery, border) once. Cell size is fixed, so it never changes. */
  buildGroundCache(world: World, scenery: SceneryCell[]): void {
    const cache = document.createElement('canvas');
    // One extra cell on every side for the border.
    const w = world.width + world.cellW * 2;
    const h = world.height + world.cellH * 2;
    cache.width = Math.ceil(w * this.dpr);
    cache.height = Math.ceil(h * this.dpr);
    const ctx = cache.getContext('2d');
    if (!ctx) throw new Error('2D canvas is not supported');

    ctx.scale(this.dpr, this.dpr);
    ctx.font = `${FONT.size}px ${FONT.family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Cell (c, r) of the cache covers world cell (c - 1, r - 1); the outer ring is the border.
    for (let r = -1; r <= world.rows; r++) {
      for (let c = -1; c <= world.cols; c++) {
        const isBorder = r === -1 || c === -1 || r === world.rows || c === world.cols;
        ctx.fillStyle = isBorder ? COLORS.border : COLORS.gridDot;
        const x = (c + 1) * world.cellW + world.cellW / 2;
        const y = (r + 1) * world.cellH + world.cellH / 2;
        ctx.fillText(isBorder ? BORDER_CHAR : GROUND_CHAR, x, y);
      }
    }

    // Scenery goes on top of the dots. The dot under each plant character is erased first, otherwise
    // it would show through next to the glyph. (Cache cell = world cell + 1 because of the border.)
    for (const cell of scenery) {
      const left = (cell.col + 1) * world.cellW;
      const top = (cell.row + 1) * world.cellH;
      ctx.clearRect(left, top, world.cellW, world.cellH);
      ctx.fillStyle = cell.color;
      ctx.fillText(cell.char, left + world.cellW / 2, top + world.cellH / 2);
    }
    this.groundCache = cache;
  }

  /** Paint the whole canvas with the background color. */
  clear(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // From here on we draw in CSS pixels; the transform handles the DPR scaling.
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /**
   * Draw the part of the ground that the camera sees. (camX, camY) is the world position of the
   * screen's top-left corner. May be negative when the world is smaller than the window.
   */
  drawGround(world: World, camX: number, camY: number): void {
    if (!this.groundCache) return;
    // The cache has a one-cell border margin, hence the offset.
    const sx = camX + world.cellW;
    const sy = camY + world.cellH;
    const dpr = this.dpr;
    // drawImage clips automatically if the source rectangle goes outside the cache.
    this.ctx.drawImage(
      this.groundCache,
      sx * dpr,
      sy * dpr,
      this.width * dpr,
      this.height * dpr,
      0,
      0,
      this.width,
      this.height,
    );
  }

  /** Darken everything drawn so far, e.g. behind a menu. `alpha` is the opacity of the black layer. */
  dim(alpha: number): void {
    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Draw a line of text with its top at a screen position (in CSS pixels). `x` is the left edge,
   * or the right edge when `align` is 'right'.
   */
  drawText(text: string, color: string, x: number, y: number, align: 'left' | 'right' = 'left'): void {
    this.ctx.textAlign = align;
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
    // Back to the defaults that drawGlyph relies on.
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
  }

  /**
   * Draw one character centered on a screen position (in CSS pixels). `alpha` 0..1 makes it
   * see-through; `size` scales the character (2 = twice as big), used for bosses.
   */
  drawGlyph(char: string, color: string, x: number, y: number, alpha = 1, size = 1): void {
    this.ctx.fillStyle = color;
    if (alpha < 1) this.ctx.globalAlpha = alpha;
    if (size !== 1) this.ctx.font = `${FONT.size * size}px ${FONT.family}`;
    this.ctx.fillText(char, x, y);
    if (size !== 1) this.ctx.font = `${FONT.size}px ${FONT.family}`;
    this.ctx.globalAlpha = 1;
  }
}
