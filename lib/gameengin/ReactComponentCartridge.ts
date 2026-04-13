/**
 * lib/gameengin/ReactComponentCartridge.ts
 *
 * Backward Compatibility Adapter — wraps any existing React game component
 * as a GameCartridge so ALL games immediately run through GameRuntime,
 * even ones not yet migrated to the cartridge contract.
 *
 * How it works:
 *   1. Creates a container div inside the provided mount point
 *   2. Uses React's createRoot to render the component into it
 *   3. Returns a cleanup function that unmounts the React tree
 */

import type { ComponentType } from 'react';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { GameCartridge, GameEngineAPI } from './cartridge';

/**
 * Wrap an existing React game component as a GameCartridge.
 *
 * This adapter enables the ~24 games not yet migrated to the full
 * cartridge contract to still run through GameRuntime with zero changes.
 */
export function wrapAsCartridge(
  gameId: string,
  Component: ComponentType,
): GameCartridge {
  return {
    id: gameId,
    mount(container: HTMLDivElement, _api: GameEngineAPI): () => void {
      // Create a wrapper div for the React tree
      const wrapper = document.createElement('div');
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      container.appendChild(wrapper);

      let root: Root | null = null;
      try {
        root = createRoot(wrapper);
        root.render(createElement(Component));
      } catch {
        // SSR or test environment — graceful degradation
      }

      return () => {
        try {
          if (root) {
            root.unmount();
            root = null;
          }
        } catch {
          // Ignore unmount errors during hot-swap
        }
        if (wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper);
        }
      };
    },
  };
}
