# DREAMengin Production Spec (Authoritative v2.0.0)

DREAMengin is a spatial, gesture-driven creative platform built on Next.js + Supabase. It does not behave like a normal “website with pages.” The user is always inside a continuous system where content moves and the camera/viewport stays conceptually anchored. Navigation is state-driven, deterministic, and defined by a single transition function τ (tau).  

Primary target: iOS Safari. Performance target: stable 60fps wherever possible.

---

## 0) What DREAMengin is (so nobody forgets)

DREAMengin is a “home for all your homes” — a unified system where your social feeds, creative tools, and personal spaces live as Dreams (widgets) arranged on a spatial surface.

You do not “change pages.”
You move through your Dreams.

Key idea:
- A **Dream** is a **widget instance**.
- The user’s system is a spatial workspace.
- “Home” is not a URL — it’s a state (node 0).

---

## 1) Canonical terms (do not invent new nouns)

- **Widget instance**: a placed module in the spatial system. Identified by `widget_instances.id`. This is the only thing that renders and receives gestures.
- **Dream**: user-facing name for a widget instance. `Dream = widget_instance`.
- **Core Dream**: the dual-sided `core_dream` widget. It flips between:
  - **Home Feed** (front face)
  - **Profile** (back face)
  These are faces of one widget, not separate routes.
- **Day Dreams**: six fixed, specialised outer workspaces (`day_dream` widgets). Dual-sided, fixed purpose.
- **Return Home**: a state transition back to the anchor. The core dream is opened and navigation context resets.
- **Home controls**: two always-present on-screen controls (blue + red). They are gesture-first; no “nav buttons.”
  - Double-tap blue: Dream menu (Outer Dreams)
  - Double-tap red: System menu (Search, Dr. Eams, Settings, Account, View All Dreams, Edit Layout)
  - (Later) hold/drag depth commands; for now, keep anchored + simple to avoid iOS Safari back/refresh conflicts.

---

## 2) System inventory & limits

The platform supports:
- 1 **core_dream** (dual sided)
- Exactly 6 **day_dream** widgets (dual sided, fixed identities)
- Up to 48 **custom Dreams** (single sided) distributed on the surface

Custom Dreams:
- Can publish into the Home Feed
- Can appear in the Profile interior layout
- Are orthogonal polygon shapes (4 or 6 corners at 90°)

---

## 3) Layout model (what you actually see)

### 3.1 Base layout (core dream open)
Default login state:
- Core Dream centered
- 4 Dreams above (top row)
- 4 Dreams below (bottom row)
- Home controls near bottom center (infinity pairing concept)

Top/bottom Dreams can be closed; closed Dreams return to their home slots.

### 3.2 Home Feed face (front of core dream)
This is “default after login.”
- Feed surface occupies the center (roughly 2/3 feel)
- Surrounding Dreams (favorites) influence what’s in the feed (sources)

### 3.3 Profile face (back of core dream)
Visible to followers.
- Full-page, highly interactive profile surface
- Hosts selected Dreams and configuration tools
- Designed to be “spend hours exploring someone’s system”

### 3.4 Core dream closed (full navigation feel)
When the core dream is closed:
- The center region fills with additional Dreams (up to 16 placements depending on sizes)
- Return Home snaps back to anchor and reopens the core dream

---

## 4) Navigation model (non-negotiable)

Navigation is defined ONLY by τ:
- There is no stack
- There is no “back”
- There are no page transitions
- 0 is the anchor state

State:
```ts
state = { node: Node, heading: Direction | null }

Rules:
	•	Any transition to node 0 resets heading to null
	•	Buttons do not “navigate pages”
	•	The cube is a mental model / debug overlay only
	•	The surface always feels flat; adjacency rules are what matter

⸻

5) Gestures & iOS Safari constraints

We must not rely on browser-default gestures:
	•	iOS swipe-down refresh conflicts with vertical navigation
	•	iOS swipe-left “back” conflicts with horizontal navigation

Therefore:
	•	Use pointer events + prevent default where needed
	•	touch-action: none on the main interaction surface
	•	No “real” browser navigation attached to controls or menus

⸻

6) Day Dreams (fixed outer workspaces)

day_dream_id	Side A (face 0)	Side B (face 1)
music	Music studio: create/play/manage	Releases: publish/promote/sell
lab	Notes & research	Simulator: physics/size simulations
games	Library: owned/available games	Play surface
code	Code workspace/editor	Preview: run website/game preview
brand	Brand management & social tools	Analytics: traffic/revenue/growth (premium)
create	Projects: boards/media plans	Media vault: upload/categorise/schedule


⸻

7) Dreams, feeds, and cross-communication

Home Feed aggregates content from user-selected Dreams.

Publishing behavior:
	•	Publishing is initiated via the core dream
	•	Fan-out to all configured destinations occurs as one atomic action

Communication mechanisms:
	•	DB events: widget_events
	•	Client event bus for immediate cross-dream sync

⸻

8) Database alignment (Supabase)

Do not introduce new nouns.

Mapping:
	•	Day dreams: stored as widget_instances with kind = 'day_dream' and fixed identifiers
	•	Core dream: widget_instances.kind = 'core_dream'
	•	Custom dreams: other kind values based on widget_definitions

⸻

9) Performance rules (mobile 60fps)

MUST:
	•	touch-action: none on the main surface
	•	Use refs for gesture state; do not set React state on every move
	•	Commit state on gesture end / threshold
	•	Use GPU transforms
	•	Avoid allocations in hot paths

⸻

10) AI access control

Only Dr. Eams is user-facing (system menu).
Other system AIs exist only behind Dr. Eams with server gating.
Never show system AIs as direct menu items.

⸻

11) Non-goals

Do not:
	•	Add navigation bars
	•	Turn “Home” into a URL route
	•	Turn the cube into a real scene layer
	•	Expose system AI directly
	•	Use pinch-out to enter day dreams (unless explicitly re-approved)

⸻

12) Implementation status

Legacy UI exists in repo. This version prioritizes:
	•	Toroidal workspace feel
	•	Two home controls
	•	Overlay menus (Dream menu + System menu)
	•	Deterministic navigation state machine (τ)
	•	Supabase-backed data models with strict typing + validation

⸻

Appendix A — τ (Navigation Transition Function)

This is the single source of truth for navigation.
No other navigation logic is allowed anywhere else.

NOTE: This appendix describes navigation only. The sections above define what the website IS.

// DREAMengin v2.0.0 — Authoritative Navigation Spec (τ)
// (same τ code you already approved should live here verbatim)

