# Engin Workflows

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-12


**Document type:** Implementation spec  
**Scope:** Unified workflow model for all 6 Engin runtimes  
**Status:** Active — first implementation slice in `lib/engins/workflowEngine.ts`  
**Authority:** Anchored to `docs/CONSTITUTION.md`, `docs/ARCHITECTURE.md §1`, `docs/GENERATION_LAW.md`

---

## 1. What an Engin Workflow Is

An **Engin Workflow** is a named, multi-stage creative task that lives inside one of the six Engin runtimes (StarMakerEngin, GameEngin, LabEngin, CodeEngin, BrandingEngin, ContentEngin).

A workflow is not a session, a view, or a route. It is a unit of creative work that:

- Has a canonical name (e.g. "Beat Composition", "Code Sprint", "Lab Experiment")
- Passes through ordered stages: `draft → active → review → export`
- Can be paused and resumed across sessions via persisted state
- Can be handed off to a sibling Engin via a named cross-Engin connection path
- Emits Journey Trail dots at milestone transitions (first activation, first export, first handoff)
- Is tracked in the Forge as a creative transfer event on handoff

A workflow is **not** a UI widget. It is a state object with a lifecycle. The UI renders from that state — the state is not derived from the UI.

---

## 2. Workflow Stage Model

Every workflow moves forward (never backward) through four canonical stages:

```
draft → active → review → export
```

| Stage | What happens here |
|-------|-------------------|
| `draft` | Workflow is created, named, and configured. No real work product yet. |
| `active` | The main creative phase — user is doing work inside the Engin. |
| `review` | The user inspects output, iterates, and decides whether to export or return to active. |
| `export` | Final output is produced — saved to DB, emitted on bridge, or handed off cross-Engin. |

Rules:
- A workflow may be **paused** in any stage. Pause does not change the stage.
- A workflow moves from `review` back to `active` at most once per workflow (re-active flag).
- A workflow in `export` may trigger a cross-Engin handoff event, but the handoff does not change the workflow stage — the workflow is complete at `export`.
- A workflow may be **abandoned** from any stage. Abandonment is final (no undo).

---

## 3. Workflow Catalog — Per Engin

Each Engin defines exactly one **default workflow** and may define optional named workflows.

### 3.1 StarMakerEngin (Music Daydream)

| Workflow ID | Name | Handoff Target(s) |
|-------------|------|-------------------|
| `music:beat-composition` | Beat Composition | ContentEngin (background audio), BrandingEngin (brand audio brief) |
| `music:release` | Track Release | ContentEngin (promo content) |

### 3.2 GameEngin (Games Daydream)

| Workflow ID | Name | Handoff Target(s) |
|-------------|------|-------------------|
| `games:world-build` | World Build | CodeEngin (world script), LabEngin (physics config) |
| `games:score-session` | Score Session | ContentEngin (gameplay clip) |

### 3.3 LabEngin (Lab Daydream)

| Workflow ID | Name | Handoff Target(s) |
|-------------|------|-------------------|
| `lab:experiment` | Lab Experiment | CodeEngin (dataset analysis), ContentEngin (research to content) |
| `lab:simulation` | Simulation Run | GameEngin (physics export), CodeEngin (result data) |

### 3.4 CodeEngin (Code Daydream)

| Workflow ID | Name | Handoff Target(s) |
|-------------|------|-------------------|
| `code:sprint` | Code Sprint | GameEngin (module inject), LabEngin (analysis script) |
| `code:review` | Code Review | ContentEngin (change summary) |

### 3.5 BrandingEngin (Brand Daydream)

| Workflow ID | Name | Handoff Target(s) |
|-------------|------|-------------------|
| `brand:campaign` | Campaign | ContentEngin (content calendar), StarMakerEngin (audio brief) |
| `brand:ab-test` | A/B Test | ContentEngin (variant content) |

### 3.6 ContentEngin (Create Daydream)

| Workflow ID | Name | Handoff Target(s) |
|-------------|------|-------------------|
| `create:draft` | Content Draft | BrandingEngin (brand check), StarMakerEngin (audio request) |
| `create:publish-queue` | Publish Queue | BrandingEngin (audience analytics) |

---

## 4. Cross-Engin Handoff Paths

There are 11 named cross-Engin connection paths. Each path has a canonical bridge event name.

| # | From | To | Bridge Event |
|---|------|----|--------------|
| 1 | StarMakerEngin | ContentEngin | `music:stem-ready` |
| 2 | StarMakerEngin | BrandingEngin | `music:brand-audio-brief` |
| 3 | GameEngin | CodeEngin | `games:script-export` |
| 4 | GameEngin | ContentEngin | `games:gameplay-clip` |
| 5 | GameEngin | LabEngin | `games:physics-export` |
| 6 | LabEngin | CodeEngin | `lab:dataset-export` |
| 7 | LabEngin | ContentEngin | `lab:research-export` |
| 8 | CodeEngin | GameEngin | `code:module-inject` |
| 9 | ContentEngin | BrandingEngin | `create:brand-check` |
| 10 | BrandingEngin | ContentEngin | `brand:campaign-draft` |
| 11 | BrandingEngin | StarMakerEngin | `brand:audio-brief` |

Handoff rules:
- A handoff may only be emitted from a workflow in `export` stage.
- A handoff crosses exactly one connection path; it does not broadcast to all Engins.
- The receiving Engin may use the event payload to pre-populate a new workflow in `draft` stage — but does not automatically advance it.
- Handoffs are fire-and-forget from the sender; the sender does not wait for acknowledgement.

---

## 5. Persistence Contract

Workflow state is persisted at two layers:

1. **localStorage** (primary, client-only): `engin_workflow:<userId>:<workflowId>` key. This guarantees restore across page loads with zero network latency.
2. **Supabase** (secondary, server-authoritative): `engin_workflows` table (migration TBD). Written on stage transition and on export. Used for cross-device restore and server analytics.

The client always reads from localStorage first. On mount, if the server record is newer than the local record (by `updated_at`), the server wins.

When Supabase is unavailable, localStorage-only mode is silently active — the user loses nothing.

---

## 6. Journey Trail Integration

Workflow stage transitions emit Journey Trail dots at these milestone points:

| Milestone | Kind | Significance |
|-----------|------|--------------|
| First `draft → active` on any Engin | `workflow_first_activation` | 1.0 |
| First `review → export` on any Engin | `workflow_first_export` | 0.9 |
| First cross-Engin handoff sent | `workflow_first_handoff` | 1.0 |
| `export` completed on a specific Engin | `workflow_engin_export` | 0.7 |

All Journey Trail writes follow the `logJourneyDot` fire-and-forget contract: they must never throw or affect user experience.

---

## 7. Implementation Files

| File | Purpose |
|------|---------|
| `lib/engins/workflowEngine.ts` | Pure types and functions: `EnginWorkflow`, `createWorkflow`, `advanceStage`, `canHandoff`, `WORKFLOW_CATALOG` |
| `lib/engins/useEnginWorkflow.ts` | React hook: `useEnginWorkflow(enginId)` — manages one workflow instance, persists to localStorage, emits bridge events on handoff |
| `tests/engin-workflow.test.ts` | Vitest unit tests for the pure engine layer |

The hook layer (`useEnginWorkflow`) is the only I/O layer. The pure engine (`workflowEngine.ts`) has no imports from React, Supabase, or the bridge — it is test-safe.

---

## 8. Spec Constraints

- Workflows must not auto-advance. Every stage transition requires explicit user action.
- Workflows must not auto-publish content. The `export` stage produces a local artifact; publication is a separate user action.
- Workflow IDs are namespaced: `<enginId>:<slug>` (e.g. `music:beat-composition`). No two workflows share an ID.
- Abandoned workflows are soft-deleted (flagged `abandoned: true`) and excluded from all active queries. They are never hard-deleted from localStorage or DB.
- Cross-Engin handoff payloads carry only primitive data (IDs, labels, short strings). No raw content crosses Engin boundaries (AXIOM 4).

---

## 9. Generation Law Pre-Pass

```
PRE-PASS CHECKLIST
[x] χ computed — mode: conform (χ ≈ 5.5)
[x] allowed next output computed — scope fits within limit
[x] No unresolved residuals from previous passes
[x] CONSTITUTION.md acceptance checklist reviewed
[x] Targeted section: §7 implementation files only (workflowEngine + hook + tests)
```

Each implementation file is a separate pass target. Do not attempt all three in one pass without re-computing χ.
