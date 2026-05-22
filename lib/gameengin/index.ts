/**
 * lib/gameengin/index.ts
 *
 * DREAMengin Elite Game Engine — Public API
 *
 * Single import surface for all elite engine capabilities:
 *   import { EliteGameEngine, AIDirector, PostFXManager } from '@/lib/gameengin';
 *
 * Power Systems (20 advanced subsystems):
 *   import { RollbackNetcode, ComputeShaderPipeline, AdvancedPhysicsWorld, ... } from '@/lib/gameengin';
 */

export { mapJoystickToAsset } from './control-mappings';
export type { ControlMapping } from './control-mappings';
export { ECSWorld, EliteGameEngine } from './core';
export { DreamEngine } from './dream-engine';
export type { GameAsset, GlobalRegistryEntry, WasmOutput } from './dream-engine';

// ── Unified game loop ─────────────────────────────────────────────────────────
export type {
    Component, EntityId, FrameCallback, FrameTelemetry, PerformanceBudget, QualityChangeCallback, QualityTier, System
} from './core';
export {
    activeGameCount,
    isLoopRunning, registerGame,
    unregisterGame
} from './unifiedLoop';
export type { LoopPriority } from './unifiedLoop';
export { useUnifiedLoop } from './useUnifiedLoop';

export { AIDirector } from './ai-director';
export type { DirectorState, PlayerSignals } from './ai-director';

export { PostFXManager } from './post-fx';

// ── Console-class platform facade ────────────────────────────────────────────
export { GameEnginPlatform, detectCapabilities } from './platform';
export type {
    PlatformBootOptions, PlatformCapabilities, QuickResumeEntry
} from './platform';

// ── Game Cartridge Runtime ───────────────────────────────────────────────────
export { GRAVITY_VALUES } from './cartridge';
export type {
    CartridgeInputEvent, GameCartridge,
    GameEngineAPI,
    GravityPreset
} from './cartridge';
export { createReactGameCartridge, defineReactCartridgeLoader } from './cartridges/reactCartridge';
export { default as GameRuntime } from './GameRuntime';
export type { GameRuntimeProps } from './GameRuntime';

// ── Cartridge bay — every repo game packaged as a GameCartridge ──────────────
export {
    CARTRIDGE_MANIFEST, getCartridgeCategories, getCartridgeManifest
} from './cartridges/manifest';
export type {
    CartridgeManifestEntry,
    CartridgeRenderMode
} from './cartridges/manifest';

// ── Power Systems (20 state-of-the-art 2026+ engine subsystems) ──────────────
export {
    AdvancedPhysicsWorld, AnimationStateMachine, AssetStreamManager, BehaviorTreeEngine, ClientSidePrediction, ComputeShaderPipeline, GPUProfiler, GlobalIllumProbes, LODSystem, OctreeBVH, PhysicsMaterialSystem, ProceduralWorldGen, ReplayBuffer, ResourcePool, RollbackNetcode, SpatialAudioDSP, TerrainEngine, TypedEventBus, WGSLShaderManager, WorkerJobSystem
} from './power-systems';

export type {
    AABB, AnimState, AnimTransition, AnimationClip, AssetHandle, AssetState, AssetType, AudioSourceDef, BTContext,
    BTNode, BTStatus, ComputeDispatch, ComputeKernel, EventMap, GIProbe, InputFrame, Job, JobPriority, JobResult, LODLevel,
    LODObject, ListenerState, MaterialPair, NetInput, PhysicsBody, PhysicsBodyDef, PhysicsBodyType, PhysicsConstraint, PhysicsMaterial, PredictionState, ProfileFrame, ProfileSpan, RaycastResult, ReplayMeta, RollbackConfig, SHCoeffs, ServerSnapshot,
    ShaderVariant, ShapeType, SpatialEntry, TerrainPage, WorldChunk, WorldGenConfig
} from './power-systems';
