# 🧩 Generic "Engin Pipe" Technical Component Catalog

> **Purpose:** This document captures the **domain-agnostic blueprint** that GameEngin currently
> implements inside DREAMengin. Each item below describes *what it is*, *what it does*, and
> *how it can be adapted* for other Engins (Code, Music, Brand, Lab, Forge, …).
>
> Use this file as the canonical "Engin Pipe" template when scaffolding a new Engin. The
> GameEngin structure is the reference implementation while the platform is still being built.
>
> **Status:** Living document — update whenever a generic pattern shifts in the GameEngin
> reference implementation.

---

## 1. Artifact Container Format

- **Generic Name:** Artifact Package Format
- **GameEngin Instance:** `.dreamr` Cartridge

### What It Is

A self-contained, compressed, streamable binary package that contains everything needed to
run / load / execute a creative artifact in the Engin runtime.

### Technical Composition

| Component       | Purpose                                                        | Generic Implementation                              |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| Container       | Holds all files as a single archive                            | POSIX TAR (universal, streams well)                 |
| Compression     | Reduces size for network transfer                              | Zstandard (high ratio, fast decode)                 |
| Manifest        | Declarative metadata about the artifact                        | JSON file at root (`MANIFEST.json`)                 |
| Logic Module    | Executable code for the artifact's behavior                    | WebAssembly (`.wasm`) or JavaScript bundle          |
| Assets          | Media resources (textures, audio, meshes, fonts)               | Domain-specific compressed formats                  |
| Data            | Configuration, tuning parameters, content definitions          | JSON or binary serialized (FlatBuffers)             |
| State Snapshot  | Serialized user progress / resume data                         | Binary blob written by the logic module             |

### Generic Manifest Schema

```json
{
  "artifact_format_version": 1,
  "artifact_id": "unique-identifier",
  "title": "Human-readable name",
  "entry": "path/to/main.wasm",
  "permissions": ["storage", "network", "audio"],
  "assets_manifest": { },
  "save_schema_version": 1
}
```

### Adaptation Examples

- **CodeEngin:** `.dreamproject` — source files, build scripts, dependencies manifest, compiled output.
- **MusicEngin:** `.dreamtrack` — stems, MIDI, effect chains, mix settings, rendered preview.
- **BrandEngin:** `.dreambrand` — logo vectors, color palettes, typography, style guide JSON.
- **LabEngin:** `.dreamexp` — experiment definition, data schema, analysis notebook, results cache.

---

## 2. File-Based Knowledge Brain

- **Generic Name:** Domain Knowledge Substrate
- **GameEngin Instance:** `lib/gameengin/brain/`

### What It Is

A version-controlled directory hierarchy containing structured data files that serve as the
persistent memory and training corpus for AI agents. Agents both **read** from it to learn
best practices and **write** to it with new discoveries.

### Core Subdirectories (Domain-Agnostic)

| Directory             | Purpose                                                           | File Format                          |
| --------------------- | ----------------------------------------------------------------- | ------------------------------------ |
| `principles/`         | Timeless axioms and foundational truths of the domain             | Markdown (`.md`)                     |
| `patterns/`           | Proven recipes, templates, and reusable structures                | JSON or Markdown                     |
| `inspiration-corpus/` | Analyzed case studies of exemplary work in the domain             | JSON (structured analysis)           |
| `heuristics/`         | Quantifiable metrics that correlate with quality / success        | JSON                                 |
| `registry/`           | Tracks what has already been created to ensure originality        | JSON (hash signatures)               |
| `sessions/`           | Logs of every AI research / creation session                      | JSON or Markdown (timestamped)       |
| `predictions/`        | AI-generated proposals awaiting validation                        | JSON (pending / validated)           |
| `reference/`          | Cached external data (scraped content, API responses)             | JSON (raw or processed)              |

### Agent Interaction Pattern

1. **Read:** `fs.readFileSync(path)` at workflow start to gather context.
2. **Write:** `fs.writeFileSync(path)` to log findings, register new patterns, or cache references.
3. **Commit:** Changes are committed to the repository as part of the agent's PR.

### Adaptation Examples

- **CodeEngin Brain:** `principles/` = software design patterns, clean code axioms.
  `patterns/` = project templates, architecture blueprints. `inspiration-corpus/` =
  analysis of great open-source projects. `registry/` = hash of generated project structures
  to avoid duplicates.
- **MusicEngin Brain:** `principles/` = music theory fundamentals, mixing axioms.
  `patterns/` = chord progressions, song structures. `inspiration-corpus/` = analysis of
  hit songs (BPM, key, structure).
- **LabEngin Brain:** `principles/` = scientific method, experiment design. `patterns/` =
  simulation templates, analysis notebooks. `inspiration-corpus/` = famous experiments
  and their designs.

---

## 3. AI Agent Team (Hierarchical Workflow Orchestration)

- **Generic Name:** Autonomous Studio Workforce
- **GameEngin Instance:** Maestro, Prophet, Artisan, Mechanic, Writer, Tech Director

### What It Is

A set of specialized GitHub Actions workflows that each perform a distinct role in the
creation, refinement, and optimization lifecycle. A master orchestrator decides which
agents to dispatch based on telemetry or manual triggers.

### Generic Role Archetypes

| Archetype     | Responsibility                                                                  | Triggers                       | Outputs                                                      |
| ------------- | ------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------ |
| Orchestrator  | Analyzes usage data, decides what needs improvement, dispatches other agents.   | Scheduled (daily), Manual      | Agent dispatch commands, summary report                      |
| Researcher    | Gathers external knowledge, extracts patterns, updates the knowledge brain.     | Called by Orchestrator         | Updated brain files, design rules in database                |
| Builder       | Generates the core logic / executable code of the artifact.                     | Called by Orchestrator         | Compiled WASM or executable output                           |
| Artisan       | Generates visual / media assets required by the artifact.                       | Called by Orchestrator         | Compressed asset files committed to artifact directory       |
| Refiner       | Optimizes performance, reduces size, improves quality based on metrics.         | Called by Orchestrator or PR   | Patches to logic or assets                                   |
| Scribe        | Generates narrative, documentation, or textual content.                         | Called by Orchestrator         | Text files, audio (TTS), documentation                       |
| Gatekeeper    | Validates that generated artifacts meet quality / size / security standards.    | On every PR                    | Pass / fail status, blocks merge if violations               |

### Workflow Dispatch Pattern

1. Orchestrator writes a trigger file or uses `gh workflow run` with inputs.
2. Sub-workflows are defined with `workflow_call` and `workflow_dispatch` triggers.
3. All workflows share the same Node.js setup and environment variables.

### Adaptation Examples

- **CodeEngin Agents:** Architect (researches patterns), Coder (generates implementation),
  Reviewer (validates code quality), Optimizer (refactors for performance), Documenter
  (writes README).
- **MusicEngin Agents:** Theorist (researches harmony), Composer (generates MIDI), Mixer
  (balances levels), Masterer (finalizes track), Lyricist (writes vocals).
- **LabEngin Agents:** HypothesisGenerator (proposes experiments), SimulatorBuilder
  (writes simulation code), Analyst (processes results), PaperWriter (documents findings).

---

## 4. Telemetry & Feedback Loop

- **Generic Name:** Usage Analytics Pipeline
- **GameEngin Instance:** `gameengin_telemetry` hypertable

### What It Is

A time-series database table that records every significant user interaction with the
artifact. This data is the fuel for the autonomous improvement cycle.

### Technical Implementation

- **Storage:** TimescaleDB hypertable (PostgreSQL extension) for efficient time-based queries.
- **Event Schema:** `timestamp`, `artifact_id`, `user_id`, `event_type`, `payload` (JSONB).
- **Aggregation:** Continuous aggregates for hourly / daily metrics (FPS, session length,
  completion rate).
- **Query Pattern:** Orchestrator queries the last 24–48 hours of events to make dispatch
  decisions.

### Generic Event Types

| Event Type           | Payload Example                                       | Used For                |
| -------------------- | ----------------------------------------------------- | ----------------------- |
| `session_start`      | `{ device: "mobile", quality_tier: "high" }`          | Usage patterns          |
| `milestone_reached`  | `{ milestone_id: "level_5", duration_sec: 120 }`      | Progression analysis    |
| `error_encountered`  | `{ error_type: "crash", stack_hash: "abc123" }`       | Stability monitoring    |
| `feature_used`       | `{ feature_id: "export", success: true }`             | Feature adoption        |
| `quality_metric`     | `{ metric: "fps", value: 58.3 }`                      | Performance tracking    |
| `user_feedback`      | `{ rating: 4, comment: "..." }`                       | Satisfaction            |

### Adaptation Examples

- **CodeEngin Telemetry:** `build_start`, `build_success`, `test_run`, `deploy_event`, `error_stack`.
- **MusicEngin Telemetry:** `playback_start`, `export_format`, `effect_adjusted`, `track_completed`.
- **BrandEngin Telemetry:** `asset_exported`, `palette_generated`, `logo_downloaded`.

---

## 5. State Snapshot System

- **Generic Name:** Cross-Session Resume State
- **GameEngin Instance:** `gameengin_snapshots` table + WASM serialization

### What It Is

A mechanism that allows a user to pause an artifact, switch devices, and resume exactly
where they left off. The artifact's logic module is responsible for serializing its
internal state to a binary buffer.

### Technical Contract

The artifact's executable must export:

- `getSnapshotSize() -> number`
- `writeSnapshot(bufferPtr: number) -> void`
- `loadSnapshot(bufferPtr: number) -> void`

The runtime calls these functions to save / restore.

### Storage

- Supabase table with `artifact_id`, `user_id`, `snapshot_data` (JSONB or BYTEA), `created_at`.
- Row Level Security ensures users only access their own snapshots.
- Delta compression can be applied to reduce storage.

### Adaptation Examples

- **CodeEngin Snapshot:** Editor cursor position, open files, undo stack, terminal output.
- **MusicEngin Snapshot:** Playhead position, track solo / mute states, effect parameters,
  MIDI controller mappings.
- **LabEngin Snapshot:** Notebook cell outputs, variable values, plot states.

---

## 6. Workflow Orchestration Pattern

- **Generic Name:** Conditional Agent Dispatch
- **GameEngin Instance:** Maestro analyzing telemetry and dispatching Prophet / Mechanic / etc.

### How It Works

1. **Scheduled Trigger:** Workflow runs daily (or multiple times per day).
2. **Analysis Step:** Script queries telemetry, computes metrics, compares against thresholds.
3. **Decision Output:** Script outputs flags like `needs_research=true`, `needs_optimization=true`.
4. **Conditional Dispatch:** Subsequent jobs use `if:` conditions to call sub-workflows via
   `gh workflow run`.

### Reusable Script Pattern

```ts
// scripts/engin-orchestrator.ts
const metrics = await queryTelemetry(artifactID);
const decisions = {
  needsResearch: metrics.errors > threshold,
  needsBuild: metrics.featureRequests > 0,
  needsOptimize: metrics.avgPerformance < target,
};
// Write to GitHub Actions output
console.log(`needs_research=${decisions.needsResearch}`);
console.log(`needs_build=${decisions.needsBuild}`);
```

### Adaptation

This pattern is identical for all Engins. Only the telemetry queries and thresholds change.

---

## 7. Autonomous Iteration Cycle ("The Pulse")

- **Generic Name:** Continuous Autonomous Improvement Loop
- **GameEngin Instance:** 10-level regeneration pulse for Mad Maxi

### What It Is

A scheduled or milestone-triggered process where the entire artifact (or a portion of it)
is regenerated based on accumulated telemetry, resulting in a new version deployed
automatically.

### Cycle Steps

1. **Analyze:** Gather telemetry since last pulse.
2. **Research:** If new patterns needed, dispatch Researcher agent.
3. **Generate:** Dispatch Builder and Artisan to create updated logic / assets.
4. **Validate:** Gatekeeper ensures new version meets standards.
5. **Package:** Assemble new artifact container.
6. **Deploy:** Make available to users (hot-swap or background update).
7. **Log:** Record the pulse in the knowledge brain for future learning.

### Adaptation Examples

- **CodeEngin Pulse:** Every N commits, analyze build failures; suggest refactors;
  auto-apply safe optimizations.
- **MusicEngin Pulse:** After N plays, analyze listener retention; suggest mix
  adjustments; generate alternative arrangement.
- **LabEngin Pulse:** After N experiment runs, analyze results; propose new hypothesis;
  auto-run simulation.

---

## 8. Performance Budget & Quality Tier System

- **Generic Name:** Adaptive Quality Scaling
- **GameEngin Instance:** Quality tiers (ultra / high / medium / low) based on device capability

### What It Is

A runtime system that detects the user's device capabilities and adjusts resource usage
(resolution, detail level, feature set) to maintain a target performance metric (e.g., 60 FPS).

### Technical Components

- **Capability Detection:** Query `navigator.deviceMemory`, `navigator.hardwareConcurrency`,
  GPU renderer string, screen dimensions.
- **Scoring Algorithm:** Weighted sum of factors → tier assignment.
- **Tier Configuration:** Map of tier → settings (max texture size, shadow resolution,
  particle count, post-processing enabled).
- **Dynamic Adjustment:** Monitor frame time and downgrade if budget exceeded.

### Generic Tier Config

```json
{
  "tiers": {
    "ultra":  { "max_asset_size": "4K",    "features": ["advanced_fx"] },
    "high":   { "max_asset_size": "1080p", "features": ["basic_fx"] },
    "medium": { "max_asset_size": "720p",  "features": [] },
    "low":    { "max_asset_size": "480p",  "features": [], "target_fps": 30 }
  }
}
```

### Adaptation Examples

- **CodeEngin Tiers:** Limit concurrent analysis workers, syntax highlighting complexity,
  IntelliSense depth based on device.
- **MusicEngin Tiers:** Limit real-time effect processing, track count, waveform resolution.
- **LabEngin Tiers:** Limit simulation resolution, plot interactivity, data point count.

---

## 9. Asset Compression Standards

- **Generic Name:** Optimized Media Encoding Pipeline
- **GameEngin Instance:** Basis Universal for textures, Draco for meshes, Opus for audio

### Generic Principles

- **Use GPU-native formats:** Transcode to the format the device's hardware decoder supports.
- **Offload decoding to workers:** Keep main thread free for interactivity.
- **Apply domain-specific compression:** Lossy where imperceptible, lossless where critical.

### Reusable Encoding Table

| Media Type        | Recommended Format               | Compression Tool     | Notes                           |
| ----------------- | -------------------------------- | -------------------- | ------------------------------- |
| 2D Images/Sprites | WebP (lossy/lossless) or AVIF    | `cwebp`, `avifenc`   | GPU decode via browser          |
| 3D Models         | glTF with Draco                  | `gltf-pipeline -d`   | WASM decoder                    |
| Audio (Music)     | Opus @ 128 kbps                  | `opusenc`            | Web Audio API                   |
| Audio (Voice)     | Opus @ 32 kbps                   | `opusenc`            | Web Audio API                   |
| Fonts             | WOFF2                            | `woff2_compress`     | Subset to needed glyphs         |
| Text/Data         | Zstd                             | `zstd`               | General compression             |
| Executable Code   | WASM with `wasm-opt -Oz`         | Binaryen             | SIMD enabled                    |

### Adaptation

All Engins that produce downloadable artifacts should implement this pipeline to minimize
bandwidth and improve load times.

---

## 10. Local-First Development Principle

- **Generic Name:** Zero External Service Dependency (Beyond Existing Stack)
- **GameEngin Instance:** No new APIs; uses existing Supabase, GitHub Actions, file system

### What It Means

- **No new paid services.** Everything runs on GitHub's free runners or the existing
  Vercel / Supabase tiers.
- **File system is the primary database for knowledge.** The brain lives in the repo,
  not in a vector DB.
- **LLM calls are optional and can be mocked.** If `OPENROUTER_API_KEY` is missing,
  agents fall back to cached heuristics or skip generation.
- **Asset generation can use local tools.** ImageMagick, FFmpeg, or Canvas API instead
  of cloud AI if needed.

### Adaptation

This principle applies universally. Every Engin should be designed to function with zero
additional monthly costs beyond what DREAMengin already pays.

---

## 11. Hot-Swap Runtime Shell

- **Generic Name:** Persistent Shell with Swappable Artifacts
- **GameEngin Instance:** Next.js App Router shell that owns the GPU context and mounts /
  unmounts cartridges

### What It Is

A single-page application architecture where the outer "Shell" (navigation, global state,
system services) persists across all interactions, and only the inner "Artifact Viewer /
Runtime" is replaced when switching between artifacts. This eliminates page refreshes and
preserves performance context.

### Technical Pattern

- **Shell Component:** Rendered at the root layout (`app/layout.tsx`), contains providers
  and global UI.
- **Artifact Slot:** A dynamic route segment (`app/engin/[id]/page.tsx`) that loads the
  appropriate runtime component.
- **Context Preservation:** GPU context, WebSocket connections, and auth state are held
  by the Shell, not recreated.

### Adaptation

- **CodeEngin Shell:** File tree, terminal panel, editor tabs persist; project workspace swaps in.
- **MusicEngin Shell:** Transport controls, mixer panel, plugin rack persist; track / project swaps in.
- **LabEngin Shell:** Notebook sidebar, kernel status, variable inspector persist; experiment notebook swaps in.

---

## 12. Unified Input & Haptics Manager

- **Generic Name:** Multi-Modal Input Abstraction
- **GameEngin Instance:** Gamepad, DualSense, touch, keyboard unified into `InputState` struct

### What It Is

A service that normalizes all input sources (touch gestures, gamepad buttons, keyboard
keys, MIDI controllers) into a single, domain-specific state object that the artifact's
logic can consume without caring about the source.

### Pattern

```ts
interface DomainInputState {
  // Domain-agnostic fields
  primaryAction: boolean;
  secondaryAction: boolean;
  navigationDirection: { x: number; y: number };
  modifierKeys: { shift: boolean; ctrl: boolean; alt: boolean };
  // Domain-specific fields
  // ...
}
```

### Adaptation

- **CodeEngin Input:** Keyboard shortcuts, multi-cursor gestures.
- **MusicEngin Input:** MIDI note on / off, control change, transport buttons.
- **BrandEngin Input:** Pen pressure, touch gestures for canvas manipulation.

---

## Summary: The Generic "Engin Pipe" Template

When you want to build a new autonomous Engin, you replicate these 12 components:

| #  | Component                                  | Reusable Pattern                                                                                                          |
| -- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| 1  | Artifact Container Format                  | TAR + Zstd + Manifest + WASM + Assets                                                                                     |
| 2  | File-Based Knowledge Brain                 | Directory of Markdown / JSON: principles, patterns, inspiration, registry, sessions, predictions                          |
| 3  | AI Agent Team                              | Orchestrator, Researcher, Builder, Artisan, Refiner, Scribe, Gatekeeper                                                   |
| 4  | Telemetry & Feedback Loop                  | TimescaleDB hypertable + `event_type` / `payload` JSON                                                                    |
| 5  | State Snapshot System                      | WASM exports: `getSnapshotSize()`, `writeSnapshot()`, `loadSnapshot()`                                                    |
| 6  | Workflow Orchestration Pattern             | Scheduled workflow → analyze telemetry → dispatch via `gh workflow run`                                                   |
| 7  | Autonomous Iteration Cycle ("The Pulse")   | Analyze → Research → Generate → Validate → Package → Deploy → Log                                                         |
| 8  | Performance Budget & Quality Tier System   | Capability detection → tier assignment → settings map (resolution, features, FPS)                                         |
| 9  | Asset Compression Standards                | Domain-specific formats (WebP / AVIF for images, Opus for audio, Draco for 3D, Zstd for data)                             |
| 10 | Local-First Development Principle          | File system as primary DB, fallback to cached heuristics if APIs unavailable                                              |
| 11 | Hot-Swap Runtime Shell                     | Root layout holds GPU / auth / connections; dynamic route swaps artifact runtime                                          |
| 12 | Unified Input & Haptics Manager            | All input sources mapped to single `DomainInputState` struct                                                              |

### How To Use This Template

For any new Engin (CodeEngin, MusicEngin, BrandEngin, LabEngin, ForgeEngin, …):

1. **Clone the GameEngin directory structure** as the starting skeleton.
2. **Replace domain-specific content** in the brain (`principles/`, `patterns/`, etc.).
3. **Define the artifact manifest schema** for the new domain.
4. **Copy the workflow YAMLs and scripts**, renaming agents to fit the domain archetypes.
5. **Implement the snapshot exports** in WASM (or the equivalent runtime contract).

GameEngin remains the canonical reference implementation while the platform is still
being built — keep this document in sync as patterns harden.
