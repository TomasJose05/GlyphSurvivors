import type { EnemyType } from '../config';
import type { Renderer } from '../engine/renderer';

export class Enemy {
  // Position in world pixels (the center of the character).
  x: number;
  y: number;
  readonly type: EnemyType;

  constructor(type: EnemyType, x: number, y: number) {
    this.type = type;
    this.x = x;
    this.y = y;
  }

  /** Walk in a straight line toward the target. `dt` is in seconds. */
  update(dt: number, targetX: number, targetY: number): void {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.001) return; // already on top of the target; avoid dividing by ~0
    const step = this.type.speed * dt;
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    renderer.drawGlyph(this.type.char, this.type.color, this.x - camX, this.y - camY);
  }
}
