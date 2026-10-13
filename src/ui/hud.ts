import { HUD } from '../config';
import type { Renderer } from '../engine/renderer';
import type { Player } from '../entities/player';
import type { Progression } from '../systems/progression';
import { PASSIVES } from '../systems/upgrades';
import type { Loadout } from '../weapons/loadout';
import { formatTime } from './format';

/** A text bar such as `[####------]`, `ratio` being how full it is (0 to 1). */
function bar(ratio: number): string {
  const filled = Math.round(Math.min(Math.max(ratio, 0), 1) * HUD.barWidth);
  return `[${'#'.repeat(filled)}${'-'.repeat(HUD.barWidth - filled)}]`;
}

/** Heads-up display drawn over the game, in screen coordinates (it doesn't move with the camera). */
export function drawHud(
  renderer: Renderer,
  player: Player,
  progression: Progression,
  loadout: Loadout,
  elapsed: number,
  best: number,
): void {
  const maxHp = player.stats.maxHp;
  const ratio = player.hp / maxHp;
  // Green when healthy, amber when hurt, red when about to die.
  const hpColor = ratio > 0.6 ? '#7ddc8a' : ratio > 0.3 ? '#e8b84a' : '#e5584f';
  const hp = `HP ${bar(ratio)} ${Math.ceil(player.hp)}/${maxHp}`;
  renderer.drawText(hp, hpColor, HUD.margin, HUD.margin);

  const xp = `LV ${String(progression.level).padEnd(2)} ${bar(progression.xp / progression.xpToNext)}`;
  renderer.drawText(xp, '#7fb7ff', HUD.margin, HUD.margin + renderer.cellH * 1.2);

  // Under the bars: the weapons you carry (icon, name, level) and then your passives.
  const rowH = renderer.cellH * 1.1;
  let y = HUD.margin + renderer.cellH * 2.6;
  for (const weapon of loadout.weapons) {
    const level = weapon.maxed ? 'MAX' : `Lv${weapon.level}`;
    renderer.drawText(`${weapon.icon} ${weapon.name} ${level}`, '#ffe27a', HUD.margin, y);
    y += rowH;
  }
  const passives = PASSIVES.filter((p) => (player.stats.levels[p.id] ?? 0) > 0).map(
    (p) => `${p.name} ${player.stats.levels[p.id]}`,
  );
  if (passives.length > 0) renderer.drawText(passives.join('  '), '#7f93a3', HUD.margin, y + 4);

  // Top right: current time, and the record to beat (if there is one).
  const right = renderer.width - HUD.margin;
  renderer.drawText(`TIME ${formatTime(elapsed)}`, '#e8f0ff', right, HUD.margin, 'right');
  if (best > 0) {
    renderer.drawText(`BEST ${formatTime(best)}`, '#7f93a3', right, HUD.margin + renderer.cellH * 1.2, 'right');
  }
}
