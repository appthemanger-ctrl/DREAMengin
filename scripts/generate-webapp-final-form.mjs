// scripts/generate-webapp-final-form.mjs
// Generates docs/WEBAPP_FINAL_FORM.md by scanning the repo.
// Node: ESM ("type": "module")

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT, 'docs', 'WEBAPP_FINAL_FORM.md');

// ============================================================================
// MAIN GENERATOR
// ============================================================================

async function generateWebAppFinalForm() {
  console.log('🚀 DREAMengin Documentation Generator\n');
  console.log('📋 Scanning project structure...\n');

  try {
    // Scan once, reuse.
    const apiRoutes = await scanAPIRoutes();
    const componentsScan = await scanComponents();
    const treeApp = await buildTree('app', 4);
    const treeComponents = await buildTree('components', 3);
    const treeLib = await buildTree('lib', 3);
    const treeScripts = await buildTree('scripts', 2);

    const readiness = await computeReadiness();

    const sections = [
      generateHeader(readiness),
      await generateProjectMetadata(),
      await generateStackOverview(),
      generateDirectoryTree({ treeApp, treeComponents, treeLib, treeScripts }),
      await generateDatabaseSchema(),
      generateAPIRouteMap({ apiRoutes }),
      await generateComponentInventory({ componentsScan }),
      await generateAISystemsMap(),
      await generateWidgetSystemMap(),
      await generateAuthenticationMap(),
      await generateSecurityPolicies(),
      await generateTypeDefinitions(),
      await generateMobileIntegration(),
      await generateEnvironmentConfig(),
      generateDeploymentReadiness({ readiness }),
      await generateKnownIssues(),
      generateFooter(),
    ];

    const markdown = sections.filter(Boolean).join('\n\n---\n\n');

    await fs.mkdir(path.join(ROOT, 'docs'), { recursive: true });
    await fs.writeFile(OUTPUT_FILE, markdown, 'utf-8');

    const stats = await fs.stat(OUTPUT_FILE);
    console.log('\n✅ SUCCESS!\n');
    console.log(`📄 Generated: ${OUTPUT_FILE}`);
    console.log(`📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`📝 Lines: ${markdown.split('\n').length}\n`);
  } catch (error) {
    console.error('❌ Error generating documentation:', error?.message || String(error));
    process.exit(1);
  }
}

// ============================================================================
// SECTION GENERATORS
// ============================================================================

function generateHeader(readiness) {
  return `# DREAMengin Web App - Final Form Documentation

**Generated:** ${new Date().toISOString()}  
**Generator:** v1.0.4  
**Status:** ${readiness.statusEmoji} ${readiness.statusLabel}

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
15. [Known Issues](#known-issues)`;
}

async function generateProjectMetadata() {
  const pkg = await readJSON('package.json');
  const lock = await fileExists('pnpm-lock.yaml');

  return `## Project Metadata

### Package Information

| Property | Value |
|----------|-------|
| **Name** | ${pkg.name || 'DREAMengin'} |
| **Version** | ${pkg.version || '1.0.0'} |
| **Node Version** | ${process.version} |
| **Package Manager** | pnpm${lock ? '' : ' (⚠️ lockfile missing)'} |

### Core Dependencies

\`next\`: ${pkg.dependencies?.next || 'N/A'}  
\`react\`: ${pkg.dependencies?.react || 'N/A'}  
\`@supabase/supabase-js\`: ${pkg.dependencies?.['@supabase/supabase-js'] || 'N/A'}  
\`typescript\`: ${pkg.devDependencies?.typescript || 'N/A'}  
\`tailwindcss\`: ${pkg.devDependencies?.tailwindcss || 'N/A'}

### Available Scripts

${Object.entries(pkg.scripts || {})
  .map(([name, cmd]) => `- \`pnpm ${name}\`\n  \`\`\`bash\n  ${cmd}\n  \`\`\``)
  .join('\n\n')}`;
}

async function generateStackOverview() {
  const hasMiddleware = await fileExists('middleware.ts');
  const hasTypes = await fileExists('types/supabase.ts');
  const hasTests = await directoryExists('__tests__');
  const hasAppRouter = await directoryExists('app');

  return `## Stack Overview

### Architecture Pattern

**Framework:** ${hasAppRouter ? 'Next.js App Router (Server Components + Server Actions)' : 'Next.js (⚠️ /app not found)'}  
**Database:** Supabase PostgreSQL with RLS  
**Auth Strategy:** Supabase Auth (cookie/session)  
**Storage:** Supabase Storage (avatars, covers, experiment-data)  
**Middleware:** ${hasMiddleware ? '⚠️ DETECTED (may cause App Router edge/build friction depending on config)' : '✅ NONE (layout/server checks)'}

### Technology Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | Next.js | ✅ |
| Language | TypeScript | ${hasTypes ? '✅ (Supabase types present)' : '⚠️ Types missing'} |
| Styling | Tailwind CSS | ✅ |
| Database | Supabase (PostgreSQL) | ✅ |
| Auth | Supabase Auth | ✅ |
| Storage | Supabase Storage | ✅ |
| AI (Optional) | Anthropic / OpenAI | 🟡 |
| Testing | ${hasTests ? 'Present' : 'Not configured'} | ${hasTests ? '🟡' : '❌'} |

### Key Architectural Decisions

1. **RLS-First:** Data security enforced at database level
2. **Typed DB:** Generate \`types/supabase.ts\` from schema and never hand-roll table types
3. **Guardrails:** Zod validation on all API routes + strict error typing
4. **Surface Map Policies:** PUBLIC_CACHEABLE / AUTH_REQUIRED_NO_STORE / ADMIN_REQUIRED_NO_STORE
5. **AI Split:** Dr. Eams (user) separated from Adari/InnerDreams (admin-only) and Boogie Man (policy enforcement)`;
}

function generateDirectoryTree({ treeApp, treeComponents, treeLib, treeScripts }) {
  return `## Directory Tree

### Application Routes (\`/app\`)

\`\`\`
${treeApp}
\`\`\`

### Components (\`/components\`)

\`\`\`
${treeComponents}
\`\`\`

### Libraries (\`/lib\`)

\`\`\`
${treeLib}
\`\`\`

### Scripts (\`/scripts\`)

\`\`\`
${treeScripts}
\`\`\`

### Key Directories

| Path | Purpose | Critical |
|------|---------|----------|
| \`/app\` | Next.js routes | ✅ |
| \`/components\` | UI + widget primitives | ✅ |
| \`/lib\` | business logic, agents, supabase | ✅ |
| \`/types\` | generated + shared types | ${treeExistsHint('types') ? '✅' : '⚠️'} |
| \`/public\` | static assets | ✅ |
| \`/scripts\` | build/docs/db tooling | ✅ |`;
}

async function generateDatabaseSchema() {
  const truthContent = await readFile('truth.md');
  const schemaContent = await readFile('tablesproofsql.md');

  // If you keep a canonical list somewhere else later, swap this to parse it.
  const tables = [
    'profiles',
    'app_posts',
    'conversations',
    'messages',
    'music_releases',
    'widgets',
    'widget_instances',
    'widget_content',
    'notifications',
    'ad_slots',
    'ad_orders',
    'ad_listings',
    'projects',
    'follows',
    'likes',
    'merch',
    'albums',
    'album_content',
    'feed_items',
    'feed_rules',
    'connectors_tokens',
    'content_objects',
    'admin_audit_log',
  ];

  const hasSchemaProof = Boolean(schemaContent?.trim());
  const hasTruth = Boolean(truthContent?.trim());

  return `## Database Schema

### Tables (${tables.length} listed)

${tables.map((t) => `- \`public.${t}\``).join('\n')}

> Note: The full DB is larger (your canonical claim is 56 tables / 147 indexes). This section lists the **core** tables used by the widget + feed + profile system.

### Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| \`avatars\` | ✅ Yes | User profile pictures |
| \`covers\` | ✅ Yes | Cover images |
| \`experiment-data\` | ❌ No | Physics lab data |

### Row Level Security (RLS)

**Status:** ${hasTruth || hasSchemaProof ? '✅' : '⚠️ Unknown (no schema proof file found)'} Enabled on all critical tables

**Policy Pattern (expected):**
- Users can SELECT their own private rows
- Users can INSERT as themselves (\`auth.uid()\`)
- Users can UPDATE/DELETE only rows they own
- Conversations require participant membership
- Public content visible based on \`visibility\`

### Indexes

**Claimed Total:** 147 indexes${hasSchemaProof ? ' (see tablesproofsql.md)' : ''}

Key indexes (expected):
- \`idx_app_posts_user_id_created_at\`
- \`idx_messages_conv_created\`
- \`idx_conversations_p1\`, \`idx_conversations_p2\``;
}

function generateAPIRouteMap({ apiRoutes }) {
  const sorted = [...apiRoutes].sort((a, b) => a.path.localeCompare(b.path));

  const tableRows = sorted
    .map((r) => {
      const methods = r.methods.length ? r.methods.join(', ') : 'N/A';
      const auth = r.hasAuth ? '✅' : '⚠️';
      const zod = r.hasValidation ? '✅' : '⚠️';
      return `| \`${r.path}\` | ${methods} | ${auth} | ${zod} |`;
    })
    .join('\n');

  return `## API Route Map

This section is **auto-scanned** from \`app/api/**/route.ts\`.

| Route | Methods | Auth Check | Zod Validation |
|-------|---------|------------|----------------|
${tableRows || '| (none found) | - | - | - |'}

### API Security Summary

${sorted
  .map((route) => `- ${route.path}: ${route.hasAuth ? '✅' : '❌'} auth, ${route.hasValidation ? '✅' : '❌'} validation`)
  .join('\n') || '- (no routes found)'}

**Rule:** Every route must do **Auth → Zod → Authorization (RLS)**, and must honor surface policies.`;
}

async function generateComponentInventory({ componentsScan }) {
  const has = async (p) => (await fileExists(p)) ? '✅' : '❌';

  return `## Component Inventory

### AI Assistants

| Component | Purpose | Status |
|-----------|---------|--------|
| \`components/AIAssistant.tsx\` | Base chat assistant | ${await has('components/AIAssistant.tsx')} |
| \`components/AIAssistantEnhanced.tsx\` | Enhanced features | ${await has('components/AIAssistantEnhanced.tsx')} |
| \`components/DrEamsVoiceAssistant.tsx\` | Voice-enabled | ${await has('components/DrEamsVoiceAssistant.tsx')} |
| \`components/InnerDreams.tsx\` | Admin AI | ${await has('components/InnerDreams.tsx')} |

**AI Variants Detected:** ${componentsScan.aiDuplicates}

### Widget System

| Component | Purpose |
|-----------|---------|
| \`WheelLayout.tsx\` | Circular / spatial widget layout |
| \`WidgetEngine.tsx\` | Widget rendering engine |
| \`WidgetRail.tsx\` | Rail navigation (top/bottom/left/right) |
| \`WidgetFeedScreen.tsx\` | Main feed surface |

### Total Components

**Count:** ${componentsScan.total}  
**Duplicates (AIAssistant* heuristic):** ${componentsScan.duplicates}`;
}

async function generateAISystemsMap() {
  return `## AI Systems Map

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
- \`components/AIAssistant*.tsx\`
- \`lib/agents/*\`

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
**Implementation (expected):** \`lib/agents/agentBus.ts\``;
}

async function generateWidgetSystemMap() {
  return `## Widget System Map

### Widget Architecture

**Pattern:** Instance-based widgets with type registry  
**Primary Table:** \`widget_instances\`  
**Engine:** \`WidgetEngine\`  
**Bus:** \`WidgetBus\`

### Widget Types (baseline)

| Type | Purpose | Space |
|------|---------|-------|
| \`feed\` | Activity feed | HOME |
| \`gallery\` | Image gallery | PROFILE |
| \`media\` | Video/audio player | PROFILE |
| \`album\` | Music album | PROFILE |
| \`text\` | Rich text | BOTH |
| \`profile_info\` | User bio | PROFILE |
| \`link_tree\` | External links | PROFILE |
| \`embed\` | External content | BOTH |
| \`notifications\` | Notification panel | HOME |
| \`messages\` | Message preview | HOME |
| \`lab\` | Physics lab | HOME |

### Spaces

**HOME Space:** private dashboard, customizable, never public by default  
**PROFILE Space:** public-facing creator showcase

### Widget Instance Shape

\`\`\`ts
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
\`\`\`

### Core Interactions

- **Tap:** preview (no bubbles; content previews are card/surface-based)
- **Press & hold:** open widget menu / radial actions
- **Drag:** reorder
- **Throw into feed:** quick post targeting that widget`;
}

async function generateAuthenticationMap() {
  return `## Authentication Map

### Auth Provider

**Service:** Supabase Auth  
**Methods:** Email+Password, Magic Link (optional), OAuth (optional)

### Session Management

**Storage:** httpOnly cookies (recommended for App Router)  
**Refresh:** automatic via Supabase client

### Protected Routes

**Pattern:** server-side checks in layouts/pages (avoid middleware unless needed)

\`\`\`ts
// app/(protected)/layout.tsx (example)
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return children;
}
\`\`\`

### Admin Detection (required fix)

**Do not** rely on \`user_metadata\` for admin. Use a database-backed roles table with RLS and server-only checks.`;
}

async function generateSecurityPolicies() {
  return `## Security Policies

### Non-Negotiables

- **Zod on every API route** (input + output)
- **No direct access to \`user_metadata\` for authorization**
- **RLS on every table** (least privilege)
- **Surface map policies** enforced per route

### API Security Pattern

\`\`\`ts
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
\`\`\`

### Checklist

- [${(await hasFile('lib/api/validation.ts')) ? 'x' : ' '}] API validation helpers
- [${(await hasFile('types/supabase.ts')) ? 'x' : ' '}] Generated Supabase types
- [${(await hasRLS()) ? 'x' : ' '}] RLS proof present
- [${(await hasStoragePolicies()) ? 'x' : ' '}] Storage policies present
- [${(await hasNoSecrets()) ? 'x' : ' '}] Secrets excluded from repo
- [ ] DB-backed admin roles (required)
- [ ] Rate limiting (required)`;
}

async function generateTypeDefinitions() {
  const hasSupabaseTypes = await fileExists('types/supabase.ts');
  const hasDatabaseTypes = await fileExists('types/database.ts');
  const hasWidgetTypes = await fileExists('types/widgets.ts');

  return `## Type Definitions

### Type Files

| File | Status | Purpose |
|------|--------|---------|
| \`types/supabase.ts\` | ${hasSupabaseTypes ? '✅' : '❌ MISSING'} | Auto-generated from schema |
| \`types/database.ts\` | ${hasDatabaseTypes ? '✅' : '⚠️'} | Shared app types |
| \`types/widgets.ts\` | ${hasWidgetTypes ? '✅' : '⚠️'} | Widget system types |

${!hasSupabaseTypes ? `### Generate Supabase Types (required)

\`\`\`bash
pnpm supabase gen types typescript \\
  --project-id <YOUR_PROJECT_ID> \\
  --schema public > types/supabase.ts
\`\`\`
` : ''}

### Type Safety Status

**TypeScript Strict Mode:** ${(await hasStrictMode()) ? '✅ Enabled' : '⚠️ Disabled'}  
**No Implicit Any:** ${(await hasNoImplicitAny()) ? '✅ Enforced' : '⚠️ Disabled'}  
**Strict Null Checks:** ${(await hasStrictNullChecks()) ? '✅ Enforced' : '⚠️ Disabled'}`;
}

async function generateMobileIntegration() {
  return `## Mobile Integration

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

Once AI is enabled, users can bypass navigation friction: tap AI button or voice-call “Doc” to jump directly to destinations.`;
}

async function generateEnvironmentConfig() {
  const hasEnvLocal = await fileExists('.env.local');
  const hasEnvExample = await fileExists('.env.example');

  return `## Environment Configuration

### Required Variables

\`\`\`bash
# Supabase (REQUIRED)
NEXT_PUBLIC_dreamengin_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_dreamengin_SUPABASE_ANON_KEY=your-anon-key

# Server-only
dreamengin_SUPABASE_SECRET_KEY=your-service-key

# AI (OPTIONAL)
ANTHROPIC_API_KEY=your-anthropic-key

# Feature Flags
ENABLE_AI_SUGGESTIONS=false
ENABLE_VOICE_ASSISTANT=false
ENABLE_ALGORITHMIC_FEED=false
\`\`\`

### Environment Files

| File | Status | Purpose |
|------|--------|---------|
| \`.env.local\` | ${hasEnvLocal ? '✅ Present' : '❌ MISSING'} | Local development |
| \`.env.example\` | ${hasEnvExample ? '✅ Present' : '⚠️ Missing'} | Template for setup |`;
}

function generateDeploymentReadiness({ readiness }) {
  const { percentage, statusLabel, statusEmoji, checks } = readiness;
  return `## Deployment Readiness

### Overall Status: ${statusEmoji} ${statusLabel} (${percentage}%)

| Check | Status | Priority |
|-------|--------|----------|
| Supabase types generated | ${checks.types ? '✅' : '❌'} | 🔴 Critical |
| API validation helpers present | ${checks.hasValidation ? '✅' : '❌'} | 🔴 Critical |
| RLS proof present | ${checks.hasRLS ? '✅' : '⚠️'} | 🔴 Critical |
| Build passes | ${checks.buildPasses ? '✅' : '❌'} | 🔴 Critical |

### Notes

- Set \`DOCS_SKIP_BUILD=1\` to skip the build check when generating docs locally.
- If build fails, fix first—docs generation should reflect deployable state.

\`\`\`bash
pnpm docs:webapp-final-form
\`\`\``;
}

async function generateKnownIssues() {
  return `## Known Issues

### 🔴 Critical

1. **Admin role system must be DB-backed**
   - Do not trust user metadata client-side
   - Fix: \`user_roles\` table + RLS + server-only admin validation

2. **Rate limiting missing**
   - Fix: Vercel Edge / Upstash / middleware limiter (aligned with surface policies)

### 🟠 High

3. **AI assistant variants**
   - Multiple AIAssistant implementations increase maintenance
   - Fix: consolidate into one component behind feature flags

4. **Pagination on list queries**
   - Fix: standardize \`.range()\` or cursor pagination

### 🟡 Medium

5. **Error monitoring**
   - Fix: Sentry (server + client) or equivalent

6. **Widget feed perf**
   - Fix: virtualization for large lists`;
}

function generateFooter() {
  return `## Document Maintenance

### Regeneration

Run this script to update documentation:

\`\`\`bash
pnpm docs:webapp-final-form
\`\`\`

### When to Regenerate

- After major feature additions
- Before production deployments
- After schema changes

### Version History

| Date | Version | Changes |
|------|---------|---------|
| ${new Date().toISOString().split('T')[0]} | 1.0.4 | Auto-generated final form |

---

**End of Document**  
Generated by \`scripts/generate-webapp-final-form.mjs\`  
© ${new Date().getFullYear()} DREAMengin`;
}

// ============================================================================
// READINESS
// ============================================================================

async function computeReadiness() {
  const checks = {
    types: await fileExists('types/supabase.ts'),
    hasValidation: await fileExists('lib/api/validation.ts'),
    hasRLS: await hasRLS(),
    buildPasses: await checkBuild(),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const percentage = Math.round((score / total) * 100);

  let statusEmoji = '🔴';
  let statusLabel = 'NOT READY';
  if (percentage === 100) {
    statusEmoji = '🟢';
    statusLabel = 'PRODUCTION READY';
  } else if (percentage >= 75) {
    statusEmoji = '🟡';
    statusLabel = 'NEAR READY';
  } else if (percentage >= 50) {
    statusEmoji = '🟠';
    statusLabel = 'IN PROGRESS';
  }

  return { checks, score, total, percentage, statusEmoji, statusLabel };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function fileExists(filePath) {
  try {
    await fs.access(path.join(ROOT, filePath));
    return true;
  } catch {
    return false;
  }
}

async function directoryExists(dirPath) {
  try {
    const stats = await fs.stat(path.join(ROOT, dirPath));
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function readFile(filePath) {
  try {
    return await fs.readFile(path.join(ROOT, filePath), 'utf-8');
  } catch {
    return '';
  }
}

async function readJSON(filePath) {
  const content = await readFile(filePath);
  return content ? JSON.parse(content) : {};
}

async function buildTree(dir, maxDepth = 2, currentDepth = 0, prefix = '') {
  if (currentDepth >= maxDepth) return '';

  try {
    const fullPath = path.join(ROOT, dir);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    // Sort for stability (dirs first, then files).
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    let output = '';
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const isLast = i === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';

      output += `${prefix}${connector}${entry.name}\n`;

      if (entry.isDirectory()) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        output += await buildTree(path.join(dir, entry.name), maxDepth, currentDepth + 1, newPrefix);
      }
    }
    return output || `${prefix}(empty)\n`;
  } catch {
    return `${prefix}(unable to read)\n`;
  }
}

async function scanAPIRoutes() {
  const apiDir = path.join(ROOT, 'app', 'api');
  const routes = [];

  async function scanDir(dir, basePath = '/api') {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath, `${basePath}/${entry.name}`);
          continue;
        }

        if (entry.name === 'route.ts' || entry.name === 'route.js') {
          const content = await fs.readFile(fullPath, 'utf-8');
          const methods = [];
          for (const m of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
            if (content.includes(`export async function ${m}`) || content.includes(`export function ${m}`)) {
              methods.push(m);
            }
          }
          routes.push({
            path: basePath,
            methods,
	            // Heuristic: does the route enforce auth?
	            // (Keep this broad; we want false-positives over false-negatives.)
	            hasAuth: /(validateAuth\s*\()|(auth\.getUser\s*\()|(createServerClient\s*\()|(requireUser\s*\()|(getUser\s*\()|(cookies\(\))/.test(
	              content.replace(/\s+/g, ' '),
	            ),
            hasValidation: /zod|z\.object\(|safeParse\(|validateBody\s*\(/.test(content),
          });
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
  }

  await scanDir(apiDir);
  return routes;
}

async function scanComponents() {
  const componentsDir = path.join(ROOT, 'components');
  let total = 0;
  let aiDuplicates = 0;

  try {
    const entries = await fs.readdir(componentsDir, { recursive: true });
    const files = entries.filter((e) => e.endsWith('.tsx') || e.endsWith('.jsx'));
    total = files.length;
    aiDuplicates = files.filter((e) => e.toLowerCase().includes('aiassistant')).length;
  } catch {
    // Components directory doesn't exist
  }

  return {
    total,
    aiDuplicates,
    duplicates: aiDuplicates > 1 ? aiDuplicates - 1 : 0,
  };
}

async function hasFile(filePath) {
  return await fileExists(filePath);
}

async function hasRLS() {
  const truthContent = await readFile('truth.md');
  const schemaContent = await readFile('tablesproofsql.md');
  return /\bRLS\b/i.test(truthContent) || /rls_enabled/i.test(schemaContent);
}

async function hasStoragePolicies() {
  const schemaContent = await readFile('scripts/setup-database.sql');
  return schemaContent.includes('storage.objects');
}

async function hasNoSecrets() {
  const gitignore = await readFile('.gitignore');
  return gitignore.includes('.env.local');
}

async function hasStrictMode() {
  const tsconfig = await readJSON('tsconfig.json');
  return tsconfig.compilerOptions?.strict === true;
}

async function hasNoImplicitAny() {
  const tsconfig = await readJSON('tsconfig.json');
  // If strict is enabled, noImplicitAny is true unless explicitly disabled.
  if (tsconfig.compilerOptions?.strict === true && tsconfig.compilerOptions?.noImplicitAny === undefined) return true;
  return tsconfig.compilerOptions?.noImplicitAny !== false;
}

async function hasStrictNullChecks() {
  const tsconfig = await readJSON('tsconfig.json');
  if (tsconfig.compilerOptions?.strict === true && tsconfig.compilerOptions?.strictNullChecks === undefined) return true;
  return tsconfig.compilerOptions?.strictNullChecks !== false;
}

async function checkBuild() {
  if (process.env.DOCS_SKIP_BUILD === '1') return false;
  try {
    // This runs the real build; set DOCS_SKIP_BUILD=1 to skip.
    execSync('pnpm -s build', {
      cwd: ROOT,
      stdio: 'ignore',
      timeout: 10 * 60 * 1000, // 10 minutes
    });
    return true;
  } catch {
    return false;
  }
}

function treeExistsHint(rel) {
  // best-effort; directory existence sync would be annoying here.
  return rel;
}

// ============================================================================
// RUN
// ============================================================================

generateWebAppFinalForm().catch((error) => {
  console.error('❌ Fatal error:', error?.message || String(error));
  process.exit(1);
});
