'use client';

/**
 * lib/gameengin/cartridges/reactCartridge.ts
 *
 * Wraps a React game component as a GameCartridge so it can run inside
 * GameRuntime. The GameEngineAPI is exposed to the game component via React
 * context — games opt in by calling useGameEngineAPI().
 *
 * Rules:
 *  - The engine mounts ONE React root per cartridge inside the container div.
 *  - The api is provided via GameEngineAPIContext — games don't have to use it.
 *  - Cleanup unmounts the React root and removes the wrapper div.
 *  - Any render/lifecycle errors are caught by CartridgeErrorBoundary (outer).
 */

import { createContext, createElement, useContext, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { GameCartridge, GameEngineAPI } from '@/lib/gameengin/cartridge';

// ── GameEngineAPI context ─────────────────────────────────────────────────────

/**
 * React context that carries the GameEngineAPI into the cartridge component
 * tree. Null when the game is running outside a GameRuntime host (e.g. in a
 * unit test or legacy standalone mount).
 */
export const GameEngineAPIContext = createContext<GameEngineAPI | null>(null);

/**
 * Hook for game components to consume the engine API.
 *
 * Returns null instead of throwing when the game is not running inside a
 * GameRuntime host — games should handle the null case gracefully so they
 * remain testable in isolation.
 *
 * @example
 * function MyGame() {
 *   const api = useGameEngineAPI();
 *   useEffect(() => {
 *     return api?.loop.onTick((dt) => { movePlayer(dt); });
 *   }, [api]);
 * }
 */
export function useGameEngineAPI(: GameEngineAPI | null) {
  return useContext(GameEngineAPIContext);
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Wrap a React component as a GameCartridge.
 *
 * The component receives the GameEngineAPI via context. It does NOT receive
 * it as a prop — this keeps the component's prop surface clean and lets
 * existing game components work unchanged while new ones opt in to engine
 * services via useGameEngineAPI().
 */
export function createReactGameCartridge(
  gameId: string,
  Component: ComponentType,
): GameCartridge {
  return {
    id: gameId,

    mount(container: HTMLDivElement, api: GameEngineAPI): () => void {
      const wrapper = document.createElement('div');
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      container.appendChild(wrapper);

      let root: Root | null = null;
      try {
        root = createRoot(wrapper);
        root.render(
          createElement(
            GameEngineAPIContext.Provider,
            { value: api },
            createElement(Component),
          ),
        );
      } catch {
        // Keep the runtime host alive if a client-only game refuses to boot
        // in tests or during SSR hydration edge cases.
      }

      return () => {
        try {
          root?.unmount();
        } catch {
          // Ignore teardown errors during cartridge hot-swap.
        }
        root = null;
        wrapper.remove();
      };
    },
  };
}

/**
 * Async loader factory — the standard way to register a cartridge.
 *
 * @example
 * export const CARTRIDGE_LOADERS = {
 *   'my-game': defineReactCartridgeLoader('my-game', () => import('./MyGame')),
 * };
 */
export function defineReactCartridgeLoader(
  id: string,
  importer: () => Promise<{ default: ComponentType }>,
) {
  return async (): Promise<GameCartridge> => {
    const mod = await importer();
    return createReactGameCartridge(id, mod.default);
  };
}
