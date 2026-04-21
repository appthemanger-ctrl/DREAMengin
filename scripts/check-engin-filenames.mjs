#!/usr/bin/env node
/**
 * Engin / Dream / Surface filename grammar enforcement.
 *
 * Implements the rule locked in docs/NAMING_AUTHORITY.md §14:
 *   - `engin.<Name>.tsx`        — exactly the 6 canonical Engin runtimes
 *   - `dream.<Name>.tsx`        — anything user-facing that composes an Engin
 *   - `dreamsurface.<Name>.tsx` — Surfaces that Engins / Dreams live on
 *
 * Per §14.8, when a `dream.` or `dreamsurface.` file uses a second dotted
 * segment (`dream.<sub>.<Name>.tsx` / `dreamsurface.<sub>.<Name>.tsx`), that
 * `<sub>` must come from the closed approved list. Bare two-segment forms
 * (`dream.<Name>.tsx`) remain the fallback and are unaffected.
 *
 * Per §14.6 ("Migration Status") this is an additive guard: it blocks new
 * violations and currently-renamed files, but does not retroactively block
 * the migration backlog (duplicate Engin shells, hand-written cartridges,
 * remaining Surfaces). Each follow-up PR is expected to remove items from
 * MIGRATION_BACKLOG_ALLOWED below as those files are renamed.
 */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─────────────────────────────────────────────────────────────────────────────
// §14.2 — the only valid `engin.*.tsx` filenames.
// ─────────────────────────────────────────────────────────────────────────────
const CANONICAL_ENGIN_FILENAMES = new Set([
  'engin.StarMakerEngin.tsx',
  'engin.GameEngin.tsx',
  'engin.LabEngin.tsx',
  'engin.CodeEngin.tsx',
  'engin.BrandingEngin.tsx',
  'engin.ContentEngin.tsx',
]);

// The canonical 6 Engin base names (without the `engin.` prefix).
const CANONICAL_ENGIN_BASENAMES = new Set([
  'StarMakerEngin',
  'GameEngin',
  'LabEngin',
  'CodeEngin',
  'BrandingEngin',
  'ContentEngin',
]);

// Directories that are explicitly the home of canonical Engin files.
// Any canonical-named Engin .tsx directly inside one of these MUST use the
// `engin.` prefix.
const ENGIN_HOME_DIRS = ['engins'];

// Directories we walk for the global pattern checks (§14.5 — rejected
// filename patterns). Skip node_modules, build outputs, archives, etc.
const SCAN_DIRS = [
  'app',
  'components',
  'coresurfaces',
  'daydreams',
  'dreamdmbar',
  'engins',
  'src',
];

const SKIP_DIRECTORY_NAMES = new Set([
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'out',
  'coverage',
  'archive',
]);

// Files that the migration backlog (§14.6) has not yet reached. Listed here
// to keep the check additive instead of retroactive. Entries should be
// REMOVED — never added — as follow-up PRs rename them.
const MIGRATION_BACKLOG_ALLOWED = new Set([
  // §14.6 — all canonical engin.*.tsx flat files have been restructured into
  // engins/[EnginName]/index.tsx subdirectory layout. Backlog is now empty.
]);

// ─────────────────────────────────────────────────────────────────────────────
// §14.8 — approved sub-prefixes for `dream.<sub>.<Name>.tsx` and
// `dreamsurface.<sub>.<Name>.tsx`. Any other `<sub>` segment is a violation.
// Bare two-segment forms (`dream.<Name>.tsx`) are the fallback and are NOT
// validated against these sets.
// ─────────────────────────────────────────────────────────────────────────────
const APPROVED_DREAM_SUBPREFIXES = new Set([
  'cartridge',
  'panel',
  'hud',
  'remote',
  'scene',
  'window',
  'widget',
  'menu',
  'bar',
  'shell',
  'overlay',
]);

const APPROVED_DREAMSURFACE_SUBPREFIXES = new Set([
  'core',
  'daydream',
  'module',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Walk
// ─────────────────────────────────────────────────────────────────────────────
async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRECTORY_NAMES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

const violations = [];

for (const rel of SCAN_DIRS) {
  const dir = path.join(ROOT, rel);
  try {
    await stat(dir);
  } catch {
    continue;
  }

  for await (const file of walk(dir)) {
    const base = path.basename(file);
    const relFromRoot = path.relative(ROOT, file).split(path.sep).join('/');

    // Only enforce on .tsx files.
    if (!base.endsWith('.tsx')) continue;

    // §14.2 — any file starting with `engin.` MUST be one of the canonical 6.
    if (base.startsWith('engin.') && !CANONICAL_ENGIN_FILENAMES.has(base)) {
      violations.push(
        `${relFromRoot} — uses the \`engin.\` prefix but is not one of the 6 canonical Engin filenames (NAMING_AUTHORITY.md §14.2).`,
      );
      continue;
    }

    // §14.5 — rejected prefix variants (case / separator).
    if (/^Engin\./.test(base)) {
      violations.push(
        `${relFromRoot} — \`Engin.\` prefix must be lowercase \`engin.\` (NAMING_AUTHORITY.md §14.5).`,
      );
    }
    if (/^Dream\./.test(base)) {
      violations.push(
        `${relFromRoot} — \`Dream.\` prefix must be lowercase \`dream.\` (NAMING_AUTHORITY.md §14.5).`,
      );
    }
    if (/^DreamSurface\./.test(base) || /^dreamSurface\./.test(base)) {
      violations.push(
        `${relFromRoot} — prefix must be lowercase \`dreamsurface.\` — one word (NAMING_AUTHORITY.md §14.5).`,
      );
    }
    if (/^engin[-_]/.test(base) || /^dream[-_]/.test(base) || /^dreamsurface[-_]/.test(base)) {
      violations.push(
        `${relFromRoot} — separator must be a single dot, not \`-\` or \`_\` (NAMING_AUTHORITY.md §14.5).`,
      );
    }

    // §14.8 — sub-prefix vocabulary. A file shaped like
    // `dream.<sub>.<Name>.tsx` (3+ dot-segments before `.tsx`) must use a
    // `<sub>` from the approved list; same for `dreamsurface.<sub>.<Name>.tsx`.
    // Two-segment forms (`dream.<Name>.tsx`) are the fallback and skipped.
    const segments = base.slice(0, -'.tsx'.length).split('.');
    if (segments[0] === 'dream' && segments.length >= 3) {
      const sub = segments[1];
      if (!APPROVED_DREAM_SUBPREFIXES.has(sub)) {
        violations.push(
          `${relFromRoot} — \`dream.${sub}.\` is not an approved sub-prefix. Allowed: ${[...APPROVED_DREAM_SUBPREFIXES].sort().join(', ')} (NAMING_AUTHORITY.md §14.8.2).`,
        );
      }
    }
    if (segments[0] === 'dreamsurface' && segments.length >= 3) {
      const sub = segments[1];
      if (!APPROVED_DREAMSURFACE_SUBPREFIXES.has(sub)) {
        violations.push(
          `${relFromRoot} — \`dreamsurface.${sub}.\` is not an approved sub-prefix. Allowed: ${[...APPROVED_DREAMSURFACE_SUBPREFIXES].sort().join(', ')} (NAMING_AUTHORITY.md §14.8.3).`,
        );
      }
    }

    // §14.2 / §14.6 — canonical Engin name in an Engin home dir without the
    // `engin.` prefix. Skip files in MIGRATION_BACKLOG_ALLOWED.
    const stem = base.slice(0, -'.tsx'.length);
    const inEnginHome = ENGIN_HOME_DIRS.some(
      (home) =>
        relFromRoot === `${home}/${base}` ||
        relFromRoot.startsWith(`${home}/`) === false
          ? false
          : path.dirname(relFromRoot) === home,
    );
    if (
      inEnginHome &&
      CANONICAL_ENGIN_BASENAMES.has(stem) &&
      !MIGRATION_BACKLOG_ALLOWED.has(relFromRoot)
    ) {
      violations.push(
        `${relFromRoot} — canonical Engin in an Engin home dir must be named \`engin.${stem}.tsx\` (NAMING_AUTHORITY.md §14.2).`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error('Engin/Dream/Surface filename grammar violations:');
  for (const v of violations) console.error(`  - ${v}`);
  console.error(
    '\nSee docs/NAMING_AUTHORITY.md §14 for the rule. Rename files to match, or — if the file is part of the staged migration — add it to MIGRATION_BACKLOG_ALLOWED in scripts/check-engin-filenames.mjs.',
  );
  process.exit(1);
}

console.log('Engin/Dream/Surface filename grammar OK.');
