# DREAMengin — Naming Authority

**Status: LOCKED — Phase 7 Final Authority**
Last updated: 2026-03-10

This document is the single locked reference for all product names, surface names, module names, and system labels used in DREAMengin.

AI agents, contributors, and reviewers must use this document as the validation source before generating files, routes, component names, UI labels, or documentation references.

---

## 1. Platform Name

### 1.1 Canonical Platform Name

| Canonical | Status |
|-----------|--------|
| **DREAMengin** | ONLY valid platform name |

**DREAMengin** is the only valid form of the platform name in all formal product references, documentation, code identifiers, UI strings, route names, component names, and API identifiers.

### 1.2 Rejected Platform Name Variants

The following are **explicitly rejected** and must not appear in any new file, route, label, component name, or documentation:

| Rejected form | Reason |
|---------------|--------|
| `DreamEngin` | Wrong capitalization — Dream is not a standalone word in the platform name |
| `Dreamengin` | Wrong capitalization |
| `dreamengin` | All-lowercase — never valid |
| `DREAMENGIN` | All-caps — never valid (reserved for display contexts only when intentional) |
| `Dream Engin` | Spaced variant — not valid |
| `DreamEngine` | Wrong suffix — the platform uses Engin, not Engine |
| `Dreamengin.` / `DREAMengin.` | Trailing period — only valid in prose sentences |

When uncertain, the rule is: **D-R-E-A-M** in all caps, followed by lowercase **engin** with no space. Nothing else.

---

## 2. Core Surface Names

These are the three primary system-level surfaces. They are not Daydreams.

### 2.1 Canonical Core Surface Names

| Canonical Name | Route | Label type |
|----------------|-------|------------|
| **HomeDream** | `/homedream` | User-facing and internal |
| **Edit ProfileDream** | `/edit-profiledream` | User-facing label |
| **EditProfileDream** | `/edit-profiledream` | Internal/code identifier |
| **View Profile** | `/view-profile` | User-facing label |
| **ViewProfile** | `/view-profile` | Internal/code identifier |

> **Note on Edit ProfileDream vs EditProfileDream:** The user-facing label includes a space ("Edit ProfileDream") to read naturally as an action. The code identifier has no space ("EditProfileDream") to be a valid identifier. Both refer to the same surface. Use the spaced form in UI strings and documentation prose; use the spaceless form in code identifiers, component names, and route path segments.

### 2.2 Rejected Core Surface Name Variants

| Rejected form | Surface it misnames | Reason |
|---------------|--------------------|---------| 
| `home` | HomeDream | Generic; does not identify the DREAMengin surface |
| `dashboard` | HomeDream | Wrong concept entirely |
| `feed` | HomeDream | Refers to a component of HomeDream, not the surface |
| `edit-profile` | Edit ProfileDream | Legacy route — valid as a redirect, not as a canonical name |
| `profile-editor` | Edit ProfileDream | Non-canonical descriptive label |
| `builder` | Edit ProfileDream | Non-canonical generic label |
| `public-profile` | View Profile | Non-canonical descriptive label |
| `profile-page` | View Profile | Non-canonical generic label |

---

## 3. Domain Surface Names (Daydream Pairs)

Each domain has two canonical surfaces: a Daydream (Side A) and an Engin control surface (Side B).

### 3.1 Canonical Daydream Names (Side A — User-Facing)

| Canonical Name | Route | Label type |
|----------------|-------|------------|
| **Music** (Daydream) | `/daydream/music` | User-facing domain label |
| **Games** (Daydream) | `/daydream/games` | User-facing domain label |
| **Lab** (Daydream) | `/daydream/lab` | User-facing domain label |
| **Code** (Daydream) | `/daydream/code` | User-facing domain label |
| **Brand** (Daydream) | `/daydream/brand` | User-facing domain label |
| **Create** (Daydream) | `/daydream/create` | User-facing domain label |

When referring to these in prose or documentation, use the form: **Music Daydream**, **Games Daydream**, **Lab Daydream**, **Code Daydream**, **Brand Daydream**, **Create Daydream**.

### 3.2 Canonical Engin Surface Names (Side B — Control Layer)

| Canonical Name | Route | Label type |
|----------------|-------|------------|
| **StarMakerEngin** | `/daydream/music` (Engin tab/side) | Internal and user-facing system label |
| **GameEngin** | `/daydream/games` (Engin tab/side) | Internal and user-facing system label |
| **LabEngin** | `/daydream/lab` (Engin tab/side) | Internal and user-facing system label |
| **CodeEngin** | `/daydream/code` (Engin tab/side) | Internal and user-facing system label |
| **BrandingEngin** | `/daydream/brand` (Engin tab/side) | Internal and user-facing system label |
| **ContentEngin** | `/daydream/create` (Engin tab/side) | Internal and user-facing system label |

### 3.3 The Engin Suffix Rule

**Engin** is the only accepted suffix pattern for control-layer system surfaces in DREAMengin.

- Every Side B domain surface ends in **Engin** — not Engine, not Eng, not Engi, not any other variation.
- The Engin suffix signals that the surface is the powered control layer of a Daydream pair.
- This suffix must not be used for surfaces that are not Side B control layers.

### 3.4 Rejected Engin Suffix Variants

The following are **explicitly rejected** as control-surface names:

| Rejected form | Reason |
|---------------|--------|
| `StarMakerEngine` | Wrong suffix — Engine is not the DREAMengin suffix |
| `GameEngine` | Wrong suffix |
| `LabEngine` | Wrong suffix |
| `Dreamengin` | Platform name used as a surface name — not valid |
| `Daydreamengin` | Combination form — not a valid control-surface name |
| `DayDreamengin` | Mixed-case combination — not a valid surface name |
| `MusicEngin` | Wrong base name — Music domain uses StarMakerEngin |
| `GamesEngin` | Wrong base name — Games domain uses GameEngin (no "s") |
| `CreateEngin` | Wrong base name — Create domain uses ContentEngin |

> **Clarification on "DayDreamengin" as a system category:** The term `DayDreamengin` appears historically as a system category label (meaning the group of all 6 Side B systems). As a **category label in documentation**, this use is acceptable. As a **surface name, component name, route segment, or UI label**, it is not valid. Always use the specific Engin surface name (e.g., StarMakerEngin) when referring to an individual surface.

---

## 4. Platform Module Names

### 4.1 Canonical Platform Module Names

| Canonical Name | Route | Label type |
|----------------|-------|------------|
| **DreamDM** | `/messages` | User-facing and internal |
| **DreamDM Bar** | (component, no standalone route) | User-facing component label |
| **DreamMenu** | (component, no standalone route) | User-facing and internal |
| **DreamMarketplace** | `/marketplace` | User-facing and internal |
| **DreamShop** | `/shop` | User-facing and internal |
| **DreamAds** | `/ads` | User-facing and internal |

### 4.2 Rejected Module Name Variants

| Rejected form | Module it misnames | Reason |
|---------------|-------------------|---------| 
| `messages` / `chat` / `inbox` | DreamDM | Generic labels; DreamDM is the canonical name |
| `nav` / `sidebar` / `hamburger` | DreamMenu | Generic UI patterns; DreamMenu is the canonical name |
| `marketplace` | DreamMarketplace | Bare domain word; DreamMarketplace is canonical |
| `shop` / `store` | DreamShop | Bare domain words; DreamShop is canonical |
| `promotions` / `ads` | DreamAds | Generic labels; DreamAds is canonical |

---

## 5. AI Agent Names

| Canonical Name | API Route | Label type |
|----------------|-----------|------------|
| **Dr. Eams** | `/api/ai/eams` | User-facing label |
| **IDARi** | `/api/ai/idari` | Internal/admin label — not user-facing |
| **TheBoogieMan.Ai** | `/api/ai/boogieman` | System-level label |

---

## 6. Generic and Category Labels

Some terms are used as category labels or generic references in documentation. These are acceptable in documentation prose but must not be used as individual surface names in code.

| Generic label | Acceptable use | Not acceptable use |
|--------------|---------------|-------------------|
| **Daydream** | Category reference: "the Daydream surfaces" | As a standalone product name for a specific surface |
| **Engin** | Category reference: "the Engin side of a pair" | As a standalone product name for a specific surface |
| **Daydream / Engin Pair System** | Documentation label for the paired surface architecture | Route names, component names, UI labels |
| **Dreams** | Category reference for modular widget units | Should not be confused with "Daydreams" (domain surfaces) |

---

## 7. Label Categories

For each name, the label category determines where it may appear:

| Category | Description | Examples |
|----------|-------------|---------|
| **User-facing label** | Shown in the product UI to users | HomeDream, Edit ProfileDream, Music, DreamShop |
| **Internal / code identifier** | Used in component names, route files, type names, variable names | EditProfileDream, ViewProfile, StarMakerEngin |
| **Documentation-only** | Used in specs and docs to describe system categories | Daydream / Engin Pair System, DayDreamengin (category only) |
| **Admin-only label** | Not shown in standard user UI | IDARi |

---

## 8. Validation Rules for AI Agents and Code Generators

Before generating any file, route, component name, UI label, or documentation reference, validate against these rules:

1. **Platform name check:** Does the output use `DREAMengin` exactly? Reject any variant.
2. **Core surface name check:** Does the output use `HomeDream`, `EditProfileDream`/`Edit ProfileDream`, `ViewProfile`/`View Profile`? Reject legacy or descriptive variants.
3. **Engin suffix check:** Does any control-layer surface name end in `Engin` (not `Engine`)? Reject Engine, Eng, or variant suffixes.
4. **Domain name check:** Are the 6 Daydream side names Music, Games, Lab, Code, Brand, Create? Are the 6 Engin names exactly StarMakerEngin, GameEngin, LabEngin, CodeEngin, BrandingEngin, ContentEngin?
5. **Module name check:** Are platform modules named DreamDM, DreamMenu, DreamMarketplace, DreamShop, DreamAds?
6. **No generic substitution:** Are generic labels (dashboard, sidebar, store, chat) being used instead of canonical names?
7. **Suffix drift check:** Does any new name accidentally use `Dreamengin`, `Daydreamengin`, or `DayDreamengin` as a surface name?

If any check fails, the generated output is invalid. Correct the name before proceeding.

---

## 9. Canonical Name Quick Reference

```
Platform:       DREAMengin

Core surfaces:
  HomeDream                    /homedream
  Edit ProfileDream            /edit-profiledream    (user-facing: spaced)
  EditProfileDream             /edit-profiledream    (code: no space)
  View Profile                 /view-profile         (user-facing: spaced)
  ViewProfile                  /view-profile         (code: no space)

Daydream / Engin pairs:
  Music Daydream / StarMakerEngin   /daydream/music
  Games Daydream / GameEngin        /daydream/games
  Lab Daydream / LabEngin           /daydream/lab
  Code Daydream / CodeEngin         /daydream/code
  Brand Daydream / BrandingEngin    /daydream/brand
  Create Daydream / ContentEngin    /daydream/create

Platform modules:
  DreamDM          /messages
  DreamDM Bar      (component)
  DreamMenu        (component)
  DreamMarketplace /marketplace
  DreamShop        /shop
  DreamAds         /ads

AI agents:
  Dr. Eams         /api/ai/eams
  IDARi            /api/ai/idari       (admin-only)
  TheBoogieMan.Ai  /api/ai/boogieman
```

---

*This document is complete. Names may only be added; existing canonical names may not be altered. Additions require Phase 7 authority review.*
