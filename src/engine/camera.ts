import type { World } from '../world/world';

/** The camera is just the world position (in pixels) of the screen's top-left corner. */
export class Camera {
  x = 0;
  y = 0;

  /** Center on a point, but never show anything beyond the world's border. */
  follow(targetX: number, targetY: number, viewW: number, viewH: number, world: World): void {
    // The border ring is drawn one cell outside the playable area, so allow the camera to reach it.
    this.x = this.axis(targetX, viewW, world.width, world.cellW);
    this.y = this.axis(targetY, viewH, world.height, world.cellH);
  }

  private axis(target: number, view: number, worldSize: number, margin: number): number {
    // If the world (with its border) is smaller than the window on this axis, just center it.
    if (worldSize + margin * 2 <= view) return Math.round((worldSize - view) / 2);
    const wanted = target - view / 2;
    // Rounded so glyphs land on whole pixels while scrolling (otherwise text looks blurry).
    return Math.round(Math.min(Math.max(wanted, -margin), worldSize - view + margin));
  }
}
