import { ENEMY_FLASH, type EnemyType } from '../config';
import type { Renderer } from '../engine/renderer';

export class Enemy {
  // Position in world pixels (the center of the character).
  x: number;
  y: number;
  hp: number;
  readonly damage: number; // contact damage, already scaled by how late in the run it spawned
  flash = 0; // seconds left of the white "I was hit" flash
  readonly type: EnemyType;

  /** `hpMult` and `damageMult` are the time-based difficulty scaling applied when it spawns. */
  constructor(type: EnemyType, x: number, y: number, hpMult = 1, damageMult = 1) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.hp = type.hp * hpMult;
    this.damage = Math.max(1, Math.round(type.damage * damageMult));
  }

  get dead(): boolean {
    return this.hp <= 0;
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    this.flash = ENEMY_FLASH.duration;
  }

  /** Walk in a straight line toward the target. `dt` is in seconds. */
  update(dt: number, targetX: number, targetY: number): void {
    this.flash = Math.max(0, this.flash - dt);
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.001) return; // already on top of the target; avoid dividing by ~0
    const step = this.type.speed * dt;
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    const color = this.flash > 0 ? ENEMY_FLASH.color : this.type.color;
    renderer.drawGlyph(this.type.char, color, this.x - camX, this.y - camY);
  }
}
