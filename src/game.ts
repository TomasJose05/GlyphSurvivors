import { Camera } from './engine/camera';
import { Input } from './engine/input';
import type { Renderer } from './engine/renderer';
import { Enemy } from './entities/enemy';
import { Player } from './entities/player';
import { Combat } from './systems/combat';
import { separate } from './systems/separation';
import { Spawner } from './systems/spawner';
import { drawHud } from './ui/hud';
import { World } from './world/world';

/** Owns everything that exists in a run and advances it one frame at a time. */
export class Game {
  private readonly renderer: Renderer;
  private readonly input = new Input();
  private readonly camera = new Camera();
  private readonly spawner = new Spawner();
  private readonly combat = new Combat();
  private readonly world: World;
  private readonly player: Player;
  private readonly enemies: Enemy[] = [];

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.world = new World(renderer.cellW, renderer.cellH);
    this.renderer.buildGroundCache(this.world);
    // Start in the middle of the world.
    this.player = new Player(this.world.width / 2, this.world.height / 2);
  }

  update(dt: number): void {
    // The run is over: freeze everything. (Step 7 adds the proper game over screen and restart.)
    if (this.player.dead) return;

    this.player.update(dt, this.input, this.world);
    this.camera.follow(this.player.x, this.player.y, this.renderer.width, this.renderer.height, this.world);

    const view = { x: this.camera.x, y: this.camera.y, w: this.renderer.width, h: this.renderer.height };
    this.spawner.update(dt, view, this.world, this.enemies);

    for (const enemy of this.enemies) enemy.update(dt, this.player.x, this.player.y);
    separate(this.enemies);
    this.combat.update(dt, this.player, this.enemies);
  }

  render(): void {
    const { x, y } = this.camera;
    this.renderer.clear();
    this.renderer.drawGround(this.world, x, y);
    for (const enemy of this.enemies) enemy.draw(this.renderer, x, y);
    this.combat.draw(this.renderer, x, y);
    this.player.draw(this.renderer, x, y); // after the enemies, so the player is on top
    drawHud(this.renderer, this.player);

    if (this.player.dead) {
      this.renderer.drawGlyph('YOU DIED', '#e5584f', this.renderer.width / 2, this.renderer.height / 2);
    }
  }
}
