# DREAM ENGINE ARCHITECTURE

> **For the current design specification and interaction model, see [SPEC.md](./SPEC.md).**
Version: 1.0.0  
Status: Active Spec  
Scope: System architecture, navigation model, interaction model, security/privacy model, and code organization.

This document describes how Dream Engine is built and how it must evolve without violating the axioms.

---

## 0. Governing Axioms

Dream Engine is constrained by five axioms (see `/docs/AXIOMS.md`):

1) Instant Understanding  
2) User-Shaped Space  
3) Real Capability  
4) Security by Default  
5) Privacy by Design

Architecture choices must satisfy all five. If a change violates an axiom, it must be redesigned or removed.

---

## 1. Product Model

Dream Engine is not a page-based app. It is a spatial operating surface where content and tools are represented as interactive widgets (“objects”) arranged in a navigable manifold (“space”).

Core user loop:
- Move (swipe) → Focus (tap) → Act (create/edit/share) → Return (home anchor)

Dream Engine may link out to external services (e.g., Instagram, YouTube, GitHub) rather than attempting to replace them. Dream Engine is the “space around the content,” not the content itself.

---

## 2. Stack and Runtime

Primary stack:
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + DB + Storage)
- iOS-first interaction and performance constraints

Spatial layer (incremental adoption):
- Babylon (preferred for 3D / manifold visuals when needed)
- Rendering is demand-driven and battery-aware (see Section 10)

---

## 3. Information Architecture

High-level surfaces:
- Landing (marketing + entry)
- Auth (sign-in / create)
- Home Space (widget space anchored at “home”)
- Profile Space (same system, different focal node)
- Daydream Spaces (domains: work/play/learn/discover/express/indulge/shop)

Key constraint:
Home and Profile are not fundamentally different pages. They are focal states inside the same space.

---

## 4. Navigation Architecture (Spatial, Not Routes)

Routes exist for:
- entry points
- auth boundaries
- deep links
- “spaces” with distinct server-side data requirements

But primary navigation is spatial:
- Swipe directions move across nodes (faces/slots)
- Zoom changes depth (layers)
- Home returns to anchor and resets traversal context

### 4.1 Navigation State (Discrete, Current)

Minimum discrete state:
- `node`: current face/node identifier
- `depth`: zoom layer index (0..N)
- `layer`: derived name for UX (e.g., widget/face/cube/home/dreams/work)

This is sufficient to implement strict mapping and maintain consistency without a full physics engine.

### 4.2 Future State (Continuous, Spec-Compatible)

When upgrading to continuous manifold:
- orientation quaternion `q`
- position `p ∈ ℝ³`
- velocities (linear/angular)
- depth `d` continuous
- face/slot indices derived from projection

The system must remain compatible with the discrete model during transition (progressive enhancement).

---

## 5. Spatial Model

Conceptual topology:
- Cube adjacency with “spherical continuity” feel
- Wrap behavior (no seams)
- Depth = layers of meaning:
  - `0`: widget
  - `1`: face
  - `2`: cube
  - `3`: home
  - `4`: dreams
  - `5`: work (or domain-specific “outer orbits”)

Design principle:
Users should feel like they move through objects, not that the UI “teleports” between screens.

---

## 6. Interaction Model

The entire interaction model should be learnable without instruction (Axiom 1).

Core gestures:
- Swipe: move directionally in the navigation graph
- Tap: focus / open / select (no hard route changes unless necessary)
- Zoom (pinch/scroll): change depth layer
- Home tap: return to home anchor and reset traversal context
- Home double-tap: toggle NAV MODE (unlock/lock controls)
- Menu Button tap (NAV MODE): open System or Daydreams menu
- Drag: reposition controls/widgets (User-Shaped Space, Axiom 2)

### 6.1 Control Objects (Home Buttons)

The Home Buttons system has two modes:

**LOCKED MODE** (default after login):
- Two buttons overlap at center (cross-color rings: blue shows gold ring, gold shows blue ring).
- **Single tap → Open BOTH menus side-by-side** (Daydreams right, System left).
- **Double tap → Enter NAV MODE.** Buttons snap to saved rail corners. A brief "NAV mode" indicator appears (~2s).
- "Double tap to unlock" hint appears once per login session, auto-dismissing after ~2s.

**NAV MODE** (unlocked):
- Blue button (Dreams) on right rail; Gold button (System) on left rail.
- **Single tap either button → Go Home** (reset anchor).
- **Double tap Dreams button → Open Daydreams menu** (7 Daydreams + Marketplace + Shop).
- **Double tap System button → Open System menu** (Dr. Eams, Settings, Account, Feed Settings, Connectors, Go Home).
- Buttons drift back together via gentle gravity; magnetic snap (< 88 px) auto-relocks.
- Button positions persist in `localStorage` key `dreamengin:controls:v4`; draggable along vertical rail.

**10-second explanation:** Tap once = see everything. Double-tap = unlock for precision. Tap to go home when done. Buttons auto-lock when left together.

Home controls are persistent “system objects,” not navigation UI.
They may:
- move (drag)
- fidget (gentle physics)
- open menus
- return home (single tap)

They must not:
- steal gestures from the surface
- trap the user
- freeze the UI
- get stuck off-screen (always clamp/bounce inside safe bounds)

---

## 7. UI Layering

Dream Engine uses layered composition rather than page replacement:

- Base layer: spatial widget surface (grid/field)
- Focus layer: selected/focused widget “comes forward”
- System layer: home controls + overlays/menus
- Modal layer: transient overlays (menus, chats)

Rule:
No feature may require a full-screen takeover unless it is a hard boundary (auth, payments, sensitive flows).

---

## 8. Data Architecture

Supabase is the system of record:
- Auth: sessions, OAuth, email/password
- DB: profiles, posts, content, albums, nav logs
- Storage: media uploads

### 8.1 Read Model

Server components fetch:
- user session (SSR cookies)
- profile
- feed data (with visibility constraints)

Client components fetch:
- incremental updates
- local UI state (positions, focus)
- interactive workflows (upload, compose)

Rule:
Sensitive data should not be fetched client-side unless necessary.

### 8.2 Write Model

All writes must be authenticated and validated (Axiom 4):
- Prefer server routes for auth-sensitive actions
- Validate inputs server-side
- Use RLS for all user-owned tables

---

## 9. Security Model (Axiom 4)

Security by default means:
- Treat all client input as hostile
- Use Supabase Row Level Security for all tables that store user-owned data
- Avoid exposing service role keys in any client context
- Use server routes for session-setting operations
- Avoid leaking private object metadata in public queries

Minimum requirements:
- RLS enabled on all user tables
- `auth.uid()` used as the ownership boundary
- `visibility` fields enforced in policies (not only in UI)
- Server routes validate payloads and return minimal data

Auth-specific:
- Email/password sign-in must set cookies in a server route so SSR pages see the session immediately
- Logout must clear cookies via server route

---

## 10. Privacy Model (Axiom 5)

Privacy by design means:
- Collect minimal data
- Clear boundaries between public and private content
- No hidden tracking
- Users can delete their data

Operational rules:
- Do not log raw user content unnecessarily
- If nav logs exist, store minimal vectors/indices and timestamps (avoid storing sensitive content)
- Keep AI prompts private by default; do not publish them unless explicitly chosen by the user

---

## 11. Performance and Battery Model

Dream Engine must remain iOS-first and battery-aware:

Rendering rules:
- Render on demand when idle
- 60fps during active interaction
- 30fps (or less) during passive/idle
- Freeze static meshes (if/when 3D is active)
- No unnecessary post-processing

UI rules:
- Avoid constant animations; prefer reaction-based motion
- Physics loops must be minimal and stop when settled (e.g., home controls fidget only when needed)
- Avoid heavy random generation on mount
- Prefer deterministic layouts and memoized filtering

---

## 12. Code Organization

Recommended folders (align to existing repo patterns):

- `app/`
  - route entry points (landing, auth, home)
  - server components for SSR data fetching
  - `api/` routes for auth and other sensitive operations

- `components/`
  - UI primitives and composed surfaces
  - `dreamnav/` navigation surface + runtime renderers
  - `dreamengin/` menus, controls, system overlays
  - `widgets/` widget surfaces and widget components
  - `spatial/` widget-space UI layouts

- `lib/`
  - pure logic (delta maps, gesture arbiters, math, filters)
  - no React and no side effects

- `hooks/`
  - client-only data hooks for interactive modules
  - keep hooks small; move logic to `lib/` if reusable

Key rule:
UI components should be “thin.” All reusable logic should live in `lib/`.

---

## 13. Clean Architecture Rules (Anti-Spaghetti)

To avoid spaghetti:
- Keep navigation state in one place (the nav surface)
- Pass state down as a single object (`{ node, depth, layer }`) to runtimes
- Extract pure helpers to `lib/` (filtering, mapping, transforms)
- Avoid “god components” with mixed concerns (data + logic + UI + effects)
- Prefer small pure functions + memoization over ad-hoc inline logic

Red flags:
- duplicate route logic in multiple files
- hard-coded depth numbers scattered across components
- auth logic split between client and server inconsistently
- “random” visual effects created on every mount

---

## 14. Dr. Eams (AI) Integration

Dr. Eams is a system object:
- accessible via system menu (Nexus)
- optionally accessible within daydream menu (Outdream) as “ask Dr. Eams”

Rules:
- AI is additive, not required to navigate
- AI must not block core UX if it fails
- AI memory/context must be privacy-respecting by default

Suggested minimal implementation:
- chat UI component
- server route that calls model / proxy
- optional retrieval over user-approved documents (explicit opt-in)

---

## 15. Progressive Roadmap (Implementation Order)

To keep momentum without chaos:

Phase 1: Stability + Consistency
- strict nav mapping
- home reset correctness
- auth correctness
- menu correctness
- performance baseline

Phase 2: Surface Polish
- focus transitions
- depth cues
- consistent motion language
- reduce visual noise

Phase 3: Daydream “Entry Loops”
- each daydream gets 1-2 core interactions (no full systems)
- keep UX simple and consistent

Phase 4: Continuous Manifold (optional)
- quaternion orientation + smoothing
- physics integrator
- sphere/cube projection
- idle throttling + freeze

Phase 5: Monetization (last)
- only after product is stable and used
- legal + payments + policies

---

## 16. Definition of “Done” (System-Level)

A feature is done when:
- it satisfies all 5 axioms
- it is consistent with navigation and interaction rules
- it does not introduce persistent performance drain
- it does not weaken security/privacy posture
- it feels usable without explanation

Dream Engine is “ready to show” when:
- a new user can explore without instruction
- they never feel lost (home anchor works)
- interactions feel alive and responsive
- auth is stable
- there are no dead ends (every direction leads somewhere)

---
