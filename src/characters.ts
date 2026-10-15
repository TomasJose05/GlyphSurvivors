import { LEECH } from './config';
import type { Stats } from './systems/stats';

/** A playable character: the glyph you are drawn as, the weapon you start with, and a stat tweak. */
export interface Character {
  id: string;
  name: string;
  glyph: string; // one ASCII character (enemy letters are avoided so it can't be mistaken for one)
  color: string;
  weaponId: string; // id of the starting weapon (see src/weapons/)
  perk: string; // one short line for the menu card (17 characters at most)
  /** Applies the character's bonus (and drawback) to the starting stats. */
  apply(stats: Stats): void;
}

/**
 * The roster, in the order it appears in the menu. Each one starts with a different weapon, and the
 * bonuses are small and come with a price so that no character is simply better than the others.
 */
export const CHARACTERS: readonly Character[] = [
  {
    id: 'wanderer',
    name: 'Wanderer',
    glyph: '@',
    color: '#e8f0ff',
    weaponId: 'bolt',
    perk: 'Balanced',
    apply: () => {},
  },
  {
    id: 'rogue',
    name: 'Rogue',
    glyph: '&',
    color: '#9ad0ff',
    weaponId: 'daggers',
    perk: '+12% speed, -4 HP',
    apply: (s) => {
      s.moveSpeed *= 1.12;
      s.maxHp -= 4;
    },
  },
  {
    id: 'knight',
    name: 'Knight',
    glyph: 'K',
    color: '#d9c7a0',
    weaponId: 'lash',
    perk: '+8 HP, -8% speed',
    apply: (s) => {
      s.maxHp += 8;
      s.moveSpeed *= 0.92;
    },
  },
  {
    id: 'pyromancer',
    name: 'Pyromancer',
    glyph: 'P',
    color: '#ff9a5e',
    weaponId: 'aura',
    perk: '+15% area',
    apply: (s) => {
      s.areaMult *= 1.15;
    },
  },
  {
    id: 'dancer',
    name: 'Blade Dancer',
    glyph: 'D',
    color: '#ffd36e',
    weaponId: 'orbit',
    perk: '-10% cooldown',
    apply: (s) => {
      s.cooldownMult *= 0.9;
    },
  },
  {
    id: 'hunter',
    name: 'Hunter',
    glyph: 'H',
    color: '#7fe0b0',
    weaponId: 'boomerang',
    perk: '+10% dmg, +5% spd',
    apply: (s) => {
      s.damageMult *= 1.1;
      s.moveSpeed *= 1.05;
    },
  },
  {
    id: 'stormcaller',
    name: 'Stormcaller',
    glyph: 'S',
    color: '#fff3a0',
    weaponId: 'lightning',
    perk: '+15% dmg, -2 HP',
    apply: (s) => {
      s.damageMult *= 1.15;
      s.maxHp -= 2;
    },
  },
  {
    id: 'alchemist',
    name: 'Alchemist',
    glyph: 'A',
    color: '#6fe08a',
    weaponId: 'pools',
    perk: '+0.4% HP per kill',
    apply: (s) => {
      s.lifeOnKill += LEECH.perLevel;
    },
  },
];

export function characterById(id: string | null): Character {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
