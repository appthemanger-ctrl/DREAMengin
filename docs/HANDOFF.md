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
| **auto** | 2026-03-24 13:05 UTC | `f99de58` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #292 from appthemanger-ctrl/copilot/fix-all-errors — fix: correct PBRMaterial property names — resolve 6 TypeScript build errors<br> |
| **auto** | 2026-03-24 10:59 UTC | `6519228` | copilot/fix-all-errors | Copilot | ~1 modified<br>fix: correct PBRMaterial property names in DrEamsBabylonHero — Reasoning: Babylon.js PBRMaterial (v8.x) does not expose `metallicRoughnessTexture` or `normalTexture`. The correct property names are `metallicTexture` (ORM/metallic-roughness map) and `bumpTexture` (normal map). Six TypeScript errors were raised by tsc because the wrong property names were used for all three PBR materials (coatMat, helmetMat, metalMat).  Architecture justification: docs/ARCHITECTURE.md §10 — Next.js 16+, TypeScript, Babylon.js stack; zero TypeScript errors required for a clean build gate.  Performance impact: neutral — same textures applied, only property names corrected.<br>✏️: `components/landing/DrEamsBabylonHero.tsx` |
| **auto** | 2026-03-24 09:07 UTC | `beff9f0` | claude/add-pbr-textures-page | Claude | ~1 modified<br>Apply PBR textures to Dr. Eams robot on landing page — Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com> Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/e42197c0-8324-44d3-965b-0c7b36b4bb0b<br>✏️: `components/landing/DrEamsBabylonHero.tsx` |
| **auto** | 2026-03-24 07:45 UTC | `bcd3bb7` | claude/fix-blur-and-3d-robot | Claude | ~2 modified<br>fix: drastically reduce blur and make robot 3D (not boxy) — - Reduced blur strength from 0.45/0.35 to 0.15/0.10 in GodTier engine - Reduced glow blur kernel from 32 to 16 in DrEamsBabylonHero - Replaced box torso with rounded cylinder + front plate for depth - Enhanced head with 32 segments (smoother), rounded chin guard - Made visor/screen curved cylinders instead of flat boxes - Replaced box boots with rounded cylinders + toe caps - Made hip band rounded cylinder instead of flat box - Made button strip and badge 3D cylinders instead of flat boxes - Made boot stripes cylindrical for consistent 3D look  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com> Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/a40eba55-8ee9-4d95-b6f6-bdb509ff45a2<br>✏️: `components/landing/DrEamsBabylonHero.tsx`, `lib/god-tier/godTierEngine.ts` |
| **auto** | 2026-03-24 07:32 UTC | `9a301c9` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #286 from appthemanger-ctrl/claude/optimize-node-js-actions — Fix Node.js 20 deprecation and reduce ESLint warnings from 380 to 19<br> |

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
