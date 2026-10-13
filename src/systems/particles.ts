import { PARTICLES } from '../config';
import type { Renderer } from '../engine/renderer';
import { Particle } from '../entities/particle';

/** Owns every live particle: spawns bursts, advances them and drops the ones that faded out. */
export class Particles {
  private readonly list: Particle[] = [];

  /** A burst of letters from a point: mostly `char` (the thing that died) mixed with small symbols. */
  burst(x: number, y: number, char: string, color: string): void {
    for (let i = 0; i < PARTICLES.perDeath; i++) {
      if (this.list.length >= PARTICLES.max) return; // too many on screen already; skip this one
      const angle = Math.random() * Math.PI * 2;
      const speed = PARTICLES.minSpeed + Math.random() * (PARTICLES.maxSpeed - PARTICLES.minSpeed);
      const life = PARTICLES.minLife + Math.random() * (PARTICLES.maxLife - PARTICLES.minLife);
      const useOwnChar = Math.random() < 0.6;
      const glyph = useOwnChar ? char : PARTICLES.extraChars[Math.floor(Math.random() * PARTICLES.extraChars.length)];
      this.list.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, life, glyph, color));
    }
  }

  update(dt: number): void {
    // Walk backwards so removing an element doesn't skip the next one.
    for (let i = this.list.length - 1; i >= 0; i--) {
      this.list[i].update(dt);
      if (this.list[i].expired) this.list.splice(i, 1);
    }
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    for (const p of this.list) p.draw(renderer, camX, camY);
  }
}
