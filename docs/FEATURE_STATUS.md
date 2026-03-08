# DREAMengin Feature Status

Last updated: 2026-03-08 (IDARi alignment pass 3)
Source of truth for product naming: `README.md`

Legend: ✅ implemented · 🟡 partial / mixed · ⏳ planned / not yet cleanly aligned

## 1. Core surfaces

| Surface | Status | Repo truth |
|---|---|---|
| HomeDream | ✅ | Canonical route exists at `/homedream`; support route also exists at `/home`. |
| EditProfileDream | 🟡 | Canonical route exists at `/edit-profiledream`; support route also exists at `/edit-profile`. Header subtitle now says "Private builder — set visibility per Dream before saving to ViewProfile". View Profile preview button now correctly links to `/profile/[handle]`. Naming is mostly aligned; projection boundary is clearer. |
| ViewProfile | 🟡 | Canonical route at `/view-profile` redirects to `/profile/[handle]`. Public profile page now shows "ViewProfile" heading for owner (not "My Profile"). Edit link now goes to `/edit-profiledream` (canonical). Privacy enforcement added: public view only renders Dreams with `visibilityTier==='everyone'`. Locked empty state shown when no Dreams are explicitly made public. |

## 2. Dreams system

| Module | Status | Repo truth |
|---|---|---|
| DreamShell layer | ✅ | `components/dreams/DreamShell.tsx` exists. |
| Connector/Identity layer | ✅ | `components/dreams/DreamConnectorLayer.tsx` exists. |
| Feature layer | ✅ | `components/dreams/DreamFeatureLayer.tsx` exists. |
| Output/Projection layer | ✅ | `components/dreams/DreamOutputLayer.tsx` exists. |
| Legacy widget absorption into Dreams naming | 🟡 | `components/widgets/*` still exists. UI labels in `AddDreamCTA`, `ConnectWidgetPrompt`, `ConnectorWidgetPicker`, and `ProfileWidgetGrid` now use "Dream" language. File names in `components/widgets/` remain for compatibility but all visible labels use spec names. |
| Automatic Super Widget composition | 🟡 | `components/dreams/SuperDreamWidget.tsx` exists, but profile-wide composition rules still need full alignment. |

## 3. Daydream pairs

| Pair | Status | Repo truth |
|---|---|---|
| Music / StarMakerEngin | ✅ | `app/daydream/music/page.tsx` exists. |
| Games / GameEngin | ✅ | `app/daydream/games/page.tsx` exists. |
| Lab / LabEngin | ✅ | `app/daydream/lab/page.tsx` exists. |
| Code / CodeEngin | ✅ | `app/daydream/code/page.tsx` exists. |
| Brand / BrandingEngin | ✅ | `app/daydream/brand/page.tsx` exists. |
| Create / ContentEngin | ✅ | `app/daydream/create/page.tsx` exists. |
| Legacy extra daydream routes | 🟡 | `analytics`, `media-vault`, and `play` still exist and should be repurposed, not treated as canonical product surfaces. |

## 4. Platform modules

| Module | Status | Repo truth |
|---|---|---|
| DreamMenu | 🟡 | `SystemRadialMenu` panel title updated to "DreamMenu"; "Account" item relabeled to "Edit ProfileDream"; "Go Home" to "HomeDream". `DualBottomMenu` right panel title updated to "DreamMenu"; "Profiles" item to "ViewProfile"; "Marketplace" to "DreamMarketplace". Core naming is now spec-first in menus. Further cleanup of legacy label references still possible. |
| DreamDM | ✅ | `app/messages/page.tsx` and `app/api/messages/route.ts` exist. |
| DreamShop | ✅ | `app/shop/page.tsx` and `app/api/shop/route.ts` exist. |
| DreamMarketplace | ✅ | `app/marketplace/page.tsx` exists. |
| DreamAds | 🟡 | `app/ads/page.tsx` header now says "DreamAds" (not "Ads Marketplace"). "My DreamAds Slots" section now tagged "User-owned — you control placement & pricing". Buyer section renamed "Buy Ad Space — Slots published by other creators — not platform ads". Create page updated to say "DreamAds Slot". User-owned vs platform separation is now explicit in UI. |

## 5. AI triad

| AI | Status | Repo truth |
|---|---|---|
| Dr. Eams | ✅ | Canonical route exists at `/api/ai/eams`; legacy support routes still exist under `/api/dr-eams/*`. All Dr. Eams assistant responses now use "Edit ProfileDream" and "DreamAds" spec names. |
| IDARi | ✅ | `/api/ai/idari` exists. |
| TheBoogieMan.Ai | ✅ | `/api/ai/boogieman` exists. |

## 6. Privacy and profile integrity

| Rule | Status | Repo truth |
|---|---|---|
| Nothing public by default | 🟡 | `ProfileWidgetGrid` now enforces this in public view: only renders Dreams with `visibilityTier==='everyone'`; shows locked empty state otherwise. LAW.md §2 is now enforced at the component level. DB-backed visibility syncing (via `widget_instances`) exists but full flow from DB on public page load still needs wiring. |
| Save before public/shared update | 🟡 | EditProfileDream saves before navigating to ViewProfile. Subtitle now explicitly says "Private builder". Quick-link to EditProfileDream added to CoreDream ProfileFace. |
| No fake actions | ✅ | Repo direction and docs explicitly reject fake buttons and fake states. |

## 7. Design language

| Rule | Status | Repo truth |
|---|---|---|
| Gold / light blue / white premium palette | ✅ | Theme docs and CSS tokens support this direction. |
| Minimal clutter | 🟡 | Many surfaces are visually rich; continued cleanup is still needed. |
| Intentional motion | 🟡 | Motion exists, but not every surface is equally restrained yet. |

## 8. Current alignment priorities

1. Wire public profile page to load actual saved widget visibility from DB (not just localStorage).
2. Continue folding remaining `components/widgets/*.tsx` file names into Dreams naming.
3. Repurpose extra legacy routes into spec-defined systems instead of keeping them as free-floating product names.
4. Tighten automatic SuperDreamWidget composition rules for profile output.
