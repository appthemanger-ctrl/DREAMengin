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
| **auto** | 2026-04-15 05:07 UTC | `68511e7` | copilot/request-engine-codes | Copilot | ~1 modified<br>fix(next.config): remove reactCompiler flag — babel-plugin-react-compiler not installed — Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/2807f00f-1194-4c56-a5b7-558c2c9b2196  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `next.config.mjs` |
| **auto** | 2026-04-15 02:41 UTC | `9c46f68` | copilot/request-engine-codes | Copilot | ~1 modified<br>feat(dreamdmbar): single-tap menus, fix minimize preserve split ratio — Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/11a4a8e4-7c9e-4275-a602-31f902c8ea3b  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `dreamdmbar/DreamDMBar.tsx` |
| **auto** | 2026-04-15 01:03 UTC | `d0982bf` | copilot/request-engine-codes | Copilot | +99 added  −100 deleted<br>refactor: rename all-engines→DREAMENGINOS, move engines into modules/, delete ALL_ENGINES.txt — Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/c7a466b6-0403-4eb1-b034-1001a761f91d  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `exports/DREAMENGINOS/DREAMenginOS/app/dreamengin/DreamenginClient.tsx`, `exports/DREAMENGINOS/DREAMenginOS/components/dreamengin/CrossEnginStatusPanel.tsx`, `exports/DREAMENGINOS/DREAMenginOS/components/dreamengin/DREAMenginOS.tsx`, `exports/DREAMENGINOS/DREAMenginOS/components/dreamengin/DreamenginApp.tsx`, `exports/DREAMENGINOS/DREAMenginOS/components/dreamengin/EnginShell.tsx`, `exports/DREAMENGINOS/DREAMenginOS/src/components/DreamEnginLogo.tsx`, `exports/DREAMENGINOS/modules/BrandingEngin/components/daydream/BrandingEngin.tsx`, `exports/DREAMENGINOS/modules/BrandingEngin/components/engines/brand/BrandEnginApp.tsx`, `exports/DREAMENGINOS/modules/BrandingEngin/engins/BrandingEngin.tsx`, `exports/DREAMENGINOS/modules/CodeEngin/components/daydream/CodeEngin.tsx`, `exports/DREAMENGINOS/modules/CodeEngin/components/engines/code/CodeEnginApp.tsx`, `exports/DREAMENGINOS/modules/CodeEngin/engins/CodeEngin.tsx` … +87 more<br>🗑️: `exports/ALL_ENGINES.txt`, `exports/all-engines/BrandingEngin/components/daydream/BrandingEngin.tsx`, `exports/all-engines/BrandingEngin/components/engines/brand/BrandEnginApp.tsx`, `exports/all-engines/BrandingEngin/engins/BrandingEngin.tsx`, `exports/all-engines/CodeEngin/components/daydream/CodeEngin.tsx`, `exports/all-engines/CodeEngin/components/engines/code/CodeEnginApp.tsx`, `exports/all-engines/CodeEngin/engins/CodeEngin.tsx`, `exports/all-engines/ContentEngin/components/daydream/ContentEngin.tsx`, `exports/all-engines/ContentEngin/engins/ContentEngin.tsx`, `exports/all-engines/CreateEngin/components/engines/create/CreateEnginApp.tsx`, `exports/all-engines/DREAMenginOS/app/dreamengin/DreamenginClient.tsx`, `exports/all-engines/DREAMenginOS/components/dreamengin/CrossEnginStatusPanel.tsx` … +88 more |
| **auto** | 2026-04-14 23:09 UTC | `1daac0c` | copilot/request-engine-codes | Copilot | ~2 modified<br>fix: resolve TypeScript errors in AudioVisualizer3D and GameEnginRuntime — - AudioVisualizer3D: cast BaseAudioContext to AudioContext for createMediaStreamDestination - GameEnginRuntime: extend GameEnginEvents with Record<string, unknown>, use any for GPUDevice to avoid @webgpu/types conflict  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `components/AudioVisualizer3D.tsx`, `lib/gameengin/gameEnginRuntime.ts` |
| **auto** | 2026-04-14 20:40 UTC | `af9f293` | copilot/request-engine-codes | Copilot | +1 added<br>export: add exports/ALL_ENGINES.txt — all 99 engine files in one downloadable txt — Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/a6e1929f-d9ed-4428-8489-25ba905b6916  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `exports/ALL_ENGINES.txt` |

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
