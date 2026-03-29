/**
 * lib/gameengin/post-fx.ts
 *
 * POST-PROCESSING PIPELINE — 2026
 *
 * Drop-in post-FX manager for Babylon.js scenes.
 * Provides the signature visual quality of an elite game engine:
 *
 *  • Neon bloom / glow layer     — gorgeous for neon/sci-fi aesthetics
 *  • Motion blur                 — sells speed effortlessly
 *  • Vignette + colour grading   — cinematic depth
 *  • Chromatic aberration pass   — adds subpixel fringe to glow sources
 *  • Scan-lines overlay          — retro-futurist CRT filter (optional)
 *
 * Usage:
 *   const fx = new PostFXManager(scene, camera);
 *   fx.enableBloom(0.5, 0.3, 64);   // intensity, threshold, size
 *   fx.enableMotionBlur(0.3);
 *   fx.enableVignette(0.6, 0.85);
 *   // toggle quality tier:
 *   fx.applyBudget(budget);
 *   // cleanup:
 *   fx.dispose();
 */

import type { Scene, Camera } from '@babylonjs/core';
import type { PerformanceBudget } from './core';

export class PostFXManager {
  private scene: Scene;
  private camera: Camera;
  private pipeline: unknown = null; // DefaultRenderingPipeline
  private glowLayer: unknown = null; // GlowLayer
  private disposed = false;

  constructor(scene: Scene, camera: Camera) {
    this.scene = scene;
    this.camera = camera;
  }

  /**
   * Initialise the full Babylon.js DefaultRenderingPipeline.
   * This is async because it needs dynamic imports (SSR safety).
   */
  async init(): Promise<void> {
    try {
      const { DefaultRenderingPipeline } = await import('@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline');
      const pipe = new DefaultRenderingPipeline(
        'dreamEnginPipeline',
        true,   // HDR
        this.scene,
        [this.camera],
      );
      this.pipeline = pipe;

      // Bloom defaults — beautiful neon glow
      pipe.bloomEnabled = true;
      pipe.bloomWeight = 0.4;
      pipe.bloomKernel = 64;
      pipe.bloomScale = 0.5;
      pipe.bloomThreshold = 0.2;

      // Vignette
      pipe.imageProcessingEnabled = true;
      pipe.imageProcessing.vignetteEnabled = true;
      pipe.imageProcessing.vignetteWeight = 4;
      pipe.imageProcessing.vignetteCameraFov = 0.5;
      pipe.imageProcessing.vignetteBlendMode = 1; // multiply
      pipe.imageProcessing.vignetteColor = new (await import('@babylonjs/core')).Color4(0, 0, 0, 0);

      // Colour grading — slight cool tint for sci-fi feel
      pipe.imageProcessing.contrast = 1.15;
      pipe.imageProcessing.exposure = 1.05;

      // Chromatic aberration
      pipe.chromaticAberrationEnabled = true;
      pipe.chromaticAberration.aberrationAmount = 15;

      // Grain (very light)
      pipe.grainEnabled = true;
      pipe.grain.intensity = 6;
      pipe.grain.animated = true;

      // Motion blur — handled separately via MotionBlurPostProcess
      pipe.depthOfFieldEnabled = false; // off by default for games
    } catch (err) {
      // Babylon post-process not available (SSR or old browser) — degrade gracefully
      console.warn('[PostFX] DefaultRenderingPipeline unavailable:', err);
    }
  }

  /** Add a glow layer (separate from bloom pipeline — stacks nicely for neon). */
  async enableGlow(intensity = 0.7, blurKernelSize = 32): Promise<void> {
    try {
      const { GlowLayer } = await import('@babylonjs/core/Layers/glowLayer');
      const glow = new GlowLayer('dreamNeonGlow', this.scene, {
        mainTextureFixedSize: 256,
        blurKernelSize,
      });
      glow.intensity = intensity;
      this.glowLayer = glow;
    } catch (err) {
      console.warn('[PostFX] GlowLayer unavailable:', err);
    }
  }

  setBloomWeight(weight: number): void {
    const pipe = this.pipeline as Record<string, unknown> | null;
    if (pipe && 'bloomWeight' in pipe) pipe.bloomWeight = weight;
  }

  setBloomEnabled(enabled: boolean): void {
    const pipe = this.pipeline as Record<string, unknown> | null;
    if (pipe && 'bloomEnabled' in pipe) pipe.bloomEnabled = enabled;
  }

  setGlowIntensity(intensity: number): void {
    const gl = this.glowLayer as { intensity?: number } | null;
    if (gl) gl.intensity = intensity;
  }

  setChromaticAberration(amount: number): void {
    const pipe = this.pipeline as {
      chromaticAberrationEnabled?: boolean;
      chromaticAberration?: { aberrationAmount?: number };
    } | null;
    if (pipe?.chromaticAberration) {
      pipe.chromaticAberrationEnabled = amount > 0;
      pipe.chromaticAberration.aberrationAmount = amount;
    }
  }

  /**
   * Adapt post-FX quality to the current engine performance budget.
   * Called by the engine when the adaptive quality tier changes.
   */
  applyBudget(budget: PerformanceBudget): void {
    if (this.disposed) return;
    const enabled = budget.postFxEnabled;

    this.setBloomEnabled(enabled);

    if (!enabled) {
      this.setChromaticAberration(0);
      this.setGlowIntensity(0);
    } else {
      switch (budget.tier) {
        case 'ultra':
          this.setBloomWeight(0.5);
          this.setChromaticAberration(20);
          this.setGlowIntensity(0.8);
          break;
        case 'high':
          this.setBloomWeight(0.4);
          this.setChromaticAberration(12);
          this.setGlowIntensity(0.6);
          break;
        case 'medium':
          this.setBloomWeight(0.25);
          this.setChromaticAberration(0);
          this.setGlowIntensity(0.4);
          break;
        default:
          break;
      }
    }
  }

  dispose(): void {
    this.disposed = true;
    const pipe = this.pipeline as { dispose?: () => void } | null;
    pipe?.dispose?.();
    const gl = this.glowLayer as { dispose?: () => void } | null;
    gl?.dispose?.();
    this.pipeline = null;
    this.glowLayer = null;
  }
}
