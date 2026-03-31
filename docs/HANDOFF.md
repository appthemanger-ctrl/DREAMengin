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
| **auto** | 2026-03-31 08:18 UTC | `7302114` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #369 from appthemanger-ctrl/copilot/adjust-joystick-sizes-and-hide-dm-bar — Tune mobile game HUD geometry and hide fullscreen session utility bar behind a pill<br> |
| **auto** | 2026-03-31 03:38 UTC | `d7747bb` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #368 from appthemanger-ctrl/copilot/update-messaging-rules-minors-adults — feat: child safety — minor-adult image blocking, context-aware messaging, full triad enforcement + policy docs<br> |
| **auto** | 2026-03-31 02:27 UTC | `1fd27d1` | copilot/update-messaging-rules-minors-adults | Copilot | +2 added  ~9 modified<br>feat: child safety — minor-adult image blocking, context-aware messaging, triad awareness, and policy docs — - Add C32_MINOR_IMAGE and C33_SOLICITING_IMAGES rule codes to boogie-policy.ts - Update childSafetyDetector: add Layer 0 minor-to-adult image block, new rule codes, isMinorToAdultImageBlock() - Create lib/child-safety/messageContextChecker.ts: full context-aware minor-adult conversation evaluator with safe context recognition and child safety law reference - Update messages route: age lookup + C32_MINOR_IMAGE block with specific message text - Update all three AI triad members (Dr. Eams, IDARi, TheBoogieMan) with child safety law awareness - Create docs/CHILD_SAFETY_POLICY.md: comprehensive child safety policy - Update docs/BOOGIEMAN_POLICY.md: add child safety protocol section - Update docs/IDARI_CONTRACT.md: add child safety awareness and responsibility - Update lib/child-safety/ncmecReporter.ts: reference new rule codes - Add 35 new tests covering C32_MINOR_IMAGE blocking and context checker (75 tests total, all passing)  Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/c8fdb6db-f127-4350-b91e-aa658c5dcde7  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `docs/CHILD_SAFETY_POLICY.md`, `lib/child-safety/messageContextChecker.ts`<br>✏️: `app/api/ai/idari/route.ts`, `app/api/messages/route.ts`, `docs/BOOGIEMAN_POLICY.md`, `docs/IDARI_CONTRACT.md`, `lib/ai/boogie-policy.ts`, `lib/ai/triad.ts`, `lib/child-safety/childSafetyDetector.ts`, `lib/child-safety/ncmecReporter.ts`, `tests/child-safety.test.ts` |
| **auto** | 2026-03-30 23:04 UTC | `7f46e66` | copilot/update-dm-bar-functionality | Copilot | ~10 modified<br>feat: complete DM bar, feed, profile, landing, and Policy pill changes — Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/70f4cd85-5813-479b-a11a-8979f691800e  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `app/edit-profiledream/page.tsx`, `app/layout.tsx`, `app/profile/[handle]/page.tsx`, `components/HomeFeed.tsx`, `components/LandingHero.tsx`, `components/landing/ParticleConstellation.tsx`, `components/messaging/DreamDMBar.tsx`, `lib/dreamdm/barInteractions.ts`, `styles/globals.css`, `tests/dreamdm-bar-interactions.test.ts` |
| **auto** | 2026-03-30 20:50 UTC | `881b20c` | copilot/wire-games-to-new-game-engine-again | Copilot | ~1 modified<br>fix: cast getPreferredCanvasFormat() return to GPUTextureFormat in WebGPURenderer — Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/48a07363-e2f5-4c74-9017-432878cc6b71  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `components/webgpu/renderer.ts` |

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
