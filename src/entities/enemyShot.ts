import { ENEMY_SHOT } from '../config';
import type { Renderer } from '../engine/renderer';

/** A bullet fired by an enemy. It flies straight and hurts the player on contact. */
export class EnemyShot {
  x: number;
  y: number;
  readonly damage: number;
  private readonly vx: number;
  private readonly vy: number;
  private life: number = ENEMY_SHOT.life;
  used = false; // set when it hits the player; the combat system then removes it

  /** (dirX, dirY) must be a unit vector. */
  constructor(x: number, y: number, dirX: number, dirY: number, speed: number, damage: number) {
    this.x = x;
    this.y = y;
    this.vx = dirX * speed;
    this.vy = dirY * speed;
    this.damage = damage;
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
    renderer.drawGlyph(ENEMY_SHOT.char, ENEMY_SHOT.color, this.x - camX, this.y - camY);
  }
}
