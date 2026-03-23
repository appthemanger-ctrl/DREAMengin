/**
 * lib/babylon/createEngine.ts
 *
 * WebGPU-first Babylon.js engine factory.
 *
 * Strategy:
 *   1. Detect WebGPU support via WebGPUEngine.IsSupportedAsync (async GPU adapter probe).
 *   2. If supported, create a WebGPUEngine via WebGPUEngine.CreateAsync — this is the
 *      preferred path for high-fidelity rendering on modern devices.
 *   3. Fall back to Engine (WebGL2 / WebGL1) if WebGPU is unavailable or the async
 *      init fails, so every device stays functional.
 *
 * Architecture justification: docs/ARCHITECTURE.md §10 — render-on-demand, hardware
 * scaling, performance-first. WebGPU eliminates the WebGL draw-call overhead and
 * enables compute shaders for future WarpEngine integration.
 *
 * Usage:
 *   const engine = await createBabylonEngine(canvas, { antialias: true });
 */

import type { AbstractEngine } from '@babylonjs/core';

export interface BabylonEngineOptions {
  antialias?: boolean;
  preserveDrawingBuffer?: boolean;
  stencil?: boolean;
}

export interface BabylonEngineResult {
  engine: AbstractEngine;
  /** true when WebGPUEngine is active; false when WebGL Engine is active */
  isWebGPU: boolean;
}

/**
 * Creates the best available Babylon.js engine for the given canvas.
 * Prefers WebGPU; falls back to WebGL2/WebGL1 automatically.
 *
 * MUST be called from browser context (not SSR).
 */
export async function createBabylonEngine(
  canvas: HTMLCanvasElement,
  options: BabylonEngineOptions = {}
): Promise<BabylonEngineResult> {
  const { antialias = true, preserveDrawingBuffer = true, stencil = true } = options;

  const { WebGPUEngine, Engine } = await import('@babylonjs/core');

  // 1. Attempt WebGPU
  let webGPUSupported = false;
  try {
    webGPUSupported = await WebGPUEngine.IsSupportedAsync;
  } catch {
    webGPUSupported = false;
  }

  if (webGPUSupported) {
    try {
      const engine = await WebGPUEngine.CreateAsync(canvas, {
        antialias,
        powerPreference: 'high-performance',
        enableAllFeatures: true,
      });
      return { engine, isWebGPU: true };
    } catch {
      // WebGPU init failed (e.g. browser flag not enabled) — fall through to WebGL
    }
  }

  // 2. WebGL2 / WebGL1 fallback
  const engine = new Engine(canvas, antialias, {
    preserveDrawingBuffer,
    stencil,
    antialias,
  });
  return { engine, isWebGPU: false };
}
