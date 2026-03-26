# DREAMengin Handoff

Last updated: 2026-03-16

## What changed in this alignment pass

This handoff reflects the canonical OS-Layer Naming Migration — upgrading the product description from a page-based app model to the dual-runtime, spatial operating environment model.

### Primary outcome

All docs, canonical name registry, and tests now use the OS-layer naming model:
- DREAMengin is a **dual-runtime, spatial operating environment**
- Surfaces (not pages), Dream Windows (not widgets), DreamSpace (not widget layer)
- Connection language: bind / mount / activate (not link widget / open page)
- Multi-surface, multi-engin connection network (not 1-to-1 pairs)

### Canonical names now documented first

**Product type:**
- DREAMengin Runtime Environment (dual-runtime, spatial operating environment)

**Runtime regions:**
- Surface Space (upper active runtime region)
- DreamSpace (lower modular runtime region)
- DreamDM Bar / Runtime Seam (Persistent Interaction Rail)

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
| **auto** | 2026-03-26 04:51 UTC | `b98960c` | copilot/fix-typescript-compilation-error-again | Copilot | ~1 modified<br>fix: widen `best` variable type in snapToSplitPoint to accept all snap values — Reasoning: `SPLIT_SNAP_POINTS` is `[0.1, 0.5, 0.9] as const`, so `SPLIT_SNAP_POINTS[0]` narrows `best` to literal type `0.1`.  Reassigning `pt` (type `0.1 \| 0.5 \| 0.9`) to `best` then fails.  Adding an explicit `: number` annotation widens the type so all snap values are assignable.  Architecture justification: correctness fix — no behaviour change. Performance impact: none.  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com> Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/39b110dd-1848-43d3-a990-d9cfe11bfa63<br>✏️: `lib/dreamdm/barInteractions.ts` |
| **auto** | 2026-03-26 03:59 UTC | `cc5163c` | copilot/fix-typescript-compilation-error | Copilot | ~1 modified<br>fix: widen SupabaseLike.from return type to any in scanMediaUrls.ts — Reasoning: The narrow return type of SupabaseLike.from() was not structurally compatible with the real SupabaseClient<Database> returned by createServerClient(). This caused a TypeScript compile error in app/api/messages/route.ts line 99 when passing the supabase client to scanMediaUrlsForChildSafety(). The internal loadKnownBadHashes already casts to (supabase as any), so widening the interface to from: (table: string) => any is safe and correct.  Architecture justification: minimal type fix — no logic change. Performance impact: none.  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com> Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/bf2358c7-51db-4c0c-9890-21c1c7a7a331<br>✏️: `lib/child-safety/scanMediaUrls.ts` |
| **auto** | 2026-03-26 03:30 UTC | `125f30c` | copilot/clean-up-documentation | Copilot | ~2 modified<br>fix: update-readme workflow race condition + catch up README — Workflow was silently swallowing push rejections via `\|\| true`. When a concurrent push happened to the same branch while the action ran (common with agent-authored PRs), the README update was lost.  Fix: replace bare `git push \|\| true` with a 3-attempt retry loop that does `git pull --rebase` before each retry, so concurrent pushes are properly integrated. Also exits with an error code on failure so the workflow is no longer silent about it.  README.md: manually caught up the two missing entries (ead2d33 and 74f652b) that were lost due to the rejected pushes.  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com> Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/e296cd1d-d224-48e3-b8ef-b36feee4fb7e<br>✏️: `.github/workflows/update-readme.yml`, `README.md` |
| **auto** | 2026-03-26 03:14 UTC | `ead2d33` | copilot/clean-up-documentation | Copilot | +1 added  ~2 modified<br>docs: establish Activity-First Protocol as canonical platform law — Reasoning: Admin requested this document be treated as canonical platform law. Creates docs/ACTIVITY_FIRST_PROTOCOL.md (clean, single coherent doc authored by José Mancilla, 2026-03-25) covering 9 sections + The Law. Updates docs/LAW.md (rules 11–16) to codify activity-first constraints. Updates docs/FEATURE_STATUS.md with a 22-item v2.1 implementation tracker.  Architecture justification: nothing-public-by-default rule (docs/LAW.md §2) is preserved and extended. All principles align with existing AXIOMS.md and IDARI_CONTRACT.md governance structure.  Performance impact: documentation only — no runtime change.  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com> Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/660a3d94-4597-4080-b428-018b48693f2b<br>➕: `docs/ACTIVITY_FIRST_PROTOCOL.md`<br>✏️: `docs/FEATURE_STATUS.md`, `docs/LAW.md` |
| **auto** | 2026-03-25 22:36 UTC | `42b7bc9` | copilot/add-draggable-divider-bar-again | Copilot | ~4 modified<br>feat: dual-viewport spatial hinge with draggable DreamDM divider bar — Reasoning: Two persistent Babylon.js/WebGPU runtime regions are now always mounted and interactive simultaneously, separated by the DreamDM Bar acting as a true spatial hinge (divider) rather than a snap-to-top/bottom window.  - lib/dreamdm/barInteractions.ts: new split-screen divider constants   (DIVIDER_H=52, SPLIT_SNAP_POINTS=[0.1,0.5,0.9], DEFAULT_SPLIT_RATIO=0.9)   and pure helpers snapToSplitPoint / snapSplitRatioOnRelease with   momentum-fling behaviour.  - components/messaging/DreamDMBar.tsx: added splitRatio + onSplitChange   props and divider drag handlers (handleDividerDragStart/Move/End).   When onSplitChange is provided the bar operates as a fixed-height   DIVIDER_H divider; bar top tracks splitRatio * (screenH - DIVIDER_H)   in real time. Gold button centres vertically on the divider. Snap   points (0.1/0.5/0.9) applied on pointer release. All existing   messaging/compose/Dr.Eams UI preserved.  - components/home/HomeSystem.tsx: layout changed from overlapping   absolute divs (one visible, one hidden) to two independent   simultaneously-visible regions sized by CSS calc(splitRatio *   (100vh - DIVIDER_H)). Both contexts are isActive=true at all times —   no opacity tricks, no pointer-events blocking. dominantRegion kept in   sync via useEffect for world-navigation callbacks. Navigation actions   (openDreamSpace, returnHome) set canonical snap ratios.  - tests/dreamdm-bar-interactions.test.ts: new test suites for   snapToSplitPoint, snapSplitRatioOnRelease, and the exported constants.  Architecture justification: ARCHITECTURE.md §1 (Runtime regions — Surface Space / DreamSpace / DreamDM Bar) and §10 (render-on-demand, performance-first WebGPU). Performance impact: both contexts stay alive — eliminates unmount/remount cost; CSS calc() layout avoids JS reflow on every drag frame."  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com> Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/ca014a10-9a5e-4f96-a4af-ee212aff2ff4<br>✏️: `components/home/HomeSystem.tsx`, `components/messaging/DreamDMBar.tsx`, `lib/dreamdm/barInteractions.ts`, `tests/dreamdm-bar-interactions.test.ts` |

## What changed in this alignment pass

This handoff reflects the README-first documentation cleanup.

### Primary outcome
The docs now treat `README.md` as the authoritative full specification and use spec-first names across the implementation docs.

### Canonical names now documented first
- HomeDream
- EditProfileDream
- ViewProfile
- Dreams
- DreamShop
- DreamMarketplace
- DreamMenu
- DreamDM
- DreamAds
- Dr. Eams
- IDARi
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
