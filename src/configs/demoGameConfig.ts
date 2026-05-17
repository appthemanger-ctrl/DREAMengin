/**
 * src/configs/demoGameConfig.ts
 *
 * Sample game configuration that demonstrates how to initialise the
 * DREAMengin GameEnginCore.  Every subsystem parameter is documented
 * so developers can copy-paste a minimal slice for their own title.
 *
 * Pass this object to `GameEnginCore.start(demoGameConfig)`.
 */

import type { GameConfig } from '../core/GameEnginCore';

const demoGameConfig: GameConfig = {
  // -- Identity --------------------------------------------------------------
  id: 'demo-game',
  name: 'DREAMengin Demo',
  version: '1.0.0',

  // -- Graphics & Rendering --------------------------------------------------
  graphics: {
    /** Adaptive quality tier.  Engine auto-downgrades on thermal stress. */
    qualityTier: 'high',
    /** Maximum LOD level rendered per mesh distance bucket. */
    maxLodLevel: 4,
    /** Target frames-per-second (60 or 120). */
    targetFps: 60,
    /** Enable post-processing stack (bloom, SSAO, DoF, motion blur). */
    postFxEnabled: true,
    /** Enable physically-based materials. */
    pbrEnabled: true,
  },

  // -- Gameplay Simulation ---------------------------------------------------
  simulation: {
    /** Fixed-timestep interval in milliseconds (16.6 = 60 Hz). */
    fixedTimestepMs: 16.6,
    /** Physics gravity vector [x, y, z]. */
    gravity: [0, -9.81, 0],
    /** Maximum entities before ECS budget alarm fires. */
    maxEntities: 2048,
    /** Enable deterministic replay recording for ghost/anti-cheat. */
    replayEnabled: true,
  },

  // -- Input & Controls ------------------------------------------------------
  input: {
    /** Accept touch events (mobile). */
    touch: true,
    /** Accept keyboard events. */
    keyboard: true,
    /** Accept generic gamepad events. */
    gamepad: true,
    /** Enable DualSense haptics and adaptive trigger feedback. */
    dualSense: true,
  },

  // -- Audio Pipeline --------------------------------------------------------
  audio: {
    /** Enable full spatial (HRTF + convolution reverb + Doppler) audio. */
    spatialAudio: true,
    /** Channel budget: voice chat track count. */
    voiceChannels: 4,
    /** Channel budget: music track count. */
    musicChannels: 2,
    /** Channel budget: sound-effects track count. */
    sfxChannels: 32,
  },

  // -- Networking & Online Systems -------------------------------------------
  networking: {
    /** Primary transport: 'WebSocket' | 'WebRTC' | 'WebTransport'. */
    primaryTransport: 'WebRTC',
    /** Fallback transport when primary is unavailable. */
    fallbackTransport: 'WebSocket',
    /** Maximum tolerated one-way latency in milliseconds. */
    maxLatencyMs: 120,
    /** Maximum rollback frames for netcode desync recovery. */
    maxRollbackFrames: 8,
    /** Tick-rate for input synchronisation (Hz). */
    tickRateHz: 60,
  },

  // -- Asset Streaming & Memory ----------------------------------------------
  assets: {
    /** Preloaded assets required before the first frame. */
    preload: [
      { id: 'mainCharacter', path: '/assets/characters/main.glb', priority: 10 },
      { id: 'terrain',       path: '/assets/terrain/heightmap.glb', priority: 9 },
    ],
    /** Lazy-streamed assets loaded after gameplay starts. */
    stream: [
      { id: 'envProbe',  path: '/assets/env/probe.hdr',   priority: 5 },
      { id: 'ambientFx', path: '/assets/audio/ambient.ogg', priority: 3 },
    ],
    /** Total memory cap for all streamed assets (MiB). */
    memoryBudgetMib: 256,
    /** Number of concurrent asset streaming workers. */
    streamWorkers: 4,
  },

  // -- Offline, Recovery & Session Continuity --------------------------------
  offline: {
    /** Queue gameplay actions while offline and flush on reconnect. */
    enableActionQueue: true,
    /** Restore session state from IndexedDB on warm-start. */
    enableSessionRestore: true,
    /** Maximum queued actions before oldest are pruned. */
    maxQueuedActions: 512,
  },

  // -- Security, Safety & Privacy --------------------------------------------
  security: {
    /** Named threat model to activate (maps to docs/SECURITY.md profiles). */
    threatModel: 'default',
    /** Enable child-safety / content-moderation scanning hooks. */
    contentModerationEnabled: true,
    /** Enable anti-cheat input hashing in the replay buffer. */
    antiCheatEnabled: true,
  },

  // -- Quality Engineering & Telemetry --------------------------------------
  telemetry: {
    /** Emit live FPS + frame-pacing metrics to the quality dashboard. */
    enabled: true,
    /** Sample interval for GPU/CPU profiler ring buffer (frames). */
    profilerRingBufferSize: 120,
    /** Minimum acceptable average FPS before auto-rollback is triggered. */
    minAcceptableFps: 25,
  },
};

export default demoGameConfig;
