/**
 * lib/renderer/index.ts
 *
 * RENDERER LAYER — Public API
 *
 * Barrel export + renderer factory.
 *
 * Usage:
 *   import { createRenderer, Canvas2DRenderer } from '@/lib/renderer';
 *   const renderer = createRenderer('canvas2d', canvasEl);
 */

export type { IRenderer, TextStyle } from './IRenderer';
export { Canvas2DRenderer } from './Canvas2DRenderer';
export { FrustumCuller } from './FrustumCuller';
export type { Rect } from './FrustumCuller';

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create a renderer of the specified type.
 *
 * Currently supported types:
 *   - `'canvas2d'` — CanvasRenderingContext2D backend (works in all browsers)
 *
 * Planned future types:
 *   - `'webgpu'`   — WebGPU render pipeline
 *   - `'babylon'`  — Babylon.js scene overlay
 *
 * @example
 * const renderer = createRenderer('canvas2d', canvasEl);
 * renderer.clear();
 * renderer.drawRect(0, 0, 100, 50, '#22d3ee');
 * renderer.present();
 */
export function createRenderer(type: 'canvas2d', canvas: HTMLCanvasElement): import('./Canvas2DRenderer').Canvas2DRenderer {
  if (type === 'canvas2d') {
    const { Canvas2DRenderer } = require('./Canvas2DRenderer') as typeof import('./Canvas2DRenderer');
    return new Canvas2DRenderer(canvas);
  }
  // Exhaustive guard — add new types above before reaching here
  throw new Error(`createRenderer: unsupported renderer type '${String(type)}'`);
}
