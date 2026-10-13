import type { Renderer } from '../engine/renderer';
import { nearestEnemies } from './helpers';
import { PlayerProjectile, stepProjectiles } from './projectile';
import { Weapon, type WeaponCtx } from './weapon';

// Extra bolts that have no separate enemy to aim at fan out around the main one by this angle.
const SPREAD_ANGLE = 0.14; // radians (~8 degrees)

/** The starting weapon: fires at the nearest enemy, no aiming needed. */
export class Bolt extends Weapon {
  readonly id = 'bolt';
  readonly name = 'Magic Bolt';
  readonly icon = '*';
  readonly blurb = 'Fires at the nearest enemy';
  // Same order as `onLevel` below.
  readonly steps = [
    '+1 bolt',
    '+25% damage',
    '-15% cooldown',
    '+1 bolt',
    'Bolts pierce 1 enemy',
    '+25% damage',
    '+1 bolt',
  ] as const;

  // Stats at the current level. Passives multiply these (see update).
  private count = 1;
  private damage = 1;
  private cooldown = 0.6; // seconds
  private pierce = 0;
  private readonly range = 380;
  private readonly speed = 420;

  private timer = 0;
  private readonly shots: PlayerProjectile[] = [];

  protected onLevel(level: number): void {
    switch (level) {
      case 2: this.count++; break;
      case 3: this.damage *= 1.25; break;
      case 4: this.cooldown *= 0.85; break;
      case 5: this.count++; break;
      case 6: this.pierce = 1; break;
      case 7: this.damage *= 1.25; break;
      case 8: this.count++; break;
    }
  }

  update(dt: number, ctx: WeaponCtx): void {
    this.timer -= dt;
    if (this.timer <= 0) this.fire(ctx);
    stepProjectiles(this.shots, dt, ctx.enemies);
  }

  private fire(ctx: WeaponCtx): void {
    const { player, stats } = ctx;
    const count = this.count + stats.amountBonus;
    const range = this.range * stats.areaMult;
    const targets = nearestEnemies(player, ctx.enemies, range, count);
    // No target: leave the timer at <= 0 so we shoot the moment one comes into range.
    if (targets.length === 0) return;

    for (let i = 0; i < count; i++) {
      // Each bolt gets its own target while there are enough enemies; the rest fan out around the
      // nearest one, alternating left/right with a growing angle.
      let angle = 0;
      let target = targets[i];
      if (!target) {
        target = targets[0];
        const extra = i - targets.length;
        angle = (extra % 2 === 0 ? 1 : -1) * SPREAD_ANGLE * (Math.floor(extra / 2) + 1);
      }
      const base = Math.atan2(target.y - player.y, target.x - player.x);
      this.shots.push(
        new PlayerProjectile(
          player.x, player.y, Math.cos(base + angle), Math.sin(base + angle),
          this.speed, this.damage * stats.damageMult, range, this.pierce, 6, '*', '#ffe27a',
        ),
      );
    }
    this.timer = this.cooldown * stats.cooldownMult;
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    for (const s of this.shots) s.draw(renderer, camX, camY);
  }
}
