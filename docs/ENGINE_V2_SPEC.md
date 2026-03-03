# DREAMengin — Engine V2 Specification

**Version:** 2.0  
**Status:** Active  
**Owner:** appthemanger-ctrl  
**Last updated:** 2026-03-03

---

## 1. V2 Purpose and Scope

This document defines the goals, budgets, pillars, and constraints for DREAMengin EngineCore v2. It is the authoritative reference for V2 decisions. If a proposed change conflicts with this document, the document wins — or this document must be updated through a deliberate decision.

### 1.1 V1 Baseline ("EngineCore v1")

EngineCore v1 is hereby frozen as the reference point for V2 development. V1 capabilities:

- Deterministic fixed-step simulation
- Uniform-grid broadphase
- Narrowphase collision detection
- Sequential-impulse constraint solver
- Babylon.js adapter layer
- Battery-aware rendering (render-on-demand, idle freeze)
- Sprite animator (`DrEamsAnimator`) with interaction zones
- Damped-spring gesture physics for navigation

V1 source files (frozen): `components/dreamengin/engine/`, `lib/dreamengin/`, `lib/navigation/physics.ts`.

### 1.2 V2 Success Definition

V2 is successful when — without increasing baseline battery drain — it delivers:

1. **Richer interactions**: contact manifold persistence, trigger volumes, state machines per entity
2. **Better physics stability**: improved stacking, fast-mover handling, constraint compliance
3. **Better tooling**: replay framework, determinism checks, perf HUD, event log
4. **Stronger determinism**: identical StateHash across replays of the same scenario

---

## 2. V2 Pillars

| # | Pillar | Meaning |
|---|--------|---------|
| A | Determinism & Replay | Every simulation tick is reproducible; bugs are replayable |
| B | Performance Budgets | Explicit CPU/memory/contact caps with graceful degradation |
| C | Content Pipeline | Prefabs, manifests, hot-reload for rapid iteration |
| D | Interaction Richness | State machines, abilities, triggers, tag queries |

---

## 3. Hard Performance Budgets

| Resource | Budget | Notes |
|----------|--------|-------|
| Frame CPU (physics) | ≤ 4 ms | Per fixed step at 60 fps |
| Frame CPU (render) | ≤ 8 ms | Includes scene graph traversal |
| Memory cap | ≤ 256 MB | Total JS heap |
| Max entities | 1 000 | Active entities per scene |
| Max contacts per frame | 500 | After broadphase filtering |
| Max solver iterations | 10 | Per fixed step |
| Max concurrent audio | 16 | Active audio sources |
| Max rays/overlaps per frame | 64 | Spatial query budget |

---

## 4. Degradation Rules

When a budget is exceeded, the engine degrades in ordered steps — never crashes or glitches:

1. Reduce solver iterations (10 → 6 → 3)
2. Reduce fixed-step frequency (60 Hz → 30 Hz)
3. Reduce render scale (1.0 → 0.75 → 0.5)
4. Sleep distant/off-screen islands aggressively
5. Drop non-critical audio sources (furthest/quietest first)
6. Reduce LOD for far objects
7. Disable non-essential post-effects

Degradation events must be logged to the engine event ring buffer.

---

## 5. No Always-On Loops

Idle freeze is a **core feature** of V2, not an optimization:

- When no entities are active and no input is pending, the physics loop halts completely.
- The render loop only fires when state changes (render-on-demand).
- Audio virtualisation stops inaudible sources.
- The "heat score" metric tracks CPU activity; it must trend to zero at idle.

---

## 6. The "Decoder" Metaphor

The engine uses a decoder-style processing pipeline:

1. **Shortlist** — broadphase produces candidate pairs (cheap)
2. **Residual** — prioritize cached/recently-colliding pairs (temporal coherence)
3. **Solve** — narrowphase + solver on the shortlist
4. **Reconstruct** — integrate positions and update render transforms

This metaphor must be preserved in V2 broadphase/solver design.

---

## 7. Non-Goals for V2

The following are explicitly **out of scope** for V2:

- Heavy post-processing effects by default (bloom, DOF, motion blur)
- Always-on physics loop when scene is idle
- Multiplayer / networked simulation (planned for V3)
- Full scene editor / GUI tools (planned for V3)
- Deep refactors of V1 navigation or auth layers
- Server-side physics simulation
- Arbitrary JavaScript `eval` in script hooks
- WebAssembly physics engine (may revisit in V3)
- Full WASM audio DSP pipeline

---

## 8. Instrumentation Requirements (Phase 1)

The engine must expose the following metrics via the `EngineInstrumentation` interface:

- Per-system timers: `physicsMs`, `inputMs`, `renderMs`, `gcPressure`
- Rolling heat score (CPU time + draw calls + memory churn)
- Substep counter (fixed steps per rendered frame)
- Contact count and solver iteration count
- Entity counts per component type
- Ring-buffer event log (capacity: 256 entries)
- Perf HUD overlay (toggled by `debugFlags.showPerfHUD`)
- Budget breach log entries

---

## 9. Determinism Requirements (Phase 2)

- All simulation inputs use tick-indexed timestamps (not wall-clock)
- `StateHash` is computed each tick over key position/velocity arrays
- Replay system: saves seed + inputs + initial state; plays back headless
- Two replays of the same scenario must produce identical `StateHash` sequences
- Floating-point discipline: clamp extremes, avoid branching on tiny epsilons (< 1e-10)
- Stable pair ordering: pairs always sorted by `(minId, maxId)`
- Stable contact sorting: deterministic ordering within a manifold

---

## 10. Physics Requirements (Phase 3)

- Default solver: sequential impulse (unchanged from V1)
- Optional XPBD solver: selectable per-scene via `PhysicsMode.XPBD`
- Constraint compliance (softness) parameter on all joints
- Baumgarte / position-correction tuning presets: `mobile-safe`, `default`, `accurate`
- Island-based sleeping (sleep groups, not per-body only)
- Continuous collision for fast movers (`ccd: true` flag per body)
- Contact manifold persistence: 2–4 contact points per pair
- Friction mixing: `sqrt(a * b)` rule
- Restitution mixing: `max(a, b)` rule
- Penetration clamp: max 0.5 units per step to prevent tunneling from dt spikes

---

## 11. Broadphase Requirements (Phase 4)

- Uniform grid with dynamic cell sizing per scene (based on median collider size)
- Pair cache with LRU eviction (capacity: 2 × max contacts)
- Broadphase residual scoring: cached + recently-colliding pairs prioritized
- AABB fattening (speculative contacts): `fattenFactor = 0.05`
- Optional sweep-and-prune for mostly-1D scenes (side scrollers)
- Collision layer matrix: bitmask × bitmask, O(1) filtering
- Active-region culling: skip sleeping islands far from any active body
- Spatial query API: `nearest`, `overlap`, `raycast`
- Query budget: cap 64 queries/frame; overflow queued

---

## 12. Gameplay Layer Requirements (Phase 5)

- Lightweight per-entity state machine: `idle | move | interact | stunned | custom`
- `IntentComponent`: separates input intent from physics velocity
- Ability system: actions with cooldown, cost, animation hooks
- Event bus (ring buffer, 512 entries): collision enter/stay/exit events
- Trigger volumes: no physics response, pure event emission
- Tag queries: `findAllWithTagInRadius(tag, center, radius)`
- Health/damage components (optional, no UI assumptions)
- Deterministic RNG per system (seeded `mulberry32` streams)

---

## 13. Render Requirements (Phase 6)

- GPU instancing for repeated meshes (Babylon.js thin instances)
- LOD rules: far objects downgrade mesh or hide
- Freeze static meshes when body is sleeping
- Dynamic resolution scaler: `renderScale` tied to heat score
- Interaction burst mode: raise quality for 1–2 s on touch input, then fall back
- Distance + frustum culling (occlusion-lite)
- Sprite/2D overlay pipeline independent of main canvas redraw
- Render-on-demand: fire only on state changes when idle
- Visual preset system: `Minimal | Balanced | Premium`

---

## 14. Asset Pipeline Requirements (Phase 7)

- Content manifest format (JSON): meshes, textures, audio, prefabs
- Asset loader: caching + reference counting
- Lazy loading for non-critical assets; block only on essentials
- Prefab system: entity templates with components and render bindings
- Build-time validation: missing assets, mismatched types, broken refs
- Hot-reload for prefabs in dev mode
- Sprite sheet metadata: frame size, rows/cols, animation states
- Content version tag for reliable cache invalidation
- Starter pack manifest included in repository

---

## 15. Audio Requirements (Phase 8)

- Audio mixer: music, SFX, UI channels with per-channel volume
- Ducking: reduce music volume when important SFX plays
- Haptic hooks: respect `prefers-reduced-motion`
- Impact sounds driven by collision impulse magnitude (capped)
- Footstep/hover loops driven by state machine, not frame counter
- Silence by default until user enables audio
- Audio preload scoped to current scene only
- Audio virtualisation: don't play inaudible sources
- Sound budget: max 16 concurrent sources

---

## 16. Engine Safety Requirements (Phase 9)

- Runtime NaN guards and bounds guards in dev mode
- Panic mode: if physics emits NaN, freeze simulation, surface recovery UI
- Safe fallback for missing assets (placeholder mesh/texture)
- GC guardrails: no per-frame allocations in hot loops
- Scene-loader timeout: 10 s maximum; surface error on breach
- Minimal end-to-end test: load scene, run 10 s headless, verify no NaNs + stable hash
- Mobile sanity preset: lower budgets verified on simulated low-end device

---

## 17. Definition of "Done" for V2

A V2 feature is done when:

- It satisfies all V2 pillars (A–D)
- It does not exceed declared budgets under normal load
- It degrades gracefully when budgets are exceeded
- It does not increase idle battery drain vs. V1 baseline
- It has at least one unit test exercising its core path
- It is documented in this spec or a linked doc
