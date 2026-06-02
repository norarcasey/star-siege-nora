import { useEffect, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { GameState } from '../engine/types';
import { useStarSiege } from './useStarSiege';
import type { UseStarSiegeOptions } from './useStarSiege';
import { shipDataUrl } from './ship';
import { alienDataUrl } from './alien';
import { explosionDataUrl } from './explosion';
import { useSprite } from './useSprite';

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
  colors: Required<StarSiegeColors>,
  ship: HTMLImageElement | null,
  alien: HTMLImageElement | null,
  explosion: HTMLImageElement | null
): void {
  const { width, height } = state;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, width * cell, height * cell);

  const rect = (index: number) => {
    const col = index % width;
    const row = Math.floor(index / width);
    return [col * cell, row * cell] as const;
  };

  // Invaders — the SVG sprite, falling back to rounded blocks until it loads.
  {
    const sprite = alien && alien.complete && alien.naturalWidth > 0;
    const radius = cell * 0.35;
    if (!sprite) ctx.fillStyle = colors.invader;
    for (const index of state.invaders) {
      const [x, y] = rect(index);
      if (sprite) {
        ctx.drawImage(alien, x + 1, y + 1, cell - 2, cell - 2);
      } else {
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, cell - 2, cell - 2, radius);
        ctx.fill();
      }
    }
  }

  // Player ship — the SVG sprite, falling back to a block until it loads.
  {
    const [x, y] = rect(state.shooter);
    if (ship && ship.complete && ship.naturalWidth > 0) {
      ctx.drawImage(ship, x + 1, y + 1, cell - 2, cell - 2);
    } else {
      ctx.fillStyle = colors.shooter;
      ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    }
  }

  // Lasers — a slim beam in the top half of the cell, drawn after the ship so
  // a freshly-fired shot reads as leaving the nose rather than the ship body.
  ctx.fillStyle = colors.laser;
  const beamW = cell * 0.1;
  const beamH = cell * 0.5;
  for (const index of state.lasers) {
    const [x, y] = rect(index);
    ctx.fillRect(x + (cell - beamW) / 2, y, beamW, beamH);
  }

  // Explosions, drawn on top — the SVG burst, falling back to a disc.
  {
    const sprite = explosion && explosion.complete && explosion.naturalWidth > 0;
    if (!sprite) ctx.fillStyle = colors.explosion;
    for (const index of state.explosions) {
      const [x, y] = rect(index);
      if (sprite) {
        ctx.drawImage(explosion, x + 1, y + 1, cell - 2, cell - 2);
      } else {
        ctx.beginPath();
        ctx.arc(x + cell / 2, y + cell / 2, cell * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }
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
  const { state, paused, togglePause, reset } = useStarSiege(options);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const palette = { ...DEFAULT_COLORS, ...colors };

  // Load the sprites, rebuilding each whenever its colours change. A sprite is
  // null until it decodes, so draw() falls back to a drawn shape meanwhile.
  const shipSrc = useMemo(
    () => shipDataUrl(palette.shooter, palette.laser),
    [palette.shooter, palette.laser]
  );
  const ship = useSprite(shipSrc);
  const alienSrc = useMemo(
    () => alienDataUrl(palette.invader, palette.background),
    [palette.invader, palette.background]
  );
  const alien = useSprite(alienSrc);
  const explosionSrc = useMemo(
    () => explosionDataUrl(palette.explosion),
    [palette.explosion]
  );
  const explosion = useSprite(explosionSrc);

  // Redraw on every state change.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx, state, cellSize, palette, ship, alien, explosion);
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
        : paused
          ? `Paused · ${state.score}`
          : `${state.score}`;

  return (
    <div className={className} style={style}>
      {showStatus && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0, fontFamily: 'monospace' }}>{banner}</h1>
          {state.status === 'playing' && (
            <button type="button" onClick={togglePause}>
              {paused ? 'Resume' : 'Pause'}
            </button>
          )}
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
