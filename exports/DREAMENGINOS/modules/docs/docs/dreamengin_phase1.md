# DREAMengin — Phase 1 of 7: Core Foundation

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


Status: active  
Last updated: 2026-03-10

This document defines Phase 1 of the 7-phase DREAMengin build plan. All requirements here
are derived directly from `README.md` (the master product spec). This file is the build
target referenced by the Phase 1 issue.

---

## 1. The 7-Phase Build Plan

| Phase | Title | README Sections | Scope |
|-------|-------|----------------|-------|
| **1 — Foundation** | Core Foundation | §1, §2, §4.2, §14, §17, §20, §22, §25 | Auth, routing backbone, HomeDream shell, Gold Button nav, base theme |
| 2 — HomeDream | Private OS Surface | §4 (full) | Real feed, Dreams widget system, HomeDream customization controls |
| 3 — Profile | EditProfileDream → ViewProfile | §5, §6, §15 | Drag/resize widgets, visibility toggles, preview-before-save, projection system |
| 4 — Daydream Pairs | All 6 Daydream + Engin surfaces | §7–§13 | Side A + Side B Engin with real tools for all 6 domain pairs |
| 5 — Platform Modules | DreamShop / Marketplace / DM / Ads | §16–§19 | Real commerce, messaging, ad slots |
| 6 — AI Triad | Dr. Eams / IDARi / TheBoogieMan | §24 | Context-sensitive help, admin tools, policy enforcement |
| 7 — Launch Standard | Polish + README §25 compliance | §25, §26 + BUGS.md | RLS hardening, performance, zero fake buttons, no legacy pollution |

---

## 2. Phase 1 Definition — Requirements

Phase 1 = the skeleton layer. Every subsequent phase depends on Phase 1 being solid,
correctly named, and architecturally sound.

### P1-R1: Auth and Entry Flow (Real, End-to-End)

- [ ] Landing page (`/`) — presents DREAMengin identity clearly
- [ ] Sign up (`/join`) — creates real Supabase user, redirects to `/homedream`
- [ ] Sign in (`/login`) — authenticates real user, redirects to `/homedream`
- [ ] OAuth (Google, GitHub) — working
- [ ] Logout — clears session, redirects to `/`
- [ ] Auth callback (`/auth/callback`) — handles OAuth return
- [ ] Password reset — working flow

### P1-R2: Route Backbone — Canonical Names Are Primary

All canonical spec routes must resolve to real content (not dead ends):

- [ ] `/homedream` — HomeDream (private OS surface)
- [ ] `/edit-profiledream` — EditProfileDream (profile builder)
- [ ] `/view-profile` — ViewProfile (real preview surface, not just a redirect)
- [ ] `/daydream/music` — Music Daydream
- [ ] `/daydream/games` — Games Daydream
- [ ] `/daydream/lab` — Lab Daydream
- [ ] `/daydream/code` — Code Daydream
- [ ] `/daydream/brand` — Brand Daydream
- [ ] `/daydream/create` — Create Daydream
- [ ] `/shop` — DreamShop
- [ ] `/marketplace` — DreamMarketplace
- [ ] `/messages` — DreamDM
- [ ] `/ads` — DreamAds
- [ ] Legacy routes (`/home`, `/edit-profile`, `/u/[handle]`) redirect to canonical routes

### P1-R3: HomeDream Shell (Private, Persistent, Auth-Gated)

- [ ] Route requires auth — redirect to `/login` if unauthenticated
- [ ] Persistent Gold Button navigation present
- [ ] Single tap → go home
- [ ] Double tap → open dual menus
- [ ] Left menu (DreamRadialMenu) — 6 Daydream navigation items with spec-correct labels
- [ ] Right menu (SystemRadialMenu) — settings, account, Dr. Eams
- [ ] Dr. Eams panel accessible from right menu
- [ ] Private by default — no HomeDream content visible to unauthenticated users

### P1-R4: DreamMenu — Both Sides Working, Correctly Named

Left menu must navigate to all 6 canonical Daydream routes with spec names:
- [ ] Music → `/daydream/music`
- [ ] Games → `/daydream/games`
- [ ] Lab → `/daydream/lab`
- [ ] Code → `/daydream/code`
- [ ] Brand → `/daydream/brand`
- [ ] Create → `/daydream/create`
- [ ] No non-canonical routes (`analytics`, `media-vault`, `play`) in the menu

Right menu must have:
- [ ] Account → `/edit-profiledream`
- [ ] Settings → `/settings`
- [ ] Dr. Eams entry point (opens DrEamsPanel inline)

### P1-R5: Base Theme Applied Everywhere

- [ ] Gold (`de-gold`, `#F5C842` / `#c8981a`) = actions, save, confirm, premium emphasis
- [ ] Light blue (`de-sky`, `#64B5F6` / `#2a8ab8`) = connected, live, signal
- [ ] White = base surface
- [ ] Space Grotesk font applied globally
- [ ] Design tokens consistent: landing, login, join, HomeDream, settings

### P1-R6: Privacy Rules Enforced at Route Level

- [ ] HomeDream: auth-gated
- [ ] EditProfileDream: auth-gated
- [ ] Settings: auth-gated
- [ ] ViewProfile / `/profile/[handle]`: public, shows ONLY saved output
- [ ] Nothing auto-publishes on first account creation

### P1-R7: Onboarding Connected

- [ ] After signup → `/homedream` (first-run experience or tip shown)
- [ ] Onboarding page (`/onboarding`) reachable and connected

### P1-R8: No Fake Buttons / No Dead Ends (README §1.2)

- [ ] Every link, button, and nav item does something real
- [ ] No placeholder pages with "coming soon" that never connect
- [ ] All 6 Daydream routes render a real shell (not a blank page)

### P1-R9: Complete Daydream + Engin Component Coverage

- [ ] All 6 Side A Daydream route pages exist and render a real shell
- [ ] All 6 Side B Engin components exist (`StarMakerEngin`, `GameEngin`, `LabEngin`, `CodeEngin`, `BrandingEngin`, `ContentEngin`)
- [ ] Each Side B Engin component is wired into its corresponding Daydream page

---

## 3. Phase 1 Deliverables Checklist

### Completed ✅

- [x] Landing page (`/`) with DREAMengin identity
- [x] Auth flow: signup, login, OAuth, logout, password reset (`/join`, `/login`, `/auth/callback`, `/auth/reset-password`)
- [x] `/homedream` canonical route — auth-gated, Gold Button nav, dual menus
- [x] Gold Button navigation: single tap (go home), double tap (open menus)
- [x] DreamRadialMenu (left) — all 6 Daydream routes, correct labels
- [x] SystemRadialMenu (right) — settings, account, Dr. Eams panel
- [x] `/edit-profiledream` canonical route — working profile builder
- [x] All 6 Daydream Side A routes: music, games, lab, code, brand, create
- [x] DreamShop (`/shop`), DreamMarketplace (`/marketplace`), DreamDM (`/messages`), DreamAds (`/ads`)
- [x] Base theme tokens: gold, light blue, white, Space Grotesk
- [x] Legacy route redirects: `/home` → `/homedream`, `/edit-profile` → `/edit-profiledream`, `/u/[handle]` → `/profile/[handle]`
- [x] Settings section (account, algorithm, appearance, controls, data, feed, help, notifications, privacy, safety, security, widgets)
- [x] Dream layer components: DreamShell, DreamConnectorLayer, DreamFeatureLayer, DreamOutputLayer
- [x] 5 of 6 Engin Side B components: StarMakerEngin, LabEngin, CodeEngin, BrandingEngin, ContentEngin
- [x] `docs/dreamengin_phase1.md` — this file

### Completed this session ✅

- [x] `/view-profile` — converted from redirect-only to real preview surface with "Return to EditProfileDream" action
- [x] `GameEngin.tsx` — created missing Side B component to complete all 6 Engin pairs

### Remaining 🔲

- [ ] Verify onboarding first-run tip shown to new users on HomeDream
- [ ] Verify non-canonical daydream routes (`analytics`, `media-vault`, `play`) are not promoted in any nav
- [ ] Confirm all 6 Daydream shells are non-blank (visual verification)
- [ ] All items from P1-R1 through P1-R9 above verified in production

---

## 4. Relationship to Other Docs

| Document | Relationship |
|----------|-------------|
| `README.md` | Master product spec — Phase 1 requirements are derived from it |
| `docs/FEATURE_STATUS.md` | Live completion matrix — update as Phase 1 items complete |
| `docs/AGENT_PLAYBOOK.md` | Session guide — canonical names, commands, file map |
| `docs/GENERATION_LAW.md` | Build constraint — compute χ before every generation pass |
| `docs/BUGS.md` | Residual log — file any failing Phase 1 item here |
| `docs/ARCHITECTURE.md` | Layer definitions — Architecture residuals checked against this |

---

## 5. Phase 1 → Phase 2 Handoff Criteria

Phase 2 (HomeDream — Real Private Feed) may begin when all of the following are true:

1. All P1-R1 through P1-R9 items are checked off
2. `pnpm typecheck` exits 0
3. `pnpm exec vitest run` — all tests pass
4. `pnpm build` succeeds
5. `/homedream`, `/edit-profiledream`, and `/view-profile` have been visually verified
6. No open items in `docs/BUGS.md` that block Phase 1 routes
