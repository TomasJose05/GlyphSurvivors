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

## Weapons

You start with the Magic Bolt. Every level-up offers three options: a **new weapon**, the **next level of one you carry**
(weapons go from level 1 to 8), or a **passive**. You can carry up to 6 weapons and 6 passives at a time.

| Icon | Weapon | How it works |
|------|--------|--------------|
| `*` | Magic Bolt | fires at the nearest enemy |
| `/` | Throwing Daggers | throws daggers in the direction you are walking |
| `~` | Lash | whips a band beside you, alternating sides |
| `O` | Aura of Flame | a ring around you that burns and pushes enemies back |
| `+` | Orbiting Blades | blades that circle you and cut whatever they touch |
| `<` | Boomerang | flies out through enemies, then comes back |
| `\|` | Lightning | strikes random enemies on screen |
| `=` | Acid Pools | leaves damaging puddles on the ground |

Passives affect **every** weapon: Power (+damage), Quick Hands (-cooldown), Duplicator (+1 projectile/blade/strike),
Reach (+area/range), plus Swift Boots, Vitality and Bloodthirst.

Each weapon is a class in `src/weapons/` (its numbers sit at the top of its file, and `steps` describes what each level
adds). To add a new one, write the class and add a line to `WEAPON_FACTORIES` in `src/weapons/loadout.ts`.

## Difficulty

Modeled on Vampire Survivors: a gentle first couple of minutes, then a steady (convex) ramp.

- Enemies spawn faster over time, have more HP and hit harder.
- Every minute (from 1:30) a **swarm** ring closes in from all sides, and from 6:00 a **boss** arrives every 2 minutes.
- Every upgrade has a max level, so power is capped and late waves eventually overwhelm you.
- **Healing is scarce on purpose:** the only way to recover HP is the *Bloodthirst* upgrade (a small % of max HP per kill).

### Enemies

Each type has its own behavior (see `Behavior` in `src/config.ts`), unlocked in phases:

| Char | Behavior | From |
|------|----------|------|
| `z` | walks straight at you | 0:00 |
| `w` | weaves left and right on a sine wave | 0:45 |
| `s` | fast chaser | 1:00 |
| `v` | flock of bats that fly across the screen in a straight line | 1:30 |
| `W` | slow tank | 2:00 |
| `a` | archer: keeps its distance and shoots | 2:30 |
| `c` | charger: stops, flashes a warning, then dashes at you | 3:30 |
| `O` | splits into three small `o` when killed | 4:30 |
| `M` | boss: slow, huge, fires rings of bullets | 6:00, then every 2:00 |

All the numbers live in `DIFFICULTY`, `ENEMY_TYPES`, `PLAYER`, `LEECH`, `PROGRESSION` in `src/config.ts`
and the upgrade list in `src/systems/upgrades.ts`. They were tuned with a headless simulator and a simple
kiting bot. Rough survival medians: ~9 minutes when picking upgrades at random, ~20 minutes when spreading picks between
weapons and passives, ~5 minutes when only levelling weapons and ignoring passives (a human is usually worse than the bot at dodging).
