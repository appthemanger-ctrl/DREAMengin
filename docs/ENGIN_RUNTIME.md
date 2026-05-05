# Universal Engin Runtime

**Architecture:** One fixed engine, swappable rule-sets.

## Concept

Every DREAMengin "Engin" (GameEngin, StarMakerEngin, CodeEngin, …) runs on the same `EnginRuntime`. The runtime never changes — it provides:

| Layer | Responsibility |
|---|---|
| **Base State** | Immutable state record owned by the engine. |
| **Event Bus** | Scoped, client-safe pub/sub for internal events. |
| **I/O Adapter** | Pluggable persistence (localStorage default, Memory for tests). |
| **Capability Map** | Security gate: every action is checked before execution. |
| **Rule-Set** | *Swappable* — the only place domain logic lives. |

## File Structure

```
lib/engin-runtime/
├── EnginBaseState.ts        Base state model + helpers
├── EnginEventBus.ts         Client-safe event bus abstraction
├── EnginIOAdapter.ts        I/O layer (LocalStorageAdapter, MemoryAdapter)
├── EnginCapabilities.ts     Capability map + gateCapability()
├── EnginRuleSetContract.ts  EnginRuleSetContract<A> interface
├── EnginRuntime.ts          The universal runtime (never changes)
└── index.ts                 Barrel export + createEnginRuntime() factory

lib/engins/
└── game/
    ├── gameEnginRuleSet.ts  GameEngin rule-set (domain logic only)
    ├── useGameEnginRuntime.ts  React hook for GameEngin
    └── index.ts             Barrel export
```

## The Rule-Set Contract

A rule-set implements `EnginRuleSetContract<A>` where `A` is the union of all actions it handles:

```ts
interface EnginRuleSetContract<A extends EnginAction> {
  // Static configuration (layout mode, accent color, etc.)
  readonly params: EnginRuleSetParams;

  // Capabilities required — engine warns if not granted
  readonly requiredCapabilities: ReadonlyArray<EnginCapability>;

  // Pure validation functions — run before every transform
  readonly constraints: ReadonlyArray<EnginConstraint<A>>;

  // Pure state transform: (state, action) → nextState
  transform(state: EnginBaseState, action: A): EnginBaseState;

  // Project base state → domain-specific UI shape
  deriveState(state: EnginBaseState): Record<string, unknown>;
}
```

**Rule-sets contain ZERO infrastructure.** No fetch, no Supabase imports, no localStorage. All of that is handled by the runtime.

## Dispatch Pipeline

When you call `runtime.dispatch(action)`, the engine:

1. **Capability gate** — checks `action.__capability` against the active capability map; denies if not granted.
2. **Constraints** — runs every rule-set constraint; rejects if any returns `{ valid: false }`.
3. **Transform** — calls `ruleSet.transform(state, action)` and replaces internal state.
4. **Bus emit** — emits `engin:state` on the scoped event bus.
5. **Persist** — asynchronously saves `state.domain` via the I/O adapter (fire-and-forget).

## Adding a New Engin Rule-Set

1. Create `lib/engins/<name>/<name>RuleSet.ts` implementing `EnginRuleSetContract`.
2. Define the `Actions` discriminated union.
3. Implement `params`, `requiredCapabilities`, `constraints`, `transform`, and `deriveState`.
4. Create `lib/engins/<name>/use<Name>EnginRuntime.ts` hook (see `useGameEnginRuntime.ts`).
5. Import the hook in your Engin component and replace bespoke state with engine state.
6. Add tests in `tests/<name>-engin-ruleset.test.ts`.

**No changes to `EnginRuntime.ts` are ever required.** The runtime is intentionally fixed.

## GameEngin Example

```ts
import { useGameEnginRuntime } from '@/lib/engins/game/useGameEnginRuntime';

function MyGameEnginComponent() {
  const { state, dispatch } = useGameEnginRuntime();

  // Read domain state
  const { scores, activeGame, selectedGame, physicsConfig } = state;

  // Dispatch actions
  function startGame(gameId: string) {
    dispatch({ type: 'game:session-start', payload: { gameId } });
  }

  function endSession(gameId: string) {
    dispatch({ type: 'game:session-end', payload: { gameId } });
  }

  function loadScores(scores: GameScore[]) {
    dispatch({ type: 'game:scores-loaded', payload: { scores } });
  }
  // ...
}
```

## Capabilities Reference

| Capability | Granted by Default | Description |
|---|---|---|
| `state:read` | ✓ | Read engine state |
| `state:write` | ✓ | Mutate engine state |
| `persistence:local` | ✓ | localStorage persistence |
| `persistence:remote` | ✗ | Supabase/server persistence |
| `session:start` | ✓ | Start an Engin session |
| `session:end` | ✓ | End an Engin session |
| `scores:read` | ✓ | Read scores |
| `scores:publish` | ✓ | Publish to leaderboard |
| `world:edit` | ✓ | Edit World Builder |
| `scripts:edit` | ✗ | Edit scripts (premium) |
| `co-op:enable` | ✗ | Enable co-op (premium) |

Override defaults by passing a custom capability map to `createEnginRuntime(ruleSet, { capabilities: myMap })`.

## Tests

```bash
pnpm test tests/engin-runtime-core.test.ts
pnpm test tests/game-engin-ruleset.test.ts
```
