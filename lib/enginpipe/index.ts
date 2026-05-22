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
    EnginArtifactManifestSchema, createManifest, parseManifest,
    safeParseManifest
} from './artifact/manifest';
export type {
    ArtifactPermission,
    EnginArtifactManifest
} from './artifact/manifest';

// 4. Telemetry & feedback loop
export { createTelemetryClient } from './telemetry/client';
export type {
    TelemetryClient,
    TelemetryClientOptions,
    TelemetryRecordResult,
    TelemetrySupabaseClient
} from './telemetry/client';
export {
    TelemetryEventSchema, TelemetryEventTypeSchema, parseTelemetryEvent
} from './telemetry/events';
export type {
    TelemetryEvent, TelemetryEventType
} from './telemetry/events';

// 8. Adaptive quality tier system
export {
    DEFAULT_TIER_CONFIG, detectCapabilityTier,
    getTierConfig, scoreCapabilities,
    tierFromScore
} from './quality/tiers';
export type {
    CapabilityInput,
    CapabilityNavigator,
    CapabilityScreen, QualityTier,
    QualityTierConfig
} from './quality/tiers';

// 11. Hot-swap runtime shell primitive
export {
    ArtifactSlot,
    useArtifactSlot,
    useOptionalArtifactSlot
} from './shell/ArtifactSlot';
export type {
    ArtifactSlotContextValue, ArtifactSlotProps
} from './shell/ArtifactSlot';
