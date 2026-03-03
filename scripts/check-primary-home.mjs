#!/usr/bin/env node
/**
 * check-primary-home.mjs
 *
 * Tripwire: fail if the primary Home component (HomeSystem.tsx) imports
 * DreamNavSurface, InnerNodes, or OuterNodes — patterns that belong to the
 * spatial-navigation layer and must not appear in the primary flow.
 *
 * Run: node scripts/check-primary-home.mjs
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const TARGET = resolve('components/home/HomeSystem.tsx');
const FORBIDDEN_PATTERNS = [
  /DreamNavSurface/,
  /InnerNodes/,
  /OuterNodes/,
];

let src;
try {
  src = readFileSync(TARGET, 'utf8');
} catch {
  console.error(`[check-primary-home] ERROR: Cannot read ${TARGET}`);
  process.exit(1);
}

let failed = false;
for (const pattern of FORBIDDEN_PATTERNS) {
  if (pattern.test(src)) {
    console.error(
      `[check-primary-home] FAIL: Found forbidden pattern "${pattern}" in ${TARGET}`,
    );
    failed = true;
  }
}

if (failed) {
  console.error(
    '[check-primary-home] Home must not import spatial-nav surfaces (DreamNavSurface, InnerNodes, OuterNodes).',
  );
  process.exit(1);
}

console.log('[check-primary-home] OK — no forbidden spatial-nav imports in primary Home.');
