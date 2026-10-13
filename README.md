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
- [x] 7. Game over screen, restart and best time in localStorage

## Difficulty

Modeled on Vampire Survivors: a gentle first couple of minutes, then a steady (convex) ramp.

- Enemies spawn faster over time (`startRate` + linear + quadratic term), have more HP and hit harder.
- New enemy types unlock in phases: `z` at 0:00, `s` at 1:00, `W` at 2:00, `v` (faster than you) at 3:00, `M` mini-boss at 6:00.
- Every minute (from 1:30) a **swarm** ring closes in from all sides.
- Every upgrade has a max level, so power is capped and late waves eventually overwhelm you.

All the numbers live in `DIFFICULTY`, `ENEMY_TYPES`, `PROGRESSION` and the upgrade list in `src/config.ts` / `src/systems/upgrades.ts`.
They were tuned with a headless simulator and a simple kiting bot (median survival ~10 min, almost nobody dies in the first 3 minutes).
