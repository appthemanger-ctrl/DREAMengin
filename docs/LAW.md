# DREAMengin Law (Binding)

**Status:** LOCKED  
**Last updated:** 2026-02-23  
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
7. README.md (overview only)

If you find a conflict, you must:
- cite the exact lines/sections in conflict,
- propose the smallest change that restores compliance,
- and update the relevant doc(s) if the spec itself is unclear.

---


## 1. Root requirements

- Root must contain the canonical Next.js config and middleware/proxy entry points used by the project.
- **Do not remove or relocate `proxy.ts`** (Next.js 2026 middleware/proxy layer).


## 1. Non‑negotiables (AXIOMS are law)

The product must satisfy the AXIOMS at all times:
- **Instant understanding.** No hidden interactions *unless* they self‑reveal at the moment of use.
- **User‑shaped space.** Objects are arranged, moved, and “owned” through motion.
- **Real capability.** Widgets do real work.
- **Security + privacy by default.** Least privilege, no leaking, safe by construction.

If something violates an axiom, it must be redesigned or removed.

---

## 2. Product reality model

DREAMengin is a **continuous system**. Users are always “in Home” conceptually (node 0).  
You may use Next.js routes as *entry doors* (auth, deep links), but the *product* is not route navigation.

### “Pages” are allowed — but only as windows/widgets
A “page” is a **Widget Window** rendered inside the Home system:
- It opens as a widget instance with `presentation = WINDOW | FULL`.
- It is focusable, closable, and does not break the Home context.
- It is navigated by **τ** (the deterministic transition function), not browser history.

No traditional nav bar required; no page-stack UX.

---

## 3. Navigation is τ‑only

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

## 4. Home Controls are system objects

The Home controls (dual buttons) are **system objects**, not a navbar.

Required behavior (see ARCHITECTURE for details):
- **Single tap** = return home / recenter / reset focus.
- **Menu access** must be **AXIOM‑compliant**:
  - if double-tap is used, it must self-reveal with an immediate on-screen hint on first tap,
  - or use a visible affordance (glyph/label) so it is not a hidden trick.

Controls must not trap gestures; they must be touch-friendly (iOS targets), and must be reliable.

---

## 5. Day Dreams are protected

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

## 6. No “couldn’t find it so I built a new one”

Before writing new code:
1. Search for existing implementations and reuse them.
2. If unclear, annotate and ask rather than inventing parallel systems.
3. Do not create “second runtimes” (duplicate shells, duplicate controls, duplicate navigation logic).

If you introduce a duplicate runtime, the change is invalid.

---

## 7. Enforcement

This repo must enforce the law mechanically.

Minimum enforcement requirements:
- CI must fail if protected paths are modified without `[DAYDREAM_OK]` in the PR title.
- CI should be extended over time to prevent route-based navigation outside allowed entry doors.

(See `.github/workflows/law.yml` and `scripts/law-check.sh`.)

---

## 8. Change protocol (how to evolve the law safely)

Changes to this law require:
- a motivating problem statement,
- an impact analysis on AXIOMS,
- and explicit versioning in the header.

When in doubt, keep the law stable and evolve implementations.

