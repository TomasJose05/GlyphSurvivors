import '@fontsource/vt323';
import './style.css';
import { Renderer } from './engine/renderer';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const renderer = new Renderer(canvas);

function render(): void {
  renderer.clear();
  renderer.drawGroundGrid();
}

// The canvas can't use a font until it is loaded, so wait for it before measuring and drawing.
document.fonts.load('20px "VT323"').then(() => {
  renderer.applyFont();
  render();
});

// Redraw on resize (static for now; step 2 will introduce the real game loop).
window.addEventListener('resize', render);
