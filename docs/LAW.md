# DREAMengin Law (Binding)

**Status:** LOCKED  
**Last updated:** 2026-03-05  
**Scope:** This file is the *front door* and enforcement summary for the DREAMengin spec.  
If any code, UI, or architecture conflicts with this law, the code must change — not the law.

---

## 0. Priority order (when docs conflict)

1. **docs/LAW.md** (this document)
2. **docs/AXIOMS.md**
3. **docs/SECURITY.md**
4. **docs/WIDGET_SYSTEM_V2.md**
5. **docs/ARCHITECTURE.md**
6. **docs/ADD_WORKFLOW.md**
7. **docs/DR_EAMS.md** (Dr. Eams behavioral spec — 100 requirements)
8. **docs/policy/theboogie.md** (TheBoogieMan.Ai policy — 100 rules, versioned)
9. **docs/FEATURE_STATUS.md** (live status of every feature — incomplete items are mandatory work)
10. **docs/BUGS.md** (auto-generated on every push — final vision + open issues + known bugs)
11. README.md (overview only)

If you find a conflict, you must:
- cite the exact lines/sections in conflict,
- propose the smallest change that restores compliance,
- and update the relevant doc(s) if the spec itself is unclear.

---


## 1. Root requirements

- Root must contain the canonical Next.js config and middleware/proxy entry points used by the project.
- **Do not remove or relocate `proxy.ts`** (Next.js 2026 middleware/proxy layer).


## 2. Non‑negotiables (AXIOMS are law)

The product must satisfy the AXIOMS at all times:
- **Instant understanding.** No hidden interactions *unless* they self‑reveal at the moment of use.
- **User‑shaped space.** Objects are arranged, moved, and “owned” through motion.
- **Real capability.** Widgets do real work.
- **Security + privacy by default.** Least privilege, no leaking, safe by construction.

If something violates an axiom, it must be redesigned or removed.

---

## 3. Product reality model

DREAMengin is a **continuous system**. Users are always “in Home” conceptually (node 0).  
You may use Next.js routes as *entry doors* (auth, deep links), but the *product* is not route navigation.

### “Pages” are allowed — but only as windows/widgets
A “page” is a **Widget Window** rendered inside the Home system:
- It opens as a widget instance with `presentation = WINDOW | FULL`.
- It is focusable, closable, and does not break the Home context.
- It is navigated by **τ** (the deterministic transition function), not browser history.

No traditional nav bar required; no page-stack UX.

---

## 4. Navigation is τ‑only

All user navigation between surfaces/nodes/windows must be expressed as:

- current state + action → next state (**τ**)

**Prohibited as product navigation:**
- ad‑hoc `router.push()` flows
- introducing new route-based “sub-apps” as the primary UX
- “back stacks” as the main mental model

Routes may exist for:
- login/logout/callbacks
- legal/help pages
- internal dev tools (behind a gate)

---

## 5. Home Controls are system objects

The Home controls (dual buttons) are **system objects**, not a navbar.

Required behavior (see ARCHITECTURE for details):
- **Single tap** = return home / recenter / reset focus.
- **Menu access** must be **AXIOM‑compliant**:
  - if double-tap is used, it must self-reveal with an immediate on-screen hint on first tap,
  - or use a visible affordance (glyph/label) so it is not a hidden trick.

Controls must not trap gestures; they must be touch-friendly (iOS targets), and must be reliable.

---

## 6. Day Dreams are protected

Day Dreams are “full-powered apps” and must not be casually refactored.

**Protected paths (do not modify unless explicitly approved):**
- `components/dreamnav/nodes/**`
- `components/dreamnav/HomeDreamRuntime.tsx`

**Allowed changes** in protected paths are limited to:
- bug fixes that preserve behavior,
- additive changes inside a specific Day Dream module,
- no broad refactors, renames, or architectural rewrites.

To modify protected paths in a PR, the PR title must include:
- `[DAYDREAM_OK]`

---

## 7. No “couldn’t find it so I built a new one”

Before writing new code:
1. Search for existing implementations and reuse them.
2. If unclear, annotate and ask rather than inventing parallel systems.
3. Do not create “second runtimes” (duplicate shells, duplicate controls, duplicate navigation logic).

If you introduce a duplicate runtime, the change is invalid.

---

## 8. Enforcement

This repo must enforce the law mechanically.

Minimum enforcement requirements:
- CI must fail if protected paths are modified without `[DAYDREAM_OK]` in the PR title.
- CI should be extended over time to prevent route-based navigation outside allowed entry doors.

(See `.github/workflows/law.yml` and `scripts/law-check.sh`.)

---

## 9. Change protocol (how to evolve the law safely)

Changes to this law require:
- a motivating problem statement,
- an impact analysis on AXIOMS,
- and explicit versioning in the header.

When in doubt, keep the law stable and evolve implementations.

---

## 10. Open issues are mandatory — not optional

`docs/FEATURE_STATUS.md` and `docs/BUGS.md` are **binding work queues**, not suggestions.

### 10.1 Rule

Every item in `docs/FEATURE_STATUS.md` marked **🔶 Partly done** or **🔲 Needs work** is a
**mandatory open obligation**. It must be completed before the product is considered shippable.

No item may be:
- silently removed from `FEATURE_STATUS.md` without being completed,
- deferred without a written motivation + updated status note in that file,
- "completed" by removing the feature instead of building it (unless the feature is formally
  deprecated per §9).

### 10.2 Upgrade priorities (ordered — highest first)

These are the binding implementation priorities derived from reading all spec docs:

1. **11 remaining pages still use `bg-background`** — apply `de-sky-bg` + `de-widget` to:  
   `app/create`, `app/shop/sell`, `app/music`, `app/music/upload`,  
   `app/settings/account`, `app/settings/security`, `app/settings/notifications`,  
   `app/ads/create`, `app/lab/new` (SPEC §1 — Frosted Glass OS is non-negotiable).
2. **Feed system → real DB data** — `lib/widgets/feed-resolver.ts` must return live rows,  
   not demo data (SPEC §5 — widgets do real work, AXIOM 3).
3. **Widget drag-to-reorder on ProfileCanvas** — wire `@dnd-kit/core`  
   (AXIOM 2 — control through movement, not settings).
4. **FollowOnboarding + AlgorithmEngine → Supabase** — currently localStorage only;  
   must persist to `follow_settings` / `user_feed_presets` tables (SECURITY §8 — data minimization  
   applies but data that belongs to the user must survive sessions).
5. **Music Studio publish pipeline** — SoundRecorder → upload → publish to feed  
   (AXIOM 3 — real capability).
6. **Password reset UI** — route exists, UI not built; auth is non-negotiable  
   (SECURITY §5 — required server routes).
7. **Swipe navigation** — spatial swipe gestures for mobile; core interaction model  
   (ARCHITECTURE §6, AXIOM 2).
8. **Comments system** — feed posts must support comments  
   (AXIOM 3 — real capability; SPEC §6 AI triad needs real engagement data).
9. **Game power-ups (spin/shoot visual effects)** — inputs already wired; effects pending  
   (ARCHITECTURE §18 — Universal Mobile Remote must be fully functional).
10. **PS5 DualSense haptics** — Gamepad vibration API on stomp/coin  
    (ARCHITECTURE §18.4 — PS5 Gamepad API mapping is part of the spec).
11. **Game leaderboard → Supabase** — score exists in-game; needs DB persistence  
    (AXIOM 3 — real capability).
12. **Shop + Marketplace payments (Stripe)** — UI exists; payment flow not started  
    (SPEC §4 Daydreams + ARCHITECTURE §15 Phase 5 monetization).

### 10.3 BUGS.md is auto-generated on every push

`docs/BUGS.md` is written by `scripts/update-bugs.mjs` and committed by
`.github/workflows/update-bugs.yml` after every push. It contains:

- **Final vision** — what DREAMengin is supposed to be when complete (sourced from SPEC.md).
- **Current open issues** — parsed live from `docs/FEATURE_STATUS.md`.
- **Known bugs** — scanned from `TODO` / `FIXME` annotations in the codebase.
- **Recent change** — the commit that triggered the regeneration.

The content of `docs/BUGS.md` is part of the binding work queue. Anything listed there as
incomplete must eventually be addressed per §10.1.

### 10.4 No new features over unfinished foundations

A new feature must not be introduced if it:
- bypasses or duplicates a system that is already "Partly done" in `FEATURE_STATUS.md`, **or**
- introduces new UI surfaces that do not follow the sky-blue + gold design system (SPEC §1), **or**
- requires functionality that depends on an item marked 🔲 Needs work in `FEATURE_STATUS.md`
  without first completing that dependency.


