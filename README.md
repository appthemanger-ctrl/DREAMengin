# DREAMengin Production Spec

DREAMengin is a spatial, gesture-driven creative platform built on Next.js and Supabase.
It uses a toroidal navigation model where the user never hits a wall: swipe and zoom always reveal more space.

Primary target: iOS Safari

---

## Core Principles

1. HOME is not a route or page.
   HOME is a widget feed workspace.

2. Navigation bars are not required.
   Everything is accessible via swipe, pinch zoom, and Home buttons.

3. Profile is a widget, not a page.
   It flips from an icon inside the Home Feed widget.

4. Cube is not a layer.
   Cube is a visualization of the navigation topology and widget space.

5. AI exposure is strict.
   Dr. Eams is the only user-visible AI.
   Inner Dreams and Boogie Man AI are admin-only and never appear in user menus.

---

## UI Layout Definition

Default HOME layout is always:

Top Row: 4 small widgets
Center: Home Feed widget
Bottom Row: 4 small widgets

The Home Feed widget is the core workspace.
The feed is composed from the widgets the user has chosen.

Profile widget behavior:
- A profile icon exists inside the Home Feed widget
- Tap icon triggers flip transition into Profile widget
- Profile widget contains its own internal widget layout (simple, extensible)
- Close action slides the profile widget off to the side and docks it
- Docked profile remains accessible and can be reopened
- Optional full close with X

---

## Gesture Navigation Model

Navigation is toroidal.
The user never reaches a boundary.

Required gestures:

Horizontal swipe:
- Cycles the active widget selection left and right
- Wraps around, no end

Vertical swipe:
- Moves the top row and bottom row in a continuous loop
- Exposes additional top and bottom rows if configured
- Wraps around, no end

Pinch:
- Zoom in and out of the current focused widget region
- Zoom is stateful and must be stable at 60fps on iOS

Home buttons:
- Home button returns focus to the Home Feed widget in the center, reset zoom to 0
- Second Home button is a secondary anchor toggle:
  - First press stores a snapshot of current camera/nav state and returns to Home
  - Next press restores that snapshot

---

## Cube Visualization

Cube is a visualization tool, not a navigation layer.

The cube represents the Home widget space:

- Center represents current Home Feed state
- Faces represent adjacent widget contexts or directional groupings
- Outer layers represent Dreams

Cube is opened as an overlay.
Cube does not replace the shell or change routes.
Cube may allow selecting a target focus point, but it never becomes a “layer.”

---

## Dreams

Dreams are outer-layer widget spaces.
Dream widgets are specialized environments, for example:
- Music Lab
- Creator workspaces
- Immersive canvases

Dream layout uses the same structural pattern as Home:
Top Row: 4 widgets
Center: Dream workspace widget
Bottom Row: 4 widgets

Dream navigation remains toroidal.

Entering a Dream:
- User zooms into a Dream widget or selects it from a Dream surface
- Camera transitions to Dream workspace context
- Home remains accessible via Home buttons

---

## Widget System

Widgets are modular content modules placed into spatial slots.

Widgets:
- Are selected by users
- Populate top/bottom rows
- Feed the Home Feed stream if configured
- Can represent friends, pages, content feeds, tools, experiences

Home Feed composition:
- The Home Feed stream is generated from active widget sources
- If a widget is enabled as a feed source, it publishes feed entries
- Feed supports multiple content types: posts, music, projects, notifications, system cards

Widget tables in Supabase (expected):
- widgets
- widget_instances
- widget_layouts
- widget_content
- widget_shares
- widget_follows
- widget_events

Spaces:
- home space
- profile space
- optional additional spaces
Access controlled by:
- spaces
- space_members

---

## Supabase Realtime Requirements

If widgets are synced live, Supabase Realtime must be enabled.

SQL requirements:

1. Enable replication for widgets table
ALTER publication supabase_realtime ADD TABLE widgets;

2. Ensure full replica identity
ALTER TABLE widgets REPLICA IDENTITY FULL;

Dashboard requirement:
Enable Realtime for the widgets table in Database -> Replication.

Client requirement:
Maintain a widgetsMap (id -> render object reference) to update existing objects instead of recreating them.

---

## Rendering and iOS Performance Requirements

Target:
60fps mobile
GPU-only transforms
Single DOM write per frame
Zero allocations per gesture frame

Rules:
- Use requestAnimationFrame for per-frame camera updates
- Use translate3d and scale3d only, never top/left animation
- Avoid React re-renders during live gestures by storing gesture state in refs
- Commit state changes on gesture end or threshold crossing
- touchAction: none is mandatory on the spatial container to stop Safari page pan
- overscroll bounce must be disabled for the shell

---

## PixiJS Rendering Layer Integration

PixiJS is used as a rendering and physics engine for camera behavior.
Next.js + Supabase remains the architecture.

Requirements:
- PixiJS runs as a transparent full-screen canvas
- pixi-viewport controls drag, pinch, decelerate
- Torus loop implemented by teleporting viewport coordinates when reaching world bounds
- devicePixelRatio must be used for retina sharpness
- camera transform is fed into the spatial shell world transform

The Pixi layer does not replace your backend.
It replaces janky DOM-only gesture physics with a stable camera system.

---

## AI Systems and Access Control

Dr. Eams:
- Only AI visible to users
- User-facing assistance, content, widget AI

Inner Dreams (Idari):
- Administrative AI system
- Admin-only
- Not in user menus
- Accessible only through admin-gated UI and admin-only API routes
- All actions logged

Boogie Man AI:
- Policy enforcement system
- Admin-only
- Not in user menus
- Used internally to enforce system rules and moderation
- All actions logged

Hard rule:
Only Dr. Eams appears in user-facing navigation or widget menus.

---

## Admin and Audit Logging

Admin-only features:
- Run update with natural language prompt
- Run bug checks
- Enable auto-refresh cycles
- View real-time activity logs

All admin actions logged to:
- admin_audit_log
- audit_log

Admin gating requirements:
- Supabase auth required
- Admin role verification required
- RLS enforced
- Inner Dreams and Boogie never bypass RLS

---

## Non-Goals

- Do not add nav bars to expose AI systems
- Do not turn Home into a page route
- Do not turn Cube into a navigation layer
- Do not expose admin AIs to users
