# Glyph Survivors

A browser-based, single-player ASCII survivors-like built with TypeScript, Vite and the Canvas 2D API.
Move with WASD or the arrow keys, auto-attack the nearest enemy, level up and survive the horde.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The output goes to `dist/` and can be deployed as a static site (e.g. Netlify).

## Roadmap

- [x] 1. Vite + TypeScript project and a character grid on a dark canvas
- [x] 2. Player (`@`) with keyboard movement
- [x] 3. Enemies that spawn at the edges and chase the player
- [x] 4. Auto-attack on the nearest enemy and a health system
- [x] 5. Experience, levels and the upgrade menu
- [x] 6. Visual effects: colors, death particles, ASCII trees
- [ ] 7. Game over screen, restart and best time in localStorage
