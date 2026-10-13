// Maps physical keys (KeyboardEvent.code) to a direction. Using `code` instead of `key`
// means WASD works the same on any keyboard layout.
const LEFT = ['KeyA', 'ArrowLeft'];
const RIGHT = ['KeyD', 'ArrowRight'];
const UP = ['KeyW', 'ArrowUp'];
const DOWN = ['KeyS', 'ArrowDown'];
const GAME_KEYS = [...LEFT, ...RIGHT, ...UP, ...DOWN];

// The event queues below are drained by the game; the cap keeps them from growing if nobody reads them.
const MAX_QUEUED = 16;

export interface Point {
  x: number;
  y: number;
}

/** Tracks held keys (for movement) plus one-off key presses and clicks (for menus). */
export class Input {
  private readonly held = new Set<string>();
  private readonly pressed: string[] = [];
  private readonly clicks: Point[] = [];

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (GAME_KEYS.includes(e.code)) {
        e.preventDefault(); // stop the arrow keys from scrolling the page
        this.held.add(e.code);
      }
      // `repeat` is true while a key is held down; we only want the initial press.
      if (!e.repeat) this.push(this.pressed, e.code);
    });
    window.addEventListener('keyup', (e) => this.held.delete(e.code));
    // If the window loses focus we never get the keyup, so forget everything to avoid a "stuck" key.
    window.addEventListener('blur', () => this.held.clear());
    // The canvas fills the window, so client coordinates are the same as canvas coordinates.
    window.addEventListener('mousedown', (e) => this.push(this.clicks, { x: e.clientX, y: e.clientY }));
  }

  private push<T>(queue: T[], item: T): void {
    queue.push(item);
    if (queue.length > MAX_QUEUED) queue.shift();
  }

  private any(codes: string[]): boolean {
    return codes.some((code) => this.held.has(code));
  }

  /** Direction in [-1, 1] on each axis. Diagonals are normalized so they aren't faster. */
  axis(): { x: number; y: number } {
    const x = (this.any(RIGHT) ? 1 : 0) - (this.any(LEFT) ? 1 : 0);
    const y = (this.any(DOWN) ? 1 : 0) - (this.any(UP) ? 1 : 0);
    if (x !== 0 && y !== 0) {
      const inv = Math.SQRT1_2; // 1 / sqrt(2)
      return { x: x * inv, y: y * inv };
    }
    return { x, y };
  }

  /** Key presses since the last call, oldest first. Reading them empties the queue. */
  takePressed(): string[] {
    return this.pressed.splice(0);
  }

  /** Mouse clicks since the last call, oldest first. Reading them empties the queue. */
  takeClicks(): Point[] {
    return this.clicks.splice(0);
  }
}
