import type { Renderer } from '../engine/renderer';
import { nearestEnemies, removeWhere } from './helpers';
import { Weapon, type WeaponCtx } from './weapon';

const SPIN_CHARS = ['<', '^', '>', 'v'];
const HIT_COOLDOWN = 0.4; // seconds before the same boomerang can hit the same enemy again
const RADIUS = 9; // collision radius, px

interface Boom {
  x: number;
  y: number;
  dirX: number; // outward direction (unit)
  dirY: number;
  travelled: number;
  returning: boolean;
  age: number;
  readonly lastHit: Map<object, number>; // enemy -> boom age at its last hit
}

/** Flies out toward an enemy, passes through everything, then comes back to you (hitting on both ways). */
export class Boomerang extends Weapon {
  readonly id = 'boomerang';
  readonly name = 'Boomerang';
  readonly icon = '<';
  readonly blurb = 'Flies out and comes back';
  readonly steps = [
    '+1 boomerang',
    '+30% damage',
    '-15% cooldown',
    '+1 boomerang',
    '+25% range',
    '+30% damage',
    '+1 boomerang',
  ] as const;

  private count = 1;
  private damage = 2.8;
  private cooldown = 2.0;
  private reach = 300; // how far it flies before turning back, px
  private readonly speed = 340;

  private timer = 0;
  private readonly booms: Boom[] = [];

  protected onLevel(level: number): void {
    switch (level) {
      case 2: this.count++; break;
      case 3: this.damage *= 1.3; break;
      case 4: this.cooldown *= 0.85; break;
      case 5: this.count++; break;
      case 6: this.reach *= 1.25; break;
      case 7: this.damage *= 1.3; break;
      case 8: this.count++; break;
    }
  }

  update(dt: number, ctx: WeaponCtx): void {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.throwBooms(ctx);
      this.timer = this.cooldown * ctx.stats.cooldownMult;
    }

    const { player, stats } = ctx;
    const reach = this.reach * stats.areaMult;
    for (const b of this.booms) {
      b.age += dt;
      if (!b.returning) {
        const step = this.speed * dt;
        b.x += b.dirX * step;
        b.y += b.dirY * step;
        b.travelled += step;
        if (b.travelled >= reach) b.returning = true;
      } else {
        // Homes in on the player, a little faster than it went out.
        const dx = player.x - b.x;
        const dy = player.y - b.y;
        const dist = Math.hypot(dx, dy) || 1;
        b.x += (dx / dist) * this.speed * 1.15 * dt;
        b.y += (dy / dist) * this.speed * 1.15 * dt;
      }

      for (const enemy of ctx.enemies) {
        if (enemy.dead) continue;
        if (Math.hypot(enemy.x - b.x, enemy.y - b.y) >= RADIUS + enemy.radius) continue;
        const last = b.lastHit.get(enemy);
        if (last !== undefined && b.age - last < HIT_COOLDOWN) continue;
        b.lastHit.set(enemy, b.age);
        enemy.takeDamage(this.damage * stats.damageMult);
      }
    }
    // Gone once it is back in the player's hands (or if it somehow got lost).
    removeWhere(this.booms, (b) => b.age > 8 || (b.returning && Math.hypot(player.x - b.x, player.y - b.y) < 14));
  }

  private throwBooms(ctx: WeaponCtx): void {
    const { player, stats } = ctx;
    const count = this.count + stats.amountBonus;
    const targets = nearestEnemies(player, ctx.enemies, 520, count);
    for (let i = 0; i < count; i++) {
      // Each one goes for its own target; with fewer enemies than boomerangs, the extras fan out around
      // the nearest one (or around the facing direction if nobody is close).
      const target = targets[i] ?? targets[0];
      let angle = target
        ? Math.atan2(target.y - player.y, target.x - player.x)
        : Math.atan2(player.facingY, player.facingX);
      if (!targets[i]) angle += (i % 2 === 0 ? 1 : -1) * 0.5 * Math.ceil(i / 2);
      this.booms.push({
        x: player.x,
        y: player.y,
        dirX: Math.cos(angle),
        dirY: Math.sin(angle),
        travelled: 0,
        returning: false,
        age: 0,
        lastHit: new Map(),
      });
    }
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    for (const b of this.booms) {
      const char = SPIN_CHARS[Math.floor(b.age * 14) % SPIN_CHARS.length];
      renderer.drawGlyph(char, '#7fe0b0', b.x - camX, b.y - camY, 1, 1.4);
    }
  }
}
