import { COLORS, PLAYER } from '../config';
import type { Input } from '../engine/input';
import type { Renderer } from '../engine/renderer';
import type { World } from '../world/world';

export class Player {
  // Position in world pixels (the center of the character). Movement is free, not tied to the grid.
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /** `dt` is the time since the last frame in seconds, so speed is the same at any frame rate. */
  update(dt: number, input: Input, world: World): void {
    const dir = input.axis();
    this.x += dir.x * PLAYER.speed * dt;
    this.y += dir.y * PLAYER.speed * dt;

    // Keep the player inside the world, a half cell away from the edges.
    const halfW = world.cellW / 2;
    const halfH = world.cellH / 2;
    this.x = Math.min(Math.max(this.x, halfW), world.width - halfW);
    this.y = Math.min(Math.max(this.y, halfH), world.height - halfH);
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    renderer.drawGlyph(PLAYER.char, COLORS.player, this.x - camX, this.y - camY);
  }
}
