import type { Renderer } from '../engine/renderer';

/** A single letter that flies outward and fades away. Purely visual. */
export class Particle {
  x: number;
  y: number;
  private vx: number;
  private vy: number;
  private life: number; // seconds left
  private readonly maxLife: number;
  private readonly char: string;
  private readonly color: string;

  constructor(x: number, y: number, vx: number, vy: number, life: number, char: string, color: string) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.char = char;
    this.color = color;
  }

  get expired(): boolean {
    return this.life <= 0;
  }

  update(dt: number): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    // Air drag: slow down quickly so the burst "pops" and then drifts.
    const drag = Math.max(0, 1 - 4 * dt);
    this.vx *= drag;
    this.vy *= drag;
    this.life -= dt;
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    // Fade out over its lifetime.
    renderer.drawGlyph(this.char, this.color, this.x - camX, this.y - camY, Math.max(0, this.life / this.maxLife));
  }
}
