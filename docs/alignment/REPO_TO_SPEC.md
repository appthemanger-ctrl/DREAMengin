# DREAMengin Repo to Spec Map

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


Status: active alignment ledger  
Last updated: 2026-03-06

`README.md` is the canonical product specification. This file maps the current repo to that spec without pretending the codebase has already been fully renamed.

## Canonical core surfaces

| Spec surface | Canonical route | Current repo reality |
|---|---|---|
| HomeDream | `/homedream` | Canonical route exists. Legacy support route also exists at `/home`. |
| EditProfileDream | `/edit-profiledream` | Canonical route exists. Legacy support route also exists at `/edit-profile`. |
| ViewProfile | `/view-profile` | Canonical preview/share entry exists. Public output also exists at `/profile/[handle]`. |

## Current implementation mapping

- `app/homedream/page.tsx` and `app/home/page.tsx` point into the private HomeDream system.
- `components/home/*`, `components/dreamnav/*`, `components/menus/*`, and `components/HomeRadialNav.tsx` are the strongest HomeDream and DreamMenu implementation zones.
- `app/edit-profiledream/page.tsx` and `app/edit-profile/page.tsx` are the current EditProfileDream routes.
- `components/profile/ProfileCanvas.tsx`, `components/profile/ProfileWidgetGrid.tsx`, and `components/ProfileEditor.tsx` are the strongest current EditProfileDream builder pieces.
- `app/view-profile/page.tsx` is the canonical preview/share output entry.
- `app/profile/[handle]/page.tsx` is the current public profile destination.
- `app/profile/page.tsx` is an owner-facing profile workspace and should not be confused with canonical public ViewProfile.

## Daydream pair model

### Canonical Daydream Side A routes in the repo
- Music → `app/daydream/music/page.tsx`
- Games → `app/daydream/games/page.tsx`
- Lab → `app/daydream/lab/page.tsx`
- Code → `app/daydream/code/page.tsx`
- Brand → `app/daydream/brand/page.tsx`
- Create → `app/daydream/create/page.tsx`

### Engin-side implementation material in the repo
The repo contains Engin-side behavior in components, overlays, controls, and runtime surfaces rather than in a clean one-folder-per-Engin structure. The current best candidates are:
- `components/daydream/DaydreamShell.tsx`
- `components/dreamnav/*`
- `components/games/*`
- `components/music/*`
- `components/PhysicsLab.tsx`
- `components/ContentScheduler.tsx`

### Legacy extras to repurpose, not treat as canonical product surfaces
- `app/daydream/analytics/page.tsx`
- `app/daydream/media-vault/page.tsx`
- `app/daydream/play/page.tsx`

## Platform modules

| Spec module | Current repo mapping |
|---|---|
| Dreams | `components/dreams/*`, `components/widgets/*`, `types/widget-system-v2.ts` |
| DreamShop | `app/shop/page.tsx`, `app/api/shop/route.ts` |
| DreamMarketplace | `app/marketplace/page.tsx`, `types/marketplace.ts` |
| DreamMenu | `components/menus/*`, `components/dreamnav/*`, `components/HomeRadialNav.tsx` |
| DreamDM | `app/messages/page.tsx`, `app/api/messages/route.ts`, `components/MessagesClient.tsx` |
| DreamAds | `app/ads/page.tsx`, `types/ads.ts` |

## Universal Dreams model

The repo now has canonical Dream-layer files under `components/dreams/`:
- `DreamShell.tsx`
- `DreamConnectorLayer.tsx`
- `DreamFeatureLayer.tsx`
- `DreamOutputLayer.tsx`
- `SuperDreamWidget.tsx`

Legacy widget files under `components/widgets/*` still exist and should be treated as implementation material being absorbed into Dreams naming.

## AI triad

| Spec AI | Canonical route | Notes |
|---|---|---|
| Dr. Eams | `/api/ai/eams` | User-facing assistant. Legacy support routes still exist under `/api/dr-eams/*`. |
| IDARi | `/api/ai/idari` | Admin-only internal operator. |
| TheBoogieMan.Ai | `/api/ai/boogieman` | Conservative policy and enforcement surface. |

## Route handling guidance

### Canonical product routes
- `/homedream`
- `/edit-profiledream`
- `/view-profile`
- `/daydream/music`
- `/daydream/games`
- `/daydream/lab`
- `/daydream/code`
- `/daydream/brand`
- `/daydream/create`
- `/shop` as DreamShop
- `/marketplace` as DreamMarketplace
- `/messages` as DreamDM
- `/ads` as DreamAds

### Support or legacy-facing routes
- `/home`
- `/edit-profile`
- `/profile`
- `/u/[handle]`
- extra daydream routes not named in the README

These should be documented honestly and progressively repurposed or relabeled, not treated as separate product systems.
