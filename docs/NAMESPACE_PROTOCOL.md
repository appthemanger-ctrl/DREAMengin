# Namespace & Repository Protocol

> **Status:** Active  
> **Version:** 1.0.0  
> **Owner:** DREAMengin Architecture  
> **Enforcement:** `tests/namespace-isolation.test.ts` (vitest)

---

## Overview

The Namespace & Repository Protocol defines the physical directory structure and dependency isolation law for the DREAMengin codebase. It establishes three immutable namespaces — `engin.*`, `dream.*`, and `dreamsurface.*` — with strict dependency rules enforced by automated tests.

---

## Directory Map

```
src/
├── engin/
│   ├── core/
│   │   ├── index.ts              ← barrel export
│   │   ├── engin.ledger.ts       ← dreamspace ledger
│   │   ├── engin.eventbus.ts     ← typed pub/sub event bus
│   │   ├── engin.renderloop.ts   ← rendering loop controller
│   │   └── engin.auth.ts         ← security/auth module
│   └── state/
│       └── base.json             ← Genesis State (immutable)
├── dream/
│   └── rulesets/
│       └── homedream/
│           ├── index.ts                        ← barrel export
│           ├── dream.homedream.constants.ts    ← physics constants
│           ├── dream.homedream.transforms.ts   ← state transforms
│           └── dream.homedream.physics.ts      ← physics constraints
└── dreamsurface/
    ├── index.ts                    ← barrel export
    ├── dreamsurface.bridge.ts      ← cross-namespace bridge
    └── dreamsurface.delta.ts       ← delta computation utilities
```

---

## The Five Rules

### Rule 1 — `engin.*` Core Namespace (Immutable)

- **Canonical path:** `src/engin/core/`
- **Responsibility:** Manages the dreamspace ledger, event-bus synchronization, security/auth, and the primary rendering loop.
- **Constraint:** No game-specific logic. No `dream.*` logic. No `dreamsurface.*` calls. This namespace is immutable infrastructure.
- **Barrel:** `src/engin/core/index.ts`

### Rule 2 — `dream.*` Rule-Set Namespace (Mutable)

- **Canonical path:** `src/dream/rulesets/[game_id]/`
- **Responsibility:** All unique gameplay behaviors, physics constraints, and procedural generation parameters. Files contain **only** transformations, constants, and logic definitions.
- **Constraint:** **FORBIDDEN** — any direct import of `engin.core.*`. All communication to engin infrastructure MUST go through `dreamsurface`.
- **Active game_id:** `homedream` (HomeDream Surface)
- **Barrel per game:** `src/dream/rulesets/homedream/index.ts`

### Rule 3 — `dreamsurface.*` Interface Namespace (Stable Bridge)

- **Canonical path:** `src/dreamsurface/`
- **Responsibility:** Applies Rule-Set deltas to Base State. The only legal API that `dream.*` may use to communicate with `engin.core.*`. When a `dream.*` ruleset is swapped, `engin.core.*` remains stable.
- **Barrel:** `src/dreamsurface/index.ts`

### Rule 4 — State Serialization / Base State

- **Canonical path:** `src/engin/state/base.json`
- **Responsibility:** The immutable Genesis State. Every game session initializes from this base. The engin.core calculates each frame by applying the active `dream.*` ruleset delta to this base.
- **Required fields:** `version`, `namespace`, `genesis: true`, `worlds`, `session`, `ledger`

### Rule 5 — Dependency Isolation Gate (Enforced by Test)

- **Test location:** `tests/namespace-isolation.test.ts`
- **Enforcement:**
  1. No file under `src/dream/` may import directly from `src/engin/core` (by any path — relative, alias `@/engin/core`, etc.)
  2. Any `dream.*` → engin communication MUST go through `src/dreamsurface`
  3. No file under `src/engin/core/` may import from `src/dream/` directly
  4. `engin.core` is blind to all rulesets
- **Test framework:** vitest

---

## Implementation Mapping Table

| Namespace | Canonical Path | Responsibility | Modifiability | Can Import From |
|---|---|---|---|---|
| `engin.*` | `src/engin/core/` | Universal physics, rendering, I/O, auth | Fixed (Immutable) | Nothing in `src/dream/` or `src/dreamsurface/` |
| `dream.*` | `src/dream/rulesets/[game_id]/` | Game rules, logic, physics parameters | Swappable (Mutable) | Only `src/dreamsurface/` for engin access; internal dream files ok |
| `dreamsurface.*` | `src/dreamsurface/` | Delta application & bridge | Stable (Interface) | Both `src/engin/core/` and `src/dream/` |

---

## Module Reference

### `src/engin/core/engin.ledger.ts`

Tracks active game sessions, frame indices, and delta history.

- `LedgerEntry` — `{ timestamp, eventType, payload }`
- `DreamLedger` — `{ entries, syncClock }`
- `createLedger()` — creates an empty ledger
- `appendEntry(ledger, entry)` — returns new ledger with entry appended (immutable)

### `src/engin/core/engin.eventbus.ts`

Typed pub/sub event bus. All events must originate from `'dreamsurface'` namespace.

- `EnginEvent` — `{ type, payload, sourceNamespace: 'dreamsurface' }`
- `EventBus` — `{ subscribe(type, handler): unsub, publish(event): void }`
- `createEventBus()` — creates a new in-memory event bus

### `src/engin/core/engin.renderloop.ts`

Frame scheduling and rendering loop lifecycle management.

- `RenderFrame` — `{ index, deltaMs, timestamp }`
- `RenderLoop` — `{ start(), stop(), onFrame(cb): unsub }`
- `createRenderLoop()` — creates a new render loop (uses `requestAnimationFrame`)

### `src/engin/core/engin.auth.ts`

Session management and validation.

- `EnginSession` — `{ userId, dreamToken, authenticated }`
- `createSession(userId?, dreamToken?)` — creates a session
- `validateSession(session)` — returns `true` if authenticated and tokens are non-empty

### `src/engin/state/base.json`

Genesis State. Parsed at session start. Never mutated at runtime.

### `src/dream/rulesets/homedream/dream.homedream.constants.ts`

Physics constants for the HomeDream Surface game.

- `HOMEDREAM_GRAVITY = 0`
- `HOMEDREAM_MAX_ENTITIES = 64`
- `HOMEDREAM_FRAME_BUDGET_MS = 16.67`
- `HOMEDREAM_WORLD_ID = 'HomeDream Surface'`

### `src/dream/rulesets/homedream/dream.homedream.transforms.ts`

Pure state transformation functions. No side effects.

- `HomeDreamState` — `{ entities, frameIndex, worldId }`
- `EntityState` — `{ id, type, props }`
- `applyDelta(state, delta)` — returns new state with delta applied
- `createInitialState()` — returns the initial HomeDream state

### `src/dream/rulesets/homedream/dream.homedream.physics.ts`

Physics constraint definitions for HomeDream entities.

- `PhysicsConstraint` — `{ entityType, maxVelocity, collisionEnabled }`
- `HOMEDREAM_PHYSICS_CONSTRAINTS` — array of per-type constraints
- `resolveConstraint(entityType)` — returns constraint for entity type (with default fallback)

### `src/dreamsurface/dreamsurface.bridge.ts`

The **only** legal communication path from `dream.*` to `engin.core.*`.

- `DreamSurfaceBridge` — `{ applyRulesetDelta(...), swapRuleset(...) }`
- `createBridge()` — creates a new bridge instance

### `src/dreamsurface/dreamsurface.delta.ts`

Delta computation utilities used by the bridge.

- `StateDelta<T>` — `{ previous, next, changedKeys }`
- `computeDelta(prev, next)` — computes the changed keys between two states
- `mergeDelta(base, delta)` — shallow merge of base and partial delta

---

## Dependency Flow

```
dream.rulesets.homedream
        │
        │  (via dreamsurface only)
        ▼
dreamsurface.bridge ──────────────────► engin.core.ledger
dreamsurface.bridge ──────────────────► engin.core.eventbus
dreamsurface.delta  (internal utility)

engin.core ◄── (never imports from dream.* or dreamsurface.*)
```

---

## Adding a New Ruleset

1. Create `src/dream/rulesets/[game_id]/` directory
2. Add `[game_id].constants.ts`, `[game_id].transforms.ts`, `[game_id].physics.ts`
3. Add `index.ts` barrel export
4. **Do not** import from `src/engin/core/` — use `src/dreamsurface/` instead
5. Update `src/engin/state/base.json` to register the new world
6. The namespace isolation test will automatically scan and enforce Rule 5
