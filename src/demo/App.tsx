import { StarSiege } from '../index';

/**
 * Local playground for developing the package. This file is excluded from
 * the published build — it just exercises the public API the way a consumer
 * would.
 */
export function App() {
  return (
    <main style={{ textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'monospace' }}>Nora&apos;s Star Siege</h1>
      <p style={{ opacity: 0.7 }}>← → to move · Space / ↑ to fire · P to pause</p>
      <StarSiege
        cellSize={28}
        onWin={(score) => console.log('Cleared the field!', score)}
        onLose={(score) => console.log('Shot down at', score)}
      />
    </main>
  );
}
