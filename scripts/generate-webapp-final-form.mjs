// scripts/generate-webapp-final-form.mjs
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT, 'docs', 'WEBAPP_FINAL_FORM.md');

/**
 * Main documentation generator
 */
async function generateWebAppFinalForm() {
  console.log('🚀 Generating WEBAPP_FINAL_FORM.md...\n');

  const sections = [
    generateHeader(),
    await generateProjectMetadata(),
    await generateStackOverview(),
    await generateDirectoryTree(),
    await generateDatabaseSchema(),
    await generateAPIRouteMap(),
    await generateComponentInventory(),
    await generateAISystemsMap(),
    await generateWidgetSystemMap(),
    await generateAuthenticationMap(),
    await generateSecurityPolicies(),
    await generateTypeDefinitions(),
    await generateEnvironmentConfig(),
    await generateDeploymentReadiness(),
    await generateKnownIssues(),
    generateFooter(),
  ];

  const markdown = sections.join('\n\n---\n\n');

  // Ensure docs directory exists
  await fs.mkdir(path.join(ROOT, 'docs'), { recursive: true });

  // Write file
  await fs.writeFile(OUTPUT_FILE, markdown, 'utf-8');

  const stats = await fs.stat(OUTPUT_FILE);
  console.log(`✅ Documentation generated: ${OUTPUT_FILE}`);
  console.log(`📄 Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`📊 Lines: ${markdown.split('\n').length}\n`);

  return markdown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function readJSON(relativePath) {
  try {
    const raw = await fs.readFile(path.join(ROOT, relativePath), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function fileExists(relativePath) {
  try {
    const stat = await fs.stat(path.join(ROOT, relativePath));
    return stat.isFile();
  } catch {
    return false;
  }
}

async function directoryExists(relativePath) {
  try {
    const stat = await fs.stat(path.join(ROOT, relativePath));
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function listFiles(dir, base = '') {
  const results = [];
  const fullDir = path.join(ROOT, dir);
  try {
    const entries = await fs.readdir(fullDir, { withFileTypes: true });
    for (const entry of entries) {
      const rel = path.join(base, entry.name);
      if (entry.isDirectory()) {
        results.push(...(await listFiles(path.join(dir, entry.name), rel)));
      } else {
        results.push(rel);
      }
    }
  } catch {
    // directory missing
  }
  return results;
}

async function readFileContent(relativePath) {
  try {
    return await fs.readFile(path.join(ROOT, relativePath), 'utf-8');
  } catch {
    return '';
  }
}

function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim();
    const sha = execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim();
    return { branch, sha };
  } catch {
    return { branch: 'unknown', sha: 'unknown' };
  }
}

// ─── Section Generators ──────────────────────────────────────────────────────

/**
 * Generate header
 */
function generateHeader() {
  const git = getGitInfo();
  return `# DREAMengin Web App - Final Form Documentation

**Generated:** ${new Date().toISOString()}  
**Generator Version:** 1.0.0  
**Branch:** ${git.branch}  
**Commit:** ${git.sha}  
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
- [Known Issues](#known-issues)`;
}

/**
 * Project metadata from package.json
 */
async function generateProjectMetadata() {
  const packageJson = await readJSON('package.json');
  const nextVersion = packageJson.dependencies?.next || 'N/A';
  const reactVersion = packageJson.dependencies?.react || 'N/A';

  return `## Project Metadata

### Package Information

| Property | Value |
|----------|-------|
| **Name** | ${packageJson.name || 'DREAMengin'} |
| **Version** | ${packageJson.version || 'N/A'} |
| **Node Version** | ${process.version} |
| **Next.js** | ${nextVersion} |
| **React** | ${reactVersion} |
| **Package Manager** | pnpm |

### Key Dependencies

\`\`\`json
${JSON.stringify({
    'next': nextVersion,
    'react': reactVersion,
    '@supabase/supabase-js': packageJson.dependencies?.['@supabase/supabase-js'] || 'N/A',
    'typescript': packageJson.devDependencies?.typescript || 'N/A',
    'tailwindcss': packageJson.devDependencies?.tailwindcss || 'N/A',
  }, null, 2)}
\`\`\`

### Scripts

${Object.entries(packageJson.scripts || {})
    .map(([name, script]) => `- \`pnpm ${name}\` → \`${script}\``)
    .join('\n')}`;
}

/**
 * Stack overview
 */
async function generateStackOverview() {
  const hasMiddleware = await fileExists('middleware.ts');
  const hasSupabase = await directoryExists('lib/supabase');
  const hasTests = await directoryExists('tests') || await directoryExists('__tests__');

  return `## Stack Overview

### Architecture

**Pattern:** Next.js App Router (SSR + RSC)  
**Database:** Supabase (PostgreSQL)  
**Auth:** Supabase Auth  
**Storage:** Supabase Storage  
**Middleware:** ${hasMiddleware ? '⚠️ PRESENT (may cause build issues)' : '✅ NONE (proxy pattern)'}  
**Deployment:** Vercel + GitHub Actions

### Technology Choices

| Layer | Technology | Status |
|-------|-----------|--------|
| **Frontend** | Next.js App Router | ✅ Active |
| **Language** | TypeScript | ✅ Active |
| **Styling** | Tailwind CSS | ✅ Active |
| **Database** | Supabase (PostgreSQL) | ${hasSupabase ? '✅ Connected' : '❌ Missing'} |
| **Auth** | Supabase Auth | ${hasSupabase ? '✅ Configured' : '❌ Missing'} |
| **Storage** | Supabase Storage | ${hasSupabase ? '✅ Configured' : '❌ Missing'} |
| **AI** | Anthropic Claude (optional) | 🟡 Optional |
| **Testing** | ${hasTests ? 'Playwright' : 'Not configured'} | ${hasTests ? '✅ Setup' : '❌ Missing'} |

### Critical Decisions

1. **No Middleware:** Proxy pattern avoids middleware build issues
2. **RLS First:** All database security via Supabase Row Level Security
3. **App Router:** Full RSC (React Server Components) architecture
4. **TypeScript Strict:** Type-safe codebase with strict mode`;
}

/**
 * Directory tree
 */
async function generateDirectoryTree() {
  const topLevel = await fs.readdir(ROOT, { withFileTypes: true });
  const ignore = new Set(['.git', 'node_modules', '.next', '.vercel', '.turbo']);

  const lines = ['## Directory Tree', '', '```'];
  for (const entry of topLevel.sort((a, b) => a.name.localeCompare(b.name))) {
    if (ignore.has(entry.name)) continue;
    const icon = entry.isDirectory() ? '📁' : '📄';
    lines.push(`${icon} ${entry.name}${entry.isDirectory() ? '/' : ''}`);
    if (entry.isDirectory()) {
      try {
        const children = await fs.readdir(path.join(ROOT, entry.name), { withFileTypes: true });
        for (const child of children.sort((a, b) => a.name.localeCompare(b.name))) {
          const cIcon = child.isDirectory() ? '📁' : '📄';
          lines.push(`  ${cIcon} ${child.name}`);
        }
      } catch {
        // skip
      }
    }
  }
  lines.push('```');

  return lines.join('\n');
}

/**
 * Database schema from migration files
 */
async function generateDatabaseSchema() {
  const migrationsDir = 'supabase/migrations';
  const migrations = await listFiles(migrationsDir);

  let schemaContent = '## Database Schema\n\n### Migrations\n\n';

  if (migrations.length === 0) {
    schemaContent += '_No migration files found._\n';
  } else {
    schemaContent += '| Migration | Description |\n|-----------|-------------|\n';
    for (const m of migrations.sort()) {
      const name = path.basename(m, '.sql');
      schemaContent += `| \`${m}\` | ${name.replace(/^\d+_/, '').replace(/_/g, ' ')} |\n`;
    }
  }

  // Read schema-final.sql if present
  const schemaFinal = await readFileContent('supabase/schema-final.sql');
  if (schemaFinal) {
    schemaContent += '\n### Schema Final (Tables)\n\n```sql\n';
    // Extract CREATE TABLE statements
    const tableMatches = schemaFinal.match(/CREATE TABLE[^;]+;/gi) || [];
    if (tableMatches.length > 0) {
      schemaContent += tableMatches.join('\n\n');
    } else {
      schemaContent += schemaFinal.slice(0, 2000);
    }
    schemaContent += '\n```';
  }

  // Read seed.sql summary
  const seedExists = await fileExists('supabase/seed.sql');
  if (seedExists) {
    schemaContent += '\n\n### Seed Data\n\n✅ `supabase/seed.sql` present for local development';
  }

  return schemaContent;
}

/**
 * API route map
 */
async function generateAPIRouteMap() {
  const apiFiles = await listFiles('app/api');

  let content = '## API Route Map\n\n';
  content += '| Route | File | Methods |\n|-------|------|--------|\n';

  for (const file of apiFiles.sort()) {
    if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;
    const routePath = '/api/' + path.dirname(file).replace(/\\/g, '/');
    const fileContent = await readFileContent(path.join('app/api', file));
    const methods = [];
    for (const m of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
      if (fileContent.includes(`export async function ${m}`) || fileContent.includes(`export function ${m}`)) {
        methods.push(m);
      }
    }
    content += `| \`${routePath}\` | \`${file}\` | ${methods.join(', ') || 'N/A'} |\n`;
  }

  return content;
}

/**
 * Component inventory
 */
async function generateComponentInventory() {
  const componentFiles = await listFiles('components');

  let content = '## Component Inventory\n\n';
  content += `**Total Components:** ${componentFiles.filter(f => f.endsWith('.tsx') || f.endsWith('.jsx')).length}\n\n`;
  content += '| Component | Path | Type |\n|-----------|------|------|\n';

  for (const file of componentFiles.sort()) {
    if (!file.endsWith('.tsx') && !file.endsWith('.jsx')) continue;
    if (file.endsWith('.backup')) continue;
    const name = path.basename(file, path.extname(file));
    let type = 'UI';
    if (name.toLowerCase().includes('ai') || name.toLowerCase().includes('voice')) type = 'AI';
    else if (name.toLowerCase().includes('nav') || name.toLowerCase().includes('layout') || name.toLowerCase().includes('topbar')) type = 'Layout';
    else if (name.toLowerCase().includes('mobile')) type = 'Mobile';
    else if (name.toLowerCase().includes('feed') || name.toLowerCase().includes('post')) type = 'Feed';
    else if (name.toLowerCase().includes('widget')) type = 'Widget';
    content += `| **${name}** | \`components/${file}\` | ${type} |\n`;
  }

  return content;
}

/**
 * AI systems map
 */
async function generateAISystemsMap() {
  const aiFiles = await listFiles('lib/ai');
  const agentFiles = await listFiles('lib/agents');

  let content = '## AI Systems Map\n\n';

  content += '### AI Library (`lib/ai/`)\n\n';
  if (aiFiles.length === 0) {
    content += '_No AI library files found._\n';
  } else {
    for (const file of aiFiles.sort()) {
      content += `- \`lib/ai/${file}\`\n`;
    }
  }

  content += '\n### Agent System (`lib/agents/`)\n\n';
  if (agentFiles.length === 0) {
    content += '_No agent files found._\n';
  } else {
    content += '| Agent Module | Purpose |\n|-------------|--------|\n';
    for (const file of agentFiles.sort()) {
      const name = path.basename(file, path.extname(file));
      const fileContent = await readFileContent(path.join('lib/agents', file));
      const firstComment = fileContent.match(/\/\*\*[\s\S]*?\*\//) || fileContent.match(/\/\/.*/);
      const purpose = firstComment ? firstComment[0].replace(/\/\*\*|\*\/|\/\/|\*/g, '').trim().slice(0, 80) : 'Agent module';
      content += `| \`${name}\` | ${purpose} |\n`;
    }
  }

  // AI Components
  const componentFiles = await listFiles('components');
  const aiComponents = componentFiles.filter(f =>
    (f.toLowerCase().includes('ai') || f.toLowerCase().includes('dream') || f.toLowerCase().includes('voice'))
    && (f.endsWith('.tsx') || f.endsWith('.jsx'))
  );
  if (aiComponents.length > 0) {
    content += '\n### AI Components\n\n';
    for (const c of aiComponents) {
      content += `- \`components/${c}\`\n`;
    }
  }

  return content;
}

/**
 * Widget system map
 */
async function generateWidgetSystemMap() {
  const widgetFiles = await listFiles('lib/widgets');

  let content = '## Widget System Map\n\n';

  if (widgetFiles.length === 0) {
    content += '_No widget system files found._\n';
    return content;
  }

  content += '### Core Modules (`lib/widgets/`)\n\n';
  content += '| Module | Purpose |\n|--------|--------|\n';
  for (const file of widgetFiles.sort()) {
    const name = path.basename(file, path.extname(file));
    content += `| \`${name}\` | Widget ${name.toLowerCase().includes('engine') ? 'rendering engine' : name.toLowerCase().includes('bus') ? 'event bus' : name.toLowerCase().includes('parse') ? 'config parser' : name.toLowerCase().includes('use') ? 'React hook' : 'module'} |\n`;
  }

  // Widget types
  const typeFiles = await listFiles('types');
  const widgetTypes = typeFiles.filter(f => f.toLowerCase().includes('widget'));
  if (widgetTypes.length > 0) {
    content += '\n### Widget Type Definitions\n\n';
    for (const t of widgetTypes) {
      content += `- \`types/${t}\`\n`;
    }
  }

  return content;
}

/**
 * Authentication map
 */
async function generateAuthenticationMap() {
  const hasAuthCallback = await fileExists('app/auth/callback/route.ts');
  const hasClientLib = await fileExists('lib/supabase/client.ts');
  const hasServerLib = await fileExists('lib/supabase/server.ts');

  let content = '## Authentication Map\n\n';
  content += '### Auth Flow\n\n';
  content += '```\n';
  content += 'User → Login Form → Supabase Auth → Callback → Session\n';
  content += '                                        ↓\n';
  content += '                              RLS-protected queries\n';
  content += '```\n\n';

  content += '### Auth Files\n\n';
  content += '| File | Purpose | Status |\n|------|---------|--------|\n';
  content += `| \`app/auth/callback/route.ts\` | OAuth callback handler | ${hasAuthCallback ? '✅' : '❌'} |\n`;
  content += `| \`lib/supabase/client.ts\` | Browser Supabase client | ${hasClientLib ? '✅' : '❌'} |\n`;
  content += `| \`lib/supabase/server.ts\` | Server Supabase client | ${hasServerLib ? '✅' : '❌'} |\n`;

  content += '\n### Auth Configuration\n\n';
  content += '- **Provider:** Supabase Auth (email-based)\n';
  content += '- **Session:** JWT with cookie management\n';
  content += '- **SSR:** Server-side auth via `@supabase/ssr`\n';
  content += '- **RLS:** Row Level Security on all tables';

  return content;
}

/**
 * Security policies
 */
async function generateSecurityPolicies() {
  const rlsMigration = await readFileContent('supabase/migrations/20240120000001_enable_rls.sql');
  const hasHorizonFirewall = await fileExists('docs/HORIZON_FIREWALL.md');

  let content = '## Security Policies\n\n';
  content += '### Row Level Security (RLS)\n\n';

  if (rlsMigration) {
    const tables = rlsMigration.match(/ALTER TABLE[^;]*ENABLE ROW LEVEL SECURITY/gi) || [];
    if (tables.length > 0) {
      content += `**RLS-Enabled Tables:** ${tables.length}\n\n`;
      content += '| Table | RLS |\n|-------|-----|\n';
      for (const t of tables) {
        const tableName = t.match(/ALTER TABLE\s+(?:IF EXISTS\s+)?(?:public\.)?(\w+)/i);
        if (tableName) {
          content += `| \`${tableName[1]}\` | ✅ Enabled |\n`;
        }
      }
    }
  } else {
    content += '_No RLS migration found._\n';
  }

  if (hasHorizonFirewall) {
    content += '\n### Security Documentation\n\n';
    content += '- 📄 `docs/HORIZON_FIREWALL.md` — Security policies and firewall rules';
  }

  return content;
}

/**
 * Type definitions
 */
async function generateTypeDefinitions() {
  const typeFiles = await listFiles('types');

  let content = '## Type Definitions\n\n';
  content += '### Type Files (`types/`)\n\n';

  if (typeFiles.length === 0) {
    content += '_No type definition files found._\n';
    return content;
  }

  content += '| File | Purpose |\n|------|--------|\n';
  for (const file of typeFiles.sort()) {
    const name = path.basename(file, path.extname(file));
    const fileContent = await readFileContent(path.join('types', file));
    const exportCount = (fileContent.match(/export\s+(type|interface|enum)/g) || []).length;
    content += `| \`types/${file}\` | ${exportCount} exported type(s) — ${name} |\n`;
  }

  return content;
}

/**
 * Environment config
 */
async function generateEnvironmentConfig() {
  let content = '## Environment Config\n\n';
  content += '### Required Variables\n\n';
  content += '| Variable | Required | Description |\n|----------|----------|-------------|\n';
  content += '| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |\n';
  content += '| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase public anon key |\n';
  content += '| `SUPABASE_SERVICE_ROLE_KEY` | 🟡 | Service role key (server-only) |\n';
  content += '| `SUPABASE_DB_URL` | 🟡 | Direct database connection |\n';
  content += '| `ANTHROPIC_API_KEY` | ⚪ | Claude AI (optional) |\n';

  content += '\n### Configuration Files\n\n';
  const configFiles = [
    'next.config.mjs',
    'tsconfig.json',
    'tailwind.config.ts',
    'postcss.config.mjs',
    'postcss.config.js',
    'vercel.json',
    'docker-compose.yml',
    'Dockerfile',
    'playwright.config.ts',
  ];

  content += '| File | Status |\n|------|--------|\n';
  for (const cf of configFiles) {
    const exists = await fileExists(cf);
    content += `| \`${cf}\` | ${exists ? '✅ Present' : '❌ Missing'} |\n`;
  }

  return content;
}

/**
 * Deployment readiness
 */
async function generateDeploymentReadiness() {
  const hasVercelJson = await fileExists('vercel.json');
  const hasDockerfile = await fileExists('Dockerfile');
  const hasDockerCompose = await fileExists('docker-compose.yml');
  const hasK8s = await directoryExists('kubernetes');
  const hasTerraform = await directoryExists('terraform');
  const hasGithubWorkflows = await directoryExists('.github/workflows');

  let content = '## Deployment Readiness\n\n';

  content += '### Deployment Targets\n\n';
  content += '| Target | Config | Status |\n|--------|--------|--------|\n';
  content += `| **Vercel** | \`vercel.json\` | ${hasVercelJson ? '✅ Ready' : '❌ Missing'} |\n`;
  content += `| **Docker** | \`Dockerfile\` | ${hasDockerfile ? '✅ Ready' : '❌ Missing'} |\n`;
  content += `| **Docker Compose** | \`docker-compose.yml\` | ${hasDockerCompose ? '✅ Ready' : '❌ Missing'} |\n`;
  content += `| **Kubernetes** | \`kubernetes/\` | ${hasK8s ? '✅ Ready' : '❌ Missing'} |\n`;
  content += `| **Terraform** | \`terraform/\` | ${hasTerraform ? '✅ Ready' : '❌ Missing'} |\n`;

  content += '\n### CI/CD\n\n';
  content += `- **GitHub Actions:** ${hasGithubWorkflows ? '✅ Configured' : '❌ Missing'}\n`;

  if (hasGithubWorkflows) {
    const workflows = await listFiles('.github/workflows');
    for (const w of workflows.sort()) {
      content += `  - \`${w}\`\n`;
    }
  }

  return content;
}

/**
 * Known issues
 */
async function generateKnownIssues() {
  const issues = [];

  // Check for middleware (known build issue)
  if (await fileExists('middleware.ts')) {
    issues.push('⚠️ `middleware.ts` present — may cause build issues with Next.js 16.x');
  }

  // Check for .gitignore
  if (!(await fileExists('.gitignore'))) {
    issues.push('⚠️ No `.gitignore` file found at project root');
  }

  // Check for .env.local
  if (!(await fileExists('.env.local'))) {
    issues.push('ℹ️ No `.env.local` file — environment variables must be set externally');
  }

  // Check for backup files
  const components = await listFiles('components');
  const backups = components.filter(f => f.includes('.backup'));
  if (backups.length > 0) {
    issues.push(`ℹ️ ${backups.length} backup file(s) in components/ — consider cleanup`);
  }

  let content = '## Known Issues\n\n';
  if (issues.length === 0) {
    content += '✅ No known issues detected.\n';
  } else {
    for (const issue of issues) {
      content += `- ${issue}\n`;
    }
  }

  return content;
}

/**
 * Footer
 */
function generateFooter() {
  return `## About This Document

This document was auto-generated by \`scripts/generate-webapp-final-form.mjs\`.

To regenerate:

\`\`\`bash
pnpm generate:docs
\`\`\`

**End of WEBAPP_FINAL_FORM.md**`;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

generateWebAppFinalForm().catch((err) => {
  console.error('❌ Generation failed:', err);
  process.exit(1);
});
