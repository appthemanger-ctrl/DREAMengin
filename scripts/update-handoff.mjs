#!/usr/bin/env node
/**
 * scripts/update-handoff.mjs
 *
 * Automatically updates docs/HANDOFF.md after every push.
 *
 * What it does:
 *  1. Reads the latest commit from git (hash, message, author, datetime, stats).
 *  2. Builds a new timeline row with every file changed (added / modified / deleted).
 *  3. Prepends the row into the "Change Timeline" table inside HANDOFF.md.
 *  4. Keeps exactly the 5 most-recent entries; older ones are trimmed.
 *
 * Called by .github/workflows/update-handoff.yml after every push.
 * Can also be run locally: node scripts/update-handoff.mjs
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');
const HANDOFF   = resolve(ROOT, 'docs/HANDOFF.md');
const MAX_ROWS  = 5;

// ── 1. Collect git metadata ────────────────────────────────────────────────────

function git(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
}

const sha      = (process.env.GITHUB_SHA   || git('git rev-parse HEAD')).slice(0, 7);
const branch   = (process.env.GITHUB_REF_NAME || git('git rev-parse --abbrev-ref HEAD'));
const actor    = (process.env.GITHUB_ACTOR || git('git log -1 --format=%an'));
const rawDate  = git('git log -1 --format=%aI');           // ISO 8601
const message  = git('git log -1 --format=%s');
const body     = git('git log -1 --format=%b').replace(/\n/g, ' ').trim();

// Human-readable UTC datetime, e.g. "2026-03-05 04:30 UTC"
const utcDate = new Date(rawDate)
  .toISOString()
  .replace('T', ' ')
  .replace(/:\d{2}\.\d{3}Z$/, ' UTC');

// ── 2. Collect file-change stats ──────────────────────────────────────────────

// --name-status gives lines like:  M  app/login/page.tsx
//                                   A  lib/supabase/env.ts
//                                   D  old-file.ts
const nameStatus = git('git diff-tree --no-commit-id -r --name-status HEAD');
const lines = nameStatus.split('\n').filter(Boolean);

const added    = lines.filter(l => l.startsWith('A')).map(l => l.replace(/^A\s+/, ''));
const modified = lines.filter(l => l.startsWith('M')).map(l => l.replace(/^M\s+/, ''));
const deleted  = lines.filter(l => l.startsWith('D')).map(l => l.replace(/^D\s+/, ''));
const renamed  = lines.filter(l => l.startsWith('R')).map(l => l.replace(/^R\d*\s+/, ''));

// Compact stat line, e.g. "+3 files  −1 file  ~5 files"
const statParts = [];
if (added.length)    statParts.push(`+${added.length} added`);
if (deleted.length)  statParts.push(`−${deleted.length} deleted`);
if (modified.length) statParts.push(`~${modified.length} modified`);
if (renamed.length)  statParts.push(`→${renamed.length} renamed`);
const statLine = statParts.join('  ') || 'no file changes';

// Build a compact file list (max 12 entries to keep the table readable)
function formatList(arr, prefix) {
  if (!arr.length) return '';
  const shown = arr.slice(0, 12);
  const extra = arr.length - shown.length;
  let out = shown.map(f => `\`${f}\``).join(', ');
  if (extra > 0) out += ` … +${extra} more`;
  return `${prefix}: ${out}`;
}

const fileParts = [
  formatList(added,    '➕'),
  formatList(modified, '✏️'),
  formatList(deleted,  '🗑️'),
  formatList(renamed,  '🔀'),
].filter(Boolean).join('<br>');

// ── 3. Build the new table row ────────────────────────────────────────────────

// Escape pipe chars inside cell content
function cell(s) { return s.replace(/\|/g, '\\|').replace(/\n/g, ' '); }

const summary = cell(body ? `${message} — ${body}` : message);
const newRow  =
  `| **auto** | ${utcDate} | \`${sha}\` | ${branch} | ${actor} | ` +
  `${statLine}<br>${summary}<br>${fileParts} |`;

// ── 4. Read, update, write HANDOFF.md ─────────────────────────────────────────

let doc = readFileSync(HANDOFF, 'utf8');

// Locate the table: header row + divider + data rows
const TABLE_HEADER_RE =
  /\|\s*#\s*\|\s*Date[^|]*\|\s*Revision[^|]*\|\s*Branch[^|]*\|\s*Author[^|]*\|\s*Summary[^|]*\|\s*\n/;
const headerMatch = TABLE_HEADER_RE.exec(doc);

if (!headerMatch) {
  // Table not found — insert a fresh one after the h2 "Change Timeline"
  const h2 = doc.indexOf('## Change Timeline');
  if (h2 === -1) {
    console.error('❌  Could not find "## Change Timeline" section in HANDOFF.md');
    process.exit(1);
  }
  const insertAt = doc.indexOf('\n', h2) + 1;
  const freshTable =
    '\n| # | Date / Time (UTC) | Revision | Branch | Author | Summary |\n' +
    '|---|---|---|---|---|---|\n' +
    `${newRow}\n`;
  doc = doc.slice(0, insertAt) + freshTable + doc.slice(insertAt);
  writeFileSync(HANDOFF, doc);
  console.log(`✅  HANDOFF.md — inserted fresh timeline table (${sha})`);
  process.exit(0);
}

// Find the divider row (second line of the table)
const afterHeader = doc.indexOf('\n', headerMatch.index) + 1;
const dividerEnd  = doc.indexOf('\n', afterHeader) + 1;

// Collect existing data rows
const afterDivider = dividerEnd;
let pos = afterDivider;
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

// Rebuild table
const headerLine  = headerMatch[0].trimEnd();
const dividerLine = doc.slice(afterHeader, dividerEnd).trimEnd();
const newTable    = headerLine + '\n' + dividerLine + '\n' + updatedRows.join('\n') + '\n';

// Replace old table block in the document
const oldTableStart = headerMatch.index;
const oldTableEnd   = pos; // first non-table line
doc = doc.slice(0, oldTableStart) + newTable + doc.slice(oldTableEnd);

writeFileSync(HANDOFF, doc);
console.log(`✅  HANDOFF.md updated — ${sha} prepended (${statLine})`);
