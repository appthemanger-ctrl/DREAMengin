# DREAMengin Production Spec (Authoritative v2.0.0)

DREAMengin is a spatial, toroidal, gesture‑driven creative platform built on Next.js and Supabase.  Rendering and motion
physics are driven by Babylon.js (or an equivalent custom renderer when unavailable).  Users travel on a flat, infinite surface; a cube
is a mental model only and may be represented as an optional overlay for debugging.  The primary target is iOS Safari and
the experience must remain stable at 60fps wherever possible.  This document is the single source of truth for terminology,
UI behaviour, navigation and the implementation plan.

## 1  Canonical terms and code names

* **Widget instance** – A placed module in the spatial system.  It is identified by `widget_instances.id` and is the only
  thing that renders on screen and receives gestures.
* **Dream** – User‑facing term for a widget instance.  Dreams are not a separate entity; `Dream = widget_instance`.
* **Core Dream** – The dual‑sided `core_dream` widget that flips between the Home Feed and the Profile.  Home Feed and
  Profile are not routes but faces of this widget.
* **Day Dreams** – Six fixed, specialised outer workspaces (`day_dream` widgets).  Each has two faces with a fixed,
  specialised function (see §7).
* **Return Home** – A state transition back to the base anchor: camera snaps to the base anchor location, the core dream
  is opened and zoom is reset.  Home is a state, not a URL.
* **Home controls** – Two always‑present, gesture‑driven controls that live on the screen: the blue button and the red
  button.  They default to the bottom‑centre of the screen, side‑by‑side.  When aligned they form an infinity symbol.
  - **Blue control** – Primarily handles inward navigation (diving into Day Dreams) and opens the Dream selection menu
    (Outer Dreams) on double‑tap.
  - **Red control** – Primarily handles outward navigation (system and profile) and opens the system menu (Search, Dr. Eams,
    Settings, Account, View All Dreams, Edit Layout) on double‑tap.
  The controls can be dragged anywhere on screen; they remember their last positions but have no permanent location.  To go
  home, drag one control onto the other until they touch; both controls will snap back to their previous locations and the
  camera returns to the base anchor.
* **Combined commands** – Holding a control and dragging vertically initiates depth navigation.  Holding the blue control
  and dragging upward dives inward (toward Day Dreams); holding the red control and dragging downward moves outward (toward
  the base).  The speed of movement is proportional to drag distance.  Commands end when the thumb leaves the screen.  A
  double‑tap opens the respective menu instead of initiating a hold.
* **Cube** – A mental model and optional overlay used to debug spatial adjacencies.  The on‑screen travel always feels like
  a flat surface; the cube itself never becomes a route.

## 2  System inventory and limits

The platform supports one `core_dream` (dual‑sided), exactly six `day_dream` widgets (dual‑sided, fixed) and up to 48
customisable Dreams (single‑sided) distributed across the toroidal surface.  Custom Dreams may vary in size and shape but
must be orthogonal polygons with four or six 90° corners.  Custom Dreams can publish to the Home Feed and appear both in the
navigation area and the Profile’s interior layout.  When the core dream is closed the central region may host up to 16
additional Dreams, but the global limit across all quadrants is 48.

## 3  Layout model

### 3.1  Base layout with the core dream open

The base layout comprises a top row of four Dreams, the core dream in the centre and a bottom row of four Dreams.  Dreams
in the top and bottom rows can be closed; closed Dreams return to their home spots.  Day dreams cannot be removed but may
be entered and exited.

### 3.2  Profile face layout

The profile is the back face of the core dream.  It hosts selected Dreams and configuration tools.  It can display a
“Dream Feed” view based on selected Dream sources.

### 3.3  Base layout with the core dream closed

When the core dream is closed the centre region is filled with additional Dreams drawn from the pool of 48.  Up to 16
placements are possible depending on shape sizes.  Pressing either home control onto the other returns to the base anchor
and reopens the core dream.

## 4  Navigation model

### 4.1  Toroidal surface travel

The surface is infinite in both X and Y and wraps like a torus.  Swiping horizontally travels through Dreams; swiping
vertically travels between rows and quadrants.  A swipe left then up never returns to the base quadrant.  Zoom gestures
provide inspection only and do not change depth; pinch‑out is not used to enter day dreams.

### 4.2  Depth and day dream entry

Day dreams are entered via the home controls, not via pinch.  Depth traversal is conceptually `base ↔ day_dream surfaces`.
Holding and dragging the blue control upward dives into a day dream.  Holding and dragging the red control downward moves
outward toward the base.  Dragging one control onto the other instantly returns home.

## 5  Home controls and gestures

The blue and red controls are identical in size and shape but coloured differently.  They default to the bottom centre of
the screen.  Users can drag the controls to reposition them; their positions are stored in local memory and restored on
subsequent visits.  Gestures are as follows:

* **Double‑tap on the blue control** – Opens the Dream selection menu (listing day dreams and custom Dreams).
* **Double‑tap on the red control** – Opens the system menu (Search, Dr. Eams, Settings, Account, View All Dreams, Edit Layout).
* **Hold + drag upward on the blue control** – Initiates inward travel into day dreams.  The travel speed increases with
  drag distance.  Releasing the thumb ends the command.
* **Hold + drag downward on the red control** – Initiates outward travel toward the base.  Releasing the thumb ends the command.
* **Drag one control onto the other** – Returns to the base anchor.  Both controls snap back to their previous positions.

Commands always end when all thumbs leave the screen to avoid accidental activation of other commands.

## 6  Day dreams

Six specialised day dreams exist with fixed dual‑sided functionality:

| day_dream_id | Side A (face 0)                            | Side B (face 1)                                |
|-------------:|-------------------------------------------|------------------------------------------------|
| music        | Music studio: create, play, manage music | Releases: publish, promote, sell               |
| lab          | Notes & research                         | Simulator: physics and size simulations        |
| games        | Library: owned/available games           | Play: immersive play surface                   |
| code         | Code space: editor & project workspace   | Preview: run website/game preview (GitHub later) |
| brand        | Brand management & social tools          | Analytics: traffic, revenue, growth (premium)  |
| create       | Projects: organise boards & media plans  | Media vault: upload, categorise, schedule      |

## 7  Dreams, feeds and cross‑communication

The Home Feed (front face of the core dream) aggregates content from user‑selected Dreams.  Publishing happens via the core
dream but fans out to all configured destinations (Dreams, feed, profile) as a single atomic action.  Dreams communicate via
events (`widget_events` table) and a client event bus.  Event types include publishing feed entries, requesting data,
opening related dreams and synchronising state.

## 8  Database alignment

The implementation uses Supabase.  Avoid introducing new nouns that do not map to existing tables.  Day dreams are stored as
`widget_instances` with `kind = 'day_dream'` and fixed identifiers.  The core dream uses `kind = 'core_dream'`.  Custom
dreams use appropriate `kind` values depending on the widget definition.

## 9  iOS performance rules

To achieve 60 fps on mobile:

* `touch‑action: none` on the canvas or container.
* Store gesture state in refs; avoid React state updates during pointer moves.
* Commit state on gesture end or threshold crossing.
* Use GPU‑only CSS transforms for panning and zooming.
* Avoid memory allocations in the render loop.

## 10  AI access control

Only **Dr. Eams** appears in the user‑facing UI via the system menu.  **Inner Dreams (IDARi)** and **Boogie Man (BMSys)**
are system AIs accessible only through Dr. Eams chat with server‑side gating.  System AIs never appear as menu items.

## 11  Non‑goals

Do **not** add navigation bars, turn Home into a route, turn the cube into a layer, expose system AI in user menus or use
pinch‑out navigation to enter day dreams.

## 12  Three‑agent architecture

DREAMengin is powered by three cooperating AIs.  Each has strict separation of duties and communicates via structured
tickets.  They never share credentials or privileged data directly.

### 12.1  Dr Eams – User‑facing theorist & builder

Dr Eams is the primary interface for users.  It interprets intent, maintains user context and performs high‑level reasoning,
explanation and CCC/physics framing.  Dr Eams drafts **Dev Tickets** when code, infrastructure or migrations are needed and
**Policy Tickets** when actions involve sensitive content or resources.  It summarises outcomes and risk states back to the
user.  Dr Eams never accesses production secrets or PII, never triggers destructive operations without a plan from IDARi and
approval from BMSys, and never bypasses BMSys for high‑risk categories.

### 12.2  IDARi – Admin & operator brain

IDARi designs and plans code changes, database migrations, debugging steps and moderation tooling.  It interprets **Dev Tickets**,
assesses risk and, when necessary, requests a **Policy Ticket** from BMSys.  IDARi returns explicit plans (not direct
execution) unless explicitly allowed.  It respects BMSys decisions and safeguards in all plans.  IDARi never unilaterally
executes destructive or production‑impacting actions.

### 12.3  BMSys – Trust, safety and ledger cop

BMSys is the central policy and risk engine.  It receives structured **Action/Policy Tickets** from Dr Eams and IDARi,
computes risk scores and returns decisions (`allow`, `allow_with_safeguards`, `require_human`, `deny`).  It may suggest
transformations such as redacting PII, aggregating data, sandbox‑only access or limiting detail.  BMSys acts as a ledger
tension estimator: repeated policy probing or abuse raises risk scores and tightens decisions.  High‑risk cases are escalated
to human review.  All non‑trivial actions are logged as ledger entries (see the system ledger specification for details).

## 13  Implementation status and rebuild plan

The current repository includes legacy UI and UX (e.g., HomeRadialNav, AnchorWidget).  This version strips down the UI to
focus on the toroidal workspace, the two home controls and the Dr Eams entry point.  A new `DreamenginApp` component
implements the Babylon (or custom) renderer, the gesture logic described above and the overlay menus for Outer Dreams,
system functions and Dr Eams.  Subsequent work should focus on implementing Babylon‑based physics, toroidal wrapping,
day‑dream traversal and Supabase‑backed data models.  API routes must enforce Zod validation and strict Supabase typing.