/** Classic grid dimensions, ported from the original alien-invaders clone. */
export const DEFAULT_WIDTH = 15;
export const DEFAULT_HEIGHT = 15;

/** The original two-block formation of 30 invaders. */
export const DEFAULT_INVADERS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 30, 31,
  32, 33, 34, 35, 36, 37, 38, 39,
];

/** Row 13, column 7 on a 15-wide grid — bottom-centre. */
export const DEFAULT_SHOOTER = 202;

export const DEFAULT_INVADER_STEP_MS = 500;
export const DEFAULT_LASER_STEP_MS = 100;
export const DEFAULT_EXPLOSION_MS = 300;
