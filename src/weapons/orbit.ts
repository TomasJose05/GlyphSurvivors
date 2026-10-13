import type { Renderer } from '../engine/renderer';
import { Weapon, type WeaponCtx } from './weapon';

const BLADE_RADIUS = 8; // collision radius of one blade, px
const HIT_COOLDOWN = 0.35; // seconds before the same enemy can be cut again by the same weapon

/** Blades that circle the player permanently and cut anything they pass through. */
export class Orbit extends Weapon {
  readonly id = 'orbit';
  readonly name = 'Orbiting Blades';
  readonly icon = '+';
  readonly blurb = 'Blades circle around you';
  readonly steps = [
    '+1 blade',
    '+30% damage',
    '+20% orbit size',
    '+1 blade',
    '+25% spin speed',
    '+30% damage',
    '+1 blade',
  ] as const;

  private count = 3;
  private damage = 2.2;
  private orbitRadius = 68; // px from the player
  private spin = 2.6; // radians per second

  private angle = 0;
  private clock = 0; // seconds since the weapon was created
  private readonly lastHit = new WeakMap<object, number>(); // enemy -> clock time of its last cut
  private px = 0;
  private py = 0;
  private blades = 0; // how many are drawn/active right now
  private radiusNow = 0;

  protected onLevel(level: number): void {
    switch (level) {
      case 2: this.count++; break;
      case 3: this.damage *= 1.3; break;
      case 4: this.orbitRadius *= 1.2; break;
      case 5: this.count++; break;
      case 6: this.spin *= 1.25; break;
      case 7: this.damage *= 1.3; break;
      case 8: this.count++; break;
    }
  }

  update(dt: number, ctx: WeaponCtx): void {
    const { player, stats } = ctx;
    this.clock += dt;
    this.angle += this.spin * dt;
    this.px = player.x;
    this.py = player.y;
    this.blades = this.count + stats.amountBonus;
    this.radiusNow = this.orbitRadius * stats.areaMult;

    for (let i = 0; i < this.blades; i++) {
      const a = this.angle + (i / this.blades) * Math.PI * 2;
      const bx = player.x + Math.cos(a) * this.radiusNow;
      const by = player.y + Math.sin(a) * this.radiusNow;
      for (const enemy of ctx.enemies) {
        if (enemy.dead) continue;
        if (Math.hypot(enemy.x - bx, enemy.y - by) >= BLADE_RADIUS + enemy.radius) continue;
        const last = this.lastHit.get(enemy);
        if (last !== undefined && this.clock - last < HIT_COOLDOWN) continue;
        this.lastHit.set(enemy, this.clock);
        enemy.takeDamage(this.damage * stats.damageMult);
      }
    }
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    for (let i = 0; i < this.blades; i++) {
      const a = this.angle + (i / this.blades) * Math.PI * 2;
      renderer.drawGlyph(
        '+', '#ffd36e',
        this.px + Math.cos(a) * this.radiusNow - camX,
        this.py + Math.sin(a) * this.radiusNow - camY,
        1, 1.3,
      );
    }
  }
}
