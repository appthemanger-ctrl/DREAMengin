# DREAMengin Feature Status

Last updated: 2026-03-25  
Source of truth for product naming: `README.md`

Legend: ✅ implemented · 🟡 partial / mixed · ⏳ planned / not yet cleanly aligned

**Current version:** v2.0.0 — DREAMengin as one coherent product  
**Previous phase:** Phase 8 — Real Runtime Completion (Points 1–100) — all 100 points ✅  
See `docs/dreamengin_phase8.md` for the full 100-point specification.

**Phase 8 progress: §A ✅ §B ✅ §C ✅ §D ✅ §E ✅ §F ✅ §G ✅ §H ✅ §I ✅ §J ✅**

## 1. Core surfaces

| Surface | Status | Repo truth |
|---|---|---|
| HomeDream | ✅ | Canonical route at `/homedream`; `/home` support route redirects here. |
| EditProfileDream | ✅ | Canonical route at `/edit-profiledream`; `/edit-profile` redirects here. Naming canonical throughout. |
| ViewProfile | ✅ | Canonical route at `/view-profile`; `/profile/[handle]` is the public projection. Projection boundaries wired via `lib/profile/projectionFilter.ts`. |

## 2. Dreams system

| Module | Status | Repo truth |
|---|---|---|
| DreamShell layer | ✅ | `components/dreams/DreamShell.tsx` exists. |
| Connector/Identity layer | ✅ | `components/dreams/DreamConnectorLayer.tsx` exists. |
| Feature layer | ✅ | `components/dreams/DreamFeatureLayer.tsx` exists. |
| Output/Projection layer | ✅ | `components/dreams/DreamOutputLayer.tsx` exists. |
| Legacy widget absorption into Dreams naming | ✅ | `components/widgets/*` repurposed; canonical term is Dream Window throughout UI/onboarding/docs. |
| Automatic Super Dream Window composition | ✅ | `components/dreams/SuperDreamWidget.tsx` composes compatible Dream Windows into named clusters with real add/remove/configure actions. |

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
| Legacy extra daydream routes | ✅ | `analytics`, `media-vault`, and `play` legacy routes repurposed or subordinated. |

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
| AI Triad coordination bus | ✅ | `lib/agents/agentBus.ts` now covers all three agents (Dr. Eams, IDARi, TheBoogieMan) with typed event channels (`dreamengin:eams`, `dreamengin:idari`, `dreamengin:boogieman`) and a unified `dreamengin:triad` bus. `runTriadConsensus` is the server-side gate. |

## 6. Privacy and profile integrity

| Rule | Status | Repo truth |
|---|---|---|
| Nothing public by default | ✅ | Enforced at data layer. `visibility_mappings` table consulted on ViewProfile before rendering any Dream Window. Default is `private`. |
| Save before public/shared update | ✅ | EditProfileDream has separate "Save Draft" (`handleSave`) and "Publish" (`handlePublish`) buttons with separate API calls. Visibility-change events logged by TheBoogieMan on save. |
| No fake actions | ✅ | `onOpenDrEams` empty handlers replaced with real `openDrEams`; marketplace "Request" buttons replaced with real navigation links. Phase 6 item 13 complete. |
| RLS on all user tables | ✅ | Full RLS audit complete (Phase 8 §I Point 77). All user-content tables have RLS enforced. |

## 7. Design language

| Rule | Status | Repo truth |
|---|---|---|
| Gold / light blue / white premium palette | ✅ | Theme docs and CSS tokens support this direction. |
| Minimal clutter | ✅ | v1-ui CSS no longer loaded globally; competing nav patterns removed. Surfaces use consistent de-surface / de-widget token system. |
| Intentional motion | ✅ | Motion restrained to CSS transitions and Framer Motion spring presets; no unbounded render loops on passive surfaces. |

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
12. ✅ Repurpose legacy Daydream routes (`analytics`, `media-vault`, `play`) — done. analytics is now a **real Analytics Daydream** surface (social media analytics for branding): `app/daydream/analytics/page.tsx` + `components/daydream/AnalyticsEngin.tsx`. media-vault → /daydream/create, play → /daydream/games.
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

## 10. Phase 8 — Real Runtime Completion

All 100 points tracked. §A–§D completed on prior passes. §E–§J completed 2026-03-24.

### §A — HomeDream Surface: Real Feed & Real Customization (Points 1–10)

| Point | Status | Repo truth |
|---|---|---|
| 1. Feed from real Supabase queries | ✅ | `lib/feed/useLiveFeed.ts` reads `feed_items` table; no static arrays. |
| 2. Connector feed items surface | ✅ | Connector items land in `feed_items` after user-triggered sync. |
| 3. Feed algorithm settings persist | ✅ | `/api/settings/feed` saves and restores feed settings. |
| 4. Dream Window layout persists | ✅ | `app/api/home-layout/route.ts` persists layout per user. |
| 5. Compact Dream Window rail | ✅ | DreamsSpacePanel swipeable rail implemented. |
| 6. Feed private by default | ✅ | No feed item on public surface without explicit publish event. |
| 7. Feed scroll independent from bar | ✅ | Separate scroll regions; Gold Button / DreamDM Bar do not scroll with feed. |
| 8. HomeDream is runtime root | ✅ | All navigation opens from HomeDream; no full-world reset. |
| 9. Dr. Eams real navigation | ✅ | `lib/ai/handlers/navigation.ts` resolves to real canonical routes. |
| 10. Dr. Eams real content | ✅ | Content queries hit real Supabase data filtered by visibility. |

### §B — Dream Window System: Full Lifecycle Activation (Points 11–22)

| Point | Status | Repo truth |
|---|---|---|
| 11. Dream Window lifecycle persisted | ✅ | `app/api/dream-windows/route.ts`; state transitions write to `dream_windows` table. |
| 12. All 10 required fields enforced | ✅ | API validates required fields; rejects incomplete records. |
| 13. Placement persists | ✅ | Spatial data (position, size, layout) saved and restored. |
| 14. Visibility RLS enforced | ✅ | RLS on `dream_windows` table; visibility = private/shared/public. |
| 15. Owner-only mutations | ✅ | `owner_id` checked at API layer; non-owner writes rejected. |
| 16. Actions produce real DB writes | ✅ | Add, remove, bind, collapse, expand all write to DB. |
| 17. SuperDreamWidget composition | ✅ | `components/dreams/SuperDreamWidget.tsx` with real composition rules. |
| 18. Legacy widget components absorbed | ✅ | `components/widgets/*` migrated to Dream Window model. |
| 19. widget-system-v2.ts removed | ✅ | `types/dream-window.ts` is single type authority. |
| 20. Layer model enforced | ✅ | Shell → Connector → Feature → Output enforced; no bypass. |
| 21. ViewProfile renders only shared projections | ✅ | `visibility_mappings` consulted before any render. |
| 22. Delete is atomic | ✅ | Single operation wipes DB row, visibility mapping, and projections. |

### §C — Edit ProfileDream Surface & View Profile Surface (Points 23–30)

| Point | Status | Repo truth |
|---|---|---|
| 23. Spatial controls save to DB | ✅ | Drag/resize/place saves; builder state restores on session load. |
| 24. Save Draft vs Publish distinct | ✅ | `handleSave` (draft) and `handlePublish` (explicit share) — separate DB calls. |
| 25. Gold save button active on changes | ✅ | Button reflects unsaved-change state. |
| 26. Publish updates visibility_mappings atomically | ✅ | Atomic upsert to `visibility_mappings` then triggers projection refresh. |
| 27. ViewProfile reads only projections | ✅ | Never reads live builder state directly. |
| 28. /profile/[handle] uses same projection path | ✅ | Shares projection read path with /view-profile. |
| 29. Projection failure defaults to empty | ✅ | Privacy-safe failure: renders nothing, logs ambiguity. |
| 30. Only Save Draft / Publish labels | ✅ | No other labels imply publication. |

### §D — DreamDM Surface: Real Persistence & Real-Time (Points 31–38)

| Point | Status | Repo truth |
|---|---|---|
| 31. Messages persist via Supabase Realtime | ✅ | `app/api/messages/route.ts`; Realtime subscription; ordered reads. |
| 32. Per-conversation RLS | ✅ | Migration `20260323000000_phase8d_messages_rls_enforce.sql`. |
| 33. Conversation list from DB | ✅ | No static conversations; loads from `messages` table. |
| 34. Dr. Eams compose routes to real DM | ✅ | Message lands in DB as real record. |
| 35. DreamDM Bar drag resizes regions | ✅ | Functional drag gesture; both regions resize in real time. |
| 36. Draft content persists locally | ✅ | Draft saved to local state; restored on return. |
| 37. Notifications reflect real events | ✅ | `lib/dreamdm/useNotifications.ts`; sourced from real DB queries. |
| 38. Unread count reflects DB state | ✅ | Badge count recalculates on new messages via Realtime. |

### §E — DreamShop & DreamMarketplace: Real Listings (Points 39–46)

| Point | Status | Repo truth |
|---|---|---|
| 39. DreamShop real listings from DB | ✅ | `app/shop/page.tsx` queries `merch` table; no static items. |
| 40. Shop item create saves to DB | ✅ | `app/shop/sell/page.tsx` inserts to `merch`; returns on reload. |
| 41. Order history private, RLS enforced | ✅ | Migration `20260324000000_phase8e_orders.sql`; buyer-only SELECT RLS. |
| 42. DreamMarketplace real listings | ✅ | `app/marketplace/page.tsx` queries `marketplace_items` with RLS. |
| 43. Marketplace slot detail from real DB | ✅ | `app/marketplace/[id]/page.tsx` reads real record; notFound() on miss. |
| 44. Public listings accessible to auth users | ✅ | `is_published = true` filter; private notes/orders remain private. |
| 45. Sell flow creates real listing | ✅ | `/shop/sell` inserts to `merch`; redirects to `/shop` on success. |
| 46. Marketplace request routes to real action | ✅ | "Contact Seller" links to `/messages?to={seller_id}` (DreamDM compose). |

### §F — Daydream Surface Network: Deep Activation (Points 47–58)

| Point | Status | Repo truth |
|---|---|---|
| 47. All 6 Daydream Surfaces render real content | ✅ | No "coming soon" or placeholder content on any Daydream page. |
| 48. All 6 Engins write to daydream_states | ✅ | useDaydreamState wired in DaydreamShell (all 6 via sideBComponent). |
| 49. Daydream workspace state persists | ✅ | markVisited + persistState called on every Daydream mount. |
| 50. Back-navigation preserves context | ✅ | useDaydreamState tracks side; restores on return. |
| 51. StarMakerEngin persists creative output | ✅ | persistState saves bpm/key/pitch; publish writes to music_releases. |
| 52. GameEngin game loop playable, scores persist | ✅ | game_scores table; /api/game-scores; MADMAXI playable. |
| 53. LabEngin accepts input, produces stored output | ✅ | physics_experiments readable; simulation emits via bridge. |
| 54. CodeEngin editor state persists | ✅ | persistState saves cells; localStorage also backed up. |
| 55. BrandingEngin brand kit stored | ✅ | persistState saves assets array to daydream_states. |
| 56. ContentEngin drafts save to DB | ✅ | saveDraft calls POST /api/drafts (content_drafts table). |
| 57. Multi-connection: Music → ContentEngin | ✅ | ContentEngin subscribes to music:stem-ready; bridge connect active. |
| 58. All 6 Daydreams accessible from DreamSpace | ✅ | DreamsSpacePanel Daydreams tab links all 6 live routes. |

### §G — Gold Button, Dual Runtime & Navigation Feel (Points 59–68)

| Point | Status | Repo truth |
|---|---|---|
| 59. Gold Button left menu — 6 Daydream tiles | ✅ | All 6 route to live Daydream surfaces. |
| 60. Gold Button right menu — real items | ✅ | DreamMenu opens with real nav; Dr. Eams active. |
| 61. Single/double tap Gold Button spec | ✅ | Per GOLD_BUTTON_DUAL_RUNTIME spec. |
| 62. Gold Button attachment spec-compliant | ✅ | Attaches to top of DreamDM Bar. |
| 63. Dual runtime persists to localStorage | ✅ | `lib/runtime/useDualRuntimePersistence.ts` serializes/restores state. |
| 64. Navigation feels like depth | ✅ | No full-page reload; context preserved on surface transitions. |
| 65. Back-navigation restores prior surface | ✅ | State preserved where technically feasible. |
| 66. Cross-runtime connection bus active | ✅ | ContentEngin ↔ StarMakerEngin via dualRuntimeBridge music channel. |
| 67. Smooth runtime transitions | ✅ | Transition respects DreamDM Bar drag velocity. |
| 68. DreamSpace renders real Dream Windows | ✅ | DreamsSpacePanel shows real browsable Dream Windows. |

### §H — AI Triad: Consensus, Real Results & Security (Points 69–76)

| Point | Status | Repo truth |
|---|---|---|
| 69. Triad consensus gate used in critical path | ✅ | `delete-dream` calls `runTriadConsensus`; blocks on TRIAD_BLOCKED (403). |
| 70. Dr. Eams navigation results real | ✅ | `lib/ai/handlers/navigation.ts` verified routes. |
| 71. Dr. Eams content results real | ✅ | Content queries hit Supabase; filtered by visibility permissions. |
| 72. BoogieMan enforces nothing-public-by-default | ✅ | `/api/ai/boogieman/privacy-event` logs and blocks privacy violations. |
| 73. IDARi admin-only | ✅ | `/api/ai/idari` has IDARI_PASSWORD + role guard; 15 guard tests. |
| 74. No AI API key in NEXT_PUBLIC_ | ✅ | Only Supabase URL/anon key in NEXT_PUBLIC_; all AI keys server-side. |
| 75. AI rate limit unified | ✅ | `check_ai_rate_limit` RPC + `ai_rate_limits` table; no legacy refs. |
| 76. Legacy Dr. Eams routes preserved passively | ✅ | `/api/dr-eams/run` and `/api/dr-eams/hf` exist as support routes only. |

### §I — Data Integrity, RLS & Settings (Points 77–88)

| Point | Status | Repo truth |
|---|---|---|
| 77. Full RLS audit complete | ✅ | All user-content tables have RLS; no app-layer-only checks. |
| 78. connector_accounts.token_blob never to browser | ✅ | Confirmed: token_blob excluded from all connector API SELECT. |
| 79. SERVICE_ROLE_KEY not in client bundle | ✅ | Server-only; never in NEXT_PUBLIC_. |
| 80. API routes check auth before DB query | ✅ | All routes call getUser(); reject before query on 401. |
| 81. Notifications from real events | ✅ | `lib/dreamdm/useNotifications.ts`; Realtime + DB sourced. |
| 82. Follower/following counts from real DB | ✅ | `follows` table; no hardcoded approximations. |
| 83. Appearance settings save to DB | ✅ | `/api/settings/appearance`; page loads from DB on mount, saves on change. |
| 84. Privacy settings save to DB | ✅ | `/api/settings/privacy`; each toggle writes to settings table. |
| 85. Connectors management end-to-end | ✅ | `/api/connectors/[provider]` routes for connect/verify/sync/disconnect. |
| 86. Data export end-to-end | ✅ | `/api/account/export-data` returns downloadable JSON of all user data. |
| 87. Account deletion end-to-end | ✅ | `/api/account/delete-dream` removes all data + auth identity. |
| 88. All toggles persist through Supabase | ✅ | Privacy + appearance toggles write to settings table via API. |

### §J — Phase 8 Acceptance Criteria (Points 89–100)

| Point | Status | Notes |
|---|---|---|
| 89. HomeDream feed from real Supabase | ✅ | feed_items table + connector sync |
| 90. Every Dream Window has real data + RLS | ✅ | dream_windows table + visibility_mappings |
| 91. All 6 Daydream Surfaces + Engins real | ✅ | useDaydreamState + persistState active |
| 92. Daydream workspace state persists | ✅ | markVisited + persistState; no silent work loss |
| 93. DreamShop + Marketplace real + RLS | ✅ | merch + marketplace_items + orders tables |
| 94. DreamDM via Supabase Realtime + per-conv RLS | ✅ | messages table + RLS migration |
| 95. Spatial navigation model functional end-to-end | ✅ | Gold Button + DreamDM Bar + dual runtime persistence |
| 96. Settings end-to-end | ✅ | appearance + privacy + export + delete all work |
| 97. AI Triad consensus gate + rate limiting + no key exposure | ✅ | runTriadConsensus in delete-dream; check_ai_rate_limit RPC |
| 98. Residual audit: zero open residuals | ✅ | BUGS.md shows 0 Partly Done, 0 Needs Work |
| 99. BUGS.md reflects zero open items | ✅ | Auto-generated by update-bugs.mjs |
| 100. New user can navigate, produce, and persist real work | ✅ | All surfaces live; all actions real; all data private by default |

