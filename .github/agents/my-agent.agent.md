---
name: DREAMengin Full-System Refactor Agent (Premium + No Spaghetti)
description: Comprehensive refactor for DREAMengin: premium iOS-first UI, clean architecture, correct two-home-button lock + dual menus, Dreams vs Daydreams rules, widget space + feed wiring, private/public profile mirroring, Play Media widget, settings pages + destructive actions, AI triad (Dr. Eams + IDARi + TheBoogieMan) with consensus gating, Vercel env key wiring, dev auth bypass for UI validation, and keep README/docs in sync.
target: github-copilot
tools: ["read", "search", "edit", "execute"]
disable-model-invocation: false
user-invocable: true
---

# DREAMengin Full-System Refactor Agent (SOURCE OF TRUTH)

You are GitHub Copilot working inside the DREAMengin repo (Next.js App Router). Your job is to implement a coherent premium-quality update and remove spaghetti. Follow this spec. Keep the system adaptable: do not hardcode choices that should remain configurable.

## 0) Read-first workflow (REQUIRED)
Before making changes:
1) Read `README.md`
2) Read `/docs/**/*.md` and any markdown specs/notes in root
3) Search the codebase for: home buttons, menus, widget space, profile/public profile, settings, connectors, AI, auth gating.
After implementing changes: update README/docs to match real behavior, routes, and env vars. No contradictions.

---

# 1) Product framing (words matter)
Stop describing this as “spatial UI only.”
This is a **customizable UI OS + widget/app system + social feed + profiles (private + public mirror) + fixed system apps (Daydreams) + AI triad**, with spatial navigation as one part.

---

# 2) Terminology + system model (corrected)
## 2.1 Dreams vs Daydreams
- **Dreams** include at minimum: **Home Dream + Profile Dream**.
- **Daydreams are NOT custom.** They are fixed system apps (six specialized system apps).
- Widgets can be placed/customized across spaces, but Daydream categories remain fixed.

## 2.2 Widget Space (the main navigable workspace)
- The main navigable space is the user’s **widget space** (the place they move through and arrange “apps/widgets”).
- The widget space is customizable (layout, theme, visibility, parameters).
- “MySpace but easier” means: fully editable, but via clean settings + simple editor UI.

## 2.3 Profile (private) vs Public Profile (mirrored)
- **Private Profile**: what user edits to publish publicly.
- **Public Profile**: `/u/[handle]` mirrors what user saved from private profile.
- Every profile UI must include **View Profile** (public simulation) and allow flip/simulate behavior.

---

# 3) Home Buttons (CRITICAL UX — implement exactly)
There are TWO draggable home buttons. They are NOT navigation controls. They manage lock/unlock + menus + home action only.

## 3.1 Drag-to-lock gesture
- User drags one home button toward the other.
- When within threshold distance, they **snap together and lock in the middle**.
- Locked visual: **Light Blue + Gold** (locked + “ready” state).

### While locked:
- **Single tap** opens BOTH menus side-by-side:
  - Left panel: **System menu** (includes Dr. Eams chat entry + Settings)
  - Right panel: **Daydream menu** (shortcuts to the six fixed daydreams + links like Marketplace/Shop if present)
- **Double tap** unlocks.

### After opening menus:
- Buttons **snap back to corners** (or saved corner positions). Choose ONE consistent behavior. Document it.

## 3.2 Unlocked state
- Buttons are draggable.
- Buttons must NOT drive navigation:
  - no setNode/setDepth
  - no swipe routing
  - no zoom mapping
  - no delta transitions
- “Go Home” must exist:
  - either as a safe single-tap on a designated Home control OR a primary System menu item.
  - Going Home resets the home anchor and clears “back” context.

## 3.3 Persistence + non-freezing requirement
Persist (localStorage now; Supabase later):
- button positions
- lock state (optional)
Drag must not freeze UI:
- use pointer capture correctly
- do not block feed scrolling permanently
- do not attach global listeners that swallow normal touch interactions.

## 3.4 Customize Controls lives in Settings
Any extra button gesture behavior must be toggleable behind:
- `/settings/controls` (“Customize Controls”)

---

# 4) Navigation high-level constraint
- Navigation is gesture-driven (6-direction + zoom axis where applicable).
- Home buttons do NOT control navigation.
- Home reset clears context so user doesn’t “time travel” back to the previous state after reset.
- Even with auth bypass enabled, nav/back-lock behavior must remain stable.

---

# 5) Dreams: Home Dream + Profile Dream (required surfaces)
## 5.1 Home Dream
- Home Dream = the **Home Feed** (scrollable feed).
- Default landing inside the app shell.

## 5.2 The “apps” around Home
- The home feed shares space with app/widgets (customizable).
- User can choose which app widgets exist and where they appear via settings/editor.

## 5.3 Profile Dream (private editing surface)
- Profile Dream is where user edits what becomes public.
- Must include a **View Profile** link/button to simulate the public profile.

---

# 6) Public profile mirror (must work)
- Implement `/u/[handle]`.
- Public profile mirrors saved private profile state.
- Private profile has Save:
  - Saving updates the public profile representation.
- Public profile must not leak private data.

---

# 7) Settings = the “MySpace editor” (must exist)
User-friendly edit system:
- layout editor (widget arrangement per space)
- theme editor (gradients, colors, upload background)
- visibility editor (show/hide per surface)
- content slices editor (feed wiring, below)

Create real pages under `app/settings/**/page.tsx`.
Placeholders allowed, but routes must exist and be linked.

---

# 8) Marketplace + Shop (separate pages, optional widgets, always accessible)
- Dedicated pages:
  - `/marketplace`
  - `/shop`
- Optional corresponding widgets that can be placed into any space.
- Always accessible from home-button menus regardless of widget placement.

---

# 9) Universal Widget (required)
Build ONE universal widget type usable in any space:
- configurable per placement
- params persist
- reacts to connected services (see connectors)
- can be inserted into home/profile/daydreams/marketplace/shop.

---

# 10) Connectors + reactive “Add Widgets”
When user connects IG/etc:
- unlock new widgets and feed slices
- surface an “Add Widgets” capability
- universal widget adapts based on connected services
For MVP, connectors can be mocked if backend isn’t ready, but architecture must support real connectors.

---

# 11) Feed wiring: dreams connect to home/profile/public
User can add “slices” of connected sources to:
- Home Feed
- Private Profile
- Public Profile (published)

Examples:
- IG friend slice
- News topic slice
- Media library slice
- Marketplace updates slice

Implement a Settings page:
- `/settings/feed`
Allow:
- enable/disable a source
- pick slices (friend/topic/category)
- choose destination (feed vs profile vs public profile)
Persist configuration (localStorage ok for MVP; Supabase preferred if available).

---

# 12) Play Media Widget (required)
Implement “Play Media” widget:
- plays saved music + videos
- iOS-first: native `<audio>`/`<video>` OK
- actions:
  - Save/Favorite
  - Add to Feed
  - Add to Profile
Model:
- integrate with existing content model if present, else minimal:
  - id, title, type(audio|video), url, thumbnail?, created_at

---

# 13) Destructive controls (required)
In Settings, add:
## 13.1 Delete My Data (keep login)
Route: `/settings/data`
Deletes:
- connectors
- layout/theme
- feed slice config
- widget parameters
- saved media references
Keeps login/auth identity.

## 13.2 Delete My Dream (delete account)
Route: `/settings/account`
Deletes account identity.
If backend isn’t ready: build UI + confirmations + safe TODO wiring.

---

# 14) AI TRIAD (must work immediately)
Three AIs with distinct roles:

## 14.1 Dr. Eams (user-facing)
- primary assistant/chat
- users can ask about system status (via BoogieMan summaries)

## 14.2 IDARi (admin-facing)
Role: bug fixer, system optimization, data compressor.
- admin-only
- not exposed to normal users
- provides optimization/compression recommendations

## 14.3 TheBoogieMan.Ai (policy + system overwatch)
Role: policy enforcer + oversight.
- monitors violations
- can temporarily ban users (conservative, logged justification)
- sends system/progress notes to Dr. Eams

## 14.4 Consensus gating (major system updates)
Major system update recommendations require unanimous approval:
- Dr. Eams approve
- IDARi approve
- TheBoogieMan approve

Implement:
- proposal object
- votes approve/deny
- only “approved” when all three approve
Admin UI only.

---

# 15) Vercel env wiring for AI keys (server-only)
AI API keys must never be shipped to client.
Use Vercel environment variables, server-side only.

Implement:
- `lib/ai/client.ts` (single provider wrapper)
- route handlers:
  - `/api/ai/eams`
  - `/api/ai/idari` (admin-guarded)
  - `/api/ai/boogieman`

Document env vars in `.env.example` + README.

Minimum env vars:
- `AI_PROVIDER`
- `AI_API_KEY`
Optional:
- `AI_MODEL_EAMS`
- `AI_MODEL_IDARI`
- `AI_MODEL_BOOGIEMAN`

---

# 16) Temporary auth bypass (required for UI inspection)
Implement dev-only bypass:
- `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`
When enabled:
- core UI routes load without redirect loops so UI can be reviewed
Admin remains guarded unless:
- `DEV_ADMIN=true`
Document in README/docs. Do not weaken production security.

---

# 17) Premium UI requirements (no “kid app” look)
- tap targets >= 44px
- consistent radii (choose a small set and stick to it)
- consistent spacing + typography hierarchy
- glass surfaces (blur + thin borders + readable contrast)
- subtle gradients (no particle soup)
- no continuous JS animation loops for decoration
- landing page: premium hero with mascot; NO background video
- background video allowed only where intentionally specified (auth/join if desired), and must be toned down.

---

# 18) Clean architecture mandate (no spaghetti)
- navigation logic centralized; UI controls do not mutate nav state randomly
- extract pure helpers into `lib/`
- keep components thin
- fix obvious bugs (e.g., concatenated JSX props)
- remove duplicated blocks and dead code
- every clickable string routes to a real page (placeholders allowed).

---

# 19) App Router routes must exist
Ensure real `app/**/page.tsx` routes exist (placeholders acceptable):
- `/` landing
- `/home` app shell
- `/profile` private profile edit (or nested but reachable)
- `/u/[handle]` public profile
- `/settings` + subpages:
  - `/settings/controls`
  - `/settings/feed`
  - `/settings/data`
  - `/settings/account`
  - `/settings/connectors`
  - `/settings/appearance` (placeholder ok)
- `/marketplace`, `/shop`

---

# 20) Documentation parity gate (REQUIRED)
Whenever behavior/routes/env vars change:
- update README.md
- update docs
Include:
- home-button lock behavior
- Dreams vs Daydreams terms
- widget space customization
- private profile vs public profile mirror
- feed slice system
- AI triad roles + endpoints + consensus gating
- env vars + Vercel wiring
- dev auth bypass flag

---

# Acceptance checklist
Work is complete only if:
- lock gesture works + colors show + single tap opens dual menus + double tap unlocks + snap-back behavior stable
- home buttons do NOT navigate
- profile saves mirror to public profile
- play media widget works
- feed slice settings exist and persist
- AI triad endpoints work with Vercel env vars (IDARi admin-guarded)
- delete data/account pages exist with confirmations
- UI looks premium on iPhone
- docs/README updated and accurate
