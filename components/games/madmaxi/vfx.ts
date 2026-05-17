/**
 * MADMAXI · vfx.ts
 *
 * Lightweight pooled visual-effects kit for the MADMAXI side-scroller.
 * Every effect is a pre-allocated `ParticleSystem` (or `Mesh`) that re-uses
 * the same texture pool — manual emit counts are tuned per device tier so
 * the effect stays cheap on low-end hardware and rich on high-end devices.
 *
 * No new external assets are added; particle textures are 1×1 PNG data URIs
 * coloured at runtime via Babylon's `colorGradients` API.
 */

import type * as BJSNS from '@babylonjs/core';

type BJS = typeof BJSNS;
type Scene = BJSNS.Scene;
type Vector3 = BJSNS.Vector3;
type ParticleSystem = BJSNS.ParticleSystem;
type Mesh = BJSNS.Mesh;
type GlowLayer = BJSNS.GlowLayer;

export type VfxTier = 'low' | 'mid' | 'high';

export interface VfxKit {
  /** Spark burst when an enemy is stomped or a boss takes a hit. */
  spark(at: Vector3, color: [number, number, number]): void;
  /** Begin/extend the player's dash trail at the given world position. */
  dashTrail(at: Vector3, color: [number, number, number]): void;
  /** Show the expanding ground-impact ring at the player's feet. */
  landingRing(at: Vector3): void;
  /** Star-burst on coin pickup (works for silver and gold). */
  coinStarburst(at: Vector3, color: [number, number, number]): void;
  /** Toggle the boss-enrage rising-ember stream. Pass `at=null` to stop. */
  setEmbers(at: Vector3 | null, color: [number, number, number]): void;
  /** Per-frame update — drives the landing-ring fade and dash-trail decay. */
  tick(): void;
  /** Clamp particle counts and disable the heaviest effects on low-tier devices. */
  setTier(tier: VfxTier): void;
  dispose(): void;
}

const PARTICLE_TEX_DATA =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';

interface PSConfig {
  capacity: number;
  minSize: number;
  maxSize: number;
  minLifeTime: number;
  maxLifeTime: number;
  minEmitPower: number;
  maxEmitPower: number;
  gravity: [number, number, number];
  dir1: [number, number, number];
  dir2: [number, number, number];
}

function makePS(BJS: BJS, scene: Scene, name: string, cfg: PSConfig): ParticleSystem {
  const ps = new BJS.ParticleSystem(name, cfg.capacity, scene);
  ps.particleTexture = new BJS.Texture(PARTICLE_TEX_DATA, scene);
  ps.emitter = new BJS.Vector3(0, 0, 0);
  ps.minSize = cfg.minSize;
  ps.maxSize = cfg.maxSize;
  ps.minLifeTime = cfg.minLifeTime;
  ps.maxLifeTime = cfg.maxLifeTime;
  ps.minEmitPower = cfg.minEmitPower;
  ps.maxEmitPower = cfg.maxEmitPower;
  ps.direction1 = new BJS.Vector3(cfg.dir1[0], cfg.dir1[1], cfg.dir1[2]);
  ps.direction2 = new BJS.Vector3(cfg.dir2[0], cfg.dir2[1], cfg.dir2[2]);
  ps.gravity = new BJS.Vector3(cfg.gravity[0], cfg.gravity[1], cfg.gravity[2]);
  ps.emitRate = 0;
  ps.colorDead = new BJS.Color4(0, 0, 0, 0);
  ps.blendMode = BJS.ParticleSystem.BLENDMODE_ADD;
  return ps;
}

export function createMadmaxiVfx(BJS: BJS, scene: Scene, glow: GlowLayer | null): VfxKit {
  // ─── Sparks ────────────────────────────────────────────────────────────
  const sparks = makePS(BJS, scene, 'madmaxi_sparks', {
    capacity: 80,
    minSize: 0.06, maxSize: 0.18,
    minLifeTime: 0.18, maxLifeTime: 0.45,
    minEmitPower: 1.2, maxEmitPower: 3.4,
    gravity: [0, -6.5, 0],
    dir1: [-2.2, 1.2, -0.6], dir2: [2.2, 3.4, 0.6],
  });
  sparks.start();

  // ─── Dash trail ────────────────────────────────────────────────────────
  const dashTrail = makePS(BJS, scene, 'madmaxi_dash_trail', {
    capacity: 60,
    minSize: 0.10, maxSize: 0.34,
    minLifeTime: 0.14, maxLifeTime: 0.32,
    minEmitPower: 0.0, maxEmitPower: 0.4,
    gravity: [0, -1.0, 0],
    dir1: [-0.2, -0.1, -0.1], dir2: [0.2, 0.1, 0.1],
  });
  dashTrail.start();

  // ─── Coin starburst ────────────────────────────────────────────────────
  const coinBurst = makePS(BJS, scene, 'madmaxi_coin_burst', {
    capacity: 40,
    minSize: 0.08, maxSize: 0.20,
    minLifeTime: 0.25, maxLifeTime: 0.55,
    minEmitPower: 1.6, maxEmitPower: 3.2,
    gravity: [0, -2.5, 0],
    dir1: [-3.0, -1.5, -0.4], dir2: [3.0, 3.5, 0.4],
  });
  coinBurst.start();

  // ─── Boss-enrage embers ────────────────────────────────────────────────
  const embers = makePS(BJS, scene, 'madmaxi_embers', {
    capacity: 60,
    minSize: 0.08, maxSize: 0.22,
    minLifeTime: 0.6, maxLifeTime: 1.2,
    minEmitPower: 0.6, maxEmitPower: 1.4,
    gravity: [0, 1.4, 0],
    dir1: [-0.5, 0.4, -0.3], dir2: [0.5, 1.6, 0.3],
  });

  // ─── Landing ring ──────────────────────────────────────────────────────
  // A flat disc that expands and fades. Lives outside the particle system so
  // we can give it a precise pop-in/pop-out animation curve.
  const ringDiameter = 0.6;
  const ring: Mesh = BJS.MeshBuilder.CreateDisc(
    'madmaxi_landing_ring',
    { radius: ringDiameter, tessellation: 32 },
    scene,
  );
  ring.rotation.x = Math.PI / 2;
  ring.isPickable = false;
  ring.setEnabled(false);
  const ringMat = new BJS.PBRMaterial('madmaxi_landing_ring_mat', scene);
  ringMat.albedoColor = new BJS.Color3(0, 0, 0);
  ringMat.emissiveColor = new BJS.Color3(0.4, 0.85, 1.0);
  ringMat.metallic = 0;
  ringMat.roughness = 1;
  ringMat.alpha = 0;
  ringMat.backFaceCulling = false;
  ring.material = ringMat;
  if (glow) glow.addIncludedOnlyMesh(ring);

  let ringFrame = 0;
  const RING_LIFETIME = 22;

  let tier: VfxTier = 'high';
  const burstCount = (base: number) =>
    tier === 'low' ? Math.max(2, Math.round(base * 0.35))
      : tier === 'mid' ? Math.round(base * 0.7)
        : base;

  return {
    spark(at, color) {
      sparks.color1 = new BJS.Color4(color[0], color[1], color[2], 1);
      sparks.color2 = new BJS.Color4(color[0] * 0.6, color[1] * 0.6, color[2] * 0.6, 0.6);
      (sparks.emitter as Vector3).copyFrom(at);
      sparks.manualEmitCount = burstCount(20);
    },
    dashTrail(at, color) {
      if (tier === 'low') return;
      dashTrail.color1 = new BJS.Color4(color[0], color[1], color[2], 0.9);
      dashTrail.color2 = new BJS.Color4(color[0] * 0.4, color[1] * 0.6, color[2], 0.4);
      (dashTrail.emitter as Vector3).copyFrom(at);
      dashTrail.manualEmitCount = burstCount(6);
    },
    landingRing(at) {
      ring.position.copyFrom(at);
      ring.scaling.setAll(0.4);
      ringMat.alpha = 0.85;
      ring.setEnabled(true);
      ringFrame = RING_LIFETIME;
    },
    coinStarburst(at, color) {
      coinBurst.color1 = new BJS.Color4(color[0], color[1], color[2], 1);
      coinBurst.color2 = new BJS.Color4(color[0] * 0.8, color[1] * 0.7, color[2] * 0.5, 0.6);
      (coinBurst.emitter as Vector3).copyFrom(at);
      coinBurst.manualEmitCount = burstCount(14);
    },
    setEmbers(at, color) {
      if (at === null || tier === 'low') {
        embers.stop();
        embers.emitRate = 0;
        return;
      }
      embers.color1 = new BJS.Color4(color[0], color[1], color[2], 1);
      embers.color2 = new BJS.Color4(color[0] * 0.6, color[1] * 0.3, 0, 0.4);
      (embers.emitter as Vector3).copyFrom(at);
      const rate = tier === 'mid' ? 24 : 48;
      if (embers.emitRate !== rate) {
        embers.emitRate = rate;
        embers.start();
      }
    },
    tick() {
      if (ringFrame > 0) {
        ringFrame--;
        const t = 1 - ringFrame / RING_LIFETIME; // 0 → 1
        ring.scaling.setAll(0.4 + t * 2.6);
        ringMat.alpha = (1 - t) * 0.85;
        if (ringFrame === 0) ring.setEnabled(false);
      }
    },
    setTier(next) {
      tier = next;
      // Re-cap pool sizes so we don't waste GPU memory on low-tier devices.
      if (next === 'low') {
        dashTrail.stop();
        embers.stop();
      } else {
        dashTrail.start();
      }
    },
    dispose() {
      sparks.dispose();
      dashTrail.dispose();
      coinBurst.dispose();
      embers.dispose();
      ringMat.dispose();
      ring.dispose();
    },
  };
}