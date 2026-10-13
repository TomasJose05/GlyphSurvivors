import type { Input } from '../engine/input';
import type { Renderer } from '../engine/renderer';
import type { Upgrade } from '../systems/upgrades';

const INNER_COLS = 24; // characters between the card's side borders
const CARD_ROWS = 6; // border, name, blank, description, blank, border
const GAP_COLS = 3; // gap between cards, in characters

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** "Pick one of N upgrades" screen. Cards are drawn with ASCII borders to match the rest of the game. */
export class UpgradeMenu {
  private choices: Upgrade[] = [];

  get isOpen(): boolean {
    return this.choices.length > 0;
  }

  open(choices: Upgrade[]): void {
    this.choices = choices;
  }

  /** Reads keys 1-3 and mouse clicks. Returns the chosen upgrade (and closes the menu), or null. */
  handleInput(input: Input, renderer: Renderer): Upgrade | null {
    let picked: Upgrade | null = null;

    for (const code of input.takePressed()) {
      const match = /^(?:Digit|Numpad)([1-9])$/.exec(code);
      if (match) picked ??= this.choices[Number(match[1]) - 1] ?? null;
    }

    const rects = this.layout(renderer);
    for (const click of input.takeClicks()) {
      const index = rects.findIndex(
        (r) => click.x >= r.x && click.x <= r.x + r.w && click.y >= r.y && click.y <= r.y + r.h,
      );
      if (index >= 0) picked ??= this.choices[index];
    }

    if (picked) this.choices = [];
    return picked;
  }

  draw(renderer: Renderer): void {
    renderer.dim(0.65);
    const rects = this.layout(renderer);

    renderer.drawGlyph('LEVEL UP!', '#ffe27a', renderer.width / 2, rects[0].y - renderer.cellH * 3);
    renderer.drawGlyph('Press 1 / 2 / 3 or click to choose', '#8a97a3', renderer.width / 2, rects[0].y - renderer.cellH * 1.5);

    this.choices.forEach((upgrade, i) => {
      const { x, y } = rects[i];
      const edge = `+${'-'.repeat(INNER_COLS)}+`;
      const line = (text: string): string => `|${text.padEnd(INNER_COLS)}|`;
      const lines = [
        edge,
        line(` [${i + 1}] ${upgrade.name}`),
        line(''),
        line(` ${upgrade.desc}`),
        line(''),
        edge,
      ];
      lines.forEach((text, row) => {
        // The name line is highlighted; the rest of the card is a calmer color.
        const color = row === 1 ? '#e8f0ff' : '#7f93a3';
        renderer.drawText(text, color, x, y + row * renderer.cellH);
      });
    });
  }

  /** Card rectangles in screen pixels. Cards sit side by side, or stacked if the window is too narrow. */
  private layout(renderer: Renderer): Rect[] {
    const cardW = (INNER_COLS + 2) * renderer.cellW;
    const cardH = CARD_ROWS * renderer.cellH;
    const gap = GAP_COLS * renderer.cellW;
    const n = this.choices.length;

    const rowW = n * cardW + (n - 1) * gap;
    const sideBySide = rowW <= renderer.width - 32;

    return this.choices.map((_, i) => {
      if (sideBySide) {
        return { x: (renderer.width - rowW) / 2 + i * (cardW + gap), y: (renderer.height - cardH) / 2, w: cardW, h: cardH };
      }
      const colH = n * cardH + (n - 1) * renderer.cellH;
      return {
        x: (renderer.width - cardW) / 2,
        y: (renderer.height - colH) / 2 + i * (cardH + renderer.cellH),
        w: cardW,
        h: cardH,
      };
    });
  }
}
