import { ENEMY_RADIUS, PLAYER, WEAPON } from '../config';
import type { Renderer } from '../engine/renderer';
import type { Enemy } from '../entities/enemy';
import type { Player } from '../entities/player';
import { Projectile } from '../entities/projectile';

// Extra projectiles that have no separate enemy to aim at fan out around the main shot by this angle.
const SPREAD_ANGLE = 0.14; // radians (~8 degrees)

/** Handles the auto-fire weapon, projectile hits and enemy contact damage. */
export class Combat {
  private readonly projectiles: Projectile[] = [];
  private cooldown = 0; // seconds until the weapon can fire again

  /** Advances combat by one frame and returns the enemies that died during it. */
  update(dt: number, player: Player, enemies: Enemy[]): Enemy[] {
    this.fire(dt, player, enemies);
    this.moveProjectiles(dt, enemies);
    this.contactDamage(player, enemies);
    return removeWhere(enemies, (e) => e.dead);
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    for (const p of this.projectiles) p.draw(renderer, camX, camY);
  }

  private fire(dt: number, player: Player, enemies: Enemy[]): void {
    this.cooldown -= dt;
    if (this.cooldown > 0) return;

    const { projectiles: count, range, damage, fireInterval } = player.stats;
    const targets = nearest(player, enemies, range, count);
    // No target: leave the cooldown at <= 0 so we shoot the moment one comes into range.
    if (targets.length === 0) return;

    for (let i = 0; i < count; i++) {
      // Each projectile gets its own target while there are enough enemies; the rest fan out
      // around the nearest one, alternating left/right with a growing angle.
      let angle = 0;
      let target = targets[i];
      if (!target) {
        target = targets[0];
        const extra = i - targets.length; // 0, 1, 2...
        angle = (extra % 2 === 0 ? 1 : -1) * SPREAD_ANGLE * (Math.floor(extra / 2) + 1);
      }
      const base = Math.atan2(target.y - player.y, target.x - player.x);
      const dirX = Math.cos(base + angle);
      const dirY = Math.sin(base + angle);
      this.projectiles.push(new Projectile(player.x, player.y, dirX, dirY, damage, range));
    }
    this.cooldown = fireInterval;
  }

  private moveProjectiles(dt: number, enemies: Enemy[]): void {
    const reach = WEAPON.projectileRadius + ENEMY_RADIUS;
    for (const p of this.projectiles) {
      p.update(dt);
      for (const enemy of enemies) {
        if (enemy.dead) continue; // already killed by another shot this frame
        if (Math.hypot(enemy.x - p.x, enemy.y - p.y) < reach) {
          enemy.takeDamage(p.damage);
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

/** Up to `count` enemies within `range` pixels of the player, closest first. */
function nearest(player: Player, enemies: Enemy[], range: number, count: number): Enemy[] {
  const inRange: { enemy: Enemy; dist: number }[] = [];
  for (const enemy of enemies) {
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (dist < range) inRange.push({ enemy, dist });
  }
  inRange.sort((a, b) => a.dist - b.dist);
  return inRange.slice(0, count).map((entry) => entry.enemy);
}

/** Removes matching items in place and returns them. Walks backwards so removing doesn't skip items. */
function removeWhere<T>(list: T[], test: (item: T) => boolean): T[] {
  const removed: T[] = [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (test(list[i])) removed.push(...list.splice(i, 1));
  }
  return removed;
}
