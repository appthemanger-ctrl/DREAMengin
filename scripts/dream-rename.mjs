#!/usr/bin/env node
/**
 * dream-rename.mjs
 *
 * Renames source files to conform to the DREAMengin naming spec and rewrites
 * all affected import paths across the entire repository.
 *
 * Source of truth: config/namespaces.json
 *
 * ── Modes ───────────────────────────────────────────────────────────────────
 *
 *   --generate-map [output.json]
 *       Scan the repo and emit a suggested rename-map.json you can edit before
 *       running --apply. Writes to stdout or the path you provide.
 *
 *   --dry-run  --map <rename-map.json>
 *       Preview every file move and import rewrite without touching the disk.
 *
 *   --apply  --map <rename-map.json>
 *       Rename files on disk and rewrite all imports. Commits nothing.
 *
 * ── Rename-map format ───────────────────────────────────────────────────────
 *
 *   A JSON array of rename entries:
 *   [
 *     {
 *       "from": "components/DreamDMBar.tsx",   // relative to repo root
 *       "to":   "dream.dreamdmbar.tsx"          // flat name in repo root
 *     },
 *     ...
 *   ]
 *
 *   You may also specify a destination directory with a leading path segment,
 *   but the spec requires flat root placement — i.e. just the filename.
 *
 * ── Examples ────────────────────────────────────────────────────────────────
 *
 *   node scripts/dream-rename.mjs --generate-map scripts/rename-map.json
 *   node scripts/dream-rename.mjs --dry-run  --map scripts/rename-map.json
 *   node scripts/dream-rename.mjs --apply    --map scripts/rename-map.json
 */

import {
  readFileSync, writeFileSync, renameSync,
  readdirSync, statSync, existsSync,
} from 'node:fs';
import { resolve, join, relative, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Bootstrap ───────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);

const MODE_GENERATE = args.includes('--generate-map');
const MODE_DRY = args.includes('--dry-run');
const MODE_APPLY = args.includes('--apply');

if (!MODE_GENERATE && !MODE_DRY && !MODE_APPLY) {
  console.error(
    'Usage:\n' +
    '  node scripts/dream-rename.mjs --generate-map [output.json]\n' +
    '  node scripts/dream-rename.mjs --dry-run  --map <rename-map.json>\n' +
    '  node scripts/dream-rename.mjs --apply    --map <rename-map.json>\n'
  );
  process.exit(1);
}

// ─── Load namespace config ────────────────────────────────────────────────────

const namespacesPath = join(ROOT, 'config', 'namespaces.json');
if (!existsSync(namespacesPath)) {
  console.error(`✗ Missing config/namespaces.json`);
  process.exit(1);
}
const { namespaces } = JSON.parse(readFileSync(namespacesPath, 'utf8'));

// Flat list: { prefix, subtype }
const nsEntries = Object.entries(namespaces).flatMap(([prefix, subtypes]) =>
  subtypes.map(sub => ({ prefix, sub }))
);

// ─── Helper: collect source files ─────────────────────────────────────────────

const SCAN_DIRS = ['components', 'lib', 'app', 'engins', 'games', 'coresurfaces', 'src'];

function collectFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectFiles(full));
    } else if (/\.(tsx?|jsx?)$/.test(entry) && !entry.endsWith('.d.ts')) {
      results.push(full);
    }
  }
  return results;
}

function collectRootFiles() {
  return readdirSync(ROOT)
    .filter(f => /\.(tsx?|jsx?)$/.test(f) && !f.endsWith('.d.ts') && statSync(join(ROOT, f)).isFile())
    .map(f => join(ROOT, f));
}

const ALL_FILES = [
  ...collectRootFiles(),
  ...SCAN_DIRS.flatMap(d => collectFiles(join(ROOT, d))),
];

// ─── Already-spec-named detection ─────────────────────────────────────────────

const SPEC_PREFIX_RE = /^(engin|dreamsurface|dream)\.[a-z0-9]+\.(ts|tsx)$/;

function alreadyCompliant(filename) {
  return SPEC_PREFIX_RE.test(filename);
}

// ─── Suggest a spec name for a given file ────────────────────────────────────
//
//  Heuristic:
//  1. The file's directory gives a namespace hint.
//  2. The file's base name, stripped of PascalCase separations and lowercased,
//     becomes the <name> segment.
//  3. We pick prefix by directory:
//       components/         → dream.*
//       lib/engin*|engins/* → engin.*
//       lib/dreamsurface*   → dreamsurface.*
//       coresurfaces/*      → dreamsurface.*
//       lib/* (other)       → engin.*   (fallback for logic files)
//       app/*               → dream.*   (interactive)
//  4. Extension mirrors the prefix rule: engin → .ts, dreamsurface → .tsx, dream → .tsx
//
//  Returns null when the file clearly shouldn't be migrated (config, tests, etc.)

const SKIP_RE = /\.(config|test|spec|d)\.(ts|tsx|js|jsx)$|__tests__|\.stories\./;

function suggestName(filePath) {
  const rel = relative(ROOT, filePath);
  const name = basename(filePath);
  const ext = extname(name);
  const stem = name.replace(/\.(tsx?|jsx?)$/, '');

  if (SKIP_RE.test(name)) return null;
  if (alreadyCompliant(name)) return null; // already good
  if (!/^\.(tsx?|jsx?)$/.test(ext)) return null;

  // Determine prefix from directory
  const parts = rel.split('/');
  const topDir = parts[0];

  let prefix;
  if (topDir === 'components' || topDir === 'app') {
    prefix = 'dream';
  } else if (topDir === 'coresurfaces') {
    prefix = 'dreamsurface';
  } else if (topDir === 'engins') {
    prefix = 'engin';
  } else if (topDir === 'lib') {
    const subDir = parts[1] || '';
    if (subDir.startsWith('dreamsurface') || subDir === 'babylon' || subDir === 'daydream') {
      prefix = 'dreamsurface';
    } else {
      // Default lib → engin (logic layer)
      prefix = 'engin';
    }
  } else {
    return null; // don't guess for unknown dirs
  }

  // Derive the <name> segment: lowercase the stem
  const slug = stem.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!slug) return null;

  const destExt = prefix === 'engin' ? '.ts' : '.tsx';
  return `${prefix}.${slug}${destExt}`;
}

// ─── --generate-map ───────────────────────────────────────────────────────────

if (MODE_GENERATE) {
  const outputArg = args[args.indexOf('--generate-map') + 1];
  const outputPath = outputArg && !outputArg.startsWith('-')
    ? resolve(ROOT, outputArg)
    : null;

  const map = [];

  for (const filePath of ALL_FILES) {
    const suggested = suggestName(filePath);
    if (!suggested) continue;
    map.push({
      from: relative(ROOT, filePath),
      to: suggested,
      _note: 'Review and adjust before running --apply',
    });
  }

  const json = JSON.stringify(map, null, 2);

  if (outputPath) {
    writeFileSync(outputPath, json + '\n', 'utf8');
    console.log(`\n✓ Suggested rename map written to ${relative(ROOT, outputPath)}`);
    console.log(`  ${map.length} file(s) proposed for renaming.\n`);
    console.log(`  Review the map, then run:\n`);
    console.log(`    node scripts/dream-rename.mjs --dry-run --map ${relative(ROOT, outputPath)}`);
    console.log(`    node scripts/dream-rename.mjs --apply   --map ${relative(ROOT, outputPath)}\n`);
  } else {
    console.log(json);
  }

  process.exit(0);
}

// ─── Load rename map (shared by --dry-run and --apply) ───────────────────────

const mapArgIdx = args.indexOf('--map');
if (mapArgIdx === -1 || !args[mapArgIdx + 1]) {
  console.error('✗ --map <rename-map.json> is required for --dry-run and --apply');
  process.exit(1);
}

const mapPath = resolve(ROOT, args[mapArgIdx + 1]);
if (!existsSync(mapPath)) {
  console.error(`✗ Rename map not found: ${mapPath}`);
  process.exit(1);
}

const renameEntries = JSON.parse(readFileSync(mapPath, 'utf8'));

if (!Array.isArray(renameEntries) || renameEntries.length === 0) {
  console.error('✗ Rename map must be a non-empty JSON array');
  process.exit(1);
}

// ─── Build the import rewrite table ──────────────────────────────────────────
//
// For each rename entry we build a mapping from OLD import path → NEW import path.
// Import paths can appear in several forms:
//   @/components/DreamDMBar        (aliased, no ext)
//   ../components/DreamDMBar       (relative, no ext)
//   ./DreamDMBar                   (relative same dir)
// We normalise to the repo-relative path of the source file to match.

/** Strip extension for import path comparisons */
function stripExt(s) {
  return s.replace(/\.(tsx?|jsx?)$/, '');
}

/**
 * Build an array of { pattern: RegExp, replacement: string } objects.
 * Each object rewrites one old import string to the new `@/<newName>` form.
 */
function buildRewriteRules(entries) {
  return entries.map(({ from, to }) => {
    const fromRel = from.replace(/\\/g, '/'); // repo-relative, forward slashes
    const fromNoExt = stripExt(fromRel);      // e.g. components/DreamDMBar
    const toNoExt = stripExt(to);             // e.g. dream.dreamdmbar

    // The new canonical import is always @/<flat-name>
    const newImport = `@/${toNoExt}`;

    // Patterns we want to catch (import string, without quotes):
    //   @/components/DreamDMBar
    //   @/DreamDMBar              (already at root, unlikely but handle it)
    //   ../components/DreamDMBar  (one level up)
    //   ../../components/DreamDMBar
    //   ./DreamDMBar
    //   ../DreamDMBar

    // Escape for regex
    const escapedFromNoExt = fromNoExt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match any relative or alias import that ends with the old path
    const pattern = new RegExp(
      `(@/|\\.\\.?/(?:\\.\\.?/)*)${escapedFromNoExt}(?=['"\`])`,
      'g'
    );

    return { pattern, newImport, fromNoExt };
  });
}

const rewriteRules = buildRewriteRules(renameEntries);

// ─── Rewrite imports in a single file's source ────────────────────────────────

function rewriteImports(source) {
  let result = source;
  for (const { pattern, newImport } of rewriteRules) {
    result = result.replace(pattern, newImport);
  }
  return result;
}

// ─── Dry-run / Apply ─────────────────────────────────────────────────────────

console.log(`\n─── DREAMengin Rename ${MODE_DRY ? '(dry-run)' : '(apply)'} ───────────────────────────\n`);

// Step 1: Validate entries before touching anything
let hasErrors = false;
for (const entry of renameEntries) {
  const { from, to } = entry;
  if (!from || !to) {
    console.error(`  ✗  Entry missing "from" or "to": ${JSON.stringify(entry)}`);
    hasErrors = true;
    continue;
  }
  const srcPath = join(ROOT, from);
  if (!existsSync(srcPath)) {
    console.error(`  ✗  Source not found: ${from}`);
    hasErrors = true;
  }
  if (!SPEC_PREFIX_RE.test(basename(to))) {
    console.warn(`  ⚠  Destination "${to}" does not match the spec pattern — proceeding anyway`);
  }
}
if (hasErrors) {
  console.error('\n  Aborting due to errors above.\n');
  process.exit(1);
}

// Step 2: Show / execute file renames
console.log('  File renames:\n');
for (const { from, to } of renameEntries) {
  const srcPath = join(ROOT, from);
  const destPath = join(ROOT, to);
  console.log(`    ${from}  →  ${to}`);
  if (MODE_APPLY) {
    renameSync(srcPath, destPath);
  }
}

// Step 3: Rewrite imports across all source files
console.log('\n  Import rewrites:\n');

// Re-collect files after rename so the new names are included
const scanFiles = MODE_APPLY
  ? [
      ...collectRootFiles(),
      ...SCAN_DIRS.flatMap(d => collectFiles(join(ROOT, d))),
    ]
  : ALL_FILES;

let rewriteCount = 0;

for (const filePath of scanFiles) {
  const original = readFileSync(filePath, 'utf8');
  const rewritten = rewriteImports(original);
  if (rewritten !== original) {
    const rel = relative(ROOT, filePath);
    console.log(`    ${rel}`);
    rewriteCount++;
    if (MODE_APPLY) {
      writeFileSync(filePath, rewritten, 'utf8');
    }
  }
}

if (rewriteCount === 0) {
  console.log('    (no import rewrites needed)');
}

console.log(`\n  ${renameEntries.length} file(s) renamed.`);
console.log(`  ${rewriteCount} file(s) with import rewrites.`);

if (MODE_DRY) {
  console.log('\n  This was a dry run — nothing was changed on disk.');
  console.log('  Run with --apply to execute.\n');
} else {
  console.log('\n  Done. Review changes with: git diff\n');
}
