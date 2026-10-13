// Maps physical keys (KeyboardEvent.code) to a direction. Using `code` instead of `key`
// means WASD works the same on any keyboard layout.
const LEFT = ['KeyA', 'ArrowLeft'];
const RIGHT = ['KeyD', 'ArrowRight'];
const UP = ['KeyW', 'ArrowUp'];
const DOWN = ['KeyS', 'ArrowDown'];
const GAME_KEYS = [...LEFT, ...RIGHT, ...UP, ...DOWN];

/** Tracks which keys are currently held down and turns them into a movement direction. */
export class Input {
  private readonly held = new Set<string>();

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (GAME_KEYS.includes(e.code)) {
        e.preventDefault(); // stop the arrow keys from scrolling the page
        this.held.add(e.code);
      }
    });
    window.addEventListener('keyup', (e) => this.held.delete(e.code));
    // If the window loses focus we never get the keyup, so forget everything to avoid a "stuck" key.
    window.addEventListener('blur', () => this.held.clear());
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
}
