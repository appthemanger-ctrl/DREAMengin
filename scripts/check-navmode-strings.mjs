#!/usr/bin/env node
/**
 * check-navmode-strings.mjs
 *
 * Tripwire: fail if the string "NAV MODE" or "nav mode" (case-insensitive)
 * appears in user-facing component or page source files.
 *
 * Lab/internal files (components/dreamnav/, app/lab/, app/admin/) are
 * explicitly excluded because those are development surfaces.
 *
 * Run: node scripts/check-navmode-strings.mjs
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const SEARCH_DIRS = ['app', 'components'];
const EXCLUDED_PATHS = [
  'components/dreamnav',
  'components/spatial',
  'app/lab',
  'app/admin',
  'app/settings/controls', // position indicator toggle is lab-only setting
];
const EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js']);
const NAV_MODE_RE = /nav\s*mode/i;

/**
 * Recursively collect files under dir matching the given extensions.
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

function isExcluded(filePath) {
  const rel = relative(ROOT, filePath).replace(/\\/g, '/');
  return EXCLUDED_PATHS.some((ex) => rel.startsWith(ex));
}

let failed = false;

for (const dir of SEARCH_DIRS) {
  const files = collectFiles(join(ROOT, dir));
  for (const file of files) {
    if (isExcluded(file)) continue;
    const src = readFileSync(file, 'utf8');
    if (NAV_MODE_RE.test(src)) {
      const rel = relative(ROOT, file);
      console.error(`[check-navmode-strings] FAIL: "nav mode" found in ${rel}`);
      failed = true;
    }
  }
}

if (failed) {
  console.error(
    '[check-navmode-strings] Spatial nav mode strings must not appear in user-facing components/pages.',
  );
  process.exit(1);
}

console.log('[check-navmode-strings] OK — no user-facing nav-mode strings found.');
