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
  'word-in-codebase': 'Same word in codebase',
};

export const SCOPE_DESCRIPTION: Record<EditScope, string> = {
  'word':             'Change only the selected/cursor word — nothing else',
  'line':             'Change the entire line the cursor is on',
  'block':            'Change everything inside the nearest { … } block',
  'function':         'Change the full function/def the cursor is inside',
  'file':             'Replace the entire content of this code cell',
  'word-in-file':     'Change every occurrence of this word in the active cell',
  'word-in-codebase': 'Change every occurrence of this word across all cells',
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

/** Find the nearest enclosing { … } block. Returns null if not found. */
export function blockBoundsAt(text: string, cursor: number): { start: number; end: number } | null {
  let depth = 0;
  let blockStart = -1;
  for (let i = cursor; i >= 0; i--) {
    if (text[i] === '}') depth++;
    else if (text[i] === '{') {
      if (depth === 0) { blockStart = i; break; }
      depth--;
    }
  }
  if (blockStart === -1) return null;

  depth = 0;
  let blockEnd = -1;
  for (let i = cursor; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      if (depth === 0) { blockEnd = i + 1; break; }
      depth--;
    }
  }
  if (blockEnd === -1) return null;
  return { start: blockStart, end: blockEnd };
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
 * Uses simple heuristics — no ML/eval involved.
 * Called by the Dr. Eams simulate handler in CodeEngin.
 */
export function parseAiInstruction(instruction: string): AiSuggestion {
  const lower = instruction.toLowerCase().trim();

  // Rename / rename all
  const renameMatch = instruction.match(/rename\s+[`'"]?(\w+)[`'"]?\s+to\s+[`'"]?(\w+)[`'"]?/i);
  if (renameMatch) {
    const [, target, replacement] = renameMatch;
    const isAll = /everywhere|all|codebase/.test(lower);
    return {
      instruction,
      target,
      replacement,
      suggestedScope: isAll ? 'word-in-codebase' : 'word-in-file',
      scopeRationale: isAll
        ? 'Renaming everywhere to keep all references consistent'
        : 'Renaming all occurrences in this file',
    };
  }

  // Replace X with Y
  const replaceMatch = instruction.match(/replace\s+[`'"]?(\w+)[`'"]?\s+with\s+[`'"]?(\w+)[`'"]?/i);
  if (replaceMatch) {
    const [, target, replacement] = replaceMatch;
    const isAll = /everywhere|all|codebase/.test(lower);
    return {
      instruction,
      target,
      replacement,
      suggestedScope: isAll ? 'word-in-codebase' : 'word-in-file',
      scopeRationale: 'Replacing matching occurrences with the new name',
    };
  }

  // Delete / remove this function / block
  if (/delete\s+(?:this\s+)?function|remove\s+(?:this\s+)?function/.test(lower)) {
    return {
      instruction,
      target: '',
      replacement: '',
      suggestedScope: 'function',
      scopeRationale: 'Removing the whole function is safer than ad-hoc selection',
    };
  }

  // Delete / remove this block
  if (/delete\s+(?:this\s+)?block|remove\s+(?:this\s+)?block/.test(lower)) {
    return {
      instruction,
      target: '',
      replacement: '',
      suggestedScope: 'block',
      scopeRationale: 'Removing the enclosing block keeps surrounding code intact',
    };
  }

  // Delete / remove this line
  if (/delete\s+(?:this\s+)?line|remove\s+(?:this\s+)?line/.test(lower)) {
    return {
      instruction,
      target: '',
      replacement: '',
      suggestedScope: 'line',
      scopeRationale: 'Removing only the targeted line',
    };
  }

  // Generic "change/update/refactor" → suggest word scope
  return {
    instruction,
    target: '',
    replacement: '',
    suggestedScope: 'word',
    scopeRationale: 'Start with the smallest scope — you can expand it if needed',
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
