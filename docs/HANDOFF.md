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
| **auto** | 2026-04-14 10:33 UTC | `a4a97e9` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #523 from appthemanger-ctrl/copilot/update-readme-md-another-one — fix(readme): complete spec body — section numbering, truncated §33, missing §34 WASM+GPU VM, Babylon.js version drift<br> |
| **auto** | 2026-04-14 10:27 UTC | `5f2fc47` | copilot/update-readme-md-another-one | Copilot | ~2 modified<br>fix(readme): complete spec body — fix Babylon.js version, section numbering, truncated §33, add §34 WASM+GPU VM — Reasoning: README.md spec body had five concrete errors that made it inaccurate and incomplete: wrong Babylon.js version (8+ vs actual 9+), duplicate §30 numbering, a misplaced §31.3 subsection, a truncated §33 StarMakerEngin section, and no entry for the WASM+GPU VM (lib/vm/, 2,927 lines of production code).  Also improve update-readme.mjs to auto-sync Babylon.js major version from package.json on every push so this class of drift cannot recur. Architecture justification: docs/ARCHITECTURE.md and README.md are the authoritative spec; keeping them accurate is core to the Idari maintenance role (IDARI_CONTRACT.md §2). Performance impact: none.  Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/da2d50a3-96ff-47a0-8e66-a3cff480b320  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `README.md`, `scripts/update-readme.mjs` |
| **auto** | 2026-04-14 10:05 UTC | `8d03ba6` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #521 from appthemanger-ctrl/copilot/create-implementation-plan-for-upgrade — feat: DREAMengin 2026 full system upgrade — 9 streams, 29 files, 750 insertions<br> |
| **auto** | 2026-04-14 08:25 UTC | `85f1442` | copilot/create-implementation-plan-for-upgrade | Copilot | +5 added  ~24 modified<br>feat: 2026 full system upgrade — all 9 streams implemented — Stream 2 (TODOs): - platform/route.ts: implement creation_to_consumption_ratio, outside_activity_rate, harmful_content_rate - StarMakerEngin.tsx: wire audio upload to Supabase Storage ledger path with real URL - drEamsCodeAssist.ts: add getCodeAssistCompletion() calling Dr. Eams CODE_ASSIST intent - snapshot.ts: track bind groups, serialize/deserialize quotas, real GPU buffer copy via staging buffer - wasmGpuVM.ts: parse WASM memory bindings to create real GPUBindGroup; read dynamic offsets from WASM linear memory  Stream 1 (Phase 9 wiring): - ActivityProfile mounted in /view-profile and /profile/[handle] with Suspense - SkipCreditBalance mounted in DreamDMBar nav row - AdUnit inserted after every 5th post in HomeFeed - ActivityPostForm wired into ContentEngin post creation - PlatformHealth admin surface at /admin/platform-health (IDARi-guarded) - Feed default sort changed to 'activity' (visibility_score ranking)  Stream 3 (React 19): reactCompiler: true in next.config.mjs; useOptimistic for DM sends in DreamDMBar Stream 4 (WebGPU): lib/ai/tfBackend.ts — TF.js WebGPU backend with CPU/WebGL fallback Stream 5 (native APIs): View Transitions CSS; CSS Container Queries for DreamShell; OPFS persistence with localStorage fallback; Popover API for DreamRadialMenu Stream 6 (PWA): public/manifest.webmanifest — standalone display, gold theme color #c9a227 Stream 7 (security): CSP Level 3 + X-Frame-Options + X-Content-Type-Options + Referrer-Policy + Permissions-Policy headers; BoogieMan bot detection + hourly per-user dedup in /api/views/track Stream 8 (perf): AVIF/WebP image formats; dynamic import() for GameEngin/LabEngin/StarMakerEngin; isPickable=false on static MadMaxi meshes Stream 9 (DX): incremental TS builds + tsBuildInfoFile; strict:true in tsconfig.games.json + tsconfig.gamesengin.json  Architecture justification: ARCHITECTURE.md §10 (build/runtime assumptions, render-on-demand), LAW.md §10 (repurpose before invent), AXIOMS.md §3 (intuitive interactions), SECURITY.md (privacy by design) Performance impact: better — GPU compute for TF.js, OPFS over localStorage, native CSS transitions, AVIF images, dynamic code splitting, frozen static meshes"  Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/f6725bf6-a5bf-4259-8d34-d573055e19c0  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `app/admin/platform-health/page.tsx`, `lib/ai/tfBackend.ts`, `public/manifest.webmanifest`, `styles/dream-shell.css`, `styles/view-transitions.css`<br>✏️: `app/api/feed/route.ts`, `app/api/metrics/platform/route.ts`, `app/api/views/track/route.ts`, `app/daydream/games/page.tsx`, `app/daydream/lab/page.tsx`, `app/daydream/music/page.tsx`, `app/layout.tsx`, `app/profile/[handle]/page.tsx`, `app/view-profile/page.tsx`, `components/DreamDMBar.tsx`, `components/HomeFeed.tsx`, `components/daydream/ContentEngin.tsx` … +12 more |
| **auto** | 2026-04-14 07:19 UTC | `d6e42de` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #519 from appthemanger-ctrl/copilot/code-only-request — docs: rewrite dreamengin_phase2.md as Phase 9 Activity-First Protocol integration plan<br> |

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
