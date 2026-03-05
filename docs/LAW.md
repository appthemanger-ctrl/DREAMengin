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
8. **docs/IDARI_CONTRACT.md** (Idari autonomous improvement agent — operational contract)
9. **docs/policy/theboogie.md** (TheBoogieMan.Ai policy — 100 rules, versioned)
10. **docs/FEATURE_STATUS.md** (live status of every feature — incomplete items are mandatory work)
11. **docs/BUGS.md** (auto-generated on every push — final vision + open issues + known bugs)
12. **docs/COPILOT_TOOLKIT.md** (GitHub Actions reference + Copilot self-reminder — read this too)
13. README.md (overview only)

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

## 9. Documentation preservation rules (AI agents + contributors)

These rules apply to every contributor — human or AI.

### 9.1 Do not delete documentation for features you did not complete

If a feature is documented (in `HANDOFF.md`, `FEATURE_STATUS.md`, `SPEC.md`, or any `docs/` file)
but is **not yet finished**, you must **not remove or truncate that documentation**.

Partial documentation of an incomplete feature is a promise to the next session.
Deleting it causes the next agent or developer to re-discover the same gap from scratch,
wasting time and creating duplicate work.

**Allowed:** updating wording, adding notes, marking progress.  
**Not allowed:** deleting a section, removing a table row, or wiping a spec because you ran out of time.

### 9.2 Do not remove open bugs from `docs/BUGS.md` unless the bug is fixed

`docs/BUGS.md` is a live log of open issues.
- When a bug is **fixed**, **delete its entry** from `BUGS.md`.
- When a bug is **not fixed**, leave the entry exactly as-is.
- Do not mark bugs "resolved" and leave them — remove them cleanly.
- Do not add "fixed in commit X" notes — delete the entry, trust git history.

### 9.3 Read all docs before every session

Per `BOOGIEMAN_POLICY.md` rule `0.1 RULE_DOCS_FIRST`:  
Read `docs/LAW.md`, `docs/AXIOMS.md`, `docs/HANDOFF.md`, `docs/SPEC.md`,
and `docs/BUGS.md` **before making any changes** in a session.

The trigger phrase **"read the docs"** from the project owner means:
read **every** file in `docs/` before proceeding. That includes:

- `docs/LAW.md` (this file — priority order)
- `docs/AXIOMS.md` (five non-negotiable axioms)
- `docs/SECURITY.md` (auth, RLS, secrets rules)
- `docs/ARCHITECTURE.md` (stack, navigation, performance)
- `docs/IDARI_CONTRACT.md` (Idari autonomous improvement contract)
- `docs/COPILOT_TOOLKIT.md` (GitHub Actions reference + Copilot self-reminder)
- `docs/FEATURE_STATUS.md` (what is done vs mandatory work)
- `docs/BUGS.md` (live open issues — auto-generated)
- `docs/HANDOFF.md` (session history and current priorities)
- `docs/BOOGIEMAN_POLICY.md` (100-rule policy)
- `docs/DR_EAMS.md` (Dr. Eams behavioral spec)

