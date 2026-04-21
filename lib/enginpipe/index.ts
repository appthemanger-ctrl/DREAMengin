/**
 * lib/enginpipe/index.ts
 *
 * Barrel export for the generic "Engin Pipe" backbone.
 *
 * Shipped components (docs/enginpipe/README.md):
 *   1  Artifact Container Format   ✅
 *   2  File-Based Knowledge Brain  ✅
 *   4  Telemetry & Feedback Loop   ✅
 *   5  State Snapshot System       ✅
 *   6  Workflow Orchestration      ✅
 *   7  Autonomous Iteration Cycle  ✅
 *   8  Quality Tier System         ✅
 *   9  Asset Compression Standards ✅
 *  10  Local-First Principle       ✅
 *  11  Hot-Swap Runtime Shell      ✅
 *  12  Unified Input & Haptics     ✅
 */

// 1. Artifact container — manifest schema
export {
  ArtifactPermissionSchema,
  EnginArtifactManifestSchema,
  parseManifest,
  safeParseManifest,
  createManifest,
} from './artifact/manifest';
export type {
  ArtifactPermission,
  EnginArtifactManifest,
} from './artifact/manifest';

// 4. Telemetry & feedback loop
export {
  TelemetryEventTypeSchema,
  TelemetryEventSchema,
  parseTelemetryEvent,
} from './telemetry/events';
export type {
  TelemetryEventType,
  TelemetryEvent,
} from './telemetry/events';
export { createTelemetryClient } from './telemetry/client';
export type {
  TelemetryClient,
  TelemetryClientOptions,
  TelemetryRecordResult,
  TelemetrySupabaseClient,
} from './telemetry/client';

// 8. Adaptive quality tier system
export {
  DEFAULT_TIER_CONFIG,
  scoreCapabilities,
  tierFromScore,
  detectCapabilityTier,
  getTierConfig,
} from './quality/tiers';
export type {
  QualityTier,
  QualityTierConfig,
  CapabilityInput,
  CapabilityNavigator,
  CapabilityScreen,
} from './quality/tiers';

// 11. Hot-swap runtime shell primitive
export {
  ArtifactSlot,
  useArtifactSlot,
  useOptionalArtifactSlot,
} from './shell/ArtifactSlot';
export type {
  ArtifactSlotProps,
  ArtifactSlotContextValue,
} from './shell/ArtifactSlot';

// 2. File-Based Knowledge Brain
export {
  createBrain,
  hydrateBrain,
  seedDefaultPrinciples,
} from './brain';
export type {
  Brain,
  BrainSession,
  BrainSnapshot,
  Pattern,
  PatternKind,
  Principle,
  PrincipleCategory,
  Prediction,
  SessionEvent,
  SessionEventType,
} from './brain';

// 5. State Snapshot System
export {
  createSnapshotManager,
  snapshotManager,
} from './snapshot';
export type {
  SnapshotMeta,
  SnapshotManager,
  SnapshotReadResult,
  SnapshotValidationError,
} from './snapshot';

// 6. Workflow Orchestration Pattern
export {
  createOrchestrator,
} from './orchestration';
export type {
  Orchestrator,
  OrchWorkflowDef,
  OrchRunRecord,
  OrchRunStatus,
  OrchEnginId,
  TelemetrySignal,
  TriggerKind,
  WorkflowTrigger,
} from './orchestration';

// 7. Autonomous Iteration Cycle (The Pulse)
export {
  createPulse,
  PULSE_STAGES,
} from './pulse';
export type {
  Pulse,
  PulseOptions,
  PulseAdapters,
  PulseCycleResult,
  PulseCycleStatus,
  PulseStage,
  AnalyzeContext,
  ResearchContext,
  GenerateContext,
  ValidateContext,
  PackageContext,
  DeployContext,
} from './pulse';

// 9. Asset Compression Standards
export {
  COMPRESSION_POLICY,
  selectFormat,
  validateFormat,
  checkSizeBudget,
} from './compression';
export type {
  AssetClass,
  AssetDescriptor,
  FormatPreference,
  FormatValidationResult,
  FormatViolationReason,
  SizeBudgetResult,
} from './compression';

// 10. Local-First Development Principle
export {
  createLocalFirstStore,
  localStore,
} from './localfirst';
export type {
  LocalFirstStore,
  LocalFirstEntry,
  LocalFirstValue,
  ExternalAdapter,
  StoreReadResult,
  StoreWriteResult,
  StoreSnapshot,
} from './localfirst';

// 12. Unified Input & Haptics Manager
export {
  createInputManager,
  createHapticsManager,
  emptyInputState,
} from './input';
export type {
  InputManager,
  HapticsManager,
  HapticsRequest,
  HapticsChannel,
  HapticsEffect,
  DomainInputState,
  InputEvent,
  InputEventKind,
  InputSource,
  InputEventListener,
  StateChangeListener,
} from './input';

