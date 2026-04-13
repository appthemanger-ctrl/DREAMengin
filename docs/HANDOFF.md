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
| **auto** | 2026-04-13 02:46 UTC | `25270d5` | claude/implement-activity-first-protocol | Claude | +1 added  ~1 modified<br>feat(phase9): fix test rounding, add comprehensive implementation documentation — - Fixed Real Shit Rate formatting test (rounding to nearest) - All 19 tests now passing - Created PHASE9_IMPLEMENTATION.md with complete summary - Documents all deliverables, architecture compliance, and production steps - Phase 9: Activity-First Protocol COMPLETE ✅  Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/ee2e066e-5527-470c-8fee-1872b4804f40  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `docs/PHASE9_IMPLEMENTATION.md`<br>✏️: `tests/activity-first-protocol.test.ts` |
| **auto** | 2026-04-13 02:44 UTC | `a33dfd9` | claude/implement-activity-first-protocol | Claude | +1 added  ~1 modified<br>feat(phase9): update feed API with visibility score, add comprehensive tests — - Updated app/api/feed/route.ts to support Activity-First Protocol ranking - Added sort=activity parameter for visibility score-based feed ranking - Added views_count to feed entries (primary metric per protocol) - Created comprehensive test suite for Activity-First Protocol - Tests cover: tier system, verification, AQS calculation, visibility scoring, skip credits, CPV pricing - All business logic validated through unit tests - TypeScript errors expected until migration is run (new tables not in schema yet)  Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/ee2e066e-5527-470c-8fee-1872b4804f40  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `tests/activity-first-protocol.test.ts`<br>✏️: `app/api/feed/route.ts` |
| **auto** | 2026-04-13 02:42 UTC | `b717634` | claude/implement-activity-first-protocol | Claude | +6 added<br>feat(phase9): add UI components for activity profiles, tier badges, ads, and platform health — - Created ActivityProfile component for displaying user metrics (views, AQS, real shit rate) - Created TierBadge component for activity tier visualization (Tier 0-6) - Created ActivityPostForm with tier selection and verification upload - Created AdUnit component with skip credit system and AD badge - Created SkipCreditBalance display for header/nav - Created PlatformHealth dashboard for IDARi with health targets - All components follow ACTIVITY_FIRST_PROTOCOL.md specification  Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/ee2e066e-5527-470c-8fee-1872b4804f40  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `components/activity/ActivityPostForm.tsx`, `components/activity/ActivityProfile.tsx`, `components/activity/TierBadge.tsx`, `components/ads/AdUnit.tsx`, `components/ads/SkipCreditBalance.tsx`, `components/idari/PlatformHealth.tsx` |
| **auto** | 2026-04-13 02:40 UTC | `2ae42a2` | claude/implement-activity-first-protocol | Claude | +13 added<br>feat(phase9): complete database schema, core logic, and API endpoints for Activity-First Protocol — - Created comprehensive migration (20260413000000_phase9_activity_first_protocol.sql) - Implemented all 6 core tables: activity_points, activity_verification, views, skip_credits, ad_views, user_metrics - Created 5 database functions: calculate_aqs(), calculate_visibility_score(), apply_points_decay(), verify_ad_view(), get_user_metrics() - Added RLS policies and triggers for automatic AQS recalculation - Implemented TypeScript types (lib/activity/types.ts) - Created scoring system (lib/activity/scoring.ts) - Implemented AQS calculator (lib/activity/aqs.ts) - Created visibility score algorithm (lib/activity/visibility-score.ts) - Built 10 API endpoints for activity tracking, views, ads, skip credits, and metrics - All code follows ACTIVITY_FIRST_PROTOCOL.md specification  Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/ee2e066e-5527-470c-8fee-1872b4804f40  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `app/api/activity/track/route.ts`, `app/api/ads/view/route.ts`, `app/api/metrics/platform/route.ts`, `app/api/metrics/user/[userId]/route.ts`, `app/api/skip-credits/balance/route.ts`, `app/api/skip-credits/earn/route.ts`, `app/api/skip-credits/use/route.ts`, `app/api/views/track/route.ts`, `lib/activity/aqs.ts`, `lib/activity/scoring.ts`, `lib/activity/types.ts`, `lib/activity/visibility-score.ts` … +1 more |
| **auto** | 2026-04-13 01:59 UTC | `baca307` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #499 from appthemanger-ctrl/claude/add-complete-dreamdm-bar — feat: add complete production-ready DreamDMBar component<br> |

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
