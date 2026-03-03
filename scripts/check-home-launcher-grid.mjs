#!/usr/bin/env node
/**
 * check-home-launcher-grid.mjs
 *
 * Tripwire: fail if the primary Home component (HomeSystem.tsx) uses the
 * launcher grid component (DreamsGrid).  Home is a TV feed experience, not
 * a tiny-tile launcher grid.
 *
 * Run: node scripts/check-home-launcher-grid.mjs
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const TARGET = resolve('components/home/HomeSystem.tsx');

/** Patterns that indicate the launcher-grid is active in the primary flow. */
const FORBIDDEN_PATTERNS = [
  /import\s+DreamsGrid\b/,
  /<DreamsGrid\b/,
];

let src;
try {
  src = readFileSync(TARGET, 'utf8');
} catch {
  console.error(`[check-home-launcher-grid] ERROR: Cannot read ${TARGET}`);
  process.exit(1);
}

let failed = false;
for (const pattern of FORBIDDEN_PATTERNS) {
  if (pattern.test(src)) {
    console.error(
      `[check-home-launcher-grid] FAIL: Found launcher-grid pattern "${pattern}" in HomeSystem.tsx`,
    );
    failed = true;
  }
}

if (failed) {
  console.error(
    '[check-home-launcher-grid] Home must not use the tiny-tile launcher grid (DreamsGrid). ' +
      'Replace with DreamCardLarge rows (TV feed). See docs/HOME_FEED_TV_SPEC.md.',
  );
  process.exit(1);
}

console.log('[check-home-launcher-grid] OK — no launcher grid in primary Home.');
