import { ENEMY_RADIUS, PLAYER, WEAPON } from '../config';
import type { Renderer } from '../engine/renderer';
import type { Enemy } from '../entities/enemy';
import type { Player } from '../entities/player';
import { Projectile } from '../entities/projectile';

/** Handles the auto-fire weapon, projectile hits and enemy contact damage. */
export class Combat {
  private readonly projectiles: Projectile[] = [];
  private cooldown = 0; // seconds until the weapon can fire again

  update(dt: number, player: Player, enemies: Enemy[]): void {
    this.fire(dt, player, enemies);
    this.moveProjectiles(dt, enemies);
    this.contactDamage(player, enemies);
    removeWhere(enemies, (e) => e.dead);
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    for (const p of this.projectiles) p.draw(renderer, camX, camY);
  }

  private fire(dt: number, player: Player, enemies: Enemy[]): void {
    this.cooldown -= dt;
    if (this.cooldown > 0) return;

    const target = nearest(player, enemies, WEAPON.range);
    // No target: leave the cooldown at <= 0 so we shoot the moment one comes into range.
    if (!target) return;

    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.projectiles.push(new Projectile(player.x, player.y, dx / dist, dy / dist));
    this.cooldown = WEAPON.interval;
  }

  private moveProjectiles(dt: number, enemies: Enemy[]): void {
    const reach = WEAPON.projectileRadius + ENEMY_RADIUS;
    for (const p of this.projectiles) {
      p.update(dt);
      for (const enemy of enemies) {
        if (enemy.dead) continue; // already killed by another shot this frame
        if (Math.hypot(enemy.x - p.x, enemy.y - p.y) < reach) {
          enemy.hp -= WEAPON.damage;
          p.used = true;
          break; // a projectile hits one enemy at most
        }
      }
    }
    removeWhere(this.projectiles, (p) => p.used || p.expired);
  }

  private contactDamage(player: Player, enemies: Enemy[]): void {
    const reach = PLAYER.radius + ENEMY_RADIUS;
    for (const enemy of enemies) {
      if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < reach) {
        player.takeDamage(enemy.type.damage);
      }
    }
  }
}

/** The closest enemy to the player within `range` pixels, or null if there is none. */
function nearest(player: Player, enemies: Enemy[], range: number): Enemy | null {
  let best: Enemy | null = null;
  let bestDist = range;
  for (const enemy of enemies) {
    const d = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (d < bestDist) {
      bestDist = d;
      best = enemy;
    }
  }
  return best;
}

/** Removes matching items in place. Walks backwards so removing doesn't skip the next element. */
function removeWhere<T>(list: T[], test: (item: T) => boolean): void {
  for (let i = list.length - 1; i >= 0; i--) {
    if (test(list[i])) list.splice(i, 1);
  }
}
