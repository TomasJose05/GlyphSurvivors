import type { Renderer } from '../engine/renderer';
import { removeWhere } from './helpers';
import { Weapon, type WeaponCtx } from './weapon';

interface Swing {
  x: number; // center of the slash, world px
  y: number;
  w: number;
  h: number;
  life: number; // seconds left on screen
}

const SWING_LIFE = 0.18;

/** A short-range whip that hits everything in a band beside you, alternating sides. */
export class Lash extends Weapon {
  readonly id = 'lash';
  readonly name = 'Lash';
  readonly icon = '~';
  readonly blurb = 'Whips enemies in front of you';
  readonly steps = [
    '+25% area',
    '+30% damage',
    '-15% cooldown',
    'Strikes both sides at once',
    '+25% area',
    '+30% damage',
    '+30% damage',
  ] as const;

  private length = 120; // px
  private thickness = 46;
  private damage = 2.6;
  private cooldown = 1.3;
  private bothSides = false;

  private timer = 0;
  private flip = false; // alternates which side the next swing goes to
  private readonly swings: Swing[] = [];

  protected onLevel(level: number): void {
    switch (level) {
      case 2: this.length *= 1.25; this.thickness *= 1.25; break;
      case 3: this.damage *= 1.3; break;
      case 4: this.cooldown *= 0.85; break;
      case 5: this.bothSides = true; break;
      case 6: this.length *= 1.25; this.thickness *= 1.25; break;
      case 7: this.damage *= 1.3; break;
      case 8: this.damage *= 1.3; break;
    }
  }

  update(dt: number, ctx: WeaponCtx): void {
    for (const s of this.swings) s.life -= dt;
    removeWhere(this.swings, (s) => s.life <= 0);

    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = this.cooldown * ctx.stats.cooldownMult;

    const { player, stats } = ctx;
    const facing = player.facingX >= 0 ? 1 : -1;
    // "Amount" from passives also makes the whip hit both sides.
    const both = this.bothSides || stats.amountBonus > 0;
    const sides = both ? [1, -1] : [this.flip ? -facing : facing];
    this.flip = !this.flip;

    const w = this.length * stats.areaMult;
    const h = this.thickness * stats.areaMult;
    for (const side of sides) {
      const cx = player.x + side * (w / 2 + 8);
      const cy = player.y;
      this.swings.push({ x: cx, y: cy, w, h, life: SWING_LIFE });
      for (const enemy of ctx.enemies) {
        if (enemy.dead) continue;
        if (Math.abs(enemy.x - cx) < w / 2 + enemy.radius && Math.abs(enemy.y - cy) < h / 2 + enemy.radius) {
          enemy.takeDamage(this.damage * stats.damageMult);
        }
      }
    }
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    for (const s of this.swings) {
      const alpha = Math.max(0, s.life / SWING_LIFE);
      // A band of '~' characters, two rows tall, filling the slash rectangle.
      for (let dx = -s.w / 2; dx <= s.w / 2; dx += 8) {
        renderer.drawGlyph('~', '#f2d6a2', s.x + dx - camX, s.y - 6 - camY, alpha);
        renderer.drawGlyph('~', '#f2d6a2', s.x + dx - camX, s.y + 6 - camY, alpha);
      }
    }
  }
}
