import { DIFFICULTY, ENEMY_TYPES, SPAWN, type EnemyType } from '../config';
import { Enemy, enemyTypeByChar } from '../entities/enemy';
import type { World } from '../world/world';

/** The part of the world currently visible on screen, in world pixels. */
export interface View {
  x: number;
  y: number;
  w: number;
  h: number;
}

const FLOCK_SPACING = 26; // px between the members of a flock

/**
 * Creates enemies just outside the screen. The longer the run lasts, the more of them there are,
 * the tougher they are, and the more types have been unlocked. Once a minute a swarm surrounds you,
 * and from the sixth minute a boss walks in every couple of minutes.
 */
export class Spawner {
  private elapsed = 0; // seconds survived in this run
  private budget = 0; // fractional enemies "owed"; one is spawned every time it reaches 1
  private nextSwarm: number = DIFFICULTY.swarmFirstAt;
  private nextBoss: number = DIFFICULTY.bossFirstAt;
  alert = 0; // seconds left of the warning banner (the game shows it while it's > 0)
  alertLabel = ''; // what the banner says: 'SWARM' or 'BOSS'

  update(dt: number, view: View, world: World, enemies: Enemy[]): void {
    this.elapsed += dt;
    this.alert = Math.max(0, this.alert - dt);

    // Steady trickle. Accumulating a fractional budget keeps the rate right at any frame rate.
    this.budget += this.spawnRate() * dt;
    while (this.budget >= 1) {
      this.budget -= 1;
      if (enemies.length >= this.maxEnemies()) continue;
      const pos = this.pickPosition(view, world);
      if (pos) this.spawnAt(pos, view, world, enemies);
    }

    if (this.elapsed >= this.nextSwarm) {
      this.nextSwarm += DIFFICULTY.swarmEvery;
      this.spawnSwarm(view, world, enemies);
    }
    if (this.elapsed >= this.nextBoss) {
      this.nextBoss += DIFFICULTY.bossEvery;
      this.spawnBoss(view, world, enemies);
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

  private create(type: EnemyType, x: number, y: number): Enemy {
    const m = this.minutes;
    const hpMult = 1 + DIFFICULTY.hpGrowthPerMinute * m + DIFFICULTY.hpGrowthQuadratic * m * m;
    const damageMult = 1 + DIFFICULTY.damageGrowthPerMinute * m;
    return new Enemy(type, x, y, hpMult, damageMult);
  }

  /** Spawns one enemy of a random unlocked type at `pos`; flock types spawn as a whole flock. */
  private spawnAt(pos: { x: number; y: number }, view: View, world: World, enemies: Enemy[]): void {
    const type = this.pickType();
    const size = type.group ?? 1;
    // A flock is a row of enemies perpendicular to the direction they'll fly in (toward the screen).
    const fromX = pos.x - (view.x + view.w / 2);
    const fromY = pos.y - (view.y + view.h / 2);
    const len = Math.hypot(fromX, fromY) || 1;
    const perpX = -fromY / len;
    const perpY = fromX / len;

    for (let i = 0; i < size; i++) {
      const offset = (i - (size - 1) / 2) * FLOCK_SPACING;
      const x = pos.x + perpX * offset;
      const y = pos.y + perpY * offset;
      if (x < 0 || x > world.width || y < 0 || y > world.height) continue;
      enemies.push(this.create(type, x, y));
    }
  }

  /** A ring of enemies around the screen, evenly spaced, so there's no safe direction to run. */
  private spawnSwarm(view: View, world: World, enemies: Enemy[]): void {
    this.alert = DIFFICULTY.swarmAlertTime;
    this.alertLabel = 'SWARM';
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
      // Flock types fly straight and don't belong in a ring that's meant to close in: skip them.
      enemies.push(this.create(this.pickType((t) => t.behavior !== 'swoop'), x, y));
    }
  }

  private spawnBoss(view: View, world: World, enemies: Enemy[]): void {
    const pos = this.pickPosition(view, world);
    if (!pos) return;
    this.alert = DIFFICULTY.swarmAlertTime;
    this.alertLabel = 'BOSS';
    enemies.push(this.create(enemyTypeByChar('M'), pos.x, pos.y));
  }

  /** Weighted random pick among the enemy types already unlocked at this point of the run. */
  private pickType(allow: (t: EnemyType) => boolean = () => true): EnemyType {
    const unlocked = ENEMY_TYPES.filter((t) => t.weight > 0 && t.minTime <= this.elapsed && allow(t));
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
