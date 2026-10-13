import { ENEMY_FLASH, ENEMY_RADIUS, ENEMY_TYPES, type EnemyType } from '../config';
import type { Renderer } from '../engine/renderer';

/** What an enemy may use from the outside world while acting: shooting bullets and knowing the map limits. */
export interface EnemyEnv {
  shoot(x: number, y: number, dirX: number, dirY: number, speed: number, damage: number): void;
  width: number; // world size in px
  height: number;
}

export function enemyTypeByChar(char: string): EnemyType {
  const type = ENEMY_TYPES.find((t) => t.char === char);
  if (!type) throw new Error(`Unknown enemy type: ${char}`);
  return type;
}

type ChargeState = 'approach' | 'windup' | 'dash' | 'recover';

export class Enemy {
  // Position in world pixels (the center of the character).
  x: number;
  y: number;
  hp: number;
  readonly damage: number; // contact/bullet damage, already scaled by how late in the run it spawned
  readonly hpMult: number; // remembered so enemies born from a split get the same scaling
  readonly damageMult: number;
  readonly type: EnemyType;
  flash = 0; // seconds left of the white "I was hit" flash
  gone = false; // left the area for good (e.g. a bat that flew past); removed without giving XP

  // Per-behavior state
  private age = 0; // seconds alive
  private readonly phase = Math.random() * Math.PI * 2; // makes each wave enemy swing out of sync
  private velX = 0; // swoop: fixed velocity, decided on the first frame
  private velY = 0;
  private shootTimer: number;
  private strafe = Math.random() < 0.5 ? 1 : -1; // shooter: which way it circles
  private chargeState: ChargeState = 'approach';
  private chargeTimer = 0;
  private aimX = 0;
  private aimY = 0;

  /** `hpMult` and `damageMult` are the time-based difficulty scaling applied when it spawns. */
  constructor(type: EnemyType, x: number, y: number, hpMult = 1, damageMult = 1) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.hpMult = hpMult;
    this.damageMult = damageMult;
    this.hp = type.hp * hpMult;
    this.damage = Math.max(1, Math.round(type.damage * damageMult));
    // Shooters don't all fire in the same frame: stagger the first shot.
    this.shootTimer = (type.shoot?.interval ?? 1) * (0.4 + Math.random() * 0.6);
  }

  get dead(): boolean {
    return this.hp <= 0;
  }

  get radius(): number {
    return this.type.radius ?? ENEMY_RADIUS;
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    this.flash = ENEMY_FLASH.duration;
  }

  /** Advances this enemy by `dt` seconds according to its behavior. (targetX, targetY) is the player. */
  update(dt: number, targetX: number, targetY: number, env: EnemyEnv): void {
    this.flash = Math.max(0, this.flash - dt);
    this.age += dt;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);
    // Unit vector pointing at the player (zero if we're exactly on top of them).
    const ux = dist > 0.001 ? dx / dist : 0;
    const uy = dist > 0.001 ? dy / dist : 0;

    switch (this.type.behavior) {
      case 'chase':
        this.move(ux, uy, this.type.speed, dt);
        break;
      case 'wave':
        this.updateWave(dt, ux, uy);
        break;
      case 'swoop':
        this.updateSwoop(dt, ux, uy, dist);
        break;
      case 'shooter':
        this.updateShooter(dt, ux, uy, dist, env);
        break;
      case 'charger':
        this.updateCharger(dt, ux, uy, dist);
        break;
      case 'boss':
        this.move(ux, uy, this.type.speed, dt);
        this.updateBossFire(dt, dist, env);
        break;
    }

    // Nobody walks off the map.
    this.x = Math.min(Math.max(this.x, 0), env.width);
    this.y = Math.min(Math.max(this.y, 0), env.height);
  }

  private move(dirX: number, dirY: number, speed: number, dt: number): void {
    this.x += dirX * speed * dt;
    this.y += dirY * speed * dt;
  }

  /** Walks toward the player while swinging side to side, so shots aimed at it tend to miss. */
  private updateWave(dt: number, ux: number, uy: number): void {
    const wave = this.type.wave ?? { amplitude: 60, frequency: 2.5 };
    // Sideways speed is the derivative of `amplitude * sin(frequency * t)`.
    const side = wave.amplitude * wave.frequency * Math.cos(this.age * wave.frequency + this.phase);
    this.x += (ux * this.type.speed - uy * side) * dt;
    this.y += (uy * this.type.speed + ux * side) * dt;
  }

  /** Picks a direction once (toward where the player is right now) and never turns after that. */
  private updateSwoop(dt: number, ux: number, uy: number, dist: number): void {
    if (this.age <= dt) {
      this.velX = ux * this.type.speed;
      this.velY = uy * this.type.speed;
    }
    this.x += this.velX * dt;
    this.y += this.velY * dt;
    // Once it has flown well past the player it's no use to anyone: remove it.
    if ((this.age > 1.5 && dist > 900) || this.age > 14) this.gone = true;
  }

  /** Keeps its distance (approach if too far, back off if too close, circle in between) and shoots. */
  private updateShooter(dt: number, ux: number, uy: number, dist: number, env: EnemyEnv): void {
    const near = 190;
    const far = 320;
    if (dist > far) this.move(ux, uy, this.type.speed, dt);
    else if (dist < near) this.move(-ux, -uy, this.type.speed * 0.8, dt);
    else this.move(-uy * this.strafe, ux * this.strafe, this.type.speed * 0.5, dt);

    const shoot = this.type.shoot;
    if (!shoot) return;
    this.shootTimer -= dt;
    if (this.shootTimer <= 0 && dist < shoot.range) {
      env.shoot(this.x, this.y, ux, uy, shoot.speed, this.damage);
      this.shootTimer = shoot.interval;
    }
  }

  /** approach -> windup (stands still and flashes) -> dash (straight line) -> recover -> approach... */
  private updateCharger(dt: number, ux: number, uy: number, dist: number): void {
    const charge = this.type.charge;
    if (!charge) return;

    switch (this.chargeState) {
      case 'approach':
        this.move(ux, uy, this.type.speed, dt);
        if (dist < charge.range) {
          this.chargeState = 'windup';
          this.chargeTimer = charge.windup;
        }
        break;
      case 'windup':
        // Blink as a warning, so the player has a moment to get out of the way.
        this.flash = Math.floor(this.age * 12) % 2 === 0 ? 0.05 : 0;
        this.chargeTimer -= dt;
        if (this.chargeTimer <= 0) {
          // The direction is locked in now: sidestepping during the dash works.
          this.aimX = ux;
          this.aimY = uy;
          this.chargeState = 'dash';
          this.chargeTimer = charge.dashTime;
        }
        break;
      case 'dash':
        this.move(this.aimX, this.aimY, charge.dashSpeed, dt);
        this.chargeTimer -= dt;
        if (this.chargeTimer <= 0) {
          this.chargeState = 'recover';
          this.chargeTimer = charge.recover;
        }
        break;
      case 'recover':
        this.chargeTimer -= dt;
        if (this.chargeTimer <= 0) this.chargeState = 'approach';
        break;
    }
  }

  /** Every few seconds, a ring of bullets in all directions (the ring slowly rotates between volleys). */
  private updateBossFire(dt: number, dist: number, env: EnemyEnv): void {
    const shoot = this.type.shoot;
    if (!shoot) return;
    this.shootTimer -= dt;
    if (this.shootTimer > 0 || dist > shoot.range) return;
    const ring = shoot.ring ?? 8;
    const spin = this.age * 0.7;
    for (let i = 0; i < ring; i++) {
      const angle = (i / ring) * Math.PI * 2 + spin;
      env.shoot(this.x, this.y, Math.cos(angle), Math.sin(angle), shoot.speed, this.damage);
    }
    this.shootTimer = shoot.interval;
  }

  draw(renderer: Renderer, camX: number, camY: number): void {
    const color = this.flash > 0 ? ENEMY_FLASH.color : this.type.color;
    renderer.drawGlyph(this.type.char, color, this.x - camX, this.y - camY, 1, this.type.size ?? 1);
  }
}
