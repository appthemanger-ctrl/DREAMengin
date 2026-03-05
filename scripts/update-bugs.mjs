#!/usr/bin/env node
/**
 * scripts/update-bugs.mjs
 *
 * Auto-generates docs/BUGS.md on every push.
 *
 * What it writes:
 *  1. Final vision  — what DREAMengin is supposed to be when complete
 *                     (sourced from SPEC.md + ARCHITECTURE.md + AXIOMS.md).
 *  2. Open issues   — every 🔶 Partly done / 🔲 Needs work item parsed from
 *                     docs/FEATURE_STATUS.md.
 *  3. Known bugs    — TODO / FIXME / HACK annotations found in .ts/.tsx source files.
 *  4. Upgrade queue — ordered list of priorities from docs/LAW.md §10.2.
 *  5. Change header — commit that triggered this regeneration.
 *
 * Called by .github/workflows/update-bugs.yml after every push.
 * Can also be run locally: node scripts/update-bugs.mjs
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { readdirSync, statSync } from 'fs';
import { resolve, dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');
const BUGS_OUT  = resolve(ROOT, 'docs/BUGS.md');

// ── helpers ──────────────────────────────────────────────────────────────────

function git(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function readDoc(relPath) {
  const abs = resolve(ROOT, relPath);
  return existsSync(abs) ? readFileSync(abs, 'utf8') : '';
}

// ── git metadata ─────────────────────────────────────────────────────────────

const sha     = (process.env.GITHUB_SHA      || git('git rev-parse HEAD')).slice(0, 7);
const branch  = (process.env.GITHUB_REF_NAME || git('git rev-parse --abbrev-ref HEAD'));
const actor   = (process.env.GITHUB_ACTOR    || git('git log -1 --format=%an'));
const rawDate = git('git log -1 --format=%aI');
const message = git('git log -1 --format=%s');
const utcDate = rawDate
  ? new Date(rawDate).toISOString().replace('T', ' ').replace(/:\d{2}\.\d{3}Z$/, ' UTC')
  : new Date().toISOString().replace('T', ' ').replace(/:\d{2}\.\d{3}Z$/, ' UTC');

// ── parse FEATURE_STATUS.md for incomplete items ──────────────────────────────

function parseFeatureStatus() {
  const raw = readDoc('docs/FEATURE_STATUS.md');
  if (!raw) return { partlyDone: [], needsWork: [], upgradeQueue: [] };

  const partlyDone = [];
  const needsWork  = [];

  // Match table rows that contain 🔶 or 🔲
  const rowRe = /^\|([^|]+)\|([^|]+)\|([^|]*)\|/gm;
  let m;
  while ((m = rowRe.exec(raw)) !== null) {
    const feature = m[1].trim();
    const status  = m[2].trim();
    const notes   = m[3] ? m[3].trim() : '';
    if (status.includes('🔶')) {
      partlyDone.push({ feature, notes });
    } else if (status.includes('🔲')) {
      needsWork.push({ feature, notes });
    }
  }

  // Pull upgrade priorities list (numbered lines after "## Upgrade Priorities")
  const upgradeSection = raw.match(/## Upgrade Priorities[\s\S]*?(?=\n---|\n## |$)/);
  const upgradeQueue = [];
  if (upgradeSection) {
    const lines = upgradeSection[0].split('\n');
    for (const line of lines) {
      const match = line.match(/^\d+\.\s+⬆️\s+\*\*(.+?)\*\*\s*(?:—\s*(.*))?$/);
      if (match) upgradeQueue.push({ title: match[1], detail: match[2] || '' });
    }
  }

  return { partlyDone, needsWork, upgradeQueue };
}

// ── scan source files for TODO / FIXME / HACK ────────────────────────────────

const ANNOTATION_RE = /\/\/\s*(TODO|FIXME|HACK|BUG)\b[:\s]*(.*)/i;
const SOURCE_DIRS   = ['app', 'components', 'lib', 'hooks', 'src'];
const MAX_ANNOTS    = 60; // cap to keep doc readable

function* walkFiles(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || entry === 'node_modules') continue;
    const abs = join(dir, entry);
    try {
      const st = statSync(abs);
      if (st.isDirectory()) {
        yield* walkFiles(abs);
      } else if (['.ts', '.tsx'].includes(extname(abs))) {
        yield abs;
      }
    } catch {
      // skip unreadable
    }
  }
}

function scanAnnotations() {
  const found = [];
  for (const dir of SOURCE_DIRS) {
    for (const file of walkFiles(resolve(ROOT, dir))) {
      const rel   = file.replace(ROOT + '/', '');
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        const m = ANNOTATION_RE.exec(line);
        if (m) {
          found.push({ file: rel, line: i + 1, kind: m[1].toUpperCase(), text: m[2].trim() });
          if (found.length >= MAX_ANNOTS) return;
        }
      });
      if (found.length >= MAX_ANNOTS) break;
    }
    if (found.length >= MAX_ANNOTS) break;
  }
  return found;
}

// ── section builders ──────────────────────────────────────────────────────────

function buildHeader() {
  return `# DREAMengin — BUGS & Open Issues

> **Auto-generated** by \`scripts/update-bugs.mjs\` on every push.  
> **Do not edit manually** — your changes will be overwritten on the next push.  
> To change what appears here, update \`docs/FEATURE_STATUS.md\` or the source code.

**Last updated:** ${utcDate}  
**Triggered by commit:** \`${sha}\` on \`${branch}\` by ${actor}  
**Commit message:** ${message || '(no message)'}`;
}

function buildFinalVision() {
  return `---

## 🏆 Final Vision — What DREAMengin Is Supposed to Be

DREAMengin is a **spatial, gesture-driven creative OS** built on Next.js (App Router) + Supabase.
It is not a website. It is not a social media feed. It is a **personal operating surface** where
every element is a live, interactive widget that the user owns, arranges, and publishes.

### Core product axioms (non-negotiable)

| # | Axiom | One-line rule |
|---|-------|---------------|
| 1 | Instant Understanding | No tutorial required. Every interaction self-reveals. |
| 2 | User-Shaped Space | Control through movement (drag, place). Not settings panels. |
| 3 | Real Capability | Every widget does real work — not just display. |
| 4 | Security by Default | Least privilege, RLS everywhere, no secrets to client. |
| 5 | Privacy by Design | Users own their data. Private by default. Deletable. |

### Navigation model

- The user is always conceptually inside **Home (node 0)**.
- All navigation is **τ-only** — deterministic state transitions, not browser routing.
- The **Golden Button** (Blue + Gold floating pair) is the only travel system.
- Traditional nav bars and back-stacks are **not part of the product**.

### UI design system

- **Sky-blue + gold gradient** throughout — no dark gamer colors, no indigo.
- **Frosted glass** surfaces (\`.de-surface\`, \`.de-widget\`).
- **Space Grotesk** font. Consistent radius family (6 / 10 / 14 / 18 / 24 / 32 / 9999 px).
- Every page uses \`de-sky-bg\` + \`de-widget\` glass cards.

### AI Triad

| Agent | Role | Audience |
|-------|------|----------|
| **Dr. Eams** | User assistant / OS voice | All authenticated users |
| **IDARi** | Admin bug-fixer + optimizer | Admins only |
| **TheBoogieMan** | Policy enforcer + overwatch | System / Admins only |

All three must approve (consensus gating) before any major system update is shipped.

### What "done" looks like

When DREAMengin is complete:

- A new user opens the app, sees the animated logo, and can explore without any tutorial.
- They never feel lost — the Golden Button always takes them home.
- Every Daydream (7 total) is a fully functional mini-app.
- Their profile is a live, curated public page they can share.
- The feed shows real content from real connectors.
- All games are playable on mobile with two thumbs, on keyboard, and on PS5.
- Settings, appearance, privacy, data export/delete all work end-to-end.
- TheBoogieMan silently enforces the 100-rule policy with full audit logs and appeals.`;
}

function buildOpenIssues(partlyDone, needsWork) {
  const rows = (items, emoji) =>
    items.length
      ? items.map(({ feature, notes }) => `| ${emoji} | ${feature} | ${notes || '—'} |`).join('\n')
      : `| — | (none) | — |`;

  return `---

## 🔶 Partly Done (${partlyDone.length} items)

These features exist but are incomplete. They must be finished before the product ships.

| Status | Feature | Notes |
|--------|---------|-------|
${rows(partlyDone, '🔶')}

---

## 🔲 Needs Work (${needsWork.length} items)

These features are spec'd but not yet built. They are mandatory obligations per **docs/LAW.md §10**.

| Status | Feature | Notes |
|--------|---------|-------|
${rows(needsWork, '🔲')}`;
}

function buildUpgradeQueue(upgradeQueue) {
  if (!upgradeQueue.length) return '';
  const items = upgradeQueue
    .map((u, i) => `${i + 1}. **${u.title}**${u.detail ? ` — ${u.detail}` : ''}`)
    .join('\n');
  return `---

## ⬆️ Upgrade Queue (ordered by priority)

These are pulled from \`docs/FEATURE_STATUS.md\` and ordered per **docs/LAW.md §10.2**.

${items}`;
}

function buildAnnotations(annotations) {
  if (!annotations.length) {
    return `---

## 🐛 Known Code Annotations (TODO / FIXME / HACK)

No TODO / FIXME / HACK annotations found in source files.`;
  }

  const grouped = {};
  for (const a of annotations) {
    if (!grouped[a.kind]) grouped[a.kind] = [];
    grouped[a.kind].push(a);
  }

  const sections = Object.entries(grouped).map(([kind, items]) => {
    const emoji = kind === 'TODO' ? '📝' : kind === 'FIXME' ? '🔧' : kind === 'BUG' ? '🐛' : '⚠️';
    const rows = items
      .map(({ file, line, text }) => `| \`${file}:${line}\` | ${text || '(no description)'} |`)
      .join('\n');
    return `### ${emoji} ${kind} (${items.length})\n\n| Location | Description |\n|----------|-------------|\n${rows}`;
  });

  const truncNote = annotations.length >= MAX_ANNOTS
    ? `\n> ⚠️ Output capped at ${MAX_ANNOTS} annotations. Fix existing ones before adding new features.\n`
    : '';

  return `---

## 🐛 Known Code Annotations (TODO / FIXME / HACK)

${truncNote}${sections.join('\n\n')}`;
}

function buildFooter() {
  return `---

## 📚 Reference Docs

| Document | Purpose |
|----------|---------|
| [docs/LAW.md](./LAW.md) | Binding rules — code must conform |
| [docs/AXIOMS.md](./AXIOMS.md) | Non-negotiable product principles |
| [docs/SPEC.md](./SPEC.md) | Design system + interaction model |
| [docs/ARCHITECTURE.md](./ARCHITECTURE.md) | Navigation + platform architecture |
| [docs/SECURITY.md](./SECURITY.md) | RLS, auth boundaries, privacy |
| [docs/FEATURE_STATUS.md](./FEATURE_STATUS.md) | Live feature completion status |
| [docs/HANDOFF.md](./HANDOFF.md) | Session-by-session change log |

---

*Generated by \`scripts/update-bugs.mjs\` · Committed by \`github-actions[bot]\` · [skip ci]*`;
}

// ── main ─────────────────────────────────────────────────────────────────────

(function main() {
  console.log('🐛 DREAMengin BUGS.md Generator\n');

  const { partlyDone, needsWork, upgradeQueue } = parseFeatureStatus();
  console.log(`  📋 Parsed FEATURE_STATUS.md — ${partlyDone.length} partly done, ${needsWork.length} needs work`);

  const annotations = scanAnnotations();
  console.log(`  🔍 Scanned source files — ${annotations.length} annotations found`);

  const sections = [
    buildHeader(),
    buildFinalVision(),
    buildOpenIssues(partlyDone, needsWork),
    buildUpgradeQueue(upgradeQueue),
    buildAnnotations(annotations),
    buildFooter(),
  ];

  const output = sections.join('\n\n') + '\n';

  writeFileSync(BUGS_OUT, output, 'utf8');
  const kb = (Buffer.byteLength(output, 'utf8') / 1024).toFixed(1);
  console.log(`\n✅  docs/BUGS.md written — ${kb} KB, ${output.split('\n').length} lines`);
})();
