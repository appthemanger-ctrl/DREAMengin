#!/usr/bin/env node
/**
 * scripts/update-readme.mjs
 *
 * Automatically updates README.md after every push.
 *
 * What it does:
 *  1. Reads the latest commit metadata (hash, message, author, datetime, files).
 *  2. Regenerates the AI Agent Quick Reference block (between
 *     <!-- DREAMENGIN-AI-CONTEXT:START --> and <!-- DREAMENGIN-AI-CONTEXT:END -->).
 *  3. Refreshes the "Last updated" line inside "## Current Implementation Status".
 *  4. Prepends a new row into the "## Recent Changes" table (created if absent).
 *  5. Keeps exactly MAX_ROWS recent entries; older ones are trimmed.
 *  6. Writes a rich GitHub Actions Step Summary (AI agent context + change info).
 *
 * Called by Idari[bot] via .github/workflows/update-readme.yml on every push and merge.
 * Can also be run locally: node scripts/update-readme.mjs
 */

import { execSync }                          from 'child_process';
import { readFileSync, writeFileSync,
         appendFileSync, readdirSync,
         existsSync, statSync }              from 'fs';
import { resolve, dirname, join }            from 'path';
import { fileURLToPath }                     from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');
const README    = resolve(ROOT, 'README.md');
const MAX_ROWS  = 10;
const DOC_OWNER = 'José Mancilla (appthemanger-ctrl)';

const AI_CTX_START = '<!-- DREAMENGIN-AI-CONTEXT:START -->';
const AI_CTX_END   = '<!-- DREAMENGIN-AI-CONTEXT:END -->';
const FS_START     = '<!-- FILE-STRUCTURE:START -->';
const FS_END       = '<!-- FILE-STRUCTURE:END -->';

// ── Helper: run git / shell commands ──────────────────────────────────────────

function git(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function countShell(cmd) {
  try {
    return parseInt(execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim(), 10) || 0;
  } catch {
    return 0;
  }
}

// ── Helper: escape table cell content ─────────────────────────────────────────

function cell(s) { return s.replace(/\|/g, '\\|').replace(/\n/g, ' '); }

// ── 1. Collect git metadata ────────────────────────────────────────────────────

const sha     = (process.env.GITHUB_SHA      || git('git rev-parse HEAD')).slice(0, 7);
const branch  = (process.env.GITHUB_REF_NAME || git('git rev-parse --abbrev-ref HEAD'));
const actor   = (process.env.GITHUB_ACTOR    || git('git log -1 --format=%an'));
const rawDate = git('git log -1 --format=%aI');
const message = git('git log -1 --format=%s');

// Human-readable UTC datetime, e.g. "2026-03-24 17:56 UTC"
const utcDate = new Date(rawDate || Date.now())
  .toISOString()
  .replace('T', ' ')
  .replace(/:\d{2}\.\d{3}Z$/, ' UTC');

// ── 2. Collect file-change stats ──────────────────────────────────────────────

const nameStatus = git('git diff-tree --no-commit-id -r --name-status HEAD');
const diffLines  = nameStatus.split('\n').filter(Boolean);

const added    = diffLines.filter(l => l.startsWith('A')).length;
const modified = diffLines.filter(l => l.startsWith('M')).length;
const deleted  = diffLines.filter(l => l.startsWith('D')).length;

const statParts = [];
if (added)    statParts.push(`+${added}`);
if (deleted)  statParts.push(`−${deleted}`);
if (modified) statParts.push(`~${modified}`);
const statLine = statParts.length ? statParts.join(' ') : '—';

// ── 3. Collect live repo stats ────────────────────────────────────────────────

const testCount     = existsSync(resolve(ROOT, 'tests'))
  ? readdirSync(resolve(ROOT, 'tests')).filter(f => f.endsWith('.test.ts')).length
  : 0;
const pageCount     = countShell(`find ${ROOT}/app -name "page.tsx" 2>/dev/null | wc -l`);
const apiCount      = countShell(`find ${ROOT}/app/api -name "route.ts" 2>/dev/null | wc -l`);
const routeCount    = pageCount + apiCount;
const workflowCount = existsSync(resolve(ROOT, '.github/workflows'))
  ? readdirSync(resolve(ROOT, '.github/workflows')).filter(f => f.endsWith('.yml') || f.endsWith('.yaml')).length
  : 0;

// ── 4a. Build a live file-structure tree (2 levels deep) ──────────────────────

/**
 * Returns a markdown code-block with the top-level repo structure,
 * expanding key directories one level deeper.  Hidden dirs, node_modules,
 * .next, and large generated directories are skipped.
 */
function buildFileStructure() {
  const SKIP = new Set([
    'node_modules', '.next', '.git', 'dist', 'out', '.turbo', 'coverage',
    '.vercel', '.cache', '__pycache__',
  ]);

  // Directories we want to expand to show their immediate children
  const EXPAND = new Set([
    'app', 'components', 'lib', 'docs', 'scripts', 'tests',
    '.github', 'build-memory', 'hooks', 'types', 'public',
  ]);

  function icon(name, isDir) {
    if (!isDir) return '📄';
    const icons = {
      app: '📱', components: '🧩', lib: '📚', docs: '📋',
      scripts: '⚙️', tests: '🧪', '.github': '🔧', 'build-memory': '🧠',
      hooks: '🪝', types: '🏷️', public: '🌐',
    };
    return icons[name] || '📁';
  }

  const entries = readdirSync(ROOT)
    .filter(n => !SKIP.has(n) && !n.startsWith('.') || n === '.github')
    .sort((a, b) => {
      // dirs first
      const aDir = statSync(join(ROOT, a)).isDirectory();
      const bDir = statSync(join(ROOT, b)).isDirectory();
      if (aDir && !bDir) return -1;
      if (!aDir && bDir) return 1;
      return a.localeCompare(b);
    });

  const lines = [];
  lines.push('```');
  lines.push('DREAMengin/');

  for (const name of entries) {
    const abs   = join(ROOT, name);
    const isDir = statSync(abs).isDirectory();
    const prefix = icon(name, isDir);
    lines.push(`├── ${prefix} ${name}${isDir ? '/' : ''}`);

    if (isDir && EXPAND.has(name)) {
      let children;
      try {
        children = readdirSync(abs)
          .filter(c => !SKIP.has(c) && !c.startsWith('.'))
          .sort((a, b) => {
            const aD = statSync(join(abs, a)).isDirectory();
            const bD = statSync(join(abs, b)).isDirectory();
            if (aD && !bD) return -1;
            if (!aD && bD) return 1;
            return a.localeCompare(b);
          })
          .slice(0, 20); // cap at 20 children to keep output readable
      } catch {
        children = [];
      }
      const shown = children.slice(0, 18);
      const rest  = children.length - shown.length;
      for (const child of shown) {
        const childAbs = join(abs, child);
        const childDir = statSync(childAbs).isDirectory();
        lines.push(`│   ├── ${childDir ? '📁' : '📄'} ${child}${childDir ? '/' : ''}`);
      }
      if (rest > 0) {
        lines.push(`│   └── … and ${rest} more`);
      }
    }
  }

  lines.push('```');
  return lines.join('\n');
}

// ── 4. Build the AI Agent Context block ───────────────────────────────────────

function buildAIContextBlock() {
  return `${AI_CTX_START}
## 🤖 AI Agent Quick Reference
<!-- Last regenerated: ${utcDate} — \`${sha}\` on \`${branch}\` -->

> **Documentation Owner:** ${DOC_OWNER}  
> **Documentation Date:** ${utcDate}

> **Copilot / AI agents — read this section first.**
> It is auto-regenerated by Idari[bot] on every push so it always reflects the live repo.

### What This Repo Is

DREAMengin is a **spatial, privacy-first creative OS** built with **Next.js 16+** (App Router),
**TypeScript**, **Supabase**, **Tailwind CSS**, and **Babylon.js 9+**.
It is not a traditional social app — it is a modular, dual-runtime spatial operating environment.
Author: José Mancilla · pnpm 10.30.0 · Node 25

---

### ⚡ Docs to Read Before Touching Code

| Priority | File | Why |
|----------|------|-----|
| 🔴 MUST | \`docs/AGENT_PLAYBOOK.md\` | Session rules, build commands, full key-file map — **start here** |
| 🔴 MUST | \`docs/GENERATION_LAW.md\` | Compute χ and select a generation mode before **every** pass |
| 🔴 MUST | \`docs/CONSTITUTION.md\` | Non-negotiable platform rules — never violate these |
| 🟠 HIGH | \`docs/NAMING_AUTHORITY.md\` | Canonical names — never invent new surface / route / AI names |
| 🟠 HIGH | \`docs/FEATURE_STATUS.md\` | What is and isn't implemented right now |
| 🟡 MED  | \`docs/LAW.md\` | Complete system law (§1–§30+) |
| 🟡 MED  | \`docs/ARCHITECTURE.md\` | System architecture reference |
| 🟡 MED  | \`REPO_STATE.md\` | Auto-generated full repo analysis (metrics, debt, priorities) |
| 🔵 REF  | \`docs/HANDOFF.md\` | Change timeline — what changed and when |
| 🔵 REF  | \`docs/BUGS.md\` | Known bugs and upgrade queue |

---

### 🛠 Build & Test Commands

\`\`\`bash
pnpm dev          # Start dev server on port 3000
pnpm build        # Production build (Next.js)
pnpm typecheck    # TypeScript type-check (no emit)
pnpm lint         # ESLint — 0 errors policy
pnpm test         # Run all Vitest tests
pnpm preflight    # typecheck + lint + tests (full pre-push gate)
\`\`\`

> **Dev auth bypass (local only):** set \`DEV_BYPASS_AUTH=true\` and \`DEV_ADMIN=true\` in \`.env.local\`

---

### 📂 Key Directory Map

| Path | What lives here |
|------|----------------|
| \`app/\` | Next.js App Router pages and API route handlers |
| \`app/api/\` | ${apiCount} API route handlers |
| \`components/daydream/\` | The 6 Daydream surfaces + Engin components |
| \`components/games/\` | All game components (MADMAXI, NeonDrift, etc.) |
| \`components/home/\` | HomeDream + HomeSystem |
| \`components/messaging/\` | DreamDMBar (the dual-runtime divider) |
| \`components/music/\` | SoundRecorder and music UI |
| \`lib/\` | Hooks, utilities, Supabase client, game libs |
| \`docs/\` | All governance, law, spec, and policy documents |
| \`.github/workflows/\` | ${workflowCount} CI/CD automation workflows |
| \`tests/\` | Vitest test suite (${testCount} test files) |
| \`scripts/\` | Maintenance and automation scripts |
| \`build-memory/\` | Auto-generated build intelligence snapshots |

---

### 🗂️ File Structure
<!-- FILE-STRUCTURE:START -->
${buildFileStructure()}
<!-- FILE-STRUCTURE:END -->

---

### 📊 Current Build Snapshot

| Metric | Value |
|--------|-------|
| Phase | Phase 8 — Real Runtime Completion |
| Routes | ~${routeCount} (${pageCount} pages + ${apiCount} API handlers) |
| Test files | ${testCount} |
| Last push | \`${sha}\` by **${actor}** on \`${branch}\` |
| Timestamp | ${utcDate} |

---

### ⚠️ Pre-existing Issues (do not fix unless explicitly asked)

- **4 failing tests** in \`tests/dreamdm-bar-interactions.test.ts\` (\`snapSplitRatioOnRelease\` suite) — known mismatch, pre-existing
- **~29 ESLint warnings** (prefer-const, no-img-element, alt-text) — intentional per \`eslint.config.mjs\`

---

### 🤖 AI Systems

| Agent | API Route | Role |
|-------|-----------|------|
| **Dr. Eams** | \`/api/ai/eams\` | Discovery, routing, idea generation |
| **IDARi** | \`/api/ai/idari\` | System maintenance and governance |
| **TheBoogieMan.Ai** | \`/api/ai/boogieman\` | Policy enforcement and system overwatch |

---

### 🔄 Auto-Workflows (run on every push — bot commits carry \`[skip vercel]\`)

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| \`update-readme.yml\` | Every push | Updates this AI context block + Recent Changes table |
| \`update-handoff.yml\` | Every push | Prepends row to \`docs/HANDOFF.md\` change timeline |
| \`update-bugs.yml\` | Every push | Regenerates \`docs/BUGS.md\` from source annotations |
| \`sync-build-memory.yml\` | main/completedream/develop | Syncs \`build-memory/\` JSON snapshots |
| \`update-repo-state.yml\` | main/completedream/develop | Full repo analysis → \`REPO_STATE.md\` |
| \`dreamengin-preflight.yml\` | Push to \`completedream\` | Full CI: build + typecheck + tests |
| \`idari-daily.yml\` | Daily 06:00 UTC | IDARi daily improvement cycle (opens PR, never pushes direct) |

---

${AI_CTX_END}`;
}

// ── 5. Write GitHub Actions Step Summary ─────────────────────────────────────

function writeSummary(status) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) return;

  const lines = [
    '## 📖 README.md — Idari[bot] Auto-Update',
    '',
    `> **${status}**`,
    '',
    '| Field | Value |',
    '|-------|-------|',
    `| Documentation Owner | ${DOC_OWNER} |`,
    `| Commit | \`${sha}\` |`,
    `| Branch | \`${branch}\` |`,
    `| Actor | ${actor} |`,
    `| Files changed | ${statLine} |`,
    `| Message | ${cell(message)} |`,
    `| Timestamp | ${utcDate} |`,
    '',
    '### Sections updated',
    '- ✅ **AI Agent Quick Reference** block (top of README)',
    '- ✅ **Recent Changes** table (latest commit prepended)',
    '- ✅ **Current Implementation Status** — "Last updated" line',
    '- ✅ **File Structure** — live tree (top-level + key dirs)',
    '',
    '### Key docs for AI agents working in this repo',
    '| Priority | File | Why |',
    '|----------|------|-----|',
    '| 🔴 MUST | `docs/AGENT_PLAYBOOK.md` | Session rules and build commands — read first |',
    '| 🔴 MUST | `docs/GENERATION_LAW.md` | Compute χ before every generation pass |',
    '| 🔴 MUST | `docs/CONSTITUTION.md` | Non-negotiable platform rules |',
    '| 🟠 HIGH | `docs/NAMING_AUTHORITY.md` | Canonical surface / route / AI names |',
    '| 🟠 HIGH | `docs/FEATURE_STATUS.md` | Current implementation status |',
    '| 🟡 MED  | `REPO_STATE.md` | Full auto-generated repo analysis |',
    '',
    `### Live build stats`,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Routes | ~${routeCount} (${pageCount} pages + ${apiCount} API handlers) |`,
    `| Test files | ${testCount} |`,
    `| Phase | Phase 8 — Real Runtime Completion |`,
  ];

  try {
    appendFileSync(summaryFile, lines.join('\n') + '\n');
  } catch {
    // GITHUB_STEP_SUMMARY may not be writable in local runs — silently skip
  }
}

// ── 6. Build the new Recent Changes table row ─────────────────────────────────

const newRow =
  `| \`${sha}\` | ${utcDate} | ${branch} | ${actor} | ${statLine} | ${cell(message)} |`;

// ── 7. Read README ────────────────────────────────────────────────────────────

let doc = readFileSync(README, 'utf8');

// ── 8. Update or insert AI Agent Context block ────────────────────────────────

const contextBlock = buildAIContextBlock();
const ctxStart = doc.indexOf(AI_CTX_START);
const ctxEnd   = doc.indexOf(AI_CTX_END);

if (ctxStart !== -1 && ctxEnd !== -1 && ctxEnd > ctxStart) {
  // Markers exist — replace everything from START to end of END line
  const afterEnd = ctxEnd + AI_CTX_END.length;
  doc = doc.slice(0, ctxStart) + contextBlock + doc.slice(afterEnd);
} else {
  // Markers absent — insert block right before "## Recent Changes"
  const rcIdx = doc.indexOf('\n## Recent Changes');
  const insertAt = rcIdx !== -1 ? rcIdx + 1 : doc.indexOf('\n\n') + 2;
  doc = doc.slice(0, insertAt) + contextBlock + '\n\n' + doc.slice(insertAt);
}

// ── 9. Refresh the live File Structure block (between FILE-STRUCTURE markers) ─

const fileStructureBlock = `${FS_START}\n${buildFileStructure()}\n${FS_END}`;
const fsStartIdx = doc.indexOf(FS_START);
const fsEndIdx   = doc.indexOf(FS_END);

if (fsStartIdx !== -1 && fsEndIdx !== -1 && fsEndIdx > fsStartIdx) {
  doc = doc.slice(0, fsStartIdx) + fileStructureBlock + doc.slice(fsEndIdx + FS_END.length);
} else {
  const headingIdx = doc.indexOf('### 🗂️ File Structure');
  if (headingIdx !== -1) {
    const insertAt = doc.indexOf('\n', headingIdx) + 1;
    doc = doc.slice(0, insertAt) + fileStructureBlock + '\n' + doc.slice(insertAt);
  } else {
    doc = doc + '\n\n### 🗂️ File Structure\n' + fileStructureBlock + '\n';
  }
}

// ── 10. Refresh "Last updated" + "Build Status" inside "## Current Implementation Status" ───────

const STATUS_RE = /(## Current Implementation Status\n)((?:Last updated:[^\n]*\n)*)/;
const statusMatch = STATUS_RE.exec(doc);

if (statusMatch) {
  const newLine = `Last updated: ${utcDate} — \`${sha}\` by ${actor}\n`;
  doc = doc.slice(0, statusMatch.index) +
        statusMatch[1] + newLine +
        doc.slice(statusMatch.index + statusMatch[0].length);
} else {
  const h1end = doc.indexOf('\n') + 1;
  doc = doc.slice(0, h1end) +
        `\n_Last updated: ${utcDate} — \`${sha}\` by ${actor}_\n` +
        doc.slice(h1end);
}

// Also refresh the "Build Status:" line inside that section with live counts
doc = doc.replace(
  /^Build Status:.*$/m,
  `Build Status: ${routeCount} routes (${pageCount} pages + ${apiCount} API handlers) · ${testCount} test files`
);

// ── 11. Update the "## Recent Changes" table ──────────────────────────────────

const TABLE_HEADER   = '| Revision | Date / Time (UTC) | Branch | Author | Files | Summary |';
const TABLE_DIVIDER  = '|---|---|---|---|---|---|';
const SECTION_ANCHOR = '## Recent Changes';

const sectionIdx = doc.indexOf(SECTION_ANCHOR);

if (sectionIdx === -1) {
  const hrIdx    = doc.indexOf('\n---\n');
  const insertAt = hrIdx === -1 ? doc.length : hrIdx;
  const freshSection =
    `\n${SECTION_ANCHOR}\n\n${TABLE_HEADER}\n${TABLE_DIVIDER}\n${newRow}\n\n`;
  doc = doc.slice(0, insertAt) + freshSection + doc.slice(insertAt);
  writeFileSync(README, doc);
  writeSummary('inserted fresh Recent Changes section');
  console.log(`✅  README.md — inserted fresh Recent Changes section (${sha})`);
  process.exit(0);
}

const afterSection = sectionIdx + SECTION_ANCHOR.length;
const headerIdx    = doc.indexOf(TABLE_HEADER, afterSection);

if (headerIdx === -1) {
  const nextH2   = doc.indexOf('\n## ', afterSection);
  const blockEnd = nextH2 === -1 ? doc.length : nextH2 + 1;
  const freshTable = `\n\n${TABLE_HEADER}\n${TABLE_DIVIDER}\n${newRow}\n\n`;
  doc = doc.slice(0, afterSection) + freshTable + doc.slice(blockEnd);
  writeFileSync(README, doc);
  writeSummary('rebuilt Recent Changes table');
  console.log(`✅  README.md — rebuilt Recent Changes table (${sha})`);
  process.exit(0);
}

const headerLineEnd = doc.indexOf('\n', headerIdx) + 1;
const dividerEnd    = doc.indexOf('\n', headerLineEnd) + 1;

let pos = dividerEnd;
const existingRows = [];
while (pos < doc.length) {
  const end  = doc.indexOf('\n', pos);
  if (end === -1) break;
  const line = doc.slice(pos, end);
  if (!line.startsWith('|')) break;
  existingRows.push(line);
  pos = end + 1;
}

const updatedRows = [newRow, ...existingRows].slice(0, MAX_ROWS);
const headerLine  = doc.slice(headerIdx, headerLineEnd).trimEnd();
const dividerLine = doc.slice(headerLineEnd, dividerEnd).trimEnd();
const newTable    = headerLine + '\n' + dividerLine + '\n' + updatedRows.join('\n') + '\n';

doc = doc.slice(0, headerIdx) + newTable + doc.slice(pos);

writeFileSync(README, doc);
writeSummary('updated Recent Changes + AI Agent Quick Reference block');
console.log(`✅  README.md updated — ${sha} prepended to Recent Changes`);
