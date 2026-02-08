# DREAMengin Web App - Final Form Documentation

**Generated:** 2026-02-08T16:39:18.341Z  
**Generator Version:** 1.0.0  
**Branch:** copilot/add-webapp-final-form-script  
**Commit:** 360ab2a  
**Purpose:** Complete architectural state snapshot

> This document is the **single source of truth** for the DREAMengin web application.
> It represents the exact state of the codebase at generation time.

## Navigation

- [Project Metadata](#project-metadata)
- [Stack Overview](#stack-overview)
- [Directory Tree](#directory-tree)
- [Database Schema](#database-schema)
- [API Route Map](#api-route-map)
- [Component Inventory](#component-inventory)
- [AI Systems Map](#ai-systems-map)
- [Widget System Map](#widget-system-map)
- [Authentication Map](#authentication-map)
- [Security Policies](#security-policies)
- [Type Definitions](#type-definitions)
- [Environment Config](#environment-config)
- [Deployment Readiness](#deployment-readiness)
- [Known Issues](#known-issues)

---

## Project Metadata

### Package Information

| Property | Value |
|----------|-------|
| **Name** | dreamengin |
| **Version** | 1.0.0 |
| **Node Version** | v24.13.0 |
| **Next.js** | 16.1.6 |
| **React** | ^19.0.0 |
| **Package Manager** | pnpm |

### Key Dependencies

```json
{
  "next": "16.1.6",
  "react": "^19.0.0",
  "@supabase/supabase-js": "^2.45.0",
  "typescript": "^5.5.3",
  "tailwindcss": "^3.4.6"
}
```

### Scripts

- `pnpm dev` → `next dev --turbopack`
- `pnpm build` → `next build --webpack`
- `pnpm vercel-build` → `NODE_OPTIONS=--max-old-space-size=4096 next build --webpack`
- `pnpm start` → `next start`
- `pnpm lint` → `echo ESLint disabled`
- `pnpm test` → `playwright test`
- `pnpm db:generate` → `npx supabase gen types typescript --local > types/supabase.ts`
- `pnpm db:reset` → `npx supabase db reset`
- `pnpm db:start` → `npx supabase start`
- `pnpm db:stop` → `npx supabase stop`
- `pnpm postbuild` → `node scripts/postbuild.js`
- `pnpm typecheck` → `tsc --noEmit --pretty false`
- `pnpm generate:docs` → `node scripts/generate-webapp-final-form.mjs`

---

## Stack Overview

### Architecture

**Pattern:** Next.js App Router (SSR + RSC)  
**Database:** Supabase (PostgreSQL)  
**Auth:** Supabase Auth  
**Storage:** Supabase Storage  
**Middleware:** ✅ NONE (proxy pattern)  
**Deployment:** Vercel + GitHub Actions

### Technology Choices

| Layer | Technology | Status |
|-------|-----------|--------|
| **Frontend** | Next.js App Router | ✅ Active |
| **Language** | TypeScript | ✅ Active |
| **Styling** | Tailwind CSS | ✅ Active |
| **Database** | Supabase (PostgreSQL) | ✅ Connected |
| **Auth** | Supabase Auth | ✅ Configured |
| **Storage** | Supabase Storage | ✅ Configured |
| **AI** | Anthropic Claude (optional) | 🟡 Optional |
| **Testing** | Playwright | ✅ Setup |

### Critical Decisions

1. **No Middleware:** Proxy pattern avoids middleware build issues
2. **RLS First:** All database security via Supabase Row Level Security
3. **App Router:** Full RSC (React Server Components) architecture
4. **TypeScript Strict:** Type-safe codebase with strict mode

---

## Directory Tree

```
📁 .github/
  📁 workflows
📁 app/
  📁 about
  📁 admin
  📁 ads
  📁 analytics
  📁 api
  📁 auth
  📁 connectors
  📁 create
  📁 discover
  📁 edit-profile
  📄 error.tsx
  📁 feed-settings
  📄 global-error.tsx
  📄 globals-enhanced.css
  📄 globals.css
  📁 home
  📁 join
  📁 lab
  📄 layout.tsx
  📁 login
  📁 messages
  📁 music
  📄 not-found.tsx
  📄 page.tsx
  📁 physics-lab
  📁 profile
  📁 settings
  📁 shop
📄 CHANGELOG.md
📁 components/
  📄 AdvancedSearch.tsx
  📄 AIAssistant-voice-enhanced.tsx
  📄 AIAssistant.tsx
  📄 AIAssistant.tsx.backup
  📄 AIAssistantEnhanced.tsx
  📄 AnalyticsPanel.tsx
  📄 CollaborativeCanvas.tsx
  📄 CommandPalette.tsx
  📄 ContentScheduler.tsx
  📄 CreatePostModal.tsx
  📄 DashboardLayout-enhanced.tsx
  📄 DashboardLayout.tsx
  📄 DrEamsModeToggle.tsx
  📄 DrEamsVoiceAssistant.tsx
  📄 FeedCard-enhanced.tsx
  📄 FeedCard.tsx
  📄 FloatingActionBubble.tsx
  📄 HomeDashboard.tsx
  📄 InnerDreams.tsx
  📄 InnerDreamsButton.tsx
  📄 LandingHero.tsx
  📄 LedgerChart.tsx
  📄 MessagesClient.tsx
  📄 MobileFeedCard.tsx
  📄 MobileFloatingActionButton.tsx
  📄 MobileNavBarEnhanced.tsx
  📄 NavBar-enhanced.tsx
  📄 NavBar.tsx
  📄 NotificationCenter.tsx
  📄 PhysicsLab.tsx
  📄 ProfileEditor.tsx
  📄 PullToRefresh.tsx
  📄 SkeletonLoaders.tsx
  📁 spatial
  📄 StarsBackground.tsx
  📄 ThemeToggle.tsx
  📄 ToastSystem.tsx
  📄 TopBar.tsx
  📁 universe
  📁 v1-ui
  📄 WheelLayout.tsx
  📄 WidgetBubble.tsx
📄 COMPREHENSIVE_UPGRADE_GUIDE.md
📄 DEPLOYMENT_README.md
📄 docker-compose.yml
📄 Dockerfile
📄 Dockerfile.dev
📁 docs/
  📄 ADD_WORKFLOW.md
  📄 dreamengin-ux-spec.tex
  📄 HORIZON_FIREWALL.md
  📄 WEBAPP_FINAL_FORM.md
📁 dr-eams/
  📄 capabilities.yaml
  📄 tools.ts
📄 ENHANCEMENT_DOCUMENTATION.md
📄 ENHANCEMENT_SUMMARY.md
📄 EXECUTIVE_SUMMARY.md
📁 hooks/
  📄 use-spatial.ts
📄 INNERDREAMS_DOCUMENTATION.md
📄 INNERDREAMS_SUMMARY.md
📁 kubernetes/
  📄 deployment.yaml
📁 lib/
  📄 adari.ts
  📁 agents
  📁 ai
  📁 connectors
  📄 ledger-data.ts
  📁 supabase
  📁 ui
  📄 utils.ts
  📁 widgets
📄 LOGO_INTEGRATION.md
📄 MIGRATION_GUIDE.md
📄 MOBILE_INNOVATION_GUIDE.md
📄 next-env.d.ts
📄 next.config.mjs
📄 package.json
📄 playwright.config.ts
📄 pnpm-lock.yaml
📄 postcss.config.js
📄 postcss.config.mjs
📄 proxy.ts
📁 public/
  📄 apple-touch-icon.png
  📄 boogeyman-guardian.png
  📄 dr-eams-torus.jpeg
  📄 dr-eams.jpeg
  📄 favicon-16.png
  📄 favicon-32.png
  📄 favicon.ico
  📄 favicon.png
  📄 favicon.png.bak
  📄 hero.jpg
  📄 icon-192.png
  📄 icon-512.png
  📄 idari-banner.jpeg
  📁 images
  📄 logo-core.png
  📄 logo-dark.png
  📄 logo-icon.jpeg
  📄 logo-icon.png
  📄 logo-icon.png.bak
  📄 logo-small.png
  📄 logo-swirling.png
  📄 logo.png
  📄 logo.png.bak
  📄 manifest.json
  📁 videos
📄 README_ENHANCED.md
📄 README_QUICKSTART.md
📄 README.md
📁 scripts/
  📄 deploy.sh
  📄 generate-webapp-final-form.mjs
  📄 postbuild.js
  📄 postbuild.ts
  📄 setup-database.sql
📁 styles/
  📄 globals.css
  📄 theme.css
📁 supabase/
  📄 config.toml
  📁 migrations
  📄 schema-final.sql
  📄 seed.sql
📄 tailwind.config.ts
📄 tailwindcss-animate.d.ts
📁 terraform/
  📄 main.tf
📁 tests/
  📄 example.spec.ts
📄 tsconfig.json
📄 tsconfig.tsbuildinfo
📁 types/
  📄 ads.ts
  📄 spatial.ts
  📄 supabase.ts
  📄 widgetConfigs.ts
  📄 widgets.ts
📄 validate-deployment.js
📄 vercel.json
📄 VISUAL_SUMMARY.md
📁 workflows/
  📄 github-actions.yml
```

---

## Database Schema

### Migrations

| Migration | Description |
|-----------|-------------|
| `20240120000000_initial_schema.sql` | initial schema |
| `20240120000001_enable_rls.sql` | enable rls |
| `20260129000000_upgrade_schema.sql` | upgrade schema |

### Schema Final (Tables)

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Seed Data

✅ `supabase/seed.sql` present for local development

---

## API Route Map

| Route | File | Methods |
|-------|------|--------|
| `/api/admin/ai-request` | `admin/ai-request/route.ts` | POST |
| `/api/auth/logout` | `auth/logout/route.ts` | GET |
| `/api/dr-eams/run` | `dr-eams/run/route.ts` | POST |
| `/api/follow` | `follow/route.ts` | GET, POST, DELETE |
| `/api/innerdreams/check-bugs` | `innerdreams/check-bugs/route.ts` | POST |
| `/api/innerdreams/update` | `innerdreams/update/route.ts` | POST |
| `/api/likes` | `likes/route.ts` | GET, POST, DELETE |
| `/api/messages` | `messages/route.ts` | GET, POST |
| `/api/music` | `music/route.ts` | GET, POST, DELETE |
| `/api/notifications` | `notifications/route.ts` | GET, PUT, DELETE |
| `/api/posts` | `posts/route.ts` | GET, POST |
| `/api/profile` | `profile/route.ts` | GET, PUT |
| `/api/projects` | `projects/route.ts` | GET, POST, PUT, DELETE |
| `/api/setup/check` | `setup/check/route.ts` | GET |
| `/api/shop` | `shop/route.ts` | GET, POST, PUT, DELETE |


---

## Component Inventory

**Total Components:** 50

| Component | Path | Type |
|-----------|------|------|
| **AIAssistant-voice-enhanced** | `components/AIAssistant-voice-enhanced.tsx` | AI |
| **AIAssistant** | `components/AIAssistant.tsx` | AI |
| **AIAssistantEnhanced** | `components/AIAssistantEnhanced.tsx` | AI |
| **AdvancedSearch** | `components/AdvancedSearch.tsx` | UI |
| **AnalyticsPanel** | `components/AnalyticsPanel.tsx` | UI |
| **CollaborativeCanvas** | `components/CollaborativeCanvas.tsx` | UI |
| **CommandPalette** | `components/CommandPalette.tsx` | UI |
| **ContentScheduler** | `components/ContentScheduler.tsx` | UI |
| **CreatePostModal** | `components/CreatePostModal.tsx` | Feed |
| **DashboardLayout-enhanced** | `components/DashboardLayout-enhanced.tsx` | Layout |
| **DashboardLayout** | `components/DashboardLayout.tsx` | Layout |
| **DrEamsModeToggle** | `components/DrEamsModeToggle.tsx` | UI |
| **DrEamsVoiceAssistant** | `components/DrEamsVoiceAssistant.tsx` | AI |
| **FeedCard-enhanced** | `components/FeedCard-enhanced.tsx` | Feed |
| **FeedCard** | `components/FeedCard.tsx` | Feed |
| **FloatingActionBubble** | `components/FloatingActionBubble.tsx` | UI |
| **HomeDashboard** | `components/HomeDashboard.tsx` | UI |
| **InnerDreams** | `components/InnerDreams.tsx` | UI |
| **InnerDreamsButton** | `components/InnerDreamsButton.tsx` | UI |
| **LandingHero** | `components/LandingHero.tsx` | UI |
| **LedgerChart** | `components/LedgerChart.tsx` | UI |
| **MessagesClient** | `components/MessagesClient.tsx` | UI |
| **MobileFeedCard** | `components/MobileFeedCard.tsx` | Mobile |
| **MobileFloatingActionButton** | `components/MobileFloatingActionButton.tsx` | Mobile |
| **MobileNavBarEnhanced** | `components/MobileNavBarEnhanced.tsx` | Layout |
| **NavBar-enhanced** | `components/NavBar-enhanced.tsx` | Layout |
| **NavBar** | `components/NavBar.tsx` | Layout |
| **NotificationCenter** | `components/NotificationCenter.tsx` | UI |
| **PhysicsLab** | `components/PhysicsLab.tsx` | UI |
| **ProfileEditor** | `components/ProfileEditor.tsx` | UI |
| **PullToRefresh** | `components/PullToRefresh.tsx` | UI |
| **SkeletonLoaders** | `components/SkeletonLoaders.tsx` | UI |
| **StarsBackground** | `components/StarsBackground.tsx` | UI |
| **ThemeToggle** | `components/ThemeToggle.tsx` | UI |
| **ToastSystem** | `components/ToastSystem.tsx` | UI |
| **TopBar** | `components/TopBar.tsx` | Layout |
| **WheelLayout** | `components/WheelLayout.tsx` | Layout |
| **WidgetBubble** | `components/WidgetBubble.tsx` | Widget |
| **HomeSpace** | `components/spatial/HomeSpace.tsx` | UI |
| **ProfileSpace** | `components/spatial/ProfileSpace.tsx` | UI |
| **SpatialShell** | `components/spatial/SpatialShell.tsx` | UI |
| **node-cluster** | `components/universe/node-cluster.tsx` | UI |
| **star-field** | `components/universe/star-field.tsx` | UI |
| **torus-core** | `components/universe/torus-core.tsx` | UI |
| **universe-card** | `components/universe/universe-card.tsx` | UI |
| **universe-shell** | `components/universe/universe-shell.tsx` | UI |
| **FeedArea** | `components/v1-ui/FeedArea.tsx` | Feed |
| **WidgetFeedScreen** | `components/v1-ui/WidgetFeedScreen.tsx` | Feed |
| **WidgetIcon** | `components/v1-ui/WidgetIcon.tsx` | Widget |
| **WidgetRail** | `components/v1-ui/WidgetRail.tsx` | AI |


---

## AI Systems Map

### AI Library (`lib/ai/`)

- `lib/ai/CIC.ts`

### Agent System (`lib/agents/`)

| Agent Module | Purpose |
|-------------|--------|
| `agentBus` | AgentBus: lightweight client-side event bridge between Dr. Eams and InnerDreams. |
| `drEamsMode` | Client-side: stores whether Dr. Eams "full experience" (guided coaching + UI act |
| `teachBus` | Agent module |
| `uiActions` | Agent module |

### AI Components

- `components/AIAssistant-voice-enhanced.tsx`
- `components/AIAssistant.tsx`
- `components/AIAssistantEnhanced.tsx`
- `components/DrEamsModeToggle.tsx`
- `components/DrEamsVoiceAssistant.tsx`
- `components/InnerDreams.tsx`
- `components/InnerDreamsButton.tsx`
- `components/v1-ui/WidgetRail.tsx`


---

## Widget System Map

### Core Modules (`lib/widgets/`)

| Module | Purpose |
|--------|--------|
| `WidgetBus` | Widget event bus |
| `WidgetEngine` | Widget rendering engine |
| `parse` | Widget config parser |
| `parseConfig` | Widget config parser |
| `useWidget` | Widget React hook |

### Widget Type Definitions

- `types/widgetConfigs.ts`
- `types/widgets.ts`


---

## Authentication Map

### Auth Flow

```
User → Login Form → Supabase Auth → Callback → Session
                                        ↓
                              RLS-protected queries
```

### Auth Files

| File | Purpose | Status |
|------|---------|--------|
| `app/auth/callback/route.ts` | OAuth callback handler | ✅ |
| `lib/supabase/client.ts` | Browser Supabase client | ✅ |
| `lib/supabase/server.ts` | Server Supabase client | ✅ |

### Auth Configuration

- **Provider:** Supabase Auth (email-based)
- **Session:** JWT with cookie management
- **SSR:** Server-side auth via `@supabase/ssr`
- **RLS:** Row Level Security on all tables

---

## Security Policies

### Row Level Security (RLS)

**RLS-Enabled Tables:** 22

| Table | RLS |
|-------|-----|
| `profiles` | ✅ Enabled |
| `follows` | ✅ Enabled |
| `app_posts` | ✅ Enabled |
| `feed_items` | ✅ Enabled |
| `feed_rules` | ✅ Enabled |
| `widget_instances` | ✅ Enabled |
| `notifications` | ✅ Enabled |
| `ad_slots` | ✅ Enabled |
| `ad_listings` | ✅ Enabled |
| `ad_orders` | ✅ Enabled |
| `ad_creatives` | ✅ Enabled |
| `ad_events` | ✅ Enabled |
| `reports` | ✅ Enabled |
| `admin_audit_log` | ✅ Enabled |
| `projects` | ✅ Enabled |
| `notebooks` | ✅ Enabled |
| `attachments` | ✅ Enabled |
| `project_members` | ✅ Enabled |
| `merch` | ✅ Enabled |
| `music_releases` | ✅ Enabled |
| `settings` | ✅ Enabled |
| `connectors_tokens` | ✅ Enabled |

### Security Documentation

- 📄 `docs/HORIZON_FIREWALL.md` — Security policies and firewall rules

---

## Type Definitions

### Type Files (`types/`)

| File | Purpose |
|------|--------|
| `types/ads.ts` | 5 exported type(s) — ads |
| `types/spatial.ts` | 22 exported type(s) — spatial |
| `types/supabase.ts` | 7 exported type(s) — supabase |
| `types/widgetConfigs.ts` | 9 exported type(s) — widgetConfigs |
| `types/widgets.ts` | 4 exported type(s) — widgets |


---

## Environment Config

### Required Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 🟡 | Service role key (server-only) |
| `SUPABASE_DB_URL` | 🟡 | Direct database connection |
| `ANTHROPIC_API_KEY` | ⚪ | Claude AI (optional) |

### Configuration Files

| File | Status |
|------|--------|
| `next.config.mjs` | ✅ Present |
| `tsconfig.json` | ✅ Present |
| `tailwind.config.ts` | ✅ Present |
| `postcss.config.mjs` | ✅ Present |
| `postcss.config.js` | ✅ Present |
| `vercel.json` | ✅ Present |
| `docker-compose.yml` | ✅ Present |
| `Dockerfile` | ✅ Present |
| `playwright.config.ts` | ✅ Present |


---

## Deployment Readiness

### Deployment Targets

| Target | Config | Status |
|--------|--------|--------|
| **Vercel** | `vercel.json` | ✅ Ready |
| **Docker** | `Dockerfile` | ✅ Ready |
| **Docker Compose** | `docker-compose.yml` | ✅ Ready |
| **Kubernetes** | `kubernetes/` | ✅ Ready |
| **Terraform** | `terraform/` | ✅ Ready |

### CI/CD

- **GitHub Actions:** ✅ Configured
  - `deploy-artifact.yml`
  - `generatesupabasetypes.yml`


---

## Known Issues

- ⚠️ No `.gitignore` file found at project root
- ℹ️ No `.env.local` file — environment variables must be set externally
- ℹ️ 1 backup file(s) in components/ — consider cleanup


---

## About This Document

This document was auto-generated by `scripts/generate-webapp-final-form.mjs`.

To regenerate:

```bash
pnpm generate:docs
```

**End of WEBAPP_FINAL_FORM.md**