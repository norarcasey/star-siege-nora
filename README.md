# Nora's Star Siege

A retro arcade space-shooter for React, rendered to an HTML5 canvas. Drop it
into any project as a component, or drive the engine yourself with the hook.

Distinct from any particular 1978 cabinet — this is Nora's own siege.

## Install

```bash
npm install star-siege-nora
# react and react-dom (>=18) are peer dependencies
```

## Quick start

```tsx
import { StarSiege } from 'star-siege-nora';

export function Game() {
  return (
    <StarSiege
      cellSize={28}
      onWin={(score) => console.log('Cleared!', score)}
      onLose={(score) => console.log('Game over at', score)}
    />
  );
}
```

Arrow keys move the ship; **Space** or **↑** fires. Pass `keyboard={false}` to
wire up your own controls.

### `<StarSiege />` props

| Prop            | Type                       | Default | Description                              |
| --------------- | -------------------------- | ------- | ---------------------------------------- |
| `cellSize`      | `number`                   | `24`    | Pixel size of each grid cell.            |
| `colors`        | `StarSiegeColors`          | —       | Override background/invader/ship/etc.    |
| `showStatus`    | `boolean`                  | `true`  | Show the score / win / lose banner.      |
| `keyboard`      | `boolean`                  | `true`  | Bind arrow keys + space automatically.   |
| `paused`        | `boolean`                  | `false` | Freeze the game loop.                    |
| `onWin`         | `(score: number) => void`  | —       | Fired once when every invader is gone.   |
| `onLose`        | `(score: number) => void`  | —       | Fired once when the player is hit.       |
| `onScoreChange` | `(score: number) => void`  | —       | Fired whenever the score changes.        |

Plus all [`GameConfig`](src/engine/types.ts) tuning fields (`width`, `height`,
`invaderStepMs`, `laserStepMs`, `initialInvaders`, `initialShooter`, …).

## Custom UIs with the hook

`useStarSiege` runs the engine on a `requestAnimationFrame` loop and hands you
the live state plus controls — render it however you like:

```tsx
import { useStarSiege } from 'star-siege-nora';

function Hud() {
  const { state, moveLeft, moveRight, shoot, reset } = useStarSiege({
    keyboard: false,
  });

  return (
    <div>
      <p>Score: {state.score} — {state.status}</p>
      <button onClick={moveLeft}>◀</button>
      <button onClick={shoot}>fire</button>
      <button onClick={moveRight}>▶</button>
      {state.status !== 'playing' && <button onClick={reset}>restart</button>}
    </div>
  );
}
```

## Develop

```bash
npm install
npm run dev        # playground at localhost:5173
npm run build      # emits dist/ + type declarations
npm run typecheck
```

## How it works

The core is a DOM-free [`GameEngine`](src/engine/GameEngine.ts) — a pure state
machine that owns the grid, invader march, lasers, and win/lose rules. It
starts no timers and draws nothing; callers advance it with `tick(dt)` and read
snapshots with `getState()`. The React layer (hook + component) supplies the
loop, input, and canvas rendering. Because the engine keeps no module-level
state, multiple games can run on one page.

## License

MIT © Nora Casey
