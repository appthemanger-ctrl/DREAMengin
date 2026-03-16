# DREAMengin — Product Definition

**Status: LOCKED — Phase 7 Final Authority + OS-Layer Naming Model**
Last updated: 2026-03-16

This document is the locked, canonical product definition for DREAMengin.
It is the final word on what the platform is, what it is not, and what structural constraints every built system must respect.

This document does not describe features in progress. It describes what DREAMengin **is** — the stable identity that all phases build toward and must conform to.

---

## 1. What DREAMengin Is

DREAMengin is a **customizable, privacy-first, dual-runtime spatial operating environment** for creating, sharing, organizing, and connecting modular runtime containers across personal, creative, and social spaces.

It is not described as a conventional page-based app. It is a **dual-runtime, spatial operating environment** — a social modular runtime whose navigation begins as a calm **HomeDream Surface** and matures into a stacked, state-preserving surface system across the entire product.

It is one coherent runtime environment — not a collection of unrelated pages. Every surface, module, and system in DREAMengin operates under the same shared rules, the same ownership logic, the same privacy logic, and the same surface continuity model.

DREAMengin is:

- **User-first** — in operational terms, meaning every interface decision, every default state, and every action path is designed around the user's intent and control, not the runtime's convenience.
- **Privacy-first** — in operational terms, meaning private is the actual default state enforced by the system, not a trust slogan. Nothing becomes public without a real, explicit, user-initiated action.
- **Customizable** — in structural terms, meaning users control layout, composition, visibility, Dream Window behavior, feed sources, and surface arrangement — not just cosmetic themes.
- **Modular** — in a structural sense that constrains data design, UI composition, and future expansion. Dream Windows are the primary modular unit. New features attach to this model or do not belong.

---

## 2. What DREAMengin Is Not

DREAMengin is **not**:

- A generic operating surface with Dream Windows arranged for convenience
- A tabbed web runtime with cosmetic polish applied to standard social patterns
- A collection of unrelated feature surfaces that share a header and a color scheme
- A runtime where public-by-default is acceptable behavior
- A runtime where convenience may override user ownership or explicit control
- A runtime that deploys detached mini-runtimes under a shared brand without shared rules

Any proposed feature, surface, or module that matches one of the above descriptions is outside DREAMengin's product identity.

---

## 3. The Runtime Structure

### 3.1 Dual-Runtime Spatial Model

DREAMengin operates as a **dual-runtime spatial system** with two active runtime regions:

- **Surface Space** — the upper active runtime region. Hosts the current active surface (HomeDream Surface, Daydream Surfaces, Engin Surfaces, feed views, video surfaces, game surfaces, code surfaces, and other active content surfaces).
- **DreamSpace** — the lower modular runtime region. Contains Dream Windows, modular runtime containers, launcher behavior, Daydream access, and lower-layer runtime interactions.

The **DreamDM Bar** is the canonical seam between the two runtimes. It is both a **Persistent Interaction Rail** and a **Persistent Spatial Divider** (also called the **Runtime Seam**). It allows users to compose, reply, manage notifications, preserve drafts, resize the visible relationship between the two runtimes, and move attention between two parallel active spaces.

### 3.2 Root Surface

**HomeDream Surface** is the root user surface from which the rest of the runtime opens.

It is the user's private operating surface — the daily entry point, the feed source, the Dream Window space, and the navigation origin. It is not a landing surface, a marketing surface, or an operating surface in the generic dashboard sense. It is the user's private home inside DREAMengin.

HomeDream Surface is private by default. No HomeDream content appears publicly without explicit user action.

### 3.3 Profile Builder Surface

**Edit ProfileDream Surface** is the private builder surface for the user's public or shared-facing presentation.

It is where users compose, arrange, and configure what others will see. It is not a settings panel. It is a full spatial builder with Dream Window placement, visibility control, and layout authorship.

Editing inside Edit ProfileDream Surface does not automatically change what others see. Only explicit save and projection actions update the public-facing output.

### 3.4 Public Output Surface

**View Profile Surface** is the output of explicit public or shared projection.

It is not a live mirror of Edit ProfileDream Surface state. It shows only what the user has explicitly projected — content that has been saved, set to a public or shared visibility state, and confirmed by the user as intended output.

### 3.5 Dream Windows (Modular Runtime Containers)

**Dream Windows** are the modular runtime containers that connect the runtime's systems and surfaces.

Dream Windows are not decorative cards or static widgets. They are structural — they carry data, perform actions, represent system states, and project content. Every Dream Window has real data, real actions, real visibility logic, and real ownership. A Dream Window without real data or real action is not a valid Dream Window.

Dream Window states:
- **Unbound Dream Window** — not yet connected to a source or destination
- **Bound Dream Window** — connected to a source binding
- **Mounted Dream Window** — active and rendering in a surface
- **Collapsed Dream Window** — present but minimized

Dream Windows are the primary building block for HomeDream Surface, Edit ProfileDream Surface, Daydream Surfaces, and View Profile Surface.

### 3.6 Daydream Surface Network

**Daydream Surfaces and Engin runtimes** form a **multi-surface, multi-engin connection network** — not a one-to-one pair system.

There are:
- **6 Daydream Surfaces** — user-facing lived creative spaces
- **6 Engin runtimes** — powered execution / emulator layers
- **11 named connection paths** across scope, resolution, and task depth

Any Daydream Surface may connect to multiple Engins. Any Engin may power multiple Surface contexts. The system behaves as an interconnected runtime graph, not isolated route silos.

The six Daydream Surfaces and their primary Engin runtimes:

| Daydream Surface | Primary Engin Runtime |
|---|---|
| Music Daydream Surface | StarMakerEngin |
| Games Daydream Surface | GameEngin |
| Lab Daydream Surface | LabEngin |
| Code Daydream Surface | CodeEngin |
| Brand Daydream Surface | BrandingEngin |
| Create Daydream Surface | ContentEngin |

These are runtime surfaces, not detached runtimes. They share the runtime's privacy rules, ownership model, Dream Window system, and navigation continuity. A Daydream Surface or Engin runtime that does not respect the shared platform rules is not a valid DREAMengin surface.

### 3.7 Platform Modules

**DreamDM, DreamDM Bar, DreamMenu, DreamMarketplace, DreamShop, and DreamAds** are platform modules — not detached runtimes, not standalone products, and not cosmetic wrappers.

They operate under the same privacy rules, ownership model, and action-honesty requirements as every other part of DREAMengin. No platform module may claim an exemption from the shared product constitution.

---

## 4. Navigation Principles

Navigation in DREAMengin must feel like **depth**, not surface switching.

The **DreamDM Bar** continuously connects the user to different sides of their world without forcing context loss.

If a navigation move feels like:
- leaving the world
- reloading the world
- forgetting where you were

then it is wrong.

If it feels like:
- opening deeper
- staying oriented
- flipping back naturally

then it is correct.

Rules:
- **HomeDream Surface** is the root operating surface — everything else opens from it, not away from it
- Profile is a flip / paired surface relationship
- Dreams open into deeper runtime layers
- Daydream Surfaces are not random routes; they are deeper lived spaces
- Going back must restore context, not reload a new world

---

## 5. Runtime Principles (Operational Definitions)

### 5.1 User-First (Operational)

User-first means:

- Every default state favors the user's ownership and control.
- Every action path requires user intent.
- The runtime does not use the user's session to perform actions they have not explicitly requested.
- Convenience features may not override user ownership, visibility control, or explicit confirmation requirements.

User-first is not a marketing claim. It is a system constraint.

### 5.2 Privacy-First (Operational)

Privacy-first means:

- The system enforces private as the default state at the data and API layer — not just in UI copy.
- Nothing stored in the system is publicly readable unless a visibility record explicitly permits it.
- No platform module — including AI, commerce, messaging, or advertising — may bypass this enforcement.
- Silent exposure is treated as a system failure. Privacy-safe failure is the required default when the system is uncertain.

Privacy-first is not a trust slogan. It is a system architecture requirement.

### 5.3 Customizable (Structural)

Customizable means:

- Users control the arrangement, composition, and behavior of their surfaces — not just their appearance.
- Dream Window placement, feed behavior, visibility rules, and source bindings are user-controlled structural choices.
- The runtime does not override user-configured structure without explicit user action.

Customizable is not limited to theme or color selection.

### 5.4 Modular (Structural)

Modular means:

- The Dream Window system is the primary mechanism for adding capability to the runtime.
- New features attach to the existing Dream Window, surface, and module architecture.
- Data models must align with the Dream Window ownership, visibility, and type structure.
- UI composition must use the established Dream layer model (Shell → Connector → Feature → Output).
- A feature that cannot be expressed as a Dream Window, a surface extension, or a module extension may not fit inside DREAMengin's product identity.

Modular is not a description of independent components. It is a constraint on how capability is added.

---

## 6. Reading Earlier Phases as One System

All phases of DREAMengin development must be read as parts of one runtime, not as isolated builds.

- Phase results are contributions to the unified system — each one extends the same surface model, the same privacy model, and the same Dream Window architecture.
- Where earlier phase output conflicts with this definition, this document wins.
- Where phase output is incomplete, the definition above describes what completion requires.
- A feature that was built in an earlier phase but violates this definition is a residual — it must be conformed, not preserved.

No phase may be cited as justification for violating this product definition.

---

## 7. Deciding Whether a Proposed Feature Belongs Inside DREAMengin

A proposed feature belongs inside DREAMengin if and only if it meets all of the following:

1. **Naming fit** — it can be named with canonical DREAMengin vocabulary without distortion.
2. **Privacy fit** — it can operate with private-by-default enforcement without requiring a bypass.
3. **Action honesty** — every user-facing action in it maps to a real system outcome.
4. **User-control compatibility** — it does not require the runtime to take actions on the user's behalf without explicit confirmation.
5. **Modularity fit** — it can be expressed within the Dream Window system, the existing surface model, or a valid extension of an existing platform module.
6. **No detachment** — it must share privacy rules, ownership logic, and naming conventions with the rest of the runtime.

A feature that fails any of these criteria is either not ready for DREAMengin or not appropriate for DREAMengin.

---

## 8. Authority and Conflict Resolution

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

