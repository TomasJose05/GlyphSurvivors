import type { Renderer } from '../engine/renderer';
import { damageInCircle, randomItem, removeWhere } from './helpers';
import { Weapon, type WeaponCtx } from './weapon';

interface Strike {
  x: number;
  y: number;
  life: number; // seconds left on screen
}

const STRIKE_LIFE = 0.25;

/** Calls bolts of lightning down on random enemies anywhere on screen. */
export class Lightning extends Weapon {
  readonly id = 'lightning';
  readonly name = 'Lightning';
  readonly icon = '|';
  readonly blurb = 'Strikes random enemies';
  readonly steps = [
    '+1 strike',
    '+30% damage',
    '-15% cooldown',
    '+1 strike',
    '+40% blast size',
    '+30% damage',
    '+1 strike',
  ] as const;

  private count = 1;
  private damage = 3;
  private cooldown = 1.8;
  private blast = 26; // radius of the damage around the point it lands, px

  private timer = 0;
  private readonly strikes: Strike[] = [];

  protected onLevel(level: number): void {
    switch (level) {
      case 2: this.count++; break;
      case 3: this.damage *= 1.3; break;
      case 4: this.cooldown *= 0.85; break;
      case 5: this.count++; break;
      case 6: this.blast *= 1.4; break;
      case 7: this.damage *= 1.3; break;
      case 8: this.count++; break;
    }
  }

  update(dt: number, ctx: WeaponCtx): void {
    for (const s of this.strikes) s.life -= dt;
    removeWhere(this.strikes, (s) => s.life <= 0);

    this.timer -= dt;
    if (this.timer > 0) return;

    const { view, stats } = ctx;
    // Only enemies you can actually see are valid targets.
    const visible = ctx.enemies.filter(
      (e) => !e.dead && e.x > view.x && e.x < view.x + view.w && e.y > view.y && e.y < view.y + view.h,
    );
    if (visible.length === 0) return; // wait with the timer ready until something shows up

    const count = Math.min(this.count + stats.amountBonus, visible.length);
    const chosen = new Set<(typeof visible)[number]>();
    while (chosen.size < count) chosen.add(randomItem(visible));

    for (const target of chosen) {
      this.strikes.push({ x: target.x, y: target.y, life: STRIKE_LIFE });
      damageInCircle(ctx.enemies, target.x, target.y, this.blast * stats.areaMult, this.damage * stats.damageMult);
    }
    this.timer = this.cooldown * stats.cooldownMult;
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    for (const s of this.strikes) {
      const alpha = Math.max(0, s.life / STRIKE_LIFE);
      // A vertical column of '|' coming down from above, ending in a '#' where it lands.
      for (let dy = -160; dy < 0; dy += 14) {
        renderer.drawGlyph('|', '#fff3a0', s.x - camX, s.y + dy - camY, alpha);
      }
      renderer.drawGlyph('#', '#ffffff', s.x - camX, s.y - camY, alpha, 1.5);
    }
  }
}
