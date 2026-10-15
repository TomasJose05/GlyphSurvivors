import { CHARACTERS, type Character } from '../characters';
import type { Input } from '../engine/input';
import type { Renderer } from '../engine/renderer';
import { WEAPON_FACTORIES } from '../weapons/loadout';
import { formatTime } from './format';

const INNER_COLS = 28; // characters between the card's side borders
const CARD_ROWS = 6; // border, name, weapon, perk, best time, border
const GAP_COLS = 3; // gap between cards in a row, in characters

const SELECTED_COLOR = '#ffe27a';
const IDLE_COLOR = '#6f8291';

const LEFT = ['ArrowLeft', 'KeyA'];
const RIGHT = ['ArrowRight', 'KeyD'];
const UP = ['ArrowUp', 'KeyW'];
const DOWN = ['ArrowDown', 'KeyS'];
const START = ['Enter', 'NumpadEnter', 'Space'];

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Title screen with the character selection. Cards flow into as many columns as fit the window. */
export class StartMenu {
  selected = 0;
  private columns = 1; // how many cards fit in a row; set every time the layout is computed

  /** Puts the cursor on a character (used to remember the last one that was picked). */
  select(id: string): void {
    const index = CHARACTERS.findIndex((c) => c.id === id);
    if (index >= 0) this.selected = index;
  }

  /** Handles keys and clicks. Returns the character to play as once the player confirms, else null. */
  handleInput(input: Input, renderer: Renderer): Character | null {
    this.layout(renderer); // refreshes `columns`
    const n = CHARACTERS.length;
    let start = false;

    for (const code of input.takePressed()) {
      if (LEFT.includes(code)) this.selected = (this.selected + n - 1) % n;
      else if (RIGHT.includes(code)) this.selected = (this.selected + 1) % n;
      else if (UP.includes(code)) this.selected = this.move(-this.columns);
      else if (DOWN.includes(code)) this.selected = this.move(this.columns);
      else if (START.includes(code)) start = true;
      else {
        // 1-8 jump straight to that character.
        const match = /^(?:Digit|Numpad)([1-9])$/.exec(code);
        if (match && Number(match[1]) <= n) this.selected = Number(match[1]) - 1;
      }
    }

    // Clicking a card selects it; clicking the one that is already selected starts the game.
    const rects = this.layout(renderer);
    for (const click of input.takeClicks()) {
      const index = rects.findIndex(
        (r) => click.x >= r.x && click.x <= r.x + r.w && click.y >= r.y && click.y <= r.y + r.h,
      );
      if (index < 0) continue;
      if (index === this.selected) start = true;
      else this.selected = index;
    }

    return start ? CHARACTERS[this.selected] : null;
  }

  /** Moves the cursor by `delta` cards (a whole row for up/down), staying inside the list. */
  private move(delta: number): number {
    const target = this.selected + delta;
    return target >= 0 && target < CHARACTERS.length ? target : this.selected;
  }

  /** `bests` maps a character id to its best time in seconds (0 if none). */
  draw(renderer: Renderer, bests: Record<string, number>): void {
    renderer.dim(0.55);
    const rects = this.layout(renderer);
    const cx = renderer.width / 2;
    const top = Math.min(...rects.map((r) => r.y));

    renderer.drawGlyph('GLYPH SURVIVORS', '#e8f0ff', cx, Math.max(34, top - renderer.cellH * 5.5), 1, 3);
    renderer.drawGlyph('Choose your character', '#8a97a3', cx, Math.max(72, top - renderer.cellH * 2.2));

    CHARACTERS.forEach((character, i) => {
      const { x, y } = rects[i];
      const isSelected = i === this.selected;
      const frame = isSelected ? SELECTED_COLOR : IDLE_COLOR;
      const weapon = WEAPON_FACTORIES.map((make) => make()).find((w) => w.id === character.weaponId);
      const edge = `+${'-'.repeat(INNER_COLS)}+`;
      const line = (text: string): string => `|${text.padEnd(INNER_COLS)}|`;
      const best = bests[character.id] ?? 0;

      const rows: [string, string][] = [
        [edge, frame],
        [line(`      ${i + 1}. ${character.name}`), isSelected ? '#ffffff' : '#c3ced8'],
        [line(` Weapon: ${weapon?.name ?? '?'}`), isSelected ? '#ffe9a0' : IDLE_COLOR],
        [line(` Perk:   ${character.perk}`), isSelected ? '#d4dde5' : IDLE_COLOR],
        [line(` Best:   ${best > 0 ? formatTime(best) : '--:--'}`), isSelected ? '#9fd0ff' : IDLE_COLOR],
        [edge, frame],
      ];
      rows.forEach(([text, color], row) => renderer.drawText(text, color, x, y + row * renderer.cellH));

      // The character's own glyph, drawn big on the left of the name line.
      renderer.drawGlyph(character.glyph, character.color, x + renderer.cellW * 3.5, y + renderer.cellH * 1.55, 1, 2);
    });

    // A line about the highlighted character's starting weapon, then the controls.
    const chosen = CHARACTERS[this.selected];
    const weapon = WEAPON_FACTORIES.map((make) => make()).find((w) => w.id === chosen.weaponId);
    // Anchored to the bottom of the window, so they stay visible however tall the card grid is.
    renderer.drawGlyph(
      `${chosen.name} starts with ${weapon?.name ?? '?'}: ${weapon?.blurb ?? ''}`,
      '#d4dde5',
      cx,
      renderer.height - renderer.cellH * 3.2,
    );
    renderer.drawGlyph(
      'Arrows / WASD or click to choose    ENTER or click again to start',
      '#8a97a3',
      cx,
      renderer.height - renderer.cellH * 1.6,
    );
  }

  /** Card rectangles in screen pixels, laid out in a grid centered in the window. */
  private layout(renderer: Renderer): Rect[] {
    const cardW = (INNER_COLS + 2) * renderer.cellW;
    const cardH = CARD_ROWS * renderer.cellH;
    const gap = GAP_COLS * renderer.cellW;
    const n = CHARACTERS.length;

    // As many columns as fit with a margin on both sides (at least one).
    this.columns = Math.max(1, Math.min(n, Math.floor((renderer.width - 32 + gap) / (cardW + gap))));
    const rows = Math.ceil(n / this.columns);
    // In a narrow window the cards stack into many rows: drop the gap between rows so everything fits.
    const rowGap = this.columns <= 2 ? 0 : renderer.cellH;
    const blockH = rows * cardH + (rows - 1) * rowGap;
    // Centered, but never so high that it covers the title nor so low that it hits the help text.
    const top = Math.max(110, (renderer.height - blockH) / 2);

    return CHARACTERS.map((_, i) => {
      const row = Math.floor(i / this.columns);
      const col = i % this.columns;
      // The last row may be incomplete: center it.
      const inRow = Math.min(this.columns, n - row * this.columns);
      const rowW = inRow * cardW + (inRow - 1) * gap;
      return {
        x: (renderer.width - rowW) / 2 + col * (cardW + gap),
        y: top + row * (cardH + rowGap),
        w: cardW,
        h: cardH,
      };
    });
  }
}
