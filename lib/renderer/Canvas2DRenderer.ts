/**
 * lib/renderer/Canvas2DRenderer.ts
 *
 * CANVAS 2-D RENDERER
 *
 * Implements IRenderer using CanvasRenderingContext2D.
 * Wraps all primitive draw calls with a FrustumCuller visibility check so
 * entities outside the current viewport are skipped at zero cost.
 *
 * The underlying `ctx` is exposed as a public readonly property for game code
 * that needs advanced Canvas 2D features (gradients, complex paths, transforms)
 * that are outside the IRenderer primitive set.
 *
 * Thread safety: Canvas 2D is inherently single-threaded — no locking needed.
 *
 * Usage:
 *   const renderer = new Canvas2DRenderer(canvasEl);
 *   // --- each frame ---
 *   renderer.clear();
 *   renderer.drawRect(10, 10, 100, 50, '#22d3ee');
 *   renderer.drawCircle(200, 150, 30, '#f87171');
 *   renderer.drawText(10, 200, 'Score: 42', { font: 'bold 14px monospace', fillStyle: '#fff' });
 *   renderer.present(); // no-op for Canvas 2D
 */

import type { IRenderer, TextStyle } from './IRenderer';
import { FrustumCuller, type Rect } from './FrustumCuller';

// --- Canvas2DRenderer ---------------------------------------------------------

export class Canvas2DRenderer implements IRenderer {
  /**
   * Direct access to the underlying CanvasRenderingContext2D.
   * Use this for Canvas-2D-specific operations (gradients, paths, transforms)
   * that cannot be expressed through the IRenderer primitive API.
   * Code using this property is intentionally Canvas-2D-specific.
   */
  readonly ctx: CanvasRenderingContext2D;

  private readonly _canvas: HTMLCanvasElement;
  private readonly _culler = new FrustumCuller();
  private _viewport: Rect;

  // -- Draw-call stats (reset on each clear()) ------------------------------
  private _totalDraws = 0;
  private _skippedDraws = 0;

  // -------------------------------------------------------------------------

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas2DRenderer: failed to obtain 2D rendering context');
    }
    this._canvas = canvas;
    this.ctx = ctx;
    this._viewport = { x: 0, y: 0, w: canvas.width, h: canvas.height };
  }

  // -- IRenderer: Viewport --------------------------------------------------

  get width(): number { return this._canvas.width; }
  get height(): number { return this._canvas.height; }

  /**
   * Update the active viewport rectangle used for frustum culling.
   * Call this whenever the canvas is scrolled, zoomed, or resized.
   * Defaults to the full canvas area (no culling of anything in-view).
   */
  setViewport(vp: Rect): void {
    this._viewport = { ...vp };
  }

  // -- IRenderer: Lifecycle -------------------------------------------------

  /**
   * Clear the entire canvas and reset per-frame draw-call counters.
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._totalDraws = 0;
    this._skippedDraws = 0;
  }

  /**
   * Present the frame — no-op for Canvas 2D (immediate mode).
   * Future WebGPU backend will submit the command buffer here.
   */
  present(): void {
    // Canvas 2D is immediate-mode; nothing to flush.
  }

  /** No GPU resources to release for Canvas 2D. */
  dispose(): void {
    // Nothing to clean up for the Canvas 2D backend.
  }

  // -- IRenderer: Primitives ------------------------------------------------

  /**
   * Draw a filled axis-aligned rectangle.
   * Skipped if the rect lies entirely outside the current viewport.
   */
  drawRect(x: number, y: number, w: number, h: number, color: string): void {
    this._totalDraws++;
    if (!this._culler.isVisible(x, y, w, h, this._viewport)) {
      this._skippedDraws++;
      return;
    }
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  /**
   * Draw a filled circle.
   * Skipped if the bounding square lies entirely outside the current viewport.
   */
  drawCircle(x: number, y: number, r: number, color: string): void {
    this._totalDraws++;
    if (!this._culler.isVisible(x - r, y - r, r * 2, r * 2, this._viewport)) {
      this._skippedDraws++;
      return;
    }
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * Draw a text string.
   * Note: frustum culling is NOT applied to text because the bounding box
   * depends on measured glyph metrics — a non-trivial cost.  Text is always
   * rendered; clip the Canvas ctx manually when needed.
   */
  drawText(x: number, y: number, text: string, style?: TextStyle): void {
    this._totalDraws++;
    this.ctx.fillStyle   = style?.fillStyle    ?? '#ffffff';
    this.ctx.font        = style?.font         ?? '12px monospace';
    this.ctx.textAlign   = style?.textAlign    ?? 'left';
    this.ctx.textBaseline = style?.textBaseline ?? 'alphabetic';
    this.ctx.fillText(text, x, y);
  }

  // -- Diagnostics ----------------------------------------------------------

  /**
   * Per-frame culling statistics.
   * Useful for profiling: high `skipped/total` ratio = effective culling.
   */
  get cullStats(): { total: number; skipped: number; ratio: number } {
    const ratio = this._totalDraws > 0
      ? this._skippedDraws / this._totalDraws
      : 0;
    return { total: this._totalDraws, skipped: this._skippedDraws, ratio };
  }
}
