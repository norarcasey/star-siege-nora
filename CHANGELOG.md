# Changelog

All notable changes to this project are documented here. The format is based
on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-02

### Added

- Pause controls on `useStarSiege`: `paused` state plus `pause()`, `resume()`,
  and `togglePause()`.
- Press **P** to pause and resume when keyboard bindings are enabled.
- `<StarSiege />` now renders a Pause/Resume button and a "Paused" banner.
- Release workflow now verifies the pushed git tag matches `package.json`'s
  version before publishing.

### Changed

- `reset()` now also clears the paused state.
- The `paused` option continues to work as a controlled override of the
  internal pause state.

## [0.1.0] - 2026-06-02

### Added

- Initial release of Nora's Star Siege.
- Framework-agnostic, DOM-free `GameEngine` (invader march, lasers, scoring,
  win/lose rules) with no module-level state, so multiple games can coexist.
- `useStarSiege()` hook driving the engine on a `requestAnimationFrame` loop
  with keyboard input.
- Canvas-rendered `<StarSiege />` component with configurable grid, speeds,
  colors, and `onWin` / `onLose` / `onScoreChange` callbacks.
- Vite library build emitting ESM + CJS + bundled type declarations.
- Trusted Publishing release pipeline (tag push → OIDC publish with
  provenance).

[0.2.0]: https://github.com/norarcasey/star-siege-nora/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/norarcasey/star-siege-nora/releases/tag/v0.1.0
