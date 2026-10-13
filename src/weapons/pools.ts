import type { Renderer } from '../engine/renderer';
import { damageInCircle, randomItem, removeWhere } from './helpers';
import { Weapon, type WeaponCtx } from './weapon';

interface Pool {
  x: number;
  y: number;
  radius: number;
  life: number; // seconds left
  readonly maxLife: number;
  tickTimer: number;
  readonly spots: { dx: number; dy: number }[]; // where the '~' characters are drawn inside the pool
}

const TICK = 0.4; // seconds between damage pulses
const MAX_THROW = 380; // px; pools are only thrown at enemies at most this far away

/** Leaves puddles on the ground that hurt everything standing in them. */
export class Pools extends Weapon {
  readonly id = 'pools';
  readonly name = 'Acid Pools';
  readonly icon = '=';
  readonly blurb = 'Leaves damaging puddles';
  readonly steps = [
    '+1 pool',
    '+30% damage',
    '+25% pool size',
    '-15% cooldown',
    '+1 pool',
    '+30% duration',
    '+30% damage',
  ] as const;

  private count = 1;
  private damage = 1;
  private cooldown = 3.0;
  private radius = 52;
  private duration = 2.6; // seconds

  private timer = 0;
  private readonly pools: Pool[] = [];

  protected onLevel(level: number): void {
    switch (level) {
      case 2: this.count++; break;
      case 3: this.damage *= 1.3; break;
      case 4: this.radius *= 1.25; break;
      case 5: this.cooldown *= 0.85; break;
      case 6: this.count++; break;
      case 7: this.duration *= 1.3; break;
      case 8: this.damage *= 1.3; break;
    }
  }

  update(dt: number, ctx: WeaponCtx): void {
    const { stats } = ctx;

    this.timer -= dt;
    if (this.timer <= 0) {
      this.throwPools(ctx);
      this.timer = this.cooldown * stats.cooldownMult;
    }

    for (const pool of this.pools) {
      pool.life -= dt;
      pool.tickTimer -= dt;
      if (pool.tickTimer <= 0) {
        pool.tickTimer = TICK;
        damageInCircle(ctx.enemies, pool.x, pool.y, pool.radius, this.damage * stats.damageMult);
      }
    }
    removeWhere(this.pools, (p) => p.life <= 0);
  }

  private throwPools(ctx: WeaponCtx): void {
    const { player, stats } = ctx;
    const near = ctx.enemies.filter((e) => !e.dead && Math.hypot(e.x - player.x, e.y - player.y) < MAX_THROW);
    const count = this.count + stats.amountBonus;
    for (let i = 0; i < count; i++) {
      let x: number;
      let y: number;
      if (near.length > 0) {
        const target = randomItem(near);
        x = target.x;
        y = target.y;
      } else {
        // Nobody close: drop it somewhere around the player so it still guards the area.
        const angle = Math.random() * Math.PI * 2;
        const dist = 80 + Math.random() * 100;
        x = player.x + Math.cos(angle) * dist;
        y = player.y + Math.sin(angle) * dist;
      }
      const radius = this.radius * stats.areaMult;
      const duration = this.duration;
      // Scatter the '~' characters inside the circle once, so the pool doesn't flicker every frame.
      const spots = [];
      for (let k = 0; k < Math.max(8, Math.round(radius / 3)); k++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * radius * 0.9;
        spots.push({ dx: Math.cos(a) * r, dy: Math.sin(a) * r * 0.7 });
      }
      this.pools.push({ x, y, radius, life: duration, maxLife: duration, tickTimer: 0, spots });
    }
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    for (const pool of this.pools) {
      // Fades in quickly and out slowly.
      const alpha = Math.min(1, pool.life * 2, (pool.life / pool.maxLife) * 1.5) * 0.7;
      for (const s of pool.spots) {
        renderer.drawGlyph('~', '#6fe08a', pool.x + s.dx - camX, pool.y + s.dy - camY, alpha);
      }
    }
  }
}
