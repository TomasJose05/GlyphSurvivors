import { LOADOUT } from '../config';
import type { Renderer } from '../engine/renderer';
import { Aura } from './aura';
import { Bolt } from './bolt';
import { Boomerang } from './boomerang';
import { Daggers } from './daggers';
import { Lash } from './lash';
import { Lightning } from './lightning';
import { Orbit } from './orbit';
import { Pools } from './pools';
import type { Weapon, WeaponCtx } from './weapon';

/** Every weapon in the game. To add one: write its class in this folder and add a line here. */
export const WEAPON_FACTORIES: readonly (() => Weapon)[] = [
  () => new Bolt(),
  () => new Daggers(),
  () => new Lash(),
  () => new Aura(),
  () => new Orbit(),
  () => new Boomerang(),
  () => new Lightning(),
  () => new Pools(),
];

/** The weapons the player currently carries (up to `LOADOUT.maxWeapons`). */
export class Loadout {
  readonly weapons: Weapon[] = [];

  get full(): boolean {
    return this.weapons.length >= LOADOUT.maxWeapons;
  }

  get(id: string): Weapon | undefined {
    return this.weapons.find((w) => w.id === id);
  }

  add(weapon: Weapon): void {
    if (!this.full && !this.get(weapon.id)) this.weapons.push(weapon);
  }

  update(dt: number, ctx: WeaponCtx): void {
    for (const weapon of this.weapons) weapon.update(dt, ctx);
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    for (const weapon of this.weapons) weapon.draw(renderer, camX, camY);
  }
}

/** A loadout holding just the starting weapon. */
export function createLoadout(): Loadout {
  const loadout = new Loadout();
  loadout.add(new Bolt());
  return loadout;
}
