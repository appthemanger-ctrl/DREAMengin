# DREAMengin — Feature Status

> **Owner:** appthemanger-ctrl  
> **Last updated:** 2026-03-05  
> **Legend:** ✅ Done · 🔶 Partly done · 🔲 Needs work · ⬆️ Needs upgrade

See `docs/HANDOFF.md` for the change timeline and open priorities.

---

## 1. Platform Foundation

| Feature | Status | Notes |
|---------|--------|-------|
| Next.js App Router scaffold | ✅ Done | v16.1.6, TypeScript strict |
| Tailwind + Space Grotesk font | ✅ Done | Design tokens in `globals.css` |
| Blue + gold gradient theme | 🔶 Partly done | Tokens defined; not fully applied to all pages yet |
| Mobile-first viewport | 🔶 Partly done | Root layout has `viewport` export; game page needs `userScalable: false` |
| Dark-mode support | 🔶 Partly done | CSS vars in place; not all components respect them |
| PWA manifest | ✅ Done | `public/manifest.json` |
| Performance / battery-aware rendering | 🔶 Partly done | Game loop throttles; general app idle-throttling pending |

---

## 2. Authentication

| Feature | Status | Notes |
|---------|--------|-------|
| Email + password sign-in | ✅ Done | `app/login/page.tsx` via Supabase |
| Email + password sign-up | ✅ Done | `app/join/page.tsx` |
| Google OAuth | ✅ Done | `supabase.auth.signInWithOAuth` |
| GitHub OAuth | ✅ Done | `supabase.auth.signInWithOAuth` |
| Auth callback route | ✅ Done | `app/auth/callback/route.ts` |
| Session refresh proxy | ✅ Done | `proxy.ts` (Next.js 16 edge proxy) |
| Dev auth bypass | ✅ Done | `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` |
| Supabase env-var resolution | ✅ Done | `lib/supabase/env.ts` — accepts all naming conventions |
| Password reset flow | 🔲 Needs work | Route exists but UI not built |
| "Remember me" | ✅ Done | localStorage-backed |
| Persistent session (SSR) | ✅ Done | SSR cookies via server client |

---

## 3. Home Space

| Feature | Status | Notes |
|---------|--------|-------|
| Widget surface grid | 🔶 Partly done | Layout exists; drag-to-reorder not wired |
| Golden Button (two floating nav buttons) | ✅ Done | `DreamNavControls.tsx` + state machine |
| Locked / unlocked mode | ✅ Done | Tested in `tests/home-buttons.test.ts` |
| Magnetic snap / gravity drift | ✅ Done | Physics in state machine |
| Edit mode (drag-to-reorder widgets) | 🔶 Partly done | Banner + context exist; actual drag not implemented |
| Feed widget | 🔶 Partly done | Widget renders; feed data is demo-only |
| Home reset (tap to go home) | ✅ Done | Single-tap unlocked button |

---

## 4. Navigation

| Feature | Status | Notes |
|---------|--------|-------|
| τ-navigation (spatial state transitions) | 🔶 Partly done | Discrete model implemented; continuous manifold pending |
| Daydreams menu (7 dreams) | ✅ Done | Routes + pages scaffolded |
| System menu | ✅ Done | Dr. Eams, Settings, Account, Go Home |
| Deep-link routes | ✅ Done | All major routes exist |
| Swipe navigation | 🔲 Needs work | Spec'd; not yet implemented on mobile |
| Back-navigation / history | 🔶 Partly done | Browser back works; spatial context not preserved |

---

## 5. Profile

| Feature | Status | Notes |
|---------|--------|-------|
| Private profile editor | ✅ Done | `/edit-profile` — name, handle, avatar, bio |
| Public profile mirror | ✅ Done | `/profile/[handle]` and `/u/[handle]` |
| Avatar upload | 🔶 Partly done | Upload UI exists; Supabase storage wiring needs test |
| Follow / unfollow | 🔶 Partly done | API route exists; UI not wired |
| Public-only widget display | 🔶 Partly done | Logic exists; not fully enforced |

---

## 6. Feed

| Feature | Status | Notes |
|---------|--------|-------|
| Feed resolver | 🔶 Partly done | `lib/widgets/feed-resolver.ts`; demo data only |
| Feed API route | ✅ Done | `app/api/widgets/feed/route.ts` |
| Feed settings | 🔶 Partly done | UI at `/feed-settings`; slices not saved to DB |
| Post creation | 🔶 Partly done | `CreatePostModal.tsx` exists; full publish flow needs work |
| Likes | 🔶 Partly done | API route exists; real-time count not wired |
| Comments | 🔲 Needs work | Not yet built |
| Feed card UI | ✅ Done | `FeedCard.tsx` + `MobileFeedCard.tsx` |

---

## 7. Daydreams (7 spaces)

| Daydream | Status | Notes |
|----------|--------|-------|
| Music Studio | 🔶 Partly done | Page + audio recorder; not connected to feed/publish |
| Media Vault | 🔶 Partly done | Scaffold page; upload not wired |
| Create | 🔶 Partly done | Ideas/tasks UI; no persistence |
| Brand | 🔶 Partly done | Profile + analytics stub |
| Analytics | 🔶 Partly done | Charts component exists; real data pending |
| Games | ✅ Done | Dr. Eams platformer fully playable |
| Play | 🔶 Partly done | Player UI exists; queue/playlist not wired |

---

## 8. Games Daydream — Dr. Eams Platformer

| Feature | Status | Notes |
|---------|--------|-------|
| 3-level game engine | ✅ Done | Pure logic in `lib/game/dreamengin-game.ts` |
| Canvas 2D renderer | ✅ Done | `DrEamsGameCanvas.tsx` |
| Character sprites (assembled from parts) | ✅ Done | head, coat, arms, shoes |
| Enemy (BoogieMan) | ✅ Done | Patrol AI, stomp mechanic |
| Coins + goal star | ✅ Done | Collect all coins → reach star |
| Particles | ✅ Done | Coin burst, death burst |
| HUD (score, lives, level) | ✅ Done | |
| Keyboard controls | ✅ Done | Arrow keys / WASD + Space |
| Dual-joystick touch controls | ✅ Done | Left = move, right = directional actions |
| Duck action | ✅ Done | Right stick down / ArrowDown / S |
| Spin action (power-up ready) | ✅ Done | Right stick left |
| Shoot action (power-up ready) | ✅ Done | Right stick right |
| PS5 DualSense Gamepad API | ✅ Done | Left stick move, right stick actions, L2/R2 |
| Pinch-zoom disabled | ✅ Done | `touchAction: none` + viewport meta |
| Double-jump | ✅ Done | |
| Moving platforms | ✅ Done | |
| Game over / victory screens | ✅ Done | |
| Haptic feedback (DualSense) | 🔲 Needs work | Gamepad vibration API not yet wired |
| Power-ups (spin/shoot effects) | 🔲 Needs work | Inputs wired; visual effects + logic pending |
| Leaderboard | 🔲 Needs work | Score exists; no persistence |
| More levels / worlds | 🔲 Needs work | 3 levels done; more planned |

---

## 9. AI Triad

| Feature | Status | Notes |
|---------|--------|-------|
| Dr. Eams chat panel | ✅ Done | `DrEamsPanel.tsx`; system menu accessible |
| Dr. Eams API route | ✅ Done | `POST /api/ai/eams` |
| IDARi admin optimizer | ✅ Done | `POST /api/ai/idari` — admin only |
| BoogieMan policy engine | ✅ Done | `POST /api/ai/boogieman` — full 100-rule policy |
| Consensus gating | ✅ Done | All 3 must approve major updates |
| Dr. Eams voice assistant | 🔶 Partly done | Component exists; not wired to speech API |
| AI rate limiting | ✅ Done | `lib/ai/rate-limiter.ts` |
| AI audit logging | ✅ Done | `lib/ai/audit.ts` |
| Idempotency | ✅ Done | `lib/ai/idempotency.ts` |

---

## 10. Shop & Marketplace

| Feature | Status | Notes |
|---------|--------|-------|
| Shop page | 🔶 Partly done | UI scaffold at `/shop`; no payment integration |
| Marketplace | 🔶 Partly done | Browse page exists; purchase flow not built |
| Widget marketplace | 🔲 Needs work | Spec'd in WIDGET_SYSTEM_V2.md; not built |
| Sell page | 🔶 Partly done | Form exists; no backend |
| Payments (Stripe / etc.) | 🔲 Needs work | Not started |

---

## 11. Settings

| Feature | Status | Notes |
|---------|--------|-------|
| Profile settings | ✅ Done | `/edit-profile` |
| Feed settings | 🔶 Partly done | UI exists; not persisted |
| Appearance / Theme | 🔶 Partly done | Gradient presets UI; not all pages themed |
| Connectors | 🔶 Partly done | YouTube + demo; IG/Spotify pending |
| Controls (home button gestures) | ✅ Done | `/settings/controls` |
| Privacy | 🔶 Partly done | Page exists; blocking/appeals not wired |
| Data export / delete | ✅ Done | API routes + UI |
| Account delete | ✅ Done | Full account deletion flow |
| Help / wizard | 🔶 Partly done | Page exists; Dr. Eams integration pending |

---

## 12. Admin Panel

| Feature | Status | Notes |
|---------|--------|-------|
| Admin lockout system | ✅ Done | Permanent lockout after 1 wrong attempt |
| Admin unlock key | ✅ Done | `ADMIN_UNLOCK_KEY` env var |
| AI chat (admin) | ✅ Done | `/api/admin/ai-chat` |
| Code file browser | ✅ Done | `/api/admin/code-files` |
| InnerDreams (AI bug-fix) | 🔶 Partly done | Routes exist; demo mode only |
| Setup health check | ✅ Done | `GET /api/setup/check` — reports all env var status |

---

## 13. Security & Policy

| Feature | Status | Notes |
|---------|--------|-------|
| Supabase RLS | ✅ Done | All user tables |
| BoogieMan policy (100 rules) | ✅ Done | `lib/ai/boogieman.ts` |
| Policy tests | ✅ Done | `tests/boogieman.test.ts` |
| Appeal endpoint | ✅ Done | `POST /api/appeal` |
| Policy health status | ✅ Done | `GET /api/ai/boogieman/status` |
| Secrets scanning (CI) | ✅ Done | Gitleaks in CI |
| Domain block (theboogieman.ai) | ✅ Done | Edge proxy blocks host header |
| CSRF / open-redirect protection | ✅ Done | Auth callback validates `next` param |

---

## 14. Theme & Design System

| Feature | Status | Notes |
|---------|--------|-------|
| Blue + gold design tokens | ✅ Done | `tailwind.config.ts` + `globals.css` |
| Space Grotesk font | ✅ Done | |
| Frosted glass surfaces | ✅ Done | `.de-surface`, `.de-card` CSS classes |
| Blue + gold gradient across all pages | 🔶 Partly done | Game + landing themed; Daydreams need it |
| Premium gradient headings | ✅ Done | `.de-gradient-text` |
| Mobile-first responsive layout | ✅ Done | All pages use Tailwind responsive breakpoints |
| Pinch-zoom disabled in game | ✅ Done | Viewport meta + `touchAction: none` |
| Consistent radius family | ✅ Done | 6/10/14/18/24/32/9999px only |

---

## Upgrade Priorities (in order)

1. ⬆️ **Blue + gold gradient** — apply uniformly to all Daydream pages, Shop, Marketplace, Settings
2. ⬆️ **Feed system** — connect feed resolver to real DB data; real-time updates
3. ⬆️ **Daydream entry loops** — each of the 7 needs ≥1 real interaction
4. ⬆️ **Swipe navigation** — implement spatial swipe gestures for mobile
5. ⬆️ **Game power-ups** — activate spin + shoot with visual effects
6. ⬆️ **PS5 haptics** — Gamepad vibration API on stomp/coin
7. ⬆️ **Music Studio pipeline** — record → upload → publish to feed
8. ⬆️ **Shop / payments** — Stripe integration
9. ⬆️ **Leaderboard** — persist game scores to Supabase
