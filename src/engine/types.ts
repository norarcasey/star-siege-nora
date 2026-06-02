export type GameStatus = 'playing' | 'won' | 'lost';

/**
 * An immutable snapshot of the game at a single point in time.
 * All positions are flat cell indexes into a `width * height` grid
 * (row-major: `index = row * width + col`).
 */
export interface GameState {
  width: number;
  height: number;
  /** Cell indexes currently occupied by alien invaders. */
  invaders: number[];
  /** Cell index of the player's ship. */
  shooter: number;
  /** Cell indexes of in-flight lasers, travelling up the grid. */
  lasers: number[];
  /** Cell indexes showing an explosion this frame. */
  explosions: number[];
  score: number;
  status: GameStatus;
}

/**
 * Tuning options for a game. Every field is optional; omitted fields
 * fall back to the classic defaults (a 15x15 grid of 30 invaders).
 */
export interface GameConfig {
  /** Number of columns. Default 15. */
  width?: number;
  /** Number of rows. Default 15. */
  height?: number;
  /** Milliseconds between invader movement steps. Default 500. */
  invaderStepMs?: number;
  /** Milliseconds between laser movement steps. Default 100. */
  laserStepMs?: number;
  /** Milliseconds an explosion stays on screen. Default 300. */
  explosionMs?: number;
  /** Starting invader cell indexes. Defaults to the classic two-block formation. */
  initialInvaders?: number[];
  /** Starting shooter cell index. Defaults to near the bottom-centre. */
  initialShooter?: number;
}
