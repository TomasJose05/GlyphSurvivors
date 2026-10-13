import { WEAPON } from '../config';
import type { Renderer } from '../engine/renderer';

export class Projectile {
  x: number;
  y: number;
  readonly damage: number;
  private readonly vx: number;
  private readonly vy: number;
  private life: number; // seconds left before it fades out
  used = false; // set when it hits something; the combat system then removes it

  /**
   * (dirX, dirY) must be a unit vector. The direction is fixed at spawn: shots don't home in.
   * Damage and range are copied at spawn, so an upgrade only affects shots fired afterwards.
   */
  constructor(x: number, y: number, dirX: number, dirY: number, damage: number, range: number) {
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.vx = dirX * WEAPON.projectileSpeed;
    this.vy = dirY * WEAPON.projectileSpeed;
    // It can travel a bit past the weapon's range, so shots at the edge of the range still connect.
    this.life = (range * 1.3) / WEAPON.projectileSpeed;
  }

  get expired(): boolean {
    return this.life <= 0;
  }

  update(dt: number): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    renderer.drawGlyph(WEAPON.projectileChar, WEAPON.projectileColor, this.x - camX, this.y - camY);
  }
}
