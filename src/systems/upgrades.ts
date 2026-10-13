import { PROGRESSION } from '../config';
import type { Player } from '../entities/player';
import type { Stats } from './stats';

export interface Upgrade {
  id: string;
  name: string;
  desc: string; // one short line, it has to fit inside a menu card
  maxLevel: number; // how many times it can be taken; once reached it's no longer offered
  apply(stats: Stats, player: Player): void;
}

export const UPGRADES: readonly Upgrade[] = [
  {
    id: 'damage',
    name: 'Sharper Rounds',
    desc: '+30% damage',
    maxLevel: 8,
    apply: (s) => {
      s.damage *= 1.3;
    },
  },
  {
    id: 'rate',
    name: 'Quick Hands',
    desc: '+18% fire rate',
    maxLevel: 6,
    apply: (s) => {
      s.fireInterval /= 1.18;
    },
  },
  {
    id: 'shots',
    name: 'Extra Shot',
    desc: '+1 projectile',
    maxLevel: 5,
    apply: (s) => {
      s.projectiles += 1;
    },
  },
  {
    id: 'speed',
    name: 'Swift Boots',
    desc: '+8% move speed',
    maxLevel: 5,
    apply: (s) => {
      s.moveSpeed *= 1.08;
    },
  },
  {
    id: 'vitality',
    name: 'Vitality',
    desc: '+3 max HP, heal 3',
    maxLevel: 8,
    apply: (s, player) => {
      s.maxHp += 3;
      player.heal(3);
    },
  },
  {
    id: 'regen',
    name: 'Recovery',
    desc: '+0.3 HP per second',
    maxLevel: 5,
    apply: (s) => {
      s.regen += 0.3;
    },
  },
  {
    id: 'range',
    name: 'Long Sight',
    desc: '+20% range',
    maxLevel: 4,
    apply: (s) => {
      s.range *= 1.2;
    },
  },
];

/** Applies an upgrade and records that it was taken (which is what limits it to `maxLevel` times). */
export function applyUpgrade(upgrade: Upgrade, stats: Stats, player: Player): void {
  upgrade.apply(stats, player);
  stats.levels[upgrade.id] = (stats.levels[upgrade.id] ?? 0) + 1;
}

/** Picks distinct random upgrades among those not yet maxed out. Can return fewer than `count`, or none. */
export function pickUpgrades(stats: Stats, count: number = PROGRESSION.choicesPerLevelUp): Upgrade[] {
  const pool = UPGRADES.filter((u) => (stats.levels[u.id] ?? 0) < u.maxLevel);
  // Fisher-Yates shuffle, then take the first `count`.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
