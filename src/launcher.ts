/**
 * src/launcher.ts
 *
 * DREAMengin GameEngin — Runtime Entry Point
 *
 * This is the canonical bootstrap script that wires a canvas element to the
 * unified GameEnginCore and starts the engine with the demo game configuration.
 *
 * In production, replace `demoGameConfig` with your own `GameConfig` object
 * (or load it from a remote manifest) and pass your target canvas element.
 *
 * Usage (browser):
 *   import { launch } from '@/src/launcher';
 *
 *   const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
 *   const { core, stop } = await launch(canvas);
 *   // …later…
 *   stop();
 *
 * Usage (standalone script tag / Node preview):
 *   The `autoLaunch()` call at the bottom fires automatically when this
 *   module is executed in a browser environment with a #gameCanvas element.
 */

import { GameEnginCore, GameEnginConfigError } from './core/GameEnginCore';
import demoGameConfig from './configs/demoGameConfig';
import type { GameConfig } from './core/GameEnginCore';

// ─── launch() ────────────────────────────────────────────────────────────────

/**
 * launch(canvas, config?)
 *
 * Instantiates a `GameEnginCore`, validates the configuration, initialises
 * all subsystems, and starts the main render loop.
 *
 * @param canvas  HTMLCanvasElement to render into.
 * @param config  Game configuration (defaults to `demoGameConfig`).
 * @returns       An object with the running `core` instance and a `stop` helper.
 */
export async function launch(
  canvas: HTMLCanvasElement,
  config: GameConfig = demoGameConfig,
): Promise<{ core: GameEnginCore; stop: () => void }> {
  console.log('🚀 DREAMengin GameEngin starting…');

  const core = new GameEnginCore();

  try {
    await core.start(canvas, config);
    console.log('✅ GameEngin runtime is active.');
  } catch (err) {
    if (err instanceof GameEnginConfigError) {
      console.error('❌ Configuration error:', err.message);
    } else {
      console.error('❌ Failed to start GameEngin:', err);
    }
    throw err;
  }

  const stop = (): void => {
    core.stop();
    console.log('🛑 GameEngin runtime stopped.');
  };

  // Clean up automatically when the page is closed / navigated away
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', stop, { once: true });
  }

  return { core, stop };
}

// ─── autoLaunch() ────────────────────────────────────────────────────────────

/**
 * autoLaunch()
 *
 * Convenience helper that looks for a `#gameCanvas` element in the document
 * and calls `launch()` with the demo configuration.  Called automatically
 * when this module runs in a browser context.
 */
async function autoLaunch(): Promise<void> {
  if (typeof document === 'undefined') return; // SSR / Node — skip

  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement | null;
  if (!canvas) {
    console.warn(
      '[DREAMengin] autoLaunch: no #gameCanvas element found. ' +
      'Add <canvas id="gameCanvas"> to your HTML or call launch() manually.',
    );
    return;
  }

  await launch(canvas, demoGameConfig);
}

// Auto-boot when loaded as the main script in a browser.
autoLaunch().catch(console.error);
