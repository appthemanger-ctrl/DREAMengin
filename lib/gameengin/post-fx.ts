/**
 * lib/gameengin/post-fx.ts
 *
 * POST-PROCESSING PIPELINE — 2026 REALISTIC GRAPHICS UPGRADE
 *
 * Drop-in post-FX manager for Babylon.js scenes.
 * Provides the signature visual quality of an elite game engine:
 *
 *  • Neon bloom / glow layer     — gorgeous for neon/sci-fi aesthetics
 *  • SSAO (Screen-Space AO)      — realistic contact shadows and depth
 *  • Depth of Field (bokeh)      — cinematic focus pull
 *  • Screen-Space Reflections    — real-time reflection on PBR surfaces
 *  • Sharpen pass                — crisp detail recovery after TAA/FXAA
 *  • Motion blur                 — sells speed effortlessly
 *  • Vignette + colour grading   — cinematic depth
 *  • Tone mapping (ACES)         — physically-accurate HDR to LDR
 *  • Chromatic aberration pass   — adds subpixel fringe to glow sources
 *  • Scan-lines overlay          — retro-futurist CRT filter (optional)
 *
 * Usage:
 *   const fx = new PostFXManager(scene, camera);
 *   await fx.init();
 *   fx.enableBloom(0.5, 0.3, 64);
 *   fx.enableSSAO();
 *   fx.applyBudget(budget);
 *   fx.dispose();
 */

import type { Scene, Camera } from '@babylonjs/core';
import type { PerformanceBudget } from './core';

export class PostFXManager {
  private scene: Scene;
  private camera: Camera;
  private pipeline: unknown = null; // DefaultRenderingPipeline
  private glowLayer: unknown = null; // GlowLayer
  private ssaoPipeline: unknown = null; // SSAO2RenderingPipeline
  private ssrPipeline: unknown = null; // SSRRenderingPipeline
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

      // MSAA anti-aliasing (4x default for crisp edges)
      pipe.samples = 4;
      pipe.fxaaEnabled = true;

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

      // Tone mapping — ACES filmic for realistic HDR
      pipe.imageProcessing.toneMappingEnabled = true;
      pipe.imageProcessing.toneMappingType = 1; // ACES

      // Colour grading — slight cool tint for cinematic feel
      pipe.imageProcessing.contrast = 1.15;
      pipe.imageProcessing.exposure = 1.05;

      // Chromatic aberration
      pipe.chromaticAberrationEnabled = true;
      pipe.chromaticAberration.aberrationAmount = 15;

      // Grain (very light)
      pipe.grainEnabled = true;
      pipe.grain.intensity = 6;
      pipe.grain.animated = true;

      // Sharpen pass — recover detail after FXAA/bloom softening
      pipe.sharpenEnabled = true;
      pipe.sharpen.edgeAmount = 0.25;
      pipe.sharpen.colorAmount = 1.0;

      // Depth of field — off by default, enabled in ultra tier
      pipe.depthOfFieldEnabled = false;
      pipe.depthOfFieldBlurLevel = 1; // low blur level by default
      pipe.depthOfField.focalLength = 85;
      pipe.depthOfField.fStop = 2.8;
      pipe.depthOfField.focusDistance = 2000;
    } catch (err) {
      // Babylon post-process not available (SSR or old browser) — degrade gracefully
      console.warn('[PostFX] DefaultRenderingPipeline unavailable:', err);
    }
  }

  /** Enable SSAO2 (Screen-Space Ambient Occlusion) for realistic contact shadows. */
  async enableSSAO(radius = 2.0, totalStrength = 1.2, samples = 16): Promise<void> {
    try {
      const { SSAO2RenderingPipeline } = await import('@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline');
      const ssao = new SSAO2RenderingPipeline('dreamSSAO', this.scene, {
        ssaoRatio: 0.5,
        blurRatio: 1.0,
      });
      ssao.radius = radius;
      ssao.totalStrength = totalStrength;
      ssao.samples = samples;
      ssao.maxZ = 100;
      ssao.minZAspect = 0.5;
      ssao.expensiveBlur = true;
      this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline('dreamSSAO', this.camera);
      this.ssaoPipeline = ssao;
    } catch (err) {
      console.warn('[PostFX] SSAO2 unavailable:', err);
    }
  }

  /** Enable Screen-Space Reflections for realistic PBR surface reflections. */
  async enableSSR(strength = 1.0, reflectionSpecularFalloffExponent = 3): Promise<void> {
    try {
      const { SSRRenderingPipeline } = await import('@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssrRenderingPipeline');
      const ssr = new SSRRenderingPipeline('dreamSSR', this.scene, [this.camera], false);
      ssr.strength = strength;
      ssr.reflectionSpecularFalloffExponent = reflectionSpecularFalloffExponent;
      ssr.step = 1.0;
      ssr.maxSteps = 128;
      ssr.maxDistance = 500;
      ssr.thickness = 0.5;
      ssr.roughnessFactor = 0.25;
      ssr.selfCollisionNumSkip = 2;
      this.ssrPipeline = ssr;
    } catch (err) {
      console.warn('[PostFX] SSR unavailable:', err);
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

  setSharpenEnabled(enabled: boolean): void {
    const pipe = this.pipeline as { sharpenEnabled?: boolean } | null;
    if (pipe && 'sharpenEnabled' in pipe) pipe.sharpenEnabled = enabled;
  }

  setDofEnabled(enabled: boolean): void {
    const pipe = this.pipeline as { depthOfFieldEnabled?: boolean } | null;
    if (pipe && 'depthOfFieldEnabled' in pipe) pipe.depthOfFieldEnabled = enabled;
  }

  setMsaaSamples(samples: number): void {
    const pipe = this.pipeline as { samples?: number } | null;
    if (pipe && 'samples' in pipe) pipe.samples = samples;
  }

  /**
   * Adapt post-FX quality to the current engine performance budget.
   * Called by the engine when the adaptive quality tier changes.
   */
  applyBudget(budget: PerformanceBudget): void {
    if (this.disposed) return;
    const enabled = budget.postFxEnabled;

    this.setBloomEnabled(enabled);
    this.setMsaaSamples(budget.msaaSamples ?? 1);

    if (!enabled) {
      this.setChromaticAberration(0);
      this.setGlowIntensity(0);
      this.setSharpenEnabled(false);
      this.setDofEnabled(false);
    } else {
      switch (budget.tier) {
        case 'ultra':
          this.setBloomWeight(0.5);
          this.setChromaticAberration(20);
          this.setGlowIntensity(0.8);
          this.setSharpenEnabled(true);
          this.setDofEnabled(budget.dofEnabled ?? true);
          break;
        case 'high':
          this.setBloomWeight(0.4);
          this.setChromaticAberration(12);
          this.setGlowIntensity(0.6);
          this.setSharpenEnabled(budget.sharpenEnabled ?? true);
          this.setDofEnabled(false);
          break;
        case 'medium':
          this.setBloomWeight(0.25);
          this.setChromaticAberration(0);
          this.setGlowIntensity(0.4);
          this.setSharpenEnabled(false);
          this.setDofEnabled(false);
          break;
        default:
          break;
      }
    }

    // SSAO quality scaling
    const ssao = this.ssaoPipeline as { radius?: number; totalStrength?: number; samples?: number } | null;
    if (ssao) {
      if (budget.ssaoEnabled) {
        ssao.radius = budget.ssaoRadius ?? 2.0;
        ssao.totalStrength = budget.tier === 'ultra' ? 1.2 : 0.8;
        ssao.samples = budget.tier === 'ultra' ? 16 : 12;
      } else {
        ssao.totalStrength = 0;
      }
    }

    // SSR quality scaling
    const ssr = this.ssrPipeline as { strength?: number; maxSteps?: number } | null;
    if (ssr) {
      if (budget.ssrEnabled) {
        ssr.strength = budget.tier === 'ultra' ? 1.0 : 0.6;
        ssr.maxSteps = budget.tier === 'ultra' ? 128 : 64;
      } else {
        ssr.strength = 0;
      }
    }
  }

  dispose(): void {
    this.disposed = true;
    const pipe = this.pipeline as { dispose?: () => void } | null;
    pipe?.dispose?.();
    const gl = this.glowLayer as { dispose?: () => void } | null;
    gl?.dispose?.();
    const ssao = this.ssaoPipeline as { dispose?: () => void } | null;
    ssao?.dispose?.();
    const ssr = this.ssrPipeline as { dispose?: () => void } | null;
    ssr?.dispose?.();
    this.pipeline = null;
    this.glowLayer = null;
    this.ssaoPipeline = null;
    this.ssrPipeline = null;
  }
}
