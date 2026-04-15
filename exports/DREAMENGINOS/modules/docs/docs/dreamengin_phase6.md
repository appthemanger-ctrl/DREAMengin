# DREAMengin — Phase 6

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


## Platform Completion Phase

### AI Triad Integration, Privacy System Enforcement, and Module Consolidation

### Covers README Sections
- 17. DreamMenu
- 19. DreamAds
- 22. Privacy Model
- 23. Data Model Overview (Supabase)
- 24. AI Triad (Platform Intelligence System)
- 25. Launch Standard (Minimum "Truthful" Release)

---

## Goal

Complete the integration of all platform-level systems so the product is ready for Phase 7 identity consolidation.

Phase 6 takes the surfaces and components built in Phases 1–5 and makes them work together as a coherent, privacy-respecting, real-capability platform. This phase does not introduce new top-level product concepts. It wires existing systems to each other, removes fake states, closes open privacy gaps, and makes the AI Triad functional end-to-end.

No Phase 7 work (identity locking, naming authority, constitution) may begin until Phase 6 is complete and every visible action maps to a real system action.

---

## Independence Rule

Phase 6 must be implementable without altering the README, the product constitution in Phase 7, or the naming authority. It operates entirely within the already-defined product surfaces and module boundaries.

---

## 50-Point Phase Spec

### AI Triad Integration (Points 1–12)

1. Dr. Eams must be wired as the primary search bar inside HomeDream so that user-typed queries route to the `/api/ai/eams` endpoint and return contextual results.

2. Dr. Eams must launch DreamDM when the user presses send after composing a message in the HomeDream surface.

3. Dr. Eams must surface navigation suggestions (links to Shop, Settings, Daydream, etc.) when a user searches for a platform location.

4. The legacy `/api/dr-eams/run` and `/api/dr-eams/hf` routes must be preserved as support routes but must not be the primary integration target in any new code.

5. IDARi must remain admin-facing only. No IDARi endpoint may be surfaced through any standard user-accessible UI path.

6. IDARi must be protected by an admin-guard check even when `NEXT_PUBLIC_DEV_BYPASS_AUTH` is active.

7. TheBoogieMan.Ai must log all privacy-adjacent decisions (visibility changes, profile publication events, explicit share actions) through the `/api/ai/boogieman` route.

8. TheBoogieMan.Ai must enforce the "nothing public by default" rule at the API layer: any request that would expose private data without an explicit visibility record must be rejected and logged.

9. The AI Triad consensus gate must require unanimous triad approval before any major system-level update recommendation is acted upon.

10. No AI agent may generate or modify content on behalf of a user without the user performing an explicit confirmation action.

11. All three AI API routes (`/api/ai/eams`, `/api/ai/idari`, `/api/ai/boogieman`) must be server-side only and must never forward API keys to the client bundle.

12. The triad coordination bus (`lib/agents/agentBus.ts`) must be the sole channel through which agents communicate cross-agent state; no direct agent-to-agent coupling is permitted outside that bus.

---

### Privacy System Enforcement (Points 13–24)

13. The `visibility_mappings` table must be consulted before any content is rendered on ViewProfile or `/profile/[handle]`.

14. EditProfileDream draft state must never appear on ViewProfile before the user saves and explicitly chooses to share.

15. The save flow in EditProfileDream must distinguish between a local save (private) and an explicit share action (public projection), with separate UI actions for each.

16. The profile save button must dim when there are no unsaved changes and must become active (gold) when there are dirty unsaved changes.

17. A successful explicit share action must update the `visibility_mappings` record and only then trigger a ViewProfile projection refresh.

18. All Supabase tables containing user-generated content must have Row Level Security enabled; no table may rely solely on application-layer checks.

19. The `SUPABASE_SERVICE_ROLE_KEY` must never appear in any client-bundle file, component, or `NEXT_PUBLIC_` environment variable.

20. API routes that return user profile data must check the authenticated session and reject unauthenticated requests before any database query executes.

21. HomeDream personalized feed data must be private by default; no feed item may appear on a public surface without an explicit publication event.

22. DreamDM messages must have per-conversation RLS policies so that only conversation participants can read message records.

23. DreamShop and DreamMarketplace listing data may be public, but the owner's order history, DreamAds configuration, and private notes must remain private by default.

24. Privacy-safe failure must be preferred over silent exposure: when the system cannot determine visibility with certainty, it must render nothing and log the ambiguity rather than defaulting to public.

---

### Platform Module Consolidation (Points 25–36)

25. DreamMenu must have a single canonical implementation. The existing menu components across `components/menus/*`, `components/dreamnav/*`, and `components/HomeRadialNav.tsx` must be unified under the DreamMenu name and must not independently duplicate navigation logic.

26. The Gold Button navigation system must be the sole entry point for the dual-menu system: left menu for six Daydream navigation and Dr. Eams chat; right menu for regular menu and Dr. Eams chat.

27. DreamAds must separate user-owned ad spaces from platform promotions in both code and UI language; no component may use the label "DreamAds" to refer to platform promotional inventory.

28. DreamShop must have a real listing capability: items must be stored, retrieved, and displayed from the database rather than rendered from static or mock data.

29. DreamMarketplace must have a real listing capability consistent with DreamShop; mock or stub listings must be replaced with real database reads guarded by RLS.

30. DreamDM must support real message persistence: messages must be stored via Supabase Realtime, read from the database on mount, and delivered in order.

31. The six canonical Daydream routes (`/daydream/music`, `/daydream/games`, `/daydream/lab`, `/daydream/code`, `/daydream/brand`, `/daydream/create`) must all render non-empty, non-placeholder content.

32. The three legacy Daydream routes (`/daydream/analytics`, `/daydream/media-vault`, `/daydream/play`) must be repurposed or redirected to canonical surfaces; they may not persist as free-floating product names.

33. GameEngin must be added to `components/daydream/` as the Side B Engin component for the Games Daydream pair, consistent with the five already-created Engin components.

34. The `useDaydreamState` hook must be created in `lib/daydream/` to provide shared Daydream/Engin state management across all six pairs.

35. DaydreamShell must accept a `sideBComponent` prop so that each Daydream route can inject the appropriate Engin component as Side B.

36. The HomeDream feed must resolve content from real data sources: widget broadcasts, DreamDM signals, and system announcements must be sourced from real Supabase queries rather than static arrays.

---

### Real Capability Verification (Points 37–44)

37. Every button or link in the product must map to a real system action. Any button with an empty handler (`onClick={() => {}}`) or a dead `href="#"` must be replaced with a real action or removed.

38. Every toggle or switch that modifies user state must persist that state through Supabase; no toggle may modify only in-memory React state without a corresponding database write.

39. Every form that collects user input must either submit that input to a real endpoint or clearly gate the interaction with a "coming soon" state that prevents the form from implying completion.

40. The HomeDream customization controls (widget layout, feed algorithm, source selection) must save their settings to the database and restore them on session load.

41. The EditProfileDream spatial controls (drag, resize, reshape, place) must save their output to the database and restore the builder state on session load.

42. The six Daydream workspace states must be persisted through Supabase using the `daydream_states` table structure defined in the README data model; no Daydream may silently discard unsaved work.

43. Notification entries surfaced through the notifications system must reflect real system events (new DreamDM messages, new followers, new likes) rather than static demo data.

44. The Dr. Eams search and navigation suggestion system must return real results: platform location suggestions must resolve to real routes, and platform content results must query real data.

---

### Phase Acceptance Criteria (Points 45–50)

45. Phase 6 is complete only when the AI Triad operates end-to-end with real API calls, real persistence, and proper admin-only gating for IDARi.

46. Phase 6 is complete only when ViewProfile renders exclusively from saved, explicitly shared projection records and never from live EditProfileDream draft state.

47. Phase 6 is complete only when all platform modules (DreamMenu, DreamAds, DreamShop, DreamMarketplace, DreamDM) have real database-backed functionality rather than static or stub implementations.

48. Phase 6 is complete only when all six Daydream routes surface non-placeholder content and the three legacy Daydream routes are redirected or repurposed.

49. Phase 6 is complete only when every visible action in the product does something real and no fake buttons, implied actions, or empty handlers remain in any page that a user can reach.

50. Acceptance for Phase 6 requires a full residual audit against `docs/GENERATION_LAW.md` with zero open Behavior Residuals, zero open Privacy Residuals, zero open Projection Residuals, and no new Architecture Residuals introduced during this phase.

---

## Relationship to Other Phases

| Phase | Focus | Dependency |
|-------|-------|-----------|
| Phases 1–5 | Foundation, naming, components, Daydream/Engin wiring, platform modules | Must exist before Phase 6 |
| **Phase 6** | **AI Triad, privacy enforcement, real capability, module consolidation** | **This document** |
| Phase 7 | Product identity, canonical naming authority, constitution lock | Requires Phase 6 complete |

## Key Files Affected

- `components/daydream/` — add GameEngin.tsx; update DaydreamShell with sideBComponent prop
- `lib/daydream/` — create useDaydreamState hook
- `app/daydream/analytics/`, `app/daydream/media-vault/`, `app/daydream/play/` — repurpose or redirect
- `lib/ai/triad.ts`, `lib/agents/agentBus.ts` — AI Triad coordination
- `app/api/ai/` — all three AI routes (eams, idari, boogieman)
- `app/view-profile/`, `app/profile/[handle]/` — projection-only rendering
- `app/edit-profiledream/` — private/share distinction in save flow
- `components/menus/`, `components/dreamnav/`, `components/HomeRadialNav.tsx` — DreamMenu unification
