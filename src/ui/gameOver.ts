import type { Renderer } from '../engine/renderer';
import { formatTime } from './format';

/** What the game over screen needs to show about the run that just ended. */
export interface RunSummary {
  time: number; // seconds survived
  best: number; // best time in seconds (already includes this run if it was a record)
  newRecord: boolean;
  level: number;
  kills: number;
}

const INNER_COLS = 32; // characters between the box borders

/** Game over screen: a dimmed game with an ASCII box in the middle. */
export function drawGameOver(renderer: Renderer, run: RunSummary, canRestart: boolean): void {
  renderer.dim(0.7);

  const edge = `+${'-'.repeat(INNER_COLS)}+`;
  const row = (text: string): string => `|${text.padEnd(INNER_COLS)}|`;
  const center = (text: string): string => {
    const left = Math.floor((INNER_COLS - text.length) / 2);
    return `${' '.repeat(left)}${text}`;
  };

  // Each line is [text, color].
  const lines: [string, string][] = [
    [edge, '#7f93a3'],
    [row(center('YOU DIED')), '#e5584f'],
    [row(''), '#7f93a3'],
    [row(`  Survived    ${formatTime(run.time)}`), '#e8f0ff'],
    [row(`  Best        ${formatTime(run.best)}`), run.newRecord ? '#ffe27a' : '#7f93a3'],
    [row(run.newRecord ? center('* NEW BEST TIME *') : ''), '#ffe27a'],
    [row(`  Level       ${run.level}`), '#7fb7ff'],
    [row(`  Kills       ${run.kills}`), '#7fb7ff'],
    [row(''), '#7f93a3'],
    [row(center(canRestart ? 'ENTER: play again   M: menu' : '')), '#8a97a3'],
    [edge, '#7f93a3'],
  ];

  const width = (INNER_COLS + 2) * renderer.cellW;
  const left = (renderer.width - width) / 2;
  const top = (renderer.height - lines.length * renderer.cellH) / 2;
  lines.forEach(([text, color], i) => renderer.drawText(text, color, left, top + i * renderer.cellH));
}
