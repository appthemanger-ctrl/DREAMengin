DREAMengin — Full System Specification

Next.js 16+ / Supabase / Privacy-First Modular Platform
Author: José Mancilla
Date: March 6, 2026

⸻

1. Purpose and Product Definition

DREAMengin is a customizable web app for creating, sharing, organizing, and connecting interactive modules across personal, creative, and social spaces. A social modular app whose navigation begins as a calm HomeDream and matures into an iOS Photos-style stacked surface system across the whole product. 
*This is a real product specification, not a concept sketch.*

The system is privacy-first, user-first, deeply customizable, modular, interconnected, and built for full creative freedom.

	•	HomeDream is the root surface
	•	everything else opens from it, not away from it
	•	navigation should feel like depth, not page switching
	•	profile is a flip/paired surface
	•	Dreams open into deeper layers
	•	Daydreams are not random routes, they are deeper spaces
	•	going back should restore context, not reload a new world
You’re not asking for:
	•	tabs plus pages
	•	dashboard cards plus links
	•	web nav dressed up as native
	•	surface stack navigation
	•	state-preserving depth
	•	IOS Photos-style continuity
	•	across the whole app

If a navigation move feels like:
	•	leaving the world,
	•	reloading the world,
	•	or forgetting where you were,

then it’s wrong.

If it feels like:
	•	opening deeper,
	•	staying oriented,
	•	and being able to flip back naturally,

1.1 System Surfaces and Modules

The system is composed of:

Core Dreams (primary system surfaces)
	•	HomeDream (main private user surface)
	•	Edit ProfileDream (profile composition and layout builder)
	•	View Profile (public/shared-facing profile view)

Daydream Pair System
	•	6 Daydreams (Side A experiences, user-facing)
	•	6 DayDreamengin systems (Side B engine environments, control layers)

Platform Modules
	•	Dreams (widgets/modules)
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
	•	Component Model: modular, widget-driven, reusable surfaces
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
	•	Side B: corresponding engine system (control layer)

Only Side B uses the Engin suffix.

⸻

4. HomeDream (Core System, Private Operating Surface)

4.1 Purpose

HomeDream is the user’s main private customizable operating surface. It is where:
	•	content appears first
	•	widgets live and interact and feed the feed
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
	•	Single tap: Go Home.
	•	Double tap: Open dual menus.

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
	•	surrounded/supported by modular Dreams (widgets)
	•	customizable in color, widget arrangement, and behavior
	•	controllable by feed mode and source selection
	•	designed as the daily primary entry point into DREAMengin

4.4 HomeDream Feed

The feed supports:
	•	personalized content
	•	widget broadcasts
	•	algorithm mode or manual mode
	•	customizable source selection
	•	favorites-prioritized or individually chosen source modes
	•	post composition and routing
	•	ambient or active content presentation
	•	internal content + selected connected world content

The feed may contain:
	•	user-created posts
	•	activity from selected widgets
	•	DreamDM content
	•	music or media signals
	•	shop or marketplace highlights if allowed
	•	system announcements
	•	utility modules like weather/news if enabled

4.5 HomeDream Widget Behavior

Widgets on HomeDream:
	•	represent connected modules or systems
	•	may stay dormant until touched
	•	may surface passive signals
	•	may broadcast into the feed
	•	may open into deeper interaction surfaces
	•	may be customized individually

4.6 HomeDream Customization Controls

Users may customize:
	•	widget layout
	•	widget color and visual treatment
	•	feed algorithm settings
	•	active sources
	•	favorites
	•	posting routes
	•	feed density and prioritization

⸻

5. Edit ProfileDream (Core System, Private Builder Surface)

5.1 Purpose

Edit ProfileDream is the private builder surface for the user’s profile and public/shared-facing presentation.

5.2 Functions

Users may:
	•	drag widgets
	•	resize widgets
	•	reshape widgets
	•	place widgets spatially
	•	control widget visibility
	•	choose which content surfaces publicly
	•	customize visual presentation
	•	build profile structure intentionally

5.3 Editing Rules
	•	editing is visual
	•	editing is direct
	•	edits must be reversible
	•	layout must persist
	•	no private HomeDream content appears publicly without explicit user action

5.4 Profile Configuration

Users may configure:
	•	public widgets
	•	follower-only widgets
	•	hidden widgets
	•	bio and profile identity
	•	featured modules
	•	layout hierarchy
	•	thematic styling

⸻

6. View Profile (Public/Shared Output Surface)

6.1 Purpose

View Profile is the public or shared-facing result of what the user builds in Edit ProfileDream.

6.2 Access and Preview
	•	View Profile is a separate link available from Edit ProfileDream so the user can preview before saving.

6.3 Required Behavior

View Profile must:
	•	reflect the current profile configuration
	•	show only explicitly allowed public/shared content
	•	preserve widget interactions allowed in public context
	•	never expose private HomeDream content
	•	support preview mode before save
	•	support public or permission-limited viewing based on settings

6.4 Preview Before Save Requirements

Inside Edit ProfileDream, the user must be able to:
	•	click View Profile
	•	see the profile as a viewer would see it
	•	return to editing
	•	save only when satisfied

⸻

7. Daydream Pair System (6 Daydreams + 6 DayDreamengin Systems)

7.1 Definition

Each Daydream has:
	•	a Side A experience
	•	a Side B Engin system
	•	specialized tools
	•	specialized widget support
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
	•	arranging music-oriented widgets
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

8.3 Specialized Widgets (Examples)
	•	track widget
	•	playlist widget
	•	release widget
	•	lyrics widget
	•	audio project widget
	•	sales / launch status widget

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

9.3 Specialized Widgets (Examples)
	•	game world widget
	•	build widget
	•	logic widget
	•	player state widget
	•	environment widget
	•	inventory/system widget

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

10.3 Specialized Widgets (Examples)
	•	experiment widget
	•	state widget
	•	model widget
	•	results widget
	•	parameter widget
	•	simulation viewer widget

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

11.3 Specialized Widgets (Examples)
	•	project widget
	•	code file widget
	•	snippet widget
	•	terminal widget
	•	deployment widget
	•	runtime widget

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

12.3 Specialized Widgets (Examples)
	•	campaign widget
	•	brand kit widget
	•	performance widget
	•	audience widget
	•	asset widget
	•	identity widget

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

13.3 Specialized Widgets (Examples)
	•	draft widget
	•	composition widget
	•	media attach widget
	•	publishing widget
	•	template widget
	•	output routing widget

⸻

14. Navigation Model (Core + Daydream Pair System)

14.1 Seamless Movement Requirement

Users must move between:
	•	HomeDream
	•	Edit ProfileDream
	•	View Profile
	•	any Daydream
	•	its corresponding DayDreamengin
without feeling like they are leaving the overall DREAMengin environment.

14.2 Side A → Side B Relationship

Each Side A must lead naturally into its Side B. Side B must feel like:
	•	the powered version
	•	the control layer
	•	the deeper system surface

14.3 Engin Dual Button Controls

Each DayDreamengin includes a small “pill” style dual-button control area for engine-side control actions. These controls are:
	•	compact
	•	specialized
	•	separate from the main DreamMenu
	•	contextual to the Engin environment

⸻

15. Dreams (Widgets)

15.1 Definition

Dreams are the modular interactive widget units used throughout the system.

15.2 Role

Dreams may:
	•	display content
	•	accept content
	•	route content
	•	surface signals
	•	open into more detailed views
	•	represent a Daydream or system component
	•	exist on HomeDream, Edit ProfileDream, View Profile, and Daydream surfaces where allowed

15.3 Widget Menu Requirement

Every widget must include a customization menu.

15.4 Widget Menu Functions (May Include)
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

15.5 Widget Data (Minimum)

Each Dream should minimally support:
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
	•	widget skins
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
	•	browse widgets, modules, tools, assets, and experiences
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
	•	contextual discussion around creations or widgets

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
	•	widget arrangement
	•	feed behavior
	•	widget activity
	•	algorithm settings
	•	profile composition
	•	DreamMenu configuration where allowed

20.2 Domain-Specific Customization

Each Daydream may support specialized customization tied to its own tools and widgets.

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

21.2 Widget Source Control

Users may choose what widgets contribute to feeds or surfaces.

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
	•	widgets (Dreams)
	•	widget configs
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
•only AI that non admin users can ask questions to. 
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

⸻

25. Launch Standard (Minimum “Truthful” Release)

The launch version must:
	•	feel complete as a product
	•	support HomeDream as a real private daily surface
	•	support Edit ProfileDream as a real builder
	•	support View Profile as a real destination
	•	support the 6 Daydream / 6 DayDreamengin structure
	•	support Dreams as real customizable widgets
	•	include DreamShop, DreamMarketplace, DreamMenu, DreamDM, and DreamAds in truthful form
	•	include only working interactions, not implied ones

⸻

26. Final Product Philosophy

DREAMengin is a modular creative and social operating environment.

HomeDream is where the user lives privately.
Edit ProfileDream is where the user crafts public expression.
View Profile is where that expression is shown.
The 6 Daydreams are the lived domains.
The 6 DayDreamengin systems are the powered control layers behind them.
Dreams are the modular units connecting everything.
DreamShop, DreamMarketplace, DreamMenu, DreamDM, and DreamAds complete the ecosystem.

Everything is connected.
Everything is customizable.
Everything is user-first.
Everything is privacy-first.
Everything must feel owned by the user.

⸻

27. Generation Law (AI Build Constraint)

Every AI agent working on DREAMengin — Dr. Eams, IDARi, TheBoogieMan.Ai, or any external Copilot — must follow the Generation Law defined in docs/GENERATION_LAW.md.

27.1 Allowed-Output Formula

For each generation pass, compute:

	allowed next output = base spec fidelity × (ДР/2) × (1 + ДРх)

	•	base spec fidelity — how closely the current codebase matches this README (0–1 scale)
	•	ДР — the delta ratio: fraction of the spec addressed by this pass
	•	ДРх — the residual-adjusted delta ratio (see docs/GENERATION_LAW.md)

A pass whose scope would exceed the allowed output must be split into smaller passes or down-graded to patch-only mode.

27.2 App-Build Load (χ)

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

27.3 Residual Classes

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

END SPEC
