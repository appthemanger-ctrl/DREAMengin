# DREAMengin Feature Status

Last updated: 2026-03-21  
Source of truth for product naming: `README.md`

Legend: ✅ implemented · 🟡 partial / mixed · ⏳ planned / not yet cleanly aligned

**Current phase:** Phase 6 — Platform Completion (AI Triad, Privacy Enforcement, Module Consolidation)  
See `docs/dreamengin_phase6.md` for the full 50-point specification.

## 1. Core surfaces

| Surface | Status | Repo truth |
|---|---|---|
| HomeDream | ✅ | Canonical route exists at `/homedream`; support route also exists at `/home`. |
| EditProfileDream | 🟡 | Canonical route exists at `/edit-profiledream`; support route also exists at `/edit-profile`. Builder logic exists but naming is still mixed. |
| ViewProfile | 🟡 | Canonical route exists at `/view-profile`; public/shared output also lives at `/profile/[handle]`. Public projection boundaries need cleaner language and wiring. |

## 2. Dreams system

| Module | Status | Repo truth |
|---|---|---|
| DreamShell layer | ✅ | `components/dreams/DreamShell.tsx` exists. |
| Connector/Identity layer | ✅ | `components/dreams/DreamConnectorLayer.tsx` exists. |
| Feature layer | ✅ | `components/dreams/DreamFeatureLayer.tsx` exists. |
| Output/Projection layer | ✅ | `components/dreams/DreamOutputLayer.tsx` exists. |
| Legacy widget absorption into Dreams naming | 🟡 | `components/widgets/*` still exists and is being repurposed. |
| Automatic Super Widget composition | 🟡 | `components/dreams/SuperDreamWidget.tsx` exists, but profile-wide composition rules still need full alignment. |

## 2a. Dreams Space (second runtime)

| Feature | Status | Repo truth |
|---|---|---|
| DreamsSpacePanel — separate runtime panel | ✅ | `components/dreams/DreamsSpacePanel.tsx`; revealed by dragging DreamDMBar upward. |
| useDreamsRuntime hook | ✅ | `lib/dreams/useDreamsRuntime.ts`; independent navigation state separate from home runtime. |
| Daydreams as priority in Dreams Space | ✅ | DreamsSpacePanel surfaces all 6 Daydreams as the first/default tab (`✦ Daydreams`), per README runtime model. |
| Live routes to all 6 Daydreams from Dreams Space | ✅ | Each tile in the Daydreams tab links directly to `/daydream/music`, `/daydream/games`, `/daydream/lab`, `/daydream/code`, `/daydream/brand`, `/daydream/create`. |
| Connector feeds (YouTube / GitHub / Spotify) | ✅ | Available in the secondary `✨ Feeds` tab; service sub-tabs preserved. |

## 3. Daydream pairs

| Pair | Status | Repo truth |
|---|---|---|
| Music / StarMakerEngin | ✅ | `app/daydream/music/page.tsx` exists; `components/daydream/StarMakerEngin.tsx` exists. |
| Games / GameEngin | ✅ | `app/daydream/games/page.tsx` exists; `components/daydream/GameEngin.tsx` created (Phase 6). |
| Lab / LabEngin | ✅ | `app/daydream/lab/page.tsx` exists; `components/daydream/LabEngin.tsx` exists. |
| Code / CodeEngin | ✅ | `app/daydream/code/page.tsx` exists; `components/daydream/CodeEngin.tsx` exists. |
| Brand / BrandingEngin | ✅ | `app/daydream/brand/page.tsx` exists; `components/daydream/BrandingEngin.tsx` exists. |
| Create / ContentEngin | ✅ | `app/daydream/create/page.tsx` exists; `components/daydream/ContentEngin.tsx` exists. |
| DaydreamShell sideBComponent prop | ✅ | `components/daydream/DaydreamShell.tsx` now accepts `sideBComponent` prop (Phase 6). |
| useDaydreamState hook | ✅ | `lib/daydream/useDaydreamState.ts` created (Phase 6). |
| Legacy extra daydream routes | 🟡 | `analytics`, `media-vault`, and `play` still exist and must be repurposed (Phase 6). |

## 4. Platform modules

| Module | Status | Repo truth |
|---|---|---|
| DreamMenu | ✅ | Canonical: `components/menus/DreamRadialMenu.tsx`. `HomeRadialNav.tsx` (legacy, was unused) replaced with redirect stub re-exporting from canonical. `DualBottomMenu.tsx` wraps DreamRadialMenu + SystemRadialMenu for the seam. Phase 6 item 10 complete. |
| DreamDM | ✅ | `app/messages/page.tsx` and `app/api/messages/route.ts` exist. |
| DreamShop | ✅ | `app/shop/page.tsx` and `app/api/shop/route.ts` exist. |
| DreamMarketplace | ✅ | `app/marketplace/page.tsx` exists. |
| DreamAds | ✅ | `app/ads/page.tsx` now renders "My DreamAds — Available" and "Platform Promotions" as distinct sections. Migration `20260321000000_ads_platform_promotions.sql` adds `is_platform_promotion` column. Phase 6 item 11 complete. |

## 5. AI triad

| AI | Status | Repo truth |
|---|---|---|
| Dr. Eams | ✅ | Canonical route at `/api/ai/eams`. `DrEamsSearchBar` wired in HomeDream (`WorkspaceDashboard`); `onOpenDrEams` calls real `openDrEams` from `DreamSystemContext`. Send-to-DreamDM routing live. Phase 6 item 5 complete. |
| IDARi | ✅ | `/api/ai/idari` exists; admin-guard enforced even under dev bypass; `IDARI_PASSWORD` env check returns 503 when absent. 15 guard tests in `tests/idari-admin-guard.test.ts`. Phase 6 item 6 complete. |
| TheBoogieMan.Ai | ✅ | `/api/ai/boogieman` and `/api/ai/boogieman/privacy-event` exist. Visibility-change events logged on `handleSave`; publish events logged on `handlePublish` in EditProfileDream. Phase 6 item 7 complete. |
| AI Triad coordination bus | 🟡 | `lib/agents/agentBus.ts` exists; triad consensus gate is a Phase 6 item. |

## 6. Privacy and profile integrity

| Rule | Status | Repo truth |
|---|---|---|
| Nothing public by default | ✅ | Enforced at data layer. `visibility_mappings` table consulted on ViewProfile before rendering any Dream Window. Default is `private`. |
| Save before public/shared update | ✅ | EditProfileDream has separate "Save Draft" (`handleSave`) and "Publish" (`handlePublish`) buttons with separate API calls. Visibility-change events logged by TheBoogieMan on save. |
| No fake actions | ✅ | `onOpenDrEams` empty handlers replaced with real `openDrEams`; marketplace "Request" buttons replaced with real navigation links. Phase 6 item 13 complete. |
| RLS on all user tables | 🟡 | RLS is documented as required; full audit of all Supabase tables is a Phase 6 item. |

## 7. Design language

| Rule | Status | Repo truth |
|---|---|---|
| Gold / light blue / white premium palette | ✅ | Theme docs and CSS tokens support this direction. |
| Minimal clutter | 🟡 | Many surfaces are visually rich; continued cleanup is still needed. |
| Intentional motion | 🟡 | Motion exists, but not every surface is equally restrained yet. |

## 8. Phase 6 priorities

The following items are the Phase 6 focus. See `docs/dreamengin_phase6.md` for the full 50-point spec.

1. ✅ Add `components/daydream/GameEngin.tsx` (Games Daydream Side B) — done.
2. ✅ Create `lib/daydream/useDaydreamState.ts` (shared Daydream/Engin state hook) — done.
3. ✅ Wire `sideBComponent` prop into `DaydreamShell`; wire `GameEngin` into Games page — done.
4. ✅ Surface Daydreams as priority in Dreams Space with live routes from second runtime — done.
5. ✅ Integrate Dr. Eams as HomeDream search bar with send-to-DreamDM routing — done. `DrEamsSearchBar` wired in `WorkspaceDashboard`; `onOpenDrEams` now calls real `openDrEams` from `DreamSystemContext` (was `() => {}` — Phase 6 Item 13 fix applied simultaneously).
6. ✅ Enforce IDARi admin-guard even under dev auth bypass — done. IDARI_PASSWORD env check added to `app/api/ai/idari/route.ts`; returns 503 when absent. 15 guard contract tests added in `tests/idari-admin-guard.test.ts`.
7. ✅ Wire TheBoogieMan privacy-event logging for visibility changes — done. `handleSave` in `EditProfileDream` now detects per-widget visibility changes and POSTs `VISIBILITY_CHANGE` events to `/api/ai/boogieman/privacy-event`. `handlePublish` already logged `EXPLICIT_SHARE` events.
8. ✅ Consult `visibility_mappings` before rendering any content on ViewProfile — done. `view-profile/page.tsx` now queries `visibility_mappings` table and uses it as authoritative source (falls back to widget visibility field). Migration `20260316000000_visibility_mappings.sql` already existed.
9. ✅ Separate private-save and explicit-share flows in EditProfileDream — done. `handleSave` (draft) and `handlePublish` (explicit share) are separate callbacks with separate buttons ("Save Draft" vs "Publish").
10. ✅ Unify DreamMenu under a single canonical implementation — done. `components/menus/DreamRadialMenu.tsx` is canonical. `HomeRadialNav.tsx` (unused) replaced with redirect stub re-exporting from canonical. `DualBottomMenu.tsx` wraps `DreamRadialMenu` + `SystemRadialMenu` for the seam.
11. ✅ Separate user DreamAds from platform promotions in code and UI language — done. Migration `20260321000000_ads_platform_promotions.sql` adds `is_platform_promotion` to `ad_listings`. Ads surface now renders "My DreamAds — Available" and "Platform Promotions" as distinct sections.
12. ⏳ Repurpose legacy Daydream routes (`analytics`, `media-vault`, `play`).
13. ✅ Complete real-capability audit: replace all fake actions with real ones — done. `onOpenDrEams={() => {}}` in `HomeSystem.tsx` (both RuntimeView instances) replaced with real `openDrEams` from `DreamSystemContext`. Marketplace "Request" button replaced with a real navigation link to the slot detail surface. No remaining empty handlers in `components/home/`, `components/dreams/`, or `components/daydream/`.
## 8. Current alignment priorities

1. Make spec names primary everywhere in docs and UI copy.
2. Continue folding legacy widget naming into Dreams naming.
3. Tighten EditProfileDream → ViewProfile projection boundaries.
4. Repurpose extra legacy routes into spec-defined systems instead of keeping them as free-floating product names.

## 9. Phase 7 — Product Identity, Naming, and Constitution

| Item | Status | Repo truth |
|---|---|---|
| Product definition document | ✅ | `docs/PRODUCT_DEFINITION.md` — locked final authority on what DREAMengin is and is not. |
| Naming authority document | ✅ | `docs/NAMING_AUTHORITY.md` — locked canonical names, rejection list, validation rules, AI agent reference. |
| Product constitution document | ✅ | `docs/CONSTITUTION.md` — locked binding rules covering privacy, action honesty, user intent, navigation, anti-patterns, and valid proposals. |
| Machine-readable naming library | ✅ | `lib/identity/canonical-names.ts` — TypeScript exports for all canonical names and validation functions. |
| Naming authority tests | ✅ | `tests/phase7-naming.test.ts` — programmatic validation of naming authority rules. |
