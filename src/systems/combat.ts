import { ENEMY_SHOT, PLAYER } from '../config';
import type { Renderer } from '../engine/renderer';
import { Enemy, enemyTypeByChar, type EnemyEnv } from '../entities/enemy';
import { EnemyShot } from '../entities/enemyShot';
import type { Player } from '../entities/player';

/**
 * What happens between the two sides once the weapons have done their damage: enemy bullets,
 * contact damage, removing the dead (with their splitting) and the life recovered from kills.
 * The player's own attacks live in src/weapons/.
 */
export class Combat {
  private readonly enemyShots: EnemyShot[] = [];

  /** What enemies need while acting: a way to fire bullets, and the size of the map. */
  makeEnv(width: number, height: number): EnemyEnv {
    return {
      width,
      height,
      shoot: (x, y, dirX, dirY, speed, damage) => {
        if (this.enemyShots.length < ENEMY_SHOT.maxLive) {
          this.enemyShots.push(new EnemyShot(x, y, dirX, dirY, speed, damage));
        }
      },
    };
  }

  /** Advances combat by one frame and returns the enemies that died during it. */
  update(dt: number, player: Player, enemies: Enemy[]): Enemy[] {
    // Enemies that left for good (bats that flew past) vanish quietly: no XP, no splitting, no healing.
    removeWhere(enemies, (e) => e.gone);

    this.moveEnemyShots(dt, player);
    this.contactDamage(player, enemies);

    const killed = removeWhere(enemies, (e) => e.dead);
    this.splitDead(killed, enemies);
    // Killing recovers a small share of max HP (only if the player took the upgrade).
    if (killed.length > 0 && player.stats.lifeOnKill > 0) {
      player.heal(player.stats.maxHp * player.stats.lifeOnKill * killed.length);
    }
    return killed;
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    for (const s of this.enemyShots) s.draw(renderer, camX, camY);
  }

  private moveEnemyShots(dt: number, player: Player): void {
    const reach = PLAYER.radius + ENEMY_SHOT.radius;
    for (const shot of this.enemyShots) {
      shot.update(dt);
      if (Math.hypot(shot.x - player.x, shot.y - player.y) < reach) {
        player.takeDamage(shot.damage);
        shot.used = true;
      }
    }
    removeWhere(this.enemyShots, (s) => s.used || s.expired);
  }

  private contactDamage(player: Player, enemies: Enemy[]): void {
    for (const enemy of enemies) {
      if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < PLAYER.radius + enemy.radius) {
        player.takeDamage(enemy.damage);
      }
    }
  }

  /** Enemies with a `split` trait leave smaller ones behind when they die. */
  private splitDead(killed: Enemy[], enemies: Enemy[]): void {
    for (const dead of killed) {
      const split = dead.type.split;
      if (!split) continue;
      const childType = enemyTypeByChar(split.into);
      for (let i = 0; i < split.count; i++) {
        // Spread the children around the spot where the parent died.
        const angle = (i / split.count) * Math.PI * 2 + Math.random();
        const x = dead.x + Math.cos(angle) * 12;
        const y = dead.y + Math.sin(angle) * 12;
        enemies.push(new Enemy(childType, x, y, dead.hpMult, dead.damageMult));
      }
    }
  }
}

/** Removes matching items in place and returns them. Walks backwards so removing doesn't skip items. */
function removeWhere<T>(list: T[], test: (item: T) => boolean): T[] {
  const removed: T[] = [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (test(list[i])) removed.push(...list.splice(i, 1));
  }
  return removed;
}
