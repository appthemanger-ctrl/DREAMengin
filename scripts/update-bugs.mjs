#!/usr/bin/env node
/**
 * scripts/update-bugs.mjs
 *
 * Auto-generates docs/BUGS.md on every push.
 *
 * What it writes:
 *  1. Final vision  — canonical runtime identity and completion state.
 *  2. Open issues   — every 🔶 Partly done / 🔲 Needs work item parsed from
 *                     docs/FEATURE_STATUS.md.
 *  3. Known bugs    — TODO / FIXME / HACK annotations found in .ts/.tsx source files.
 *  4. Upgrade queue — ordered list of priorities from docs/FEATURE_STATUS.md.
 *  5. Change header — commit that triggered this regeneration.
 *
 * Called by .github/workflows/update-bugs.yml after every push.
 * Can also be run locally: node scripts/update-bugs.mjs
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BUGS_OUT = resolve(ROOT, 'docs/BUGS.md');
const DOC_OWNER = 'José Mancilla (appthemanger-ctrl)';

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

const sha = (process.env.GITHUB_SHA || git('git rev-parse HEAD')).slice(0, 7);
const branch = process.env.GITHUB_REF_NAME || git('git rev-parse --abbrev-ref HEAD');
const actor = process.env.GITHUB_ACTOR || git('git log -1 --format=%an');
const rawDate = git('git log -1 --format=%aI');
const message = git('git log -1 --format=%s');
const utcDate = rawDate
  ? new Date(rawDate).toISOString().replace('T', ' ').replace(/:\d{2}\.\d{3}Z$/, ' UTC')
  : new Date().toISOString().replace('T', ' ').replace(/:\d{2}\.\d{3}Z$/, ' UTC');

// ── parse FEATURE_STATUS.md for incomplete items ─────────────────────────────

function parseFeatureStatus() {
  const raw = readDoc('docs/FEATURE_STATUS.md');
  if (!raw) return { partlyDone: [], needsWork: [], upgradeQueue: [] };

  const partlyDone = [];
  const needsWork = [];

  const rowRe = /^\|([^|]+)\|([^|]+)\|([^|]*)\|/gm;
  let m;
  while ((m = rowRe.exec(raw)) !== null) {
    const feature = m[1].trim();
    const status = m[2].trim();
    const notes = m[3] ? m[3].trim() : '';
    if (status.includes('🔶')) {
      partlyDone.push({ feature, notes });
    } else if (status.includes('🔲')) {
      needsWork.push({ feature, notes });
    }
  }

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
const SOURCE_DIRS = ['app', 'components', 'lib', 'hooks', 'src'];
const MAX_ANNOTS = 60;

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
      const rel = file.replace(ROOT + '/', '');
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

// ── section builders ─────────────────────────────────────────────────────────

function buildHeader() {
  return `# DREAMengin — BUGS & Open Issues

> **Auto-generated** by \`scripts/update-bugs.mjs\` on every push.  
> **Do not edit manually** — your changes will be overwritten on the next push.  
> To change what appears here, update \`docs/FEATURE_STATUS.md\` or the source code.

**Documentation Owner:** ${DOC_OWNER}  
**Documentation Date:** ${utcDate}  
**Last updated:** ${utcDate}  
**Triggered by commit:** \`${sha}\` on \`${branch}\` by ${actor}  
**Commit message:** ${message || '(no message)'}`;
}

function buildFinalVision() {
  return `---

## 🏆 Final Vision — What DREAMengin Is Supposed to Be

DREAMengin is a **dual-runtime, spatial creative operating environment** built on Next.js (App Router) + Supabase.

It is not defined as a conventional page-based website. It is a **personal operating surface** where users move through connected live surfaces, modular runtime containers, and powered Engin layers while preserving context.

### Core product axioms (non-negotiable)

| # | Axiom | One-line rule |
|---|-------|---------------|
| 1 | Instant Understanding | No tutorial required. Every interaction self-reveals. |
| 2 | User-Shaped Space | Control through movement, placement, and direct interaction. |
| 3 | Real Capability | Every visible action does real work. |
| 4 | Security by Default | Least privilege, RLS everywhere, no secrets to client. |
| 5 | Privacy by Design | Users own their data. Private by default. Deletable. |

### Runtime model

- DREAMengin operates as a **dual-runtime spatial system**.
- **Surface Space** is the upper active runtime region.
- **DreamSpace** is the lower modular runtime region.
- The **DreamDM Bar** is the persistent interaction rail, runtime seam, and draggable divider between the two active spaces.
- The **Gold Button** is the primary travel control for returning home and opening system navigation.
- Navigation must feel like depth, continuity, and state-preserving movement — not page loss or world reset.

### Core system structure

- **HomeDream** is the root private operating surface.
- **EditProfileDream** is the private profile builder surface.
- **ViewProfile** is the public/shared output surface.
- **6 Daydream surfaces** form the lived creative domains.
- **6 Engin runtimes** form the powered execution / emulator layer.
- The Daydream / Engin system is a **multi-connection network**, not a strict one-to-one pairing.
- The system supports **11 connection paths** across different scopes and work resolutions.

### UI design system

- **Gold / light blue / white** premium palette throughout.
- **Frosted glass** surfaces (\`.de-surface\`, \`.de-widget\`).
- **Space Grotesk** font.
- Consistent radius family (6 / 10 / 14 / 18 / 24 / 32 / 9999 px).
- Surfaces should feel calm, premium, spatial, and uncluttered.

### AI Triad

| Agent | Role | Audience |
|-------|------|----------|
| **Dr. Eams** | User assistant / routing / discovery | All authenticated users |
| **IDARi** | Admin bug-fixer + optimizer | Admins only |
| **TheBoogieMan.Ai** | Policy enforcer + system overwatch | System / Admins only |

All three must approve (consensus gating) before any major system update is shipped.

### What "done" looks like

When DREAMengin is complete:

- A new user opens the runtime and can explore without a tutorial.
- They remain oriented because HomeDream, DreamSpace, the DreamDM Bar, and the Gold Button preserve continuity.
- Every Daydream (**6 total**) is a fully functional lived creative surface.
- Every Engin runtime powers real work and connects truthfully into the wider system.
- Their profile is a live, curated public output they can explicitly control.
- The feed shows real content from real connectors and real system activity.
- Games are playable across supported input modes and devices.
- Settings, appearance, privacy, data export, and deletion all work end-to-end.
- TheBoogieMan.Ai silently enforces policy with auditability and appeals.`;
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
    const emoji =
      kind === 'TODO' ? '📝' :
      kind === 'FIXME' ? '🔧' :
      kind === 'BUG' ? '🐛' : '⚠️';

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
