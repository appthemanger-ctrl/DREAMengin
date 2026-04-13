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

// ── Game Cartridge Runtime ───────────────────────────────────────────────────
export { default as GameRuntime } from './GameRuntime';
export type { GameRuntimeProps } from './GameRuntime';
export { wrapAsCartridge } from './ReactComponentCartridge';
export { GRAVITY_VALUES } from './cartridge';
export type {
  GameCartridge,
  GameEngineAPI,
  GravityPreset,
  CartridgeInputEvent,
} from './cartridge';

// ── Power Systems (20 state-of-the-art 2026+ engine subsystems) ──────────────
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
