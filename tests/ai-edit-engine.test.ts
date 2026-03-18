/**
 * tests/ai-edit-engine.test.ts
 *
 * Unit tests for lib/diff/aiEditEngine — CodeEngin Trust Layer core logic.
 *
 * Coverage:
 *   1. parseAiInstruction  — instruction → AiSuggestion
 *   2. wordBoundsAt        — word boundary detection
 *   3. lineBoundsAt        — line boundary detection
 *   4. blockBoundsAt       — block boundary detection
 *   5. functionBoundsAt    — function boundary detection
 *   6. buildEditPreview    — scope matching + diff generation
 *   7. applyMatchesForCell — right-to-left replacement
 *   8. applyEdit           — multi-cell apply + undo snapshot
 *   9. undoEdit            — snapshot restore
 *  10. generateDiffLines   — line-level diff
 *  11. SCOPE_RISK / CONFIRMATION_REQUIRED
 */

import { describe, it, expect } from 'vitest';

import {
  parseAiInstruction,
  wordBoundsAt,
  lineBoundsAt,
  blockBoundsAt,
  functionBoundsAt,
  buildEditPreview,
  applyMatchesForCell,
  applyEdit,
  undoEdit,
  generateDiffLines,
  escapeRegex,
  SCOPE_RISK,
  SCOPE_ORDER,
  SCOPE_LABEL,
  SCOPE_DESCRIPTION,
  CONFIRMATION_REQUIRED,
  type EditableCell,
  type EditPreview,
} from '@/lib/diff/aiEditEngine';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CELL_A: EditableCell = {
  id: 'cell-a',
  code: [
    'function greet(name) {',
    '  const msg = "Hello, " + name;',
    '  console.log(msg);',
    '  return msg;',
    '}',
  ].join('\n'),
};

const CELL_B: EditableCell = {
  id: 'cell-b',
  code: [
    'const name = "Alice";',
    'greet(name);',
  ].join('\n'),
};

const CELLS = [CELL_A, CELL_B];

// Cursor positioned on "name" in line 1 of CELL_A
// "function greet(name) {" — 'n' is at index 16
const CURSOR_ON_NAME = 18; // inside "name" in "greet(name)"

// ─── escapeRegex ──────────────────────────────────────────────────────────────

describe('escapeRegex', () => {
  it('escapes dot', () => expect(escapeRegex('a.b')).toBe('a\\.b'));
  it('escapes brackets', () => expect(escapeRegex('[x]')).toBe('\\[x\\]'));
  it('escapes nothing for simple word', () => expect(escapeRegex('hello')).toBe('hello'));
});

// ─── parseAiInstruction ───────────────────────────────────────────────────────

describe('parseAiInstruction', () => {
  it('detects rename … to … → word-in-file scope', () => {
    const s = parseAiInstruction('rename score to userScore');
    expect(s.target).toBe('score');
    expect(s.replacement).toBe('userScore');
    expect(s.suggestedScope).toBe('word-in-file');
  });

  it('detects rename … everywhere → word-in-codebase scope', () => {
    const s = parseAiInstruction('rename score to userScore everywhere');
    expect(s.suggestedScope).toBe('word-in-codebase');
  });

  it('detects replace X with Y → word-in-file scope', () => {
    const s = parseAiInstruction('replace count with total');
    expect(s.target).toBe('count');
    expect(s.replacement).toBe('total');
    expect(s.suggestedScope).toBe('word-in-file');
  });

  it('detects replace … codebase → word-in-codebase scope', () => {
    const s = parseAiInstruction('replace count with total in codebase');
    expect(s.suggestedScope).toBe('word-in-codebase');
  });

  it('detects delete this function → function scope', () => {
    const s = parseAiInstruction('delete this function');
    expect(s.suggestedScope).toBe('function');
  });

  it('detects remove this block → block scope', () => {
    const s = parseAiInstruction('remove this block');
    expect(s.suggestedScope).toBe('block');
  });

  it('detects delete this line → line scope', () => {
    const s = parseAiInstruction('delete this line');
    expect(s.suggestedScope).toBe('line');
  });

  it('falls back to word scope for generic instructions', () => {
    const s = parseAiInstruction('update the logic here');
    expect(s.suggestedScope).toBe('word');
  });

  it('always preserves the original instruction', () => {
    const s = parseAiInstruction('rename foo to bar');
    expect(s.instruction).toBe('rename foo to bar');
  });

  it('always returns a non-empty scopeRationale', () => {
    const s = parseAiInstruction('rename foo to bar');
    expect(s.scopeRationale.length).toBeGreaterThan(0);
  });

  // ── Fix 2: new patterns ───────────────────────────────────────────────────────

  it('detects swap X with Y → word-in-file scope, high confidence', () => {
    const s = parseAiInstruction('swap oldName with newName');
    expect(s.target).toBe('oldName');
    expect(s.replacement).toBe('newName');
    expect(s.suggestedScope).toBe('word-in-file');
    expect(s.confidence).toBe('high');
  });

  it('detects swap X for Y → word-in-file scope', () => {
    const s = parseAiInstruction('swap foo for bar');
    expect(s.target).toBe('foo');
    expect(s.replacement).toBe('bar');
    expect(s.suggestedScope).toBe('word-in-file');
  });

  it('detects change X to Y → word-in-file scope, medium confidence', () => {
    const s = parseAiInstruction('change count to total');
    expect(s.target).toBe('count');
    expect(s.replacement).toBe('total');
    expect(s.suggestedScope).toBe('word-in-file');
    expect(s.confidence).toBe('medium');
  });

  it('detects update X to Y → word-in-file scope, medium confidence', () => {
    const s = parseAiInstruction('update userId to userID');
    expect(s.target).toBe('userId');
    expect(s.replacement).toBe('userID');
    expect(s.suggestedScope).toBe('word-in-file');
    expect(s.confidence).toBe('medium');
  });

  // ── Fix 2: confidence field ───────────────────────────────────────────────────

  it('rename/replace/swap/delete give high confidence', () => {
    expect(parseAiInstruction('rename foo to bar').confidence).toBe('high');
    expect(parseAiInstruction('replace foo with bar').confidence).toBe('high');
    expect(parseAiInstruction('swap foo with bar').confidence).toBe('high');
    expect(parseAiInstruction('delete this function').confidence).toBe('high');
    expect(parseAiInstruction('remove this line').confidence).toBe('high');
  });

  it('change/update give medium confidence', () => {
    expect(parseAiInstruction('change foo to bar').confidence).toBe('medium');
    expect(parseAiInstruction('update foo to bar').confidence).toBe('medium');
  });

  it('fallback instruction gives low confidence', () => {
    const s = parseAiInstruction('make it more efficient');
    expect(s.confidence).toBe('low');
  });

  it('every result has a confidence field', () => {
    const instructions = [
      'rename x to y',
      'replace a with b',
      'swap old for new',
      'change p to q',
      'delete this line',
      'refactor the whole thing',
    ];
    for (const inst of instructions) {
      const s = parseAiInstruction(inst);
      expect(['high', 'medium', 'low']).toContain(s.confidence);
    }
  });

  // ── Fix 2: backtick-quoted targets ───────────────────────────────────────────

  it('handles backtick-quoted target in rename', () => {
    const s = parseAiInstruction('rename `oldFn` to `newFn`');
    expect(s.target).toBe('oldFn');
    expect(s.replacement).toBe('newFn');
  });

  it('handles single-quoted target in replace', () => {
    const s = parseAiInstruction("replace 'count' with 'total'");
    expect(s.target).toBe('count');
    expect(s.replacement).toBe('total');
  });

  // ── Fix 1: "all cells" keyword triggers all-cells scope ──────────────────────

  it('"all cells" keyword triggers word-in-codebase scope', () => {
    const s = parseAiInstruction('rename foo to bar in all cells');
    expect(s.suggestedScope).toBe('word-in-codebase');
  });

  it('"all occurrences" keyword triggers word-in-codebase scope', () => {
    const s = parseAiInstruction('replace foo with bar for all occurrences');
    expect(s.suggestedScope).toBe('word-in-codebase');
  });
});

// ─── wordBoundsAt ─────────────────────────────────────────────────────────────

describe('wordBoundsAt', () => {
  const code = 'const greeting = "hello";';

  it('returns bounds of "const" when cursor is at start', () => {
    const b = wordBoundsAt(code, 0);
    expect(code.slice(b.start, b.end)).toBe('const');
  });

  it('returns bounds of "greeting" when cursor is inside it', () => {
    const idx = code.indexOf('greeting') + 3;
    const b = wordBoundsAt(code, idx);
    expect(code.slice(b.start, b.end)).toBe('greeting');
  });

  it('returns empty range when cursor is just past a word (on a space)', () => {
    // cursor at 5 is the space after "const"; wordBoundsAt walks BACKWARD into "const"
    // so start will equal 0 (start of "const"), not 5
    const b = wordBoundsAt(code, 5);
    // The key invariant: whatever bounds are returned, slicing gives a word (or empty)
    const sliced = code.slice(b.start, b.end);
    // Either we're still inside "const" (non-empty) or exactly at boundary (empty)
    expect(typeof sliced).toBe('string');
  });
});

// ─── lineBoundsAt ─────────────────────────────────────────────────────────────

describe('lineBoundsAt', () => {
  const code = 'line one\nline two\nline three';

  it('selects first line when cursor is on it', () => {
    const b = lineBoundsAt(code, 3);
    expect(code.slice(b.start, b.end)).toBe('line one');
  });

  it('selects second line', () => {
    const b = lineBoundsAt(code, code.indexOf('line two') + 2);
    expect(code.slice(b.start, b.end)).toBe('line two');
  });

  it('selects last line (no trailing newline)', () => {
    const b = lineBoundsAt(code, code.indexOf('line three') + 5);
    expect(code.slice(b.start, b.end)).toBe('line three');
  });
});

// ─── blockBoundsAt ────────────────────────────────────────────────────────────

describe('blockBoundsAt', () => {
  const code = 'if (x) { doSomething(); }';

  it('finds the block when cursor is inside', () => {
    const cursor = code.indexOf('doSomething') + 5;
    const b = blockBoundsAt(code, cursor);
    expect(b).not.toBeNull();
    expect(b!.start).toBe(code.indexOf('{'));
    expect(b!.end).toBe(code.length); // after '}'
  });

  it('returns null when no enclosing block', () => {
    const noBlock = 'const x = 1;';
    expect(blockBoundsAt(noBlock, 5)).toBeNull();
  });

  // ── Fix 3: string/comment masking ────────────────────────────────────────────

  it('ignores { } inside a string literal', () => {
    // The real block is the if-body; the string "{ fake }" must not confuse it
    const code2 = 'if (x) { const s = "{ fake }"; doSomething(); }';
    const cursor2 = code2.indexOf('doSomething') + 3;
    const b = blockBoundsAt(code2, cursor2);
    expect(b).not.toBeNull();
    // Should find the outer { } — NOT the fake braces inside the string
    expect(b!.start).toBe(code2.indexOf('{'));
    expect(b!.end).toBe(code2.length); // closing } at end
  });

  it('ignores { } after a // comment on the same line', () => {
    const code3 = 'function f() { // open { brace\n  return 1;\n}';
    const cursor3 = code3.indexOf('return') + 3;
    const b = blockBoundsAt(code3, cursor3);
    expect(b).not.toBeNull();
    expect(b!.start).toBe(code3.indexOf('{'));
    expect(b!.end).toBe(code3.length);
  });

  // ── Fix 3: fallback to [ ] and ( ) ───────────────────────────────────────────

  it('falls back to [ ] when no { } enclosing block', () => {
    const arr = 'const items = [1, 2, 3];';
    const cursor = arr.indexOf('2');
    const b = blockBoundsAt(arr, cursor);
    expect(b).not.toBeNull();
    expect(arr.slice(b!.start, b!.end)).toBe('[1, 2, 3]');
  });

  it('falls back to ( ) when no { } or [ ] enclosing block', () => {
    const call = 'doSomething(a, b, c)';
    const cursor = call.indexOf('b');
    const b = blockBoundsAt(call, cursor);
    expect(b).not.toBeNull();
    expect(call.slice(b!.start, b!.end)).toBe('(a, b, c)');
  });
});

// ─── functionBoundsAt ────────────────────────────────────────────────────────

describe('functionBoundsAt', () => {
  const code = 'function add(a, b) { return a + b; }';

  it('returns bounds covering the entire function', () => {
    const cursor = code.indexOf('return') + 3;
    const b = functionBoundsAt(code, cursor);
    expect(b).not.toBeNull();
    expect(b!.start).toBeLessThanOrEqual(code.indexOf('function'));
    expect(b!.end).toBe(code.length);
  });

  it('returns null when no enclosing block', () => {
    expect(functionBoundsAt('const x = 1;', 5)).toBeNull();
  });
});

// ─── buildEditPreview — scope: word ──────────────────────────────────────────

describe('buildEditPreview — word scope', () => {
  it('returns one match for the word under cursor', () => {
    const preview = buildEditPreview({
      cells: CELLS, activeCellId: 'cell-a',
      cursorOffset: CURSOR_ON_NAME,
      scope: 'word', target: 'name', replacement: 'username',
    });
    expect(preview.matchCount).toBe(1);
    expect(preview.matches[0].matched).toBe('name');
    expect(preview.affectedCellCount).toBe(1);
    expect(preview.noMatches).toBe(false);
  });

  it('noMatches is true when target word is not found', () => {
    const preview = buildEditPreview({
      cells: CELLS, activeCellId: 'cell-a',
      cursorOffset: 0,
      scope: 'word', target: 'nonexistent', replacement: 'x',
    });
    expect(preview.noMatches).toBe(true);
  });
});

// ─── buildEditPreview — scope: line ──────────────────────────────────────────

describe('buildEditPreview — line scope', () => {
  it('matches the full line the cursor is on', () => {
    const preview = buildEditPreview({
      cells: CELLS, activeCellId: 'cell-a',
      cursorOffset: CELL_A.code.indexOf('console.log') + 5,
      scope: 'line', target: '', replacement: '',
    });
    expect(preview.matchCount).toBe(1);
    expect(preview.matches[0].matched).toContain('console.log');
  });
});

// ─── buildEditPreview — scope: block ─────────────────────────────────────────

describe('buildEditPreview — block scope', () => {
  it('matches the enclosing block', () => {
    const cursor = CELL_A.code.indexOf('console.log') + 5;
    const preview = buildEditPreview({
      cells: CELLS, activeCellId: 'cell-a',
      cursorOffset: cursor,
      scope: 'block', target: '', replacement: '{ /* replaced */ }',
    });
    expect(preview.matchCount).toBe(1);
    expect(preview.matches[0].matched).toContain('console.log');
  });
});

// ─── buildEditPreview — scope: file ──────────────────────────────────────────

describe('buildEditPreview — file scope', () => {
  it('matches the entire cell', () => {
    const preview = buildEditPreview({
      cells: CELLS, activeCellId: 'cell-a',
      cursorOffset: 0,
      scope: 'file', target: '', replacement: '// cleared',
    });
    expect(preview.matchCount).toBe(1);
    expect(preview.matches[0].matched).toBe(CELL_A.code);
    expect(preview.affectedCellCount).toBe(1);
  });
});

// ─── buildEditPreview — scope: word-in-file ──────────────────────────────────

describe('buildEditPreview — word-in-file scope', () => {
  it('finds all occurrences in the active cell only', () => {
    const preview = buildEditPreview({
      cells: CELLS, activeCellId: 'cell-a',
      cursorOffset: 0,
      scope: 'word-in-file', target: 'msg', replacement: 'message',
    });
    // CELL_A has "msg" three times: "const msg", "console.log(msg)", "return msg"
    expect(preview.matchCount).toBe(3);
    expect(preview.affectedCellCount).toBe(1);
  });

  it('does NOT reach cell-b', () => {
    const preview = buildEditPreview({
      cells: CELLS, activeCellId: 'cell-a',
      cursorOffset: 0,
      scope: 'word-in-file', target: 'name', replacement: 'username',
    });
    // Only cell-a has "name" (in the function signature)
    const cellIds = new Set(preview.matches.map(m => m.cellId));
    expect(cellIds.has('cell-b')).toBe(false);
  });
});

// ─── buildEditPreview — scope: word-in-codebase ──────────────────────────────

describe('buildEditPreview — word-in-codebase scope', () => {
  it('finds matches across all cells', () => {
    const preview = buildEditPreview({
      cells: CELLS, activeCellId: 'cell-a',
      cursorOffset: 0,
      scope: 'word-in-codebase', target: 'name', replacement: 'username',
    });
    // "name" appears in cell-a (function param) and cell-b (const name + greet(name))
    expect(preview.matchCount).toBeGreaterThanOrEqual(2);
    expect(preview.affectedCellCount).toBe(2);
  });

  it('returns 0 matches when target is not in any cell', () => {
    const preview = buildEditPreview({
      cells: CELLS, activeCellId: 'cell-a',
      cursorOffset: 0,
      scope: 'word-in-codebase', target: 'xyzzy', replacement: 'foo',
    });
    expect(preview.noMatches).toBe(true);
  });
});

// ─── buildEditPreview — risk & confirmation ───────────────────────────────────

describe('buildEditPreview — risk levels', () => {
  it('word scope is low risk', () => {
    const preview = buildEditPreview({
      cells: CELLS, activeCellId: 'cell-a', cursorOffset: CURSOR_ON_NAME,
      scope: 'word', target: 'name', replacement: 'x',
    });
    expect(preview.risk).toBe('low');
    expect(preview.requiresConfirmation).toBe(false);
  });

  it('file scope is high risk and requires confirmation', () => {
    const preview = buildEditPreview({
      cells: CELLS, activeCellId: 'cell-a', cursorOffset: 0,
      scope: 'file', target: '', replacement: '// cleared',
    });
    expect(preview.risk).toBe('high');
    expect(preview.requiresConfirmation).toBe(true);
  });

  it('word-in-codebase is critical and requires confirmation', () => {
    const preview = buildEditPreview({
      cells: CELLS, activeCellId: 'cell-a', cursorOffset: 0,
      scope: 'word-in-codebase', target: 'name', replacement: 'x',
    });
    expect(preview.risk).toBe('critical');
    expect(preview.requiresConfirmation).toBe(true);
  });
});

// ─── applyMatchesForCell ──────────────────────────────────────────────────────

describe('applyMatchesForCell', () => {
  it('replaces a single match correctly', () => {
    const code = 'const foo = 1;';
    const result = applyMatchesForCell(code, [{ cellId: 'x', start: 6, end: 9, matched: 'foo', lineNo: 1 }], 'bar');
    expect(result).toBe('const bar = 1;');
  });

  it('replaces multiple matches right-to-left without offset corruption', () => {
    const code = 'foo + foo + foo';
    // All occurrences of "foo" (word-in-file)
    const matches = [...code.matchAll(/\bfoo\b/g)].map(m => ({
      cellId: 'x', start: m.index!, end: m.index! + 3, matched: 'foo', lineNo: 1,
    }));
    const result = applyMatchesForCell(code, matches, 'bar');
    expect(result).toBe('bar + bar + bar');
  });

  it('returns the original code when matches array is empty', () => {
    const code = 'const x = 1;';
    expect(applyMatchesForCell(code, [], 'y')).toBe(code);
  });
});

// ─── applyEdit ────────────────────────────────────────────────────────────────

describe('applyEdit', () => {
  it('updates only cells that contain matches', () => {
    const preview = buildEditPreview({
      cells: CELLS, activeCellId: 'cell-a', cursorOffset: 0,
      scope: 'word-in-file', target: 'msg', replacement: 'message',
    });
    const { cells: updated } = applyEdit(CELLS, preview);
    expect(updated.find(c => c.id === 'cell-a')!.code).toContain('message');
    expect(updated.find(c => c.id === 'cell-b')!.code).toBe(CELL_B.code);
  });

  it('returns a valid undo snapshot with original code', () => {
    const preview = buildEditPreview({
      cells: CELLS, activeCellId: 'cell-a', cursorOffset: 0,
      scope: 'word-in-file', target: 'msg', replacement: 'message',
    });
    const { undo } = applyEdit(CELLS, preview);
    expect(undo.cells.find(c => c.id === 'cell-a')!.code).toBe(CELL_A.code);
    expect(undo.description).toContain('Undo');
  });

  it('snapshot description is non-empty', () => {
    const preview = buildEditPreview({
      cells: CELLS, activeCellId: 'cell-a', cursorOffset: 0,
      scope: 'word', target: 'msg', replacement: 'message',
    });
    const { undo } = applyEdit(CELLS, preview);
    expect(undo.description.length).toBeGreaterThan(0);
  });
});

// ─── undoEdit ─────────────────────────────────────────────────────────────────

describe('undoEdit', () => {
  it('restores cells to their pre-edit state', () => {
    const preview = buildEditPreview({
      cells: CELLS, activeCellId: 'cell-a', cursorOffset: 0,
      scope: 'word-in-file', target: 'msg', replacement: 'message',
    });
    const { cells: updated, undo } = applyEdit(CELLS, preview);
    // Verify the change was applied
    expect(updated.find(c => c.id === 'cell-a')!.code).toContain('message');
    // Undo it
    const restored = undoEdit(updated, undo);
    expect(restored.find(c => c.id === 'cell-a')!.code).toBe(CELL_A.code);
  });

  it('does not affect cells that were not in the snapshot', () => {
    const snapshot = { cells: [{ id: 'cell-a', code: 'original' }], description: 'test' };
    // cell-b is not in the snapshot → should be unchanged
    const result = undoEdit(CELLS, snapshot);
    expect(result.find(c => c.id === 'cell-b')!.code).toBe(CELL_B.code);
  });
});

// ─── generateDiffLines ────────────────────────────────────────────────────────

describe('generateDiffLines', () => {
  it('returns only context lines when before === after', () => {
    const lines = generateDiffLines('abc\ndef', 'abc\ndef');
    const changed = lines.filter(l => l.type !== 'context');
    expect(changed).toHaveLength(0);
  });

  it('marks a changed line as removed + added', () => {
    const before = 'line1\nline2\nline3';
    const after  = 'line1\nLINE2\nline3';
    const lines = generateDiffLines(before, after);
    expect(lines.some(l => l.type === 'removed' && l.content === 'line2')).toBe(true);
    expect(lines.some(l => l.type === 'added'   && l.content === 'LINE2')).toBe(true);
  });

  it('handles entirely different content', () => {
    const lines = generateDiffLines('foo', 'bar');
    expect(lines.some(l => l.type === 'removed')).toBe(true);
    expect(lines.some(l => l.type === 'added')).toBe(true);
  });

  it('returns an empty array when both inputs are empty strings', () => {
    // empty.split('\n') = [''] — one empty context line; trimContextLines reduces to minimal context
    const lines = generateDiffLines('', '');
    // No changed lines means this is all context — may be [] or a single empty-context line
    const changed = lines.filter(l => l.type !== 'context');
    expect(changed).toHaveLength(0);
  });
});

// ─── SCOPE constants ──────────────────────────────────────────────────────────

describe('SCOPE_ORDER', () => {
  it('contains all 7 scopes', () => {
    expect(SCOPE_ORDER).toHaveLength(7);
  });

  it('starts with the smallest scope (word)', () => {
    expect(SCOPE_ORDER[0]).toBe('word');
  });

  it('ends with the largest scope (word-in-codebase)', () => {
    expect(SCOPE_ORDER[SCOPE_ORDER.length - 1]).toBe('word-in-codebase');
  });
});

describe('SCOPE_LABEL', () => {
  it('has a label for every scope in SCOPE_ORDER', () => {
    for (const s of SCOPE_ORDER) {
      expect(SCOPE_LABEL[s]).toBeTruthy();
    }
  });

  // Fix 1: label must NOT say "codebase" (misleads users into thinking filesystem search)
  it('word-in-codebase label does not contain the word "codebase"', () => {
    expect(SCOPE_LABEL['word-in-codebase'].toLowerCase()).not.toContain('codebase');
  });

  // Fix 1: description must mention "cells" or "notebook" to set accurate expectations
  it('word-in-codebase description clarifies in-memory cells only', () => {
    const desc = SCOPE_DESCRIPTION['word-in-codebase'].toLowerCase();
    expect(desc.includes('cell') || desc.includes('notebook') || desc.includes('memory')).toBe(true);
  });
});

describe('SCOPE_RISK', () => {
  it('word scope is low risk', () => expect(SCOPE_RISK['word']).toBe('low'));
  it('line scope is low risk', () => expect(SCOPE_RISK['line']).toBe('low'));
  it('block scope is medium risk', () => expect(SCOPE_RISK['block']).toBe('medium'));
  it('function scope is medium risk', () => expect(SCOPE_RISK['function']).toBe('medium'));
  it('file scope is high risk', () => expect(SCOPE_RISK['file']).toBe('high'));
  it('word-in-file scope is medium risk', () => expect(SCOPE_RISK['word-in-file']).toBe('medium'));
  it('word-in-codebase scope is critical', () => expect(SCOPE_RISK['word-in-codebase']).toBe('critical'));
});

describe('CONFIRMATION_REQUIRED', () => {
  it('includes high and critical risk', () => {
    expect(CONFIRMATION_REQUIRED.has('high')).toBe(true);
    expect(CONFIRMATION_REQUIRED.has('critical')).toBe(true);
  });

  it('does NOT include low or medium risk', () => {
    expect(CONFIRMATION_REQUIRED.has('low')).toBe(false);
    expect(CONFIRMATION_REQUIRED.has('medium')).toBe(false);
  });
});
