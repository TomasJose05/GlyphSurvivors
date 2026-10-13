import { PROGRESSION } from '../config';
import type { Player } from '../entities/player';
import type { Stats } from './stats';

export interface Upgrade {
  id: string;
  name: string;
  desc: string; // one short line, it has to fit inside a menu card
  apply(stats: Stats, player: Player): void;
  /** Return false to stop offering this upgrade (e.g. a stat that reached its cap). */
  available?(stats: Stats): boolean;
}

export const UPGRADES: readonly Upgrade[] = [
  {
    id: 'damage',
    name: 'Sharper Rounds',
    desc: '+30% damage',
    apply: (s) => {
      s.damage *= 1.3;
    },
  },
  {
    id: 'rate',
    name: 'Quick Hands',
    desc: '+18% fire rate',
    apply: (s) => {
      s.fireInterval /= 1.18;
    },
    available: (s) => s.fireInterval > 0.15,
  },
  {
    id: 'shots',
    name: 'Extra Shot',
    desc: '+1 projectile',
    apply: (s) => {
      s.projectiles += 1;
    },
    available: (s) => s.projectiles < 6,
  },
  {
    id: 'speed',
    name: 'Swift Boots',
    desc: '+12% move speed',
    apply: (s) => {
      s.moveSpeed *= 1.12;
    },
    available: (s) => s.moveSpeed < 300,
  },
  {
    id: 'vitality',
    name: 'Vitality',
    desc: '+3 max HP, heal 3',
    apply: (s, player) => {
      s.maxHp += 3;
      player.heal(3);
    },
  },
  {
    id: 'range',
    name: 'Long Sight',
    desc: '+20% range',
    apply: (s) => {
      s.range *= 1.2;
    },
    available: (s) => s.range < 700,
  },
];

/** Picks distinct random upgrades among those still available. */
export function pickUpgrades(stats: Stats, count: number = PROGRESSION.choicesPerLevelUp): Upgrade[] {
  const pool = UPGRADES.filter((u) => !u.available || u.available(stats));
  // Fisher-Yates shuffle, then take the first `count`.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
