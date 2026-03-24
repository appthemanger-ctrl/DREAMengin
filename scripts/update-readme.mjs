#!/usr/bin/env node
/**
 * scripts/update-readme.mjs
 *
 * Automatically updates README.md after every push.
 *
 * What it does:
 *  1. Reads the latest commit metadata (hash, message, author, datetime, files).
 *  2. Refreshes the "Last updated" line inside "## Current Implementation Status".
 *  3. Prepends a new row into the "## Recent Changes" table (created if absent).
 *  4. Keeps exactly MAX_ROWS recent entries; older ones are trimmed.
 *
 * Called by .github/workflows/update-readme.yml on every push.
 * Can also be run locally: node scripts/update-readme.mjs
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');
const README    = resolve(ROOT, 'README.md');
const MAX_ROWS  = 10;

// ── 1. Collect git metadata ────────────────────────────────────────────────────

function git(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
}

const sha     = (process.env.GITHUB_SHA      || git('git rev-parse HEAD')).slice(0, 7);
const branch  = (process.env.GITHUB_REF_NAME || git('git rev-parse --abbrev-ref HEAD'));
const actor   = (process.env.GITHUB_ACTOR    || git('git log -1 --format=%an'));
const rawDate = git('git log -1 --format=%aI');
const message = git('git log -1 --format=%s');

// Human-readable UTC datetime, e.g. "2026-03-24 17:56 UTC"
const utcDate = new Date(rawDate)
  .toISOString()
  .replace('T', ' ')
  .replace(/:\d{2}\.\d{3}Z$/, ' UTC');

// ── 2. Collect file-change stats ──────────────────────────────────────────────

const nameStatus = git('git diff-tree --no-commit-id -r --name-status HEAD');
const lines      = nameStatus.split('\n').filter(Boolean);

const added    = lines.filter(l => l.startsWith('A')).length;
const modified = lines.filter(l => l.startsWith('M')).length;
const deleted  = lines.filter(l => l.startsWith('D')).length;

const statParts = [];
if (added)    statParts.push(`+${added}`);
if (deleted)  statParts.push(`−${deleted}`);
if (modified) statParts.push(`~${modified}`);
const statLine = statParts.length ? statParts.join(' ') : '—';

// ── 3. Build the new table row ────────────────────────────────────────────────

function cell(s) { return s.replace(/\|/g, '\\|').replace(/\n/g, ' '); }

const newRow =
  `| \`${sha}\` | ${utcDate} | ${branch} | ${actor} | ${statLine} | ${cell(message)} |`;

// ── 4. Read README ────────────────────────────────────────────────────────────

let doc = readFileSync(README, 'utf8');

// ── 5. Refresh "Last updated" inside "## Current Implementation Status" ───────

// Replace or insert a "Last updated:" line after the section heading
const STATUS_SECTION_RE = /(## Current Implementation Status\n(?:[^\n]*\n)*?)(Last updated:[^\n]*\n)?/;
const statusMatch = STATUS_SECTION_RE.exec(doc);

if (statusMatch) {
  const before  = statusMatch[1];
  const newLine  = `Last updated: ${utcDate} — \`${sha}\` by ${actor}\n`;
  doc = doc.slice(0, statusMatch.index) +
        before + newLine +
        doc.slice(statusMatch.index + statusMatch[0].length);
} else {
  // Fallback: insert after first blank line following the h1
  const h1end = doc.indexOf('\n') + 1;
  doc = doc.slice(0, h1end) +
        `\n_Last updated: ${utcDate} — \`${sha}\` by ${actor}_\n` +
        doc.slice(h1end);
}

// ── 6. Update the "## Recent Changes" table ───────────────────────────────────

const TABLE_HEADER = '| Revision | Date / Time (UTC) | Branch | Author | Files | Summary |';
const TABLE_DIVIDER = '|---|---|---|---|---|---|';

const SECTION_ANCHOR = '## Recent Changes';
const sectionIdx = doc.indexOf(SECTION_ANCHOR);

if (sectionIdx === -1) {
  // Section absent — insert it right before the first "---" separator
  const hrIdx = doc.indexOf('\n---\n');
  const insertAt = hrIdx === -1 ? doc.length : hrIdx;

  const freshSection =
    `\n${SECTION_ANCHOR}\n\n` +
    `${TABLE_HEADER}\n` +
    `${TABLE_DIVIDER}\n` +
    `${newRow}\n\n`;

  doc = doc.slice(0, insertAt) + freshSection + doc.slice(insertAt);
  writeFileSync(README, doc);
  console.log(`✅  README.md — inserted fresh Recent Changes section (${sha})`);
  process.exit(0);
}

// Section exists — find the table inside it
const afterSection = sectionIdx + SECTION_ANCHOR.length;
const headerIdx    = doc.indexOf(TABLE_HEADER, afterSection);

if (headerIdx === -1) {
  // Table header missing inside section — replace everything between the
  // section heading and the next h2 (or end of file) with a fresh table.
  const nextH2 = doc.indexOf('\n## ', afterSection);
  const blockEnd = nextH2 === -1 ? doc.length : nextH2 + 1;

  const freshTable =
    `\n\n${TABLE_HEADER}\n${TABLE_DIVIDER}\n${newRow}\n\n`;

  doc = doc.slice(0, afterSection) + freshTable + doc.slice(blockEnd);
  writeFileSync(README, doc);
  console.log(`✅  README.md — rebuilt Recent Changes table (${sha})`);
  process.exit(0);
}

// Table exists — find the divider, then collect existing data rows
const headerLineEnd = doc.indexOf('\n', headerIdx) + 1;
const dividerEnd    = doc.indexOf('\n', headerLineEnd) + 1;

let pos = dividerEnd;
const existingRows = [];
while (pos < doc.length) {
  const end = doc.indexOf('\n', pos);
  if (end === -1) break;
  const line = doc.slice(pos, end);
  if (!line.startsWith('|')) break;
  existingRows.push(line);
  pos = end + 1;
}

// Prepend new row, keep only MAX_ROWS
const updatedRows = [newRow, ...existingRows].slice(0, MAX_ROWS);

// Rebuild the table block
const headerLine  = doc.slice(headerIdx, headerLineEnd).trimEnd();
const dividerLine = doc.slice(headerLineEnd, dividerEnd).trimEnd();
const newTable    = headerLine + '\n' + dividerLine + '\n' + updatedRows.join('\n') + '\n';

doc = doc.slice(0, headerIdx) + newTable + doc.slice(pos);

writeFileSync(README, doc);
console.log(`✅  README.md updated — ${sha} prepended to Recent Changes`);
