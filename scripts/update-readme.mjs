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
 *  3. Regenerates the repo-aligned spec snapshot block and top-level README dates.
 *  4. Refreshes the "Last updated" line inside "## Current Implementation Status".
 *  5. Prepends a new row into the "## Recent Changes" table (created if absent).
 *  6. Keeps exactly MAX_ROWS recent entries; older ones are trimmed.
 *  7. Writes a rich GitHub Actions Step Summary (AI agent context + change info).
 *
 * Called by Idari[bot] via .github/workflows/update-readme.yml on every push and merge.
 * Can also be run locally: node scripts/update-readme.mjs
 */

import { execSync }                          from 'child_process';
import { readFileSync, writeFileSync,
         appendFileSync, readdirSync,
         existsSync }                        from 'fs';
import { resolve, dirname }                  from 'path';
import { fileURLToPath }                     from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');
const README    = resolve(ROOT, 'README.md');
const MAX_ROWS  = 10;
const DOC_OWNER = 'José Mancilla (appthemanger-ctrl)';

const AI_CTX_START = '<!-- DREAMENGIN-AI-CONTEXT:START -->';
const AI_CTX_END   = '<!-- DREAMENGIN-AI-CONTEXT:END -->';
const SPEC_SNAPSHOT_START = '<!-- DREAMENGIN-SPEC-SNAPSHOT:START -->';
const SPEC_SNAPSHOT_END   = '<!-- DREAMENGIN-SPEC-SNAPSHOT:END -->';
const USE_GITHUB_CONTEXT = process.env.README_UPDATE_USE_GITHUB_CONTEXT === 'true';
const CANONICAL_MAIN_BRANCH = process.env.README_CANONICAL_MAIN_BRANCH || 'completedream';

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

const sha     = ((USE_GITHUB_CONTEXT ? process.env.GITHUB_SHA : '')      || git('git rev-parse HEAD')).slice(0, 7);
const branch  = ((USE_GITHUB_CONTEXT ? process.env.GITHUB_REF_NAME : '') || git('git rev-parse --abbrev-ref HEAD'));
const actor   = ((USE_GITHUB_CONTEXT ? process.env.GITHUB_ACTOR : '')    || git('git log -1 --format=%an'));
const rawDate = git('git log -1 --format=%aI');
const message = git('git log -1 --format=%s');
const eventDate = new Date(rawDate || Date.now());
const packageVersion = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')).version || 'unknown';

// Human-readable UTC datetime, e.g. "2026-03-24 17:56 UTC"
const utcDate = eventDate
  .toISOString()
  .replace('T', ' ')
  .replace(/:\d{2}\.\d{3}Z$/, ' UTC');
const calendarDate = eventDate.toISOString().slice(0, 10);
const displayDate = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
}).format(eventDate);

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
**TypeScript**, **Supabase**, **Tailwind CSS**, and **Babylon.js 8+**.
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
| \`update-readme.yml\` | Every push | Updates README dates, the AI context block, the spec snapshot, and Recent Changes |
| \`update-handoff.yml\` | Every push | Prepends row to \`docs/HANDOFF.md\` change timeline |
| \`update-bugs.yml\` | Every push | Regenerates \`docs/BUGS.md\` from source annotations |
| \`sync-build-memory.yml\` | main/completedream/develop | Syncs \`build-memory/\` JSON snapshots |
| \`update-repo-state.yml\` | main/completedream/develop | Full repo analysis → \`REPO_STATE.md\` |
| \`dreamengin-preflight.yml\` | Push to \`completedream\` | Full CI: build + typecheck + tests |
| \`idari-daily.yml\` | Daily 06:00 UTC | IDARi daily improvement cycle (opens PR, never pushes direct) |

---

${AI_CTX_END}`;
}

function buildSpecSnapshotBlock() {
  return `${SPEC_SNAPSHOT_START}
## 🧭 Repo-Aligned Spec Snapshot
<!-- Last regenerated: ${utcDate} — \`${sha}\` on \`${branch}\` -->

> Auto-regenerated by \`scripts/update-readme.mjs\` on push and merge so the README spec stays aligned with the live repo.

### Product Model

- **Version:** ${packageVersion}
- **Runtime definition:** Privacy-first, DreamDM-Bar-led spatial operating environment
- **Canonical main branch:** \`${CANONICAL_MAIN_BRANCH}\`
- **Primary surface:** HomeDream Surface (\`/homedream\`)
- **Runtime seam:** DreamDM Bar
- **Secondary runtime:** DreamSpace — revealed by the DreamDM Bar and hidden when the bar is hidden

### Core Surface Map

| Surface | Canonical route | Repo support |
|---------|-----------------|--------------|
| HomeDream Surface | \`/homedream\` | \`/home\` |
| Edit ProfileDream Surface | \`/edit-profiledream\` | \`/edit-profile\` |
| View Profile Surface | \`/view-profile\` | \`/profile/[handle]\`, \`/profile\`, \`/u/[handle]\` |
| DreamShop Surface | \`/shop\` | \`/shop/sell\` |
| DreamMarketplace Surface | \`/marketplace\` | none |
| DreamDM Surface | \`/messages\` | none |
| DreamAds Surface | \`/ads\` | \`/ads/create\` |

### Daydream / Engin Network

- **6 Daydream surfaces** connect into **6 Engin runtimes** across **11 named connection paths**
- Music Daydream Surface → StarMakerEngin
- Games Daydream Surface → GameEngin
- Lab Daydream Surface → LabEngin
- Code Daydream Surface → CodeEngin
- Brand Daydream Surface → BrandingEngin
- Create Daydream Surface → ContentEngin

### Live Repo Snapshot

| Metric | Value |
|--------|-------|
| Product version | ${packageVersion} |
| App routes | ${pageCount} |
| API routes | ${apiCount} |
| Total routes | ${routeCount} |
| Workflow files | ${workflowCount} |
| Test files | ${testCount} |
| Node / package manager | Node 25 · pnpm 10.30.0 |
| AI triad routes | \`/api/ai/eams\`, \`/api/ai/idari\`, \`/api/ai/boogieman\` |

### Current Alignment Notes

- \`README.md\` remains the authoritative product specification; \`docs/ARCHITECTURE.md\` maps the current implementation to it.
- \`${CANONICAL_MAIN_BRANCH}\` is the canonical main branch and the branch Idari should treat as the primary merge target for spec freshness.
- Canonical vocabulary is **surface**, **Dream Window**, **DreamSpace**, and **runtime**.
- Support routes still exist beside canonical routes where the repo preserves backward compatibility.

${SPEC_SNAPSHOT_END}`;
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
    '- ✅ **Top-level README metadata** (documentation date + display date)',
    '- ✅ **AI Agent Quick Reference** block (top of README)',
    '- ✅ **Repo-Aligned Spec Snapshot** block',
    '- ✅ **Recent Changes** table (latest commit prepended)',
    '- ✅ **Current Implementation Status** — "Last updated" line',
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

// ── 8. Refresh top-level README metadata ──────────────────────────────────────

doc = doc.replace(
  /(> \*\*Documentation Date:\*\* ).*/m,
  `$1${calendarDate}`
);
doc = doc.replace(
  /^Date: .*$/m,
  `Date: ${displayDate}`
);

// ── 9. Update or insert AI Agent Context block ────────────────────────────────

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

// ── 10. Update or insert repo-aligned spec snapshot block ─────────────────────

const specBlock = buildSpecSnapshotBlock();
const specStart = doc.indexOf(SPEC_SNAPSHOT_START);
const specEnd   = doc.indexOf(SPEC_SNAPSHOT_END);

if (specStart !== -1 && specEnd !== -1 && specEnd > specStart) {
  const afterEnd = specEnd + SPEC_SNAPSHOT_END.length;
  doc = doc.slice(0, specStart) + specBlock + doc.slice(afterEnd);
} else {
  const afterCtx = doc.indexOf(AI_CTX_END);
  if (afterCtx !== -1) {
    const insertAt = afterCtx + AI_CTX_END.length;
    doc = doc.slice(0, insertAt) + '\n\n' + specBlock + doc.slice(insertAt);
  } else {
    const rcIdx = doc.indexOf('\n## Recent Changes');
    const insertAt = rcIdx !== -1 ? rcIdx + 1 : doc.indexOf('\n\n') + 2;
    doc = doc.slice(0, insertAt) + specBlock + '\n\n' + doc.slice(insertAt);
  }
}

// ── 11. Refresh "Last updated" + "Build Status" inside "## Current Implementation Status" ──────

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

// ── 12. Update the "## Recent Changes" table ──────────────────────────────────

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

const dedupedRows = existingRows.filter(line => !line.startsWith(`| \`${sha}\` |`));
const updatedRows = [newRow, ...dedupedRows].slice(0, MAX_ROWS);
const headerLine  = doc.slice(headerIdx, headerLineEnd).trimEnd();
const dividerLine = doc.slice(headerLineEnd, dividerEnd).trimEnd();
const newTable    = headerLine + '\n' + dividerLine + '\n' + updatedRows.join('\n') + '\n';

doc = doc.slice(0, headerIdx) + newTable + doc.slice(pos);

writeFileSync(README, doc);
writeSummary('updated Recent Changes + AI Agent Quick Reference block');
console.log(`✅  README.md updated — ${sha} prepended to Recent Changes`);
