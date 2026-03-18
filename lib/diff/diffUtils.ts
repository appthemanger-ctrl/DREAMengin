/**
 * lib/diff/diffUtils.ts
 *
 * Utilities for parsing and navigating unified diff format.
 *
 * Supports:
 *   - Parsing unified diff text into structured DiffFile / DiffHunk / DiffLine
 *   - Computing "full file" views that interleave context lines with hunks
 *   - Navigation helpers (hunkIndex, prevHunk, nextHunk)
 *   - Scroll-margin metadata (proportion of each hunk in the full file)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type DiffLineType = 'added' | 'removed' | 'context' | 'hunk-header';

export interface DiffLine {
  type: DiffLineType;
  /** Raw line content (without the leading +/-/ ) */
  content: string;
  /** 1-based line number in the old file (undefined for added lines) */
  oldLineNo?: number;
  /** 1-based line number in the new file (undefined for removed lines) */
  newLineNo?: number;
}

export interface DiffHunk {
  /** Index of this hunk within the file (0-based) */
  index: number;
  /** @@ -oldStart,oldCount +newStart,newCount @@ header */
  header: string;
  /** Old-file start line (1-based) */
  oldStart: number;
  oldCount: number;
  /** New-file start line (1-based) */
  newStart: number;
  newCount: number;
  lines: DiffLine[];
}

export interface DiffFile {
  /** Path of the file being diffed (new path takes priority) */
  path: string;
  oldPath: string;
  newPath: string;
  hunks: DiffHunk[];
  /** Total added lines across all hunks */
  addedCount: number;
  /** Total removed lines across all hunks */
  removedCount: number;
}

// ─── Parser ───────────────────────────────────────────────────────────────────

const HUNK_HEADER_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)/;

/**
 * Parse a single unified diff text (may cover one or more files).
 * Returns one DiffFile per "--- a/..." / "+++ b/..." header pair.
 */
export function parseUnifiedDiff(diffText: string): DiffFile[] {
  const files: DiffFile[] = [];
  let current: DiffFile | null = null;
  let currentHunk: DiffHunk | null = null;
  let oldLine = 0;
  let newLine = 0;

  for (const raw of diffText.split('\n')) {
    // New file boundary
    if (raw.startsWith('--- ')) {
      const oldPath = raw.slice(4).replace(/^\/?a\//, '');
      // Peek ahead handled by +++ line
      if (current) files.push(finalise(current));
      current = {
        path: oldPath,
        oldPath,
        newPath: oldPath,
        hunks: [],
        addedCount: 0,
        removedCount: 0,
      };
      currentHunk = null;
      continue;
    }

    if (raw.startsWith('+++ ') && current) {
      const newPath = raw.slice(4).replace(/^\/?b\//, '');
      current.newPath = newPath;
      current.path = newPath !== '/dev/null' ? newPath : current.oldPath;
      continue;
    }

    // Hunk header
    const hunkMatch = raw.match(HUNK_HEADER_RE);
    if (hunkMatch) {
      if (!current) continue;
      if (currentHunk) current.hunks.push(currentHunk);
      oldLine = parseInt(hunkMatch[1], 10);
      newLine = parseInt(hunkMatch[3], 10);
      currentHunk = {
        index: current.hunks.length,
        header: raw,
        oldStart: oldLine,
        oldCount: parseInt(hunkMatch[2] ?? '1', 10),
        newStart: newLine,
        newCount: parseInt(hunkMatch[4] ?? '1', 10),
        lines: [],
      };
      continue;
    }

    if (!currentHunk) continue;

    if (raw.startsWith('+')) {
      currentHunk.lines.push({ type: 'added',   content: raw.slice(1), newLineNo: newLine++ });
      if (current) current.addedCount++;
    } else if (raw.startsWith('-')) {
      currentHunk.lines.push({ type: 'removed', content: raw.slice(1), oldLineNo: oldLine++ });
      if (current) current.removedCount++;
    } else if (raw.startsWith(' ') || raw === '') {
      currentHunk.lines.push({
        type: 'context',
        content: raw.startsWith(' ') ? raw.slice(1) : '',
        oldLineNo: oldLine++,
        newLineNo: newLine++,
      });
    }
  }

  if (currentHunk && current) current.hunks.push(currentHunk);
  if (current) files.push(finalise(current));
  return files;
}

function finalise(file: DiffFile): DiffFile {
  // Re-index hunks so .index is always correct after pushes
  file.hunks = file.hunks.map((h, i) => ({ ...h, index: i }));
  return file;
}

// ─── Full-file view helpers ───────────────────────────────────────────────────

export interface FullFileLine extends DiffLine {
  /** True when this line belongs to a collapsed context region */
  collapsed: boolean;
  /** True when this line is the first line of a new hunk section */
  isHunkStart: boolean;
  /** 0-based hunk index this line belongs to (-1 = pure context) */
  hunkIndex: number;
}

/**
 * Flatten all hunks in a DiffFile into a contiguous list of FullFileLine
 * objects that can be rendered as a "full file" view.
 *
 * Lines that are not part of any hunk are filled with empty context lines to
 * bridge the gap between hunks.
 *
 * @param collapsed  When true, context lines between hunks are replaced with a
 *                   single collapsed placeholder each.  When false, all lines
 *                   are visible.
 * @param contextLines  Number of context lines to keep around each hunk when
 *                      in collapsed mode (default: 3).
 */
export function buildFullFileLines(
  file: DiffFile,
  collapsed: boolean,
  contextLines = 3,
): FullFileLine[] {
  const result: FullFileLine[] = [];

  if (file.hunks.length === 0) return result;

  for (let hi = 0; hi < file.hunks.length; hi++) {
    const hunk = file.hunks[hi];
    const isFirst = hi === 0;

    // -- lines before this hunk (gap from previous hunk or file start) --
    if (isFirst && hunk.newStart > 1) {
      const gapSize = hunk.newStart - 1;
      if (collapsed) {
        result.push(makePlaceholder(hunk.newStart - gapSize, gapSize));
      }
      // In expanded mode we don't add virtual lines for content we don't have
    } else if (!isFirst) {
      const prevHunk = file.hunks[hi - 1];
      const prevEnd  = prevHunk.newStart + prevHunk.newCount;
      const gapStart = prevEnd;
      const gapEnd   = hunk.newStart;
      const gapSize  = gapEnd - gapStart;
      if (gapSize > 0) {
        if (collapsed) {
          result.push(makePlaceholder(gapStart, gapSize));
        }
      }
    }

    // -- hunk lines --
    for (let li = 0; li < hunk.lines.length; li++) {
      const line = hunk.lines[li];
      result.push({
        ...line,
        collapsed: false,
        isHunkStart: li === 0,
        hunkIndex: hunk.index,
      });
    }
  }

  return result;
}

function makePlaceholder(startLine: number, count: number): FullFileLine {
  return {
    type: 'context',
    content: `… ${count} unchanged line${count === 1 ? '' : 's'}`,
    newLineNo: startLine,
    collapsed: true,
    isHunkStart: false,
    hunkIndex: -1,
  };
}

// ─── Navigation helpers ───────────────────────────────────────────────────────

/**
 * Return the index of the first hunk in the file, or -1 if there are none.
 */
export function firstHunkIndex(file: DiffFile): number {
  return file.hunks.length > 0 ? 0 : -1;
}

/**
 * Return the index of the previous hunk (wrapping around), given the current
 * hunk index.
 */
export function prevHunkIndex(file: DiffFile, current: number): number {
  if (file.hunks.length === 0) return -1;
  return (current - 1 + file.hunks.length) % file.hunks.length;
}

/**
 * Return the index of the next hunk (wrapping around), given the current
 * hunk index.
 */
export function nextHunkIndex(file: DiffFile, current: number): number {
  if (file.hunks.length === 0) return -1;
  return (current + 1) % file.hunks.length;
}

// ─── Scroll-margin helpers ────────────────────────────────────────────────────

export interface HunkScrollMarker {
  /** 0-based hunk index */
  hunkIndex: number;
  /** Fraction from top of scroll area [0, 1] */
  position: number;
  /** Fraction of total content height [0, 1] */
  size: number;
}

/**
 * Compute scroll margin markers for each hunk.
 * `totalLines` is the total number of rendered lines in the full-file view
 * (used to compute proportional positions).
 */
export function buildScrollMarkers(
  file: DiffFile,
  totalLines: number,
): HunkScrollMarker[] {
  if (totalLines === 0 || file.hunks.length === 0) return [];

  return file.hunks.map((hunk) => {
    const start    = hunk.newStart - 1;  // 0-based
    const size     = hunk.newCount;
    return {
      hunkIndex: hunk.index,
      position:  Math.min(1, start / totalLines),
      size:      Math.min(1, size  / totalLines),
    };
  });
}

// ─── Demo diff ────────────────────────────────────────────────────────────────

/**
 * A self-contained demo unified diff used by DiffViewer in demo mode.
 */
export const DEMO_DIFF = `--- a/lib/diff/diffUtils.ts
+++ b/lib/diff/diffUtils.ts
@@ -1,7 +1,10 @@
 /**
- * Utilities for parsing unified diff format.
+ * Utilities for parsing and navigating unified diff format.
+ *
+ * Supports full-file view, hunk navigation, and scroll-margin metadata.
  */
 
-export type DiffLineType = 'added' | 'removed' | 'context';
+export type DiffLineType = 'added' | 'removed' | 'context' | 'hunk-header';
 
 export interface DiffLine {
   type: DiffLineType;
@@ -42,6 +45,15 @@ export interface DiffFile {
   removedCount: number;
 }
 
+// ─── Full-file helpers ────────────────────────────────────────────────────────
+
+export interface FullFileLine extends DiffLine {
+  collapsed: boolean;
+  isHunkStart: boolean;
+  hunkIndex: number;
+}
+
 // ─── Parser ───────────────────────────────────────────────────────────────────
 
 const HUNK_HEADER_RE = /^@@ -(\d+)(?:,(\d+))? \\+(\d+)(?:,(\d+))? @@(.*)/;
@@ -89,3 +101,18 @@ function finalise(file: DiffFile): DiffFile {
   file.hunks = file.hunks.map((h, i) => ({ ...h, index: i }));
   return file;
 }
+
+export function buildScrollMarkers(
+  file: DiffFile,
+  totalLines: number,
+): HunkScrollMarker[] {
+  if (totalLines === 0 || file.hunks.length === 0) return [];
+  return file.hunks.map((hunk) => ({
+    hunkIndex: hunk.index,
+    position:  Math.min(1, (hunk.newStart - 1) / totalLines),
+    size:      Math.min(1, hunk.newCount / totalLines),
+  }));
+}
`;
