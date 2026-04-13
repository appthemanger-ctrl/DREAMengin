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
| **auto** | 2026-04-13 06:41 UTC | `1ed0972` | claude/makeover-engins-and-daydreams-2026 | Claude | ~2 modified<br>fix(workflows): repair YAML syntax in update-readme and update-embed-feed workflows — Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/bb4fbca6-66e3-48c2-b405-b994ec1eac12  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `.github/workflows/update-embed-feed.yml`, `.github/workflows/update-readme.yml` |
| **auto** | 2026-04-13 03:27 UTC | `84d8e63` | claude/makeover-engins-and-daydreams-2026 | Claude | ~5 modified<br>feat: wire 5 core cross-engin workflows with REAL data transfer — All workflows now emit actual data through bridge and display in receivers:  ✅ Game→Content: clip workflow sends sessionId, gameTitle, score, timestamp, worldState, achievements ✅ Game→Brand: achievement campaign sends achievementId, name, totalAchievements, playerLevel ✅ Code→Content: notebook publish sends notebookId, cellCount, languages, cells summary ✅ Code→Game: script deploy sends scriptId, language, code, hasOutput ✅ Lab→Code: dataset export sends datasetId, experimentCount, format, experiments summary  Each workflow includes: - Sender function with bridge.emit() and REAL data objects - Receiver panel that conditionally renders when data arrives - Dismissal state to hide panels - Forge activity recording for cross-engin tracking  🤖 Generated with [Claude Code](https://claude.com/claude-code)  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `components/daydream/BrandingEngin.tsx`, `components/daydream/CodeEngin.tsx`, `components/daydream/ContentEngin.tsx`, `components/daydream/GameEngin.tsx`, `components/daydream/LabEngin.tsx` |
| **auto** | 2026-04-13 02:34 UTC | `91b8029` | claude/makeover-engins-and-daydreams-2026 | Claude | ~2 modified<br>feat: wire real StarMaker→Lab workflow with live data transfer — ACTUAL WORKING IMPLEMENTATION: - StarMaker stem export now emits REAL audio metadata (BPM, key, mixer levels, effects, beat patterns) - Lab receives stem data via bridge and displays in new "Stem Analysis" panel - Panel shows received stem type, status, and bridge connection info - Added "Run Frequency Analysis" action button - Uses existing useLabEnginBridge hook for real-time updates  This is NOT cosmetic - the bridge.emit() sends actual data and Lab receives and displays it. The infrastructure was already there, just needed wiring.  Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/d5e557b4-4c03-425b-b6ec-265d8f1e9543  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `components/daydream/LabEngin.tsx`, `components/daydream/StarMakerEngin.tsx` |
| **auto** | 2026-04-13 02:04 UTC | `5f98393` | claude/makeover-engins-and-daydreams-2026 | Claude | ~7 modified<br>feat: complete 2026 makeover for all daydream pages — - Updated code daydream with #22d3ee (cyan) + 2026 gradient styling - Updated lab daydream with #10b981 (green) + quantum/GPU features - Updated brand daydream with #f472b6 (pink) + AI brand kit styling - Updated create daydream with #fb923c (orange) + content 2026 features - Updated forge daydream with gradient hero + automation 2.0 badge - All daydream pages now have "2026 Edition" badges - Added feature-specific badges (Monaco IDE, WebGPU, AI Optimizer, etc.) - Applied glassmorphism gradients and modern design language across all pages  Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/3b359f55-3973-488a-b2f3-c5207bf1e7e1  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `app/daydream/brand/page.tsx`, `app/daydream/code/page.tsx`, `app/daydream/create/page.tsx`, `app/daydream/forge/page.tsx`, `app/daydream/games/page.tsx`, `app/daydream/lab/page.tsx`, `app/daydream/music/page.tsx` |
| **auto** | 2026-04-13 01:55 UTC | `8e271f1` | claude/makeover-engins-and-daydreams-2026 | Claude | ~1 modified<br>test: update test expectations for 2026 workflow additions — - Update workflow count from 21 to 31 (added 10 new 2026 workflows) - Update starmaker→lab workflow test to expect 2 workflows (added audio-analysis) - Update seamClipboard test to expect both stem-analyze and audio-analysis workflows  Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/4e98fe9f-3042-4b44-bb41-0ac4af26f048  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `tests/seam-clipboard.test.ts` |

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
