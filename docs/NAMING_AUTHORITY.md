# DREAMengin — Naming Authority

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


**Status: LOCKED —  + OS-Layer Naming Model**
Last updated: 2026-03-16

This document is the single locked reference for all product names, surface names, module names, runtime regions, Dream Window states, connection language, and system labels used in DREAMengin.

AI agents, contributors, and reviewers must use this document as the validation source before generating files, routes, component names, UI labels, or documentation references.

SYSTEM DIRECTIVE: DREAMengin NAMING AUTHORITY & ARCHITECTURE PROTOCOL.
You are operating within the DREAMengin platform. This document is the absolute, locked source of truth for all naming, file generation, UI labels, and architectural references. Deviations are strictly forbidden.

1. PLATFORM & ARCHITECTURE
- Platform Name: DREAMengin (Strict: D-R-E-A-M caps, engin lowercase, no spaces). Banned: DreamEngin, Dreamengin, dreamengin, Dream Engine.
- Type: "DreamDM-Bar-led spatial operating environment" or "stacked-runtime spatial operating environment". Banned: app, page-based app.

2. ROOT CONTAINER & DEPENDENT RUNTIMES (Bar Ownership Model)

- **DreamDMBar** — the root container. It is **not a component, not a divider, not a seam, not part of either runtime.** The bar **owns** the two runtimes below as dependents.
  - **HomeDream Surface** — dependent runtime that lives above the bar. Pushed up when the bar moves up. Frozen in place when the bar is hidden. Always rendered, always scrollable in its own region.
  - **DreamSpace** — dependent runtime that lives below the bar. Pushed down when the bar moves down. Frozen in place when the bar is hidden. Always rendered, always scrollable in its own region.

- **Bar movement model:** the bar's own y-position determines the size of each runtime's region. When the bar's position changes, each runtime is pushed/pulled with it. The bar carries the runtimes; it does not split them.
- **Bar hide model:** hiding the bar removes only the bar's own UI. Both runtimes remain on screen at the split they held the moment the bar was hidden, and each continues to scroll independently within its frozen region.
- **Banned terms for the bar:** "seam," "divider," "splitter," "split-screen handle," "the line between." These all describe a sibling-of-runtimes model. The bar is not a sibling. The bar is the parent.

3. CORE SURFACES (System-level, not daydreams)
- HomeDream Surface (/homedream)
- Edit ProfileDream Surface (/edit-profiledream) -> Code ID: EditProfileDream
- View Profile Surface (/view-profile) -> Code ID: ViewProfile
-Dreamr

4. DOMAIN SURFACES (Daydream Network) & ENGIN RUNTIMES
The system is a multi-connection network, not 1-to-1 pairs.
- Music Daydream Surface -> StarMakerEngin
- Games Daydream Surface -> GameEngin
- Lab Daydream Surface -> LabEngin
- Code Daydream Surface -> CodeEngin
- Brand Daydream Surface -> BrandingEngin
- Create Daydream Surface -> ContentEngin
Strict Engin Rule: Runtimes MUST end in "Engin". Banned: Engine, Eng, Engi. 

5. PLATFORM MODULES
, DreamMenu, DreamMarketplace (/marketplace), DreamShop (/shop), DreamAds (/ads).

6. DREAM WINDOWS (Modular Runtime Containers)
- Types: Unbound, Bound, Mounted, Collapsed.
- Required Data: id, type, owner, config, size, position, visibility, sourceBindings, destinationRules, activeState. Can be any and all components and/or functions or cartridges user or non user facing.
- Banned terms: static widgets, dashboard cards, web-app cards.

7. CONNECTION VERBS
- Allowed: bind, mount, activate, attach, route into, open into, connect across.
- Banned: link widget, open page, go to tab, launch card.

8. AI AGENTS
- Dr. Eams (User-facing), IDARi (Admin-only), TheBoogieMan.Ai (System-level).

9. FILE NAMING LAW (Strict lowercase dot-notation)
ALL .tsx files participating in the system MUST use one of three prefixes: engin., dream., or dreamsurface. Maximum nesting is one sub-prefix.

PREFIX 1: engin.<Name>.tsx
- Allowed (ONLY 6, strictly flat): engin.StarMakerEngin.tsx, engin.GameEngin.tsx, engin.LabEngin.tsx, engin.CodeEngin.tsx, engin.BrandingEngin.tsx, engin.ContentEngin.tsx. 

PREFIX 2: dream.<Name>.tsx OR dream.<sub>.<Name>.tsx
- Use for user-facing assets composing an Engin.
- Allowed sub-prefixes: cartridge, panel, hud, remote, scene, window, widget, menu, bar, shell, overlay.

PREFIX 3: dreamsurface.<Name>.tsx OR dreamsurface.<sub>.<Name>.tsx
- Use for the lived spaces Engins/Dreams render into.
- Allowed sub-prefixes: core, daydream, module.

BANNED SUB-PREFIXES: component, ui, view, page, util, helper, lib, test, spec, legacy, old, v2, route, engin.core, engin.sub, engin.module. 

VALIDATION GATES BEFORE EXECUTING ANY TASK:
1. Did I use DREAMengin exactly?
2. Did I use Engin (not Engine) for runtimes?
3. Did I use canonical Core/Daydream names instead of generic terms (dashboard, feed, store)?
4. Does every new .tsx file match the exact allowed dot-notation prefixes and sub-prefixes?
If NO to any, correct silently before outputting.
