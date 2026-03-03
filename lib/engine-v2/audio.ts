// lib/engine-v2/audio.ts
// Phase 8 — Audio: mixer with channels, ducking, silence-by-default, sound budget,
// audio virtualisation, impact sounds, state-machine driven loops.
// Pure module — no DOM/Web Audio API references (those are wired externally).

// ---------------------------------------------------------------------------
// Channel types
// ---------------------------------------------------------------------------

export type AudioChannel = 'music' | 'sfx' | 'ui';

export interface AudioChannelConfig {
  volume: number; // 0..1
  muted: boolean;
}

// ---------------------------------------------------------------------------
// Audio mixer
// ---------------------------------------------------------------------------

export class AudioMixer {
  private channels: Record<AudioChannel, AudioChannelConfig> = {
    music: { volume: 0.6, muted: false },
    sfx:   { volume: 0.8, muted: false },
    ui:    { volume: 0.5, muted: false },
  };

  /** Master volume (applied on top of channel volume). */
  private masterVolume = 0;
  /** User must explicitly enable audio (silence by default). */
  private audioEnabled = false;

  /** Enable audio — must be called from a user gesture handler. */
  enableAudio(): void {
    this.audioEnabled = true;
    this.masterVolume = 1.0;
  }

  disableAudio(): void {
    this.audioEnabled = false;
    this.masterVolume = 0;
  }

  isAudioEnabled(): boolean {
    return this.audioEnabled;
  }

  setChannelVolume(channel: AudioChannel, volume: number): void {
    this.channels[channel].volume = Math.max(0, Math.min(1, volume));
  }

  muteChannel(channel: AudioChannel): void {
    this.channels[channel].muted = true;
  }

  unmuteChannel(channel: AudioChannel): void {
    this.channels[channel].muted = false;
  }

  /** Effective volume for a given channel (considering mute + master). */
  effectiveVolume(channel: AudioChannel): number {
    if (!this.audioEnabled) return 0;
    const ch = this.channels[channel];
    if (ch.muted) return 0;
    return ch.volume * this.masterVolume;
  }

  getChannelConfig(channel: AudioChannel): AudioChannelConfig {
    return { ...this.channels[channel] };
  }
}

// ---------------------------------------------------------------------------
// Ducking
// ---------------------------------------------------------------------------

export interface DuckingConfig {
  /** Volume multiplier applied to music channel when ducking is active. */
  duckFactor: number;
  /** Duration in ms to fade back to full volume after SFX ends. */
  fadeBackMs: number;
}

export const DEFAULT_DUCKING: DuckingConfig = {
  duckFactor: 0.3,
  fadeBackMs: 500,
};

export class DuckingController {
  private ducking = false;
  private duckEndMs = 0;
  private readonly cfg: DuckingConfig;

  constructor(config: DuckingConfig = DEFAULT_DUCKING) {
    this.cfg = config;
  }

  /** Call when an important SFX is triggered. */
  triggerDuck(nowMs: number, durationMs: number): void {
    this.ducking = true;
    this.duckEndMs = nowMs + durationMs;
  }

  /** Call each frame. Returns the effective music volume multiplier. */
  tick(nowMs: number, baseMusicVolume: number): number {
    if (this.ducking && nowMs > this.duckEndMs) {
      this.ducking = false;
    }
    if (this.ducking) {
      return baseMusicVolume * this.cfg.duckFactor;
    }
    // Fade back linearly over fadeBackMs after duck ends.
    const timeSinceEnd = nowMs - this.duckEndMs;
    if (timeSinceEnd >= 0 && timeSinceEnd < this.cfg.fadeBackMs) {
      const t = timeSinceEnd / this.cfg.fadeBackMs;
      return baseMusicVolume * (this.cfg.duckFactor + (1 - this.cfg.duckFactor) * t);
    }
    return baseMusicVolume;
  }

  get isDucking(): boolean {
    return this.ducking;
  }
}

// ---------------------------------------------------------------------------
// Sound budget
// ---------------------------------------------------------------------------

export const MAX_CONCURRENT_SOUNDS = 16;

export class SoundBudget {
  private active = 0;
  private readonly max: number;

  constructor(max = MAX_CONCURRENT_SOUNDS) {
    this.max = max;
  }

  canPlay(): boolean {
    return this.active < this.max;
  }

  acquire(): boolean {
    if (!this.canPlay()) return false;
    this.active++;
    return true;
  }

  release(): void {
    this.active = Math.max(0, this.active - 1);
  }

  get activeCount(): number {
    return this.active;
  }

  get capacity(): number {
    return this.max;
  }
}

// ---------------------------------------------------------------------------
// Audio virtualisation (don't play inaudible sounds)
// ---------------------------------------------------------------------------

/** Returns true if a sound at the given distance should be virtualised (not played). */
export function shouldVirtualise(
  distancePx: number,
  maxAudibleDistancePx: number,
  volume: number,
): boolean {
  if (volume <= 0) return true;
  return distancePx > maxAudibleDistancePx;
}

// ---------------------------------------------------------------------------
// Impact sound helper (collision impulse driven)
// ---------------------------------------------------------------------------

export interface ImpactSoundConfig {
  /** Minimum impulse magnitude to trigger a sound. */
  minImpulse: number;
  /** Impulse magnitude that maps to maximum volume. */
  maxImpulse: number;
  /** Asset id of the impact sound. */
  assetId: string;
}

export const DEFAULT_IMPACT: ImpactSoundConfig = {
  minImpulse: 0.5,
  maxImpulse: 50,
  assetId: 'impact-default',
};

export function computeImpactVolume(impulseMagnitude: number, config: ImpactSoundConfig): number {
  if (impulseMagnitude < config.minImpulse) return 0;
  const t = (impulseMagnitude - config.minImpulse) / Math.max(1, config.maxImpulse - config.minImpulse);
  return Math.min(1, t);
}

// ---------------------------------------------------------------------------
// Haptic hooks (polite — respects prefers-reduced-motion)
// ---------------------------------------------------------------------------

export interface HapticRequest {
  /** Duration in ms. */
  durationMs: number;
  /** Intensity 0..1. */
  intensity: number;
}

export function shouldTriggerHaptic(prefersReducedMotion: boolean): boolean {
  return !prefersReducedMotion;
}
