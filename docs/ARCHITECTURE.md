# DREAM ENGINE ARCHITECTURE

> **For the current design specification and interaction model, see [SPEC.md](./SPEC.md).**
Version: 1.1.0  
Status: Active Spec  
Platform: **Next.js 16+** (App Router, TypeScript strict)  
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
- **Next.js 16+** (App Router) — this is a Next.js 16+ project
- TypeScript (strict)
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

### 6.1 Control Objects (Home Button)

There is **one** home button — the **Gold (System) button** on the right rail.

The two-button layout (blue + gold side by side) is reserved for **daydream-specific controls only** — for example, the Games Daydream uses the dual-button layout as a game remote controller (see §18 Universal Mobile Remote). It is not a home navigation element.

The single gold button has two modes:

**LOCKED MODE** (default after login):
- Gold button snapped to center-bottom, with subtle blue ring.
- **Single tap → Open Daydreams menu.**
- **Double tap → Enter NAV MODE.** Button snaps to saved corner on right rail. A brief "NAV mode" indicator appears (~2s).
- "Double tap to unlock" hint appears once per login session, auto-dismissing after ~2s.

**NAV MODE** (unlocked):
- Gold button on right rail, draggable vertically.
- **Single tap → Go Home** (reset anchor).
- **Double tap → Open System menu** (Dr. Eams, Settings, Account, Feed Settings, Connectors, Go Home).
- Button drifts back to center via gentle gravity when released; position persists in `localStorage` key `dreamengin:controls:v4`.

**10-second explanation:** Tap once = open Daydreams. Double-tap = unlock for precision nav. Tap to go home when done.

Home controls are persistent “system objects,” not a navbar.
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

---

## 17. Mobile-First Platform

DREAMengin is a **mobile-first platform**. This is not a style preference — it is a product constraint.

### 17.1 What mobile-first means here
- Every screen is designed and QA'd on a 390 × 844 px viewport (iPhone 14 base) before being tested on larger screens.
- Touch targets are ≥ 44 × 44 px with no exceptions.
- No feature requires a hover state to be discoverable or usable.
- Pinch-zoom is disabled in game surfaces (viewport meta + `touchAction: none`).
- All interactive controls must be reachable with one thumb while the other holds the device.
- Performance budget: < 3 s TTI on a mid-range Android device on 4G.

### 17.2 Progressive enhancement order
1. **Mobile touch** (primary — must always work)
2. **PS5 DualSense / gamepad** (first controller target)
3. **Keyboard + mouse** (desktop — enhanced, not primary)

### 17.3 Implementation rules
- Use `@media (pointer: coarse)` for touch-specific overrides.
- The root `<html>` viewport must always include `width=device-width, initial-scale=1`.
- Game pages must additionally export a Next.js `viewport` object with `userScalable: false`.
- Battery-aware: pause animations when `visibilitychange` fires or the tab is hidden.

---

## 18. Universal Mobile Remote

The Universal Mobile Remote is the canonical touch control system for all DREAMengin game surfaces.

### 18.1 Design

Two circular thumbstick pads positioned near the bottom corners of the screen,
slightly inset from the edges (not flush — room for thumb to rest):

```
┌────────────────────────────────────────────────┐
│                  game surface                  │
│                                                │
│                                                │
│  ╭──────╮                          ╭──────╮   │
│  │  L   │                          │  R   │   │
│  ╰──────╯                          ╰──────╯   │
└────────────────────────────────────────────────┘
  LEFT STICK                      RIGHT STICK
  (move)                          (actions)
```

### 18.2 Left stick — movement
| Gesture | Action |
|---------|--------|
| Drag left | Move left |
| Drag right | Move right |
| Tap (no drag) | Stop / idle |

### 18.3 Right stick — 7 actions (6 directions + tap)
| Gesture | Action | Power-up required |
|---------|--------|-------------------|
| Drag up | Jump (double-jump on second press) | No |
| Drag down | Duck / crouch | No |
| Drag left | Spin attack | Yes |
| Drag right | Shoot laser | Yes |
| Tap (short, no drag) | Context action (interact / examine) | No |
| Drag up-left | Jump + spin | Yes |
| Drag up-right | Jump + shoot | Yes |

### 18.4 PS5 DualSense Gamepad API mapping
| PS5 Button / Axis | Action |
|---|---|
| Left stick X axis | Move left / right |
| Right stick Y axis (up) | Jump |
| Right stick Y axis (down) | Duck |
| Right stick X axis (left) | Spin |
| Right stick X axis (right) | Shoot |
| Cross (×) / button 0 | Jump (alternate) |
| Square (■) / button 2 | Spin |
| Circle (●) / button 1 | Shoot |
| Triangle (▲) / button 3 | Context action |
| L2 / axis 6 | Duck (hold) |
| R2 / axis 7 | Shoot (hold) |
| Options / button 9 | Pause / menu |

### 18.5 Adding buttons for other game types
For game types that need more than the 7 base actions, additional pill buttons
can be placed around the joystick area. Rules:
- Maximum 2 extra buttons per side.
- Always ≥ 44 × 44 px.
- Use the `de-btn` + `de-btn-gold` or `de-btn-primary` class.
- Never overlap the joystick drag zone.

### 18.6 Zoom prevention
All game surfaces must prevent browser pinch-zoom:
1. Export a Next.js `viewport` object from the page with `userScalable: false`.
2. Set `style={{ touchAction: 'none' }}` on the canvas element.
3. Call `e.preventDefault()` in all touch event handlers.
