import { CHARACTERS, characterById, type Character } from './characters';
import { PROGRESSION } from './config';
import { Camera } from './engine/camera';
import { Input } from './engine/input';
import type { Renderer } from './engine/renderer';
import type { Enemy, EnemyEnv } from './entities/enemy';
import { Player } from './entities/player';
import { loadBestTime, loadLastCharacter, saveBestTime, saveLastCharacter } from './storage';
import { Combat } from './systems/combat';
import { Particles } from './systems/particles';
import { Progression } from './systems/progression';
import { separate } from './systems/separation';
import { Spawner } from './systems/spawner';
import { createStats } from './systems/stats';
import { pickOffers } from './systems/upgrades';
import { drawGameOver, type RunSummary } from './ui/gameOver';
import { drawHud } from './ui/hud';
import { StartMenu } from './ui/startMenu';
import { UpgradeMenu } from './ui/upgradeMenu';
import { createLoadout, type Loadout } from './weapons/loadout';
import { World } from './world/world';

// Keys on the game over screen: play again with the same character, or go back to the menu.
const RESTART_KEYS = ['Enter', 'NumpadEnter', 'Space', 'KeyR'];
const MENU_KEYS = ['KeyM', 'Escape'];
// Input is ignored for this long after dying, so a key you were mashing in the fight
// doesn't skip the game over screen before you can read it.
const RESTART_DELAY = 0.8; // seconds

/**
 * Owns everything that exists in the game and advances it one frame at a time.
 * Some of it lives as long as the page (renderer, input, world, camera, menus); the rest belongs
 * to a single run and is recreated by `startRun()`.
 */
export class Game {
  // --- Lives as long as the page ---
  private readonly renderer: Renderer;
  private readonly input = new Input();
  private readonly camera = new Camera();
  private readonly menu = new UpgradeMenu(); // the level-up screen
  private readonly startMenu = new StartMenu(); // the title / character select screen
  private readonly world: World;
  private mode: 'menu' | 'playing' = 'menu';
  private bests: Record<string, number> = {}; // best time per character id, for the menu

  // --- Belongs to the current run; (re)created in startRun(), hence the `!` ---
  private character!: Character;
  private player!: Player;
  private enemies!: Enemy[];
  private spawner!: Spawner;
  private combat!: Combat;
  private loadout!: Loadout;
  private enemyEnv!: EnemyEnv;
  private progression!: Progression;
  private particles!: Particles;
  private pendingLevelUps = 0; // levels gained that still need an upgrade chosen
  private elapsed = 0; // seconds survived in this run
  private kills = 0;
  private best = 0; // best time of the current character, in seconds
  private over: { summary: RunSummary; restartIn: number } | null = null; // set once the player dies

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.world = new World(renderer.cellW, renderer.cellH);
    this.renderer.buildGroundTile(this.world);
    this.refreshBests();
    this.startMenu.select(characterById(loadLastCharacter()).id);
  }

  private refreshBests(): void {
    this.bests = Object.fromEntries(CHARACTERS.map((c) => [c.id, loadBestTime(c.id)]));
  }

  /** Starts a fresh run as `character`. */
  private startRun(character: Character): void {
    this.mode = 'playing';
    this.character = character;
    // The character's bonus is applied on top of the default stats.
    const stats = createStats();
    character.apply(stats);
    // Start in the middle of the world.
    this.player = new Player(this.world.width / 2, this.world.height / 2, stats, character.glyph, character.color);
    this.enemies = [];
    this.spawner = new Spawner();
    this.combat = new Combat();
    this.loadout = createLoadout(character.weaponId);
    this.enemyEnv = this.combat.makeEnv(this.world.width, this.world.height);
    this.progression = new Progression();
    this.particles = new Particles();
    this.pendingLevelUps = 0;
    this.elapsed = 0;
    this.kills = 0;
    this.best = loadBestTime(character.id);
    this.over = null;
    this.menu.open([]); // make sure no level-up screen is left over from a previous run
    // Frame the player right away, so the first frame doesn't use the menu's camera.
    this.camera.follow(this.player.x, this.player.y, this.renderer.width, this.renderer.height, this.world);
    // Discard anything pressed or clicked before the run started.
    this.input.takePressed();
    this.input.takeClicks();
  }

  update(dt: number): void {
    if (this.mode === 'menu') {
      const chosen = this.startMenu.handleInput(this.input, this.renderer);
      if (chosen) {
        saveLastCharacter(chosen.id);
        this.startRun(chosen);
      }
      return;
    }

    if (this.over) {
      this.updateGameOver(dt);
      return;
    }

    // While the upgrade menu is open the world is paused: we only listen for the player's choice.
    if (this.menu.isOpen) {
      const chosen = this.menu.handleInput(this.input, this.renderer);
      if (chosen) {
        chosen.apply();
        this.openNextLevelUp(); // several levels gained at once => several menus in a row
      }
      return;
    }

    this.elapsed += dt;
    this.player.update(dt, this.input, this.world);
    this.camera.follow(this.player.x, this.player.y, this.renderer.width, this.renderer.height, this.world);

    const view = { x: this.camera.x, y: this.camera.y, w: this.renderer.width, h: this.renderer.height };
    this.spawner.update(dt, view, this.world, this.enemies);

    for (const enemy of this.enemies) enemy.update(dt, this.player.x, this.player.y, this.enemyEnv);
    separate(this.enemies);

    // Weapons first (they deal the damage), then the rest of combat removes the dead.
    this.loadout.update(dt, { player: this.player, stats: this.player.stats, enemies: this.enemies, view });
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
    if (this.over.restartIn > 0) return;

    if (pressed.some((key) => MENU_KEYS.includes(key))) {
      this.mode = 'menu';
      this.over = null;
      this.refreshBests();
    } else if (clicked || pressed.some((key) => RESTART_KEYS.includes(key))) {
      this.startRun(this.character);
    }
  }

  /** Called once, the frame the player dies: works out the summary and saves a new record. */
  private endRun(): void {
    const newRecord = this.elapsed > this.best;
    if (newRecord) {
      this.best = this.elapsed;
      saveBestTime(this.character.id, this.best);
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
    while (this.pendingLevelUps > 0) {
      this.pendingLevelUps--;
      const choices = pickOffers(this.player, this.loadout, PROGRESSION.choicesPerLevelUp);
      if (choices.length > 0) {
        this.menu.open(choices);
        return;
      }
      // Everything is maxed out: there's nothing left to pick, so the level-up is simply skipped.
    }
  }

  render(): void {
    this.renderer.clear();

    if (this.mode === 'menu') {
      // Behind the menu: the middle of the arena, so the title screen already looks like the game.
      const x = this.world.width / 2 - this.renderer.width / 2;
      const y = this.world.height / 2 - this.renderer.height / 2;
      this.renderer.drawGround(this.world, x, y);
      this.startMenu.draw(this.renderer, this.bests);
      return;
    }

    const { x, y } = this.camera;
    this.renderer.drawGround(this.world, x, y);
    for (const enemy of this.enemies) enemy.draw(this.renderer, x, y);
    this.particles.draw(this.renderer, x, y);
    this.loadout.draw(this.renderer, x, y);
    this.combat.draw(this.renderer, x, y);
    this.player.draw(this.renderer, x, y); // after the enemies, so the player is on top
    drawHud(this.renderer, this.player, this.progression, this.loadout, this.elapsed, this.best);

    if (this.spawner.alert > 0 && !this.over) {
      // Blinks so it catches the eye without covering the action.
      const on = Math.floor(this.spawner.alert * 4) % 2 === 0;
      const label = this.spawner.alertLabel;
      this.renderer.drawGlyph(on ? `!! ${label} !!` : '', '#ff6b5e', this.renderer.width / 2, this.renderer.height * 0.2);
    }

    if (this.menu.isOpen) this.menu.draw(this.renderer);
    if (this.over) drawGameOver(this.renderer, this.over.summary, this.over.restartIn === 0);
  }
}
