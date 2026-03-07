# DREAMengin Architecture

Status: active implementation architecture  
Last updated: 2026-03-06

`README.md` is the authoritative full product specification. This file explains how the current repo maps to that spec and where the implementation is already strong versus where it is still being aligned.

## 1. Product model

DREAMengin is a privacy-first modular platform built around three core surfaces, six Daydream/Engin pairs, modular Dreams, and the AI triad.

### Core surfaces
- **HomeDream** — the main private operating surface
- **EditProfileDream** — the private builder for profile output
- **ViewProfile** — the shared/public output surface

### Daydream pair system
- Music / StarMakerEngin
- Games / GameEngin
- Lab / LabEngin
- Code / CodeEngin
- Brand / BrandingEngin
- Create / ContentEngin

### Platform modules
- Dreams
- DreamShop
- DreamMarketplace
- DreamMenu
- DreamDM
- DreamAds

### AI triad
- Dr. Eams
- IDARi
- TheBoogieMan.Ai

## 2. Canonical route model in the repo

| Product surface | Canonical route | Current support routes |
|---|---|---|
| HomeDream | `/homedream` | `/home` |
| EditProfileDream | `/edit-profiledream` | `/edit-profile` |
| ViewProfile | `/view-profile` | `/profile/[handle]`, `/profile`, `/u/[handle]` |
| DreamShop | `/shop` | `/shop/sell` |
| DreamMarketplace | `/marketplace` | none |
| DreamDM | `/messages` | none |
| DreamAds | `/ads` | `/ads/create` |

The canonical product names should be used in docs, labels, and architecture conversations even when support routes still exist.

## 3. Current implementation zones

### HomeDream
Primary code lives in:
- `app/homedream/page.tsx`
- `app/home/page.tsx`
- `components/home/*`
- `components/dreamnav/*`
- `components/menus/*`
- `components/HomeRadialNav.tsx`

### EditProfileDream and ViewProfile
Primary code lives in:
- `app/edit-profiledream/page.tsx`
- `app/edit-profile/page.tsx`
- `app/view-profile/page.tsx`
- `app/profile/[handle]/page.tsx`
- `components/profile/*`
- `components/ProfileEditor.tsx`

### Dreams
Canonical Dream-layer files already exist in:
- `components/dreams/DreamShell.tsx`
- `components/dreams/DreamConnectorLayer.tsx`
- `components/dreams/DreamFeatureLayer.tsx`
- `components/dreams/DreamOutputLayer.tsx`
- `components/dreams/SuperDreamWidget.tsx`

Legacy widget implementation material still exists in:
- `components/widgets/*`
- `types/widget-system-v2.ts`

## 4. Universal Dreams model

The repo is being aligned to one universal Dream model.

### Layer 1 — DreamShell
Visual shell, naming, size, placement, style, menus, and shell-level controls.

### Layer 2 — Connector / Identity
Authentication state, provider identity, capability discovery, and connector metadata.

### Layer 3 — Feature
Active modules that only appear when the connector or Dream actually supports them.

### Layer 4 — Output / Projection
Saved profile-safe output. This is what should be shared into ViewProfile and other public contexts.

## 5. Privacy and projection boundaries

The architecture follows the README rule that nothing is public by default.

- **HomeDream** is the private source surface.
- **EditProfileDream** is the private builder and staging layer.
- **ViewProfile** and public profile routes must render only saved/shared output.
- Profile output must not read unrestricted private HomeDream state.
- Any visibility change with public effect must require explicit user intent.

## 6. Combined profile output

Compatible Dreams may combine into automatic profile Super Widgets.

Implementation rule:
- the user chooses what to expose
- the system decides the default composition template
- the public/shared surface receives a projection, not the source Dream internals

## 7. DreamAds separation

DREAMengin uses two distinct advertising concepts:

- **DreamAds** = user-controlled ad space or promotion slots attached to their surfaces where allowed
- **Platform promotions** = platform-run promotional inventory

These must remain separate in docs and code language.

## 8. Design system direction

The repo design language should use the README palette and intent model:
- **Gold** = save, confirm, action, premium emphasis
- **Light Blue** = live state, connected state, signal state
- **White** = base surface, clarity, space

Minimal clutter, intentional motion, mobile-first polish.

## 9. Current alignment gaps

These remain open and should be documented honestly:
- legacy route names still exist beside canonical spec routes
- legacy widget naming still appears in code and docs
- extra daydream routes still exist outside the six canonical pairs
- some profile editing behavior still uses owner-facing profile workspace patterns rather than fully isolated EditProfileDream language

## 10. Build/runtime assumptions

- Next.js 16+
- App Router
- TypeScript
- Node 24
- pnpm 10.30.0
- Supabase for auth, database, storage, and realtime

These assumptions should remain stable unless a change is truly required.
