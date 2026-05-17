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

export { EliteGameEngine, ECSWorld } from './core';
export { mapJoystickToAsset } from './control-mappings';
export type { ControlMapping } from './control-mappings';
export { DreamEngine } from './dream-engine';
export type { GameAsset, GlobalRegistryEntry, WasmOutput } from './dream-engine';

// -- Unified game loop ---------------------------------------------------------
export {
  registerGame,
  unregisterGame,
  activeGameCount,
  isLoopRunning,
} from './unifiedLoop';
export type { LoopPriority } from './unifiedLoop';
export { useUnifiedLoop } from './useUnifiedLoop';
export type {
  EntityId,
  Component,
  System,
  QualityTier,
  PerformanceBudget,
  FrameTelemetry,
  FrameCallback,
  QualityChangeCallback,
} from './core';

export { AIDirector } from './ai-director';
export type { PlayerSignals, DirectorState } from './ai-director';

export { PostFXManager } from './post-fx';

// -- Console-class platform facade --------------------------------------------
export { GameEnginPlatform, detectCapabilities } from './platform';
export type {
  PlatformCapabilities,
  PlatformBootOptions,
  QuickResumeEntry,
} from './platform';

// -- Game Cartridge Runtime ---------------------------------------------------
export { default as GameRuntime } from './GameRuntime';
export type { GameRuntimeProps } from './GameRuntime';
export { createReactGameCartridge, defineReactCartridgeLoader } from './cartridges/reactCartridge';
export { GRAVITY_VALUES } from './cartridge';
export type {
  GameCartridge,
  GameEngineAPI,
  GravityPreset,
  CartridgeInputEvent,
} from './cartridge';

// -- Cartridge bay — every repo game packaged as a GameCartridge --------------
export {
  CARTRIDGE_MANIFEST,
  getCartridgeManifest,
  getCartridgeCategories,
} from './cartridges/manifest';
export type {
  CartridgeManifestEntry,
  CartridgeRenderMode,
} from './cartridges/manifest';

// -- Power Systems (20 state-of-the-art 2026+ engine subsystems) --------------
export {
  RollbackNetcode,
  ComputeShaderPipeline,
  AdvancedPhysicsWorld,
  OctreeBVH,
  WorkerJobSystem,
  ProceduralWorldGen,
  SpatialAudioDSP,
  ReplayBuffer,
  BehaviorTreeEngine,
  GPUProfiler,
  TypedEventBus,
  AnimationStateMachine,
  LODSystem,
  ClientSidePrediction,
  ResourcePool,
  WGSLShaderManager,
  TerrainEngine,
  GlobalIllumProbes,
  AssetStreamManager,
  PhysicsMaterialSystem,
} from './power-systems';

export type {
  NetInput,
  RollbackConfig,
  ComputeKernel,
  ComputeDispatch,
  PhysicsBodyDef,
  PhysicsBody,
  PhysicsConstraint,
  PhysicsBodyType,
  ShapeType,
  RaycastResult,
  AABB,
  SpatialEntry,
  JobPriority,
  Job,
  JobResult,
  WorldGenConfig,
  WorldChunk,
  AudioSourceDef,
  ListenerState,
  InputFrame,
  ReplayMeta,
  BTStatus,
  BTContext,
  BTNode,
  ProfileSpan,
  ProfileFrame,
  EventMap,
  AnimationClip,
  AnimTransition,
  AnimState,
  LODLevel,
  LODObject,
  PredictionState,
  ServerSnapshot,
  ShaderVariant,
  TerrainPage,
  SHCoeffs,
  GIProbe,
  AssetHandle,
  AssetType,
  AssetState,
  PhysicsMaterial,
  MaterialPair,
} from './power-systems';
