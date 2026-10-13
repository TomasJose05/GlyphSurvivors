import { Camera } from './engine/camera';
import { Input } from './engine/input';
import type { Renderer } from './engine/renderer';
import { Player } from './entities/player';
import { World } from './world/world';

/** Owns everything that exists in a run and advances it one frame at a time. */
export class Game {
  private readonly renderer: Renderer;
  private readonly input = new Input();
  private readonly camera = new Camera();
  private readonly world: World;
  private readonly player: Player;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.world = new World(renderer.cellW, renderer.cellH);
    this.renderer.buildGroundCache(this.world);
    // Start in the middle of the world.
    this.player = new Player(this.world.width / 2, this.world.height / 2);
  }

  update(dt: number): void {
    this.player.update(dt, this.input, this.world);
    this.camera.follow(this.player.x, this.player.y, this.renderer.width, this.renderer.height, this.world);
  }

  render(): void {
    const { x, y } = this.camera;
    this.renderer.clear();
    this.renderer.drawGround(this.world, x, y);
    this.player.draw(this.renderer, x, y);
  }
}
