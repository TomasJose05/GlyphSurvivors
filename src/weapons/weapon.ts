import type { Renderer } from '../engine/renderer';
import type { Enemy } from '../entities/enemy';
import type { Player } from '../entities/player';
import type { Stats } from '../systems/stats';

/** Everything a weapon can see and use while it updates. */
export interface WeaponCtx {
  player: Player;
  stats: Stats; // the player's live stats, including the multipliers from passives
  enemies: Enemy[];
  view: { x: number; y: number; w: number; h: number }; // the visible part of the world, in world px
}

/**
 * Base class of every weapon. A weapon is a self-contained thing: it owns its timers, its
 * projectiles/effects, how it hits enemies and how it looks. The game only calls `update` and `draw`.
 *
 * Weapons level up from 1 to `maxLevel`. `steps[i]` describes what reaching level `i + 2` gives, and
 * `onLevel` applies it, so the two must stay in the same order.
 */
export abstract class Weapon {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly icon: string; // one character, shown in the HUD
  abstract readonly blurb: string; // one line shown when the weapon is offered for the first time
  abstract readonly steps: readonly string[];

  level = 1;

  get maxLevel(): number {
    return this.steps.length + 1;
  }

  get maxed(): boolean {
    return this.level >= this.maxLevel;
  }

  /** What the next level-up will do, for the upgrade menu. */
  get nextStep(): string {
    return this.steps[this.level - 1] ?? '';
  }

  levelUp(): void {
    if (this.maxed) return;
    this.level++;
    this.onLevel(this.level);
  }

  /** Applies the improvement for having just reached `level` (2 or more). */
  protected abstract onLevel(level: number): void;

  abstract update(dt: number, ctx: WeaponCtx): void;
  abstract draw(renderer: Renderer, camX: number, camY: number): void;
}
