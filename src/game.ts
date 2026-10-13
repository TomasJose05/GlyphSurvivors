import { PROGRESSION } from './config';
import { Camera } from './engine/camera';
import { Input } from './engine/input';
import type { Renderer } from './engine/renderer';
import type { Enemy } from './entities/enemy';
import { Player } from './entities/player';
import { loadBestTime, saveBestTime } from './storage';
import { Combat } from './systems/combat';
import { Particles } from './systems/particles';
import { Progression } from './systems/progression';
import { separate } from './systems/separation';
import { Spawner } from './systems/spawner';
import { createStats } from './systems/stats';
import { pickUpgrades } from './systems/upgrades';
import { drawGameOver, type RunSummary } from './ui/gameOver';
import { drawHud } from './ui/hud';
import { UpgradeMenu } from './ui/upgradeMenu';
import { generateScenery } from './world/scenery';
import { World } from './world/world';

// Keys that restart the game from the game over screen.
const RESTART_KEYS = ['Enter', 'NumpadEnter', 'Space', 'KeyR'];
// Input is ignored for this long after dying, so a key you were mashing in the fight
// doesn't skip the game over screen before you can read it.
const RESTART_DELAY = 0.8; // seconds

/**
 * Owns everything that exists in the game and advances it one frame at a time.
 * Some of it lives as long as the page (renderer, input, world, camera); the rest belongs
 * to a single run and is recreated by `reset()`.
 */
export class Game {
  // --- Lives as long as the page ---
  private readonly renderer: Renderer;
  private readonly input = new Input();
  private readonly camera = new Camera();
  private readonly menu = new UpgradeMenu();
  private readonly world: World;

  // --- Belongs to the current run; (re)created in reset(), hence the `!` ---
  private player!: Player;
  private enemies!: Enemy[];
  private spawner!: Spawner;
  private combat!: Combat;
  private progression!: Progression;
  private particles!: Particles;
  private pendingLevelUps = 0; // levels gained that still need an upgrade chosen
  private elapsed = 0; // seconds survived in this run
  private kills = 0;
  private best = 0; // best time in seconds, loaded from localStorage
  private over: { summary: RunSummary; restartIn: number } | null = null; // set once the player dies

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.world = new World(renderer.cellW, renderer.cellH);
    this.renderer.buildGroundCache(this.world, generateScenery(this.world));
    this.reset();
  }

  /** Starts a fresh run. */
  private reset(): void {
    // Start in the middle of the world.
    this.player = new Player(this.world.width / 2, this.world.height / 2, createStats());
    this.enemies = [];
    this.spawner = new Spawner();
    this.combat = new Combat();
    this.progression = new Progression();
    this.particles = new Particles();
    this.pendingLevelUps = 0;
    this.elapsed = 0;
    this.kills = 0;
    this.best = loadBestTime();
    this.over = null;
    // Discard anything pressed or clicked before the run started.
    this.input.takePressed();
    this.input.takeClicks();
  }

  update(dt: number): void {
    if (this.over) {
      this.updateGameOver(dt);
      return;
    }

    // While the upgrade menu is open the world is paused: we only listen for the player's choice.
    if (this.menu.isOpen) {
      const chosen = this.menu.handleInput(this.input, this.renderer);
      if (chosen) {
        chosen.apply(this.player.stats, this.player);
        this.openNextLevelUp(); // several levels gained at once => several menus in a row
      }
      return;
    }

    this.elapsed += dt;
    this.player.update(dt, this.input, this.world);
    this.camera.follow(this.player.x, this.player.y, this.renderer.width, this.renderer.height, this.world);

    const view = { x: this.camera.x, y: this.camera.y, w: this.renderer.width, h: this.renderer.height };
    this.spawner.update(dt, view, this.world, this.enemies);

    for (const enemy of this.enemies) enemy.update(dt, this.player.x, this.player.y);
    separate(this.enemies);

    const killed = this.combat.update(dt, this.player, this.enemies);
    for (const enemy of killed) {
      this.kills++;
      this.pendingLevelUps += this.progression.addXp(enemy.type.xp);
      this.particles.burst(enemy.x, enemy.y, enemy.type.char, enemy.type.color);
    }
    this.particles.update(dt);

    if (this.player.dead) {
      this.endRun();
      return;
    }
    this.openNextLevelUp();

    // Clicks and key presses made while playing must not leak into the next menu.
    this.input.takePressed();
    this.input.takeClicks();
  }

  private updateGameOver(dt: number): void {
    if (!this.over) return;
    this.over.restartIn = Math.max(0, this.over.restartIn - dt);

    const pressed = this.input.takePressed();
    const clicked = this.input.takeClicks().length > 0;
    if (this.over.restartIn === 0 && (clicked || pressed.some((key) => RESTART_KEYS.includes(key)))) {
      this.reset();
    }
  }

  /** Called once, the frame the player dies: works out the summary and saves a new record. */
  private endRun(): void {
    const newRecord = this.elapsed > this.best;
    if (newRecord) {
      this.best = this.elapsed;
      saveBestTime(this.best);
    }
    this.over = {
      summary: {
        time: this.elapsed,
        best: this.best,
        newRecord,
        level: this.progression.level,
        kills: this.kills,
      },
      restartIn: RESTART_DELAY,
    };
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
    drawHud(this.renderer, this.player, this.progression, this.elapsed, this.best);

    if (this.menu.isOpen) this.menu.draw(this.renderer);
    if (this.over) drawGameOver(this.renderer, this.over.summary, this.over.restartIn === 0);
  }
}
