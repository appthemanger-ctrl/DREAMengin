# DREAMengin Web App - Final Form Documentation

**Generated:** 2026-02-08T19:35:02.780Z  
**Generator:** v1.0.4  
**Status:** 🔴 NOT READY

> This document represents the **complete architectural state** of DREAMengin.
> It is the single source of truth for deployment, onboarding, and system understanding.

## Table of Contents

1. [Project Metadata](#project-metadata)
2. [Stack Overview](#stack-overview)
3. [Directory Tree](#directory-tree)
4. [Database Schema](#database-schema)
5. [API Route Map](#api-route-map)
6. [Component Inventory](#component-inventory)
7. [AI Systems Map](#ai-systems-map)
8. [Widget System Map](#widget-system-map)
9. [Authentication Map](#authentication-map)
10. [Security Policies](#security-policies)
11. [Type Definitions](#type-definitions)
12. [Mobile Integration](#mobile-integration)
13. [Environment Config](#environment-configuration)
14. [Deployment Readiness](#deployment-readiness)
15. [Known Issues](#known-issues)

---

## Project Metadata

### Package Information

| Property | Value |
|----------|-------|
| **Name** | dreamengin |
| **Version** | 1.0.0 |
| **Node Version** | v22.16.0 |
| **Package Manager** | pnpm |

### Core Dependencies

`next`: 16.1.6  
`react`: ^19.0.0  
`@supabase/supabase-js`: ^2.45.0  
`typescript`: ^5.5.3  
`tailwindcss`: ^3.4.6

### Available Scripts

- `pnpm dev`
  ```bash
  next dev --turbopack
  ```

- `pnpm build`
  ```bash
  next build --webpack
  ```

- `pnpm vercel-build`
  ```bash
  NODE_OPTIONS=--max-old-space-size=4096 next build --webpack
  ```

- `pnpm start`
  ```bash
  next start
  ```

- `pnpm lint`
  ```bash
  echo ESLint disabled
  ```

- `pnpm test`
  ```bash
  playwright test
  ```

- `pnpm db:generate`
  ```bash
  npx supabase gen types typescript --local > types/supabase.ts
  ```

- `pnpm db:reset`
  ```bash
  npx supabase db reset
  ```

- `pnpm db:start`
  ```bash
  npx supabase start
  ```

- `pnpm db:stop`
  ```bash
  npx supabase stop
  ```

- `pnpm postbuild`
  ```bash
  node scripts/postbuild.js
  ```

- `pnpm typecheck`
  ```bash
  tsc --noEmit --pretty false
  ```

- `pnpm generate:docs`
  ```bash
  node scripts/generate-webapp-final-form.mjs
  ```

- `pnpm docs:webapp-final-form`
  ```bash
  node scripts/generate-webapp-final-form.mjs
  ```

---

## Stack Overview

### Architecture Pattern

**Framework:** Next.js App Router (Server Components + Server Actions)  
**Database:** Supabase PostgreSQL with RLS  
**Auth Strategy:** Supabase Auth (cookie/session)  
**Storage:** Supabase Storage (avatars, covers, experiment-data)  
**Middleware:** ✅ NONE (layout/server checks)

### Technology Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | Next.js | ✅ |
| Language | TypeScript | ✅ (Supabase types present) |
| Styling | Tailwind CSS | ✅ |
| Database | Supabase (PostgreSQL) | ✅ |
| Auth | Supabase Auth | ✅ |
| Storage | Supabase Storage | ✅ |
| AI (Optional) | Anthropic / OpenAI | 🟡 |
| Testing | Not configured | ❌ |

### Key Architectural Decisions

1. **RLS-First:** Data security enforced at database level
2. **Typed DB:** Generate `types/supabase.ts` from schema and never hand-roll table types
3. **Guardrails:** Zod validation on all API routes + strict error typing
4. **Surface Map Policies:** PUBLIC_CACHEABLE / AUTH_REQUIRED_NO_STORE / ADMIN_REQUIRED_NO_STORE
5. **AI Split:** Dr. Eams (user) separated from Adari/InnerDreams (admin-only) and Boogie Man (policy enforcement)

---

## Directory Tree

### Application Routes (`/app`)

```
├── about
│   └── page.tsx
├── admin
│   └── page.tsx
├── ads
│   ├── create
│   │   └── page.tsx
│   ├── slot
│   │   └── [id]
│   │       └── page.tsx
│   └── page.tsx
├── analytics
│   └── page.tsx
├── api
│   ├── admin
│   │   └── ai-request
│   │       └── route.ts
│   ├── auth
│   │   └── logout
│   │       └── route.ts
│   ├── dr-eams
│   │   └── run
│   │       └── route.ts
│   ├── follow
│   │   └── route.ts
│   ├── innerdreams
│   │   ├── check-bugs
│   │   │   └── route.ts
│   │   └── update
│   │       └── route.ts
│   ├── likes
│   │   └── route.ts
│   ├── messages
│   │   └── route.ts
│   ├── music
│   │   └── route.ts
│   ├── notifications
│   │   └── route.ts
│   ├── posts
│   │   └── route.ts
│   ├── profile
│   │   └── route.ts
│   ├── projects
│   │   └── route.ts
│   ├── setup
│   │   └── check
│   │       └── route.ts
│   └── shop
│       └── route.ts
├── auth
│   └── callback
│       └── route.ts
├── connectors
│   └── page.tsx
├── create
│   └── page.tsx
├── discover
│   └── page.tsx
├── edit-profile
│   └── page.tsx
├── feed-settings
│   └── page.tsx
├── home
│   └── page.tsx
├── join
│   └── page.tsx
├── lab
│   ├── [id]
│   │   └── page.tsx
│   ├── new
│   │   └── page.tsx
│   └── page.tsx
├── login
│   └── page.tsx
├── messages
│   └── page.tsx
├── music
│   ├── upload
│   │   └── page.tsx
│   └── page.tsx
├── physics-lab
│   └── page.tsx
├── profile
│   └── [handle]
│       └── page.tsx
├── settings
│   ├── account
│   │   └── page.tsx
│   ├── appearance
│   │   └── page.tsx
│   ├── notifications
│   │   └── page.tsx
│   ├── privacy
│   │   └── page.tsx
│   ├── security
│   │   └── page.tsx
│   └── page.tsx
├── shop
│   ├── sell
│   │   └── page.tsx
│   └── page.tsx
├── error.tsx
├── global-error.tsx
├── globals-enhanced.css
├── globals.css
├── layout.tsx
├── not-found.tsx
└── page.tsx

```

### Components (`/components`)

```
├── spatial
│   ├── HomeSpace.tsx
│   ├── ProfileSpace.tsx
│   └── SpatialShell.tsx
├── universe
│   ├── index.ts
│   ├── node-cluster.tsx
│   ├── star-field.tsx
│   ├── torus-core.tsx
│   ├── universe-card.tsx
│   └── universe-shell.tsx
├── v1-ui
│   ├── FeedArea.tsx
│   ├── README.md
│   ├── widget-feed-screen.css
│   ├── WidgetFeedScreen.tsx
│   ├── WidgetIcon.tsx
│   └── WidgetRail.tsx
├── AdvancedSearch.tsx
├── AIAssistant-voice-enhanced.tsx
├── AIAssistant.tsx
├── AIAssistant.tsx.backup
├── AIAssistantEnhanced.tsx
├── AnalyticsPanel.tsx
├── CollaborativeCanvas.tsx
├── CommandPalette.tsx
├── ContentScheduler.tsx
├── CreatePostModal.tsx
├── DashboardLayout-enhanced.tsx
├── DashboardLayout.tsx
├── DrEamsModeToggle.tsx
├── DrEamsVoiceAssistant.tsx
├── FeedCard-enhanced.tsx
├── FeedCard.tsx
├── FloatingActionBubble.tsx
├── HomeDashboard.tsx
├── HomeFeed.tsx
├── InnerDreams.tsx
├── InnerDreamsButton.tsx
├── LandingHero.tsx
├── LedgerChart.tsx
├── MessagesClient.tsx
├── MobileFeedCard.tsx
├── MobileFloatingActionButton.tsx
├── MobileNavBarEnhanced.tsx
├── NavBar-enhanced.tsx
├── NavBar.tsx
├── NotificationCenter.tsx
├── PhysicsLab.tsx
├── ProfileEditor.tsx
├── PullToRefresh.tsx
├── SkeletonLoaders.tsx
├── StarsBackground.tsx
├── ThemeToggle.tsx
├── ToastSystem.tsx
├── TopBar.tsx
├── WheelLayout.tsx
└── WidgetBubble.tsx

```

### Libraries (`/lib`)

```
├── agents
│   ├── agentBus.ts
│   ├── drEamsMode.ts
│   ├── teachBus.ts
│   └── uiActions.ts
├── ai
│   └── CIC.ts
├── connectors
│   ├── demo.ts
│   └── youtube.ts
├── supabase
│   ├── client.ts
│   └── server.ts
├── ui
│   └── theme.ts
├── widgets
│   ├── parse.ts
│   ├── parseConfig.ts
│   ├── useWidget.ts
│   ├── WidgetBus.ts
│   └── WidgetEngine.tsx
├── adari.ts
├── ledger-data.ts
└── utils.ts

```

### Scripts (`/scripts`)

```
├── deploy.sh
├── generate-webapp-final-form.mjs
├── postbuild.js
├── postbuild.ts
└── setup-database.sql

```

### Key Directories

| Path | Purpose | Critical |
|------|---------|----------|
| `/app` | Next.js routes | ✅ |
| `/components` | UI + widget primitives | ✅ |
| `/lib` | business logic, agents, supabase | ✅ |
| `/types` | generated + shared types | ✅ |
| `/public` | static assets | ✅ |
| `/scripts` | build/docs/db tooling | ✅ |

---

## Database Schema

### Tables (23 listed)

- `public.profiles`
- `public.app_posts`
- `public.conversations`
- `public.messages`
- `public.music_releases`
- `public.widgets`
- `public.widget_instances`
- `public.widget_content`
- `public.notifications`
- `public.ad_slots`
- `public.ad_orders`
- `public.ad_listings`
- `public.projects`
- `public.follows`
- `public.likes`
- `public.merch`
- `public.albums`
- `public.album_content`
- `public.feed_items`
- `public.feed_rules`
- `public.connectors_tokens`
- `public.content_objects`
- `public.admin_audit_log`

> Note: The full DB is larger (your canonical claim is 56 tables / 147 indexes). This section lists the **core** tables used by the widget + feed + profile system.

### Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `avatars` | ✅ Yes | User profile pictures |
| `covers` | ✅ Yes | Cover images |
| `experiment-data` | ❌ No | Physics lab data |

### Row Level Security (RLS)

**Status:** ⚠️ Unknown (no schema proof file found) Enabled on all critical tables

**Policy Pattern (expected):**
- Users can SELECT their own private rows
- Users can INSERT as themselves (`auth.uid()`)
- Users can UPDATE/DELETE only rows they own
- Conversations require participant membership
- Public content visible based on `visibility`

### Indexes

**Claimed Total:** 147 indexes

Key indexes (expected):
- `idx_app_posts_user_id_created_at`
- `idx_messages_conv_created`
- `idx_conversations_p1`, `idx_conversations_p2`

---

## API Route Map

This section is **auto-scanned** from `app/api/**/route.ts`.

| Route | Methods | Auth Check | Zod Validation |
|-------|---------|------------|----------------|
| `/api/admin/ai-request` | POST | ✅ | ⚠️ |
| `/api/auth/logout` | GET | ✅ | ⚠️ |
| `/api/dr-eams/run` | POST | ✅ | ⚠️ |
| `/api/follow` | GET, POST, DELETE | ✅ | ⚠️ |
| `/api/innerdreams/check-bugs` | POST | ✅ | ⚠️ |
| `/api/innerdreams/update` | POST | ✅ | ⚠️ |
| `/api/likes` | GET, POST, DELETE | ✅ | ⚠️ |
| `/api/messages` | GET, POST | ✅ | ⚠️ |
| `/api/music` | GET, POST, DELETE | ✅ | ⚠️ |
| `/api/notifications` | GET, PUT, DELETE | ✅ | ⚠️ |
| `/api/posts` | GET, POST | ✅ | ⚠️ |
| `/api/profile` | GET, PUT | ✅ | ⚠️ |
| `/api/projects` | GET, POST, PUT, DELETE | ✅ | ⚠️ |
| `/api/setup/check` | GET | ⚠️ | ⚠️ |
| `/api/shop` | GET, POST, PUT, DELETE | ✅ | ⚠️ |

### API Security Summary

- /api/admin/ai-request: ✅ auth, ❌ validation
- /api/auth/logout: ✅ auth, ❌ validation
- /api/dr-eams/run: ✅ auth, ❌ validation
- /api/follow: ✅ auth, ❌ validation
- /api/innerdreams/check-bugs: ✅ auth, ❌ validation
- /api/innerdreams/update: ✅ auth, ❌ validation
- /api/likes: ✅ auth, ❌ validation
- /api/messages: ✅ auth, ❌ validation
- /api/music: ✅ auth, ❌ validation
- /api/notifications: ✅ auth, ❌ validation
- /api/posts: ✅ auth, ❌ validation
- /api/profile: ✅ auth, ❌ validation
- /api/projects: ✅ auth, ❌ validation
- /api/setup/check: ❌ auth, ❌ validation
- /api/shop: ✅ auth, ❌ validation

**Rule:** Every route must do **Auth → Zod → Authorization (RLS)**, and must honor surface policies.

---

## Component Inventory

### AI Assistants

| Component | Purpose | Status |
|-----------|---------|--------|
| `components/AIAssistant.tsx` | Base chat assistant | ✅ |
| `components/AIAssistantEnhanced.tsx` | Enhanced features | ✅ |
| `components/DrEamsVoiceAssistant.tsx` | Voice-enabled | ✅ |
| `components/InnerDreams.tsx` | Admin AI | ✅ |

**AI Variants Detected:** 3

### Widget System

| Component | Purpose |
|-----------|---------|
| `WheelLayout.tsx` | Circular / spatial widget layout |
| `WidgetEngine.tsx` | Widget rendering engine |
| `WidgetRail.tsx` | Rail navigation (top/bottom/left/right) |
| `WidgetFeedScreen.tsx` | Main feed surface |

### Total Components

**Count:** 51  
**Duplicates (AIAssistant* heuristic):** 2

---

## AI Systems Map

### Dr. Eams (User AI Assistant)

**Purpose:** Conversational help + feature discovery + guided navigation  
**Access Level:** Authenticated users  
**Surface Policy:** AUTH_REQUIRED_NO_STORE

**Expected Capabilities:**
- Safe UI navigation
- Feature explanation
- Context-aware suggestions
- Post creation guidance

**Implementation (expected):**
- `components/AIAssistant*.tsx`
- `lib/agents/*`

### InnerDreams / Adari (Admin AI)

**Purpose:** system maintenance, bug detection, admin operations  
**Access Level:** Admins only  
**Surface Policy:** ADMIN_REQUIRED_NO_STORE

### Boogie Man (Policy Enforcement)

**Purpose:** policy guardrails + adversarial review  
**Access Level:** system-level  
**Status:** 🟡 planned / partial

### Agent Bus

**Purpose:** cross-agent events for UI + background jobs  
**Implementation (expected):** `lib/agents/agentBus.ts`

---

## Widget System Map

### Widget Architecture

**Pattern:** Instance-based widgets with type registry  
**Primary Table:** `widget_instances`  
**Engine:** `WidgetEngine`  
**Bus:** `WidgetBus`

### Widget Types (baseline)

| Type | Purpose | Space |
|------|---------|-------|
| `feed` | Activity feed | HOME |
| `gallery` | Image gallery | PROFILE |
| `media` | Video/audio player | PROFILE |
| `album` | Music album | PROFILE |
| `text` | Rich text | BOTH |
| `profile_info` | User bio | PROFILE |
| `link_tree` | External links | PROFILE |
| `embed` | External content | BOTH |
| `notifications` | Notification panel | HOME |
| `messages` | Message preview | HOME |
| `lab` | Physics lab | HOME |

### Spaces

**HOME Space:** private dashboard, customizable, never public by default  
**PROFILE Space:** public-facing creator showcase

### Widget Instance Shape

```ts
interface WidgetInstance {
  id: string;
  user_id: string;
  space: 'home' | 'profile';
  type: string;
  visibility: 'public' | 'followers' | 'private';
  order: number;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
```

### Core Interactions

- **Tap:** preview (no bubbles; content previews are card/surface-based)
- **Press & hold:** open widget menu / radial actions
- **Drag:** reorder
- **Throw into feed:** quick post targeting that widget

---

## Authentication Map

### Auth Provider

**Service:** Supabase Auth  
**Methods:** Email+Password, Magic Link (optional), OAuth (optional)

### Session Management

**Storage:** httpOnly cookies (recommended for App Router)  
**Refresh:** automatic via Supabase client

### Protected Routes

**Pattern:** server-side checks in layouts/pages (avoid middleware unless needed)

```ts
// app/(protected)/layout.tsx (example)
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return children;
}
```

### Admin Detection (required fix)

**Do not** rely on `user_metadata` for admin. Use a database-backed roles table with RLS and server-only checks.

---

## Security Policies

### Non-Negotiables

- **Zod on every API route** (input + output)
- **No direct access to `user_metadata` for authorization**
- **RLS on every table** (least privilege)
- **Surface map policies** enforced per route

### API Security Pattern

```ts
export async function POST(req: Request) {
  // 1) Auth
  const auth = await validateAuth(req);
  if (auth instanceof Response) return auth;

  // 2) Zod
  const json = await req.json();
  const parsed = MySchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  // 3) Authorization via RLS
  const { data, error } = await auth.supabase
    .from('some_table')
    .insert({ user_id: auth.user.id, ...parsed.data })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ data });
}
```

### Checklist

- [ ] API validation helpers
- [x] Generated Supabase types
- [ ] RLS proof present
- [ ] Storage policies present
- [x] Secrets excluded from repo
- [ ] DB-backed admin roles (required)
- [ ] Rate limiting (required)

---

## Type Definitions

### Type Files

| File | Status | Purpose |
|------|--------|---------|
| `types/supabase.ts` | ✅ | Auto-generated from schema |
| `types/database.ts` | ⚠️ | Shared app types |
| `types/widgets.ts` | ✅ | Widget system types |



### Type Safety Status

**TypeScript Strict Mode:** ✅ Enabled  
**No Implicit Any:** ✅ Enforced  
**Strict Null Checks:** ✅ Enforced

---

## Mobile Integration

This app is designed for **iOS-first usage** (Safari / Add-to-Home-Screen PWA style), with interaction patterns that feel native:

### iOS / PWA Baseline

- **Add to Home Screen:** provide manifest + icons
- **Safe-area aware layouts:** avoid clipping under notch / home indicator
- **Haptics:** use the Vibration API where supported (limited on iOS Safari); provide graceful fallback
- **No “chat bubbles” UI:** messages + previews render as **surfaces/cards** with clear hierarchy

### “Rails” Navigation Spec (Home)

**Goal:** 48 widgets available from Home, but only **8 visible at a time**.

**Behavior:**

1. **Home shows 8 widgets** (top rail). As you scroll the feed, a “new post” can appear from behind.
2. **Swipe left on bottom bar** (widgets/friends/etc):
   - Top widgets slide down/right into the bottom rail.
   - Bottom rail items slide up into the top rail.
3. **Swipe up** cycles the bottom rail up by one (repeat until you traverse all widgets).
4. **Zoom:**
   - Need Page 2 from Page 8? **zoom in**.
   - Need Page 4? **zoom out**.
5. **Universal “Go Home” gesture:** press down + hold until haptic, release → returns Home from anywhere except Home.
6. **Press & hold on Home logo** opens directional shortcuts:
   - up = Messages
   - down = Profile
   - left/right = switch rails / recents
   - tap = open “Home Dreams” (system dreams like Settings)
7. **Widget actions:**
   - tap = preview
   - press & hold = widget menu
   - drag = reorder
   - throw into feed = create a post targeted to that widget
8. **Feed actions:** press & hold feed → choose post type (message/photo/video/etc), then it becomes the “main dream” with share + edit.

### AI Shortcut

Once AI is enabled, users can bypass navigation friction: tap AI button or voice-call “Doc” to jump directly to destinations.

---

## Environment Configuration

### Required Variables

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# AI (OPTIONAL)
ANTHROPIC_API_KEY=your-anthropic-key

# Feature Flags
ENABLE_AI_SUGGESTIONS=false
ENABLE_VOICE_ASSISTANT=false
ENABLE_ALGORITHMIC_FEED=false
```

### Environment Files

| File | Status | Purpose |
|------|--------|---------|
| `.env.local` | ❌ MISSING | Local development |
| `.env.example` | ⚠️ Missing | Template for setup |

---

## Deployment Readiness

### Overall Status: 🔴 NOT READY (25%)

| Check | Status | Priority |
|-------|--------|----------|
| Supabase types generated | ✅ | 🔴 Critical |
| API validation helpers present | ❌ | 🔴 Critical |
| RLS proof present | ⚠️ | 🔴 Critical |
| Build passes | ❌ | 🔴 Critical |

### Notes

- Set `DOCS_SKIP_BUILD=1` to skip the build check when generating docs locally.
- If build fails, fix first—docs generation should reflect deployable state.

```bash
pnpm docs:webapp-final-form
```

---

## Known Issues

### 🔴 Critical

1. **Admin role system must be DB-backed**
   - Do not trust user metadata client-side
   - Fix: `user_roles` table + RLS + server-only admin validation

2. **Rate limiting missing**
   - Fix: Vercel Edge / Upstash / middleware limiter (aligned with surface policies)

### 🟠 High

3. **AI assistant variants**
   - Multiple AIAssistant implementations increase maintenance
   - Fix: consolidate into one component behind feature flags

4. **Pagination on list queries**
   - Fix: standardize `.range()` or cursor pagination

### 🟡 Medium

5. **Error monitoring**
   - Fix: Sentry (server + client) or equivalent

6. **Widget feed perf**
   - Fix: virtualization for large lists

---

## Document Maintenance

### Regeneration

Run this script to update documentation:

```bash
pnpm docs:webapp-final-form
```

### When to Regenerate

- After major feature additions
- Before production deployments
- After schema changes

### Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-08 | 1.0.4 | Auto-generated final form |

---

**End of Document**  
Generated by `scripts/generate-webapp-final-form.mjs`  
© 2026 DREAMengin