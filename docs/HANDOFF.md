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
| **auto** | 2026-03-22 22:29 UTC | `5ff7b66` | copilot/phase-8-section-a-completion | Copilot | +6 added  ~10 modified<br>feat(phase8b): Dream Window System — Full Lifecycle Activation (Points 11–22) — Reasoning:   Implements all 12 points of Phase 8 Section B — Dream Window System:   Full Lifecycle Activation. Every Dream Window action now writes to the   database; lifecycle states persist; visibility is enforced at both the   API and RLS layers; atomic delete cleans all related records.    Point 11 — Lifecycle persists to DB:     app/api/dream-windows/route.ts (GET + POST) and     app/api/dream-windows/[id]/route.ts (GET + PATCH + DELETE) write     active_state transitions to the dream_windows table on every call.    Point 12 — 10-field validation at API layer:     POST /api/dream-windows validates all 10 required fields     (id, type, owner_id, config, size, position, visibility,     sourceBindings, destinationRules, activeState) and returns 422     if any are missing.    Point 13 — Spatial data persists:     PATCH accepts { position: {x,y}, size: {width,height} } and writes     them to the dream_windows table.    Point 14 — Visibility RLS:     supabase/migrations/20260322000000_phase8b_dream_windows.sql creates     the dream_windows table + dream_window_projections table with full     RLS: owner read/write, shared = followed users, public = any auth user.    Point 15 — owner_id enforcement:     PATCH and DELETE routes check owner_id === auth.uid() and return 403     for non-owners. GET list only returns records the RLS policy permits.    Point 16 — All actions write to DB:     lib/dream-window/useDreamWindowActions.ts exposes:     { dreamWindows, bindWindow, mountWindow, collapseWindow,       activateWindow, unbindWindow, removeWindow, addWindow, isLoading }     All methods call the API routes.    Point 17 — SuperDreamWidget real composition:     components/dreams/SuperDreamWidget.tsx replaced with a real     composition component that loads Dream Windows from the database,     auto-composes compatible windows into named clusters (StarMaker,     GameSphere, etc.), and renders with real add/remove/bind actions.    Point 18 — components/widgets/* absorbed:     UniversalWidget.tsx → wraps content in DreamShell (canonical Layer 1)     WidgetCard.tsx → forwarding shim to DreamShell     WidgetLibrary.tsx → re-export from SuperDreamWidget     WidgetSurface.tsx → re-export from SuperDreamWidget     WidgetShell.tsx → already a shim (unchanged)    Point 19 — types/widget-system-v2.ts deprecated:     types/dream-window.ts created as canonical type authority.     @deprecated JSDoc added to types/widget-system-v2.ts.    Point 20 — Layer validation:     validateDreamWindowLayers() added to DreamWindowLifecycle.ts.     Validates all 4 layers present; called from PATCH on mount.    Point 21 — View Profile visibility enforcement:     app/view-profile/page.tsx and app/profile/[handle]/page.tsx now     query dream_windows with explicit .in('visibility', ['shared','public'])     filter — never includes 'private' records for non-owners.    Point 22 — Atomic delete:     DELETE /api/dream-windows/[id] removes the dream_windows row     (projections cascade via FK) then deletes visibility_mappings     WHERE content_id = id with error-rollback semantics.  Architecture justification:   docs/ARCHITECTURE.md §4 (Universal Dream Window model)   docs/ARCHITECTURE.md §5 (Privacy and projection boundaries)   docs/AXIOMS.md Axiom 5 (Privacy by Design — private by default)   docs/LAW.md §3 (Every visible action must do something real)   docs/SECURITY.md (RLS on all user tables)   docs/dreamengin_phase8.md §B Points 11–22  Performance impact: neutral — new routes are server-side only; client hook   defers fetch to mount time with loading state; no render-loop impact.<br>➕: `app/api/dream-windows/[id]/route.ts`, `app/api/dream-windows/route.ts`, `lib/dream-window/useDreamWindowActions.ts`, `supabase/migrations/20260322000000_phase8b_dream_windows.sql`, `tests/phase8b-dream-windows.test.ts`, `types/dream-window.ts`<br>✏️: `app/profile/[handle]/page.tsx`, `app/view-profile/page.tsx`, `components/dreams/SuperDreamWidget.tsx`, `components/widgets/UniversalWidget.tsx`, `components/widgets/WidgetCard.tsx`, `components/widgets/WidgetLibrary.tsx`, `components/widgets/WidgetSurface.tsx`, `lib/dream-window/DreamWindowLifecycle.ts`, `lib/dream-window/index.ts`, `types/widget-system-v2.ts` |
| **auto** | 2026-03-21 19:31 UTC | `59854fe` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #267 from appthemanger-ctrl/copilot/create-phase-8-spec-document — Add docs/dreamengin_phase8.md — Phase 8 Real Runtime Completion spec (100 points)<br> |
| **auto** | 2026-03-21 17:55 UTC | `670e244` | copilot/create-phase-8-spec-document | Copilot | +1 added<br>Add docs/dreamengin_phase8.md — Phase 8 Real Runtime Completion spec (100 points) — Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com> Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/2048a9a4-5393-4353-be61-02b93a3908c6<br>➕: `docs/dreamengin_phase8.md` |
| **auto** | 2026-03-21 15:30 UTC | `a2fa96d` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #265 from appthemanger-ctrl/copilot/fix-build-blocking-errors-ci-failures — fix: add pnpm/action-setup to CI composite action and harden git push in update-bugs workflow<br> |
| **auto** | 2026-03-21 04:30 UTC | `54035c7` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #264 from appthemanger-ctrl/copilot/add-analog-control-and-buttons — fix: resolve all build errors — missing props, undefined components, missing imports<br> |

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
