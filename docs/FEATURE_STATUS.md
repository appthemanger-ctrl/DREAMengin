# DREAMengin Feature Status

Last updated: 2026-03-06  
Source of truth for product naming: `README.md`

Legend: ✅ implemented · 🟡 partial / mixed · ⏳ planned / not yet cleanly aligned

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
| DreamMenu | 🟡 | Menu systems exist in `components/menus/*`, `components/dreamnav/*`, and `components/HomeRadialNav.tsx`; naming is still mixed. |
| DreamDM | ✅ | `app/messages/page.tsx` and `app/api/messages/route.ts` exist. |
| DreamShop | ✅ | `app/shop/page.tsx` and `app/api/shop/route.ts` exist. |
| DreamMarketplace | ✅ | `app/marketplace/page.tsx` exists. |
| DreamAds | 🟡 | `app/ads/page.tsx` exists; user-owned DreamAds vs platform promotions still need clearer separation in code and UI language. |

## 5. AI triad

| AI | Status | Repo truth |
|---|---|---|
| Dr. Eams | ✅ | Canonical route exists at `/api/ai/eams`; legacy support routes still exist under `/api/dr-eams/*`. |
| IDARi | ✅ | `/api/ai/idari` exists. |
| TheBoogieMan.Ai | ✅ | `/api/ai/boogieman` exists. |

## 6. Privacy and profile integrity

| Rule | Status | Repo truth |
|---|---|---|
| Nothing public by default | 🟡 | This is the intended rule and is documented throughout the repo, but naming and projection boundaries still need cleanup. |
| Save before public/shared update | 🟡 | Edit/view split exists, but docs and some owner-facing profile flows still need stronger separation. |
| No fake actions | ✅ | Repo direction and docs explicitly reject fake buttons and fake states. |

## 7. Design language

| Rule | Status | Repo truth |
|---|---|---|
| Gold / light blue / white premium palette | ✅ | Theme docs and CSS tokens support this direction. |
| Minimal clutter | 🟡 | Many surfaces are visually rich; continued cleanup is still needed. |
| Intentional motion | 🟡 | Motion exists, but not every surface is equally restrained yet. |

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
