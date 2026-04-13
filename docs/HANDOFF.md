# DREAMengin Handoff

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


Last updated: 2026-04-01

## What changed in this alignment pass

This handoff reflects the **Deployment & Memory Audit** — ensuring all GitHub Actions
that handle document updates, memory syncing, and handoffs trigger on every push to
`completedream`, and aligning docs to the new Engine architecture.

### Primary outcome

- `github-actions.yml` (main CI/CD pipeline) now includes `completedream` in both
  `push` and `pull_request` branch triggers.
- `spec-engin-ai-agent.yml` (doc/code AI scanner) now includes `completedream` in its
  `push` branch triggers.
- All other document-update, memory-sync, and handoff workflows already covered
  `completedream` (`update-handoff.yml`, `update-readme.yml`, `update-bugs.yml`,
  `update-repo-state.yml`, `sync-build-memory.yml`, `check-build-memory-drift.yml`).
- `docs/ARCHITECTURE.md` gains **§12 Runtime Memory Architecture** — full documented
  spec for `SharedArrayBuffer` memory map (16 MB, entity SoA, HomeDream private region,
  DreamDM Bar seam slot) and `EnginDispatcher` singleton (worker pool, SAB allocation,
  zero-copy seam relay, µs/tick telemetry, bounds audit).
- `docs/AGENT_PLAYBOOK.md` Key File Map now lists `lib/runtime/memory.ts`,
  `lib/runtime/EnginDispatcher.ts`, and `lib/navigation/StructureLedger.ts`; tech-stack
  table includes the `SharedArrayBuffer` + shader `Worker` pool row with a pointer to
  the new ARCHITECTURE §12.

### Key files introduced in this architecture (already in repo, now documented)

| File | Role |
|------|------|
| `lib/runtime/memory.ts` | 16 MB SAB layout — entity SoA arrays, bar seam slot, HomeDream privacy boundary |
| `lib/runtime/EnginDispatcher.ts` | Singleton dispatcher — SAB lifecycle, worker pool, telemetry, BoogieMan audit |
| `public/workers/engin-shader.worker.ts` | Per-worker Atomics.wait / rAF tick loop |
| `tests/engin-dispatcher.test.ts` | Dispatcher lifecycle and bounds-enforcement unit tests |
| `tests/conform-memory-map.test.ts` | Memory map conformance tests |
| `lib/navigation/StructureLedger.ts` | Precomputed O(1) navigation state/transition ledger |

### What has NOT changed

The underlying `lib/runtime/` implementation was already in place. This pass only
ensures the documentation catches up to the existing code reality so agents and
developers find accurate orientation from the start of every session.

---



### Primary outcome

All docs, canonical name registry, and tests now use the OS-layer naming model:
- DREAMengin is a **DreamDM-Bar-led spatial operating environment**
- Surfaces (not pages), Dream Windows (not widgets), DreamSpace (not widget layer)
- Connection language: bind / mount / activate (not link widget / open page)
- Multi-surface, multi-engin connection network (not 1-to-1 pairs)

### Canonical names now documented first

**Product type:**
- DREAMengin Runtime Environment (DreamDM-Bar-led spatial operating environment)

**Runtime regions:**
- HomeDream Surface (root operating surface / underlying feed layer)
- DreamSpace (revealed secondary layer owned by the bar)
- DreamDM Bar / Runtime Seam (Persistent Interaction Rail / top-layer main attraction)

**Core surfaces:**
- HomeDream Surface
- Edit ProfileDream Surface
- View Profile Surface

**Daydream Surface Network:**
- Music Daydream Surface / StarMakerEngin
- Games Daydream Surface / GameEngin
- Lab Daydream Surface / LabEngin
- Code Daydream Surface / CodeEngin
- Brand Daydream Surface / BrandingEngin
- Create Daydream Surface / ContentEngin

**Platform modules:**
- DreamShop Surface
- DreamMarketplace Surface
- DreamMenu
- DreamDM Surface
- DreamAds Surface
- Dream Windows (modular runtime containers)

**AI triad:**
- Dr. Eams
- IDARi
- TheBoogieMan.Ai

## Current repo reality

- Canonical routes exist for `/homedream`, `/edit-profiledream`, and `/view-profile`.
- Legacy support routes still exist for `/home`, `/edit-profile`, `/profile`, and `/u/[handle]`.
- The public/shared profile destination in the current repo is still `/profile/[handle]`.
- The Dream Window layer already exists in `components/dreams/*` while legacy widget material still exists in `components/widgets/*`.
- Code-level naming (variable names, component names) may still use legacy "widget" terminology internally — these are residuals to be resolved progressively.

## Next repo steps

1. Continue renaming UI labels and internal docs toward OS-layer canonical names.
2. Progressively rename internal code references from "widget" to "Dream Window" where it adds clarity.
3. Tighten HomeDream Surface → Edit ProfileDream Surface → View Profile Surface projection boundaries in code.
4. Keep additions minimal and prefer moving or re-wiring what already exists.
5. Ensure all new Dream Window data structures carry the 10 required fields.

## Change Timeline

| # | Date / Time (UTC) | Revision | Branch | Author | Summary |
|---|---|---|---|---|---|
| **auto** | 2026-04-13 01:33 UTC | `a425758` | copilot/integrate-production-grade-telemetry | Copilot | ~1 modified<br>fix: namespace global event loop lag property to avoid conflicts — Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/be7c251e-c192-4a28-887e-e32602d777bd  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `lib/observability/otelBridge.ts` |
| **auto** | 2026-04-13 01:32 UTC | `30c71d3` | copilot/integrate-production-grade-telemetry | Copilot | +1 added  ~1 modified<br>fix: use connection() instead of dynamic export in /api/metrics, add docs/OBSERVABILITY.md — Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/be7c251e-c192-4a28-887e-e32602d777bd  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `docs/OBSERVABILITY.md`<br>✏️: `app/api/metrics/route.ts` |
| **auto** | 2026-04-13 01:27 UTC | `066ce92` | copilot/integrate-production-grade-telemetry | Copilot | +6 added  ~4 modified<br>feat: add OpenTelemetry SDK with Prometheus exporter, /api/metrics endpoint, remove observability UI from IDariPanel — - Install @opentelemetry/api, sdk-metrics, sdk-trace-node, exporter-prometheus, exporter-trace-otlp-http, resources, semantic-conventions - Create lib/observability/otel.ts - OTel SDK init with Prometheus exporter + optional OTLP trace exporter - Create lib/observability/otelBridge.ts - bridges collector events to OTel meters/spans - Create app/api/metrics/route.ts - Prometheus /metrics endpoint - Bridge collector.ts → OTel (forward collectMetric/collectLog/collectTrace to exporters) - Remove observability tab UI from IDariPanel (synthetic telemetry, visualizations) - Create prometheus/prometheus.yml - scrape config - Create grafana/datasources/prometheus.yml - auto-provision datasource - Create grafana/dashboards/default.yml - dashboard provisioning  Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/be7c251e-c192-4a28-887e-e32602d777bd  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `app/api/metrics/route.ts`, `grafana/dashboards/default.yml`, `grafana/datasources/prometheus.yml`, `lib/observability/otel.ts`, `lib/observability/otelBridge.ts`, `prometheus/prometheus.yml`<br>✏️: `components/IDariPanel.tsx`, `lib/observability/collector.ts`, `package.json`, `pnpm-lock.yaml` |
| **auto** | 2026-04-13 01:06 UTC | `d8cd00f` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #496 from appthemanger-ctrl/copilot/improve-game-engine-integration — feat: Game Console Runtime — Cartridge architecture for GameEngin<br> |
| **auto** | 2026-04-13 00:58 UTC | `0468f6e` | copilot/improve-game-engine-integration | Copilot | ~3 modified<br>fix: address code review feedback — named constants, pool docs, remove dead code — Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/cc8ee79e-21b8-4e23-b82b-aa2a9ab6d721  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `games/snake/SnakeCartridge.ts`, `games/tetris/TetrisCartridge.ts`, `lib/gameengin/GameRuntime.tsx` |

## What changed in this alignment pass

This handoff reflects the README-first documentation cleanup.

### Primary outcome
The docs now treat `README.md` as the authoritative full specification and use spec-first names across the implementation docs.

### Canonical names now documented first
- HomeDream
- EditProfileDream
- ViewProfile
- DayDreams
- Engins
- Dreams
- DreamShop
- DreamMarketplace
- DreamMenu
- DreamDM
- DreamDMBar
- DreamAds
- Dr. Eams
- iDARI
- TheBoogieMan.Ai

## Current repo reality

- Canonical routes exist for `/homedream`, `/edit-profiledream`, and `/view-profile`.
- Legacy support routes still exist for `/home`, `/edit-profile`, `/profile`, and `/u/[handle]`.
- The public/shared profile destination in the current repo is still `/profile/[handle]`.
- The Dreams layer already exists in `components/dreams/*` while legacy widget material still exists in `components/widgets/*`.

## Next repo steps

1. Keep renaming UI labels and internal docs toward spec names.
2. Continue repurposing legacy extras into the spec instead of preserving them as separate product names.
3. Tighten HomeDream → EditProfileDream → ViewProfile projection boundaries in code.
4. Keep additions minimal and prefer moving or re-wiring what already exists.

## Tracking doc

Use `docs/alignment/DOCS_CHANGE_TRACKER.md` as the ledger for this pass.

## Change Timeline

| # | Date / Time (UTC) | Revision | Branch | Author | Summary |
|---|---|---|---|---|---|
| **auto** | 2026-03-15 23:02 UTC | `c513b3f` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #216 from appthemanger-ctrl/copilot/clean-up-unused-resources — chore: strip all mock/demo/placeholder code — wire every surface to real data<br> |
| **auto** | 2026-03-15 22:00 UTC | `5017632` | copilot/clean-up-unused-resources | Copilot | +1 added  −6 deleted  ~9 modified<br>chore: remove all mock/demo/placeholder code - complete housekeeping — Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `app/daydream/game/GamePageClient.tsx`<br>✏️: `app/profile/[handle]/page.tsx`, `app/settings/safety/page.tsx`, `app/view-profile/page.tsx`, `backend/src/services/ipfsService.js`, `backend/src/services/livekitService.js`, `components/AnchorWidgetOrchestrator.tsx`, `components/dreamengin/NexusMenu.tsx`, `components/profile/ProfileWidgetGrid.tsx`, `validate-deployment.js`<br>🗑️: `components/AdvancedSearch.tsx`, `components/FloatingActionBubble.tsx`, `components/GestureNavigationDemo.tsx`, `components/MobileFloatingActionButton.tsx`, `lib/connectors/demo.ts`, `lib/navigation/mockWidgetData.ts` |
| **auto** | 2026-03-15 21:42 UTC | `6c4a89a` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #215 from appthemanger-ctrl/copilot/implement-daydreams-description-route — fix: full platform wiring audit — daydreams discoverable, all dead actions wired, all broken routes fixed<br> |
| **auto** | 2026-03-15 20:53 UTC | `3e821e0` | completedream | appthemanger-ctrl | −1 deleted<br>Delete daydream/game directory<br>🗑️: `daydream/game/GamePageClient_app.tsx` |
| **auto** | 2026-03-15 20:46 UTC | `e8e98a3` | completedream | appthemanger-ctrl | +1 added  −1 deleted<br>Add GamePageClient_app.tsx file<br>➕: `daydream/game/GamePageClient_app.tsx`<br>🗑️: `app/game/GamePageClient.tsx` |
