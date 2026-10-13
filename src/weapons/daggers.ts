import type { Renderer } from '../engine/renderer';
import { PlayerProjectile, stepProjectiles } from './projectile';
import { Weapon, type WeaponCtx } from './weapon';

/** Throws daggers in the direction you are moving, so you aim by walking. */
export class Daggers extends Weapon {
  readonly id = 'daggers';
  readonly name = 'Throwing Daggers';
  readonly icon = '/';
  readonly blurb = 'Throws daggers where you face';
  readonly steps = [
    '+1 dagger',
    '+25% damage',
    '-15% cooldown',
    '+1 dagger',
    'Daggers pierce 2 enemies',
    '+25% damage',
    '+1 dagger',
  ] as const;

  private count = 1;
  private damage = 1;
  private cooldown = 1.0;
  private pierce = 0;
  private readonly range = 430;
  private readonly speed = 560;
  private readonly spacing = 11; // px between parallel daggers

  private timer = 0;
  private readonly shots: PlayerProjectile[] = [];

  protected onLevel(level: number): void {
    switch (level) {
      case 2: this.count++; break;
      case 3: this.damage *= 1.25; break;
      case 4: this.cooldown *= 0.85; break;
      case 5: this.count++; break;
      case 6: this.pierce = 2; break;
      case 7: this.damage *= 1.25; break;
      case 8: this.count++; break;
    }
  }

  update(dt: number, ctx: WeaponCtx): void {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.fire(ctx);
      this.timer = this.cooldown * ctx.stats.cooldownMult;
    }
    stepProjectiles(this.shots, dt, ctx.enemies);
  }

  private fire(ctx: WeaponCtx): void {
    const { player, stats } = ctx;
    const dirX = player.facingX;
    const dirY = player.facingY;
    const count = this.count + stats.amountBonus;
    // The dagger looks like a short line pointing the way it flies: | - / \
    const angle = Math.atan2(dirY, dirX);
    const octant = ((Math.round(angle / (Math.PI / 4)) % 4) + 4) % 4;
    const char = ['-', '\\', '|', '/'][octant];

    for (let i = 0; i < count; i++) {
      // Parallel daggers side by side, perpendicular to the flight direction.
      const offset = (i - (count - 1) / 2) * this.spacing;
      this.shots.push(
        new PlayerProjectile(
          player.x - dirY * offset, player.y + dirX * offset, dirX, dirY,
          this.speed, this.damage * stats.damageMult, this.range * stats.areaMult, this.pierce, 5, char, '#dfe8ef',
        ),
      );
    }
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    for (const s of this.shots) s.draw(renderer, camX, camY);
  }
}
