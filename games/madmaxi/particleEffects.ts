/**
 * Particle Effects System for MadMaxi
 * Provides juice and visual feedback for all game events
 */

import type {
  Mesh,
  Scene,
  ParticleSystem,
  Color4,
  Vector3,
  AbstractEngine,
} from '@babylonjs/core';

export type ParticleEffectType =
  | 'coin-collect'
  | 'coin-burst'
  | 'enemy-stomp'
  | 'boss-hit'
  | 'dash-trail'
  | 'jump-dust'
  | 'land-impact'
  | 'powerup-collect'
  | 'shield-sparkle'
  | 'laser-beam'
  | 'giant-aura'
  | 'death-explosion'
  | 'goal-star-shine';

interface ParticleConfig {
  color1: Color4;
  color2: Color4;
  colorDead: Color4;
  particleCount: number;
  lifetime: number;
  emitRate: number;
  minSize: number;
  maxSize: number;
  speed: number;
  duration?: number; // ms, if undefined runs continuously
}

const PARTICLE_CONFIGS: Record<ParticleEffectType, Partial<ParticleConfig>> = {
  'coin-collect': {
    particleCount: 20,
    lifetime: 0.3,
    emitRate: 100,
    minSize: 0.05,
    maxSize: 0.12,
    speed: 2.0,
    duration: 150,
  },
  'coin-burst': {
    particleCount: 40,
    lifetime: 0.6,
    emitRate: 200,
    minSize: 0.08,
    maxSize: 0.18,
    speed: 3.5,
    duration: 200,
  },
  'enemy-stomp': {
    particleCount: 30,
    lifetime: 0.4,
    emitRate: 150,
    minSize: 0.06,
    maxSize: 0.15,
    speed: 2.5,
    duration: 200,
  },
  'boss-hit': {
    particleCount: 50,
    lifetime: 0.5,
    emitRate: 250,
    minSize: 0.1,
    maxSize: 0.22,
    speed: 4.0,
    duration: 250,
  },
  'dash-trail': {
    particleCount: 15,
    lifetime: 0.25,
    emitRate: 80,
    minSize: 0.08,
    maxSize: 0.14,
    speed: 0.5,
  },
  'jump-dust': {
    particleCount: 15,
    lifetime: 0.3,
    emitRate: 100,
    minSize: 0.04,
    maxSize: 0.10,
    speed: 1.5,
    duration: 150,
  },
  'land-impact': {
    particleCount: 25,
    lifetime: 0.35,
    emitRate: 150,
    minSize: 0.05,
    maxSize: 0.12,
    speed: 2.0,
    duration: 180,
  },
  'powerup-collect': {
    particleCount: 40,
    lifetime: 0.6,
    emitRate: 200,
    minSize: 0.10,
    maxSize: 0.20,
    speed: 3.0,
    duration: 300,
  },
  'shield-sparkle': {
    particleCount: 20,
    lifetime: 0.4,
    emitRate: 60,
    minSize: 0.06,
    maxSize: 0.12,
    speed: 1.0,
  },
  'laser-beam': {
    particleCount: 10,
    lifetime: 0.2,
    emitRate: 100,
    minSize: 0.08,
    maxSize: 0.14,
    speed: 8.0,
  },
  'giant-aura': {
    particleCount: 30,
    lifetime: 0.5,
    emitRate: 80,
    minSize: 0.12,
    maxSize: 0.24,
    speed: 0.8,
  },
  'death-explosion': {
    particleCount: 60,
    lifetime: 0.8,
    emitRate: 300,
    minSize: 0.12,
    maxSize: 0.28,
    speed: 4.5,
    duration: 400,
  },
  'goal-star-shine': {
    particleCount: 35,
    lifetime: 0.7,
    emitRate: 70,
    minSize: 0.08,
    maxSize: 0.16,
    speed: 1.5,
  },
};

export class ParticleEffectsManager {
  private bjs: typeof import('@babylonjs/core') | null = null;
  private scene: Scene | null = null;
  private activeSystems: Map<string, ParticleSystem> = new Map();
  private continuousSystems: Map<string, ParticleSystem> = new Map();

  async init(scene: Scene, bjs: typeof import('@babylonjs/core')) {
    this.scene = scene;
    this.bjs = bjs;
  }

  emit(
    type: ParticleEffectType,
    position: Vector3,
    color1: Color4,
    color2: Color4,
    velocityDirection?: Vector3,
  ): void {
    if (!this.scene || !this.bjs) return;

    const config = PARTICLE_CONFIGS[type];
    if (!config) return;

    try {
      const ps = new this.bjs.ParticleSystem(`ps_${type}_${Date.now()}`, config.particleCount ?? 20, this.scene);

      // Emitter setup
      ps.emitter = position.clone();

      // Particle texture (simple white texture)
      ps.particleTexture = new this.bjs.Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAE0lEQVQYV2P8////fwYGBgZGBgYAVwcC A7T+4k8AAAAASUVORK5CYII=', this.scene);

      // Colors
      ps.color1 = color1;
      ps.color2 = color2;
      ps.colorDead = new this.bjs.Color4(color1.r, color1.g, color1.b, 0);

      // Size
      ps.minSize = config.minSize ?? 0.05;
      ps.maxSize = config.maxSize ?? 0.12;

      // Lifetime
      ps.minLifeTime = config.lifetime ?? 0.3;
      ps.maxLifeTime = (config.lifetime ?? 0.3) * 1.5;

      // Emit rate
      ps.emitRate = config.emitRate ?? 100;

      // Direction & speed
      if (velocityDirection) {
        ps.direction1 = velocityDirection.scale(0.7);
        ps.direction2 = velocityDirection.scale(1.3);
      } else {
        ps.direction1 = new this.bjs.Vector3(-1, -1, -1).normalize();
        ps.direction2 = new this.bjs.Vector3(1, 1, 1).normalize();
      }

      ps.minEmitPower = config.speed ?? 2.0;
      ps.maxEmitPower = (config.speed ?? 2.0) * 1.5;

      // Gravity
      ps.gravity = new this.bjs.Vector3(0, -0.5, 0);

      // Blend mode
      ps.blendMode = this.bjs.ParticleSystem.BLENDMODE_ADD;

      // Start
      ps.start();

      // Auto-dispose
      if (config.duration) {
        setTimeout(() => {
          ps.stop();
          setTimeout(() => ps.dispose(), config.lifetime ? config.lifetime * 1500 : 500);
        }, config.duration);
      }

      this.activeSystems.set(ps.name, ps);
    } catch (error) {
      console.warn('[ParticleEffects] Failed to create particle system:', error);
    }
  }

  startContinuous(
    id: string,
    type: ParticleEffectType,
    emitterMesh: Mesh,
    color1: Color4,
    color2: Color4,
  ): void {
    if (!this.scene || !this.bjs) return;
    if (this.continuousSystems.has(id)) return; // already running

    const config = PARTICLE_CONFIGS[type];
    if (!config) return;

    try {
      const ps = new this.bjs.ParticleSystem(`ps_cont_${id}`, config.particleCount ?? 20, this.scene);

      ps.emitter = emitterMesh;
      ps.particleTexture = new this.bjs.Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAE0lEQVQYV2P8////fwYGBgZGBgYAVwcC A7T+4k8AAAAASUVORK5CYII=', this.scene);

      ps.color1 = color1;
      ps.color2 = color2;
      ps.colorDead = new this.bjs.Color4(color1.r, color1.g, color1.b, 0);

      ps.minSize = config.minSize ?? 0.05;
      ps.maxSize = config.maxSize ?? 0.12;

      ps.minLifeTime = config.lifetime ?? 0.3;
      ps.maxLifeTime = (config.lifetime ?? 0.3) * 1.5;

      ps.emitRate = config.emitRate ?? 50;

      ps.direction1 = new this.bjs.Vector3(-1, -0.5, -1).normalize();
      ps.direction2 = new this.bjs.Vector3(1, 0.5, 1).normalize();

      ps.minEmitPower = config.speed ?? 1.0;
      ps.maxEmitPower = (config.speed ?? 1.0) * 1.5;

      ps.gravity = new this.bjs.Vector3(0, -0.3, 0);
      ps.blendMode = this.bjs.ParticleSystem.BLENDMODE_ADD;

      ps.start();

      this.continuousSystems.set(id, ps);
    } catch (error) {
      console.warn('[ParticleEffects] Failed to start continuous system:', error);
    }
  }

  stopContinuous(id: string): void {
    const ps = this.continuousSystems.get(id);
    if (ps) {
      ps.stop();
      setTimeout(() => ps.dispose(), 500);
      this.continuousSystems.delete(id);
    }
  }

  dispose(): void {
    for (const ps of this.activeSystems.values()) {
      ps.dispose();
    }
    for (const ps of this.continuousSystems.values()) {
      ps.dispose();
    }
    this.activeSystems.clear();
    this.continuousSystems.clear();
  }
}

/**
 * Screen shake system for impact feedback
 */
export class ScreenShake {
  private intensity = 0;
  private decay = 0.9;
  private offsetX = 0;
  private offsetY = 0;

  shake(power: number): void {
    this.intensity = Math.max(this.intensity, power);
  }

  update(): { x: number; y: number } {
    if (this.intensity < 0.001) {
      this.intensity = 0;
      this.offsetX = 0;
      this.offsetY = 0;
      return { x: 0, y: 0 };
    }

    this.offsetX = (Math.random() - 0.5) * this.intensity;
    this.offsetY = (Math.random() - 0.5) * this.intensity;
    this.intensity *= this.decay;

    return { x: this.offsetX, y: this.offsetY };
  }

  reset(): void {
    this.intensity = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }
}
