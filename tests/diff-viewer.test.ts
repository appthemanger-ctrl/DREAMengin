/**
 * tests/diff-viewer.test.ts
 *
 * Unit tests for lib/diff/diffUtils — diff parsing, navigation, and scroll marker helpers.
 */

import { describe, it, expect } from 'vitest';
import {
  parseUnifiedDiff,
  buildFullFileLines,
  buildScrollMarkers,
  firstHunkIndex,
  nextHunkIndex,
  prevHunkIndex,
  DEMO_DIFF,
} from '@/lib/diff/diffUtils';

// ─── Sample diffs ─────────────────────────────────────────────────────────────

const SIMPLE_DIFF = `--- a/src/foo.ts
+++ b/src/foo.ts
@@ -1,5 +1,6 @@
 import React from 'react';
-import { useState } from 'react';
+import { useState, useEffect } from 'react';
+
 export function Foo() {
   return <div>foo</div>;
 }
`;

const TWO_HUNK_DIFF = `--- a/src/bar.ts
+++ b/src/bar.ts
@@ -1,4 +1,4 @@
 const a = 1;
-const b = 2;
+const b = 99;
 const c = 3;
 const d = 4;
@@ -10,4 +10,5 @@
 function hello() {
-  return 'world';
+  return 'DREAMengin';
+  // added comment
 }
 const z = 5;
`;

// ─── parseUnifiedDiff ─────────────────────────────────────────────────────────

describe('parseUnifiedDiff', () => {
  it('returns an empty array for empty input', () => {
    expect(parseUnifiedDiff('')).toEqual([]);
  });

  it('parses a single-file diff correctly', () => {
    const files = parseUnifiedDiff(SIMPLE_DIFF);
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('src/foo.ts');
  });

  it('counts added and removed lines', () => {
    const [file] = parseUnifiedDiff(SIMPLE_DIFF);
    expect(file.addedCount).toBe(2);
    expect(file.removedCount).toBe(1);
  });

  it('produces exactly one hunk for SIMPLE_DIFF', () => {
    const [file] = parseUnifiedDiff(SIMPLE_DIFF);
    expect(file.hunks).toHaveLength(1);
  });

  it('produces two hunks for TWO_HUNK_DIFF', () => {
    const [file] = parseUnifiedDiff(TWO_HUNK_DIFF);
    expect(file.hunks).toHaveLength(2);
  });

  it('assigns 0-based hunk indices', () => {
    const [file] = parseUnifiedDiff(TWO_HUNK_DIFF);
    expect(file.hunks[0].index).toBe(0);
    expect(file.hunks[1].index).toBe(1);
  });

  it('captures hunk start lines', () => {
    const [file] = parseUnifiedDiff(TWO_HUNK_DIFF);
    expect(file.hunks[0].newStart).toBe(1);
    expect(file.hunks[1].newStart).toBe(10);
  });

  it('classifies line types correctly', () => {
    const [file] = parseUnifiedDiff(SIMPLE_DIFF);
    const types = file.hunks[0].lines.map((l) => l.type);
    expect(types).toContain('context');
    expect(types).toContain('added');
    expect(types).toContain('removed');
  });

  it('parses the built-in DEMO_DIFF without errors', () => {
    const files = parseUnifiedDiff(DEMO_DIFF);
    expect(files.length).toBeGreaterThan(0);
    expect(files[0].hunks.length).toBeGreaterThan(0);
  });
});

// ─── buildFullFileLines ───────────────────────────────────────────────────────

describe('buildFullFileLines', () => {
  it('returns an empty array for a file with no hunks', () => {
    const emptyFile = parseUnifiedDiff('')[0];
    // Guard: if there are no files, skip
    if (!emptyFile) return;
    expect(buildFullFileLines(emptyFile, false)).toEqual([]);
  });

  it('expanded mode returns all hunk lines (no collapsed placeholders in hunks)', () => {
    const [file] = parseUnifiedDiff(TWO_HUNK_DIFF);
    const lines = buildFullFileLines(file, false);
    const collapsed = lines.filter((l) => l.collapsed);
    // Expanded mode should not have any collapsed lines
    expect(collapsed).toHaveLength(0);
  });

  it('collapsed mode inserts a placeholder between hunks', () => {
    const [file] = parseUnifiedDiff(TWO_HUNK_DIFF);
    const lines = buildFullFileLines(file, true);
    const placeholders = lines.filter((l) => l.collapsed);
    expect(placeholders.length).toBeGreaterThanOrEqual(1);
  });

  it('marks the first line of each hunk with isHunkStart=true', () => {
    const [file] = parseUnifiedDiff(TWO_HUNK_DIFF);
    const lines = buildFullFileLines(file, false);
    const starts = lines.filter((l) => l.isHunkStart);
    expect(starts).toHaveLength(2);
  });

  it('hunkIndex is -1 for collapsed placeholder lines', () => {
    const [file] = parseUnifiedDiff(TWO_HUNK_DIFF);
    const lines = buildFullFileLines(file, true);
    const placeholders = lines.filter((l) => l.collapsed);
    for (const p of placeholders) {
      expect(p.hunkIndex).toBe(-1);
    }
  });
});

// ─── Navigation helpers ───────────────────────────────────────────────────────

describe('firstHunkIndex', () => {
  it('returns 0 for a file with hunks', () => {
    const [file] = parseUnifiedDiff(SIMPLE_DIFF);
    expect(firstHunkIndex(file)).toBe(0);
  });
});

describe('nextHunkIndex', () => {
  it('returns 1 from hunk 0 in a two-hunk file', () => {
    const [file] = parseUnifiedDiff(TWO_HUNK_DIFF);
    expect(nextHunkIndex(file, 0)).toBe(1);
  });

  it('wraps around from the last hunk to hunk 0', () => {
    const [file] = parseUnifiedDiff(TWO_HUNK_DIFF);
    expect(nextHunkIndex(file, 1)).toBe(0);
  });

  it('returns -1 for a file with no hunks', () => {
    const emptyFile = { path: 'x', oldPath: 'x', newPath: 'x', hunks: [], addedCount: 0, removedCount: 0 };
    expect(nextHunkIndex(emptyFile, 0)).toBe(-1);
  });
});

describe('prevHunkIndex', () => {
  it('returns 0 from hunk 1 in a two-hunk file', () => {
    const [file] = parseUnifiedDiff(TWO_HUNK_DIFF);
    expect(prevHunkIndex(file, 1)).toBe(0);
  });

  it('wraps around from hunk 0 to the last hunk', () => {
    const [file] = parseUnifiedDiff(TWO_HUNK_DIFF);
    expect(prevHunkIndex(file, 0)).toBe(1);
  });

  it('returns -1 for a file with no hunks', () => {
    const emptyFile = { path: 'x', oldPath: 'x', newPath: 'x', hunks: [], addedCount: 0, removedCount: 0 };
    expect(prevHunkIndex(emptyFile, 0)).toBe(-1);
  });
});

// ─── buildScrollMarkers ───────────────────────────────────────────────────────

describe('buildScrollMarkers', () => {
  it('returns an empty array for a file with no hunks', () => {
    const emptyFile = { path: 'x', oldPath: 'x', newPath: 'x', hunks: [], addedCount: 0, removedCount: 0 };
    expect(buildScrollMarkers(emptyFile, 100)).toEqual([]);
  });

  it('returns an empty array when totalLines is 0', () => {
    const [file] = parseUnifiedDiff(SIMPLE_DIFF);
    expect(buildScrollMarkers(file, 0)).toEqual([]);
  });

  it('returns one marker per hunk', () => {
    const [file] = parseUnifiedDiff(TWO_HUNK_DIFF);
    const markers = buildScrollMarkers(file, 100);
    expect(markers).toHaveLength(2);
  });

  it('all marker positions are in [0, 1]', () => {
    const [file] = parseUnifiedDiff(TWO_HUNK_DIFF);
    const markers = buildScrollMarkers(file, 100);
    for (const m of markers) {
      expect(m.position).toBeGreaterThanOrEqual(0);
      expect(m.position).toBeLessThanOrEqual(1);
    }
  });

  it('all marker sizes are in [0, 1]', () => {
    const [file] = parseUnifiedDiff(TWO_HUNK_DIFF);
    const markers = buildScrollMarkers(file, 100);
    for (const m of markers) {
      expect(m.size).toBeGreaterThanOrEqual(0);
      expect(m.size).toBeLessThanOrEqual(1);
    }
  });

  it('marker hunkIndex matches hunk order', () => {
    const [file] = parseUnifiedDiff(TWO_HUNK_DIFF);
    const markers = buildScrollMarkers(file, 100);
    expect(markers[0].hunkIndex).toBe(0);
    expect(markers[1].hunkIndex).toBe(1);
  });
});
