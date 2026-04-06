# Generation Law

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


Status: binding AI build constraint  
Last updated: 2026-03-16

This document is the authoritative expansion of README.md §27.  
Every AI agent (Dr. Eams, IDARi, TheBoogieMan.Ai, or any external Copilot) must read and apply it before each generation pass.

---

## 1. Allowed-Output Formula

```
allowed next output = base spec fidelity × (ДР / 2) × (1 + ДРх)
```

| Term | Definition |
|------|-----------|
| **base spec fidelity** | How closely the current codebase matches README.md. Expressed as a value from 0 (nothing matches) to 1 (full conformance). Estimate by auditing open items in FEATURE_STATUS.md. |
| **ДР** | Delta ratio — the fraction of the total spec addressed by this pass (e.g., adding one route = small ДР; rewriting the full widget system = large ДР). |
| **ДРх** | Residual-adjusted ДР. Subtract the residual penalty before computing: ДРх = ДР − (open residuals / total spec sections). |

**Rule:** if the scope of a planned pass would exceed `allowed next output`, the pass must be split into smaller sub-passes or down-graded to **patch only** mode before any file is opened.

---

## 2. App-Build Load (χ)

Compute χ before writing a single line of code:

```
χ = w₁T + w₂F + w₃D + w₄A + w₅U
```

### 2.1 Variables

| Symbol | Meaning | Default weight |
|--------|---------|----------------|
| T | Number of distinct tasks attempted in this pass | w₁ = 1.0 |
| F | Number of files touched | w₂ = 0.5 |
| D | Dependency surface changed — new npm packages, new Supabase columns, new env vars, new imports from outside the touched file tree | w₃ = 1.5 |
| A | Architecture depth affected — count of the 4 layers (Surface / Component / Logic / Data) that are modified | w₄ = 2.0 |
| U | Unresolved spec ambiguities carried into this pass from a previous session | w₅ = 1.0 |

Weights are platform-wide defaults. IDARi may tune them per domain via the admin panel.

### 2.2 Mode Thresholds

| χ range | Mode | What is permitted |
|---------|------|-------------------|
| χ < 4 | **create** | New files, new routes, new components, new DB tables, new top-level systems |
| 4 ≤ χ < 8 | **conform** | Modify existing files to align with spec; no new top-level systems |
| χ ≥ 8 | **patch only** | Single-file, single-function fixes; no structural change; no new imports |

If a planned pass yields χ ≥ 8, decompose it into sub-passes (each with its own χ check) before proceeding.

### 2.3 Example

A pass that: fixes one bug (T=1), touches 3 files (F=3), adds no new deps (D=0), stays in the Component layer only (A=1), with 0 ambiguities (U=0):

```
χ = 1.0×1 + 0.5×3 + 1.5×0 + 2.0×1 + 1.0×0 = 1 + 1.5 + 0 + 2 + 0 = 4.5  →  conform
```

---

## 3. Residual Classes

A residual is a typed mismatch between actual AI output and spec-intended output:

```
r = actual output − predicted output
```

Residuals are not numbers first — they are structured mismatches. Seven classes exist. Every pass must audit for all of them.

---

### 3.1 Architecture Residual

**Question:** Does the code match the 4-layer DREAMengin model?

| Layer | Location | Responsibility |
|-------|----------|---------------|
| Surface | `app/` pages and route files | Route entry points only — no logic, no DB calls |
| Component | `components/` | UI atoms, shells, menus, widgets |
| Logic | `lib/`, `hooks/`, `utils/` | Business logic, data transforms, state |
| Data | `supabase/`, RLS policies, `types/` | Schema, queries, type definitions |

**Residual is present when:**
- Logic or data access leaks directly into Surface (`app/`) files
- DB queries execute inside Component files without going through `lib/` or `hooks/`
- A new system is created at the wrong layer (e.g., a commerce function lives in `components/`)
- A pass that touches all 4 layers (A=4 → χ spikes; decompose the pass)

---

### 3.2 Naming Residual

**Question:** Does the code use the canonical vocabulary defined in README.md, LAW.md, and the OS-Layer Naming Model?

**Authoritative names:**

| Canonical | Do not use |
|-----------|-----------|
| `HomeDream Surface` | `home`, `dashboard`, `feed`, `home page` |
| `EditProfileDream Surface` | `profile-editor`, `edit-profile`, `builder` |
| `ViewProfile Surface` | `public-profile`, `profile-page` |
| `DreamShop Surface` | `shop`, `store`, `shop page` |
| `DreamMarketplace Surface` | `marketplace`, `marketplace page` |
| `DreamMenu` | `nav`, `sidebar`, `hamburger` |
| `DreamDM Surface` | `messages`, `chat`, `inbox`, `messages page` |
| `DreamAds Surface` | `promotions`, `ads`, `ads page` |
| `Daydream Surface` | `mini-app`, `domain`, `section`, `page` |
| `Engin` (suffix) | `engine`, `control` |
| `Dream Window` | `widget`, `card`, `module` (for runtime containers) |
| `DreamSpace` | `widget layer`, `bottom panel` |
| `HomeDream Surface` / `primary surface` | `top area`, `main area`, `Surface Space` |
| `surface` | `page` (when referring to a DREAMengin surface) |
| `runtime` | `app` (when referring to the live system) |
| `surface switching` | `tab navigation` |
| `bind / mount / activate` | `link widget`, `open page`, `launch card` |
| `connection path` | `pair` (when describing the Daydream↔Engin network) |

**Residual is present when:**
- Legacy names appear in new route files, component names, or variable names without a redirect or explicit alias comment
- A UI string shown to the user uses a non-canonical name
- OS-layer rejected terms (widget, page, dashboard, card, app, tab) appear in user-facing copy

---

### 3.3 Token Residual

**Question:** Does the code use design-system tokens rather than arbitrary values?

**Required colour tokens (from THEME.md):**

| Intent | Token class | Hex |
|--------|------------|-----|
| Action / save / premium | `de-gold` | `#F5C842` |
| Connected / live | `de-sky` | `#64B5F6` |
| Surfaces | `de-surface` / white | `#FFFFFF` |

**Allowed border-radius values (px):** 6, 10, 14, 18, 24, 32, 9999

**Residual is present when:**
- Raw hex or RGB values appear in component styles for the above intents
- Arbitrary Tailwind colour classes are used where a token applies (e.g., `text-yellow-400` instead of `text-de-gold`)
- A border-radius value outside the allowed token set appears (e.g., `rounded-lg` = 8px is not in the set)
- A new colour is introduced without a corresponding token entry in THEME.md

---

### 3.4 Behavior Residual

**Question:** Do all visible actions map to real system actions?

**Residual is present when:**
- A button or link has an empty or stub handler (`onClick={() => {}}`, `href="#"`)
- A toggle or switch has no persisted outcome (state changes in memory but is never saved)
- A navigation element routes to a 404 or placeholder page
- A form submits but the data is discarded
- An action is presented in the UI but marked "coming soon" without a gating mechanism

---

### 3.5 Privacy Residual

**Question:** Did the AI expose private builder state publicly?

**Residual is present when:**
- A query or API response returns data belonging to a user other than the authenticated requester without an explicit visibility permission record
- EditProfileDream draft state appears on ViewProfile before the user has explicitly saved and shared it
- RLS is missing or bypassed (`service_role` used where `anon` / `authenticated` should govern)
- A `NEXT_PUBLIC_` env variable carries a secret or non-public credential
- An API route returns user data without checking the authenticated session
- The `visibility_mappings` table is not consulted before rendering shared content on ViewProfile

---

### 3.6 Performance Residual

**Question:** Does the code violate DREAMengin performance rules?

**Rules:**

| Rule | Requirement |
|------|-------------|
| Render on demand | Components must not render heavy content on mount when idle; trigger on interaction or intersection |
| Interactive animations | ≥ 60 fps |
| Passive animations | ≥ 30 fps |
| Static Three.js meshes | Must be frozen — call `geometry.dispose()` / set static flag; never re-create per frame |
| Post-processing | Bloom, depth-of-field, and other passes must be conditionally gated (device capability check); never on by default |

**Residual is present when:**
- A component eager-loads a heavy resource (3D scene, large image set) on mount without an idle or intersection trigger
- An animation drops below the fps threshold (measure with React DevTools Profiler or Three.js stats)
- A Three.js geometry or material is re-instantiated on every render cycle
- A post-processing pass is unconditionally applied to all devices

---

### 3.7 Projection Residual

**Question:** Does ViewProfile render only saved, explicitly shared projections?

A **projection** is a domain-specific output record (music project, game profile, brand kit, etc.) that a user has saved in one of the 6 Daydream / Engin pairs and chosen to share publicly.

**Residual is present when:**
- ViewProfile reads live EditProfileDream state directly instead of reading from a saved projection record
- A projection appears on ViewProfile that the user has not saved and set `visibility = shared`
- The rendering pipeline bypasses the `visibility_mappings` table
- A draft or in-progress Daydream object is visible to other users before explicit publish

---

## 4. Per-Pass Audit Checklist

Run this checklist at the **start** and **end** of every generation pass. File any failing item in BUGS.md before opening a new create-mode pass.

```
PRE-PASS
[ ] χ computed — mode confirmed (create / conform / patch only)
[ ] allowed next output computed — scope fits within limit
[ ] No unresolved residuals from the previous pass (check BUGS.md)

POST-PASS
[ ] Architecture residual — layers respected? No logic in Surface, no DB in Component?
[ ] Naming residual — canonical README names used throughout?
[ ] Token residual — de-gold / de-sky / de-surface tokens; correct border-radius values?
[ ] Behavior residual — every visible action does something real?
[ ] Privacy residual — no private state exposed publicly; RLS intact?
[ ] Performance residual — render-on-demand; fps targets met; frozen static meshes?
[ ] Projection residual — ViewProfile shows only saved shared projections?
```

Any residual discovered during the post-pass audit must be:
1. Logged in BUGS.md with the residual class and affected file(s)
2. Resolved in a dedicated conform-mode pass before the next create-mode pass is permitted

---

## 5. Relationship to Other Docs

| Document | Relationship to this file |
|----------|--------------------------|
| `README.md` | Primary spec. Base spec fidelity is measured against it. §27 is the canonical summary of this document. |
| `docs/LAW.md` | Product and route law. Naming residuals are caught against it. |
| `docs/THEME.md` | Token source of truth. Token residuals are caught against it. |
| `docs/SECURITY.md` | Privacy model. Privacy residuals are caught against it. |
| `docs/ARCHITECTURE.md` | Layer definitions. Architecture residuals are caught against it. |
| `docs/BUGS.md` | Residual log. All unresolved residuals are filed here. |
| `docs/FEATURE_STATUS.md` | Used to estimate base spec fidelity for the allowed-output formula. |
