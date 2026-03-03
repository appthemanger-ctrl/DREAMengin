# DREAMengin — Engine Roadmap

**Status:** Active  
**Owner:** appthemanger-ctrl  
**Last updated:** 2026-03-03

---

## Overview

This document describes the planned upgrade trajectory for DREAMengin's engine layer. The guiding principle at every stage is: **battery-first, deterministic, no always-on loops**.

---

## V1 — EngineCore v1 (Complete)

**Status:** Frozen / Stable  
**Scope:** Foundation

| Area | Capability |
|------|-----------|
| Simulation | Deterministic fixed-step loop |
| Broadphase | Uniform grid |
| Narrowphase | Basic AABB collision |
| Solver | Sequential impulse |
| Rendering | Babylon.js adapter, render-on-demand |
| Sprite | `DrEamsAnimator` — 24-frame sprite sheet, interaction zones |
| Navigation | Damped-spring gesture physics, toroidal world, discrete depth |
| Battery | Idle freeze, 30/60 fps policy, render-on-demand |

V1 is frozen. No new features will be added to V1 source files. Bug fixes that affect V2 compatibility may be backported.

---

## V2 — EngineCore v2 (This Plan)

**Status:** In Progress  
**Target:** Ship demo scene + benchmark scene + replay determinism test

V2 is organised into 10 phases. Each phase builds on the previous.

### Phase 0 — Define (No Drift)

- Freeze V1 baseline
- Define V2 success criteria
- Document pillars, budgets, degradation rules, non-goals
- **Deliverables:** `ENGINE_V2_SPEC.md`, `ENGINE_ROADMAP.md` ✅

### Phase 1 — Instrumentation

Goal: You can't tune what you can't see.

- Per-system timers (physics, input, render, GC pressure)
- Rolling heat score metric
- Substep counter
- Contact count + solver iteration telemetry
- Entity counts per component type
- Ring-buffer event log (256 entries)
- Perf HUD overlay (debug flag)
- Budget breach log entries
- Replayable perf scene test map
- Automated perf tests (no allocations in hot loops)

**Deliverable:** `lib/engine-v2/instrumentation.ts`

### Phase 2 — Determinism + Replay

Goal: Bugs become repeatable.

- Deterministic input queue (tick-indexed timestamps)
- `StateHash` per tick (hash key position/velocity arrays)
- Replay recorder: save inputs + seed + initial state
- Replay player: run headless + compare `StateHash`
- Snapshot compression: deltas every N ticks + periodic full snapshots
- "Rewind to last checkpoint" debug function
- "Pause + single-step tick" debug controls
- Deterministic stable-pair ordering
- Floating-point discipline (clamping, epsilon discipline)
- Unit tests: replay same scenario twice → identical `StateHash`

**Deliverable:** `lib/engine-v2/determinism.ts`

### Phase 3 — Physics Stability

Goal: Stacking works. Fast movers don't tunnel.

- XPBD option for constraints (stable, controllable) — per-scene mode
- Constraint compliance (softness) on all joints
- Baumgarte / position-correction presets per device class
- Island-based sleeping (sleep groups)
- Continuous collision for fast movers (`ccd` flag)
- Contact manifold persistence (2–4 points)
- Friction and restitution mixing rules
- Penetration clamp (max 0.5 units/step)

**Deliverable:** `lib/engine-v2/physics-v2.ts`

### Phase 4 — Broadphase Upgrade

Goal: Decoder-style pair prioritization.

- Dynamic cell sizing per scene
- Pair cache with LRU eviction
- Broadphase residual scoring (cached + recent pairs first)
- AABB fattening (speculative contacts)
- Optional sweep-and-prune for 1D scenes
- Collision layer matrix (O(1) filtering)
- Active-region culling
- Spatial query API: `nearest`, `overlap`, `raycast`
- Query budget (64/frame cap)
- Broadphase correctness tests

**Deliverable:** `lib/engine-v2/broadphase-v2.ts`

### Phase 5 — Gameplay Layer

Goal: States, not chaos.

- Per-entity state machine (idle / move / interact / stunned / custom)
- `IntentComponent` (input → intent, not velocity)
- Ability system (cooldown, cost, animation hooks)
- Event bus ring buffer (512 entries): collision enter/stay/exit
- Trigger volumes (no physics response)
- Tag queries: `findAllWithTagInRadius(tag, center, radius)`
- Health/damage components (optional)
- Deterministic RNG per system (seeded streams)
- Sample game-loop scene (collect → avoid → score)

**Deliverable:** `lib/engine-v2/gameplay.ts`

### Phase 6 — Render Upgrade

Goal: Premium look, cheap cost.

- GPU instancing (Babylon.js thin instances)
- LOD rules
- Freeze static meshes when sleeping
- Dynamic resolution scaler (heat-score linked)
- Interaction burst mode (1–2 s quality boost on touch)
- Distance + frustum culling (occlusion-lite)
- 2D overlay pipeline (no per-frame canvas redraw)
- Render-on-demand
- Visual preset system: `Minimal | Balanced | Premium`

**Deliverable:** `lib/engine-v2/render-v2.ts`

### Phase 7 — Asset Pipeline

Goal: Content without pain.

- Content manifest format (JSON): meshes, textures, audio, prefabs
- Asset loader (cache + ref counting)
- Lazy loading (block only on essentials)
- Prefab system (entity templates)
- Build-time validation script
- Hot-reload prefabs in dev
- Sprite sheet metadata support
- Texture compression recommendations (webp / basis)
- Content version tag
- Starter pack manifest

**Deliverable:** `lib/engine-v2/assets.ts`

### Phase 8 — Audio + Feel

Goal: Subtle, not gaudy.

- Audio mixer: music / SFX / UI channels
- Ducking (reduce music on important SFX)
- Haptic hooks (respects `prefers-reduced-motion`)
- Impact sounds (collision impulse driven, capped)
- Footstep/hover loops (state-machine driven)
- Silence by default
- Scene-scoped preloading
- Audio virtualisation
- Sound budget (max 16)
- Tests: no throw on missing assets

**Deliverable:** `lib/engine-v2/audio.ts`

### Phase 9 — Engine Safety

Goal: Fail softly, never jank.

- NaN guards and bounds guards (dev mode)
- Panic mode: freeze sim on NaN, surface recovery UI
- Safe fallback assets (placeholder mesh/texture)
- Budget-degrade strategy (solver iterations first)
- GC guardrails: no per-frame heap allocations in hot loops
- Scene-loader timeout (10 s)
- End-to-end headless test (10 s run, no NaN, stable hash)
- Mobile sanity preset

**Deliverable:** `lib/engine-v2/safety.ts`

---

## V2 Final Deliverable

Ship V2 as a **demo scene + benchmark scene + replay determinism test**:

- `Demo Scene`: sample game-loop (collect → avoid → score)
- `Benchmark Scene`: max-stress entities, measure against budgets
- `Replay Test`: run same scenario twice, assert identical `StateHash`

These three scenes serve as the regression gate for V2. Any future V2 change that breaks them is a regression.

---

## V3 — EngineCore v3 (Planned)

**Status:** Planned (not started)  
**Target:** After V2 ships and is stable

### V3 Themes

| Area | Planned Capability |
|------|--------------------|
| Multiplayer | Deterministic lockstep or rollback networking |
| Editor | In-engine scene editor (drag-drop entities, live preview) |
| Advanced Rendering | PBR materials, dynamic shadows, optional post-FX |
| Advanced Physics | Soft-body, cloth, fluid approximations |
| Scripting | Sandboxed Lua or custom DSL (no `eval`) |
| Cloud Replay | Upload + share replay files |
| Analytics | Per-session perf telemetry dashboard |

V3 will not begin until:

1. V2 benchmark scene passes all budget assertions
2. V2 replay determinism test is green
3. V2 is deployed and in active use
4. V2 has no open P0/P1 bugs

---

## Non-Goals (All Versions)

These will **not** be added to the DREAMengin engine at any version:

- Heavy post-processing by default (bloom, DOF, motion blur enabled in production)
- Always-on physics loop when scene is idle
- Arbitrary JavaScript `eval` for scripts
- Server-side physics simulation
- WebAssembly physics (unless performance data demands it)
- Replacing the auth/navigation layer with engine code

---

## Versioning Policy

| Tag | Meaning |
|-----|---------|
| `engine-v1.x.y` | Patches to frozen V1 (bug fixes only) |
| `engine-v2.x.y` | V2 feature releases |
| `engine-v3.x.y` | V3 feature releases |

Engine versions are independent of the product/app version tag.
