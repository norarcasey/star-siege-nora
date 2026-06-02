import {
  DEFAULT_EXPLOSION_MS,
  DEFAULT_HEIGHT,
  DEFAULT_INVADER_STEP_MS,
  DEFAULT_INVADERS,
  DEFAULT_LASER_STEP_MS,
  DEFAULT_SHOOTER,
  DEFAULT_WIDTH,
} from './constants';
import type { GameConfig, GameState, GameStatus } from './types';

/**
 * The framework-agnostic core of Nora's Star Siege.
 *
 * It owns all game state and the rules that mutate it. It performs no
 * rendering, touches no DOM, and starts no timers — the caller advances
 * time by calling {@link tick} and reads a snapshot via {@link getState}.
 * Because nothing is module-level, any number of engines can run at once.
 *
 * This is a port of the original clone's `grid`, `alien-invaders`,
 * `shooter`, and `game` modules, with their shared mutable singletons
 * folded into instance fields.
 */
export class GameEngine {
  readonly width: number;
  readonly height: number;

  private readonly invaderStepMs: number;
  private readonly laserStepMs: number;
  private readonly explosionMs: number;
  private readonly startInvaders: number[];
  private readonly startShooter: number;

  private invaders: number[] = [];
  private shooter: number = DEFAULT_SHOOTER;
  private lasers: number[] = [];
  /** Maps an exploding cell index to its remaining lifetime in ms. */
  private explosions = new Map<number, number>();
  private score = 0;
  private status: GameStatus = 'playing';

  // Invader marching state (ported from the original `direction`/`goingRight`).
  private direction = 1;
  private goingRight = true;

  // Time accumulators so logic steps fire at fixed intervals regardless
  // of how often (or irregularly) the caller ticks.
  private invaderAccum = 0;
  private laserAccum = 0;

  constructor(config: GameConfig = {}) {
    this.width = config.width ?? DEFAULT_WIDTH;
    this.height = config.height ?? DEFAULT_HEIGHT;
    this.invaderStepMs = config.invaderStepMs ?? DEFAULT_INVADER_STEP_MS;
    this.laserStepMs = config.laserStepMs ?? DEFAULT_LASER_STEP_MS;
    this.explosionMs = config.explosionMs ?? DEFAULT_EXPLOSION_MS;
    this.startInvaders = config.initialInvaders ?? DEFAULT_INVADERS;
    this.startShooter = config.initialShooter ?? DEFAULT_SHOOTER;
    this.reset();
  }

  /** Restore the engine to its initial, playable state. */
  reset(): void {
    this.invaders = [...this.startInvaders];
    this.shooter = this.startShooter;
    this.lasers = [];
    this.explosions = new Map();
    this.score = 0;
    this.status = 'playing';
    this.direction = 1;
    this.goingRight = true;
    this.invaderAccum = 0;
    this.laserAccum = 0;
  }

  /** Read an immutable snapshot of the current state. */
  getState(): GameState {
    return {
      width: this.width,
      height: this.height,
      invaders: [...this.invaders],
      shooter: this.shooter,
      lasers: [...this.lasers],
      explosions: [...this.explosions.keys()],
      score: this.score,
      status: this.status,
    };
  }

  // --- Grid helpers (ported from grid.ts) ---

  private onLeftEdge(index: number): boolean {
    return index % this.width === 0;
  }

  private onRightEdge(index: number): boolean {
    return index % this.width === this.width - 1;
  }

  // --- Player actions (ported from shooter.ts) ---

  /** Move the player one cell left, unless against the wall. */
  moveLeft(): void {
    if (this.status === 'playing' && !this.onLeftEdge(this.shooter)) {
      this.shooter -= 1;
    }
  }

  /** Move the player one cell right, unless against the wall. */
  moveRight(): void {
    if (this.status === 'playing' && !this.onRightEdge(this.shooter)) {
      this.shooter += 1;
    }
  }

  /** Fire a laser from the player's current position. */
  shoot(): void {
    if (this.status === 'playing') {
      this.lasers.push(this.shooter);
    }
  }

  // --- Time advancement ---

  /**
   * Advance the simulation by `dt` milliseconds. Invaders, lasers, and
   * explosions each progress on their own fixed cadence, so the visual
   * result is identical whether called once per frame or in larger steps.
   */
  tick(dt: number): void {
    this.ageExplosions(dt);
    if (this.status !== 'playing') return;

    this.laserAccum += dt;
    while (this.laserAccum >= this.laserStepMs) {
      this.laserAccum -= this.laserStepMs;
      this.stepLasers();
    }

    this.invaderAccum += dt;
    while (this.invaderAccum >= this.invaderStepMs) {
      this.invaderAccum -= this.invaderStepMs;
      this.moveInvaders();
      this.checkStatus();
      if (this.status !== 'playing') break;
    }
  }

  private ageExplosions(dt: number): void {
    for (const [index, remaining] of this.explosions) {
      const left = remaining - dt;
      if (left <= 0) this.explosions.delete(index);
      else this.explosions.set(index, left);
    }
  }

  /** Move every laser up one row, resolving hits and off-screen exits. */
  private stepLasers(): void {
    const survivors: number[] = [];

    for (const laser of this.lasers) {
      const next = laser - this.width;

      if (next < 0) {
        // Off the top of the grid — the shot is spent.
        continue;
      }

      const hitAt = this.invaders.indexOf(next);
      if (hitAt !== -1) {
        this.invaders.splice(hitAt, 1);
        this.explosions.set(next, this.explosionMs);
        this.score += 1;
        // Laser is consumed by the hit.
      } else {
        survivors.push(next);
      }
    }

    this.lasers = survivors;
  }

  /**
   * The automated invader march: slide left/right, dropping down a row
   * and reversing whenever the formation reaches an edge.
   * Ported from alien-invaders.ts `moveInvaders`.
   */
  private moveInvaders(): void {
    if (this.invaders.length === 0) return;

    // Scan the whole formation: any invader touching the edge in the current
    // travel direction turns the formation around. Checking only the first and
    // last cells breaks once shots punch holes in the block, letting an edge
    // invader step sideways and wrap onto the next row.
    if (this.goingRight && this.invaders.some((i) => this.onRightEdge(i))) {
      this.dropAndReverse(-1);
      return;
    }

    if (!this.goingRight && this.invaders.some((i) => this.onLeftEdge(i))) {
      this.dropAndReverse(1);
      return;
    }

    for (let i = 0; i < this.invaders.length; i++) {
      this.invaders[i] += this.direction;
    }
  }

  /** Drop the whole formation one row and reverse its travel direction. */
  private dropAndReverse(direction: number): void {
    for (let i = 0; i < this.invaders.length; i++) {
      this.invaders[i] += this.width;
    }
    this.direction = direction;
    this.goingRight = direction === 1;
  }

  /** Resolve win/lose conditions (ported from index.ts `checkStatus`). */
  private checkStatus(): void {
    if (this.invaders.length === 0) {
      this.status = 'won';
      return;
    }

    if (this.invaders.includes(this.shooter)) {
      this.status = 'lost';
      return;
    }

    if (this.invaders.some((index) => index >= this.width * this.height)) {
      this.status = 'lost';
    }
  }
}
