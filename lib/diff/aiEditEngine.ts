/**
 * lib/diff/aiEditEngine.ts
 *
 * CodeEngin Trust Layer — core engine for AI-assisted scoped code editing.
 *
 * Problem this solves:
 *   AI tells mobile / beginner users to "rename X everywhere" or "remove this block"
 *   but they cannot reliably target the right code with native text selection.
 *   This engine turns vague AI instructions into safe, previewed, scoped actions.
 *
 * Core flow:
 *   1. AI produces an AiSuggestion (instruction + optional target/replacement)
 *   2. User picks an EditScope
 *   3. buildEditPreview() computes exactly what would change (matches + diff lines)
 *   4. User sees match count, affected cell count, and a line diff BEFORE applying
 *   5. applyEdit() mutates cells — returns new cells array + undo snapshot
 *   6. undoEdit() restores the snapshot
 *
 * No eval, no execution. All operations are pure string transforms.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * The 7 edit scopes the user can choose from.
 * Ordered from smallest (safest) to largest (highest risk).
 */
export type EditScope =
  | 'word'           // the single word at/around cursor / selected word
  | 'line'           // the full current line
  | 'block'          // nearest enclosing { } block
  | 'function'       // nearest enclosing function/def
  | 'file'           // entire active cell
  | 'word-in-file'   // every occurrence of target word in the active cell
  | 'word-in-codebase'; // every occurrence of target word across ALL cells

export const SCOPE_ORDER: EditScope[] = [
  'word',
  'line',
  'block',
  'function',
  'file',
  'word-in-file',
  'word-in-codebase',
];

export const SCOPE_LABEL: Record<EditScope, string> = {
  'word':             'Word',
  'line':             'Line',
  'block':            '{ } Block',
  'function':         'Function',
  'file':             'Whole File',
  'word-in-file':     'Same word in file',
  'word-in-codebase': 'Same word in all cells',
};

export const SCOPE_DESCRIPTION: Record<EditScope, string> = {
  'word':             'Change only the selected/cursor word — nothing else',
  'line':             'Change the entire line the cursor is on',
  'block':            'Change everything inside the nearest { … } block (brace-matched)',
  'function':         'Change the full function/def the cursor is inside',
  'file':             'Replace the entire content of this code cell',
  'word-in-file':     'Change every occurrence of this word in the active cell',
  'word-in-codebase': 'Change every occurrence in all open notebook cells (in memory only — not the filesystem)',
};

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export const SCOPE_RISK: Record<EditScope, RiskLevel> = {
  'word':             'low',
  'line':             'low',
  'block':            'medium',
  'function':         'medium',
  'file':             'high',
  'word-in-file':     'medium',
  'word-in-codebase': 'critical',
};

/** Risk levels that require an extra confirmation step before applying. */
export const CONFIRMATION_REQUIRED: Set<RiskLevel> = new Set(['high', 'critical']);

// ─── AI Suggestion ────────────────────────────────────────────────────────────

/**
 * A parsed AI suggestion.  Dr. Eams always returns one of these after
 * analysing a free-text instruction.  `target` and `replacement` are optional
 * — they are only populated when the instruction is a rename / replace action.
 */
export interface AiSuggestion {
  /** Original free-text instruction from the user (preserved for display). */
  instruction: string;
  /** The word/text to find, if applicable. */
  target: string;
  /** What to replace it with, if applicable. */
  replacement: string;
  /** Dr. Eams' recommended scope for this kind of change. */
  suggestedScope: EditScope;
  /** Human-readable explanation of why this scope was suggested. */
  scopeRationale: string;
  /**
   * How confident the parser is in its interpretation.
   *   high   — a named pattern (rename/replace/swap/delete) was matched exactly.
   *   medium — a looser pattern was matched; user should verify target and scope.
   *   low    — no pattern matched; fallback heuristic only. User must confirm intent.
   */
  confidence: 'high' | 'medium' | 'low';
}

// ─── Match ────────────────────────────────────────────────────────────────────

/** A single matched region within one code cell. */
export interface ScopeMatch {
  /** The cell's id. */
  cellId: string;
  /** Start character offset within the cell's code string (inclusive). */
  start: number;
  /** End character offset (exclusive). */
  end: number;
  /** The matched text (may be multi-line for block/function scopes). */
  matched: string;
  /** Line number (1-based) where the match starts. */
  lineNo: number;
}

// ─── Diff line ────────────────────────────────────────────────────────────────

export type EditDiffLineType = 'context' | 'removed' | 'added';

export interface EditDiffLine {
  type: EditDiffLineType;
  content: string;
  lineNo: number;
}

// ─── Edit Preview ─────────────────────────────────────────────────────────────

/**
 * The full preview computed by buildEditPreview().
 * This is everything the UI needs to show the user BEFORE they apply.
 */
export interface EditPreview {
  scope: EditScope;
  scopeLabel: string;
  risk: RiskLevel;
  requiresConfirmation: boolean;

  target: string;
  replacement: string;

  /** All matches across all relevant cells. */
  matches: ScopeMatch[];
  matchCount: number;
  /** Number of distinct cells that contain at least one match. */
  affectedCellCount: number;

  /**
   * A simplified line-level diff for the FIRST affected cell.
   * Shown in the preview panel (max 40 lines shown).
   */
  diffLines: EditDiffLine[];

  /** True when no target text was found (user should see a "no matches" state). */
  noMatches: boolean;
}

// ─── Undo snapshot ───────────────────────────────────────────────────────────

export interface UndoSnapshot {
  /** The cell states before the edit was applied. */
  cells: Array<{ id: string; code: string }>;
  /** Human-readable description for the undo tooltip. */
  description: string;
}

// ─── Minimal cell interface ───────────────────────────────────────────────────

/** The subset of a NotebookCell this engine needs. */
export interface EditableCell {
  id: string;
  code: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Escape a string for safe use in a RegExp pattern. */
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Count the 1-based line number for a character offset in a string. */
function lineNumberAt(text: string, offset: number): number {
  return text.slice(0, offset).split('\n').length;
}

/**
 * Find the start offset of the word that contains `cursor` in `text`.
 * A "word" is a maximal run of \w characters.
 */
export function wordBoundsAt(text: string, cursor: number): { start: number; end: number } {
  let start = cursor;
  let end   = cursor;
  while (start > 0 && /\w/.test(text[start - 1])) start--;
  while (end < text.length && /\w/.test(text[end])) end++;
  return { start, end };
}

/** Find the start/end of the line containing `offset` in `text`. */
export function lineBoundsAt(text: string, offset: number): { start: number; end: number } {
  let start = offset;
  let end   = offset;
  while (start > 0 && text[start - 1] !== '\n') start--;
  while (end < text.length && text[end] !== '\n') end++;
  return { start, end };
}

/**
 * Build a set of character indices that are inside a string literal or
 * single-line comment.  Brace scanners skip these positions so that a
 * `{` or `}` inside a string literal (e.g. `"Hello {name}"`) or a
 * comment (`// end }`) does not confuse the block-boundary finder.
 *
 * Handles:  `"..."`, `'...'`, backtick literals, and `//` line comments.
 * Does NOT handle multi-line block comments — acceptable limitation for
 * notebook cell snippets.
 */
function buildStringCommentMask(text: string): Set<number> {
  const mask = new Set<number>();
  let i = 0;
  while (i < text.length) {
    // Single-line comment: // ...
    if (text[i] === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') { mask.add(i); i++; }
      continue;
    }
    // Double-quoted string
    if (text[i] === '"') {
      mask.add(i); i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\') { mask.add(i); i++; } // skip escape
        if (i < text.length) { mask.add(i); i++; }
      }
      if (i < text.length) { mask.add(i); i++; } // closing "
      continue;
    }
    // Single-quoted string
    if (text[i] === "'") {
      mask.add(i); i++;
      while (i < text.length && text[i] !== "'") {
        if (text[i] === '\\') { mask.add(i); i++; }
        if (i < text.length) { mask.add(i); i++; }
      }
      if (i < text.length) { mask.add(i); i++; }
      continue;
    }
    // Template literal — simplified (no ${ } nesting detection)
    if (text[i] === '`') {
      mask.add(i); i++;
      while (i < text.length && text[i] !== '`') {
        if (text[i] === '\\') { mask.add(i); i++; }
        if (i < text.length) { mask.add(i); i++; }
      }
      if (i < text.length) { mask.add(i); i++; }
      continue;
    }
    i++;
  }
  return mask;
}

/**
 * Find the nearest enclosing pair of `open`/`close` characters,
 * ignoring positions that are inside strings or comments (as given by `masked`).
 */
function findEnclosingPair(
  text: string,
  cursor: number,
  masked: Set<number>,
  open: string,
  close: string,
): { start: number; end: number } | null {
  let depth = 0;
  let blockStart = -1;
  for (let i = cursor; i >= 0; i--) {
    if (masked.has(i)) continue;
    if (text[i] === close) depth++;
    else if (text[i] === open) {
      if (depth === 0) { blockStart = i; break; }
      depth--;
    }
  }
  if (blockStart === -1) return null;

  depth = 0;
  let blockEnd = -1;
  for (let i = cursor; i < text.length; i++) {
    if (masked.has(i)) continue;
    if (text[i] === open) depth++;
    else if (text[i] === close) {
      if (depth === 0) { blockEnd = i + 1; break; }
      depth--;
    }
  }
  if (blockEnd === -1) return null;
  return { start: blockStart, end: blockEnd };
}

/**
 * Find the nearest enclosing block containing `cursor`.
 *
 * Priority: `{ }` braces (functions, if-bodies, objects) first.
 * Fallback:  `[ ]` array/index brackets, then `( )` parentheses.
 *
 * Brace characters inside string literals (`"..."`, `'...'`, `` `...` ``)
 * and single-line comments (`// ...`) are ignored so that they cannot
 * falsely anchor the search.
 *
 * Returns null when the cursor is not enclosed by any bracket pair.
 */
export function blockBoundsAt(text: string, cursor: number): { start: number; end: number } | null {
  const masked = buildStringCommentMask(text);
  return (
    findEnclosingPair(text, cursor, masked, '{', '}') ??
    findEnclosingPair(text, cursor, masked, '[', ']') ??
    findEnclosingPair(text, cursor, masked, '(', ')') ??
    null
  );
}

/**
 * Find the nearest enclosing function/def/arrow-function body.
 * Supports JS/TS `function`, arrow functions, and Python `def`.
 * Falls back to blockBoundsAt if no function keyword is found.
 */
export function functionBoundsAt(text: string, cursor: number): { start: number; end: number } | null {
  // Find the block first
  const block = blockBoundsAt(text, cursor);
  if (!block) return null;

  // Walk backward from block.start to find a function keyword
  const before = text.slice(0, block.start);
  const fnMatch = before.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|def\s+\w+)\s*[^{]*$/);
  if (!fnMatch) return block; // fallback: return the block itself
  const fnStart = before.lastIndexOf(fnMatch[0]);
  return { start: fnStart, end: block.end };
}

// ─── Diff generation ──────────────────────────────────────────────────────────

/**
 * Generate a simple line-level diff between `before` and `after`.
 * Returns context (3 lines around changes), removed lines, and added lines.
 * Limited to MAX_DIFF_LINES total output lines.
 */
const CONTEXT_SIZE = 3;
const MAX_DIFF_LINES = 60;

export function generateDiffLines(before: string, after: string): EditDiffLine[] {
  const beforeLines = before.split('\n');
  const afterLines  = after.split('\n');

  // Simple LCS-based diff for short code snippets
  const result: EditDiffLine[] = [];
  const maxLen = Math.max(beforeLines.length, afterLines.length);

  // Build a diff by aligning lines that are equal
  // For our use-case (scoped edits) most lines will be identical; only a few change
  let bi = 0;
  let ai = 0;
  let lineNo = 1;

  while (bi < beforeLines.length || ai < afterLines.length) {
    const bLine = beforeLines[bi];
    const aLine = afterLines[ai];

    if (bi < beforeLines.length && ai < afterLines.length && bLine === aLine) {
      result.push({ type: 'context', content: bLine, lineNo });
      bi++; ai++; lineNo++;
    } else {
      // Find how many lines differ before they sync again
      let syncB = -1, syncA = -1;
      outer: for (let lookB = bi; lookB < Math.min(bi + 10, beforeLines.length); lookB++) {
        for (let lookA = ai; lookA < Math.min(ai + 10, afterLines.length); lookA++) {
          if (beforeLines[lookB] === afterLines[lookA]) {
            syncB = lookB; syncA = lookA; break outer;
          }
        }
      }
      if (syncB === -1) {
        // Remaining lines all differ
        while (bi < beforeLines.length) {
          result.push({ type: 'removed', content: beforeLines[bi++], lineNo });
        }
        while (ai < afterLines.length) {
          result.push({ type: 'added', content: afterLines[ai++], lineNo: lineNo++ });
        }
        break;
      }
      while (bi < syncB) result.push({ type: 'removed', content: beforeLines[bi++], lineNo });
      while (ai < syncA) result.push({ type: 'added',   content: afterLines[ai++],  lineNo: lineNo++ });
    }

    if (result.length >= MAX_DIFF_LINES) break;
    if (bi >= maxLen && ai >= maxLen) break;
  }

  // Trim pure context lines at start and end
  return trimContextLines(result, CONTEXT_SIZE);
}

function trimContextLines(lines: EditDiffLine[], keep: number): EditDiffLine[] {
  if (lines.length === 0) return lines;
  // Find indices of non-context lines
  const changed = lines
    .map((l, i) => l.type !== 'context' ? i : -1)
    .filter(i => i >= 0);
  if (changed.length === 0) return lines.slice(0, Math.min(keep * 2 + 1, lines.length));

  const first = Math.max(0, changed[0] - keep);
  const last  = Math.min(lines.length - 1, changed[changed.length - 1] + keep);
  return lines.slice(first, last + 1);
}

// ─── AiSuggestion parser ──────────────────────────────────────────────────────

/**
 * Parse a free-text AI instruction into a structured AiSuggestion.
 * Uses layered heuristics — no ML/eval involved.
 * Called by the Dr. Eams simulate handler in CodeEngin.
 *
 * Confidence values:
 *   high   — an exact named-pattern matched (rename/replace/swap/delete).
 *   medium — a looser pattern (change/update) matched; user should verify.
 *   low    — no pattern matched; fallback scope only. User must confirm intent.
 *
 * Parsing limitations (document honestly so the UI can surface warnings):
 *   - Only matches single-word (`\w+`) targets — multi-word phrases are not parsed.
 *   - `change` and `update` are intentionally medium-confidence because they can
 *     mean structural refactors, not just renames.
 *   - "everywhere" / "all" / "codebase" trigger the all-cells scope regardless of
 *     which root pattern matched.
 */
export function parseAiInstruction(instruction: string): AiSuggestion {
  const lower = instruction.toLowerCase().trim();
  const isAllCells = /everywhere|all\s+cells|all\s+occurrences|codebase/.test(lower);

  // ── Word in backtick/quote extractor ────────────────────────────────────────
  // Matches a word that may be wrapped in backticks, single-, or double-quotes.
  const Q = "[`'\"]?";  // optional opening quote
  const W = "([`'\"]?(\\w+)[`'\"]?)"; // word possibly wrapped in quotes (capture inner \w+)

  // ── High-confidence: rename ──────────────────────────────────────────────────
  const renameRx = new RegExp(`rename\\s+${Q}(\\w+)${Q}\\s+to\\s+${Q}(\\w+)${Q}`, 'i');
  const renameMatch = instruction.match(renameRx);
  if (renameMatch) {
    const [, target, replacement] = renameMatch;
    return {
      instruction,
      target,
      replacement,
      suggestedScope: isAllCells ? 'word-in-codebase' : 'word-in-file',
      scopeRationale: isAllCells
        ? 'Renaming in all cells to keep every reference consistent'
        : 'Renaming all occurrences in the active cell',
      confidence: 'high',
    };
  }

  // ── High-confidence: replace X with Y ────────────────────────────────────────
  const replaceRx = new RegExp(`replace\\s+${Q}(\\w+)${Q}\\s+with\\s+${Q}(\\w+)${Q}`, 'i');
  const replaceMatch = instruction.match(replaceRx);
  if (replaceMatch) {
    const [, target, replacement] = replaceMatch;
    return {
      instruction,
      target,
      replacement,
      suggestedScope: isAllCells ? 'word-in-codebase' : 'word-in-file',
      scopeRationale: 'Replacing matching occurrences with the new name',
      confidence: 'high',
    };
  }

  // ── High-confidence: swap X with/for Y ───────────────────────────────────────
  const swapRx = new RegExp(`swap\\s+${Q}(\\w+)${Q}\\s+(?:with|for)\\s+${Q}(\\w+)${Q}`, 'i');
  const swapMatch = instruction.match(swapRx);
  if (swapMatch) {
    const [, target, replacement] = swapMatch;
    return {
      instruction,
      target,
      replacement,
      suggestedScope: isAllCells ? 'word-in-codebase' : 'word-in-file',
      scopeRationale: 'Swapping all occurrences of the old name for the new one',
      confidence: 'high',
    };
  }

  // ── Medium-confidence: change/update X to Y ───────────────────────────────────
  // Medium because "change the error handling to async" is NOT a word rename.
  const changeRx = new RegExp(`(?:change|update)\\s+${Q}(\\w+)${Q}\\s+to\\s+${Q}(\\w+)${Q}`, 'i');
  const changeMatch = instruction.match(changeRx);
  if (changeMatch) {
    const [, target, replacement] = changeMatch;
    return {
      instruction,
      target,
      replacement,
      suggestedScope: isAllCells ? 'word-in-codebase' : 'word-in-file',
      scopeRationale: 'Updating occurrences — verify target and scope before applying',
      confidence: 'medium',
    };
  }

  // ── High-confidence: delete/remove function ───────────────────────────────────
  if (/delete\s+(?:this\s+)?function|remove\s+(?:this\s+)?function/.test(lower)) {
    return {
      instruction,
      target: '',
      replacement: '',
      suggestedScope: 'function',
      scopeRationale: 'Removing the whole function is safer than ad-hoc selection',
      confidence: 'high',
    };
  }

  // ── High-confidence: delete/remove block ─────────────────────────────────────
  if (/delete\s+(?:this\s+)?block|remove\s+(?:this\s+)?block/.test(lower)) {
    return {
      instruction,
      target: '',
      replacement: '',
      suggestedScope: 'block',
      scopeRationale: 'Removing the enclosing block keeps surrounding code intact',
      confidence: 'high',
    };
  }

  // ── High-confidence: delete/remove line ──────────────────────────────────────
  if (/delete\s+(?:this\s+)?line|remove\s+(?:this\s+)?line/.test(lower)) {
    return {
      instruction,
      target: '',
      replacement: '',
      suggestedScope: 'line',
      scopeRationale: 'Removing only the targeted line',
      confidence: 'high',
    };
  }

  // ── Low-confidence fallback ───────────────────────────────────────────────────
  // No recognised pattern — show a warning in the UI so the user knows to
  // manually verify target and scope before applying.
  return {
    instruction,
    target: '',
    replacement: '',
    suggestedScope: 'word',
    scopeRationale: 'Start with the smallest scope — you can expand it if needed',
    confidence: 'low',
  };
}

// ─── buildEditPreview ─────────────────────────────────────────────────────────

export interface BuildPreviewOptions {
  cells: EditableCell[];
  /** The cell currently focused (used for single-cell scopes). */
  activeCellId: string;
  /** Cursor offset within the active cell's code string. */
  cursorOffset: number;
  scope: EditScope;
  target: string;
  replacement: string;
}

/**
 * Build a full EditPreview — what will change, where, and the diff.
 * This is the main entry point for the trust layer preview step.
 */
export function buildEditPreview(opts: BuildPreviewOptions): EditPreview {
  const { cells, activeCellId, cursorOffset, scope, target, replacement } = opts;
  const activeCell = cells.find(c => c.id === activeCellId) ?? cells[0];

  const matches: ScopeMatch[] = [];

  switch (scope) {
    case 'word': {
      if (!activeCell) break;
      const bounds = target
        ? findFirstOccurrence(activeCell.code, target)
        : wordBoundsAt(activeCell.code, cursorOffset);
      if (bounds && bounds.start !== bounds.end) {
        matches.push({
          cellId: activeCell.id,
          start: bounds.start, end: bounds.end,
          matched: activeCell.code.slice(bounds.start, bounds.end),
          lineNo: lineNumberAt(activeCell.code, bounds.start),
        });
      }
      break;
    }

    case 'line': {
      if (!activeCell) break;
      const bounds = lineBoundsAt(activeCell.code, cursorOffset);
      matches.push({
        cellId: activeCell.id,
        start: bounds.start, end: bounds.end,
        matched: activeCell.code.slice(bounds.start, bounds.end),
        lineNo: lineNumberAt(activeCell.code, bounds.start),
      });
      break;
    }

    case 'block': {
      if (!activeCell) break;
      const bounds = blockBoundsAt(activeCell.code, cursorOffset);
      if (bounds) {
        matches.push({
          cellId: activeCell.id,
          start: bounds.start, end: bounds.end,
          matched: activeCell.code.slice(bounds.start, bounds.end),
          lineNo: lineNumberAt(activeCell.code, bounds.start),
        });
      }
      break;
    }

    case 'function': {
      if (!activeCell) break;
      const bounds = functionBoundsAt(activeCell.code, cursorOffset);
      if (bounds) {
        matches.push({
          cellId: activeCell.id,
          start: bounds.start, end: bounds.end,
          matched: activeCell.code.slice(bounds.start, bounds.end),
          lineNo: lineNumberAt(activeCell.code, bounds.start),
        });
      }
      break;
    }

    case 'file': {
      if (!activeCell) break;
      matches.push({
        cellId: activeCell.id,
        start: 0, end: activeCell.code.length,
        matched: activeCell.code,
        lineNo: 1,
      });
      break;
    }

    case 'word-in-file': {
      if (!activeCell || !target) break;
      const rx = new RegExp(`\\b${escapeRegex(target)}\\b`, 'g');
      for (const m of activeCell.code.matchAll(rx)) {
        matches.push({
          cellId: activeCell.id,
          start: m.index!, end: m.index! + m[0].length,
          matched: m[0],
          lineNo: lineNumberAt(activeCell.code, m.index!),
        });
      }
      break;
    }

    case 'word-in-codebase': {
      if (!target) break;
      const rx = new RegExp(`\\b${escapeRegex(target)}\\b`, 'g');
      for (const cell of cells) {
        for (const m of cell.code.matchAll(rx)) {
          matches.push({
            cellId: cell.id,
            start: m.index!, end: m.index! + m[0].length,
            matched: m[0],
            lineNo: lineNumberAt(cell.code, m.index!),
          });
        }
      }
      break;
    }
  }

  // Compute diff for the first affected cell
  const firstMatch = matches[0];
  let diffLines: EditDiffLine[] = [];

  if (firstMatch) {
    const cell = cells.find(c => c.id === firstMatch.cellId);
    if (cell) {
      const before = cell.code;
      const after  = applyMatchesForCell(cell.code, matches.filter(m => m.cellId === cell.id), replacement);
      diffLines = generateDiffLines(before, after);
    }
  }

  const affectedCellIds = new Set(matches.map(m => m.cellId));
  const risk = SCOPE_RISK[scope];

  return {
    scope,
    scopeLabel: SCOPE_LABEL[scope],
    risk,
    requiresConfirmation: CONFIRMATION_REQUIRED.has(risk),
    target,
    replacement,
    matches,
    matchCount: matches.length,
    affectedCellCount: affectedCellIds.size,
    diffLines,
    noMatches: matches.length === 0,
  };
}

/** Find the first occurrence of `target` word in `text`. */
function findFirstOccurrence(text: string, target: string): { start: number; end: number } | null {
  const rx = new RegExp(`\\b${escapeRegex(target)}\\b`);
  const m  = text.match(rx);
  if (!m || m.index === undefined) return null;
  return { start: m.index, end: m.index + m[0].length };
}

/**
 * Apply a list of matches (for a single cell) to produce the new cell code.
 * Processes right-to-left so offsets remain valid during iteration.
 */
export function applyMatchesForCell(
  code: string,
  matches: ScopeMatch[],
  replacement: string,
): string {
  if (matches.length === 0) return code;
  const sorted = [...matches].sort((a, b) => b.start - a.start); // right to left
  let result = code;
  for (const m of sorted) {
    result = result.slice(0, m.start) + replacement + result.slice(m.end);
  }
  return result;
}

// ─── applyEdit ────────────────────────────────────────────────────────────────

/**
 * Apply an EditPreview to a list of cells.
 * Returns the updated cells array and an UndoSnapshot.
 */
export function applyEdit(
  cells: EditableCell[],
  preview: EditPreview,
): { cells: EditableCell[]; undo: UndoSnapshot } {
  const undo: UndoSnapshot = {
    cells: cells.map(c => ({ id: c.id, code: c.code })),
    description: `Undo: ${preview.scopeLabel} — ${preview.target || 'edit'}`,
  };

  // Group matches by cell
  const matchesByCell = new Map<string, ScopeMatch[]>();
  for (const m of preview.matches) {
    if (!matchesByCell.has(m.cellId)) matchesByCell.set(m.cellId, []);
    matchesByCell.get(m.cellId)!.push(m);
  }

  const updated = cells.map(cell => {
    const cellMatches = matchesByCell.get(cell.id);
    if (!cellMatches) return cell;
    return {
      ...cell,
      code: applyMatchesForCell(cell.code, cellMatches, preview.replacement),
    };
  });

  return { cells: updated, undo };
}

// ─── undoEdit ─────────────────────────────────────────────────────────────────

/**
 * Restore cells from an UndoSnapshot.
 * Returns the restored cells array.
 */
export function undoEdit(
  currentCells: EditableCell[],
  snapshot: UndoSnapshot,
): EditableCell[] {
  const snapshotMap = new Map(snapshot.cells.map(c => [c.id, c.code]));
  return currentCells.map(cell => ({
    ...cell,
    code: snapshotMap.has(cell.id) ? snapshotMap.get(cell.id)! : cell.code,
  }));
}
