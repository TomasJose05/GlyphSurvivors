import '@fontsource/vt323';
import './style.css';
import { FONT } from './config';
import { Renderer } from './engine/renderer';
import { Game } from './game';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const renderer = new Renderer(canvas);

function start(): void {
  // The font is loaded now, so character measurements are correct.
  renderer.applyFont();
  const game = new Game(renderer);

  let last = performance.now();
  function frame(now: number): void {
    // Clamp dt so that after a tab switch (where frames pause) we don't get a huge jump.
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    game.update(dt);
    game.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// The canvas can't use a font until it is loaded, so wait for it before measuring and drawing.
document.fonts.load(`${FONT.size}px "VT323"`).then(start);
