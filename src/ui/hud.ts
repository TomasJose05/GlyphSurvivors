import { HUD, PLAYER } from '../config';
import type { Renderer } from '../engine/renderer';
import type { Player } from '../entities/player';

/** Heads-up display drawn over the game, in screen coordinates (it doesn't move with the camera). */
export function drawHud(renderer: Renderer, player: Player): void {
  const filled = Math.round((player.hp / PLAYER.maxHp) * HUD.barWidth);
  const bar = '#'.repeat(filled) + '-'.repeat(HUD.barWidth - filled);
  // Green when healthy, amber when hurt, red when about to die.
  const ratio = player.hp / PLAYER.maxHp;
  const color = ratio > 0.6 ? '#7ddc8a' : ratio > 0.3 ? '#e8b84a' : '#e5584f';
  renderer.drawText(`HP [${bar}] ${player.hp}/${PLAYER.maxHp}`, color, HUD.margin, HUD.margin);
}
