# DREAMengin Repository State

> **Comprehensive analysis of the entire codebase**
> Generated automatically - DO NOT EDIT MANUALLY

**Last Updated:** 4/5/2026, 4:27:08 AM
**Branch:** completedream
**Commit:** 11c2b3f4 - docs: auto-update BUGS.md [dfb3676] [skip ci] [skip vercel]
**Total Commits:** 3314

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Repository Structure](#repository-structure)
4. [Code Metrics](#code-metrics)
5. [API Routes](#api-routes)
6. [Pages & Routes](#pages--routes)
7. [Components](#components)
8. [Database Schema](#database-schema)
9. [Tests](#tests)
10. [Documentation](#documentation)
11. [CI/CD Workflows](#cicd-workflows)
12. [Configuration Files](#configuration-files)
13. [Architecture Patterns](#architecture-patterns)
14. [Code Quality](#code-quality)
15. [Dependency Health](#dependency-health)
16. [Redundancies & Technical Debt](#redundancies--technical-debt)
17. [2026 Standards Compliance](#2026-standards-compliance)
18. [Action Items](#action-items)

---

## Overview

**Project:** dreamengin
**Version:** 2.0.0
**Package Manager:** pnpm@10.30.0

**Quick Stats:**

- 📁 Total Code Files: 623
- 📝 Total Lines of Code: 149,184
- 📦 Size: 5.60 MB
- 🧪 Tests: 112 files, 106 passing
- 📄 API Routes: 81
- 🎨 Components: 36 categories
- 📖 Documentation: 48 files
- ⚙️ GitHub Actions: 52 workflows

## Tech Stack

### Core Dependencies

| Package | Version |
|---------|---------|
| next | ^16.1.0 |
| react | ^19.0.0 |
| react-dom | ^19.0.0 |
| typescript | ^5.5.0 |
| @supabase/supabase-js | ^2.97.0 |

### All Dependencies

**Production Dependencies:** 23
```
@babylonjs/core@^9.1.0
@babylonjs/havok@^1.3.12
@react-three/drei@^10.7.7
@react-three/fiber@^9.5.0
@supabase/ssr@^0.9.0
@supabase/supabase-js@^2.97.0
@tensorflow/tfjs@^4.22.0
@tensorflow/tfjs-backend-webgpu@^4.22.0
axios@^1.7.0
clsx@^2.1.1
framer-motion@^12.35.0
gsap@^3.14.2
lucide-react@^0.577.0
next@^16.1.0
react@^19.0.0
react-dom@^19.0.0
rss-parser@^3.13.0
swr@^2.4.1
tailwind-merge@^3.5.0
three@^0.167.0
... and 3 more
```

**Dev Dependencies:** 17
```
@tailwindcss/postcss@^4.2.2
@types/node@^24.0.0
@types/react@^19.0.0
@types/react-dnd@^3.0.2
@types/react-dom@^19.0.0
@types/three@^0.183.1
assemblyscript@^0.27.0
eslint@^9.0.0
eslint-config-next@^16.1.0
pixi-viewport@^6.0.3
pixi.js@^8.17.0
react-dnd@^16.0.1
react-dnd-html5-backend@^16.0.1
tailwindcss@^4.2.2
tailwindcss-animate@^1.0.7
typescript@^5.5.0
vitest@^4.0.18
```

## Repository Structure

### Directory Breakdown

| Directory | Total Files | File Types |
|-----------|-------------|------------|
| `app/` | 209 | .tsx(125), .ts(82), .css(2) |
| `components/` | 284 | .tsx(258), .ts(23), .css(2) |
| `lib/` | 242 | .ts(237), .tsx(3), .md(2) |
| `tests/` | 114 | .ts(113), .md(1) |
| `styles/` | 3 | .css(3) |
| `public/` | 48 | .png(18), .PNG(11), .jpeg(6) |
| `docs/` | 44 | .md(44) |
| `scripts/` | 22 | .mjs(12), .sh(3), .cjs(3) |
| `supabase/` | 46 | .sql(45), .toml(1) |

## Code Metrics

### File Distribution

- **App Routes (TSX):** 125
- **Component Files:** 258
- **Library Files:** 240
- **Test Files:** 106

### Code Volume

- **Total Lines:** 149,184
- **Total Size:** 5.60 MB

## API Routes

**Total API Endpoints:** 81

### All Routes

| Path | Methods | File |
|------|---------|------|
| `/api/account/delete-data` | POST | /app/api/account/delete-data/route.ts |
| `/api/account/delete-dream` | POST | /app/api/account/delete-dream/route.ts |
| `/api/account/export-data` | GET | /app/api/account/export-data/route.ts |
| `/api/admin/ai-chat` | POST | /app/api/admin/ai-chat/route.ts |
| `/api/admin/ai-request` | POST | /app/api/admin/ai-request/route.ts |
| `/api/admin/child-safety` | GET, POST | /app/api/admin/child-safety/route.ts |
| `/api/admin/code-files` | POST | /app/api/admin/code-files/route.ts |
| `/api/admin/observability` | GET | /app/api/admin/observability/route.ts |
| `/api/ads/orders` | POST | /app/api/ads/orders/route.ts |
| `/api/ai/boogieman/child-safety` | POST | /app/api/ai/boogieman/child-safety/route.ts |
| `/api/ai/boogieman/privacy-event` | POST | /app/api/ai/boogieman/privacy-event/route.ts |
| `/api/ai/boogieman` | POST | /app/api/ai/boogieman/route.ts |
| `/api/ai/boogieman/status` | GET | /app/api/ai/boogieman/status/route.ts |
| `/api/ai/eams` | POST | /app/api/ai/eams/route.ts |
| `/api/ai/execute` | POST | /app/api/ai/execute/route.ts |
| `/api/ai/idari` | POST | /app/api/ai/idari/route.ts |
| `/api/analytics` | GET | /app/api/analytics/route.ts |
| `/api/appeal` | POST | /app/api/appeal/route.ts |
| `/api/auth/logout` | GET | /app/api/auth/logout/route.ts |
| `/api/auth/providers` | GET | /app/api/auth/providers/route.ts |
| `/api/blocks` | GET, POST, DELETE | /app/api/blocks/route.ts |
| `/api/close-friends` | GET, POST, DELETE | /app/api/close-friends/route.ts |
| `/api/comments` | GET, POST, DELETE | /app/api/comments/route.ts |
| `/api/connectors/[provider]/connect` | POST | /app/api/connectors/[provider]/connect/route.ts |
| `/api/connectors/[provider]/disconnect` | DELETE | /app/api/connectors/[provider]/disconnect/route.ts |
| `/api/connectors/[provider]/items` | GET | /app/api/connectors/[provider]/items/route.ts |
| `/api/connectors/[provider]/sync` | POST | /app/api/connectors/[provider]/sync/route.ts |
| `/api/connectors/[provider]/verify` | GET | /app/api/connectors/[provider]/verify/route.ts |
| `/api/connectors/instagram/oauth/callback` | GET | /app/api/connectors/instagram/oauth/callback/route.ts |
| `/api/connectors/instagram/oauth/start` | GET | /app/api/connectors/instagram/oauth/start/route.ts |
| `/api/connectors/status` | GET | /app/api/connectors/status/route.ts |
| `/api/connectors/youtube/oauth/callback` | GET | /app/api/connectors/youtube/oauth/callback/route.ts |
| `/api/connectors/youtube/oauth/start` | GET | /app/api/connectors/youtube/oauth/start/route.ts |
| `/api/content/intelligence` | POST | /app/api/content/intelligence/route.ts |
| `/api/dr-eams/hf` | POST | /app/api/dr-eams/hf/route.ts |
| `/api/dr-eams/run` | POST | /app/api/dr-eams/run/route.ts |
| `/api/drafts/[id]` | PATCH, DELETE | /app/api/drafts/[id]/route.ts |
| `/api/drafts` | GET, POST | /app/api/drafts/route.ts |
| `/api/dream-windows/[id]` | GET, PATCH, DELETE | /app/api/dream-windows/[id]/route.ts |
| `/api/dream-windows` | GET, POST | /app/api/dream-windows/route.ts |
| `/api/dreamr/feed` | GET | /app/api/dreamr/feed/route.ts |
| `/api/dreamr/suggested` | GET | /app/api/dreamr/suggested/route.ts |
| `/api/embed-feed` | GET | /app/api/embed-feed/route.ts |
| `/api/favorites` | GET, POST, DELETE | /app/api/favorites/route.ts |
| `/api/feed` | GET | /app/api/feed/route.ts |
| `/api/follow` | GET, POST, DELETE | /app/api/follow/route.ts |
| `/api/gal` | POST | /app/api/gal/route.ts |
| `/api/game-scores` | GET, POST | /app/api/game-scores/route.ts |
| `/api/home-layout` | GET, POST | /app/api/home-layout/route.ts |
| `/api/journey` | GET, POST | /app/api/journey/route.ts |
| ... | ... | ... and 31 more routes |

## Pages & Routes

**Total Pages:** 101

### All Pages

| Route | File |
|-------|------|
| `/about` | /app/about/page.tsx |
| `/admin` | /app/admin/page.tsx |
| `/ads/create` | /app/ads/create/page.tsx |
| `/ads` | /app/ads/page.tsx |
| `/ads/slot/[id]` | /app/ads/slot/[id]/page.tsx |
| `/analytics` | /app/analytics/page.tsx |
| `/auth/reset-password` | /app/auth/reset-password/page.tsx |
| `/codespace` | /app/codespace/page.tsx |
| `/connectors` | /app/connectors/page.tsx |
| `/daydream/analytics` | /app/daydream/analytics/page.tsx |
| `/daydream/brand/engin` | /app/daydream/brand/engin/page.tsx |
| `/daydream/brand` | /app/daydream/brand/page.tsx |
| `/daydream/code/engin` | /app/daydream/code/engin/page.tsx |
| `/daydream/code` | /app/daydream/code/page.tsx |
| `/daydream/constellation` | /app/daydream/constellation/page.tsx |
| `/daydream/create/engin` | /app/daydream/create/engin/page.tsx |
| `/daydream/create` | /app/daydream/create/page.tsx |
| `/daydream/forge` | /app/daydream/forge/page.tsx |
| `/daydream/game` | /app/daydream/game/page.tsx |
| `/daydream/games/engin` | /app/daydream/games/engin/page.tsx |
| `/daydream/games` | /app/daydream/games/page.tsx |
| `/daydream/lab/engin` | /app/daydream/lab/engin/page.tsx |
| `/daydream/lab` | /app/daydream/lab/page.tsx |
| `/daydream/lab/portfolio` | /app/daydream/lab/portfolio/page.tsx |
| `/daydream/media-vault` | /app/daydream/media-vault/page.tsx |
| `/daydream/music/engin` | /app/daydream/music/engin/page.tsx |
| `/daydream/music` | /app/daydream/music/page.tsx |
| `/daydream/play` | /app/daydream/play/page.tsx |
| `/discover` | /app/discover/page.tsx |
| `/dream-effects` | /app/dream-effects/page.tsx |
| `/dreamengin` | /app/dreamengin/page.tsx |
| `/edit-profile` | /app/edit-profile/page.tsx |
| `/edit-profiledream` | /app/edit-profiledream/page.tsx |
| `/engines/brand/analytics` | /app/engines/brand/analytics/page.tsx |
| `/engines/brand/campaigns` | /app/engines/brand/campaigns/page.tsx |
| `/engines/brand/identity` | /app/engines/brand/identity/page.tsx |
| `/engines/brand` | /app/engines/brand/page.tsx |
| `/engines/code/ai` | /app/engines/code/ai/page.tsx |
| `/engines/code/notebook` | /app/engines/code/notebook/page.tsx |
| `/engines/code` | /app/engines/code/page.tsx |
| `/engines/code/projects` | /app/engines/code/projects/page.tsx |
| `/engines/create/calendar` | /app/engines/create/calendar/page.tsx |
| `/engines/create/editor` | /app/engines/create/editor/page.tsx |
| `/engines/create` | /app/engines/create/page.tsx |
| `/engines/create/queue` | /app/engines/create/queue/page.tsx |
| `/engines/games/builder` | /app/engines/games/builder/page.tsx |
| `/engines/games/library` | /app/engines/games/library/page.tsx |
| `/engines/games` | /app/engines/games/page.tsx |
| `/engines/games/scores` | /app/engines/games/scores/page.tsx |
| `/engines/lab/data` | /app/engines/lab/data/page.tsx |
| ... | ... and 51 more pages |

## Components

**Total Component Categories:** 36

### Component Organization

| Category | File Count |
|----------|-----------|
| `auth/` | 1 |
| `connectors/` | 6 |
| `controls/` | 1 |
| `core/` | 1 |
| `customize/` | 7 |
| `daydream/` | 18 |
| `dreamengin/` | 18 |
| `dreamnav/` | 2 |
| `dreamr/` | 5 |
| `dreams/` | 7 |
| `engines/` | 35 |
| `feed/` | 5 |
| `feeds/` | 1 |
| `forge/` | 1 |
| `gameengin/` | 1 |
| `games/` | 43 |
| `home/` | 9 |
| `landing/` | 2 |
| `marketplace/` | 2 |
| `menus/` | 5 |
| `messaging/` | 2 |
| `music/` | 1 |
| `onboarding/` | 1 |
| `optimizer/` | 1 |
| `panels/` | 14 |
| `profile/` | 4 |
| `providers/` | 2 |
| `runtime/` | 3 |
| `shaders/` | 4 |
| `spatial/` | 5 |
| `three/` | 2 |
| `ui/` | 7 |
| `universe/` | 6 |
| `warp/` | 1 |
| `webgpu/` | 4 |
| `widgets/` | 12 |

## Database Schema

**Total Migrations:** 43
**Schema File:** ✓ Present

### Migration History

| Migration File |
|----------------|
| 20260324000000_phase8e_orders.sql |
| 20260324000001_phase8e_shop_marketplace.sql |
| 20260325000000_phase8f_daydream_network.sql |
| 20260325100000_child_safety.sql |
| 20260401000001_platform_utilities.sql |
| 20260402000001_control_mappings.sql |
| 20260402000002_game_assets.sql |
| 20260403000001_pgvector_embeddings.sql |
| 20260403000002_pgvector_search_rpc.sql |
| 20260405000001_dreamr_feed_registry.sql |
| ... and 33 earlier migrations |

## Tests

**Test Files:** 112
**Tests Passing:** 106
**Tests Failing:** 0

### Test Files

- /tests/admin-lockout.test.ts
- /tests/admin-upgrade-readiness.test.ts
- /tests/ai-edit-engine.test.ts
- /tests/analytics-scheduled.test.ts
- /tests/asset-optimizer.test.ts
- /tests/auth-providers-route.test.ts
- /tests/authenticated-ui-shells.test.ts
- /tests/babylon-optimizero.test.ts
- /tests/babylon-webgpu-engine.test.ts
- /tests/boogie-policy-module.test.ts
- /tests/boogieman.test.ts
- /tests/branding-logos.test.ts
- /tests/child-safety.test.ts
- /tests/conform-memory-map.test.ts
- /tests/connectors.test.ts
- /tests/content-intelligence-routes.test.ts
- /tests/creative-optimizero.test.ts
- /tests/daydream-engin-routes.test.ts
- /tests/dev-bypass.test.ts
- /tests/diff-viewer.test.ts
- ... and 92 more test files

## Documentation

**Total Documentation Files:** 48

### Documentation Files

- [README.md](/README.md)
- [CHANGELOG.md](/CHANGELOG.md)
- [LICENSE](/LICENSE)
- [IMPLEMENTATION_NOTES.md](/IMPLEMENTATION_NOTES.md)
- [ACTION_AUDIT.md](/docs/ACTION_AUDIT.md)
- [ACTIVITY_FIRST_PROTOCOL.md](/docs/ACTIVITY_FIRST_PROTOCOL.md)
- [ADD_WORKFLOW.md](/docs/ADD_WORKFLOW.md)
- [AGENT_PLAYBOOK.md](/docs/AGENT_PLAYBOOK.md)
- [ARCHITECTURE.md](/docs/ARCHITECTURE.md)
- [AUTH_SETUP.md](/docs/AUTH_SETUP.md)
- [AXIOMS.md](/docs/AXIOMS.md)
- [BOOGIEMAN_POLICY.md](/docs/BOOGIEMAN_POLICY.md)
- [BUGS.md](/docs/BUGS.md)
- [CHILD_SAFETY_POLICY.md](/docs/CHILD_SAFETY_POLICY.md)
- [CONNECTORS.md](/docs/CONNECTORS.md)
- [CONNECTOR_MATRIX.md](/docs/CONNECTOR_MATRIX.md)
- [CONSTITUTION.md](/docs/CONSTITUTION.md)
- [COPILOT_TOOLKIT.md](/docs/COPILOT_TOOLKIT.md)
- [DR_EAMS.md](/docs/DR_EAMS.md)
- [DUALSENSE_EXAMPLE.md](/docs/DUALSENSE_EXAMPLE.md)
- [DUALSENSE_INTEGRATION.md](/docs/DUALSENSE_INTEGRATION.md)
- [FEATURE_STATUS.md](/docs/FEATURE_STATUS.md)
- [GENERATION_LAW.md](/docs/GENERATION_LAW.md)
- [GITHUB_CODING_AGENT.md](/docs/GITHUB_CODING_AGENT.md)
- [GOLD_BUTTON_DUAL_RUNTIME.md](/docs/GOLD_BUTTON_DUAL_RUNTIME.md)
- [GOLD_BUTTON_QUICK_REF.md](/docs/GOLD_BUTTON_QUICK_REF.md)
- [HANDOFF.md](/docs/HANDOFF.md)
- [IDARI_CONTRACT.md](/docs/IDARI_CONTRACT.md)
- [LAW.md](/docs/LAW.md)
- [NAMING_AUTHORITY.md](/docs/NAMING_AUTHORITY.md)
- ... and 18 more docs

## CI/CD Workflows

**Total Workflows:** 52

### Workflow Files

- autofixvercelbuild.yml
- bouncer.yml
- check-build-memory-drift.yml
- daydream-brand-engin.yml
- daydream-brand.yml
- daydream-code-engin.yml
- daydream-code.yml
- daydream-create-engin.yml
- daydream-create.yml
- daydream-engin-build-cycle.yml
- daydream-engin-sicc-refinement.yml
- daydream-games-engin.yml
- daydream-games.yml
- daydream-lab-engin.yml
- daydream-lab.yml
- daydream-music-engin.yml
- daydream-music.yml
- db-extension-audit.yml
- db-extension-check.yml
- deploy-artifact.yml
- dreamengin-preflight.yml
- elite-gameengin-evolution.yml
- engin-branding.yml
- engin-code.yml
- engin-content.yml
- engin-game.yml
- engin-lab.yml
- engin-starmaker.yml
- exportrepo.yml
- game-engin-patrol.yml
- game-library-research.yml
- gameengin-ai-agent.yml
- games-library-ai-agent.yml
- garbageman.yml
- generatesupabasetypes.yml
- github-actions.yml
- idari-daily.yml
- optimize-dreamengin.yml
- portfolio-optimization.yml
- preflight.yml
- refreshlock.yml
- repo-snapshot.yml
- report-driven-coding-agent.yml
- spec-engin-ai-agent.yml
- sql-migration-guard.yml
- sync-build-memory.yml
- update-bugs.yml
- update-embed-feed.yml
- update-handoff.yml
- update-readme.yml
- update-repo-state.yml
- vercel-deploy.yml

## Configuration Files

**Total Configuration Files:** 11

### Config Files

- [package.json](/package.json)
- [tsconfig.json](/tsconfig.json)
- [next.config.mjs](/next.config.mjs)
- [tailwind.config.ts](/tailwind.config.ts)
- [eslint.config.mjs](/eslint.config.mjs)
- [vercel.json](/vercel.json)
- [docker-compose.yml](/docker-compose.yml)
- [Dockerfile](/Dockerfile)
- [.env.example](/.env.example)
- [vitest.config.ts](/vitest.config.ts)
- [playwright.config.ts](/playwright.config.ts)

## Architecture Patterns

### Next.js App Router Architecture

96 Server Components, 29 Client Components

### Supabase Backend

Using Supabase for database, auth, and storage

### React Context for State Management

4 context providers found

## Code Quality

### ✅ Positive Indicators

- TypeScript strict mode is enabled ✓
- ESLint is configured ✓
- Vitest is configured ✓
- Playwright E2E testing is configured ✓

## Dependency Health

### ✅ Up to Date

- TypeScript 5.5+ is good for 2026

## Redundancies & Technical Debt

### Duplicate component name

- /components/AnalyticsPanel.tsx
- /components/engines/brand/panels/AnalyticsPanel.tsx

### Duplicate component name

- /components/HomeSpace.tsx
- /components/spatial/HomeSpace.tsx

### Duplicate component name

- /components/ProfileSpace.tsx
- /components/spatial/ProfileSpace.tsx

### Duplicate component name

- /components/controls/HomeControls.tsx
- /components/dreamengin/HomeControls.tsx

### Potentially unused dependencies

- @babylonjs/havok
- @tensorflow/tfjs
- @tensorflow/tfjs-backend-webgpu
- axios
- swr
- yaml
- @tailwindcss/postcss
- @types/node
- @types/react
- @types/react-dnd
- @types/react-dom
- @types/three
- assemblyscript
- eslint
- eslint-config-next
- react-dnd-html5-backend
- tailwindcss
- tailwindcss-animate

## 2026 Standards Compliance

### Current Status

- ✅ React 19 - Latest version
- ✅ Next.js 16+ - Latest App Router
- ✅ TypeScript 5.5+ - Latest features
- ✅ Vitest - Modern testing framework
- ⚠️ Consider adding Playwright for E2E tests

## Action Items

### High Priority

✅ No high-priority action items!

### Medium Priority

- 🟡 Review and remove redundant code

### Low Priority

- 🟢 Continue monitoring dependency updates
- 🟢 Keep documentation in sync with code changes
- 🟢 Add more test coverage where needed

---

*This document is automatically generated by `scripts/analyze-repo-state.mjs`*
*Last updated: 4/5/2026, 4:27:08 AM*
