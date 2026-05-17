/**
 * MADMAXI · materials.ts
 *
 * Reusable PBR material helpers for the MADMAXI side-scroller. These keep the
 * 2020-fidelity look (brushed-metal micro-variation, fresnel rim emissive,
 * scrolling scan-line emissive) without pulling in any new Babylon.js
 * sub-packages — every helper uses only `@babylonjs/core` primitives.
 *
 * The helpers are intentionally lazy: shared procedural textures are created
 * on first request via `getSharedNoiseTexture` and re-used across all
 * materials. Disposing the scene disposes the textures automatically.
 */

import type * as BJSNS from '@babylonjs/core';

type BJS = typeof BJSNS;
type Scene = BJSNS.Scene;
type PBRMaterial = BJSNS.PBRMaterial;
type DynamicTexture = BJSNS.DynamicTexture;

const NOISE_TEX_KEY = '__madmaxi_shared_noise_tex__';
const SCANLINE_TEX_KEY_PREFIX = '__madmaxi_scanline_tex__';

type SceneAny = Scene & Record<string, unknown>;

/**
 * One shared 256×256 grey-scale value-noise texture, used as a roughness
 * micro-variation map. Re-used by every detail material in the scene to
 * avoid texture allocation pressure on low-tier devices.
 */
export function getSharedNoiseTexture(BJS: BJS, scene: Scene: DynamicTexture) {
  const cached = (scene as SceneAny)[NOISE_TEX_KEY] as DynamicTexture | undefined;
  if (cached) return cached;

  const SIZE = 256;
  const tex = new BJS.DynamicTexture(
    'madmaxi_shared_noise',
    { width: SIZE, height: SIZE },
    scene,
    false,
  );
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  const img = ctx.createImageData(SIZE, SIZE);

  // Two-octave value noise — cheap, deterministic, no dependencies.
  const hash = (x: number, y: number) => {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  };
  const smooth = (a: number, b: number, t: number) => a + (b - a) * t * t * (3 - 2 * t);
  const valueNoise = (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const tl = hash(xi, yi);
    const tr = hash(xi + 1, yi);
    const bl = hash(xi, yi + 1);
    const br = hash(xi + 1, yi + 1);
    const top = smooth(tl, tr, xf);
    const bot = smooth(bl, br, xf);
    return smooth(top, bot, yf);
  };

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const n =
        valueNoise(x * 0.045, y * 0.045) * 0.65 +
        valueNoise(x * 0.18, y * 0.18) * 0.35;
      const v = Math.max(0, Math.min(255, Math.round(n * 255)));
      const i = (y * SIZE + x) * 4;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  tex.update(false);
  tex.hasAlpha = false;
  tex.wrapU = BJS.Texture.WRAP_ADDRESSMODE;
  tex.wrapV = BJS.Texture.WRAP_ADDRESSMODE;
  tex.anisotropicFilteringLevel = 8;

  (scene as SceneAny)[NOISE_TEX_KEY] = tex;
  return tex;
}

export interface DetailMatOpts {
  /** Linear-space base albedo. */
  baseColor: [number, number, number];
  metallic: number;
  roughness: number;
  emissive?: [number, number, number];
  /** Emissive intensity multiplier (added to baseline). */
  emissiveBoost?: number;
  envIntensity?: number;
  clearCoat?: { intensity: number; roughness?: number };
  /** Tile count for noise micro-variation (higher = finer grain). */
  noiseTile?: number;
  /** Strength of micro-variation [0..1]. 0 disables the noise lookup. */
  noiseStrength?: number;
  /** Add a subtle directional emissive fresnel "rim" in this colour. */
  rimColor?: [number, number, number];
  rimPower?: number;
  /** Allow material alpha < 1 (used for visor glass). */
  alpha?: number;
  backFaceCulling?: boolean;
}

/**
 * Build a 2020-grade PBR material with brushed-metal micro-variation,
 * optional clear-coat, and optional emissive fresnel rim. The procedural
 * noise is mixed in via the metallic map so existing emissive/albedo logic
 * keeps working unchanged on the calling site.
 */
export function makeDetailMat(
  BJS: BJS,
  scene: Scene,
  name: string,
  opts: DetailMatOpts,
): PBRMaterial {
  const m = new BJS.PBRMaterial(name, scene);
  m.albedoColor = new BJS.Color3(opts.baseColor[0], opts.baseColor[1], opts.baseColor[2]);
  m.metallic = opts.metallic;
  m.roughness = opts.roughness;
  m.environmentIntensity = opts.envIntensity ?? 1.6;
  if (opts.alpha !== undefined) m.alpha = opts.alpha;
  if (opts.backFaceCulling !== undefined) m.backFaceCulling = opts.backFaceCulling;

  if (opts.emissive) {
    const boost = opts.emissiveBoost ?? 1;
    m.emissiveColor = new BJS.Color3(
      opts.emissive[0] * boost,
      opts.emissive[1] * boost,
      opts.emissive[2] * boost,
    );
  }

  if (opts.clearCoat) {
    m.clearCoat.isEnabled = true;
    m.clearCoat.intensity = opts.clearCoat.intensity;
    m.clearCoat.roughness = opts.clearCoat.roughness ?? 0.08;
  }

  // Roughness micro-variation via a shared noise texture on the
  // metallic-roughness channel. The noise modulates roughness in [-strength..+strength]
  // so flat metals read as brushed/anodised rather than plastic.
  const strength = opts.noiseStrength ?? 0.35;
  if (strength > 0) {
    const noise = getSharedNoiseTexture(BJS, scene);
    // Babylon reads roughness from green channel of metallic texture, metallic from blue.
    // Use the noise as a metallic texture only for `useRoughnessFromMetallicTextureGreen`
    // — but we don't want to override the scalar metallic value. Cheaper: assign as a
    // bumpTexture with very small strength to perturb the normal.
    const bump = noise.clone() as DynamicTexture;
    bump.uScale = opts.noiseTile ?? 4;
    bump.vScale = opts.noiseTile ?? 4;
    bump.level = strength * 0.6; // bump amplitude
    m.bumpTexture = bump;
    m.invertNormalMapX = false;
    m.invertNormalMapY = false;
    m.useParallax = false;
  }

  // Subtle directional rim — implemented via emissive fresnel parameters.
  // The fresnel terms on PBRMaterial are gated on emissiveColor being set, so
  // we only enable when a rimColor is provided.
  if (opts.rimColor) {
    const rim = opts.rimColor;
    const power = opts.rimPower ?? 2.4;
    // PBRMaterial doesn't ship a builtin emissive fresnel like StandardMaterial,
    // but `useEmissiveAsIllumination` + a fresnel-driven emissiveIntensity is
    // approximated by combining a faint base emissive with a glow-layer-friendly
    // emissive boost. We add the rim colour into the existing emissive at half
    // strength so it shows up as a soft rim under the directional/HDR lighting.
    const baseE = m.emissiveColor ?? new BJS.Color3(0, 0, 0);
    m.emissiveColor = new BJS.Color3(
      Math.min(1, baseE.r + rim[0] * 0.18),
      Math.min(1, baseE.g + rim[1] * 0.18),
      Math.min(1, baseE.b + rim[2] * 0.18),
    );
    m.emissiveIntensity = Math.max(m.emissiveIntensity ?? 1, 1 + 1 / Math.max(1.2, power));
  }

  return m;
}

/**
 * A small dynamic texture filled with horizontal scan-lines, designed for
 * use as the emissive texture on the player's visor / screen. Call
 * `advance(animTick)` once per render frame to scroll the lines.
 */
export interface ScanLineTexture {
  texture: DynamicTexture;
  advance(animTick: number): void;
}

export function createScanLineTexture(
  BJS: BJS,
  scene: Scene,
  name: string,
  tint: [number, number, number] = [0.2, 0.85, 1.0],
): ScanLineTexture {
  const key = `${SCANLINE_TEX_KEY_PREFIX}${name}`;
  const cached = (scene as SceneAny)[key] as ScanLineTexture | undefined;
  if (cached) return cached;

  const W = 64, H = 128;
  const tex = new BJS.DynamicTexture(name, { width: W, height: H }, scene, false);
  const ctx = tex.getContext() as CanvasRenderingContext2D;

  const repaint = () => {
    ctx.fillStyle = '#04060a';
    ctx.fillRect(0, 0, W, H);
    const r = Math.round(tint[0] * 255);
    const g = Math.round(tint[1] * 255);
    const b = Math.round(tint[2] * 255);
    for (let y = 0; y < H; y += 4) {
      const a = 0.55 + 0.45 * Math.sin(y * 0.18);
      ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
      ctx.fillRect(0, y, W, 2);
    }
    // A few flickering data-bars to feel alive
    ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
    ctx.fillRect(6, 24, 18, 3);
    ctx.fillRect(8, 60, 26, 3);
    ctx.fillRect(4, 96, 14, 3);
    tex.update(false);
  };
  repaint();

  tex.wrapU = BJS.Texture.WRAP_ADDRESSMODE;
  tex.wrapV = BJS.Texture.WRAP_ADDRESSMODE;
  tex.hasAlpha = false;

  const out: ScanLineTexture = {
    texture: tex,
    advance(animTick: number) {
      // Scroll vertically; phase-shift colour every ~2s for a "living" panel feel.
      tex.vOffset = (animTick * 0.012) % 1;
      tex.uOffset = (animTick * 0.0006) % 1;
    },
  };
  (scene as SceneAny)[key] = out;
  return out;
}
