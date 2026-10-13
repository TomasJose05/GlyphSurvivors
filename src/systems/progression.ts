import { PROGRESSION } from '../config';

/** Tracks experience and level. It only counts; what a level-up *means* is decided by the Game. */
export class Progression {
  level = 1;
  xp = 0; // XP gathered towards the next level

  /** XP needed to complete the current level. Grows linearly so each level takes a bit longer. */
  get xpToNext(): number {
    return PROGRESSION.firstLevelXp + (this.level - 1) * PROGRESSION.extraXpPerLevel;
  }

  /** Adds XP and returns how many levels were gained (a big reward can give more than one). */
  addXp(amount: number): number {
    this.xp += amount;
    let gained = 0;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      gained++;
    }
    return gained;
  }
}
