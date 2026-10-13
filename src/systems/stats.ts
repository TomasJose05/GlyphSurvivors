import { PLAYER, WEAPON } from '../config';

/**
 * The player's live stats. Upgrades modify these during a run, so everything that depends on them
 * (movement, weapon, HUD) reads from here instead of from the constants in config.ts.
 */
export interface Stats {
  moveSpeed: number; // px per second
  maxHp: number;
  damage: number; // per projectile
  fireInterval: number; // seconds between volleys
  projectiles: number; // projectiles per volley
  range: number; // px
  regen: number; // HP recovered per second
  levels: Record<string, number>; // how many times each upgrade (by id) has been taken
}

export function createStats(): Stats {
  return {
    moveSpeed: PLAYER.speed,
    maxHp: PLAYER.maxHp,
    damage: WEAPON.damage,
    fireInterval: WEAPON.interval,
    projectiles: 1,
    range: WEAPON.range,
    regen: 0,
    levels: {},
  };
}
