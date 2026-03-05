# DREAMengin — Bug Report

**Format:** IDARi-style live bug log  
**Policy:** Per `docs/LAW.md §9` — when a bug is **fixed**, **remove its entry from this file**.  
This file must only contain **open, unresolved bugs**. Fixed bugs live in git history.  
**Last updated:** 2026-03-05  
**Branch:** `copilot/add-video-background-to-landing-page`

---

## How to use this file

| Action | What to do |
|--------|-----------|
| Bug found | Add an entry with ID, severity, file, description, repro |
| Bug fixed | **Delete the entry** — do not leave it marked "fixed" |
| Not sure if fixed | Leave it, add a "Needs verify" note |

---

## Open Bugs

---

### BUG-002 · `example.spec.ts` selector mismatch — **High**

| Field | Value |
|-------|-------|
| File | `tests/example.spec.ts` |
| Line | 7 |
| Severity | High — CI test fails silently |
| Status | Open |

**Description:**  
`page.fill('[name="email"]', ...)` is used but the login form input has `id="email"`, not `name="email"`. The selector never matches; the test always fails or silently no-ops.

**Repro:**  
```bash
pnpm test tests/example.spec.ts
```
Fails with: element not found for selector `[name="email"]`.

**Fix:**  
Change selector to `#email` or `input[type="email"]`.

---

### BUG-003 · `HeroSprite` — responsive Tailwind sizing overridden by inline style — **Medium**

| Field | Value |
|-------|-------|
| File | `components/HeroSprite.tsx` lines 302–313 |
| Severity | Medium — sprite always 288 px; `sm:h-72 sm:w-72` has no effect |
| Status | Open |

**Description:**  
`HeroSprite` receives a `className` prop (e.g. `"h-56 w-56 sm:h-72 sm:w-72"`) that is applied to the `<canvas>` element. However the same canvas also has `style={{ width: 288, height: 288 }}`. Inline styles have higher CSS specificity than Tailwind utility classes, so the responsive breakpoint sizes are ignored. The canvas is always 288 × 288 px on all screen sizes.

**Fix:**  
Remove `style.width` / `style.height` from the canvas and rely entirely on the `className` prop (and set canvas pixel resolution via `dpr` scaling only), **or** remove the `className` passthrough and handle sizing via the wrapper `<div>`.

---

### BUG-004 · Multiple pages use `bg-background` / `bg-slate-*` — violates design system — **Medium**

| Field | Value |
|-------|-------|
| Files | `app/ads/create/page.tsx`, `app/ads/page.tsx`, `app/ads/slot/[id]/page.tsx`, `app/analytics/page.tsx`, `app/global-error.tsx` |
| Severity | Medium — visual inconsistency, violates SPEC.md §1.1 and §9 |
| Status | Open |

**Description:**  
These pages use `bg-background`, `bg-slate-50`, `bg-slate-950`, etc. instead of the design-system `de-sky-bg` / `dream-bg` gradient. They appear as grey/white pages that don't match the sky-blue + gold identity.

**Affected pages (from FEATURE_STATUS.md "Upgrade Priorities"):**  
`/create`, `/shop/sell`, `/music`, `/music/upload`, `/settings/account`, `/settings/security`, `/settings/notifications`, `/ads/create`, `/lab/new`

**Fix:**  
Replace `bg-background` / `bg-slate-*` with `de-sky-bg` wrapper + `de-widget` cards per SPEC.md §2.1.

---

### BUG-005 · `global-error.tsx` uses dark Slate design — **Low**

| Field | Value |
|-------|-------|
| File | `app/global-error.tsx` |
| Severity | Low — only shown on catastrophic render errors |
| Status | Open |

**Description:**  
`global-error.tsx` uses `bg-slate-50 dark:bg-slate-950` and slate button styles. If a user ever sees this screen, it looks completely different from the rest of the app.

**Fix:**  
Apply `de-sky-bg` and `de-btn de-btn-primary` / `de-btn-ghost` to match the design system.

---

### BUG-006 · `discover` page uses 21 mock profiles, not real DB data — **Medium**

| Field | Value |
|-------|-------|
| File | `app/discover/page.tsx` |
| Severity | Medium — users never see real people |
| Status | Open |

**Description:**  
`MOCK_PROFILES` array (21 hardcoded fake profiles) is rendered instead of querying the `profiles` table from Supabase. Discover is effectively non-functional for a real deployment.

**Fix:**  
Replace `MOCK_PROFILES` with a Supabase query: `SELECT id, handle, display_name, bio, avatar_url FROM profiles WHERE visibility = 'public' LIMIT 50`.

---

### BUG-007 · `FollowOnboarding` + `AlgorithmEngine` persist to `localStorage` only — **Medium**

| Field | Value |
|-------|-------|
| Files | `components/feed/FollowOnboarding.tsx`, `components/feed/AlgorithmEngine.tsx` |
| Severity | Medium — user preferences lost on device change / private browsing |
| Status | Open |

**Description:**  
Both components store user preferences in `localStorage`. Preferences are not synced to Supabase, so they are lost when the user switches device, clears browser storage, or uses a private window.

**Fix:**  
Write preferences to a `user_feed_prefs` / `user_follow_settings` Supabase table on save. See HANDOFF.md open issue #3 and #4.

---

### BUG-008 · `ProfileCanvas` widget drag-to-reorder not implemented — **Low**

| Field | Value |
|-------|-------|
| File | `components/profile/ProfileCanvas.tsx` |
| Severity | Low — drag handles are visible in the UI but do nothing |
| Status | Open |

**Description:**  
The profile canvas shows drag handle icons on widget slots but `@dnd-kit/core` is not installed and no drag logic is wired. Tapping/dragging the handles has no effect — confusing for users (violates AXIOM 1).

**Fix:**  
Either install `@dnd-kit/core` and implement drag-to-reorder, **or** hide the drag handle icon until the feature is ready (preferred short-term fix to avoid dead affordances).

---

### BUG-009 · Music Studio `SoundRecorder` not connected to feed publish — **Low**

| Field | Value |
|-------|-------|
| File | `components/music/SoundRecorder.tsx` |
| Severity | Low — record + download works, publish does not |
| Status | Open |

**Description:**  
`SoundRecorder` supports record / pause / stop / playback / download as `.webm`. However, there is no upload-to-Supabase-Storage or publish-to-feed path. The "publish" action (if shown) goes nowhere.

**Fix:**  
Add upload step: `supabase.storage.from('user_uploads').upload(...)` then insert a row to `app_posts` with `media_url`. See HANDOFF.md open issue #6.

---

### BUG-010 · Game leaderboard scores not persisted to Supabase — **Low**

| Field | Value |
|-------|-------|
| File | `components/dreamengin/DrEamsGameCanvas.tsx` |
| Severity | Low — score exists in-game only, lost on page reload |
| Status | Open |

**Description:**  
The Dr. Eams platformer tracks score in component state but never writes it to a `leaderboard` or `game_scores` Supabase table. Scores are lost on page reload.

**Fix:**  
On game-over or level-complete, call a server route `POST /api/game/score` that inserts `{ user_id, score, level, timestamp }`.

---

### BUG-011 · `tests/example.spec.ts` references `/profile/jose` — non-existent profile — **Low**

| Field | Value |
|-------|-------|
| File | `tests/example.spec.ts` line 13 |
| Severity | Low — test always fails in clean environment |
| Status | Open |

**Description:**  
`page.goto('/profile/jose')` and `expect(page.locator('text=Jose')).toBeVisible()` will always fail because there is no profile with handle `jose` in any real database. Test was written against a dev fixture that doesn't exist.

**Fix:**  
Either seed a test profile in a `beforeAll` block, or replace with a test that checks the page renders a "Profile not found" state gracefully.

---

### BUG-012 · Password reset flow has no UI — **Medium**

| Field | Value |
|-------|-------|
| File | `app/` (missing: `app/auth/reset-password/`) |
| Severity | Medium — users who forget their password have no recovery path |
| Status | Open |

**Description:**  
FEATURE_STATUS.md notes password reset as "🔲 Needs work — Route exists but UI not built". There is no "Forgot password?" link on the login page and no reset UI page.

**Fix:**  
1. Add "Forgot password?" link on `/login` → `/auth/reset-password`.  
2. Build reset page: email input → `supabase.auth.resetPasswordForEmail()`.  
3. Build confirm page: handles `?code=` from email link → `supabase.auth.updateUser({ password })`.

---

## Resolved (removed from this file)

Per `docs/LAW.md §9`: fixed bugs are deleted from this file, not listed here.  
Check git history for previously closed bugs.

---

*This file is maintained by IDARi and the engineering team. See `docs/DR_EAMS.md` Category 7 for Dr. Eams system-health communication rules.*
