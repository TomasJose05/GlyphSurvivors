import { DIFFICULTY, ENEMY_TYPES, SPAWN, type EnemyType } from '../config';
import { Enemy } from '../entities/enemy';
import type { World } from '../world/world';

/** The part of the world currently visible on screen, in world pixels. */
export interface View {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Creates enemies just outside the screen. The longer the run lasts, the more of them there are,
 * the tougher they are, and the more types have been unlocked. Once a minute a swarm surrounds you.
 */
export class Spawner {
  private elapsed = 0; // seconds survived in this run
  private budget = 0; // fractional enemies "owed"; one is spawned every time it reaches 1
  private nextSwarm: number = DIFFICULTY.swarmFirstAt;
  alert = 0; // seconds left of the swarm warning (the game shows a banner while it's > 0)

  update(dt: number, view: View, world: World, enemies: Enemy[]): void {
    this.elapsed += dt;
    this.alert = Math.max(0, this.alert - dt);

    // Steady trickle. Accumulating a fractional budget keeps the rate right at any frame rate.
    this.budget += this.spawnRate() * dt;
    while (this.budget >= 1) {
      this.budget -= 1;
      if (enemies.length >= this.maxEnemies()) continue;
      const pos = this.pickPosition(view, world);
      if (pos) enemies.push(this.create(pos.x, pos.y));
    }

    if (this.elapsed >= this.nextSwarm) {
      this.nextSwarm += DIFFICULTY.swarmEvery;
      this.spawnSwarm(view, world, enemies);
    }
  }

  private get minutes(): number {
    return this.elapsed / 60;
  }

  /** Enemies per second right now. */
  private spawnRate(): number {
    const m = this.minutes;
    return DIFFICULTY.startRate + DIFFICULTY.rateGrowthPerMinute * m + DIFFICULTY.rateGrowthQuadratic * m * m;
  }

  private maxEnemies(): number {
    return Math.min(DIFFICULTY.maxEnemiesCap, DIFFICULTY.maxEnemiesStart + DIFFICULTY.maxEnemiesPerMinute * this.minutes);
  }

  private create(x: number, y: number): Enemy {
    const m = this.minutes;
    const hpMult = 1 + DIFFICULTY.hpGrowthPerMinute * m + DIFFICULTY.hpGrowthQuadratic * m * m;
    const damageMult = 1 + DIFFICULTY.damageGrowthPerMinute * m;
    return new Enemy(this.pickType(), x, y, hpMult, damageMult);
  }

  /** A ring of enemies around the screen, evenly spaced, so there's no safe direction to run. */
  private spawnSwarm(view: View, world: World, enemies: Enemy[]): void {
    this.alert = DIFFICULTY.swarmAlertTime;
    const count = Math.round(DIFFICULTY.swarmBaseCount + DIFFICULTY.swarmExtraPerMinute * this.minutes);
    const centerX = view.x + view.w / 2;
    const centerY = view.y + view.h / 2;
    // Radius reaches the corners of the screen, so every enemy starts out of sight.
    const radius = Math.hypot(view.w, view.h) / 2 + SPAWN.margin;

    for (let i = 0; i < count; i++) {
      if (enemies.length >= DIFFICULTY.maxEnemiesCap) return;
      const angle = (i / count) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      // Points beyond the world's border are skipped (so near a wall the ring is only a partial arc).
      // They must not be clamped back inside: that would drop enemies on top of a player standing
      // next to the wall.
      if (x < 0 || x > world.width || y < 0 || y > world.height) continue;
      enemies.push(this.create(x, y));
    }
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
