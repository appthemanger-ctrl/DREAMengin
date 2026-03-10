# DREAMengin — Product Definition

**Status: LOCKED — Phase 7 Final Authority**
Last updated: 2026-03-10

This document is the locked, canonical product definition for DREAMengin.
It is the final word on what the platform is, what it is not, and what structural constraints every built system must respect.

This document does not describe features in progress. It describes what DREAMengin **is** — the stable identity that all phases build toward and must conform to.

---

## 1. What DREAMengin Is

DREAMengin is a **privacy-first modular platform** built around connected, user-owned surfaces, modules, and system spaces.

It is one coherent platform — not a collection of unrelated pages. Every surface, module, and system in DREAMengin operates under the same shared rules, the same ownership logic, the same privacy logic, and the same surface continuity model.

DREAMengin is:

- **User-first** — in operational terms, meaning every interface decision, every default state, and every action path is designed around the user's intent and control, not the platform's convenience.
- **Privacy-first** — in operational terms, meaning private is the actual default state enforced by the system, not a trust slogan. Nothing becomes public without a real, explicit, user-initiated action.
- **Customizable** — in structural terms, meaning users control layout, composition, visibility, widget behavior, feed sources, and surface arrangement — not just cosmetic themes.
- **Modular** — in a structural sense that constrains data design, UI composition, and future expansion. Modules (Dreams) are the primary unit. New features attach to this model or do not belong.

---

## 2. What DREAMengin Is Not

DREAMengin is **not**:

- A generic dashboard with widgets arranged for convenience
- A tabbed web app with cosmetic polish applied to standard social patterns
- A collection of unrelated feature pages that share a header and a color scheme
- A platform where public-by-default is acceptable behavior
- A platform where convenience may override user ownership or explicit control
- A platform that deploys detached mini-apps under a shared brand without shared rules

Any proposed feature, surface, or module that matches one of the above descriptions is outside DREAMengin's product identity.

---

## 3. The Platform Structure

### 3.1 Root Surface

**HomeDream** is the root user surface from which the rest of the platform opens.

It is the user's private operating environment — the daily entry point, the feed source, the widget space, and the navigation origin. It is not a landing page, a marketing surface, or a dashboard. It is the user's private home inside DREAMengin.

HomeDream is private by default. No HomeDream content appears publicly without explicit user action.

### 3.2 Profile Builder Surface

**Edit ProfileDream** is the private builder surface for the user's public or shared-facing presentation.

It is where users compose, arrange, and configure what others will see. It is not a settings panel. It is a full spatial builder with widget placement, visibility control, and layout authorship.

Editing inside Edit ProfileDream does not automatically change what others see. Only explicit save and projection actions update the public-facing output.

### 3.3 Public Output Surface

**View Profile** is the output of explicit public or shared projection.

It is not a live mirror of Edit ProfileDream state. It shows only what the user has explicitly projected — content that has been saved, set to a public or shared visibility state, and confirmed by the user as intended output. Viewing this surface as an owner shows a preview; viewing it as another user shows only confirmed shared content.

### 3.4 Dreams (Modular Units)

**Dreams** are the modular units that connect the platform's systems and surfaces.

Dreams are not decorative cards. They are structural — they carry data, perform actions, represent system states, and project content. Every Dream has real data, real actions, real visibility logic, and real ownership. A Dream without real data or real action is not a valid Dream.

Dreams are the primary building block for HomeDream, Edit ProfileDream, Daydream surfaces, and ViewProfile.

### 3.5 Daydream / Engin Pair System

**Daydreams and their paired Engin control surfaces** are paired systems with distinct roles.

- **Side A (Daydream):** the user-facing creative and interactive domain experience.
- **Side B (Engin surface):** the powered control layer for that domain — tooling, publishing, engine configuration, performance management.

The six domain pairs are:

| Daydream (Side A) | Engin Surface (Side B) |
|-------------------|------------------------|
| Music | StarMakerEngin |
| Games | GameEngin |
| Lab | LabEngin |
| Code | CodeEngin |
| Brand | BrandingEngin |
| Create | ContentEngin |

These are platform surfaces, not detached apps. They share the platform's privacy rules, ownership model, Dream system, and navigation continuity. A Daydream or Engin surface that does not respect the shared platform rules is not a valid DREAMengin surface.

### 3.6 Platform Modules

**DreamDM, DreamDM Bar, DreamMenu, DreamMarketplace, DreamShop, and DreamAds** are platform modules — not detached apps, not standalone products, and not cosmetic wrappers.

They operate under the same privacy rules, ownership model, and action-honesty requirements as every other part of DREAMengin. No platform module may claim an exemption from the shared platform constitution.

---

## 4. Platform Principles (Operational Definitions)

### 4.1 User-First (Operational)

User-first means:

- Every default state favors the user's ownership and control.
- Every action path requires user intent.
- The platform does not use the user's session to perform actions they have not explicitly requested.
- Convenience features may not override user ownership, visibility control, or explicit confirmation requirements.

User-first is not a marketing claim. It is a system constraint.

### 4.2 Privacy-First (Operational)

Privacy-first means:

- The system enforces private as the default state at the data and API layer — not just in UI copy.
- Nothing stored in the system is publicly readable unless a visibility record explicitly permits it.
- No platform module — including AI, commerce, messaging, or advertising — may bypass this enforcement.
- Silent exposure is treated as a system failure. Privacy-safe failure is the required default when the system is uncertain.

Privacy-first is not a trust slogan. It is a system architecture requirement.

### 4.3 Customizable (Structural)

Customizable means:

- Users control the arrangement, composition, and behavior of their surfaces — not just their appearance.
- Widget placement, feed behavior, visibility rules, and source bindings are user-controlled structural choices.
- The platform does not override user-configured structure without explicit user action.

Customizable is not limited to theme or color selection.

### 4.4 Modular (Structural)

Modular means:

- The Dream system is the primary mechanism for adding capability to the platform.
- New features attach to the existing Dream, surface, and module architecture.
- Data models must align with the Dream ownership, visibility, and type structure.
- UI composition must use the established Dream layer model (Shell → Connector → Feature → Output).
- A feature that cannot be expressed as a Dream, a surface extension, or a module extension may not fit inside DREAMengin's product identity.

Modular is not a description of independent components. It is a constraint on how capability is added.

---

## 5. Reading Earlier Phases as One System

All phases of DREAMengin development must be read as parts of one platform, not as isolated builds.

- Phase results are contributions to the unified system — each one extends the same surface model, the same privacy model, and the same Dream architecture.
- Where earlier phase output conflicts with this definition, this document wins.
- Where phase output is incomplete, the definition above describes what completion requires.
- A feature that was built in an earlier phase but violates this definition is a residual — it must be conformed, not preserved.

No phase may be cited as justification for violating this product definition.

---

## 6. Deciding Whether a Proposed Feature Belongs Inside DREAMengin

A proposed feature belongs inside DREAMengin if and only if it meets all of the following:

1. **Naming fit** — it can be named with canonical DREAMengin vocabulary without distortion.
2. **Privacy fit** — it can operate with private-by-default enforcement without requiring a bypass.
3. **Action honesty** — every user-facing action in it maps to a real system outcome.
4. **User-control compatibility** — it does not require the platform to take actions on the user's behalf without explicit confirmation.
5. **Modularity fit** — it can be expressed within the Dream system, the existing surface model, or a valid extension of an existing platform module.
6. **No detachment** — it must share privacy rules, ownership logic, and naming conventions with the rest of the platform.

A feature that fails any of these criteria is either not ready for DREAMengin or not appropriate for DREAMengin.

---

## 7. Authority and Conflict Resolution

This document is Phase 7 output. It is the **final authority** for product meaning.

| When this conflicts with | This document wins |
|--------------------------|-------------------|
| An earlier phase spec | Always |
| A specific feature spec | Always |
| A code comment or UI string | Always |
| A doc that predates Phase 7 | Always |
| The README | README.md wins only if the conflict is in technical implementation detail, not in product identity |

The README.md remains the master spec for surface structure, technical stack, and system inventory. This document is the authoritative interpretation of what that structure **means** and what constraints it enforces.

---

*This document is complete. Do not add aspirational content, future features, or open-ended speculation. This is a locked definition.*
