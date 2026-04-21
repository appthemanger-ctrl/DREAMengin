# Engin Pipe — Generic Backbone for Every DREAMengin Engin

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)
> **Documentation Date:** 2026-04-18

The Engin Pipe is the domain-agnostic spine that all DREAMengin Engins
share — `GameEngin`, `CodeEngin`, `MusicEngin` (StarMaker), `BrandEngin`,
`LabEngin`, `ContentEngin`, and any future `*Engin`.

Each row below maps a generic catalog component to its implementation
under `lib/enginpipe/`. PR #1 ships rows **1, 4, 8, 11**; subsequent
PRs fill in the remaining components.

| # | Component | Generic Pattern | `lib/enginpipe/` Path | Status |
|---|-----------|-----------------|----------------------|--------|
| 1 | Artifact Container Format | TAR + Zstd + Manifest + WASM + Assets | `artifact/manifest.ts` | ✅ shipped |
| 2 | File-Based Knowledge Brain | `principles/`, `patterns/`, `inspiration-corpus/`, `registry/`, `sessions/`, `predictions/` | `brain/` | ✅ shipped |
| 3 | AI Agent Team | Orchestrator, Researcher, Builder, Artisan, Refiner, Scribe, Gatekeeper | `agents/` | ⏳ PR #3 |
| 4 | Telemetry & Feedback Loop | TimescaleDB hypertable + `event_type`/`payload` JSON | `telemetry/{events,client}.ts` | ✅ shipped |
| 5 | State Snapshot System | WASM exports `getSnapshotSize()`, `writeSnapshot()`, `loadSnapshot()` | `snapshot/` | ✅ shipped |
| 6 | Workflow Orchestration Pattern | Scheduled workflow → analyze telemetry → dispatch via `gh workflow run` | `orchestration/` | ✅ shipped |
| 7 | Autonomous Iteration Cycle (The Pulse) | Analyze → Research → Generate → Validate → Package → Deploy → Log | `pulse/` | ✅ shipped |
| 8 | Performance Budget & Quality Tier System | Capability detection → tier assignment → settings map | `quality/tiers.ts` | ✅ shipped |
| 9 | Asset Compression Standards | WebP/AVIF for images, Opus for audio, Draco for 3D, Zstd for data | `compression/` | ✅ shipped |
| 10 | Local-First Development Principle | File system as primary DB; cached fallback when external APIs unset | `localfirst/` | ✅ shipped |
| 11 | Hot-Swap Runtime Shell | Root layout holds GPU/auth; dynamic route swaps artifact runtime | `shell/ArtifactSlot.tsx` | ✅ shipped |
| 12 | Unified Input & Haptics Manager | All input sources → single `DomainInputState` struct | `input/` | ✅ shipped |

## How to use it

```ts
import {
  ArtifactSlot,
  createManifest,
  createTelemetryClient,
  detectCapabilityTier,
  parseManifest,
} from '@/lib/enginpipe';
```

### Mounting an Engin runtime

```tsx
<ArtifactSlot artifactId="engin:music">
  <MusicEnginRuntime />
</ArtifactSlot>
```

The slot owns a per-artifact event bus (accessible via
`useArtifactSlot()`), so cross-cutting features can attach in one place.

### Authoring a manifest

```ts
const manifest = createManifest({
  artifact_id: 'demo-track',
  title: 'Demo Track',
  entry: 'logic/main.wasm',
  permissions: ['audio'],
});
```

`parseManifest` / `safeParseManifest` validate untrusted input.

### Reporting telemetry

```ts
import { createClient } from '@/lib/supabase/client';

const tele = createTelemetryClient({ supabase: createClient() });
await tele.record({
  artifact_id: 'engin:code',
  event_type: 'feature_used',
  payload: { feature_id: 'pair-program', success: true },
});
```

The client never throws; failures are returned in the result object.

### Choosing a quality tier

```ts
const tier = detectCapabilityTier({
  navigator,
  screen,
});
```

Returns `'ultra' | 'high' | 'medium' | 'low'`. The default tier table
(`DEFAULT_TIER_CONFIG`) matches the JSON in the catalog §8.

## Adding a new Engin

1. Pick a stable `artifact_id` namespace (e.g. `engin:lab`).
2. Wrap the Engin's root component in `<ArtifactSlot artifactId=…>`.
3. Use `createManifest` for any artifact format the Engin produces.
4. Route domain telemetry through `createTelemetryClient` so it lands in
   the shared `gameengin_telemetry` table (or a custom table if needed).
5. Use `detectCapabilityTier` as the default starting tier when the
   Engin renders or processes media.

GameEngin is the first concrete instantiation of this template; its
runtime in `lib/gameengin/` is being progressively rewritten to consume
`lib/enginpipe/` instead of holding its own copies of these patterns.
