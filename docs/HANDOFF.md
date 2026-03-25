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
| **auto** | 2026-03-25 04:48 UTC | `71cecc5` | copilot/detect-child-predator | Copilot | +1 added  ~4 modified<br>feat(child-safety): real-time image scanning on upload endpoints — Wire scanMediaUrlsForChildSafety into POST /api/posts and POST /api/messages. Both endpoints now scan image attachments (SHA-256 hash check + LLM classifyImage) before writing to the DB. Graceful degradation: returns CLEAN when Groq is not configured or fetch fails — no false-positive blocking on transient errors.  New shared helper: lib/child-safety/scanMediaUrls.ts 11 new tests (1883 total passing)."  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com> Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/e90f33aa-7704-4a7e-a771-8f2687c020b0<br>➕: `lib/child-safety/scanMediaUrls.ts`<br>✏️: `app/api/messages/route.ts`, `app/api/posts/route.ts`, `components/ChildSafetyPanel.tsx`, `tests/child-safety.test.ts` |
| **auto** | 2026-03-25 03:18 UTC | `17b0ba7` | copilot/detect-child-predator | Copilot | +6 added  ~5 modified<br>feat(child-safety): zero-tolerance CSAM and predator detection via TheBoogieMan.Ai — Reasoning: Implements full child safety detection system per platform zero-tolerance policy. Adds grooming/predator behavior detection (C31_GROOMING) and CSAM signal detection (C22_CSAM) with hash-based matching. All content surfaces (posts, messages, comments) are scanned before persistence. Incidents are logged to DB and reported to NCMEC CyberTipline per 18 U.S.C. § 2258A.  Architecture justification: A9_PROTECT_MINORS rule — docs/ARCHITECTURE.md. New rule C31_GROOMING added to boogie-policy.ts as one-strike CRITICAL severity. Scanner uses boogieEnforce for enforcement decisions. Admin review queue + hash registry management added at /api/admin/child-safety.  Performance impact: Negligible — detector is synchronous pure regex + Set lookup, O(n) in pattern count (~20 patterns). NCMEC reporting is async and never blocks the content-submission response."  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com> Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/4dd985c3-9d0b-4f85-81b5-a1b6015ed173<br>➕: `app/api/admin/child-safety/route.ts`, `app/api/ai/boogieman/child-safety/route.ts`, `lib/child-safety/childSafetyDetector.ts`, `lib/child-safety/ncmecReporter.ts`, `supabase/migrations/20260325100000_child_safety.sql`, `tests/child-safety.test.ts`<br>✏️: `app/api/comments/route.ts`, `app/api/messages/route.ts`, `app/api/posts/route.ts`, `lib/ai/boogie-policy.ts`, `lib/policy/boogiePolicy.ts` |
| **auto** | 2026-03-24 18:15 UTC | `0ef6d74` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #296 from appthemanger-ctrl/copilot/update-readme-to-match-reality — docs: full widget → Dream Window terminology pass across README.md<br> |
| **auto** | 2026-03-24 18:08 UTC | `77c0a84` | copilot/update-readme-to-match-reality | Copilot | ~1 modified<br>docs: full widget→Dream Window terminology pass across README.md — Reasoning: every legacy 'widget' reference across §1–§29 of the spec body replaced with canonical 'Dream Window' per docs/LAW.md §4 and docs/AXIOMS.md OS-layer naming rules. Only the §15.1 canonical declaration that explains the retired terminology remains. Architecture justification: docs/LAW.md §4 — Dream Windows are the canonical modular runtime containers; docs/AXIOMS.md — cohesive naming must reinforce the same runtime structure. Performance impact: none (documentation only).  Co-authored-by: appthemanger-ctrl <253588904+appthemanger-ctrl@users.noreply.github.com> Agent-Logs-Url: https://github.com/appthemanger-ctrl/DREAMengin/sessions/c625605a-b28f-44fa-9e31-51cb7fe5869a<br>✏️: `README.md` |
| **auto** | 2026-03-24 13:05 UTC | `f99de58` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #292 from appthemanger-ctrl/copilot/fix-all-errors — fix: correct PBRMaterial property names — resolve 6 TypeScript build errors<br> |

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
