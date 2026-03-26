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
| **auto** | 2026-03-25 22:36 UTC | `42b7bc9` | copilot/add-draggable-divider-bar-again | Copilot | ~4 modified<br>feat: dual-viewport spatial hinge with draggable DreamDM divider bar — Reasoning: Two persistent Babylon.js/WebGPU runtime regions are now always mounted and interactive simultaneously, separated by the DreamDM Bar acting as a true spatial hinge (divider) rather than a snap-to-top/bottom window.  - lib/dreamdm/barInteractions.ts: new split-screen divider constants   (DIVIDER_H=52, SPLIT_SNAP_POINTS=[0.1,0.5,0.9], DEFAULT_SPLIT_RATIO=0.9)   and pure helpers snapToSplitPoint / snapSplitRatioOnRelease with   momentum-fling behaviour.  - components/messaging/DreamDMBar.tsx: added splitRatio + onSplitChange   props and divider drag handlers (handleDividerDragStart/Move/End).   When onSplitChange is provided the bar operates as a fixed-height   DIVIDER_H divider; bar top tracks splitRatio * (screenH - DIVIDER_H)   in real time. Gold button centres vertically on the divider. Snap   points (0.1/0.5/0.9) applied on pointer release. All existing   messaging/compose/Dr.Eams UI preserved.  - components/home/HomeSystem.tsx: layout changed from overlapping   absolute divs (one visible, one hidden) to two independent   simultaneously-visible regions sized by CSS calc(splitRatio *   (100vh - DIVIDER_H)). Both contexts are isActive=true at all times —   no opacity tricks, no pointer-events blocking. dominantRegion kept in   sync via useEffect for world-navigation callbacks. Navigation actions   (openDreamSpace, returnHome) set canonical snap ratios.  - tests/dreamdm-bar-interactions.test.ts: new test suites for   snapToSplitPoint, snapSplitRatioOnRelease, and the exported constants.  Architecture justification: ARCHITECTURE.md §1 (Runtime regions — Surface Space / DreamSpace / DreamDM Bar) and §10 (render-on-demand, performance-first WebGPU). Performance impact: both contexts stay alive — eliminates unmount/remount cost; CSS calc() layout avoids JS reflow on every drag frame."  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com> Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/ca014a10-9a5e-4f96-a4af-ee212aff2ff4<br>✏️: `components/home/HomeSystem.tsx`, `components/messaging/DreamDMBar.tsx`, `lib/dreamdm/barInteractions.ts`, `tests/dreamdm-bar-interactions.test.ts` |
| **auto** | 2026-03-25 11:05 UTC | `7a05da4` | copilot/v2-0-0-dreamengin-updates | Copilot | +2 added  ~6 modified<br>feat: DREAMengin v2.0.0 — one product, closed partials, v1-ui subordinated — Reasoning: closes all multi-generation structural partials to make DREAMengin read as one coherent runtime environment instead of a powerful system with multiple generations still visible.  Architecture justification: docs/ARCHITECTURE.md canonical route model + docs/AXIOMS.md axiom 1 (Coherent) + axiom 2 (Cohesive). Rule: when an older code path conflicts with the canonical naming authority, canonical naming wins (docs/LAW.md §alignment rule).  Changes: - package.json: 1.0.0 → 2.0.0 - lib/identity/canonical-names.ts: add PRODUCT_VERSION = '2.0.0' - app/layout.tsx: remove global v1-ui widget-feed-screen.css import - components/home/HomeDream.tsx: remove v1-ui CSS import; rename   widget-rail → dream-rail, widget-icon → dream-rail-icon,   feed-area-transition → dream-feed-transition; update aria-labels   from 'Your widgets' → 'Your Dream Windows' - styles/home-dream.css: add v2 Dream Rail CSS classes - docs/FEATURE_STATUS.md: close all 🟡 partial items; add v2.0.0 checklist - CHANGELOG.md: create v2.0.0 release notes - tests/v2-readiness.test.ts: 14 new tests validating v2.0.0 requirements  Performance impact: neutral (CSS scope reduced; v1-ui CSS no longer loaded globally)  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com> Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/8d209f9f-520d-49fe-b1f2-19c9d89c15cf<br>➕: `CHANGELOG.md`, `tests/v2-readiness.test.ts`<br>✏️: `app/layout.tsx`, `components/home/HomeDream.tsx`, `docs/FEATURE_STATUS.md`, `lib/identity/canonical-names.ts`, `package.json`, `styles/home-dream.css` |
| **auto** | 2026-03-25 04:48 UTC | `71cecc5` | copilot/detect-child-predator | Copilot | +1 added  ~4 modified<br>feat(child-safety): real-time image scanning on upload endpoints — Wire scanMediaUrlsForChildSafety into POST /api/posts and POST /api/messages. Both endpoints now scan image attachments (SHA-256 hash check + LLM classifyImage) before writing to the DB. Graceful degradation: returns CLEAN when Groq is not configured or fetch fails — no false-positive blocking on transient errors.  New shared helper: lib/child-safety/scanMediaUrls.ts 11 new tests (1883 total passing)."  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com> Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/e90f33aa-7704-4a7e-a771-8f2687c020b0<br>➕: `lib/child-safety/scanMediaUrls.ts`<br>✏️: `app/api/messages/route.ts`, `app/api/posts/route.ts`, `components/ChildSafetyPanel.tsx`, `tests/child-safety.test.ts` |
| **auto** | 2026-03-25 03:18 UTC | `17b0ba7` | copilot/detect-child-predator | Copilot | +6 added  ~5 modified<br>feat(child-safety): zero-tolerance CSAM and predator detection via TheBoogieMan.Ai — Reasoning: Implements full child safety detection system per platform zero-tolerance policy. Adds grooming/predator behavior detection (C31_GROOMING) and CSAM signal detection (C22_CSAM) with hash-based matching. All content surfaces (posts, messages, comments) are scanned before persistence. Incidents are logged to DB and reported to NCMEC CyberTipline per 18 U.S.C. § 2258A.  Architecture justification: A9_PROTECT_MINORS rule — docs/ARCHITECTURE.md. New rule C31_GROOMING added to boogie-policy.ts as one-strike CRITICAL severity. Scanner uses boogieEnforce for enforcement decisions. Admin review queue + hash registry management added at /api/admin/child-safety.  Performance impact: Negligible — detector is synchronous pure regex + Set lookup, O(n) in pattern count (~20 patterns). NCMEC reporting is async and never blocks the content-submission response."  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com> Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/4dd985c3-9d0b-4f85-81b5-a1b6015ed173<br>➕: `app/api/admin/child-safety/route.ts`, `app/api/ai/boogieman/child-safety/route.ts`, `lib/child-safety/childSafetyDetector.ts`, `lib/child-safety/ncmecReporter.ts`, `supabase/migrations/20260325100000_child_safety.sql`, `tests/child-safety.test.ts`<br>✏️: `app/api/comments/route.ts`, `app/api/messages/route.ts`, `app/api/posts/route.ts`, `lib/ai/boogie-policy.ts`, `lib/policy/boogiePolicy.ts` |
| **auto** | 2026-03-24 18:15 UTC | `0ef6d74` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #296 from appthemanger-ctrl/copilot/update-readme-to-match-reality — docs: full widget → Dream Window terminology pass across README.md<br> |

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
