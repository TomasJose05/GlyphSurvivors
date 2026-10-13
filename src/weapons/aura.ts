import type { Renderer } from '../engine/renderer';
import { Weapon, type WeaponCtx } from './weapon';

/** A damaging ring around the player that burns and pushes back whatever stands in it. */
export class Aura extends Weapon {
  readonly id = 'aura';
  readonly name = 'Aura of Flame';
  readonly icon = 'O';
  readonly blurb = 'Burns enemies around you';
  readonly steps = [
    '+20% radius',
    '+30% damage',
    '-15% tick time',
    '+20% radius',
    '+30% damage',
    '-15% tick time',
    '+25% radius, +25% damage',
  ] as const;

  private radius = 72; // px
  private damage = 1;
  private tick = 0.75; // seconds between damage pulses
  private readonly knockback = 9; // px pushed away on every pulse

  private timer = 0;
  private flash = 0; // seconds left of the bright pulse effect
  private px = 0; // player position, remembered for drawing
  private py = 0;
  private drawRadius = 0;

  protected onLevel(level: number): void {
    switch (level) {
      case 2: this.radius *= 1.2; break;
      case 3: this.damage *= 1.3; break;
      case 4: this.tick *= 0.85; break;
      case 5: this.radius *= 1.2; break;
      case 6: this.damage *= 1.3; break;
      case 7: this.tick *= 0.85; break;
      case 8: this.radius *= 1.25; this.damage *= 1.25; break;
    }
  }

  update(dt: number, ctx: WeaponCtx): void {
    const { player, stats } = ctx;
    this.px = player.x;
    this.py = player.y;
    this.drawRadius = this.radius * stats.areaMult;
    this.flash = Math.max(0, this.flash - dt);

    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = this.tick * stats.cooldownMult;
    this.flash = 0.14;

    for (const enemy of ctx.enemies) {
      if (enemy.dead) continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < this.drawRadius + enemy.radius) {
        enemy.takeDamage(this.damage * stats.damageMult);
        // Push away from the player (bosses are too heavy to move).
        if (dist > 0.001 && enemy.type.behavior !== 'boss') {
          enemy.x += (dx / dist) * this.knockback;
          enemy.y += (dy / dist) * this.knockback;
        }
      }
    }
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    if (this.drawRadius === 0) return;
    // A ring of characters; brighter and made of '*' for a moment each time it pulses.
    const pulsing = this.flash > 0;
    const count = Math.max(16, Math.round((2 * Math.PI * this.drawRadius) / 11));
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      renderer.drawGlyph(
        pulsing ? '*' : '.',
        pulsing ? '#ffd27d' : '#e08a4a',
        this.px + Math.cos(a) * this.drawRadius - camX,
        this.py + Math.sin(a) * this.drawRadius - camY,
        pulsing ? 0.95 : 0.4,
      );
    }
  }
}
