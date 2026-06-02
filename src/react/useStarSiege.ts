import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from '../engine/GameEngine';
import type { GameConfig, GameState } from '../engine/types';

export interface UseStarSiegeOptions extends GameConfig {
  /** Bind arrow keys / space to the window automatically. Default true. */
  keyboard?: boolean;
  /** Pause the game loop. Default false. */
  paused?: boolean;
}

export interface StarSiegeControls {
  /** Live game snapshot, updated each animation frame. */
  state: GameState;
  moveLeft: () => void;
  moveRight: () => void;
  shoot: () => void;
  /** Restart the game from its initial state. */
  reset: () => void;
}

/**
 * Runs an instance of {@link GameEngine} on a requestAnimationFrame loop and
 * exposes its live state plus player controls. Bring your own rendering, or
 * use the {@link StarSiege} component which renders to a canvas.
 */
export function useStarSiege(
  options: UseStarSiegeOptions = {}
): StarSiegeControls {
  const { keyboard = true, paused = false, ...config } = options;

  // One engine per mounted hook; config changes are intentionally ignored
  // after mount (call reset() to apply a fresh game).
  const engineRef = useRef<GameEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new GameEngine(config);
  }
  const engine = engineRef.current;

  const [state, setState] = useState<GameState>(() => engine.getState());

  const moveLeft = useCallback(() => {
    engine.moveLeft();
    setState(engine.getState());
  }, [engine]);

  const moveRight = useCallback(() => {
    engine.moveRight();
    setState(engine.getState());
  }, [engine]);

  const shoot = useCallback(() => {
    engine.shoot();
    setState(engine.getState());
  }, [engine]);

  const reset = useCallback(() => {
    engine.reset();
    setState(engine.getState());
  }, [engine]);

  // The animation loop. `paused` is read through a ref so toggling it does
  // not tear down and recreate the loop.
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    let raf = 0;
    let last: number | null = null;

    const loop = (now: number) => {
      if (last === null) last = now;
      const dt = now - last;
      last = now;

      if (!pausedRef.current) {
        engine.tick(dt);
        setState(engine.getState());
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine]);

  // Keyboard bindings.
  useEffect(() => {
    if (!keyboard) return;

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft':
          moveLeft();
          break;
        case 'ArrowRight':
          moveRight();
          break;
        case 'ArrowUp':
        case 'Space':
          e.preventDefault();
          shoot();
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [keyboard, moveLeft, moveRight, shoot]);

  return { state, moveLeft, moveRight, shoot, reset };
}
