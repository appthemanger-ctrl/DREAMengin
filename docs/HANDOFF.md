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
| **auto** | 2026-03-30 18:28 UTC | `65fe6eb` | copilot/create-independent-engine-structures | Copilot | +67 added  ~7 modified<br>feat: give all 6 engines their own app-like file structure under /engines/ — Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/f6dac288-9d4c-48b3-a11e-ba45f70eb943  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `app/engines/brand/analytics/page.tsx`, `app/engines/brand/campaigns/page.tsx`, `app/engines/brand/identity/page.tsx`, `app/engines/brand/layout.tsx`, `app/engines/brand/page.tsx`, `app/engines/code/ai/page.tsx`, `app/engines/code/layout.tsx`, `app/engines/code/notebook/page.tsx`, `app/engines/code/page.tsx`, `app/engines/code/projects/page.tsx`, `app/engines/create/calendar/page.tsx`, `app/engines/create/editor/page.tsx` … +55 more<br>✏️: `app/daydream/brand/engin/page.tsx`, `app/daydream/code/engin/page.tsx`, `app/daydream/create/engin/page.tsx`, `app/daydream/games/engin/page.tsx`, `app/daydream/lab/engin/page.tsx`, `app/daydream/music/engin/page.tsx`, `tests/daydream-engin-routes.test.ts` |
| **auto** | 2026-03-30 10:14 UTC | `2467dd3` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #359 from appthemanger-ctrl/copilot/update-repo-state-trigger — fix: update-repo-state workflow triggers main → completedream<br> |
| **auto** | 2026-03-30 09:38 UTC | `9cd107f` | copilot/update-repo-state-trigger | Copilot | ~1 modified<br>fix: update update-repo-state.yml triggers from main to completedream — Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/f2606c10-2da8-4d75-ac3b-4470ece6f4ae  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `.github/workflows/update-repo-state.yml` |
| **auto** | 2026-03-30 05:54 UTC | `b87284f` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #356 from appthemanger-ctrl/copilot/fix-global-gpu-device-type-error — fix: resolve GPUDevice __brand nominal-typing conflict in WebGPU renderer<br> |
| **auto** | 2026-03-30 05:33 UTC | `3fba734` | copilot/update-ui-ux-for-visuals | appthemanger-ctrl | no file changes<br>Merge branch 'completedream' into copilot/update-ui-ux-for-visuals<br> |

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
