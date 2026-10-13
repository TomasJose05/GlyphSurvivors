import { PLAYER } from '../config';

/**
 * The player's live stats. Passive upgrades modify these during a run. The multipliers apply to
 * *every* weapon the player owns, which is what makes passives worth taking alongside weapons.
 */
export interface Stats {
  moveSpeed: number; // px per second
  maxHp: number;
  damageMult: number; // multiplies the damage of every weapon
  cooldownMult: number; // multiplies every weapon's cooldown (lower = faster)
  amountBonus: number; // extra projectiles / blades / strikes added to every weapon
  areaMult: number; // multiplies range, radius and size of every weapon
  lifeOnKill: number; // fraction of max HP recovered for every enemy killed (0.01 = 1%)
  levels: Record<string, number>; // how many times each passive (by id) has been taken
}

export function createStats(): Stats {
  return {
    moveSpeed: PLAYER.speed,
    maxHp: PLAYER.maxHp,
    damageMult: 1,
    cooldownMult: 1,
    amountBonus: 0,
    areaMult: 1,
    lifeOnKill: 0,
    levels: {},
  };
}
