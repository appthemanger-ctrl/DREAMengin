# DREAMengin — Phase 8

## Real Runtime Completion

**Status:** Active build phase  
**Authority:** docs/CONSTITUTION.md + docs/GENERATION_LAW.md + docs/PRODUCT_DEFINITION.md  
**Last updated:** 2026-03-21

Phase 7 locked the product identity, the constitution, and the naming authority. Phase 8 is the first post-constitution build phase. Every item in this spec must comply with the locked CONSTITUTION, NAMING_AUTHORITY, and PRODUCT_DEFINITION without exception.

Phase 8 = Real Runtime Completion. Every surface, every Dream Window, every Daydream, every Engin, every platform module must read and write real data. No placeholder content. No stub handlers. No in-memory-only state. No mock feeds. The runtime must be alive.

---

## Generation Law Pre-Pass

Before opening any create-mode pass against this phase:

```
PRE-PASS CHECKLIST
[ ] χ computed — mode confirmed (create / conform / patch only)
[ ] allowed next output computed — scope fits within limit
[ ] No unresolved residuals from the previous pass (check BUGS.md)
[ ] CONSTITUTION.md acceptance checklist reviewed
[ ] This document section targeted — not the whole phase at once
```

Each section of this spec is a separate pass target. Do not attempt the full phase in one pass.

---

## Section A — HomeDream Surface: Real Feed & Real Customization

**Points 1–10**

1. HomeDream feed resolves exclusively from real Supabase queries — widget broadcasts, DreamDM signals, and system announcements sourced from the `feed_items` table; no static arrays remain.
2. Connector feed items (Mastodon, Bluesky, GitHub, Reddit, Nostr, Spotify, YouTube) surface inside the HomeDream feed from the `feed_items` table after user-triggered sync.
3. Feed algorithm and source selection controls in HomeDream save their settings to the database and restore on session load.
4. Dream Window layout configuration in HomeDream persists to the database per user and restores on session load.
5. The compact Dream Window rail between the HomeDream feed and the DreamDM Bar is implemented — swipeable, real data, DreamSpace opener functional.
6. HomeDream personalized feed content is private by default — no feed item appears on any public surface without an explicit publication event.
7. Feed scroll is fully independent from DreamDM Bar position and Gold Button position — scroll in the feed never moves the bar or the button.
8. HomeDream Surface is confirmed as the runtime root — all navigation opens from it, nothing navigates the user away from the environment into a separate world.
9. Dr. Eams in HomeDream returns real navigation results — platform location suggestions resolve to real canonical routes, not stubs.
10. Dr. Eams in HomeDream returns real content results — platform content queries hit real Supabase data, not mock arrays.

---

## Section B — Dream Window System: Full Lifecycle Activation

**Points 11–22**

11. Dream Window binding lifecycle fully implemented — Unbound → Bound → Mounted → Collapsed transitions are real state changes persisted to the database, not cosmetic toggles.
12. Every Dream Window instance carries all 10 required fields; any Dream Window record missing required fields is rejected at the API layer before insert.
13. Dream Window placement in Edit ProfileDream Surface persists spatial data (position, size, layout) to the database and restores the builder to the exact saved state on session load.
14. Dream Window visibility state (private / shared / public) is enforced at the Supabase data layer for every Dream Window type — RLS policies govern read access by visibility state.
15. Dream Window real ownership — every Dream Window record has an `owner_id` field; owner-only mutations (edit, delete, bind, publish) are enforced at the API layer and blocked for non-owners.
16. Dream Window actions (add, remove, bind, collapse, expand) produce real DB writes — no action produces in-memory-only state without a corresponding database record.
17. SuperDreamWidget composition rules fully defined and implemented — profile-wide automatic composition from compatible Dream Windows is real, not a shell component.
18. `components/widgets/*` legacy fully absorbed — all active widget usage migrated to the canonical Dream Window model; no widget-named component renders user-facing content.
19. `types/widget-system-v2.ts` deprecated and removed — Dream Window types in `types/dream-window.ts` are the single type authority.
20. Dream Window Shell → Connector → Feature → Output layer model is fully enforced — no Dream Window skips layers or bypasses the composition model.
21. Dream Windows displayed on View Profile Surface render only from saved projection records with `visibility = shared` or `visibility = public` — zero live builder state leakage.
22. Dream Window delete action wipes the record from all layers (DB row, visibility mapping, any projection records) as a single atomic operation.

---

## Section C — Edit ProfileDream Surface & View Profile Surface: Projection System

**Points 23–30**

23. Edit ProfileDream Surface spatial controls (drag, resize, reshape, place) save their output to the database on every confirmed action and restore exact builder state on session load.
24. Save Draft (`handleSave`) and Publish (`handlePublish`) are distinct operations with distinct DB calls — draft save never updates projection records.
25. The profile save button is gold and active when there are unsaved changes; dimmed when the builder state matches the last saved state.
26. A successful Publish action updates the `visibility_mappings` record atomically, then triggers a View Profile Surface projection refresh — no partial states.
27. View Profile Surface renders exclusively from saved, explicitly shared projection records — it never reads live Edit ProfileDream builder state directly.
28. `/profile/[handle]` public route applies the same `visibility_mappings` enforcement as `/view-profile` — the two surfaces share the same projection read path.
29. Profile projection failure defaults to rendering nothing and logging the ambiguity — privacy-safe failure is enforced, not silent exposure.
30. Edit ProfileDream Surface projection boundaries are reflected in UI copy — "Save Draft" and "Publish" are the only save-path labels; no other label implies publication.

---

## Section D — DreamDM Surface: Real Persistence & Real-Time

**Points 31–38**

31. DreamDM messages persist through Supabase Realtime — messages stored to the `messages` table on send, read from the database on mount, delivered in order.
32. Per-conversation RLS policies enforce that only conversation participants can read or write message records for that conversation.
33. DreamDM conversation list loads from real database records on mount — no static or demo conversations remain.
34. DreamDM compose flow from Dr. Eams in HomeDream routes into a real DreamDM conversation — the message lands in the database as a real record.
35. DreamDM Bar drag gesture correctly resizes both runtime regions in real time — the divider is functional, not cosmetic.
36. DreamDM Bar in compose state correctly saves draft content to local state and restores it if the user scrolls away and returns without sending.
37. DreamDM new-message notifications appear in the notifications system as real system events — not static demo data.
38. DreamDM unread count reflects real database state — badge count is live and recalculates on new messages.

---

## Section E — DreamShop & DreamMarketplace: Real Listings

**Points 39–46**

39. DreamShop real listing capability — items stored, retrieved, and displayed from the database; no static or mock items remain on the live surface.
40. DreamShop item create flow saves to the database and returns the new item in the listing on reload.
41. DreamShop order history is private by default — owner-only reads enforced by RLS; no order data visible to non-owners.
42. DreamMarketplace real listing capability — listings read from the database with RLS-guarded access; mock or stub listings fully replaced.
43. DreamMarketplace slot detail surface renders from a real database record — the navigation link from the marketplace listing resolves to real data.
44. DreamShop and DreamMarketplace listing data (public listings) is accessible to authenticated users; owner's private notes, order history, and DreamAds configuration remain private.
45. DreamShop sell flow (`/shop/sell`) creates a real listing record in the database and confirms success with a real API response.
46. DreamMarketplace "Request" or contact flow routes to a real system action — no placeholder or empty handler remains.

---

## Section F — Daydream Surface Network: Deep Activation

**Points 47–58**

47. All 6 Daydream Surfaces render real, non-placeholder content — no dummy copy, no mock data, no "coming soon" states on the primary surface area.
48. All 6 Engin runtimes accept real user input and write output to real Supabase records in the `daydream_states` table.
49. Daydream workspace states persist — all 6 Daydreams restore to the user's last working state on session load; no silent work loss on navigation away.
50. Daydream Surface context is preserved on back-navigation — returning from an Engin runtime does not reset the Daydream Surface state.
51. Music Daydream Surface / StarMakerEngin — produces real playable or shareable output; user creative output is stored as a real database record.
52. Games Daydream Surface / GameEngin — at least one real game loop is playable (not a shell); game state persists across sessions for the logged-in user.
53. Lab Daydream Surface / LabEngin — accepts real user input and produces real stored output (experiment record, canvas state, or equivalent).
54. Code Daydream Surface / CodeEngin — editor state persists to the database; code output can be saved and restored.
55. Brand Daydream Surface / BrandingEngin — brand kit items (colors, fonts, assets) are stored as real database records per user.
56. Create Daydream Surface / ContentEngin — content draft created in this surface saves to the database and is retrievable on next session.
57. Multi-connection network model: at least one Daydream Surface demonstrates connecting to a secondary Engin beyond its primary (11 connection paths spec begins real implementation).
58. All 6 Daydream Surfaces accessible from DreamSpace second runtime with live routes — no tile in DreamSpace routes to a 404 or placeholder.

---

## Section G — Gold Button, Dual Runtime & Navigation Feel

**Points 59–68**

59. Gold Button left menu (six Daydream navigation) — all 6 tiles route to live, non-placeholder Daydream Surfaces.
60. Gold Button right menu (DreamMenu + Dr. Eams) — DreamMenu opens with real navigation items; Dr. Eams is active and context-aware.
61. Single-tap Gold opens the dual menu system; double-tap Gold refreshes HomeDream if already active or returns to HomeDream if not — per GOLD_BUTTON_DUAL_RUNTIME spec.
62. Gold Button attachment behavior fully spec-compliant — attaches to top of DreamDM Bar, screen-locks only when the bar is dragged far enough that the button would go off-screen.
63. Dual runtime state (top/bottom, dominant runtime) persists to localStorage and restores on reload — user returns to the same runtime configuration they left.
64. Navigation between surfaces feels like depth — no full-page reload, no context loss on standard transitions between HomeDream, Daydream, Engin, and module surfaces.
65. Returning from any surface restores prior surface to a valid, coherent state — no blank or reset surfaces on back-navigation where technically feasible.
66. Cross-runtime connection bus (`lib/runtime/dualRuntime.ts`) extended — at least one pair of compatible Engin runtimes can share live state across top and bottom runtime regions.
67. Runtime transitions have smooth animation — no jarring cuts between dominant runtime changes; transition respects DreamDM Bar drag velocity.
68. DreamSpace (bottom runtime default) renders real Dream Windows browsable by the user — not a placeholder shell.

---

## Section H — AI Triad: Consensus, Real Results & Security

**Points 69–76**

69. AI Triad consensus gate implemented — unanimous triad approval required before any major system-level update recommendation is acted upon; `lib/agents/agentBus.ts` is the sole cross-agent channel.
70. Dr. Eams navigation suggestion results are real — all platform location suggestions resolve to real canonical routes with verified existence.
71. Dr. Eams content results are real — platform content queries hit real Supabase data, filtered by the authenticated user's visibility permissions.
72. TheBoogieMan.Ai enforces "nothing public by default" at the API layer — any request that would expose private data without an explicit `visibility_mappings` record is rejected and logged.
73. IDARi remains admin-only — no IDARi endpoint is reachable from any user-accessible UI path; admin-guard enforced in all environments including dev-bypass mode.
74. All three AI routes (`/api/ai/eams`, `/api/ai/idari`, `/api/ai/boogieman`) are server-side only — confirmed that no API key is included in the client bundle or any `NEXT_PUBLIC_` variable.
75. AI rate-limit system fully unified — `check_ai_rate_limit` RPC and `ai_rate_limits` table are the sole rate-limit mechanism; no legacy `rate_limit_hit` or `rate_limit_counters` references remain in active code.
76. Legacy Dr. Eams routes (`/api/dr-eams/run`, `/api/dr-eams/hf`) preserved as passive support routes only — no new code references them as primary integration targets.

---

## Section I — Data Integrity, RLS & Settings

**Points 77–88**

77. Full Supabase RLS audit complete — every table containing user-generated content has Row Level Security enabled; no table relies solely on application-layer checks.
78. `connector_accounts.token_blob` is never returned to the browser — confirmed across all connector API routes.
79. `SUPABASE_SERVICE_ROLE_KEY` confirmed absent from all client-bundle files, components, and `NEXT_PUBLIC_` environment variables.
80. All API routes that return user profile data check the authenticated session and reject unauthenticated requests before any database query executes.
81. Notifications system reflects real events — new DreamDM messages, new followers, new likes surface as real system events sourced from real database queries; no static demo entries remain.
82. Follower and following counts displayed anywhere in the runtime are sourced from real database records, not hardcoded or approximated values.
83. Settings surface — appearance settings (theme, palette preferences) save to the database and restore on session load.
84. Settings surface — privacy settings (default visibility for new Dream Windows, profile discoverability) save to the database and are enforced by the privacy layer.
85. Settings surface — Connectors management (connect, verify, sync, disconnect) works end-to-end for all Tier 1 connectors.
86. Settings surface — data export produces a real downloadable export of the authenticated user's data from Supabase.
87. Settings surface — account deletion flow removes all user data from Supabase (auth record, profile, Dream Windows, messages, connector accounts, feed items) as a single confirmed action.
88. All toggles and switches in Settings that modify user state persist through Supabase — no toggle changes only in-memory React state without a corresponding DB write.

---

## Section J — Phase 8 Acceptance Criteria

**Points 89–100**

89. Phase 8 is complete only when the HomeDream feed resolves entirely from real Supabase queries and connector feed data — no static or mock feed content remains.
90. Phase 8 is complete only when every Dream Window type has real data, real actions, real visibility enforcement, and real ownership at the data layer.
91. Phase 8 is complete only when all 6 Daydream Surfaces render real non-placeholder content and all 6 Engin runtimes accept real input and produce persisted output.
92. Phase 8 is complete only when the Daydream workspace state persists — no Daydream silently discards unsaved work.
93. Phase 8 is complete only when DreamShop and DreamMarketplace have real database-backed listing capability with RLS enforced.
94. Phase 8 is complete only when DreamDM messages persist through Supabase Realtime with per-conversation RLS.
95. Phase 8 is complete only when the full spatial navigation model (depth, context preservation, Gold Button, DreamDM Bar drag, dual runtime persistence) is functional end-to-end.
96. Phase 8 is complete only when Settings works end-to-end — appearance, privacy, connectors, data export, and account deletion all produce real system outcomes.
97. Phase 8 is complete only when the AI Triad consensus gate is implemented and all three agents operate with real persistence, real rate limiting, and zero API key exposure to the client.
98. Phase 8 is complete only when a full residual audit against `docs/GENERATION_LAW.md` returns zero open Behavior Residuals, zero open Privacy Residuals, zero open Projection Residuals, and zero new Architecture Residuals.
99. Phase 8 is complete only when `docs/BUGS.md` reflects zero open "Partly Done" and zero open "Needs Work" items generated by the update-bugs script.
100. Phase 8 is complete only when a new user can open the runtime, navigate the full environment without a tutorial, interact with real surfaces, produce and persist real work, and leave knowing their data is private by default — per `docs/BUGS.md §"What done looks like"`.

---

## Authority Reference

| Document | Role in Phase 8 |
|---|---|
| `README.md` | Master technical spec — surface structure, stack, system inventory |
| `docs/CONSTITUTION.md` | LOCKED — binding rules for every item in this phase |
| `docs/PRODUCT_DEFINITION.md` | LOCKED — what DREAMengin is; every item must fit inside this definition |
| `docs/GENERATION_LAW.md` | Binding AI build constraint — χ, residual classes, per-pass audit |
| `docs/NAMING_AUTHORITY.md` | LOCKED — canonical names; no drift permitted |
| `docs/ARCHITECTURE.md` | 4-layer model + canonical routes — architecture residuals caught here |
| `docs/THEME.md` | Token source of truth — token residuals caught here |
| `docs/SECURITY.md` | RLS and privacy model — privacy residuals caught here |
| `docs/BUGS.md` | Live residual log — must reach zero open items for phase completion |
| `docs/FEATURE_STATUS.md` | Base spec fidelity measurement — updated as items complete |
