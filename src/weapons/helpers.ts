import type { Enemy } from '../entities/enemy';
import type { Player } from '../entities/player';

/** Up to `count` living enemies within `range` pixels of the player, closest first. */
export function nearestEnemies(player: Player, enemies: Enemy[], range: number, count: number): Enemy[] {
  const inRange: { enemy: Enemy; dist: number }[] = [];
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (dist < range) inRange.push({ enemy, dist });
  }
  inRange.sort((a, b) => a.dist - b.dist);
  return inRange.slice(0, count).map((entry) => entry.enemy);
}

/** Damages every enemy whose body touches the circle. Returns how many were hit. */
export function damageInCircle(enemies: Enemy[], x: number, y: number, radius: number, damage: number): number {
  let hits = 0;
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    if (Math.hypot(enemy.x - x, enemy.y - y) < radius + enemy.radius) {
      enemy.takeDamage(damage);
      hits++;
    }
  }
  return hits;
}

/** In-place removal of every item that matches `test`. */
export function removeWhere<T>(list: T[], test: (item: T) => boolean): void {
  for (let i = list.length - 1; i >= 0; i--) {
    if (test(list[i])) list.splice(i, 1);
  }
}

export function randomItem<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}
