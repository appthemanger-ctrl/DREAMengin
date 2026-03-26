# DREAMengin — Full System Specification

Next.js 16+ / Supabase / Dual-Runtime / Privacy-First Spatial Operating Environment  
Author: José Mancilla  
Date: March 24, 2026

## Recent Changes

| Revision | Date / Time (UTC) | Branch | Author | Files | Summary |
|---|---|---|---|---|---|
| `30e7873` | 2026-03-26 05:12 UTC | copilot/fix-3d-rendering-issue | Copilot | ~3 | fix: cap Director hwScale ≤1, adaptToDeviceRatio for DPR, humanoid robot hands+waist |
| `f2d2b90` | 2026-03-26 04:56 UTC | completedream | appthemanger-ctrl | — | Merge pull request #308 from appthemanger-ctrl/copilot/fix-typescript-compilation-error-again |
| `b98960c` | 2026-03-26 04:51 UTC | copilot/fix-typescript-compilation-error-again | Copilot | ~1 | fix: widen `best` variable type in snapToSplitPoint to accept all snap values |
| `246f578` | 2026-03-26 04:37 UTC | completedream | appthemanger-ctrl | — | Merge pull request #307 from appthemanger-ctrl/copilot/fix-typescript-compilation-error |
| `cc5163c` | 2026-03-26 03:59 UTC | copilot/fix-typescript-compilation-error | Copilot | ~1 | fix: widen SupabaseLike.from return type to any in scanMediaUrls.ts |
| `2cb6530` | 2026-03-26 03:51 UTC | completedream | appthemanger-ctrl | — | Merge pull request #306 from appthemanger-ctrl/copilot/clean-up-documentation |
| `125f30c` | 2026-03-26 03:30 UTC | copilot/clean-up-documentation | Copilot | ~2 | fix: update-readme workflow race condition + catch up README |
| `74f652b` | 2026-03-26 03:14 UTC | copilot/clean-up-documentation | Copilot | ~1 | docs: auto-update HANDOFF timeline [ead2d33] [skip ci] |
| `ead2d33` | 2026-03-26 03:14 UTC | copilot/clean-up-documentation | Copilot | +3 | docs: establish Activity-First Protocol as canonical platform law |
| `59b72f5` | 2026-03-26 03:09 UTC | completedream | appthemanger-ctrl | — | Merge pull request #305 from appthemanger-ctrl/copilot/add-draggable-divider-bar-again |


---

## Current Implementation Status
Last updated: 2026-03-26 05:12 UTC — `30e7873` by Copilot

Phase: Phase 8 — Real Runtime Completion (All 100 Points Complete)
Scope: Full dual-runtime activation, real Supabase persistence, Dream Window lifecycle, AI Triad consensus, WebGPU rendering

Build Status: 134 routes · 1575+ tests passing

Tech Stack:
- Next.js 16+ (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Babylon.js 8+ (WebGPU-first 3D rendering)
- Supabase (Auth, PostgreSQL, Realtime, Storage)
- Vitest (test framework)
- pnpm 10.30.0
- Node 24

---

## Canonical Route System

A Surface is a user-facing environment accessible through a canonical route.

Canonical routes are the only stable entry points in the system.  
All legacy or support routes must redirect to their canonical equivalent.

---

## Core Surfaces

Surface                | Canonical Route        | Legacy Route
----------------------|------------------------|-----------------------------
HomeDream             | /homedream             | /home → /homedream
EditProfileDream      | /edit-profiledream     | /edit-profile
ViewProfile           | /view-profile          | /profile/[handle], /u/[handle]
DreamDM               | /messages              | —
DreamShop             | /shop                  | /shop/sell
DreamMarketplace      | /marketplace           | —
DreamAds              | /ads                   | /ads/create

---

## Daydream Surfaces

Daydreams are the six primary creative environments in DREAMengin.

They are not isolated modules and are not bound to a single runtime.  
Each Daydream can connect to multiple Engins depending on task context.

Daydream             | Route
---------------------|---------------------
Music Daydream       | /daydream/music
Games Daydream       | /daydream/games
Lab Daydream         | /daydream/lab
Code Daydream        | /daydream/code
Brand Daydream       | /daydream/brand
Create Daydream      | /daydream/create

---

## Daydream–Engin Network Model

The system uses a multi-connection model:

- 6 Daydream surfaces
- 6 Engin runtimes
- Up to 11 connection paths depending on workflow

Definitions:

Daydream = user-facing creative surface  
Engin = runtime or execution layer

Rules:

- A Daydream can invoke multiple Engins
- An Engin can support multiple Daydreams
- The system is a connected environment, not separate tools

Examples:

Music Daydream:
- StarMakerEngin
- LabEngin
- CodeEngin

Games Daydream:
- GameEngin
- LabEngin
- CodeEngin

Brand Daydream:
- BrandingEngin
- ContentEngin
- LabEngin

Supported work types:

- creation
- experimentation
- execution
- deployment
- publishing

---

## Runtime Model

DREAMengin operates as a dual-runtime spatial system.

The system is not a flat application.  
It is a spatial operating environment where surfaces and runtimes connect dynamically.

Structure:

- Daydreams = user-facing spaces
- Engins = execution layers
- Routes = stable entry points
- Legacy paths = forced redirects

This establishes:

- consistent naming authority
- controlled routing
- runtime separation
- spatial organization of features

Requirements:
- Keep naming consistent unless clarity requires adjustment
- Maintain identity: dual-runtime, privacy-first, spatial OS
- Remove repetition
- Separate facts vs assumptions vs design intent
- Define clearly:
  1. Platform definition
  2. Canonical routes
  3. Core surfaces
  4. Daydream system
  5. Engin system
  6. Dual-runtime model
  7. Naming authority
  8. Privacy model
  9. Runtime boundaries
  10. Routing rules

Additional constraints:
- Define: Surface, Daydream, Engin, Dream Window, Canonical Route
- Convert vague claims into enforceable system rules
- Keep tone technical, not promotional

Input:


- The **Surface Space** runtime is the currently active surface (HomeDream, profile views, DreamDM, etc.)
- The **DreamSpace** runtime is the lower modular runtime region
- DreamSpace contains:
  - Dream Windows (blank or connected)
  - Daydream environments
  - Engin systems
  - route-connected lower-layer experiences

The **DreamDMBar** is the canonical divider and lift control between these two runtimes.

---

# Key System Components

## DreamDMBar (Runtime Divider)

**Location**

```ts
components/messaging/DreamDMBar.tsx
```

**Role**

The DreamDMBar is the canonical runtime divider and interaction rail in DREAMengin.

It is designed to **look like a separate piece** sitting between the main active surface and the lower DreamSpace runtime.

Visually, it should feel like its own distinct object.  
Functionally, it is the **seam between two live runtimes**.

The DreamDMBar is responsible for:

- quick communication and drafting
- acting as the boundary between the upper runtime and DreamSpace
- dragging the second runtime upward into view
- revealing DreamSpace as an operating layer
- preserving the OS-like feel of the platform

Dragging the DreamDMBar upward reveals **DreamSpace**, which contains:

- blank Dream Windows that can be connected
- connected Dream Windows
- Daydream surfaces
- Engin surfaces
- route-connected lower-layer experiences

Dream Windows begin as blank tappable surfaces that users can connect and configure.

This interaction model is designed to make DREAMengin feel like a **spatial operating environment**, not traditional page navigation.

---

## HomeDream System

Canonical entry point

```ts
app/homedream/page.tsx
```

Core implementation

```ts
components/home/HomeSystem.tsx
```

---

# AI Triad

Three AI systems operate inside DREAMengin.

| AI System | Route |
|---|---|
| **Dr. Eams** | `/api/ai/eams` |
| **IDARi** | `/api/ai/idari` |
| **TheBoogieMan.Ai** | `/api/ai/boogieman` |

Roles:

- **Dr. Eams** — discovery, routing, and idea generation  
- **IDARi** — system maintenance and governance  
- **TheBoogieMan.Ai** — policy enforcement and system overwatch  

---

# Governance

This surface map is **maintained by IDARi**.

For the full feature implementation matrix see:

```
docs/FEATURE_STATUS.md
```

⸻

1. Purpose and Product Definition

DREAMengin is a customizable, privacy-first, dual-runtime spatial operating environment for creating, sharing, organizing, and connecting modular runtime containers across personal, creative, and social spaces. A social modular runtime whose navigation begins as a calm HomeDream and matures into a stacked, state-preserving surface system across the entire product. DREAMengin introduces the DreamDM Bar, connecting you continuously to both sides of your world.

*This is a real product specification, not a concept sketch.*

The system is privacy-first, user-first, deeply customizable, modular, interconnected, and built for full creative freedom.

	•	HomeDream is the root surface
	•	everything else opens from it, not away from it
	•	navigation should feel like depth, not page switching
	•	profile is a flip/paired surface
	•	Dreams open into deeper layers
	•	Daydreams are not random routes, they are deeper spaces
	•	going back should restore context, not reload a new world

DREAMengin is **not** built around:
	•	tabs plus pages
	•	dashboard cards plus links
	•	web nav dressed up as native

DREAMengin **is** built around:
	•	surface stack navigation
	•	state-preserving depth
	•	iOS Photos-style continuity
	•	applied across the whole product

If a navigation move feels like:
	•	leaving the world,
	•	reloading the world,
	•	or forgetting where you were,

then it’s wrong.

If it feels like:
	•	opening deeper,
	•	staying oriented,
	•	and being able to flip back naturally,

then it’s right.

1.1 System Surfaces and Modules

The system is composed of:

Core Dreams (primary system surfaces)
	•	HomeDream (main private user surface)
	•	Edit ProfileDream (profile composition and layout builder)
	•	View Profile (public/shared-facing profile view)

Daydream Pair System
	•	6 Daydreams (Side A experiences, user-facing)
	•	6 Engin surfaces (Side B control layers)

Platform Modules
	•	Dream Windows (modular runtime containers)
	•	DreamShop
	•	DreamMarketplace
	•	DreamMenu
	•	DreamDM
	•	DreamAds

1.2 Global Platform Rules (Non-Negotiable)
	•	Nothing is public by default.
	•	All creation starts private.
	•	Every visible action must do something real.
	•	No fake buttons.
	•	No accidental sharing.
	•	No hidden posting.
	•	No platform system may bypass privacy rules.

⸻

2. Technical Foundation

2.1 Frontend
	•	Framework: Next.js 16+
	•	Architecture: App Router
	•	Language: TypeScript
	•	Styling: tokenized design system with Tailwind CSS or equivalent
	•	Animation: Framer Motion or equivalent UI motion layer
	•	Component Model: modular, Dream Window–driven, reusable surfaces
	•	Rendering Strategy: client-heavy interactive surfaces with controlled server rendering where appropriate

2.2 Backend (Supabase)
	•	Database: Supabase Postgres
	•	Authentication: Supabase Auth
	•	Storage: Supabase Storage
	•	Realtime: Supabase Realtime for feed, messaging, and synchronized updates
	•	Security: strict Row Level Security on all user-owned data
	•	Media/uploads: Supabase Storage buckets with permissions by user and visibility state

⸻

3. Global Product Architecture

The product is structured into two major kinds of surfaces:

3.1 Core Dreams (Not Daydreams)

These are primary system-level surfaces and are not part of the Daydream pair system:
	•	HomeDream (Core System)
	•	Edit ProfileDream (Core System)
	•	View Profile (Core Link/Destination)

3.2 Daydream Pair Model

Each Daydream has:
	•	Side A: user-facing domain experience
	•	Side B: corresponding Engin system (control layer)

Only Side B uses the Engin suffix.

⸻

4. HomeDream (Core System, Private Operating Surface)

4.1 Purpose

HomeDream is the user’s main private customizable operating surface. It is where:
	•	content appears first
	•	Dream Windows live and interact and feed the feed
	•	feeds are personalized
	•	routing decisions happen
	•	signals are gathered
	•	the user manages their own connected world

Default styling is Gold, Light Blue, White.

4.2 Persistent Gold Button Navigation (Primary Control System)

GOLD BUTTON NAVIGATION
	•	Gold button is persistent and moves with user.
	•	When menus open, they are also screen-persistent, slightly transparent, and close when the user taps elsewhere.
	•	Shop, Marketplace, and Ads are accessible here.

Gestures
	•	Single tap: Open dual menus.
	•	Double tap: Go Home.

Dual Menus (Locked/Primary Menu Behavior)
	•	Left menu: 6 DayDream navigation and Dr. Eams Chat.
	•	Right menu: regular menu and Dr. Eams Chat.

Dr. Eams in HomeDream
	•	Dr. Eams serves as the primary search bar and “create a message” launcher.
	•	Search bar is separate from “Message Eams.”
	•	When the user presses send, they are sent to DreamDM.
	•	If the user searches for a specific location, it suggests the link (Shop, Settings, Daydream, etc.).

4.3 HomeDream Characteristics

HomeDream is:
	•	private by default
	•	persistent between sessions
	•	centered around a personalized feed
	•	surrounded/supported by modular Dream Windows
	•	customizable in color, Dream Window arrangement, and behavior
	•	controllable by feed mode and source selection
	•	designed as the daily primary entry point into DREAMengin

4.4 HomeDream Feed

The feed supports:
	•	personalized content
	•	Dream Window broadcasts
	•	algorithm mode or manual mode
	•	customizable source selection
	•	favorites-prioritized or individually chosen source modes
	•	post composition and routing
	•	ambient or active content presentation
	•	internal content + selected connected world content

The feed may contain:
	•	user-created posts
	•	activity from selected Dream Windows
	•	DreamDM content
	•	music or media signals
	•	shop or marketplace highlights if allowed
	•	system announcements
	•	utility modules like weather/news if enabled

4.5 HomeDream Dream Window Behavior

Dream Windows on HomeDream:
	•	represent connected modules or systems
	•	may stay dormant until touched
	•	may surface passive signals
	•	may broadcast into the feed
	•	may open into deeper interaction surfaces
	•	may be customized individually

4.6 HomeDream Customization Controls

Users may customize:
	•	Dream Window layout
	•	Dream Window color and visual treatment
	•	feed algorithm settings
	•	active sources
	•	favorites
	•	posting routes
	•	feed density and prioritization

⸻

5. Edit ProfileDream (Core System, Private Builder Surface)

5.1 Purpose

Edit ProfileDream is the private builder surface for the user’s profile and public/shared-facing presentation.

It is accessed from HomeDream and acts as the editing version of the profile surface.

5.2 Functions

Users may:
	•	drag Dream Windows
	•	resize Dream Windows
	•	reshape Dream Windows
	•	place Dream Windows spatially
	•	control Dream Window visibility
	•	choose which content surfaces publicly
	•	customize visual presentation
	•	build profile structure intentionally

5.3 Editing Rules
	•	editing is visual
	•	editing is direct
	•	edits must be reversible
	•	layout must persist
	•	no private HomeDream content appears publicly without explicit user action
	•	Edit ProfileDream may visually match the public profile layout, but it remains a private builder surface
	•	moving Dream Windows in Edit ProfileDream does not automatically update the public-facing profile
	•	public-facing changes occur only when the user explicitly confirms Update Public View

5.4 Profile Configuration

Users may configure:
	•	public Dream Windows
	•	follower-only Dream Windows
	•	hidden Dream Windows
	•	bio and profile identity
	•	featured modules
	•	layout hierarchy
	•	thematic styling

5.5 View Flow

The intended profile flow is:

	•	HomeDream → Edit ProfileDream
	•	inside Edit ProfileDream, the user may choose Update Public View
	•	inside Edit ProfileDream, the user may choose View Profile / Public View to see the public-facing result

Edit ProfileDream is not itself the public view, even when it visually resembles it.

⸻

6. View Profile (Public/Shared Output Surface)

6.1 Purpose

View Profile is the public or shared-facing result of what the user builds in Edit ProfileDream.

It is the public-facing profile surface and does not act as the live editing surface.

6.2 Access and Preview
	•	View Profile is reached from Edit ProfileDream.
	•	The View Profile / Public View control inside Edit ProfileDream opens the public-facing profile view.
	•	Users do not edit directly inside View Profile.

6.3 Required Behavior

View Profile must:
	•	reflect the current public profile configuration
	•	show only explicitly allowed public/shared content
	•	preserve Dream Window interactions allowed in public context
	•	never expose private HomeDream content
	•	support preview mode before save
	•	support public or permission-limited viewing based on settings

6.4 Preview Before Save Requirements

Inside Edit ProfileDream, the user must be able to:
	•	click View Profile / Public View
	•	see the profile as a viewer would see it
	•	return to editing
	•	click Update Public View when ready
	•	save only when satisfied

6.5 Public View Update Rule

View Profile does not live-update from Dream Window movement inside Edit ProfileDream.

The public-facing profile changes only after explicit user confirmation through Update Public View.

This separation helps preserve intentional publishing and allows users to compare their private builder state against the public-facing result.

⸻

7. Daydream Pair System (6 Daydreams + 6 Engin Surfaces)

7.1 Definition

Each Daydream has:
	•	a Side A experience
	•	a Side B Engin system
	•	specialized tools
	•	specialized Dream Window support
	•	a small, separate dual-button control pill for the Engin side menu

7.2 Domain List (As Defined)
	1.	Music / StarMakerEngin
	2.	Games / GameEngin
	3.	Lab / LabEngin
	4.	Code / CodeEngin
	5.	Brand / BrandingEngin
	6.	Create / ContentEngin

⸻

8. Music / StarMakerEngin

8.1 Music (Side A)

Functions include:
	•	music creation
	•	organization
	•	upload
	•	listening
	•	managing projects, songs, drafts, and audio assets
	•	arranging music-oriented Dream Windows
	•	previewing tracks and collections

8.2 StarMakerEngin (Side B)

Functions include:
	•	release workflows
	•	music sharing
	•	publishing logic
	•	sell/distribution pathways
	•	metadata setup
	•	launch and rollout configuration
	•	music performance and status management

8.3 Specialized Dream Windows (Examples)
	•	track Dream Window
	•	playlist Dream Window
	•	release Dream Window
	•	lyrics Dream Window
	•	audio project Dream Window
	•	sales / launch status Dream Window

⸻

9. Games / GameEngin

9.1 Games (Side A)

Functions include:
	•	game access
	•	game creation entry
	•	play surfaces
	•	world browsing
	•	player-facing project interaction

9.2 GameEngin (Side B)

Functions include:
	•	world logic
	•	game mechanics
	•	runtime states
	•	entity behavior
	•	game structure
	•	creation tools
	•	system rules and internal powering

9.3 Specialized Dream Windows (Examples)
	•	game world Dream Window
	•	build Dream Window
	•	logic Dream Window
	•	player state Dream Window
	•	environment Dream Window
	•	inventory/system Dream Window

⸻

10. Lab / LabEngin

10.1 Lab (Side A)

Functions include:
	•	experiments
	•	prototypes
	•	tests
	•	models
	•	scenario building
	•	simulation viewing

10.2 LabEngin (Side B)

Functions include:
	•	state modeling
	•	system rules
	•	simulation control
	•	test orchestration
	•	iteration environments
	•	lab tool configuration

10.3 Specialized Dream Windows (Examples)
	•	experiment Dream Window
	•	state Dream Window
	•	model Dream Window
	•	results Dream Window
	•	parameter Dream Window
	•	simulation viewer Dream Window

⸻

11. Code / CodeEngin

11.1 Code (Side A)

Functions include:
	•	code project access
	•	snippets
	•	file grouping
	•	project views
	•	drafts
	•	code creation surfaces

11.2 CodeEngin (Side B)

Functions include:
	•	project engine behavior
	•	code organization systems
	•	runtime logic
	•	deployment pathways
	•	build and execution workflows
	•	engineering tools

11.3 Specialized Dream Windows (Examples)
	•	project Dream Window
	•	code file Dream Window
	•	snippet Dream Window
	•	terminal Dream Window
	•	deployment Dream Window
	•	runtime Dream Window

⸻

12. Brand / BrandingEngin

12.1 Brand (Side A)

Functions include:
	•	brand visuals
	•	campaign planning
	•	brand surfaces
	•	content identity
	•	creative packaging
	•	brand-facing assets

12.2 BrandingEngin (Side B)

Functions include:
	•	brand system configuration
	•	performance views
	•	content structure
	•	audience or campaign system logic
	•	optimization flows
	•	identity and strategy tools

12.3 Specialized Dream Windows (Examples)
	•	campaign Dream Window
	•	brand kit Dream Window
	•	performance Dream Window
	•	audience Dream Window
	•	asset Dream Window
	•	identity Dream Window

⸻

13. Create / ContentEngin

13.1 Create (Side A)

Functions include:
	•	writing
	•	media composition
	•	post drafting
	•	creative assembly
	•	mixed-content authoring
	•	post/project development

13.2 ContentEngin (Side B)

Functions include:
	•	content routing
	•	publishing logic
	•	formatting systems
	•	scheduling or draft states
	•	output structure
	•	reusable templates and creation mechanics

13.3 Specialized Dream Windows (Examples)
	•	draft Dream Window
	•	composition Dream Window
	•	media attach Dream Window
	•	publishing Dream Window
	•	template Dream Window
	•	output routing Dream Window

⸻

14. Navigation Model (Core + Daydream Pair System)

14.1 Seamless Movement Requirement

Users must move between:
	•	HomeDream
	•	Edit ProfileDream
	•	View Profile
	•	any Daydream
	•	its corresponding Engin surface
without feeling like they are leaving the overall DREAMengin environment.

14.2 Side A → Side B Relationship

Each Side A must lead naturally into its Side B. Side B must feel like:
	•	the powered version
	•	the control layer
	•	the deeper system surface

14.3 Engin Dual Button Controls

Each Engin surface includes a small “pill” style dual-button control area for Engin-side control actions. These controls are:
	•	compact
	•	specialized
	•	separate from the main DreamMenu
	•	contextual to the Engin environment

⸻

15. Dream Windows (Modular Runtime Containers)

15.1 Definition

Dream Windows are the modular runtime containers used throughout the system. In Phase 7 and beyond, the canonical term is **Dream Window**. Earlier versions of this spec used "Dreams" or "widgets" — those terms are now retired in favor of Dream Window.

Dream Windows have four canonical states: Unbound, Bound, Mounted, and Collapsed.

15.2 Role

Dream Windows may:
	•	display content
	•	accept content
	•	route content
	•	surface signals
	•	open into more detailed views
	•	represent a Daydream or system component
	•	exist on HomeDream, Edit ProfileDream, View Profile, and Daydream surfaces where allowed

15.3 Dream Window Menu Requirement

Every Dream Window must include a customization menu.

15.4 Dream Window Menu Functions (May Include)
	•	rename
	•	recolor
	•	resize
	•	visibility control
	•	source selection
	•	behavior selection
	•	pin/favorite
	•	move
	•	duplicate
	•	remove
	•	route settings
	•	permissions

15.5 Dream Window Data (Minimum)

Each Dream Window should minimally support:
	•	id
	•	type
	•	owner
	•	config
	•	size
	•	position
	•	visibility
	•	source bindings
	•	destination rules
	•	active state

⸻

16. Commerce and Ecosystem Modules

16.1 DreamShop (Official/Platform Commerce)

Purpose: platform-owned commerce layer.

Users may:
	•	buy official items
	•	access premium modules
	•	acquire themes, assets, tools, or official packs
	•	manage owned DreamShop items

Supported item types (examples):
	•	Dream Window skins
	•	themes
	•	design packs
	•	official add-ons
	•	enhanced tools
	•	cosmetic or functional upgrades

16.2 DreamMarketplace (Community Exchange)

Purpose: user/community exchange layer.

Users may:
	•	discover user-made items
	•	sell or share creations
	•	browse Dream Windows, modules, tools, assets, and experiences
	•	acquire community-made Dream objects
	•	promote their own works

Difference:
	•	DreamShop = official/platform items
	•	DreamMarketplace = community/user-driven ecosystem

⸻

17. DreamMenu (Dual Menu Navigation System)

17.1 Structure

DreamMenu is a dual-menu navigation system.

17.2 Left Side

Contains:
	•	Daydream navigation
	•	movement between the 6 Daydreams
	•	movement into core spaces where appropriate

17.3 Right Side

Contains:
	•	standard app menu functions
	•	account/settings
	•	utilities
	•	profile access
	•	and Dr. Eams

17.4 Dr. Eams Presence in Menu

Dr. Eams is the platform guide and assistant presence. Dr. Eams may:
	•	assist onboarding
	•	explain surfaces
	•	help users understand systems
	•	provide guidance
	•	surface context-sensitive suggestions
Dr. Eams must remain useful, not intrusive.

⸻

18. DreamDM (Messaging and Discussion)

18.1 Purpose

DreamDM is the platform messaging and threaded discussion system.

18.2 Modes

DreamDM supports:
	•	direct messaging
	•	group-style threads
	•	Reddit-style board or message-board experiences
	•	topic-based discussion surfaces

18.3 Visibility

DreamDM is viewable from HomeDream and may also exist as its own focus environment.

18.4 Behaviors (May Support)
	•	replies
	•	threads
	•	boards
	•	favorites
	•	pinned posts
	•	routing content into HomeDream
	•	contextual discussion around creations or Dream Windows

⸻

19. DreamAds (Promotions and Advertising)

19.1 Purpose

DreamAds is the controlled advertising and promotion system.

19.2 Functions (May Support)
	•	promoted content
	•	creator boosts
	•	marketplace promotion
	•	sponsored placements
	•	official promotional surfaces

19.3 Rules

DreamAds must:
	•	be transparent
	•	respect privacy
	•	not override user control
	•	not violate HomeDream or Profile visibility rules

⸻

20. Customization System

20.1 Global Customization

Users may customize:
	•	layout
	•	colors
	•	Dream Window arrangement
	•	feed behavior
	•	Dream Window activity
	•	algorithm settings
	•	profile composition
	•	DreamMenu configuration where allowed

20.2 Domain-Specific Customization

Each Daydream may support specialized customization tied to its own tools and Dream Windows.

Customization is platform-wide, not a side feature.

⸻

21. Algorithm and Source Control

21.1 Feed Control

Users may control:
	•	feed mode
	•	source priority
	•	favorites
	•	algorithm behavior
	•	manual vs mixed vs algorithmic sorting

21.2 Dream Window Source Control

Users may choose what Dream Windows contribute to feeds or surfaces.

21.3 Transparency Requirement

Users must always be able to understand what is contributing to what they are seeing.

⸻

22. Privacy Model

22.1 Surface Privacy Defaults
	•	HomeDream: private by default.
	•	Edit ProfileDream: private editing environment.
	•	View Profile: shows only explicit public/shared-facing content.
	•	Daydreams: respect user permissions and visibility models.

22.2 Platform Module Privacy Rules

Marketplace / Shop / Ads / DM: no system may bypass core privacy guarantees.

22.3 General Rule

Nothing becomes public without user intent.

⸻

23. Data Model Overview (Supabase)

Minimum platform tables/domains should include:
	•	users
	•	profiles
	•	Dream Windows
	•	Dream Window configs
	•	daydream states
	•	daydreamengin states
	•	feeds
	•	feed items
	•	messages
	•	boards
	•	shop items
	•	marketplace items
	•	ad objects
	•	music objects
	•	game objects
	•	code objects
	•	lab objects
	•	brand objects
	•	create/content objects
	•	permissions
	•	favorites
	•	algorithm preferences
	•	visibility mappings

All protected through RLS.

⸻

24. AI Triad (Platform Intelligence System)

The AI system is a three-agent triad with distinct roles, strict access controls, and privacy-first enforcement.

24.1 The Three AIs
	1.	Dr. Eams — user-facing assistant
	2.	IDARi — admin-only internal operator (bug fixer, optimizer, data compressor)
	3.	TheBoogieMan.Ai — policy + system overwatch (conservative enforcement, logged)

24.2 Access Model and Surface Placement
	•	Dr. Eams is available to users from the System menu and appears as:
	•	a platform guide
	•	a context-sensitive assistant
	•	a primary search surface (as defined in HomeDream behavior)
	•	only AI that non-admin users can ask questions to
	•	IDARi is admin-facing only and must not be accessible through standard user UI.
	•	TheBoogieMan.Ai is system-level, conservative by default, and operates as enforcement + auditing.

24.3 API Routes (Server-Side Only)


Each AI has its own server-side API route:
	•	/api/ai/eams
	•	/api/ai/idari
	•	/api/ai/boogieman

24.4 Key Management and Provider Configuration
	•	AI API keys are server-side only.
	•	Keys must come from Vercel environment variables and must never be exposed to the client.
	•	AI provider selection must be configurable via env without code changes.

24.5 Guarding Rules
	•	IDARi endpoints are admin-guarded even under dev auth bypass.
	•	TheBoogieMan.Ai is allowed to log and enforce policy decisions.
	•	No AI may bypass:
	•	privacy rules
	•	visibility rules
	•	RLS constraints
	•	“nothing public by default”

24.6 Triad Coordination and Consensus Gating
	•	TheBoogieMan.Ai can send summaries/notes to Dr. Eams as “system status.”
	•	Major system update recommendations require unanimous triad approval (consensus gating).

24.7 AI Behavior Rules (Product Integrity)
	•	Dr. Eams must remain useful, not intrusive.
	•	AI actions presented to the user must map to real system actions (no fake buttons, no implied actions).
	•	Any action that could affect visibility/publicity must require explicit user intent.

24.8 AI Rate-Limiting System

All AI API routes use a **single, unified rate-limit system**:

| Component | Name |
|-----------|------|
| Supabase RPC | `check_ai_rate_limit` |
| Supabase table | `ai_rate_limits` |

**Do NOT use:**
- RPC `rate_limit_hit` (removed)
- Table `rate_limit_counters` (removed)

The TypeScript layer (`lib/ai/rateLimit.ts`) exports:
- `checkRateLimit(userId, endpoint, limit, windowSeconds)` → `RateLimitResult`
- `getCurrentRPM(userId, endpoint)` → `number`

`RateLimitResult` shape:
```ts
{ allowed: boolean; rpm: number; retry_after_seconds?: number }
```

`checkRateLimit` is **fail-closed**: any RPC error or invalid response returns `{ allowed: false, rpm: 0, retry_after_seconds }`.

⸻

25. Launch Standard (Minimum “Truthful” Release)

The launch version must:
	•	feel complete as a product
	•	support HomeDream as a real private daily surface
	•	support Edit ProfileDream as a real builder
	•	support View Profile as a real destination
	•	support the 6 Daydream / 6 Engin Surface structure
	•	support Dream Windows as real customizable modular runtime containers
	•	include DreamShop, DreamMarketplace, DreamMenu, DreamDM, and DreamAds in truthful form
	•	include only working interactions, not implied ones

⸻

**27. Addendum: Expanded Platform Guarantees and Behaviors**  

This section formalizes additional commitments and design requirements that emerged from review, ensuring the platform’s privacy-first, user-first foundation is reinforced in every layer.

---

### 27.1 Data Portability and User Control

**27.1.1 Export Format**  
Users may export all their personal data—including profile information, Dream Window configurations, created content, messages, and purchase history—in a **machine-readable, non-proprietary format** (JSON + associated media files). The export must be available through a clearly accessible interface (e.g., within Account Settings) and delivered as a downloadable archive within 48 hours of request.

**27.1.2 Backup Guarantees**  
The platform does not guarantee automatic backups of user-generated content beyond standard database redundancy. However, users are encouraged to use the export feature as their own backup mechanism. The platform will retain data only as long as the account is active or required by law.

**27.1.3 Account Deletion**  
Users may permanently delete their account and all associated data at any time. Deletion must be irreversible after a grace period (e.g., 30 days) during which the account can be restored. The deletion process must clearly inform the user of what data will be removed and what (if anything) may remain (e.g., public comments in forums, where removal would break threads, must be anonymized rather than deleted).

---

### 27.2 Failure State Design Principles

Every interaction must anticipate failure and respond in a way that preserves user trust and system integrity.

**27.2.1 Dream Window Source Deletion**  
If a Dream Window’s data source (e.g., a specific feed, a connected service) is deleted or becomes unavailable:
- The Dream Window should display a **graceful placeholder** indicating the source is gone, along with an option to reconfigure or remove the Dream Window.
- The Dream Window must not crash the surrounding surface or affect other Dream Windows.
- Notifications may alert the user to the broken source, but only if the user has opted into such alerts.

**27.2.2 Engin Action Failures**  
When an action within a Side B Engin fails (e.g., publish error, save conflict):
- The system must display a **clear, non-technical error message** explaining what went wrong and suggesting next steps (retry, check settings, contact support).
- The failure must not leave the user in an inconsistent state (e.g., partial saves must be rolled back or flagged as drafts).
- Critical failures (e.g., payment processing) must trigger an immediate notification and, where appropriate, log an incident for admin review (via IDARi).

**27.2.3 Dr. Eams Misunderstanding**  
If Dr. Eams cannot understand a user request:
- It must respond with a **humble, helpful message** (e.g., “I didn’t quite catch that. Could you rephrase or try one of these options?”).
- It should offer fallback options: manual search, browsing help topics, or connecting to a human support contact if available.
- Dr. Eams must never simulate understanding or invent an action.

**27.2.4 Marketplace Purchase Failure**  
Failed transactions (payment declined, item unavailable) must:
- Immediately revert any pending state (e.g., remove temporary holds on items).
- Show a clear explanation and next steps (e.g., “Your payment didn’t go through. Please check your payment method or try again.”).
- Never charge the user without explicit confirmation of success.

**27.2.5 RLS Blocking Legitimate Access**  
If Row Level Security incorrectly blocks a user’s access to their own content (due to policy misconfiguration or race condition):
- The system should log the incident (via TheBoogieMan.Ai) for admin review.
- The user-facing surface should display a generic “content unavailable” message with an option to report the problem.
- Admins (via IDARi) must be able to audit and correct such failures without exposing private data.

---

### 27.3 Offline Behavior and Resilience

**27.3.1 Offline Capability**  
While DREAMengin is primarily an online platform, the following surfaces **must** support basic offline read access:
- HomeDream (cached version of last-loaded feed and Dream Window states)
- View Profile (cached public profile data)
- Previously accessed Daydream surfaces (if the user explicitly marks them for offline use)

**27.3.2 Caching Policy**  
Cached data must be:
- Encrypted at rest on the device.
- Automatically refreshed when connectivity is restored.
- Subject to user control (clear cache, disable offline mode).
- Limited in size and age to prevent stale or excessive storage.

**27.3.3 Offline Actions**  
Any action initiated offline (e.g., composing a post, reconfiguring a Dream Window) must be queued and executed when connectivity returns, with clear visual indication of pending actions. Conflicts (e.g., edits made both offline and online) must be resolved via user prompt or a deterministic last-write-wins rule, with an audit trail.

---

### 27.4 Analytics Philosophy and Privacy

**27.4.1 Telemetry Principles**  
- **No data collection without consent:** All analytics are opt-in at account creation, with granular controls (e.g., crash reports, usage patterns, feature interaction).
- **Anonymization by default:** If the user opts into analytics, data must be stripped of personally identifiable information (PII) before transmission.
- **Minimal necessary:** Only collect data essential for improving the product and fixing errors. No behavioral profiling for advertising.
- **Transparency:** Users can view exactly what data is collected, how it is used, and request deletion of their analytics history at any time.

**27.4.2 Implementation**  
Analytics will be handled by a privacy-respecting provider (e.g., Plausible, Simple Analytics) or a self-hosted solution that adheres to the above principles. No analytics data will be shared with third parties.

---

### 27.5 TheBoogieMan.Ai Logging and Audit Scope

**27.5.1 Logged Events**  
TheBoogieMan.Ai logs only events related to policy enforcement and system integrity, including:
- Attempted violations of privacy rules (e.g., access to private data without permission)
- Anomalous patterns that might indicate abuse or malfunction
- Consensus decisions (when triad approval is required)
- Administrative actions taken by IDARi

**27.5.2 Data in Logs**  
- Logs **must not** contain user-identifiable information unless absolutely necessary for debugging a specific policy violation. In such cases, the identifier must be hashed and accessible only to authorized admins under explicit protocols.
- All logs are encrypted at rest and retained for a maximum of 90 days, after which they are permanently deleted.

**27.5.3 Audit Access**  
- Only designated platform administrators may access TheBoogieMan.Ai logs, and such access is itself logged.
- Regular audits of the logging system will be conducted to ensure compliance with privacy commitments.
- Users have the right to request information about whether their data appeared in TheBoogieMan.Ai logs, subject to verification and legal constraints.

---

*These additions reinforce DREAMengin’s commitment to being a platform users can truly own, trust, and rely on—even when things go wrong.*

28. Final Product Philosophy

DREAMengin is a modular creative and social operating environment.

HomeDream is where the user lives privately.
Edit ProfileDream is where the user crafts public expression.
View Profile is where that expression is shown.
The 6 Daydreams are the lived domains.
The 6 Engin surfaces are the powered control layers behind them.
Dream Windows are the modular units connecting everything.
DreamShop, DreamMarketplace, DreamMenu, DreamDM, and DreamAds complete the ecosystem.

Everything is connected.
Everything is customizable.
Everything is user-first.
Everything is privacy-first.
Everything must feel owned by the user.

⸻

26. Generation Law (AI Build Constraint)

Every AI agent working on DREAMengin — Dr. Eams, IDARi, TheBoogieMan.Ai, or any external Copilot — must follow the Generation Law defined in docs/GENERATION_LAW.md.

26.1 Allowed-Output Formula

For each generation pass, compute:

	allowed next output = base spec fidelity × (ДР/2) × (1 + ДРх)

	•	base spec fidelity — how closely the current codebase matches this README (0–1 scale)
	•	ДР — the delta ratio: fraction of the spec addressed by this pass
	•	ДРх — the residual-adjusted delta ratio (see docs/GENERATION_LAW.md)

A pass whose scope would exceed the allowed output must be split into smaller passes or down-graded to patch-only mode.

26.2 App-Build Load (χ)

Before writing a single line, compute:

	χ = w₁T + w₂F + w₃D + w₄A + w₅U

Where:
	•	T = tasks being attempted in the same pass
	•	F = files touched
	•	D = dependency surface changed (new imports, packages, DB columns)
	•	A = architecture depth affected (how many of the 4 layers are touched)
	•	U = unresolved spec ambiguities carried into this pass

Mode thresholds:
	•	χ < 4 → create — new files, new routes, new systems permitted
	•	4 ≤ χ < 8 → conform — modify existing files to match spec; no new top-level systems
	•	χ ≥ 8 → patch only — single-file, single-function fixes; no structural change

If a planned pass yields χ ≥ 8, the agent must decompose it into sub-passes before proceeding.

26.3 Residual Classes

Residuals are structured mismatches between actual output and spec-intended output:

	r = actual output − predicted output

Every pass must audit for all seven residual classes:

	•	architecture residual — does code match the 4-layer Dream model?
	•	naming residual — are canonical README names used?
	•	token residual — are gold/sky/white design tokens applied correctly?
	•	behavior residual — does every visible action do something real?
	•	privacy residual — was private builder state exposed publicly?
	•	performance residual — are render-on-demand and fps rules respected?
	•	projection residual — does ViewProfile show only saved shared projections?

DREAMengin-specific checks per class and a per-pass audit checklist are in docs/GENERATION_LAW.md.

⸻


## 29. DreamDM Bar (Persistent Interaction Rail / Persistent Spatial Divider)

### 29.1 Purpose

The DreamDM Bar is a persistent interaction rail and draggable spatial divider that serves as the communication, notification, drafting, and quick-action layer across the DREAMengin system.

It exists as the boundary interface between the active surface and the Dream layer, allowing users to interact, compose, respond, and manage notifications without leaving their current context.

Unlike a traditional overlay or rail, the DreamDM Bar is the horizon line between two parallel worlds. It separates two continuously active runtime environments: the Surface Space above and the Dream Space below. Both remain alive, interactive, and independently scrollable.

The DreamDM Bar must always preserve the user’s working state.

### 29.2 Position and Surface Relationship

The DreamDM Bar exists between the top content surface and the bottom Dream layer.

Structure:

─────────────────────
Surface Space
(HomeDream / Daydream / Engin / Feed / Video / Code / Game / other active content)
─────────────────────
DreamDM Bar
(persistent interaction rail / draggable divider)
─────────────────────
Dream Space
(Dream Windows / DreamSpace / modular access layer)
─────────────────────

This relationship is part of the product’s spatial model and must be visually and behaviorally explicit.

### 29.3 Dual-Space Model

The screen is permanently divided into two stacked runtime regions:

#### Surface Space
The primary focus area. It hosts any full-surface experience, including:

- HomeDream feed
- video player
- game view
- code editor
- other active content surfaces

This space may contain its own scrollable content and interactive elements.

#### Dream Space
The persistent Dream Window environment. It contains:

- the user’s Dreams
- Dream Window grid
- mini-apps
- launcher behavior
- Daydream access
- other modular tools

This space is also independently scrollable and interactive.

Both spaces are always mounted and runtime-active.

Examples:
- a video continues playing in Surface Space while the user scrolls through Dream Windows in Dream Space
- a game retains state while the user replies through the DreamDM Bar
- one side may remain active while the other is explored or adjusted

### 29.4 Core Functions

The DreamDM Bar provides:

- quick message composition
- notification aggregation
- draft persistence
- quick replies
- search shortcuts
- content routing
- quick post creation
- command-surface access
- physical resizing of the two active spaces

Users must be able to:

- start writing a message without leaving the current surface
- respond to notifications inline
- save or resume drafts
- route content into DreamDM, feeds, or Dream Windows
- resize the visible relationship between Surface Space and Dream Space directly

### 29.5 Physical Behavior and Drag Interaction

The DreamDM Bar is a draggable handle that resizes the two spaces in real time.

It responds to direct manipulation through touch or mouse drag.

#### Drag Rules

- dragging up expands Dream Space and compresses Surface Space
- dragging down expands Surface Space and compresses Dream Space
- drag is continuous
- the divider follows the pointer with smooth visual feedback
- movement must feel physical, controlled, and premium

The bar itself must always remain interactive for:

- dragging
- tapping to expand/collapse where applicable
- quick actions
- notification interaction
- compose access

### 29.6 Snap Points and Interaction States

When released, the DreamDM Bar snaps to the nearest canonical position.

#### Surface Focus
- Surface Space occupies approximately 90% of viewport height
- Dream Space is reduced to a thin strip of approximately 10%
- the strip shows the DreamDM Bar collapsed state
- notification indicators and compose affordance remain visible

This corresponds to the original collapsed emphasis state.

#### Balanced
- Surface Space and Dream Space occupy approximately 50% / 50%
- both are given equal prominence
- the user can work fluidly across both sides

This corresponds to the expanded emphasis state.

#### Dream Focus
- Dream Space occupies approximately 90% of viewport height
- Surface Space is reduced to a thin awareness strip of approximately 10%
- Surface Space may show a minimal header, frozen frame, or content peek

This is the full Dream-focused state.

#### Pinned
An additional pinned mode may be triggered by long press, double tap, or another defined gesture.

Pinned mode may:
- lock the bar to the top or bottom edge
- preserve the size ratio
- support multitasking where one side needs constant visibility

### 29.7 Snap Animation

Snapping must be accompanied by a subtle spring animation.

The animation should communicate:

- finality
- physicality
- confidence
- continuity

It must never feel abrupt, disorienting, or page-like.

### 29.8 Multitasking and Parallel Runtimes

The DreamDM Bar allows simultaneous interaction with both spaces because both remain active.

Examples include:

- watching video while replying
- coding while referencing a draft
- browsing feeds while responding to notifications
- playing a game while opening a conversation
- writing code in Surface Space while Dream Space hosts a live preview
- exploring Dream Windows while media continues uninterrupted above

The bar must never force the user to leave the current activity.

### 29.9 Focus and Input Routing

Input routing is determined by the space that received the last tap or click.

Rules:

- if the user taps Surface Space, keyboard and focus events go there
- if the user taps Dream Space, keyboard and focus events go there
- the DreamDM Bar always remains interactive regardless of which side currently owns focus

This allows users to fluidly move focus without destroying state.

### 29.10 Interaction States

The DreamDM Bar supports persistent system states that align with the physical split model.

#### Collapsed
- minimal bar
- shows notification indicators
- shows compose affordance
- unobtrusive
- typically corresponds to Surface Focus

#### Expanded
- opens message board
- shows active drafts
- shows notifications
- allows quick reply
- typically corresponds to Balanced or a bar-expanded interaction mode

#### Pinned
- locks to the top or bottom edge where appropriate
- supports multitasking
- keeps current surface active underneath
- may preserve current split ratio

### 29.11 Quick Message Composition

The DreamDM Bar contains quick composition behavior accessible in any split configuration.

Rules:

- a compose field or compose icon lives directly in the bar
- tapping compose may expand into a larger field
- composition must not destroy current Surface Space context
- a fuller composer may open into Dream Space or a temporary bounded expansion without causing context loss

Users must be able to begin composing without feeling like they entered a different app or page.

### 29.12 Persistent Draft Memory

Messages written in the DreamDM Bar must persist until the user deletes or sends them.

Persistence must survive:

- surface changes
- page refresh
- browser restart
- temporary offline states

The system must restore the last draft automatically when the bar is reopened.

Draft persistence is mandatory.

### 29.13 Notification Aggregation

The DreamDM Bar functions as the platform notification center.

Notifications appear as interactive cards inside the bar rather than as a detached generic system list.

Each notification may allow:

- quick reply
- open source surface
- dismiss
- save for later

Notifications may originate from:

- DreamDM conversations
- Dream Window signals
- Daydream activities
- DreamMarketplace events
- system announcements

When space is limited, notifications should remain compact but actionable.

### 29.14 Offline and Queue Behavior

If the user performs message-related actions while offline:

- drafts must still persist
- queued actions must be clearly marked
- send actions must retry when connectivity returns
- conflicts must be surfaced clearly if needed
- no pending action may silently disappear

This behavior must preserve user trust and working continuity.

### 29.15 Gold Button Navigation and DreamDM Bar Integration

The Gold Button serves as the primary navigation control with a dynamic spatial relationship to the DreamDM Bar.

#### Default Anchoring
- the Gold Button is anchored to the top edge of the DreamDM Bar in Surface Focus and Balanced modes
- this creates a visual tether: the button lives at the boundary between Surface Space and Dream Space
- single tap opens dual menus
- double tap goes Home

#### Composition Mode (Floating)
- when the user taps the compose field in the DreamDM Bar, the Gold Button floats upward approximately 40–60px
- this clears the keyboard and composition area so typing is unobstructed
- the button remains one-thumb reachable but moves out of the way
- when composition ends (message sent, dismissed, or keyboard closed), the button animates back down to its anchored position at the top of the bar

#### Pull-Down Gesture (Locking)
- from any position, pulling down on the DreamDM Bar reveals and summons the Gold Button
- the button slides down from its anchored position toward the bar
- if the user continues dragging the bar down while the button is visible, the button locks to the bar and moves with it
- in locked state, dragging the bar repositions both elements as a single unit

#### Unlock Triggers
The Gold Button unlocks from the bar when:
- the user taps the button
- the user performs an upward flick gesture on the bar
- the bar snaps to a new position without the button following

After unlocking, the button returns to its default anchored position at the top of the bar.

#### Dream Focus Mode Behavior
- when the bar is in Dream Focus and the Gold Button is locked to the bar:
  - dragging the bar further up compresses Surface Space to nearly nothing
  - the Gold Button remains attached to the bar at the very top edge of the screen
  - the user sees only Dream Space with the Gold Button sitting at the top boundary
- this creates a “Gold Button as horizon” effect where the button becomes the visual separator between compressed Surface Space and expanded Dream Space below
- Home access is maintained even in full Dream mode, with the button positioned at the absolute top of the viewport

### 29.16 Home Reset Rule

Double tapping the Gold Button returns the user to HomeDream while preserving message state.

Rules:

- if the DreamDM Bar is in any non-default split, double tap returns the system Home without deleting drafts
- HomeDream feed is revealed in Surface Space
- if the DreamDM Bar is open, returning Home must not delete the draft
- if the bar is collapsed, Home returns the user to the main HomeDream feed
- drafts and notifications remain intact unless explicitly dismissed or deleted
- after reset, the Gold Button returns to its default anchored position at the top of the bar

Navigation must never clear working communication state.

### 29.17 Design Principle

The DreamDM Bar exists to eliminate unnecessary context switching.

Users should not need to leave their current activity simply to:

- send a message
- respond to a notification
- save a thought
- route content
- resize their working reality
- shift attention between two active spaces

The DreamDM Bar is a continuous interaction channel across the entire system. Its physical behavior—dragging, snapping, resizing, and preserving two active spaces—must make multitasking feel natural, direct, and spatially coherent.
