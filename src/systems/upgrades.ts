import { LEECH, LOADOUT, PROGRESSION } from '../config';
import type { Player } from '../entities/player';
import { WEAPON_FACTORIES, type Loadout } from '../weapons/loadout';
import type { Stats } from './stats';

/**
 * One option on the level-up screen: either a weapon (new, or the next level of one you own)
 * or a passive that improves your stats for every weapon.
 */
export interface Offer {
  id: string;
  kind: 'weapon' | 'passive';
  name: string;
  tag: string; // small label under the name, e.g. "NEW WEAPON" or "Weapon  Lv 2 > 3"
  desc: string; // one short line; it has to fit inside a menu card
  apply(): void;
}

interface Passive {
  id: string;
  name: string;
  desc: string;
  maxLevel: number;
  apply(stats: Stats): void;
}

/** Passives: stat boosts that apply to every weapon. */
export const PASSIVES: readonly Passive[] = [
  { id: 'might', name: 'Power', desc: '+15% damage', maxLevel: 8, apply: (s) => { s.damageMult *= 1.15; } },
  { id: 'haste', name: 'Quick Hands', desc: '-8% cooldown', maxLevel: 6, apply: (s) => { s.cooldownMult *= 0.92; } },
  { id: 'amount', name: 'Duplicator', desc: '+1 projectile/blade/strike', maxLevel: 3, apply: (s) => { s.amountBonus += 1; } },
  { id: 'area', name: 'Reach', desc: '+15% area and range', maxLevel: 5, apply: (s) => { s.areaMult *= 1.15; } },
  { id: 'speed', name: 'Swift Boots', desc: '+8% move speed', maxLevel: 5, apply: (s) => { s.moveSpeed *= 1.08; } },
  { id: 'vitality', name: 'Vitality', desc: '+3 max HP', maxLevel: 8, apply: (s) => { s.maxHp += 3; } },
  { id: 'leech', name: 'Bloodthirst', desc: '+0.4% max HP per kill', maxLevel: 5, apply: (s) => { s.lifeOnKill += LEECH.perLevel; } },
];

/** How many different passives the player holds right now. */
function passivesOwned(stats: Stats): number {
  return PASSIVES.filter((p) => (stats.levels[p.id] ?? 0) > 0).length;
}

/** Every option that could be offered right now. */
export function availableOffers(player: Player, loadout: Loadout): Offer[] {
  const stats = player.stats;
  const offers: Offer[] = [];

  // Weapons: the next level of the ones you carry, or new ones while there is a free slot.
  for (const make of WEAPON_FACTORIES) {
    const sample = make();
    const owned = loadout.get(sample.id);
    if (owned) {
      if (owned.maxed) continue;
      offers.push({
        id: owned.id,
        kind: 'weapon',
        name: owned.name,
        tag: `Weapon  Lv ${owned.level} > ${owned.level + 1}`,
        desc: owned.nextStep,
        apply: () => owned.levelUp(),
      });
    } else if (!loadout.full) {
      offers.push({
        id: sample.id,
        kind: 'weapon',
        name: sample.name,
        tag: 'NEW WEAPON',
        desc: sample.blurb,
        apply: () => loadout.add(sample),
      });
    }
  }

  // Passives: same idea, with its own slot limit.
  for (const passive of PASSIVES) {
    const level = stats.levels[passive.id] ?? 0;
    if (level >= passive.maxLevel) continue;
    if (level === 0 && passivesOwned(stats) >= LOADOUT.maxPassives) continue;
    offers.push({
      id: passive.id,
      kind: 'passive',
      name: passive.name,
      tag: level === 0 ? 'NEW PASSIVE' : `Passive  Lv ${level} > ${level + 1}`,
      desc: passive.desc,
      apply: () => {
        passive.apply(stats);
        stats.levels[passive.id] = level + 1;
      },
    });
  }
  return offers;
}

/**
 * Picks `count` different offers at random. New weapons are a bit more likely while the loadout is
 * still small, so a run actually gets varied instead of just stacking passives.
 */
export function pickOffers(player: Player, loadout: Loadout, count: number = PROGRESSION.choicesPerLevelUp): Offer[] {
  const pool = availableOffers(player, loadout).map((offer) => {
    let weight = 1;
    if (offer.tag === 'NEW WEAPON' && loadout.weapons.length < 4) weight = 2;
    return { offer, weight };
  });

  const picked: Offer[] = [];
  while (picked.length < count && pool.length > 0) {
    const total = pool.reduce((sum, p) => sum + p.weight, 0);
    let roll = Math.random() * total;
    let index = 0;
    for (; index < pool.length - 1; index++) {
      roll -= pool[index].weight;
      if (roll < 0) break;
    }
    picked.push(pool[index].offer);
    pool.splice(index, 1);
  }
  return picked;
}
