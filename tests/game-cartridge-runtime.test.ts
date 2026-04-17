/**
 * tests/game-cartridge-runtime.test.ts
 *
 * Tests for the Game Cartridge Runtime system:
 *   - GameCartridge / GameEngineAPI contract (cartridge.ts)
 *   - TetrisCartridge (games/tetris/TetrisCartridge.ts)
 *   - SnakeCartridge (games/snake/SnakeCartridge.ts)
 *   - ReactComponentCartridge adapter (lib/gameengin/ReactComponentCartridge.ts)
 *   - GRAVITY_VALUES mapping
 *
 * Note: Cartridge mount() tests that require a DOM (document.createElement)
 * are skipped in the node test environment. They validate correctly when
 * run in a browser via Playwright or similar.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  GRAVITY_VALUES,
  type GameCartridge,
  type GameEngineAPI,
  type GravityPreset,
} from '@/lib/gameengin/cartridge';
import { TetrisCartridge } from '@/games/tetris/TetrisCartridge';
import { SnakeCartridge } from '@/games/snake/SnakeCartridge';

// ── Helpers ──────────────────────────────────────────────────────────────────

const hasDom = typeof document !== 'undefined';

/** Creates a minimal mock GameEngineAPI for testing cartridge mount/cleanup. */
function createMockAPI(overrides?: Partial<{
  gravity: number;
  friction: number;
}>): GameEngineAPI {
  const tickCallbacks = new Set<(dt: number, elapsed: number) => void>();
  const renderCallbacks = new Set<(dt: number) => void>();
  const inputListeners = new Map<string, Set<(payload: { key: string; type: string; preventDefault: () => void }) => void>>();

  return {
    loop: {
      onTick(cb) {
        tickCallbacks.add(cb);
        return () => { tickCallbacks.delete(cb); };
      },
      onRender(cb) {
        renderCallbacks.add(cb);
        return () => { renderCallbacks.delete(cb); };
      },
    },
    physics: {
      gravity: overrides?.gravity ?? 9.8,
      friction: overrides?.friction ?? 0.5,
    },
    input: {
      on(event, cb) {
        let set = inputListeners.get(event);
        if (!set) { set = new Set(); inputListeners.set(event, set); }
        set.add(cb);
        return () => { set!.delete(cb); };
      },
      isKeyDown: () => false,
    },
    score: {
      submit: vi.fn().mockResolvedValue(undefined),
    },
    pool: {
      acquire: <T,>(factory: () => T) => factory(),
      release: () => {},
    },
    telemetry: {
      reportFrame: vi.fn(),
    },
  };
}

// ── GRAVITY_VALUES ───────────────────────────────────────────────────────────

describe('GRAVITY_VALUES', () => {
  it('maps all four gravity presets to numeric values', () => {
    const presets: GravityPreset[] = ['moon', 'earth', 'mars', 'jupiter'];
    for (const preset of presets) {
      expect(typeof GRAVITY_VALUES[preset]).toBe('number');
      expect(GRAVITY_VALUES[preset]).toBeGreaterThan(0);
    }
  });

  it('moon < mars < earth < jupiter', () => {
    expect(GRAVITY_VALUES.moon).toBeLessThan(GRAVITY_VALUES.mars);
    expect(GRAVITY_VALUES.mars).toBeLessThan(GRAVITY_VALUES.earth);
    expect(GRAVITY_VALUES.earth).toBeLessThan(GRAVITY_VALUES.jupiter);
  });

  it('earth is 9.8', () => {
    expect(GRAVITY_VALUES.earth).toBe(9.8);
  });
});

// ── GameCartridge contract ───────────────────────────────────────────────────

describe('GameCartridge contract', () => {
  it('TetrisCartridge has correct id', () => {
    expect(TetrisCartridge.id).toBe('tetris');
  });

  it('SnakeCartridge has correct id', () => {
    expect(SnakeCartridge.id).toBe('snake');
  });

  it('TetrisCartridge has a mount function', () => {
    expect(typeof TetrisCartridge.mount).toBe('function');
  });

  it('SnakeCartridge has a mount function', () => {
    expect(typeof SnakeCartridge.mount).toBe('function');
  });

  it.skipIf(!hasDom)('TetrisCartridge.mount returns a cleanup function (DOM required)', () => {
    const api = createMockAPI();
    const container = document.createElement('div');
    const cleanup = TetrisCartridge.mount(container, api);
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it.skipIf(!hasDom)('SnakeCartridge.mount returns a cleanup function (DOM required)', () => {
    const api = createMockAPI();
    const container = document.createElement('div');
    const cleanup = SnakeCartridge.mount(container, api);
    expect(typeof cleanup).toBe('function');
    cleanup();
  });
});

// ── GameEngineAPI wiring ─────────────────────────────────────────────────────

describe('GameEngineAPI wiring', () => {
  it('api.loop.onTick returns an unsubscribe function', () => {
    const api = createMockAPI();
    const unsub = api.loop.onTick(() => {});
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('api.loop.onRender returns an unsubscribe function', () => {
    const api = createMockAPI();
    const unsub = api.loop.onRender(() => {});
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('api.input.on returns an unsubscribe function', () => {
    const api = createMockAPI();
    const unsub = api.input.on('keydown', () => {});
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('api.physics has gravity and friction', () => {
    const api = createMockAPI({ gravity: 3.7, friction: 0.3 });
    expect(api.physics.gravity).toBe(3.7);
    expect(api.physics.friction).toBe(0.3);
  });

  it('api.pool.acquire uses the factory', () => {
    const api = createMockAPI();
    const obj = api.pool.acquire(() => ({ value: 42 }));
    expect(obj).toEqual({ value: 42 });
  });

  it('api.score.submit is callable', async () => {
    const api = createMockAPI();
    await api.score.submit('test-game', 100);
    expect(api.score.submit).toHaveBeenCalledWith('test-game', 100);
  });
});

// ── Cartridge implements the contract properly ──────────────────────────────

describe('Cartridge implementations', () => {
  it('TetrisCartridge satisfies GameCartridge interface', () => {
    const cartridge: GameCartridge = TetrisCartridge;
    expect(cartridge.id).toBe('tetris');
    expect(typeof cartridge.mount).toBe('function');
  });

  it('SnakeCartridge satisfies GameCartridge interface', () => {
    const cartridge: GameCartridge = SnakeCartridge;
    expect(cartridge.id).toBe('snake');
    expect(typeof cartridge.mount).toBe('function');
  });
});

// ── Exports from index ──────────────────────────────────────────────────────

describe('lib/gameengin/index exports', () => {
  it('exports cartridge types and runtime', async () => {
    const mod = await import('@/lib/gameengin/index');
    expect(mod.GRAVITY_VALUES).toBeDefined();
    expect(mod.wrapAsCartridge).toBeDefined();
    expect(mod.GameRuntime).toBeDefined();
  });
});
