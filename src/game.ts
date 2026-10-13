import { PROGRESSION } from './config';
import { Camera } from './engine/camera';
import { Input } from './engine/input';
import type { Renderer } from './engine/renderer';
import { Enemy } from './entities/enemy';
import { Player } from './entities/player';
import { Combat } from './systems/combat';
import { Particles } from './systems/particles';
import { Progression } from './systems/progression';
import { separate } from './systems/separation';
import { Spawner } from './systems/spawner';
import { createStats } from './systems/stats';
import { pickUpgrades } from './systems/upgrades';
import { drawHud } from './ui/hud';
import { UpgradeMenu } from './ui/upgradeMenu';
import { generateScenery } from './world/scenery';
import { World } from './world/world';

/** Owns everything that exists in a run and advances it one frame at a time. */
export class Game {
  private readonly renderer: Renderer;
  private readonly input = new Input();
  private readonly camera = new Camera();
  private readonly spawner = new Spawner();
  private readonly combat = new Combat();
  private readonly progression = new Progression();
  private readonly particles = new Particles();
  private readonly menu = new UpgradeMenu();
  private readonly world: World;
  private readonly player: Player;
  private readonly enemies: Enemy[] = [];
  private pendingLevelUps = 0; // levels gained that still need an upgrade chosen

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.world = new World(renderer.cellW, renderer.cellH);
    this.renderer.buildGroundCache(this.world, generateScenery(this.world));
    // Start in the middle of the world.
    this.player = new Player(this.world.width / 2, this.world.height / 2, createStats());
  }

  update(dt: number): void {
    // The run is over: freeze everything. (Step 7 adds the proper game over screen and restart.)
    if (this.player.dead) return;

    // While the upgrade menu is open the world is paused: we only listen for the player's choice.
    if (this.menu.isOpen) {
      const chosen = this.menu.handleInput(this.input, this.renderer);
      if (chosen) {
        chosen.apply(this.player.stats, this.player);
        this.openNextLevelUp(); // several levels gained at once => several menus in a row
      }
      return;
    }

    this.player.update(dt, this.input, this.world);
    this.camera.follow(this.player.x, this.player.y, this.renderer.width, this.renderer.height, this.world);

    const view = { x: this.camera.x, y: this.camera.y, w: this.renderer.width, h: this.renderer.height };
    this.spawner.update(dt, view, this.world, this.enemies);

    for (const enemy of this.enemies) enemy.update(dt, this.player.x, this.player.y);
    separate(this.enemies);

    const killed = this.combat.update(dt, this.player, this.enemies);
    for (const enemy of killed) {
      this.pendingLevelUps += this.progression.addXp(enemy.type.xp);
      this.particles.burst(enemy.x, enemy.y, enemy.type.char, enemy.type.color);
    }
    this.particles.update(dt);
    this.openNextLevelUp();

    // Clicks and key presses made while playing must not leak into the next menu.
    this.input.takePressed();
    this.input.takeClicks();
  }

  private openNextLevelUp(): void {
    if (this.pendingLevelUps <= 0) return;
    this.pendingLevelUps--;
    this.menu.open(pickUpgrades(this.player.stats, PROGRESSION.choicesPerLevelUp));
  }

  render(): void {
    const { x, y } = this.camera;
    this.renderer.clear();
    this.renderer.drawGround(this.world, x, y);
    for (const enemy of this.enemies) enemy.draw(this.renderer, x, y);
    this.particles.draw(this.renderer, x, y);
    this.combat.draw(this.renderer, x, y);
    this.player.draw(this.renderer, x, y); // after the enemies, so the player is on top
    drawHud(this.renderer, this.player, this.progression);

    if (this.menu.isOpen) this.menu.draw(this.renderer);

    if (this.player.dead) {
      this.renderer.drawGlyph('YOU DIED', '#e5584f', this.renderer.width / 2, this.renderer.height / 2);
    }
  }
}
