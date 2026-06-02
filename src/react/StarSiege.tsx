import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { GameState } from '../engine/types';
import { useStarSiege } from './useStarSiege';
import type { UseStarSiegeOptions } from './useStarSiege';

/** Fill colours for each kind of cell. Defaults echo the original clone. */
export interface StarSiegeColors {
  background?: string;
  invader?: string;
  shooter?: string;
  laser?: string;
  explosion?: string;
}

export interface StarSiegeProps extends UseStarSiegeOptions {
  /** Pixel size of each grid cell. Default 24. */
  cellSize?: number;
  colors?: StarSiegeColors;
  /** Show the score / win / lose banner above the board. Default true. */
  showStatus?: boolean;
  /** Called once when the player clears every invader. */
  onWin?: (finalScore: number) => void;
  /** Called once when an invader reaches the player or the bottom. */
  onLose?: (finalScore: number) => void;
  /** Called whenever the score changes. */
  onScoreChange?: (score: number) => void;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_COLORS: Required<StarSiegeColors> = {
  background: '#000000',
  invader: '#22c55e',
  shooter: '#ec4899',
  laser: '#3b82f6',
  explosion: '#f97316',
};

function draw(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cell: number,
  colors: Required<StarSiegeColors>
): void {
  const { width, height } = state;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, width * cell, height * cell);

  const rect = (index: number) => {
    const col = index % width;
    const row = Math.floor(index / width);
    return [col * cell, row * cell] as const;
  };

  // Invaders, drawn as rounded blocks.
  ctx.fillStyle = colors.invader;
  const radius = cell * 0.35;
  for (const index of state.invaders) {
    const [x, y] = rect(index);
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, cell - 2, cell - 2, radius);
    ctx.fill();
  }

  // Lasers.
  ctx.fillStyle = colors.laser;
  for (const index of state.lasers) {
    const [x, y] = rect(index);
    ctx.fillRect(x + cell * 0.4, y, cell * 0.2, cell);
  }

  // Player ship.
  {
    ctx.fillStyle = colors.shooter;
    const [x, y] = rect(state.shooter);
    ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
  }

  // Explosions, drawn on top.
  ctx.fillStyle = colors.explosion;
  for (const index of state.explosions) {
    const [x, y] = rect(index);
    ctx.beginPath();
    ctx.arc(x + cell / 2, y + cell / 2, cell * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * A drop-in, canvas-rendered build of Nora's Star Siege.
 *
 * ```tsx
 * <StarSiege cellSize={28} onWin={(score) => console.log('cleared!', score)} />
 * ```
 *
 * Arrow keys move and Space / Up fires (set `keyboard={false}` to handle
 * input yourself). For a fully custom UI, use {@link useStarSiege} directly.
 */
export function StarSiege({
  cellSize = 24,
  colors,
  showStatus = true,
  onWin,
  onLose,
  onScoreChange,
  className,
  style,
  ...options
}: StarSiegeProps) {
  const { state, reset } = useStarSiege(options);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const palette = { ...DEFAULT_COLORS, ...colors };

  // Redraw on every state change.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx, state, cellSize, palette);
  });

  // Fire lifecycle callbacks exactly once per transition.
  const lastStatus = useRef(state.status);
  useEffect(() => {
    if (state.status !== lastStatus.current) {
      lastStatus.current = state.status;
      if (state.status === 'won') onWin?.(state.score);
      if (state.status === 'lost') onLose?.(state.score);
    }
  }, [state.status, state.score, onWin, onLose]);

  const lastScore = useRef(state.score);
  useEffect(() => {
    if (state.score !== lastScore.current) {
      lastScore.current = state.score;
      onScoreChange?.(state.score);
    }
  }, [state.score, onScoreChange]);

  const banner =
    state.status === 'won'
      ? `You Win: ${state.score}`
      : state.status === 'lost'
        ? 'Game Over'
        : `${state.score}`;

  return (
    <div className={className} style={style}>
      {showStatus && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0, fontFamily: 'monospace' }}>{banner}</h1>
          {state.status !== 'playing' && (
            <button type="button" onClick={reset}>
              Play again
            </button>
          )}
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={state.width * cellSize}
        height={state.height * cellSize}
        style={{ display: 'block', imageRendering: 'pixelated' }}
      />
    </div>
  );
}
