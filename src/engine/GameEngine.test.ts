import { describe, it, expect } from 'vitest';
import { GameEngine } from './GameEngine';
import {
  DEFAULT_HEIGHT,
  DEFAULT_INVADERS,
  DEFAULT_SHOOTER,
  DEFAULT_WIDTH,
} from './constants';

describe('GameEngine — initial state', () => {
  it('starts from the classic defaults', () => {
    const state = new GameEngine().getState();
    expect(state.width).toBe(DEFAULT_WIDTH);
    expect(state.height).toBe(DEFAULT_HEIGHT);
    expect(state.invaders).toEqual(DEFAULT_INVADERS);
    expect(state.shooter).toBe(DEFAULT_SHOOTER);
    expect(state.lasers).toEqual([]);
    expect(state.explosions).toEqual([]);
    expect(state.score).toBe(0);
    expect(state.status).toBe('playing');
  });

  it('honours config overrides', () => {
    const state = new GameEngine({
      width: 5,
      height: 4,
      initialInvaders: [1, 2],
      initialShooter: 18,
    }).getState();
    expect(state.width).toBe(5);
    expect(state.height).toBe(4);
    expect(state.invaders).toEqual([1, 2]);
    expect(state.shooter).toBe(18);
  });

  it('returns snapshots that cannot mutate engine internals', () => {
    const engine = new GameEngine({ initialInvaders: [1, 2, 3] });
    const snapshot = engine.getState();
    snapshot.invaders.push(999);
    snapshot.lasers.push(999);
    expect(engine.getState().invaders).toEqual([1, 2, 3]);
    expect(engine.getState().lasers).toEqual([]);
  });
});

describe('GameEngine — player movement', () => {
  it('moves left and right by one cell', () => {
    const engine = new GameEngine({ initialShooter: 7 });
    engine.moveLeft();
    expect(engine.getState().shooter).toBe(6);
    engine.moveRight();
    engine.moveRight();
    expect(engine.getState().shooter).toBe(8);
  });

  it('cannot move past the left wall', () => {
    const engine = new GameEngine({ width: 5, initialShooter: 0 });
    engine.moveLeft();
    expect(engine.getState().shooter).toBe(0);
  });

  it('cannot move past the right wall', () => {
    const engine = new GameEngine({ width: 5, initialShooter: 4 });
    engine.moveRight();
    expect(engine.getState().shooter).toBe(4);
  });
});

describe('GameEngine — shooting and lasers', () => {
  it('fires a laser from the shooter position', () => {
    const engine = new GameEngine({ initialShooter: 100 });
    engine.shoot();
    expect(engine.getState().lasers).toEqual([100]);
  });

  it('moves lasers up one row per laser step', () => {
    const engine = new GameEngine({
      width: 5,
      height: 5,
      initialInvaders: [], // never wins/loses, just watch the laser fly
      initialShooter: 22,
      laserStepMs: 100,
      invaderStepMs: 1_000_000,
    });
    engine.shoot();
    engine.tick(100);
    expect(engine.getState().lasers).toEqual([17]);
    engine.tick(100);
    expect(engine.getState().lasers).toEqual([12]);
  });

  it('spends a laser that flies off the top of the grid', () => {
    const engine = new GameEngine({
      width: 5,
      height: 5,
      initialInvaders: [],
      initialShooter: 2, // top row already
      laserStepMs: 100,
      invaderStepMs: 1_000_000,
    });
    engine.shoot();
    engine.tick(100); // next = 2 - 5 = -3 → off the top
    expect(engine.getState().lasers).toEqual([]);
  });

  it('destroys an invader on contact: removes it, scores, and consumes the laser', () => {
    const engine = new GameEngine({
      width: 5,
      height: 5,
      initialInvaders: [2],
      initialShooter: 12,
      laserStepMs: 100,
      invaderStepMs: 1_000_000,
      explosionMs: 300,
    });
    engine.shoot();
    engine.tick(100); // 12 → 7, no hit
    expect(engine.getState()).toMatchObject({ lasers: [7], score: 0 });
    engine.tick(100); // 7 → 2, hit
    const state = engine.getState();
    expect(state.invaders).toEqual([]);
    expect(state.lasers).toEqual([]);
    expect(state.explosions).toEqual([2]);
    expect(state.score).toBe(1);
  });

  it('ages explosions out after explosionMs', () => {
    const engine = new GameEngine({
      width: 5,
      height: 5,
      initialInvaders: [2],
      initialShooter: 7,
      laserStepMs: 100,
      invaderStepMs: 1_000_000,
      explosionMs: 300,
    });
    engine.shoot();
    engine.tick(100); // hit at 2, explosion = 300ms
    expect(engine.getState().explosions).toEqual([2]);
    engine.tick(200); // 300 - 200 = 100 remaining
    expect(engine.getState().explosions).toEqual([2]);
    engine.tick(100); // 100 - 100 = 0 → cleared
    expect(engine.getState().explosions).toEqual([]);
  });
});

describe('GameEngine — invader march', () => {
  it('slides the whole formation right by one on an interior step', () => {
    const engine = new GameEngine({ invaderStepMs: 100 });
    engine.tick(100);
    expect(engine.getState().invaders).toEqual(
      DEFAULT_INVADERS.map((i) => i + 1)
    );
  });

  it('drops a row and reverses when it reaches the right edge', () => {
    // A single row at the right edge: width 5, invader at col 4 (index 4).
    const engine = new GameEngine({
      width: 5,
      height: 5,
      initialInvaders: [3, 4],
      initialShooter: 24,
      invaderStepMs: 100,
    });
    engine.tick(100);
    // Right edge hit: the whole formation drops one row and reverses.
    // [3,4] → [3+5,4+5] = [8,9].
    expect(engine.getState().invaders).toEqual([8, 9]);
  });

  it('reverses on an edge invader that is not the first or last cell', () => {
    // Regression: col-4 invader (index 4) sits on the right edge but is not the
    // last array element, so the old first/last-only check missed it and let it
    // step sideways from index 4 to index 5 — wrapping onto the next row.
    const engine = new GameEngine({
      width: 5,
      height: 5,
      initialInvaders: [4, 5], // col 4 (right edge) and col 0 of the next row
      initialShooter: 24,
      invaderStepMs: 100,
    });
    engine.tick(100);
    // Should drop straight down, never wrap to [5, 6].
    expect(engine.getState().invaders).toEqual([9, 10]);
  });
});

describe('GameEngine — win and lose', () => {
  it('wins once the last invader is cleared and an invader step resolves it', () => {
    const engine = new GameEngine({
      width: 5,
      height: 5,
      initialInvaders: [2],
      initialShooter: 22,
      laserStepMs: 100,
      invaderStepMs: 200,
    });
    engine.shoot();
    engine.tick(1000); // laser climbs 22→17→12→7→2 (hit), then an invader step resolves the win
    const state = engine.getState();
    expect(state.invaders).toEqual([]);
    expect(state.score).toBe(1);
    expect(state.status).toBe('won');
  });

  it('loses when an invader marches into the shooter', () => {
    const engine = new GameEngine({
      width: 5,
      height: 5,
      initialInvaders: [3], // interior cell, one step right of the shooter
      initialShooter: 4,
      invaderStepMs: 100,
    });
    engine.tick(100); // 3 → 4, collides with the shooter
    expect(engine.getState().status).toBe('lost');
  });

  it('loses when an invader marches off the bottom of the grid', () => {
    const engine = new GameEngine({
      width: 5,
      height: 5, // valid cells are 0..24
      initialInvaders: [24], // bottom-right corner
      initialShooter: 0,
      invaderStepMs: 100,
    });
    engine.tick(100); // edge drop pushes it past index 24
    expect(engine.getState().status).toBe('lost');
  });
});

describe('GameEngine — frozen once the game is over', () => {
  function lostEngine() {
    const engine = new GameEngine({
      width: 5,
      height: 5,
      initialInvaders: [3],
      initialShooter: 4,
      invaderStepMs: 100,
    });
    engine.tick(100);
    expect(engine.getState().status).toBe('lost');
    return engine;
  }

  it('ignores movement, shooting, and ticks after a loss', () => {
    const engine = lostEngine();
    const before = engine.getState();
    engine.moveLeft();
    engine.moveRight();
    engine.shoot();
    engine.tick(10_000);
    const after = engine.getState();
    expect(after.shooter).toBe(before.shooter);
    expect(after.lasers).toEqual([]);
    expect(after.invaders).toEqual(before.invaders);
  });
});

describe('GameEngine — tick accumulation', () => {
  it('accumulates sub-step dts before advancing', () => {
    const engine = new GameEngine({
      width: 5,
      height: 5,
      initialInvaders: [],
      initialShooter: 22,
      laserStepMs: 100,
      invaderStepMs: 1_000_000,
    });
    engine.shoot();
    engine.tick(60); // not enough for a laser step yet
    expect(engine.getState().lasers).toEqual([22]);
    engine.tick(60); // 120ms total → one step fires
    expect(engine.getState().lasers).toEqual([17]);
  });

  it('runs multiple steps for a large dt', () => {
    const engine = new GameEngine({
      width: 5,
      height: 5,
      initialInvaders: [],
      initialShooter: 22,
      laserStepMs: 100,
      invaderStepMs: 1_000_000,
    });
    engine.shoot();
    engine.tick(300); // 22 → 17 → 12 → 7
    expect(engine.getState().lasers).toEqual([7]);
  });
});

describe('GameEngine — reset', () => {
  it('restores the initial state after play', () => {
    const engine = new GameEngine({ width: 5, height: 5, initialShooter: 12 });
    engine.moveLeft();
    engine.shoot();
    engine.tick(500);
    engine.reset();
    const state = engine.getState();
    expect(state.shooter).toBe(12);
    expect(state.lasers).toEqual([]);
    expect(state.score).toBe(0);
    expect(state.status).toBe('playing');
  });
});
