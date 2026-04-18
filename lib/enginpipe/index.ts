/**
 * lib/enginpipe/index.ts
 *
 * Barrel export for the generic "Engin Pipe" backbone. See
 * `docs/enginpipe/README.md` for the 12-component template that this
 * library implements (PR #1 ships components 1, 4, 8, 11; later PRs
 * fill in the rest).
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
