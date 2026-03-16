# DREAMengin — Naming Authority

**Status: LOCKED — Phase 7 Final Authority + OS-Layer Naming Model**
Last updated: 2026-03-16

This document is the single locked reference for all product names, surface names, module names, runtime regions, Dream Window states, connection language, and system labels used in DREAMengin.

AI agents, contributors, and reviewers must use this document as the validation source before generating files, routes, component names, UI labels, or documentation references.

---

## 1. Platform Name

### 1.1 Canonical Platform Name

| Canonical | Status |
|-----------|--------|
| **DREAMengin** | ONLY valid platform name |

**DREAMengin** is the only valid form of the platform name in all formal product references, documentation, code identifiers, UI strings, route names, component names, and API identifiers.

### 1.2 Canonical Product-Type Description

DREAMengin is not described as a conventional page-based app.

| Canonical | Status |
|-----------|--------|
| **dual-runtime, spatial operating environment** | ONLY valid type description |
| **DREAMengin Runtime** | Acceptable short form for the whole live system |
| **DREAMengin Runtime Environment** | Acceptable expanded form for system-wide behavior |
| **Spatial Operating Environment** | Acceptable category form |

### 1.3 Rejected Platform Name Variants

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
| **HomeDream Surface** | `/homedream` | Full canonical surface label |
| **Edit ProfileDream** | `/edit-profiledream` | User-facing label |
| **EditProfileDream** | `/edit-profiledream` | Internal/code identifier |
| **Edit ProfileDream Surface** | `/edit-profiledream` | Full canonical surface label |
| **View Profile** | `/view-profile` | User-facing label |
| **ViewProfile** | `/view-profile` | Internal/code identifier |
| **View Profile Surface** | `/view-profile` | Full canonical surface label |

> **Note on Edit ProfileDream vs EditProfileDream:** The user-facing label includes a space ("Edit ProfileDream") to read naturally as an action. The code identifier has no space ("EditProfileDream") to be a valid identifier. Both refer to the same surface. Use the spaced form in UI strings and documentation prose; use the spaceless form in code identifiers, component names, and route path segments.

### 2.2 Rejected Core Surface Name Variants

| Rejected form | Surface it misnames | Reason |
|---------------|--------------------|---------| 
| `home` | HomeDream | Generic; does not identify the DREAMengin surface |
| `dashboard` | HomeDream | Wrong concept entirely — use "operating surface" |
| `feed` | HomeDream | Refers to a component of HomeDream, not the surface |
| `edit-profile` | Edit ProfileDream | Legacy route — valid as a redirect, not as a canonical name |
| `profile-editor` | Edit ProfileDream | Non-canonical descriptive label |
| `builder` | Edit ProfileDream | Non-canonical generic label |
| `public-profile` | View Profile | Non-canonical descriptive label |
| `profile-page` | View Profile | Non-canonical generic label |

---

## 3. Domain Surface Names (Daydream Network)

The DREAMengin creative system is a **multi-surface, multi-engin connection network** — not a one-to-one pair system.

There are:
- **6 Daydream Surfaces** — user-facing lived creative spaces
- **6 Engin runtimes** — powered execution/emulator layers
- **11 named connection paths** across scope, resolution, and task depth

Any Daydream Surface may connect to multiple Engins. Any Engin may power multiple Surface contexts.

### 3.1 Canonical Daydream Surface Names

| Canonical Name | Route | Full Surface Label |
|----------------|-------|------------|
| **Music** (Daydream) | `/daydream/music` | **Music Daydream Surface** |
| **Games** (Daydream) | `/daydream/games` | **Games Daydream Surface** |
| **Lab** (Daydream) | `/daydream/lab` | **Lab Daydream Surface** |
| **Code** (Daydream) | `/daydream/code` | **Code Daydream Surface** |
| **Brand** (Daydream) | `/daydream/brand` | **Brand Daydream Surface** |
| **Create** (Daydream) | `/daydream/create` | **Create Daydream Surface** |

When referring to these in prose or documentation, use the full surface label form (e.g., **Music Daydream Surface**).

### 3.2 Canonical Engin Runtime Names

| Canonical Name | Route | Label type |
|----------------|-------|------------|
| **StarMakerEngin** | `/daydream/music` | Internal and user-facing system label |
| **GameEngin** | `/daydream/games` | Internal and user-facing system label |
| **LabEngin** | `/daydream/lab` | Internal and user-facing system label |
| **CodeEngin** | `/daydream/code` | Internal and user-facing system label |
| **BrandingEngin** | `/daydream/brand` | Internal and user-facing system label |
| **ContentEngin** | `/daydream/create` | Internal and user-facing system label |

### 3.3 Multi-Connection Runtime Network

The connection between Daydream Surfaces and Engin runtimes is **not** one-to-one. Examples:

| Daydream Surface | Connected Engin runtimes |
|---|---|
| Music Daydream Surface | StarMakerEngin, LabEngin, CodeEngin |
| Games Daydream Surface | GameEngin, LabEngin, CodeEngin |
| Brand Daydream Surface | BrandingEngin, ContentEngin, LabEngin |

### 3.4 The Engin Suffix Rule

**Engin** is the only accepted suffix pattern for powered runtime layers in DREAMengin.

- Every Engin runtime name ends in **Engin** — not Engine, not Eng, not Engi, not any other variation.
- The Engin suffix signals that the surface is a powered execution / emulator / control layer.

### 3.5 Rejected Engin Suffix Variants

The following are **explicitly rejected** as Engin runtime names:

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

---

## 4. Platform Module Names

### 4.1 Canonical Platform Module Names

| Canonical Name | Route | Full Surface Label |
|----------------|-------|------------|
| **DreamDM** | `/messages` | **DreamDM Surface** |
| **DreamDM Bar** | (component, no standalone route) | — |
| **DreamMenu** | (component, no standalone route) | — |
| **DreamMarketplace** | `/marketplace` | **DreamMarketplace Surface** |
| **DreamShop** | `/shop` | **DreamShop Surface** |
| **DreamAds** | `/ads` | **DreamAds Surface** |

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

## 6. Runtime Regions

DREAMengin operates as a **dual-runtime spatial system** with two distinct runtime regions separated by the DreamDM Bar.

### 6.1 Canonical Runtime Region Names

| Canonical Name | Description |
|----------------|-------------|
| **Surface Space** | The upper active runtime region — hosts the current active surface |
| **DreamSpace** | The lower modular runtime region — contains Dream Windows and launcher behavior |

### 6.2 Canonical Runtime Seam Names

The DreamDM Bar is the boundary object between the two runtimes. All four of the following names are canonical for this object in different contexts:

| Canonical Name | Context |
|----------------|---------|
| **DreamDM Bar** | Primary product label |
| **Persistent Interaction Rail** | Architecture description |
| **Persistent Spatial Divider** | Spatial model description |
| **Runtime Seam** | Short-form system label |

### 6.3 Rejected Region Terms

| Rejected term | Use instead |
|---------------|-------------|
| `widget layer` | DreamSpace |
| `bottom panel` | DreamSpace |
| `top area` | Surface Space |

---

## 7. Dream Windows

Dream Windows are the canonical term for modular runtime containers inside DREAMengin.

**Dream Windows are not:**
- static widgets
- dashboard cards
- web-app cards
- UI panels

**Dream Windows are:**
- modular runtime containers
- structurally capable of displaying content, accepting content, routing content, and surfacing signals

### 7.1 Dream Window State Names

| State Name | Description |
|------------|-------------|
| **Unbound Dream Window** | Not yet connected to a source or destination |
| **Bound Dream Window** | Connected to a source binding |
| **Mounted Dream Window** | Active and rendering in a surface |
| **Collapsed Dream Window** | Present but minimized |

### 7.2 Dream Window Required Data

Every Dream Window must carry:

```
id, type, owner, config, size, position, visibility,
sourceBindings, destinationRules, activeState
```

---

## 8. Connection Language

When describing how surfaces, Dream Windows, and Engin runtimes relate to each other, use canonical connection verbs.

### 8.1 Canonical Connection Verbs

| Canonical Verb | Use for |
|----------------|---------|
| **bind** | Connecting a Dream Window to a source |
| **mount** | Activating a Dream Window in a surface context |
| **activate** | Bringing a runtime layer or Dream Window into active state |
| **attach** | Associating a module or container with a surface |
| **route into** | Directing a user or signal to a deeper surface |
| **open into** | Opening a deeper runtime layer from within a surface |
| **connect across** | Establishing a cross-surface or cross-Engin path |

### 8.2 Rejected Connection Verbs

| Rejected | Use instead |
|----------|-------------|
| `link widget` | bind / mount / activate |
| `open page` | open into / route into |
| `go to tab` | surface switching |
| `launch card` | activate / mount |

---

## 9. OS-Layer Rejected Terms

The following terms are rejected when a canonical OS-layer equivalent exists:

| Rejected term | Canonical replacement |
|---------------|----------------------|
| `app` | runtime |
| `platform` | runtime environment |
| `page` | surface |
| `widget` | Dream Window (for modular runtime containers) |
| `widget layer` | DreamSpace |
| `tool` | engin capability |
| `engine` | Engin |
| `pair` | connection path |
| `dashboard` | operating surface |
| `tab navigation` | surface switching |
| `card` | window / surface block |
| `login-like connection` | bind / mount / activate |
| `open page` | open into / route into |
| `go to tab` | surface switching |
| `launch card` | activate / mount |

---

## 10. Generic and Category Labels

Some terms are used as category labels or generic references in documentation. These are acceptable in documentation prose but must not be used as individual surface names in code.

| Generic label | Acceptable use | Not acceptable use |
|--------------|---------------|-------------------|
| **Daydream** | Category reference: "the Daydream surfaces" | As a standalone product name for a specific surface |
| **Engin** | Category reference: "the Engin runtimes" | As a standalone product name for a specific runtime |
| **Daydream / Engin Network** | Documentation label for the multi-surface network | Route names, component names, UI labels |
| **Dreams** | Category reference for Dream Windows | Should not be confused with "Daydreams" (domain surfaces) |

---

## 11. Label Categories

For each name, the label category determines where it may appear:

| Category | Description | Examples |
|----------|-------------|---------|
| **User-facing label** | Shown in the product UI to users | HomeDream Surface, Edit ProfileDream, Music Daydream Surface |
| **Internal / code identifier** | Used in component names, route files, type names, variable names | EditProfileDream, ViewProfile, StarMakerEngin |
| **Documentation-only** | Used in specs and docs to describe system categories | Daydream / Engin Network, DayDreamengin (category only) |
| **Admin-only label** | Not shown in standard user UI | IDARi |

---

## 12. Validation Rules for AI Agents and Code Generators

Before generating any file, route, component name, UI label, or documentation reference, validate against these rules:

1. **Platform name check:** Does the output use `DREAMengin` exactly? Reject any variant.
2. **Product description check:** Is the system described as a "dual-runtime, spatial operating environment"? Reject "app" or "platform" when the full system is the subject.
3. **Core surface name check:** Does the output use `HomeDream`, `EditProfileDream`/`Edit ProfileDream`, `ViewProfile`/`View Profile`? Reject legacy or descriptive variants.
4. **Engin suffix check:** Does any powered runtime name end in `Engin` (not `Engine`)? Reject Engine, Eng, or variant suffixes.
5. **Domain name check:** Are the 6 Daydream names Music, Games, Lab, Code, Brand, Create? Are the 6 Engin names exactly StarMakerEngin, GameEngin, LabEngin, CodeEngin, BrandingEngin, ContentEngin?
6. **Module name check:** Are platform modules named DreamDM, DreamMenu, DreamMarketplace, DreamShop, DreamAds?
7. **No generic substitution:** Are generic labels (dashboard, sidebar, store, chat, widget, card, page) being used instead of canonical names?
8. **Suffix drift check:** Does any new name accidentally use `Dreamengin`, `Daydreamengin`, or `DayDreamengin` as a surface name?
9. **Runtime region check:** Are the two runtime regions referred to as Surface Space (upper) and DreamSpace (lower)?
10. **Dream Window check:** Are modular runtime containers called Dream Windows? Are states Unbound / Bound / Mounted / Collapsed?
11. **Connection verb check:** Are connection actions using bind / mount / activate / attach / route into / open into / connect across?
12. **Network model check:** Is the system described as a multi-surface, multi-engin connection network (not strict 1-to-1 pairs)?

If any check fails, the generated output is invalid. Correct the name before proceeding.

---

## 13. Canonical Name Quick Reference

```
Platform:       DREAMengin
Type:           dual-runtime, spatial operating environment

Runtime regions:
  Surface Space          (upper active runtime region)
  DreamSpace             (lower modular runtime region)
  DreamDM Bar            (Runtime Seam / Persistent Interaction Rail)

Core surfaces:
  HomeDream Surface                /homedream
  Edit ProfileDream Surface        /edit-profiledream
  View Profile Surface             /view-profile

Daydream Surface Network (6 surfaces + 6 Engin runtimes + 11 connection paths):
  Music Daydream Surface / StarMakerEngin     /daydream/music
  Games Daydream Surface / GameEngin          /daydream/games
  Lab Daydream Surface / LabEngin             /daydream/lab
  Code Daydream Surface / CodeEngin           /daydream/code
  Brand Daydream Surface / BrandingEngin      /daydream/brand
  Create Daydream Surface / ContentEngin      /daydream/create

Platform modules:
  DreamDM Surface           /messages
  DreamDM Bar               (Runtime Seam component)
  DreamMenu                 (component)
  DreamMarketplace Surface  /marketplace
  DreamShop Surface         /shop
  DreamAds Surface          /ads

Dream Windows:
  Unbound Dream Window
  Bound Dream Window
  Mounted Dream Window
  Collapsed Dream Window

Connection verbs:
  bind, mount, activate, attach, route into, open into, connect across

AI agents:
  Dr. Eams         /api/ai/eams
  IDARi            /api/ai/idari       (admin-only)
  TheBoogieMan.Ai  /api/ai/boogieman
```

---

*This document is the canonical naming authority. Names may only be added; existing canonical names may not be altered. Additions require Phase 7 authority review.*

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
