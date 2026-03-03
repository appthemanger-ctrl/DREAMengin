#!/usr/bin/env node
/**
 * check-golden-mount.mjs
 *
 * Tripwire: fail if DreamNavControls (the Golden Button overlay) is mounted
 * in more than one top-level page or layout component.
 *
 * The single canonical mount point is components/home/HomeSystem.tsx.
 * If it appears anywhere else in app/ or components/ (excluding its own
 * definition file), the check fails.
 *
 * Run: node scripts/check-golden-mount.mjs
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const SEARCH_DIRS = ['app', 'components'];

/** The one file that is allowed to import/mount DreamNavControls. */
const ALLOWED_MOUNT = 'components/home/HomeSystem.tsx';

/** The definition file itself — not a mount. */
const DEFINITION_FILE = 'components/dreamnav/DreamNavControls.tsx';

const EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js']);
const MOUNT_RE = /DreamNavControls/;

/**
 * Recursively collect files.
 * @param {string} dir
 * @returns {string[]}
 */
function collectFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (entry === 'node_modules' || entry === '.next' || entry === 'dist') continue;
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else {
      const ext = fullPath.slice(fullPath.lastIndexOf('.'));
      if (EXTENSIONS.has(ext)) results.push(fullPath);
    }
  }
  return results;
}

const violations = [];

for (const dir of SEARCH_DIRS) {
  const files = collectFiles(join(ROOT, dir));
  for (const file of files) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    if (rel === ALLOWED_MOUNT || rel === DEFINITION_FILE) continue;
    const src = readFileSync(file, 'utf8');
    if (MOUNT_RE.test(src)) {
      violations.push(rel);
    }
  }
}

if (violations.length > 0) {
  console.error('[check-golden-mount] FAIL: DreamNavControls found in unexpected file(s):');
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  console.error(
    `[check-golden-mount] Golden Button must be mounted only in ${ALLOWED_MOUNT}.`,
  );
  process.exit(1);
}

console.log('[check-golden-mount] OK — DreamNavControls mounted in exactly one place.');
