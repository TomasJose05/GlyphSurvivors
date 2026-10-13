import { ENEMY_TYPES, SPAWN, type EnemyType } from '../config';
import { Enemy } from '../entities/enemy';
import type { World } from '../world/world';

/** The part of the world currently visible on screen, in world pixels. */
export interface View {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Creates enemies just outside the screen, faster and with more variety as the run goes on. */
export class Spawner {
  private elapsed = 0; // seconds survived in this run
  private timer = 0; // counts down to the next spawn

  update(dt: number, view: View, world: World, enemies: Enemy[]): void {
    this.elapsed += dt;
    this.timer -= dt;

    // A `while` (not `if`) so a long frame can't make us "forget" spawns.
    while (this.timer <= 0) {
      this.timer += this.currentInterval();
      if (enemies.length >= SPAWN.maxEnemies) continue;
      const pos = this.pickPosition(view, world);
      if (pos) enemies.push(new Enemy(this.pickType(), pos.x, pos.y));
    }
  }

  private currentInterval(): number {
    return Math.max(SPAWN.minInterval, SPAWN.startInterval - this.elapsed * SPAWN.rampPerSecond);
  }

  /** Weighted random pick among the enemy types already unlocked at this point of the run. */
  private pickType(): EnemyType {
    const unlocked = ENEMY_TYPES.filter((t) => t.minTime <= this.elapsed);
    const total = unlocked.reduce((sum, t) => sum + t.weight, 0);
    let roll = Math.random() * total;
    for (const type of unlocked) {
      roll -= type.weight;
      if (roll < 0) return type;
    }
    return unlocked[0];
  }

  /** A random point on a ring just outside the screen that still lies inside the world. */
  private pickPosition(view: View, world: World): { x: number; y: number } | null {
    const m = SPAWN.margin;
    for (let attempt = 0; attempt < 8; attempt++) {
      const side = Math.floor(Math.random() * 4);
      let x: number;
      let y: number;
      if (side === 0 || side === 1) {
        // top or bottom edge
        x = view.x - m + Math.random() * (view.w + m * 2);
        y = side === 0 ? view.y - m : view.y + view.h + m;
      } else {
        // left or right edge
        x = side === 2 ? view.x - m : view.x + view.w + m;
        y = view.y - m + Math.random() * (view.h + m * 2);
      }
      const inside = x >= 0 && x <= world.width && y >= 0 && y <= world.height;
      if (inside) return { x, y };
      // That side is beyond the world's border (player is near an edge): try another side.
    }
    return null;
  }
}
