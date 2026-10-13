import type { Renderer } from '../engine/renderer';
import type { Enemy } from '../entities/enemy';

/** A bullet fired by a player weapon. Flies straight, can pass through a number of enemies. */
export class PlayerProjectile {
  x: number;
  y: number;
  private readonly vx: number;
  private readonly vy: number;
  private life: number; // seconds left
  readonly damage: number;
  readonly pierce: number; // how many enemies it can pass through before it stops (0 = stops at the first)
  readonly radius: number;
  readonly char: string;
  readonly color: string;
  readonly hit = new Set<Enemy>(); // enemies already damaged, so a piercing shot doesn't hit one twice
  used = false;

  /** (dirX, dirY) must be a unit vector. */
  constructor(
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    speed: number,
    damage: number,
    range: number,
    pierce: number,
    radius: number,
    char: string,
    color: string,
  ) {
    this.x = x;
    this.y = y;
    this.vx = dirX * speed;
    this.vy = dirY * speed;
    this.damage = damage;
    this.pierce = pierce;
    this.radius = radius;
    this.char = char;
    this.color = color;
    // It can fly a bit past the nominal range, so shots at the edge of the range still connect.
    this.life = (range * 1.3) / speed;
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
    renderer.drawGlyph(this.char, this.color, this.x - camX, this.y - camY);
  }
}

/** Moves every projectile, damages what they touch and drops the ones that are spent. */
export function stepProjectiles(list: PlayerProjectile[], dt: number, enemies: Enemy[]): void {
  for (const p of list) {
    p.update(dt);
    for (const enemy of enemies) {
      if (enemy.dead || p.hit.has(enemy)) continue;
      if (Math.hypot(enemy.x - p.x, enemy.y - p.y) < p.radius + enemy.radius) {
        enemy.takeDamage(p.damage);
        p.hit.add(enemy);
        if (p.hit.size > p.pierce) {
          p.used = true;
          break;
        }
      }
    }
  }
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].used || list[i].expired) list.splice(i, 1);
  }
}
