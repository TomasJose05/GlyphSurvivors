import { COLORS, PLAYER } from '../config';
import type { Input } from '../engine/input';
import type { Renderer } from '../engine/renderer';
import type { Stats } from '../systems/stats';
import type { World } from '../world/world';

export class Player {
  // Position in world pixels (the center of the character). Movement is free, not tied to the grid.
  x: number;
  y: number;
  hp: number;
  readonly stats: Stats;
  private invulnerable = 0; // seconds of immunity left

  constructor(x: number, y: number, stats: Stats) {
    this.x = x;
    this.y = y;
    this.stats = stats;
    this.hp = stats.maxHp;
  }

  get dead(): boolean {
    return this.hp <= 0;
  }

  /** Deals damage unless the player is in the immunity window that follows every hit. */
  takeDamage(amount: number): void {
    if (this.invulnerable > 0 || this.dead) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnerable = PLAYER.invulnerableTime;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.stats.maxHp, this.hp + amount);
  }

  /** `dt` is the time since the last frame in seconds, so speed is the same at any frame rate. */
  update(dt: number, input: Input, world: World): void {
    this.invulnerable = Math.max(0, this.invulnerable - dt);

    const dir = input.axis();
    this.x += dir.x * this.stats.moveSpeed * dt;
    this.y += dir.y * this.stats.moveSpeed * dt;

    // Keep the player inside the world, a half cell away from the edges.
    const halfW = world.cellW / 2;
    const halfH = world.cellH / 2;
    this.x = Math.min(Math.max(this.x, halfW), world.width - halfW);
    this.y = Math.min(Math.max(this.y, halfH), world.height - halfH);
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    // While immune, blink (hidden every other 0.1s) so the hit is visible and the immunity readable.
    if (this.invulnerable > 0 && Math.floor(this.invulnerable * 10) % 2 === 0) return;
    renderer.drawGlyph(PLAYER.char, COLORS.player, this.x - camX, this.y - camY);
  }
}
