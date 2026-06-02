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
  /** Whether the game loop is currently paused. */
  paused: boolean;
  moveLeft: () => void;
  moveRight: () => void;
  shoot: () => void;
  /** Pause the game loop (no-op if already paused). */
  pause: () => void;
  /** Resume the game loop (no-op if already running). */
  resume: () => void;
  /** Flip between paused and running. */
  togglePause: () => void;
  /** Restart the game from its initial state (also clears pause). */
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
  const { keyboard = true, paused: pausedOption = false, ...config } = options;

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

  // Pause state is owned by the hook so it can be toggled from controls or
  // the keyboard. The `paused` option acts as a controlled override: when the
  // consumer changes it, we follow.
  const [paused, setPaused] = useState(pausedOption);
  useEffect(() => {
    setPaused(pausedOption);
  }, [pausedOption]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);
  const togglePause = useCallback(() => setPaused((p) => !p), []);

  const reset = useCallback(() => {
    engine.reset();
    setPaused(false);
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
        case 'KeyP':
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [keyboard, moveLeft, moveRight, shoot, togglePause]);

  return {
    state,
    paused,
    moveLeft,
    moveRight,
    shoot,
    pause,
    resume,
    togglePause,
    reset,
  };
}
