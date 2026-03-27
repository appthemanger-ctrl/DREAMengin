# DREAMengin Handoff

Last updated: 2026-03-16

## What changed in this alignment pass

This handoff reflects the canonical OS-Layer Naming Migration — upgrading the product description from a page-based app model to the dual-runtime, spatial operating environment model.

### Primary outcome

All docs, canonical name registry, and tests now use the OS-layer naming model:
- DREAMengin is a **dual-runtime, spatial operating environment**
- Surfaces (not pages), Dream Windows (not widgets), DreamSpace (not widget layer)
- Connection language: bind / mount / activate (not link widget / open page)
- Multi-surface, multi-engin connection network (not 1-to-1 pairs)

### Canonical names now documented first

**Product type:**
- DREAMengin Runtime Environment (dual-runtime, spatial operating environment)

**Runtime regions:**
- Surface Space (upper active runtime region)
- DreamSpace (lower modular runtime region)
- DreamDM Bar / Runtime Seam (Persistent Interaction Rail)

**Core surfaces:**
- HomeDream Surface
- Edit ProfileDream Surface
- View Profile Surface

**Daydream Surface Network:**
- Music Daydream Surface / StarMakerEngin
- Games Daydream Surface / GameEngin
- Lab Daydream Surface / LabEngin
- Code Daydream Surface / CodeEngin
- Brand Daydream Surface / BrandingEngin
- Create Daydream Surface / ContentEngin

**Platform modules:**
- DreamShop Surface
- DreamMarketplace Surface
- DreamMenu
- DreamDM Surface
- DreamAds Surface
- Dream Windows (modular runtime containers)

**AI triad:**
- Dr. Eams
- IDARi
- TheBoogieMan.Ai

## Current repo reality

- Canonical routes exist for `/homedream`, `/edit-profiledream`, and `/view-profile`.
- Legacy support routes still exist for `/home`, `/edit-profile`, `/profile`, and `/u/[handle]`.
- The public/shared profile destination in the current repo is still `/profile/[handle]`.
- The Dream Window layer already exists in `components/dreams/*` while legacy widget material still exists in `components/widgets/*`.
- Code-level naming (variable names, component names) may still use legacy "widget" terminology internally — these are residuals to be resolved progressively.

## Next repo steps

1. Continue renaming UI labels and internal docs toward OS-layer canonical names.
2. Progressively rename internal code references from "widget" to "Dream Window" where it adds clarity.
3. Tighten HomeDream Surface → Edit ProfileDream Surface → View Profile Surface projection boundaries in code.
4. Keep additions minimal and prefer moving or re-wiring what already exists.
5. Ensure all new Dream Window data structures carry the 10 required fields.

## Change Timeline

| # | Date / Time (UTC) | Revision | Branch | Author | Summary |
|---|---|---|---|---|---|
| **auto** | 2026-03-27 19:39 UTC | `183bd01` | copilot/improve-feed-user-content-display | Copilot | ~2 modified<br>feat: add image upload to feed composer, content type badges, and horizontal snap-scroll layout — Reasoning: The HomeFeed composer had a decorative "Add image" button that did nothing. Feed posts lacked clear content type labels. Feed scrolled vertically instead of horizontally like GitHub shots.  Architecture justification: docs/ARCHITECTURE.md §8 (design system — intentional interaction), docs/LAW.md §3 (every visible action must do something real), docs/AXIOMS.md Axiom 3 (real capability — no fake buttons).  Performance impact: neutral — scroll-snap is CSS-only; image upload reuses existing Supabase storage pattern from useMessagingCore.  Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/e941d5b2-ab65-4de3-9d35-68c7159a9c1c  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>✏️: `components/HomeFeed.tsx`, `lib/feed/useLiveFeed.ts` |
| **auto** | 2026-03-27 10:18 UTC | `b08e631` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #324 from appthemanger-ctrl/copilot/add-rss-parser-integration — feat: add lib/social-feed.ts — lightweight social feed aggregator<br> |
| **auto** | 2026-03-27 09:23 UTC | `94da4c6` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #323 from appthemanger-ctrl/copilot/create-ai-agent-from-dream-engin — fix: remove exposed OAuth token modal, kill traffic-light status colors, create DREAMengin agent<br> |
| **auto** | 2026-03-27 08:22 UTC | `e0d89f2` | copilot/create-ai-agent-from-dream-engin | Copilot | +1 added  ~2 modified<br>fix: remove exposed OAuth token modal, replace traffic-light status colors with DREAMengin palette, create DREAMengin agent — Reasoning: YouTube connector showed a raw Google OAuth Access Token paste field even though oauthStartUrl was configured — security violation and bad UX. Status badges used green/amber/red traffic-light colors instead of the DREAMengin design system (gold/light-blue/white). Created lib/agents/dreamengin.ts as an AI agent that embodies the DREAMengin philosophy in code.  Architecture justification: ARCHITECTURE.md §8 (gold/light-blue/white palette), AXIOMS.md §3 (every visible action must do something real), LAW.md §2 (nothing is public by default — credentials must never be exposed).  Performance impact: none (UI-only + new agent module with no runtime overhead).  Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/c80999a9-4ddb-4502-a2aa-4705cdeaab85  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `lib/agents/dreamengin.ts`<br>✏️: `components/connectors/ConnectorRow.tsx`, `lib/telemetry.ts` |
| **auto** | 2026-03-27 02:31 UTC | `5341cd4` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #316 from appthemanger-ctrl/copilot/update-supabase-client-implementation — Restore Supabase SSR server-client compatibility and accept publishable default key alias<br> |

## What changed in this alignment pass

This handoff reflects the README-first documentation cleanup.

### Primary outcome
The docs now treat `README.md` as the authoritative full specification and use spec-first names across the implementation docs.

### Canonical names now documented first
- HomeDream
- EditProfileDream
- ViewProfile
- Dreams
- DreamShop
- DreamMarketplace
- DreamMenu
- DreamDM
- DreamAds
- Dr. Eams
- IDARi
- TheBoogieMan.Ai

## Current repo reality

- Canonical routes exist for `/homedream`, `/edit-profiledream`, and `/view-profile`.
- Legacy support routes still exist for `/home`, `/edit-profile`, `/profile`, and `/u/[handle]`.
- The public/shared profile destination in the current repo is still `/profile/[handle]`.
- The Dreams layer already exists in `components/dreams/*` while legacy widget material still exists in `components/widgets/*`.

## Next repo steps

1. Keep renaming UI labels and internal docs toward spec names.
2. Continue repurposing legacy extras into the spec instead of preserving them as separate product names.
3. Tighten HomeDream → EditProfileDream → ViewProfile projection boundaries in code.
4. Keep additions minimal and prefer moving or re-wiring what already exists.

## Tracking doc

Use `docs/alignment/DOCS_CHANGE_TRACKER.md` as the ledger for this pass.

## Change Timeline

| # | Date / Time (UTC) | Revision | Branch | Author | Summary |
|---|---|---|---|---|---|
| **auto** | 2026-03-15 23:02 UTC | `c513b3f` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #216 from appthemanger-ctrl/copilot/clean-up-unused-resources — chore: strip all mock/demo/placeholder code — wire every surface to real data<br> |
| **auto** | 2026-03-15 22:00 UTC | `5017632` | copilot/clean-up-unused-resources | Copilot | +1 added  −6 deleted  ~9 modified<br>chore: remove all mock/demo/placeholder code - complete housekeeping — Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com><br>➕: `app/daydream/game/GamePageClient.tsx`<br>✏️: `app/profile/[handle]/page.tsx`, `app/settings/safety/page.tsx`, `app/view-profile/page.tsx`, `backend/src/services/ipfsService.js`, `backend/src/services/livekitService.js`, `components/AnchorWidgetOrchestrator.tsx`, `components/dreamengin/NexusMenu.tsx`, `components/profile/ProfileWidgetGrid.tsx`, `validate-deployment.js`<br>🗑️: `components/AdvancedSearch.tsx`, `components/FloatingActionBubble.tsx`, `components/GestureNavigationDemo.tsx`, `components/MobileFloatingActionButton.tsx`, `lib/connectors/demo.ts`, `lib/navigation/mockWidgetData.ts` |
| **auto** | 2026-03-15 21:42 UTC | `6c4a89a` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #215 from appthemanger-ctrl/copilot/implement-daydreams-description-route — fix: full platform wiring audit — daydreams discoverable, all dead actions wired, all broken routes fixed<br> |
| **auto** | 2026-03-15 20:53 UTC | `3e821e0` | completedream | appthemanger-ctrl | −1 deleted<br>Delete daydream/game directory<br>🗑️: `daydream/game/GamePageClient_app.tsx` |
| **auto** | 2026-03-15 20:46 UTC | `e8e98a3` | completedream | appthemanger-ctrl | +1 added  −1 deleted<br>Add GamePageClient_app.tsx file<br>➕: `daydream/game/GamePageClient_app.tsx`<br>🗑️: `app/game/GamePageClient.tsx` |
