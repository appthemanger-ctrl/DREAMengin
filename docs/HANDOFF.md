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
| **auto** | 2026-03-29 04:50 UTC | `58655cf` | copilot/add-ai-agent-for-game-building | Copilot | ~2 modified<br>fix: address code review — audit payload source tag + animation name — Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/c178e778-a7f7-4fd6-81a6-89b33dd6e02c  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `app/api/ai/game-builder/route.ts`, `components/games/GameBuilderAgent.tsx` |
| **auto** | 2026-03-28 18:32 UTC | `4768f55` | copilot/fix-remote-control-issue | Copilot | ~3 modified<br>fix: make embedded game remote compact and generic — Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/3825bf0a-6673-4c57-9f05-50c4c356c7b4  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `components/games/GameRemote.tsx`, `next-env.d.ts`, `tests/game-remote-regression.test.ts` |
| **auto** | 2026-03-28 18:03 UTC | `15a59bb` | copilot/update-image-processing-module | appthemanger-ctrl | no file changes<br>Merge branch 'completedream' into copilot/update-image-processing-module<br> |
| **auto** | 2026-03-28 12:23 UTC | `33332d8` | copilot/perform-optimization-in-app | appthemanger-ctrl | no file changes<br>Merge branch 'completedream' into copilot/perform-optimization-in-app<br> |
| **auto** | 2026-03-28 12:14 UTC | `82824c9` | copilot/perform-optimization-in-app | Copilot | +6 added  ~5 modified<br>feat: DREAM HYPERMODE drop — ParticleConstellation, KonamiDream, DreamBeatCanvas, DreamConstellationMap — Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/b30050c6-7734-412a-a4bd-8dc997947a35  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `app/daydream/constellation/ConstellationClient.tsx`, `app/daydream/constellation/page.tsx`, `components/KonamiDream.tsx`, `components/daydream/DreamConstellationMap.tsx`, `components/home/DreamBeatCanvas.tsx`, `components/landing/ParticleConstellation.tsx`<br>✏️: `app/layout.tsx`, `components/CommandPalette.tsx`, `components/LandingHero.tsx`, `components/home/DaydreamPulseStrip.tsx`, `styles/globals.css` |

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
