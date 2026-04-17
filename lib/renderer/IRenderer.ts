/**
 * lib/renderer/IRenderer.ts
 *
 * ABSTRACT RENDERER INTERFACE
 *
 * Defines the minimal surface that any DREAMengin renderer backend must
 * implement: Canvas 2D today, WebGPU / Babylon.js / OffscreenCanvas tomorrow.
 *
 * Keeping game-logic draw calls behind this interface means the drawing code
 * never needs to change when the backend is swapped.
 */

// ─── Text style ───────────────────────────────────────────────────────────────

/** Subset of Canvas 2D text properties used by IRenderer.drawText(). */
export interface TextStyle {
  /** CSS font string, e.g. `'bold 12px monospace'`. */
  font?: string;
  /** CSS colour string for the fill, e.g. `'#ffffff'` or `'rgba(255,200,0,0.9)'`. */
  fillStyle?: string;
  /** Horizontal text alignment. */
  textAlign?: CanvasTextAlign;
  /** Vertical text baseline. */
  textBaseline?: CanvasTextBaseline;
}

// ─── IRenderer ───────────────────────────────────────────────────────────────

/**
 * Abstract renderer interface.
 *
 * Implementations:
 *  • Canvas2DRenderer — CanvasRenderingContext2D (default, works everywhere)
 *  • (future) WebGPURenderer  — WebGPU render pipeline
 *  • (future) BabylonRenderer — Babylon.js scene overlay
 *
 * Frame lifecycle:
 *   renderer.clear()
 *   renderer.drawRect(...)  // 0–n draw calls
 *   renderer.drawCircle(...)
 *   renderer.drawText(...)
 *   renderer.present()      // flush / submit command buffer
 */
export interface IRenderer {
  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Clear the entire render surface (transparent / black).
   * Must be called at the start of each frame before any draw calls.
   */
  clear(): void;

  /**
   * Flush and present the frame.
   * For Canvas 2D (immediate mode) this is a no-op.
   * For buffered backends (WebGPU, OffscreenCanvas) this submits the
   * command buffer to the GPU queue.
   */
  present(): void;

  /** Release any GPU/canvas resources held by this renderer. */
  dispose(): void;

  // ── Primitives ─────────────────────────────────────────────────────────────

  /**
   * Draw a filled axis-aligned rectangle.
   * @param x     - left edge in logical pixels
   * @param y     - top edge in logical pixels
   * @param w     - width in logical pixels
   * @param h     - height in logical pixels
   * @param color - CSS colour string
   */
  drawRect(x: number, y: number, w: number, h: number, color: string): void;

  /**
   * Draw a filled circle.
   * @param x     - centre X in logical pixels
   * @param y     - centre Y in logical pixels
   * @param r     - radius in logical pixels
   * @param color - CSS colour string
   */
  drawCircle(x: number, y: number, r: number, color: string): void;

  /**
   * Draw a text string.
   * @param x     - left anchor X (or alignment-dependent, per textAlign)
   * @param y     - baseline Y (or alignment-dependent, per textBaseline)
   * @param text  - string to render
   * @param style - optional text styling
   */
  drawText(x: number, y: number, text: string, style?: TextStyle): void;

  // ── Viewport ───────────────────────────────────────────────────────────────

  /** Logical pixel width of the render surface. */
  readonly width: number;

  /** Logical pixel height of the render surface. */
  readonly height: number;
}
