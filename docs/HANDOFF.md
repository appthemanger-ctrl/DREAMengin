# DREAMengin Handoff

Last updated: 2026-03-06

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
| **auto** | 2026-03-15 00:14 UTC | `897501c` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #199 from appthemanger-ctrl/copilot/build-memory-layer-repo — feat: Build Memory Layer — persistent repo snapshot with drift-check CI gate<br> |
| **auto** | 2026-03-14 19:03 UTC | `b2942c5` | copilot/migrate-to-one-rate-limit-system | appthemanger-ctrl | no file changes<br>Merge branch 'completedream' into copilot/migrate-to-one-rate-limit-system<br> |
| **auto** | 2026-03-14 06:45 UTC | `652502d` | copilot/run-every-agent-into-production | Copilot | ~62 modified<br>fix: resolve all TypeScript errors and remove ignoreBuildErrors — Reasoning: - Fixed 100+ TypeScript errors across API routes, components, lib/ modules - Added missing Supabase table types: admin_lock, ai_rate_limits, comments,   confirm_tokens, idempotency_keys, widget_events (extended), conversations   (id now optional), merch (title→name audit) - Added missing RPC types: check_ai_rate_limit, get_user_capabilities - Fixed Zod v4 z.record() calls (now require 2 args) in ai-system.ts, schemas.ts - Fixed RULE_CODES as const removal to allow string re-assignment in boogieman.ts   (cannot modify boogieman.ts per contract; fixed via boogie-policy.ts) - Fixed Web Speech API refs (unknown→any), voice assistant components - Fixed Framer Motion Variants type, CommandPalette icon type - Fixed optimisticMessage scope in MessagesClient.tsx - Fixed PointerEventCapture EventListener cast - Fixed mockWidgetData enum imports - Fixed parse.ts EmbedWidgetConfig/TextWidgetConfig optional fields - Fixed feed-resolver.ts with as-any casts for missing schema tables - Excluded tests/** and playwright.config.ts from tsconfig (playwright not installed) - Removed typescript.ignoreBuildErrors: true from next.config.mjs  Architecture justification: docs/ARCHITECTURE.md §10 render-on-demand; docs/IDARI_CONTRACT.md §CI/build-gate compliance required.  Performance impact: neutral (type-only changes, no runtime behavior altered)<br>✏️: `app/api/appeal/route.ts`, `app/api/innerdreams/check-bugs/route.ts`, `app/api/innerdreams/run/route.ts`, `app/api/messages/route.ts`, `app/api/music/route.ts`, `app/api/posts/route.ts`, `app/api/projects/route.ts`, `app/api/shop/route.ts`, `app/dream-effects/page.tsx`, `app/shop/page.tsx`, `components/AIAssistant-voice-enhanced.tsx`, `components/AIAssistant.tsx` … +50 more |
| **auto** | 2026-03-14 03:00 UTC | `e8696bd` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #192 from appthemanger-ctrl/copilot/remove-dreamnav-homepage — Remove DreamNav from homepage render path; wire WorkspaceDashboard directly to runtime<br> |
| **auto** | 2026-03-14 00:04 UTC | `6cbfea9` | completedream | appthemanger-ctrl | no file changes<br>Merge pull request #188 from appthemanger-ctrl/copilot/replace-landing-page-animation — Replace 2D canvas HeroSprite with Babylon.js procedural 3D Dr. Eams on landing page<br> |
