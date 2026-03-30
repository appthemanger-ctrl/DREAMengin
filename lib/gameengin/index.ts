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
