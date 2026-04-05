/**
 * tests/dr-eams-code-assist.test.ts
 *
 * Unit tests for lib/code/drEamsCodeAssist.ts — the pure helper layer
 * powering the Dr. Eams code-assist feature inside CodeEngin.
 *
 * All functions under test are deterministic and pure — no network, no DOM.
 */

import { describe, expect, it } from 'vitest';
import {
  matchCodeVocabulary,
  detectLanguageFromCode,
  classifyQuery,
  parseCodeResponse,
  detectNLCommand,
  generateCodeFromCommand,
  buildCodeSystemPrompt,
  VOCAB_TERMS,
  CODE_VOCABULARY,
  type NLCommand,
  type CellLanguage,
} from '@/lib/code/drEamsCodeAssist';

// ── VOCAB_TERMS sanity check ───────────────────────────────────────────────────

describe('VOCAB_TERMS', () => {
  it('contains expected core terms', () => {
    expect(VOCAB_TERMS.has('variable')).toBe(true);
    expect(VOCAB_TERMS.has('function')).toBe(true);
    expect(VOCAB_TERMS.has('class')).toBe(true);
    expect(VOCAB_TERMS.has('recursion')).toBe(true);
    expect(VOCAB_TERMS.has('neural network')).toBe(true);
    expect(VOCAB_TERMS.has('shader')).toBe(true);
  });

  it('does not contain junk', () => {
    expect(VOCAB_TERMS.has('foobar123')).toBe(false);
    expect(VOCAB_TERMS.has('')).toBe(false);
  });
});

// ── CODE_VOCABULARY shape ─────────────────────────────────────────────────────

describe('CODE_VOCABULARY', () => {
  it('every entry has term, category, definition and example', () => {
    for (const entry of CODE_VOCABULARY) {
      expect(typeof entry.term).toBe('string');
      expect(entry.term.length).toBeGreaterThan(0);
      expect(typeof entry.category).toBe('string');
      expect(typeof entry.definition).toBe('string');
      expect(entry.definition.length).toBeGreaterThan(0);
      expect(typeof entry.example).toBe('string');
      expect(entry.example.length).toBeGreaterThan(0);
    }
  });

  it('covers all required categories', () => {
    const cats = new Set(CODE_VOCABULARY.map(v => v.category));
    expect(cats.has('general')).toBe(true);
    expect(cats.has('oop')).toBe(true);
    expect(cats.has('ds')).toBe(true);
    expect(cats.has('algo')).toBe(true);
    expect(cats.has('fp')).toBe(true);
    expect(cats.has('web')).toBe(true);
    expect(cats.has('devops')).toBe(true);
    expect(cats.has('security')).toBe(true);
    expect(cats.has('ai')).toBe(true);
    expect(cats.has('graphics')).toBe(true);
  });
});

// ── matchCodeVocabulary ────────────────────────────────────────────────────────

describe('matchCodeVocabulary', () => {
  it('returns empty array for empty query', () => {
    expect(matchCodeVocabulary('')).toEqual([]);
    expect(matchCodeVocabulary('   ')).toEqual([]);
  });

  it('matches a single known term', () => {
    const results = matchCodeVocabulary('what is a variable?');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.term === 'variable')).toBe(true);
  });

  it('matches multiple terms in one query', () => {
    const results = matchCodeVocabulary('explain recursion and dynamic programming');
    const terms = results.map(r => r.term);
    expect(terms).toContain('recursion');
    expect(terms).toContain('dynamic programming');
  });

  it('is case-insensitive', () => {
    const lower = matchCodeVocabulary('variable');
    const upper = matchCodeVocabulary('VARIABLE');
    expect(lower.length).toBe(upper.length);
  });

  it('returns at most 5 results', () => {
    const results = matchCodeVocabulary('variable function class loop recursion closure async/await callback promise inheritance');
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('returns correct definition field', () => {
    const results = matchCodeVocabulary('closure');
    expect(results[0].definition).toMatch(/captur/i);
  });
});

// ── detectLanguageFromCode ────────────────────────────────────────────────────

describe('detectLanguageFromCode', () => {
  it('returns python for blank input', () => {
    expect(detectLanguageFromCode('')).toBe('python');
  });

  it('detects Python from print()', () => {
    expect(detectLanguageFromCode('print("hello")')).toBe('python');
  });

  it('detects Python from def keyword', () => {
    expect(detectLanguageFromCode('def add(a, b):\n    return a + b')).toBe('python');
  });

  it('detects TypeScript from type annotation', () => {
    expect(detectLanguageFromCode('function greet(name: string): void {\n  console.log(name);\n}')).toBe('typescript');
  });

  it('detects TypeScript from interface keyword', () => {
    expect(detectLanguageFromCode('interface User { id: number; name: string; }')).toBe('typescript');
  });

  it('detects bash from echo command', () => {
    expect(detectLanguageFromCode('echo "hello"\ncd /tmp')).toBe('bash');
  });

  it('detects bash from shebang', () => {
    expect(detectLanguageFromCode('#!/bin/bash\nset -e')).toBe('bash');
  });

  it('detects JavaScript from const/arrow', () => {
    expect(detectLanguageFromCode('const add = (a, b) => a + b;')).toBe('javascript');
  });
});

// ── classifyQuery ─────────────────────────────────────────────────────────────

describe('classifyQuery', () => {
  it('returns general for empty query', () => {
    expect(classifyQuery('')).toBe('general');
  });

  it('classifies explain queries', () => {
    expect(classifyQuery('explain this code')).toBe('explain');
    // When a known vocab term appears with an explain trigger, the intent is 'vocabulary'
    // (vocabulary is a specialised explain — this is the correct/expected behaviour)
    expect(classifyQuery('what does this function do?')).toBe('vocabulary');
    expect(classifyQuery('how does recursion work?')).toBe('vocabulary');
  });

  it('classifies generate queries', () => {
    expect(classifyQuery('write a function that sorts numbers')).toBe('generate');
    expect(classifyQuery('create a class called Dog')).toBe('generate');
    expect(classifyQuery('implement a binary search')).toBe('generate');
  });

  it('classifies refactor queries', () => {
    expect(classifyQuery('refactor this to use async/await')).toBe('refactor');
    expect(classifyQuery('convert this loop to a list comprehension')).toBe('refactor');
  });

  it('classifies debug queries', () => {
    expect(classifyQuery('why does this fail with an exception?')).toBe('debug');
    expect(classifyQuery('fix the bug in this function')).toBe('debug');
  });

  it('classifies vocabulary queries when term is detected with explain', () => {
    expect(classifyQuery('what is a closure?')).toBe('vocabulary');
    expect(classifyQuery('explain the singleton pattern')).toBe('vocabulary');
  });
});

// ── detectNLCommand ───────────────────────────────────────────────────────────

describe('detectNLCommand', () => {
  it('returns null for unrecognised input', () => {
    expect(detectNLCommand('hello world')).toBeNull();
    expect(detectNLCommand('')).toBeNull();
  });

  it('detects create_class', () => {
    const cmd = detectNLCommand('create a class called Dog');
    expect(cmd).not.toBeNull();
    expect(cmd!.type).toBe('create_class');
    expect(cmd!.subject).toBe('Dog');
  });

  it('detects create_class (without "called")', () => {
    const cmd = detectNLCommand('Create a class Animal');
    expect(cmd!.type).toBe('create_class');
  });

  it('detects write_function', () => {
    const cmd = detectNLCommand('write a function called add_numbers');
    expect(cmd!.type).toBe('write_function');
    expect(cmd!.subject).toBe('add_numbers');
  });

  it('detects add_loop', () => {
    const cmd = detectNLCommand('write a for loop that iterates over a list');
    expect(cmd!.type).toBe('add_loop');
  });

  it('detects add_try_except', () => {
    const cmd = detectNLCommand('Add a try-except block to handle division by zero');
    expect(cmd!.type).toBe('add_try_except');
  });

  it('detects refactor_async', () => {
    const cmd = detectNLCommand('Refactor this function to use async/await');
    expect(cmd!.type).toBe('refactor_async');
  });

  it('detects explain', () => {
    const cmd = detectNLCommand('explain this code');
    expect(cmd!.type).toBe('explain');
  });
});

// ── generateCodeFromCommand ───────────────────────────────────────────────────

describe('generateCodeFromCommand', () => {
  it('generates Python class scaffold', () => {
    const cmd: NLCommand = { type: 'create_class', subject: 'Car' };
    const code = generateCodeFromCommand(cmd, 'python');
    expect(code).toContain('class Car');
    expect(code).toContain('def __init__');
  });

  it('generates TypeScript class scaffold', () => {
    const cmd: NLCommand = { type: 'create_class', subject: 'Car' };
    const code = generateCodeFromCommand(cmd, 'typescript');
    expect(code).toContain('class Car');
    expect(code).toContain('constructor');
  });

  it('generates Python function scaffold', () => {
    const cmd: NLCommand = { type: 'write_function', subject: 'greet' };
    const code = generateCodeFromCommand(cmd, 'python');
    expect(code).toContain('def greet');
  });

  it('generates JavaScript loop', () => {
    const cmd: NLCommand = { type: 'add_loop' };
    const code = generateCodeFromCommand(cmd, 'javascript');
    expect(code).toContain('for');
  });

  it('generates Python try/except', () => {
    const cmd: NLCommand = { type: 'add_try_except' };
    const code = generateCodeFromCommand(cmd, 'python');
    expect(code).toContain('try:');
    expect(code).toContain('except');
  });

  it('generates async/await Python', () => {
    const cmd: NLCommand = { type: 'refactor_async' };
    const code = generateCodeFromCommand(cmd, 'python');
    expect(code).toContain('async def');
    expect(code).toContain('await');
  });

  it('uses default subject when not provided', () => {
    const cmd: NLCommand = { type: 'write_function' };
    const code = generateCodeFromCommand(cmd, 'python');
    expect(code).toContain('def my_function');
  });
});

// ── parseCodeResponse ─────────────────────────────────────────────────────────

describe('parseCodeResponse', () => {
  it('parses response with no code blocks', () => {
    const result = parseCodeResponse('Hello! I can help with that.');
    expect(result.text).toBe('Hello! I can help with that.');
    expect(result.codeBlocks).toHaveLength(0);
    expect(result.hasInsertMarker).toBe(false);
  });

  it('extracts a single Python code block', () => {
    const raw = 'Here is the code:\n```python\ndef add(a, b):\n    return a + b\n```\nLet me know if you need more.';
    const result = parseCodeResponse(raw);
    expect(result.codeBlocks).toHaveLength(1);
    expect(result.codeBlocks[0].language).toBe('python');
    expect(result.codeBlocks[0].code).toContain('def add');
    expect(result.text).toContain('Here is the code');
    expect(result.text).not.toContain('```');
  });

  it('extracts multiple code blocks', () => {
    const raw = 'First:\n```python\nx = 1\n```\nThen:\n```bash\necho hello\n```';
    const result = parseCodeResponse(raw);
    expect(result.codeBlocks).toHaveLength(2);
    expect(result.codeBlocks[0].language).toBe('python');
    expect(result.codeBlocks[1].language).toBe('bash');
  });

  it('detects INSERT marker', () => {
    const raw = 'Insert this:\n<!-- INSERT -->\n```python\npass\n```';
    const result = parseCodeResponse(raw);
    expect(result.hasInsertMarker).toBe(true);
  });

  it('handles code block with no language label', () => {
    const raw = '```\nsome code\n```';
    const result = parseCodeResponse(raw);
    expect(result.codeBlocks[0].language).toBe('text');
    expect(result.codeBlocks[0].code).toBe('some code');
  });
});

// ── buildCodeSystemPrompt ─────────────────────────────────────────────────────

describe('buildCodeSystemPrompt', () => {
  it('includes language in prompt', () => {
    const prompt = buildCodeSystemPrompt({ language: 'python', selectedCode: '' });
    expect(prompt).toContain('python');
  });

  it('includes selected code when provided', () => {
    const code = 'def foo(): pass';
    const prompt = buildCodeSystemPrompt({ language: 'python', selectedCode: code });
    expect(prompt).toContain(code);
  });

  it('says "No code selected" when empty', () => {
    const prompt = buildCodeSystemPrompt({ language: 'typescript', selectedCode: '' });
    expect(prompt).toContain('No code selected');
  });

  it('caps selected code at 2000 chars', () => {
    const longCode = 'x = 1\n'.repeat(400); // > 2000 chars
    const prompt = buildCodeSystemPrompt({ language: 'python', selectedCode: longCode });
    // The snippet in the prompt should be truncated to ≤ 2000 chars
    const snippetStart = prompt.indexOf('```python');
    const snippetEnd = prompt.lastIndexOf('```');
    const snippet = prompt.slice(snippetStart, snippetEnd);
    expect(snippet.length).toBeLessThanOrEqual(2200); // fence + 2000 + small overhead
  });

  it('includes privacy notice', () => {
    const prompt = buildCodeSystemPrompt({ language: 'python', selectedCode: '' });
    expect(prompt.toLowerCase()).toMatch(/privacy|shared|snippet/);
  });
});
