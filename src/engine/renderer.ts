import { BORDER_CHAR, COLORS, FONT, GROUND_CHAR } from '../config';
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

  // One small tile of ground dots, repeated across the screen every frame (see buildGroundTile).
  private groundTile: HTMLCanvasElement | null = null;
  private tileCols = 32;
  private tileRows = 16;

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

  /**
   * The ground is the same dot in every cell, so instead of storing an image of the whole world
   * (which would eat memory as the map grows) we pre-render one small tile and repeat it.
   */
  buildGroundTile(world: World): void {
    const tile = document.createElement('canvas');
    this.tileCols = 32;
    this.tileRows = 16;
    tile.width = Math.ceil(this.tileCols * world.cellW * this.dpr);
    tile.height = Math.ceil(this.tileRows * world.cellH * this.dpr);
    const ctx = tile.getContext('2d');
    if (!ctx) throw new Error('2D canvas is not supported');

    ctx.scale(this.dpr, this.dpr);
    ctx.font = `${FONT.size}px ${FONT.family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.gridDot;
    for (let r = 0; r < this.tileRows; r++) {
      for (let c = 0; c < this.tileCols; c++) {
        ctx.fillText(GROUND_CHAR, c * world.cellW + world.cellW / 2, r * world.cellH + world.cellH / 2);
      }
    }
    this.groundTile = tile;
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
   * Draw the part of the ground that the camera sees: the dot tile repeated over the playable area,
   * then the `#` border ring just outside it. (camX, camY) is the world position of the screen's
   * top-left corner.
   */
  drawGround(world: World, camX: number, camY: number): void {
    const tile = this.groundTile;
    if (!tile) return;
    const ctx = this.ctx;
    const tileW = this.tileCols * world.cellW;
    const tileH = this.tileRows * world.cellH;

    // Dots only inside the world: clip to its rectangle (in screen coordinates).
    ctx.save();
    ctx.beginPath();
    ctx.rect(-camX, -camY, world.width, world.height);
    ctx.clip();
    const firstX = Math.floor(camX / tileW) * tileW;
    const firstY = Math.floor(camY / tileH) * tileH;
    for (let y = firstY; y < camY + this.height; y += tileH) {
      for (let x = firstX; x < camX + this.width; x += tileW) {
        // Rounded so neighbouring tiles meet without gaps or blurry seams.
        ctx.drawImage(tile, Math.round(x - camX), Math.round(y - camY), Math.ceil(tileW), Math.ceil(tileH));
      }
    }
    ctx.restore();

    this.drawBorder(world, camX, camY);
  }

  /** The ring of `#` around the world, drawing only the cells that are on screen. */
  private drawBorder(world: World, camX: number, camY: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.border;
    const colFrom = Math.max(-1, Math.floor(camX / world.cellW) - 1);
    const colTo = Math.min(world.cols, Math.ceil((camX + this.width) / world.cellW) + 1);
    const rowFrom = Math.max(-1, Math.floor(camY / world.cellH) - 1);
    const rowTo = Math.min(world.rows, Math.ceil((camY + this.height) / world.cellH) + 1);

    const put = (col: number, row: number): void => {
      ctx.fillText(BORDER_CHAR, col * world.cellW + world.cellW / 2 - camX, row * world.cellH + world.cellH / 2 - camY);
    };
    // Top and bottom rows (only if that edge is visible), then left and right columns.
    if (rowFrom === -1) for (let c = colFrom; c <= colTo; c++) put(c, -1);
    if (rowTo === world.rows) for (let c = colFrom; c <= colTo; c++) put(c, world.rows);
    if (colFrom === -1) for (let r = rowFrom; r <= rowTo; r++) put(-1, r);
    if (colTo === world.cols) for (let r = rowFrom; r <= rowTo; r++) put(world.cols, r);
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
