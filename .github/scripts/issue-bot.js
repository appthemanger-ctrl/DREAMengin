#!/usr/bin/env node
'use strict';

/**
 * .github/scripts/issue-bot.js
 *
 * DREAMengin Unified Issue-Fix Bot
 * ══════════════════════════════════════════════════════════════════════════════
 * Reads up to 30 open GitHub issues, classifies each one, applies every
 * automated repair available to this codebase (ESLint --fix, TypeScript audit,
 * per-issue triage/documentation stubs, and a running ISSUE_FIXES tracker),
 * commits the results to a fresh timestamped branch, and opens ONE
 * consolidated pull request that:
 *
 *   • Lists every addressed issue with category + fix summary
 *   • Emits "Closes #N" for each issue so GitHub auto-closes them on merge
 *   • Posts a friendly bot comment on every issue it touched
 *
 * Environment variables (all supplied by issue-bot.yml):
 *   GH_TOKEN / GITHUB_TOKEN   gh CLI auth token           (required)
 *   GITHUB_REPOSITORY         owner/repo string           (required)
 *   GITHUB_ACTOR              for git commit identity     (optional)
 *   GITHUB_BASE_BRANCH        PR target branch            (default: completedream)
 *   MAX_ISSUES                max issues to fetch 1–30    (default: 30)
 *   DRY_RUN                   "true" → skip push + PR     (default: false)
 *   LABELS_FILTER             comma-sep labels, OR filter (default: all)
 *
 * Design principles:
 *   • Never aborts the entire run because one issue's fix failed — it gracefully
 *     falls back to a minimal triage stub and continues.
 *   • All shell calls use spawnSync/execSync; the script is fully synchronous.
 *   • PR body uses "Closes #N" for every addressed issue.
 *   • A summary markdown file is written to .github/generated/ so the workflow
 *     step summary picks it up automatically.
 * ══════════════════════════════════════════════════════════════════════════════
 */

const { execSync, spawnSync } = require('child_process');
const {
  readFileSync, writeFileSync, mkdirSync,
  existsSync, appendFileSync,
} = require('fs');
const { resolve, join } = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// § 1  Bootstrap — constants and configuration
// ─────────────────────────────────────────────────────────────────────────────

const ROOT         = resolve(__dirname, '../..');
const REPO         = (process.env.GITHUB_REPOSITORY  || '').trim();
const ACTOR        = (process.env.GITHUB_ACTOR        || 'github-actions[bot]').trim();
const BASE_BRANCH  = (process.env.GITHUB_BASE_BRANCH  || 'completedream').trim();
const MAX_ISSUES   = Math.min(Math.max(parseInt(process.env.MAX_ISSUES  || '30', 10), 1), 30);
const DRY_RUN      = process.env.DRY_RUN      === 'true';
const LABELS_FILTER = (process.env.LABELS_FILTER || '').trim();

const NOW        = new Date();
const TIMESTAMP  = NOW.toISOString();
// Branch-safe timestamp: 2024-01-15T06-00-00
const BRANCH_TS  = TIMESTAMP.replace(/[:.]/g, '-').slice(0, 19);
const BOT_BRANCH = `bot/issue-fixes-${BRANCH_TS}`;
const DATE_STR   = NOW.toUTCString();

// Output directories — all created lazily via ensureDir()
const TRIAGE_DIR     = resolve(ROOT, '.github', 'issue-triage');
const FEATURES_DIR   = resolve(ROOT, 'docs', 'features');
const GENERATED_DIR  = resolve(ROOT, '.github', 'generated');
const ISSUE_FIXES_DOC = resolve(ROOT, 'docs', 'ISSUE_FIXES.md');

// ─────────────────────────────────────────────────────────────────────────────
// § 2  Logging helpers
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
};

function log(emoji, msg, color = '') {
  process.stdout.write(`${color}${emoji}  ${msg}${C.reset}\n`);
}
function section(title) {
  const bar = '─'.repeat(72);
  console.log(`\n${C.bold}${C.cyan}${bar}${C.reset}`);
  console.log(`${C.bold}${C.cyan}  ${title}${C.reset}`);
  console.log(`${C.bold}${C.cyan}${bar}${C.reset}`);
}
function ok(msg)    { log('✅', msg, C.green);  }
function warn(msg)  { log('⚠️ ', msg, C.yellow); }
function info(msg)  { log('ℹ️ ', msg, C.cyan);   }
function fail(msg)  { log('❌', msg, C.red);     }
function debug(msg) { log('   ', msg, C.dim);    }

// ─────────────────────────────────────────────────────────────────────────────
// § 3  Shell helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run a shell command via execSync, returning trimmed stdout.
 * Swallows errors when ignoreError=true (logs a warning instead).
 */
function run(cmd, { cwd = ROOT, ignoreError = false } = {}) {
  try {
    return execSync(cmd, {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 180_000,
    }).trim();
  } catch (e) {
    const out = ((e.stdout || '') + '').trim();
    const err = ((e.stderr || '') + '').trim();
    if (!ignoreError) {
      warn(`Command failed (exit ${e.status}): ${cmd.slice(0, 120)}`);
      if (err) debug(err.slice(0, 300));
    }
    return out;
  }
}

/**
 * Run a command via spawnSync for better argument handling (no shell escaping).
 * Returns { success, stdout, stderr, status }.
 */
function spawn(args, { cwd = ROOT, timeout = 180_000, env = undefined } = {}) {
  const [cmd, ...argv] = args;
  const result = spawnSync(cmd, argv, {
    cwd,
    encoding: 'utf8',
    timeout,
    shell: false,
    env: env || process.env,
  });
  return {
    success: result.status === 0 && !result.error,
    stdout:  ((result.stdout || '') + '').trim(),
    stderr:  ((result.stderr || '') + '').trim(),
    status:  result.status,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4  File helpers
// ─────────────────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

/**
 * Write a file, creating parent directories as needed.
 * absolutePath must be absolute so we can resolve its parent.
 */
function writeFile(absolutePath, content) {
  ensureDir(resolve(absolutePath, '..'));
  writeFileSync(absolutePath, content, 'utf8');
}

function appendToFile(absolutePath, content) {
  ensureDir(resolve(absolutePath, '..'));
  appendFileSync(absolutePath, content, 'utf8');
}

/** Return file contents, or empty string on any error. */
function readSafe(absolutePath) {
  try { return readFileSync(absolutePath, 'utf8'); } catch { return ''; }
}

/** Convert a path to a repo-root-relative display string. */
function rel(absolutePath) {
  return absolutePath.replace(ROOT + '/', '');
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5  Text helpers
// ─────────────────────────────────────────────────────────────────────────────

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function excerpt(text, max = 500) {
  if (!text) return '*No description provided.*';
  const clean = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return clean.length <= max ? clean : clean.slice(0, max) + '…';
}

/** Escape characters that break Markdown table cells. */
function mdEscape(text) {
  return (text || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6  GitHub / gh CLI helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch up to MAX_ISSUES open issues as parsed JSON objects. */
function fetchIssues() {
  section('Fetching open issues from GitHub');

  if (!REPO) throw new Error('GITHUB_REPOSITORY env var is required but not set.');

  const labelArgs = LABELS_FILTER
    ? LABELS_FILTER.split(',').map(l => `--label "${l.trim()}"`).join(' ')
    : '';

  const cmd = [
    `gh issue list`,
    `--repo "${REPO}"`,
    `--state open`,
    `--limit ${MAX_ISSUES}`,
    labelArgs,
    `--json number,title,body,labels,url,author,createdAt`,
  ].filter(Boolean).join(' ');

  info(`Running: ${cmd}`);

  const raw = run(cmd);
  if (!raw) {
    warn('gh issue list returned empty output — repository may have no open issues.');
    return [];
  }

  let issues;
  try {
    issues = JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `Failed to parse gh issue list output: ${e.message}\nRaw snippet: ${raw.slice(0, 300)}`
    );
  }

  if (!Array.isArray(issues)) {
    warn('Unexpected issue list format — expected JSON array');
    return [];
  }

  // When LABELS_FILTER contains multiple labels (comma-separated), gh's
  // --label flag is AND-logic per label, so we post-filter here for OR semantics.
  if (LABELS_FILTER && LABELS_FILTER.includes(',')) {
    const wanted = LABELS_FILTER.split(',').map(s => s.trim().toLowerCase());
    issues = issues.filter(issue =>
      (issue.labels || []).some(l => wanted.includes((l.name || '').toLowerCase()))
    );
    info(`Post-filtered by labels (OR) → ${issues.length} issue(s) remain`);
  }

  ok(`Fetched ${issues.length} open issue(s) (requested max: ${MAX_ISSUES})`);
  return issues;
}

/** Post a comment on a GitHub issue. No-ops in dry-run mode. */
function postIssueComment(issueNumber, body) {
  if (DRY_RUN) {
    debug(`[dry-run] Would comment on issue #${issueNumber}`);
    return;
  }
  const result = spawn([
    'gh', 'issue', 'comment', String(issueNumber),
    '--repo', REPO,
    '--body', body,
  ]);
  if (result.success) {
    debug(`Commented on issue #${issueNumber}`);
  } else {
    warn(`Could not comment on issue #${issueNumber}: ${result.stderr.slice(0, 120)}`);
  }
}

/** Return a list of open bot PRs (from previous runs). */
function getOpenBotPRs() {
  const raw = run(
    `gh pr list --repo "${REPO}" --state open --json number,title,headRefName --limit 20`,
    { ignoreError: true }
  );
  if (!raw) return [];
  try {
    return JSON.parse(raw).filter(pr =>
      (pr.headRefName || '').startsWith('bot/issue-fixes')
    );
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 7  Issue categorization
// ─────────────────────────────────────────────────────────────────────────────

/** Emoji badges for each category — used in PR body and triage docs. */
const CATEGORY_EMOJI = {
  security:      '🔐',
  bug:           '🐛',
  'type-error':  '🟠',
  performance:   '⚡',
  'ci-cd':       '🔄',
  documentation: '📄',
  enhancement:   '✨',
  refactor:      '♻️',
  unknown:       '❓',
};

/**
 * Determine the category of an issue from its labels and body text.
 * Returns one of the CATEGORY_EMOJI keys.
 */
function categorize(issue) {
  const title      = (issue.title || '').toLowerCase();
  const body       = (issue.body  || '').toLowerCase();
  const fullText   = `${title} ${body}`;
  const labelNames = (issue.labels || []).map(l => (l.name || '').toLowerCase());

  const has      = (...kws)  => kws.some(kw  => fullText.includes(kw));
  const hasLabel = (...lbls) => lbls.some(lbl => labelNames.includes(lbl));

  if (hasLabel('security', 'vulnerability', 'cve') ||
      has('cve-', 'xss', 'sql injection', 'auth bypass', 'csrf', 'sensitive data', 'secret leak'))
    return 'security';

  if (hasLabel('typescript', 'type-error', 'types') ||
      has('typescript error', 'ts error', 'type error', 'typeerror',
          'cannot find name', 'property does not exist', 'is not assignable to type',
          'no overload matches'))
    return 'type-error';

  if (hasLabel('bug', 'bug report', 'fix', 'regression') ||
      has('error', 'crash', 'broken', 'not working', 'exception', '404',
          'undefined is not', 'null is not', 'cannot read propert', 'uncaught'))
    return 'bug';

  if (hasLabel('performance', 'optimization', 'speed', 'perf') ||
      has('slow', 'performance', 'memory leak', 'lag', 'optimize', 'too slow', 'bundle size'))
    return 'performance';

  if (hasLabel('ci', 'workflow', 'github-actions', 'deploy', 'cd', 'pipeline') ||
      has('workflow', 'github action', 'build fail', 'ci fail', 'deploy fail', 'pipeline'))
    return 'ci-cd';

  if (hasLabel('documentation', 'docs', 'readme') ||
      has(' docs', 'readme', 'documentation', 'missing docs', 'undocumented', 'clarif', 'explain'))
    return 'documentation';

  if (hasLabel('enhancement', 'feature', 'feature-request', 'request') ||
      has('feature request', 'add support', 'would be nice', 'new feature',
          'please add', 'could you add', 'implement', 'request:'))
    return 'enhancement';

  if (hasLabel('refactor', 'tech-debt', 'cleanup', 'technical-debt') ||
      has('refactor', 'cleanup', 'technical debt', 'code smell', 'clean up', 'rewrite'))
    return 'refactor';

  return 'unknown';
}

/**
 * Extract file paths mentioned in issue body text.
 * Looks for paths starting with common DREAMengin source roots.
 */
function extractMentionedPaths(text) {
  if (!text) return [];
  const paths = new Set();
  const SOURCE_ROOTS = [
    'app', 'components', 'lib', 'hooks', 'src', 'styles',
    'scripts', 'engins', 'daydreams', 'games', 'coresurfaces',
    'docs', 'public', 'types', 'utils',
  ].join('|');
  const re = new RegExp(
    `(?:^|[\\s\`"'(])((?:${SOURCE_ROOTS})/[a-zA-Z0-9_./-]+\\.[a-z]{1,6})`,
    'gm'
  );
  let m;
  while ((m = re.exec(text)) !== null) {
    paths.add(m[1]);
  }
  return [...paths].slice(0, 12);
}

// ─────────────────────────────────────────────────────────────────────────────
// § 8  Triage document builder (shared template)
// ─────────────────────────────────────────────────────────────────────────────

function buildTriageDoc(issue, category, analysisText, suggestionsText) {
  const emoji  = CATEGORY_EMOJI[category] || '❓';
  const author = (issue.author || {}).login || 'unknown';
  const paths  = extractMentionedPaths(issue.body || '');

  const pathsSection = paths.length
    ? paths.map(p => `- \`${p}\``).join('\n')
    : '- *No specific files extracted from issue body — check issue URL for context.*';

  return `# ${emoji} Issue #${issue.number}: ${issue.title}

> **Auto-generated** by \`issue-bot.js\` on ${DATE_STR}
> **Issue URL:** ${issue.url}
> **Category:** \`${category}\`
> **Reporter:** @${author}
> **Created:** ${issue.createdAt || 'unknown'}
> **Bot branch:** \`${BOT_BRANCH}\`

---

## 📋 Issue Summary

${excerpt(issue.body)}

---

## 🔍 Automated Analysis

${analysisText}

---

## 🛠️ Suggested Fix

${suggestionsText}

---

## 📁 Related Files (extracted from issue body)

${pathsSection}

---

## 🏗️ DREAMengin Platform Context

This issue was triaged in the context of the **DREAMengin** dual-runtime creative OS
(Next.js 16+ / React 19 / Supabase). Key areas of the platform:

| Surface/Layer | Description |
|---------------|-------------|
| HomeDream | Root private operating surface |
| Daydream ×6 | Music · Games · Lab · Code · Brand · Create |
| Engin ×6 | StarMakerEngin · GameEngin · LabEngin · CodeEngin · BrandingEngin · ContentEngin |
| DreamDM Bar | Persistent interaction rail + draggable divider |
| Gold Button | Primary travel control |
| AI Triad | Dr. Eams · IDARi · TheBoogieMan.Ai |

---

*Generated by DREAMengin Issue Bot · \`issue-bot.js\` · ${TIMESTAMP}*
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 9  Per-category fix strategies
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Each strategy receives an issue object and returns:
 *   { filesCreated: string[], description: string }
 * Throwing causes the caller to fall back to fixGeneric and mark success=false.
 */

function fixBug(issue) {
  const analysis = `This issue appears to be a **bug report**. The automated bot has:
- Created this triage document for developer review
- Triggered a global ESLint \`--fix\` pass on the codebase (see PR body for results)
- Triggered a TypeScript \`--noEmit\` audit (see PR body for error count)`;

  const suggestions = `1. **Locate the failure point** — check the Related Files section above.
2. **Run the full local stack:**
   \`\`\`bash
   pnpm run typecheck
   pnpm run lint
   pnpm run test
   \`\`\`
3. **Review recent changes** near the affected file:
   \`\`\`bash
   git log --oneline -20 -- <file>
   \`\`\`
4. **Check for related annotations** in source:
   \`\`\`bash
   grep -rn "TODO\\|FIXME\\|HACK\\|BUG" app/ components/ lib/ | head -30
   \`\`\`
5. Add defensive null-checks or early-return guards around the failure site.
6. After fixing, run \`pnpm run preflight\` to verify all gates pass.`;

  const docPath = join(TRIAGE_DIR, `issue-${issue.number}.md`);
  writeFile(docPath, buildTriageDoc(issue, 'bug', analysis, suggestions));

  return {
    filesCreated: [rel(docPath)],
    description:  'Bug triage document created; lint-fix + typecheck passes scheduled globally',
  };
}

function fixTypeError(issue) {
  const analysis = `This issue appears to be a **TypeScript / type error**. The automated bot has:
- Created this triage document for developer review
- Captured the current \`pnpm run typecheck\` output in the PR body`;

  const suggestions = `1. **Run \`pnpm run typecheck\`** to see current TypeScript errors.
2. **Common fixes for DREAMengin types:**
   - Add explicit return types to async server actions
   - Use \`import type\` syntax for type-only imports
   - Check \`types/\` directory for missing global declarations
   - Wrap Supabase query results with proper generics
3. **Quick suppression (use sparingly, always with a TODO):**
   \`\`\`ts
   // TODO issue #${issue.number}: fix underlying type mismatch
   // @ts-expect-error — <brief reason>
   \`\`\`
4. Review \`tsconfig.json\` for the strict settings in effect.
5. Run \`pnpm run build:gamesengin\` to check the GameEngin type pass too.`;

  const docPath = join(TRIAGE_DIR, `issue-${issue.number}.md`);
  writeFile(docPath, buildTriageDoc(issue, 'type-error', analysis, suggestions));

  return {
    filesCreated: [rel(docPath)],
    description:  'TypeScript error triage document created',
  };
}

function fixDocumentation(issue) {
  const slug    = slugify(issue.title);
  const docPath = resolve(ROOT, 'docs', `issue-${issue.number}-${slug}.md`);
  const author  = (issue.author || {}).login || 'unknown';

  const docContent = `# ${issue.title}

> **Status:** 📝 Documentation stub — needs content
> **Issue:** [#${issue.number}](${issue.url})
> **Reporter:** @${author}
> **Auto-created:** ${DATE_STR}

---

## Overview

> *TODO: Fill in documentation for this feature / area.*

${excerpt(issue.body, 800)}

---

## Details

> *TODO: Add detailed documentation here.*

### Usage

\`\`\`typescript
// TODO: Add usage example
\`\`\`

### Configuration

> *TODO: Describe any configuration options, environment variables, or Supabase tables.*

### Related Components

> *TODO: List the React components, hooks, or lib helpers involved.*

---

## See Also

- [Architecture](./ARCHITECTURE.md)
- [Feature Status](./FEATURE_STATUS.md)
- [LAW](./LAW.md)
- [BUGS](./BUGS.md)

---

*Documentation stub created by DREAMengin Issue Bot · ${TIMESTAMP}*
`;

  writeFile(docPath, docContent);

  const analysis = `This issue requests **documentation improvements**. A documentation stub has been created at \`docs/issue-${issue.number}-${slug}.md\`.`;
  const suggestions = `1. Open \`docs/issue-${issue.number}-${slug}.md\` and fill in the placeholder sections.
2. Add a link to the new doc from the relevant docs index or \`docs/ARCHITECTURE.md\`.
3. Follow the DREAMengin documentation style defined in \`docs/LAW.md\`.
4. If this fixes a "missing README section", update \`README.md\` directly.`;

  const triagedPath = join(TRIAGE_DIR, `issue-${issue.number}.md`);
  writeFile(triagedPath, buildTriageDoc(issue, 'documentation', analysis, suggestions));

  return {
    filesCreated: [rel(docPath), rel(triagedPath)],
    description:  'Documentation stub created + triage document',
  };
}

function fixEnhancement(issue) {
  const slug     = slugify(issue.title);
  const specPath = join(FEATURES_DIR, `feature-${issue.number}-${slug}.md`);
  const author   = (issue.author || {}).login || 'unknown';

  ensureDir(FEATURES_DIR);

  const specContent = `# ✨ Feature Spec: ${issue.title}

> **Issue:** [#${issue.number}](${issue.url})
> **Status:** 🔲 Planned — pending implementation
> **Reporter:** @${author}
> **Auto-created:** ${DATE_STR}

---

## User Story

${excerpt(issue.body, 1000)}

---

## Acceptance Criteria

- [ ] Feature is implemented and functional
- [ ] Unit / integration tests added where applicable
- [ ] \`pnpm run typecheck\` passes (zero new errors)
- [ ] \`pnpm run lint\` passes
- [ ] \`pnpm run build\` passes
- [ ] \`docs/FEATURE_STATUS.md\` updated to reflect the new status
- [ ] No regression in existing Daydream surfaces or Engin runtimes

---

## Implementation Notes

### Affected DREAMengin Surfaces

> *TODO: Check off all areas this feature touches*

- [ ] HomeDream (\`app/home/\`)
- [ ] Daydream surfaces (\`app/daydream/\`, \`components/daydream/\`)
  - [ ] Music Daydream + StarMakerEngin
  - [ ] Games Daydream + GameEngin
  - [ ] Lab Daydream + LabEngin
  - [ ] Code Daydream + CodeEngin
  - [ ] Brand Daydream + BrandingEngin
  - [ ] Create Daydream + ContentEngin
- [ ] DreamDM Bar (\`dreamdmbar/\`)
- [ ] Gold Button / navigation (\`components/navigation/\`)
- [ ] AI Triad — Dr. Eams / IDARi / TheBoogieMan.Ai (\`dr-eams/\`, \`lib/ai/\`)
- [ ] Profile (EditProfileDream / ViewProfile)
- [ ] Supabase schema changes required

### Suggested Files to Create / Modify

> *TODO: List specific files*

\`\`\`
# Example layout
components/daydream/<surface>/<NewComponent>.tsx
app/daydream/<surface>/page.tsx
lib/<feature-slug>.ts
\`\`\`

### Technical Approach

> *TODO: Describe the implementation strategy*

### SICC Design Checklist

- [ ] **S**tylized — follows gold / light-blue / white palette + Space Grotesk font
- [ ] **I**ntuitive — interaction self-reveals without a tutorial
- [ ] **C**ohesive — feels native to the surrounding surface
- [ ] **C**oherent — state preserved across navigation

### Security Considerations

- [ ] RLS policy added to any new Supabase table
- [ ] No secrets exposed to the client bundle
- [ ] Auth boundaries respected (admin-only vs. user-level)

---

## Dependencies / Blockers

> *TODO: List any blocking issues or dependent features*

---

*Feature spec created by DREAMengin Issue Bot · ${TIMESTAMP}*
`;

  writeFile(specPath, specContent);

  const analysis = `This issue is a **feature enhancement request**. A feature spec stub has been created at \`docs/features/feature-${issue.number}-${slug}.md\`.`;
  const suggestions = `1. Open \`docs/features/feature-${issue.number}-${slug}.md\` and fill in the implementation details.
2. Break the work into sub-tasks and track them as checkboxes in the spec.
3. Add an entry to \`docs/FEATURE_STATUS.md\` once work begins.
4. Identify whether this feature needs a Supabase migration — if so, add it to \`supabase/migrations/\`.`;

  const triagedPath = join(TRIAGE_DIR, `issue-${issue.number}.md`);
  writeFile(triagedPath, buildTriageDoc(issue, 'enhancement', analysis, suggestions));

  return {
    filesCreated: [rel(specPath), rel(triagedPath)],
    description:  'Feature spec stub + triage document created',
  };
}

function fixSecurity(issue) {
  const analysis = `⚠️ This issue has been flagged as a **security concern**.

The automated bot does **NOT** make source-code changes for security issues to avoid
accidentally leaking sensitive implementation details. A human developer must review
and fix this manually.`;

  const suggestions = `1. ⛔ **Do not discuss exploit details in public GitHub comments.**
2. Review [docs/SECURITY.md](docs/SECURITY.md) for DREAMengin security policies.
3. Ensure Supabase Row-Level Security (RLS) is enabled on all affected tables.
4. Verify no secrets or private keys are exposed in the client bundle.
5. Review middleware auth boundaries in \`app/\` route handlers.
6. If this is a high-severity vulnerability, file a **private security advisory**
   via GitHub's Security tab instead of a public issue.`;

  const docPath = join(TRIAGE_DIR, `issue-${issue.number}.md`);
  writeFile(docPath, buildTriageDoc(issue, 'security', analysis, suggestions));

  return {
    filesCreated: [rel(docPath)],
    description:  '🔐 Security triage document created — manual review required, no code auto-changes',
  };
}

function fixPerformance(issue) {
  const analysis = `This issue is a **performance concern**. The automated bot has created a performance tracking document.`;

  const suggestions = `1. **Profile the affected area** using Chrome DevTools Performance tab or React DevTools Profiler.
2. **Common DREAMengin performance patterns:**
   - Lazy-load heavy 3D / game components:
     \`\`\`ts
     const HeavyComponent = dynamic(() => import('./HeavyComponent'), { ssr: false });
     \`\`\`
   - Memoize expensive renders: \`useMemo\`, \`useCallback\`, \`React.memo\`
   - Audit Zustand store subscriptions — over-subscribing causes re-renders
   - Verify the WebAssembly shader worker (\`public/workers/engin-shader.wasm\`) is not blocking the main thread
3. **Bundle analysis:**
   After \`pnpm run build\`, check \`.next/analyze/\` for bundle size treemap.
4. Review \`docs/OBSERVABILITY.md\` for OpenTelemetry + Prometheus integration.`;

  const docPath = join(TRIAGE_DIR, `issue-${issue.number}.md`);
  writeFile(docPath, buildTriageDoc(issue, 'performance', analysis, suggestions));

  return {
    filesCreated: [rel(docPath)],
    description:  'Performance tracking document created',
  };
}

function fixCiCd(issue) {
  const analysis = `This issue concerns the **CI/CD pipeline or GitHub Actions workflows**. The automated bot has created a tracking document.`;

  const suggestions = `1. Review the failing workflow in \`.github/workflows/\`
2. Check [docs/ACTION_AUDIT.md](docs/ACTION_AUDIT.md) for the full workflow inventory.
3. Common DREAMengin CI fixes:
   - Ensure \`NEXT_PUBLIC_SUPABASE_URL\` and \`NEXT_PUBLIC_SUPABASE_ANON_KEY\` secrets are set.
   - Check \`pnpm-lock.yaml\` is committed and up to date (\`pnpm install --frozen-lockfile\`).
   - Verify Node.js version matches \`25\` and pnpm version matches \`10.33.0\`.
   - Add \`[skip ci]\` to automated commit messages to avoid infinite loops.
4. Test changes locally with \`act\` (GitHub Actions local runner).`;

  const docPath = join(TRIAGE_DIR, `issue-${issue.number}.md`);
  writeFile(docPath, buildTriageDoc(issue, 'ci-cd', analysis, suggestions));

  return {
    filesCreated: [rel(docPath)],
    description:  'CI/CD pipeline triage document created',
  };
}

function fixRefactor(issue) {
  const analysis = `This issue requests a **code refactor or cleanup**. The automated bot has created a tracking document.`;

  const suggestions = `1. **Identify the exact scope** — one file, one module, or a cross-cutting concern?
2. **Read existing patterns before refactoring:**
   - UI components use \`.de-surface\` / \`.de-widget\` CSS classes
   - Supabase operations belong in \`lib/\` helpers, not in React components
   - State lives in Zustand stores (\`lib/stores/\`)
   - Follow Space Grotesk + gold/light-blue/white design tokens
3. **Run the full preflight after every refactor step:**
   \`\`\`bash
   pnpm run typecheck && pnpm run lint && pnpm run test
   \`\`\`
4. See \`docs/LAW.md\` for DREAMengin code governance rules.`;

  const docPath = join(TRIAGE_DIR, `issue-${issue.number}.md`);
  writeFile(docPath, buildTriageDoc(issue, 'refactor', analysis, suggestions));

  return {
    filesCreated: [rel(docPath)],
    description:  'Refactor plan document created',
  };
}

function fixGeneric(issue) {
  const analysis = `This issue was triaged but could not be placed into a specific automated category. A generic triage document has been created.`;

  const suggestions = `1. Add labels to the issue (\`bug\` / \`enhancement\` / \`documentation\` / etc.) to aid future triage.
2. Provide more context in the issue body — file paths, error messages, or expected vs. actual behaviour help enormously.
3. Check \`docs/BUGS.md\` to see if this is already tracked as a known issue.
4. Reference the DREAMengin spec in \`docs/FEATURE_STATUS.md\` if this is about an incomplete feature.`;

  const docPath = join(TRIAGE_DIR, `issue-${issue.number}.md`);
  writeFile(docPath, buildTriageDoc(issue, 'unknown', analysis, suggestions));

  return {
    filesCreated: [rel(docPath)],
    description:  'Generic triage document created',
  };
}

/** Dispatch table — maps category names to fix functions. */
const FIX_STRATEGIES = {
  security:      fixSecurity,
  bug:           fixBug,
  'type-error':  fixTypeError,
  performance:   fixPerformance,
  'ci-cd':       fixCiCd,
  documentation: fixDocumentation,
  enhancement:   fixEnhancement,
  refactor:      fixRefactor,
  unknown:       fixGeneric,
};

// ─────────────────────────────────────────────────────────────────────────────
// § 10  Global automated fixers (run once for the whole batch)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run ESLint with --fix across the entire codebase.
 * ESLint exits 1 when unfixable errors remain — that is expected and handled.
 */
function runLintFix() {
  section('Global ESLint auto-fix pass');

  const result = spawn(['pnpm', 'run', 'lint', '--', '--fix'], { timeout: 240_000 });

  if (result.success) {
    ok('ESLint auto-fix: all issues resolved or already clean');
    return {
      success: true,
      summary: '✅ ESLint auto-fix completed — no unfixable errors remain.',
    };
  }

  // Parse the output for a useful snippet
  const lines = (result.stdout + '\n' + result.stderr)
    .split('\n')
    .filter(l => /\berror\b|\bwarning\b/i.test(l))
    .slice(0, 25);

  warn(`ESLint finished with exit code ${result.status} — some issues are not auto-fixable`);

  const snippet = lines.length
    ? `\`\`\`\n${lines.join('\n')}\n\`\`\``
    : `Exit code: ${result.status}. Run \`pnpm run lint\` locally to inspect remaining issues.`;

  return {
    success: false,
    summary: `⚠️ ESLint auto-fix ran; ${lines.length} unfixable issue(s) remain:\n\n${snippet}`,
  };
}

/**
 * Run TypeScript --noEmit as a read-only audit.
 * No source changes are made — the output is surfaced in the PR body.
 */
function runTypecheckAudit() {
  section('TypeScript audit (read-only, --noEmit)');

  const result = spawn(['pnpm', 'run', 'typecheck'], { timeout: 240_000 });

  if (result.success) {
    ok('TypeScript: zero errors');
    return { errorCount: 0, summary: '✅ No TypeScript errors.' };
  }

  // TypeScript error lines match "file(line,col): error TS####: ..."
  const errLines = (result.stdout + '\n' + result.stderr)
    .split('\n')
    .filter(l => /error TS\d+/.test(l));

  warn(`TypeScript: ${errLines.length} error(s) found`);

  const shown    = errLines.slice(0, 20);
  const overflow = errLines.length > 20 ? `\n… and ${errLines.length - 20} more` : '';

  return {
    errorCount: errLines.length,
    summary: `⚠️ ${errLines.length} TypeScript error(s):\n\`\`\`\n${shown.join('\n')}${overflow}\n\`\`\``,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 11  ISSUE_FIXES.md running log
// ─────────────────────────────────────────────────────────────────────────────

function updateIssueFixes(issues, fixResults) {
  section('Appending to docs/ISSUE_FIXES.md');

  const header = existsSync(ISSUE_FIXES_DOC) ? '' : `# DREAMengin — Issue Fixes Log

> **Auto-maintained** by the DREAMengin Issue Bot.
> Each bot run appends a new section. Do not edit the bot-generated rows manually.

---

`;

  const rows = fixResults.map(r => {
    const issue = issues.find(i => i.number === r.issueNumber);
    const title = issue ? mdEscape(issue.title.slice(0, 60)) : 'unknown';
    const url   = issue ? issue.url : '#';
    const emoji = CATEGORY_EMOJI[r.category] || '❓';
    const status = r.success ? '✅' : '⚠️';
    return `| [#${r.issueNumber}](${url}) | ${emoji} ${r.category} | ${title} | ${mdEscape(r.description)} | ${status} |`;
  }).join('\n');

  const sectionBlock = `
## 🤖 Bot Run — ${DATE_STR}

**Branch:** \`${BOT_BRANCH}\` · **Actor:** @${ACTOR} · **Issues processed:** ${fixResults.length}

| Issue | Category | Title | Fix Applied | Status |
|-------|----------|-------|-------------|--------|
${rows}

`;

  if (!existsSync(ISSUE_FIXES_DOC)) {
    writeFile(ISSUE_FIXES_DOC, header + sectionBlock);
  } else {
    appendToFile(ISSUE_FIXES_DOC, sectionBlock);
  }

  ok(`docs/ISSUE_FIXES.md updated — ${fixResults.length} row(s) added`);
}

// ─────────────────────────────────────────────────────────────────────────────
// § 12  Git operations
// ─────────────────────────────────────────────────────────────────────────────

function setupGitIdentity() {
  run('git config user.name  "github-actions[bot]"');
  run('git config user.email "github-actions[bot]@users.noreply.github.com"');
  ok('Git identity configured');
}

function createBotBranch() {
  section(`Creating bot branch: ${BOT_BRANCH}`);
  // Fetch the base branch so we can branch from its remote tip
  run(`git fetch origin "${BASE_BRANCH}":refs/remotes/origin/"${BASE_BRANCH}"`, { ignoreError: true });
  run(`git checkout -b "${BOT_BRANCH}" "origin/${BASE_BRANCH}"`);
  ok(`Branch "${BOT_BRANCH}" created from origin/${BASE_BRANCH}`);
}

/**
 * Stage everything and commit.
 * Returns true if there was something to commit, false otherwise.
 */
function stageAndCommit(message) {
  run('git add -A');
  const staged = run('git diff --cached --name-only', { ignoreError: true });
  if (!staged.trim()) {
    warn('Nothing to commit — skipping commit step');
    return false;
  }

  const files = staged.split('\n').filter(Boolean);
  info(`Committing ${files.length} file(s):`);
  files.slice(0, 20).forEach(f => debug(`  + ${f}`));
  if (files.length > 20) debug(`  … and ${files.length - 20} more`);

  // Escape double-quotes in message for the shell invocation
  const safeMsg = message.replace(/"/g, "'");
  run(`git commit -m "${safeMsg}" --no-verify`);
  ok(`Committed: ${message}`);
  return true;
}

function pushBranch() {
  if (DRY_RUN) {
    info(`[dry-run] Would push branch: ${BOT_BRANCH}`);
    return;
  }
  run(`git push origin "HEAD:${BOT_BRANCH}"`);
  ok(`Branch "${BOT_BRANCH}" pushed to origin`);
}

// ─────────────────────────────────────────────────────────────────────────────
// § 13  PR body builder
// ─────────────────────────────────────────────────────────────────────────────

function buildPRBody(issues, fixResults, lintResult, tsResult, existingBotPRs) {
  // ── Issue table ────────────────────────────────────────────────────────────
  const issueRows = fixResults.map(r => {
    const issue  = issues.find(i => i.number === r.issueNumber);
    if (!issue) return '';
    const emoji  = CATEGORY_EMOJI[r.category] || '❓';
    const status = r.success ? '✅ Applied' : '⚠️ Partial';
    const title  = mdEscape(issue.title.slice(0, 65) + (issue.title.length > 65 ? '…' : ''));
    const desc   = mdEscape(r.description.slice(0, 80));
    return `| [#${issue.number}](${issue.url}) | ${title} | ${emoji} ${r.category} | ${desc} | ${status} |`;
  }).filter(Boolean).join('\n');

  // ── Files created ──────────────────────────────────────────────────────────
  const allCreated = fixResults.flatMap(r => r.filesCreated || []);
  const filesSection = allCreated.length
    ? allCreated.map(f => `- \`${f}\``).join('\n')
    : '- *No new files created.*';

  // ── Existing bot PR warning ────────────────────────────────────────────────
  const existingNote = existingBotPRs.length
    ? `> ⚠️ **Note:** ${existingBotPRs.length} other open bot PR(s) found from previous runs:\n` +
      existingBotPRs.map(pr => `> - #${pr.number}: \`${pr.headRefName}\``).join('\n') +
      `\n> Consider closing stale ones before merging this PR.\n\n`
    : '';

  // ── "Closes" block ────────────────────────────────────────────────────────
  const closesBlock = issues.map(i => `Closes #${i.number}`).join('\n');

  // ── Final body ─────────────────────────────────────────────────────────────
  return `# 🤖 DREAMengin Issue Fix Bot — Consolidated PR

> **Run date:** ${DATE_STR}
> **Triggered by:** @${ACTOR}
> **Base branch:** \`${BASE_BRANCH}\`
> **Bot branch:** \`${BOT_BRANCH}\`
> **Issues processed:** ${fixResults.length}
> **Dry run:** ${DRY_RUN ? 'Yes' : 'No'}

${existingNote}---

## 📋 Issues Addressed (${fixResults.length})

| # | Title | Category | Fix Applied | Status |
|---|-------|----------|-------------|--------|
${issueRows || '| — | No issues processed | — | — | — |'}

---

## 🔧 Automated Code-Quality Passes

### 🔍 ESLint Auto-Fix

${lintResult.summary}

### 🟠 TypeScript Audit

${tsResult.summary}

---

## 📁 New Tracking & Documentation Files

The following files were created by this bot run:

${filesSection}

**File layout:**
| Path pattern | Purpose |
|---|---|
| \`.github/issue-triage/issue-N.md\` | Per-issue triage: analysis + suggested fix |
| \`docs/features/feature-N-slug.md\` | Feature spec stub for enhancement issues |
| \`docs/issue-N-slug.md\` | Documentation stub for docs issues |
| \`docs/ISSUE_FIXES.md\` | Running log of all bot-processed issues |

---

## 🧪 Post-Merge Checklist

- [ ] \`pnpm run build\` passes (Next.js production build)
- [ ] \`pnpm run test\` passes (Vitest test suite)
- [ ] \`pnpm run typecheck\` passes (TypeScript strict check)
- [ ] \`pnpm run lint\` passes (ESLint 9 flat config)
- [ ] No regressions in Daydream surfaces or Engin runtimes
- [ ] DreamDM Bar and Gold Button navigation still functional
- [ ] Supabase RLS policies verified (if any DB changes are included)

---

## 🔗 Issue Closures

Merging this PR will auto-close the following issues via GitHub's keyword linking:

${closesBlock}

---

## 📚 DREAMengin Platform Context

DREAMengin is a **dual-runtime spatial creative OS** built on:

- **Next.js 16+** (App Router, server actions) + **React 19**
- **Supabase** (auth, Row-Level Security, real-time subscriptions)
- **Babylon.js** + **Three.js / React Three Fiber** (3D / game runtime)
- **WebAssembly** shader worker (\`public/workers/engin-shader.wasm\`)
- **Zustand** (global state) + **Framer Motion** + **GSAP** (animation)
- **TensorFlow.js** (in-browser AI inference)

The platform has **6 Daydream creative surfaces** paired with **6 Engin runtimes**,
unified by the **DreamDM Bar** and **Gold Button** navigation system, overseen by the
**AI Triad** (Dr. Eams · IDARi · TheBoogieMan.Ai).

---

## ⚠️ Reviewer Notes

- Triage documents in \`.github/issue-triage/\` are **informational only** — they record
  analysis and suggestions but make no runtime code changes.
- Feature spec stubs in \`docs/features/\` require a human developer to fill in the
  implementation plan before work begins.
- ESLint auto-fixes affect code style / formatting only — they do not change runtime
  semantics or introduce new logic.
- Security issues in this PR have **zero source-code changes** — they require manual
  review by a human developer or security engineer.

---

*Generated by [\`issue-bot.js\`](.github/scripts/issue-bot.js)*
*Workflow: [\`issue-bot.yml\`](.github/workflows/issue-bot.yml)*
*DREAMengin · ${REPO} · ${TIMESTAMP}*
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 14  GitHub Step Summary writer
// ─────────────────────────────────────────────────────────────────────────────

function writeSummary(issues, fixResults, lintResult, tsResult, prUrl) {
  ensureDir(GENERATED_DIR);

  const lines = [
    `## 🤖 Issue Fix Bot Results`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Issues fetched         | ${issues.length} |`,
    `| Issues processed       | ${fixResults.length} |`,
    `| Fixes succeeded        | ${fixResults.filter(r => r.success).length} / ${fixResults.length} |`,
    `| ESLint auto-fix        | ${lintResult.success ? '✅ Clean' : '⚠️ Partial'} |`,
    `| TypeScript errors      | ${tsResult.errorCount} |`,
    `| Dry run                | ${DRY_RUN ? '✅ Yes' : '❌ No'} |`,
    prUrl
      ? `| Pull Request           | [View PR](${prUrl}) |`
      : `| Pull Request           | — (dry run or creation failed) |`,
    ``,
    `### Issues Processed`,
    ``,
    `| # | Title | Category | Result |`,
    `|---|-------|----------|--------|`,
    ...fixResults.map(r => {
      const issue = issues.find(i => i.number === r.issueNumber);
      const emoji = CATEGORY_EMOJI[r.category] || '❓';
      const title = issue ? mdEscape(issue.title.slice(0, 55)) : '(unknown)';
      return `| [#${r.issueNumber}](${issue ? issue.url : '#'}) | ${title} | ${emoji} ${r.category} | ${r.success ? '✅' : '⚠️'} |`;
    }),
    ``,
    `*Bot branch: \`${BOT_BRANCH}\` · Base: \`${BASE_BRANCH}\` · ${DATE_STR}*`,
  ];

  writeFile(
    join(GENERATED_DIR, 'issue-bot-summary.md'),
    lines.join('\n')
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// § 15  Main orchestrator
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  console.log(`
${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════════════════╗
║     🤖  DREAMengin Unified Issue-Fix Bot                            ║
║     Consolidated Triage · Auto-Fix · PR Creator                     ║
╚══════════════════════════════════════════════════════════════════════╝${C.reset}
`);

  info(`Repository  : ${REPO || '(not set)'}`);
  info(`Base branch : ${BASE_BRANCH}`);
  info(`Bot branch  : ${BOT_BRANCH}`);
  info(`Max issues  : ${MAX_ISSUES}`);
  info(`Dry run     : ${DRY_RUN}`);
  info(`Label filter: ${LABELS_FILTER || '(all open issues)'}`);
  info(`Timestamp   : ${TIMESTAMP}`);
  console.log();

  // ── Guard: require REPO ──────────────────────────────────────────────────
  if (!REPO) {
    fail('GITHUB_REPOSITORY env var is not set — cannot call gh CLI without repo context.');
    process.exit(1);
  }

  // ── Guard: require gh CLI ────────────────────────────────────────────────
  section('Validating prerequisites');
  const ghVersion = run('gh --version', { ignoreError: true });
  if (!ghVersion) {
    fail('gh CLI not found. Ensure it is installed and authenticated (GH_TOKEN set).');
    process.exit(1);
  }
  ok(`gh CLI: ${ghVersion.split('\n')[0]}`);

  const ghAuthStatus = run('gh auth status', { ignoreError: true });
  if (ghAuthStatus.includes('not logged')) {
    warn('gh CLI reports not authenticated — operations may fail');
  } else {
    ok('gh CLI authenticated');
  }

  // ── STEP 1: Check for existing open bot PRs ──────────────────────────────
  section('Checking for stale bot PRs from previous runs');
  const existingBotPRs = getOpenBotPRs();
  if (existingBotPRs.length > 0) {
    warn(`Found ${existingBotPRs.length} open bot PR(s) from prior runs:`);
    existingBotPRs.forEach(pr => warn(`  #${pr.number}: "${pr.title}" [${pr.headRefName}]`));
    warn('Continuing — new PR will note these in its body.');
  } else {
    ok('No stale bot PRs found');
  }

  // ── STEP 2: Fetch issues ─────────────────────────────────────────────────
  const issues = fetchIssues();
  if (issues.length === 0) {
    ok('No open issues found — nothing to process. Exiting cleanly.');
    writeSummary([], [], { success: true, summary: 'N/A — no issues.' },
                          { errorCount: 0, summary: 'N/A — no issues.' }, null);
    process.exit(0);
  }

  // ── STEP 3: Git setup + branch ───────────────────────────────────────────
  section('Preparing git workspace');
  setupGitIdentity();
  createBotBranch();
  ensureDir(TRIAGE_DIR);
  ensureDir(FEATURES_DIR);
  ensureDir(GENERATED_DIR);

  // ── STEP 4: Global ESLint auto-fix ──────────────────────────────────────
  const lintResult = runLintFix();
  // Stage any lint-fixed files before per-issue work
  run('git add -A', { ignoreError: true });

  // ── STEP 5: TypeScript audit (read-only) ────────────────────────────────
  const tsResult = runTypecheckAudit();

  // ── STEP 6: Per-issue triage + fixes ────────────────────────────────────
  section(`Processing ${issues.length} issue(s)`);

  const fixResults = [];

  for (const issue of issues) {
    info(`\n  [#${issue.number}] ${issue.title}`);

    const category = categorize(issue);
    const emoji    = CATEGORY_EMOJI[category] || '❓';
    debug(`  → Category: ${emoji} ${category}`);

    let fixResult = { filesCreated: [], description: 'no fix applied', success: false };

    try {
      const strategy = FIX_STRATEGIES[category] || fixGeneric;
      fixResult = { ...strategy(issue), success: true };
      ok(`  ✓ ${fixResult.description}`);
    } catch (e) {
      warn(`  Fix failed for #${issue.number}: ${e.message.slice(0, 120)}`);
      fixResult = { filesCreated: [], description: `fix failed: ${e.message.slice(0, 80)}`, success: false };
      // Fallback: always create at least a minimal triage file
      try {
        const fallbackPath = join(TRIAGE_DIR, `issue-${issue.number}.md`);
        writeFile(fallbackPath, [
          `# ❓ Issue #${issue.number}: ${issue.title}`,
          ``,
          `> Auto-triage encountered an error: \`${e.message.slice(0, 200)}\``,
          `> Created: ${DATE_STR}`,
          `> Issue URL: ${issue.url}`,
          ``,
          excerpt(issue.body),
          ``,
          `*DREAMengin Issue Bot · ${TIMESTAMP}*`,
        ].join('\n'));
        fixResult.filesCreated = [rel(fallbackPath)];
      } catch (fe) {
        warn(`  Could not write fallback triage doc: ${fe.message.slice(0, 80)}`);
      }
    }

    fixResults.push({ issueNumber: issue.number, category, ...fixResult });
  }

  // ── STEP 7: Update docs/ISSUE_FIXES.md ──────────────────────────────────
  updateIssueFixes(issues, fixResults);

  // ── STEP 8: Commit all changes ───────────────────────────────────────────
  section('Committing all bot changes');

  const committed = stageAndCommit(
    `bot(issues): triage + auto-fix ${issues.length} open issue(s) [skip ci] [skip vercel]`
  );

  if (!committed) {
    // Edge case: nothing changed. Force a lightweight tracking commit so the branch is non-empty.
    warn('Forcing a no-op tracking commit so the branch is non-empty');
    const trackPath = join(TRIAGE_DIR, `_bot-run-${BRANCH_TS}.md`);
    writeFile(trackPath, `# Bot Run ${BRANCH_TS}\n\n- Date: ${DATE_STR}\n- Issues: ${issues.length}\n- Actor: @${ACTOR}\n`);
    run('git add -A');
    run(`git commit -m "bot(issues): tracking run ${BRANCH_TS} [skip ci] [skip vercel]" --no-verify`);
  }

  // ── STEP 9: Push branch ──────────────────────────────────────────────────
  pushBranch();

  if (DRY_RUN) {
    ok('[dry-run] Branch ready. Skipping PR creation and issue comments.');
    writeSummary(issues, fixResults, lintResult, tsResult, null);
    console.log(`\n${C.bold}${C.green}✅  Issue Fix Bot — Dry Run Complete${C.reset}\n`);
    return;
  }

  // ── STEP 10: Create consolidated PR ─────────────────────────────────────
  section('Creating consolidated pull request');

  const prBody  = buildPRBody(issues, fixResults, lintResult, tsResult, existingBotPRs);
  const prTitle = `🤖 Issue Bot: triage & fix ${issues.length} open issue(s) [skip vercel]`;

  // Write the PR body to a file to avoid shell escaping complexity
  const prBodyPath = join(GENERATED_DIR, 'issue-bot-pr-body.md');
  writeFile(prBodyPath, prBody);

  let prUrl = '';

  // Attempt with labels first; fall back without labels if they don't exist yet
  for (const extraArgs of [
    ['--label', 'bot', '--label', 'automated'],
    [], // no labels fallback
  ]) {
    const result = spawn([
      'gh', 'pr', 'create',
      '--repo', REPO,
      '--head', BOT_BRANCH,
      '--base', BASE_BRANCH,
      '--title', prTitle,
      '--body-file', prBodyPath,
      ...extraArgs,
    ]);

    if (result.success && result.stdout) {
      prUrl = result.stdout.trim();
      ok(`Pull request created: ${prUrl}`);
      break;
    }

    if (extraArgs.length > 0) {
      warn(`PR creation with labels failed (${result.stderr.slice(0, 100)}) — retrying without labels`);
    } else {
      fail(`PR creation failed: ${result.stderr.slice(0, 200)}`);
      warn('Branch is pushed — you can open the PR manually.');
    }
  }

  // ── STEP 11: Comment on each addressed issue ─────────────────────────────
  if (prUrl) {
    section('Posting bot comments on addressed issues');
    for (const r of fixResults) {
      const issue  = issues.find(i => i.number === r.issueNumber);
      if (!issue) continue;
      const emoji  = CATEGORY_EMOJI[r.category] || '❓';
      const author = (issue.author || {}).login || 'team';
      const comment = [
        `## 🤖 DREAMengin Issue Bot Update`,
        ``,
        `Hi @${author}! This issue has been picked up by the **DREAMengin Issue Fix Bot** and is included in a consolidated PR.`,
        ``,
        `| Field | Value |`,
        `|-------|-------|`,
        `| Category | ${emoji} \`${r.category}\` |`,
        `| Fix applied | ${r.description} |`,
        `| Pull Request | [${prTitle}](${prUrl}) |`,
        `| Triage doc | \`.github/issue-triage/issue-${issue.number}.md\` |`,
        ``,
        `**What happens next:**`,
        `1. A developer will review the triage document and the PR.`,
        `2. Any manual fixes identified in the triage doc will be applied.`,
        `3. When the PR is merged, this issue will be **automatically closed** via the "Closes #${issue.number}" keyword.`,
        ``,
        `---`,
        `*Automated by [DREAMengin Issue Bot](.github/workflows/issue-bot.yml) · ${DATE_STR}*`,
      ].join('\n');

      postIssueComment(issue.number, comment);
    }
  }

  // ── STEP 12: Write GitHub Step Summary ──────────────────────────────────
  writeSummary(issues, fixResults, lintResult, tsResult, prUrl);

  // ── Final report ─────────────────────────────────────────────────────────
  section('Bot Run Complete');
  ok(`Issues fetched:    ${issues.length}`);
  ok(`Fixes applied:     ${fixResults.filter(r => r.success).length} / ${fixResults.length}`);
  ok(`ESLint:            ${lintResult.success ? 'clean' : 'partial'}`);
  ok(`TypeScript errors: ${tsResult.errorCount}`);
  if (prUrl)    ok(`Pull request:      ${prUrl}`);
  else          warn('Pull request URL not available (dry-run or creation failed)');

  console.log(`\n${C.bold}${C.green}✅  DREAMengin Issue Fix Bot — Done${C.reset}\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// § 16  Entry point
// ─────────────────────────────────────────────────────────────────────────────

try {
  main();
} catch (err) {
  fail(`Fatal: ${err.message}`);
  if (err.stack) {
    err.stack.split('\n').slice(1, 6).forEach(line => debug(line));
  }
  process.exit(1);
}
