'use client';

import type { ComponentType } from 'react';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { GameCartridge, GameEngineAPI } from '@/lib/gameengin/cartridge';

export function createReactGameCartridge(
  gameId: string,
  Component: ComponentType,
): GameCartridge {
  return {
    id: gameId,
    mount(container: HTMLDivElement, _api: GameEngineAPI): () => void {
      const wrapper = document.createElement('div');
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      container.appendChild(wrapper);

      let root: Root | null = null;
      try {
        root = createRoot(wrapper);
        root.render(createElement(Component));
      } catch {
        // Keep the runtime host alive if a client-only game refuses to boot in tests.
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

export function defineReactCartridgeLoader(
  id: string,
  importer: () => Promise<{ default: ComponentType }>,
) {
  return async (): Promise<GameCartridge> => {
    const cartridgeModule = await importer();
    return createReactGameCartridge(id, cartridgeModule.default);
  };
}
