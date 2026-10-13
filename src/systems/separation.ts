import { ENEMY_SPACING } from '../config';
import type { Enemy } from '../entities/enemy';

/**
 * Gently pushes overlapping enemies apart. Without this, every enemy chasing the player follows
 * the same straight line and they all collapse into a single character.
 * Compares every pair (O(n^2)), which is fine for the ~150 enemies we cap at.
 */
export function separate(enemies: Enemy[]): void {
  const minDist = ENEMY_SPACING;
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const a = enemies[i];
      const b = enemies[j];
      // Flying enemies (bats) pass through everything, so a flock keeps its shape.
      if (a.type.ghost || b.type.ghost) continue;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      if (Math.abs(dx) > minDist || Math.abs(dy) > minDist) continue; // cheap early-out
      let dist = Math.hypot(dx, dy);
      if (dist >= minDist) continue;
      if (dist < 0.001) {
        // Exactly on top of each other: pick a random direction so they can separate.
        const angle = Math.random() * Math.PI * 2;
        dx = Math.cos(angle);
        dy = Math.sin(angle);
        dist = 1;
      }
      const push = (minDist - dist) / 2; // each one moves half the overlap
      const nx = dx / dist;
      const ny = dy / dist;
      a.x -= nx * push;
      a.y -= ny * push;
      b.x += nx * push;
      b.y += ny * push;
    }
  }
}
