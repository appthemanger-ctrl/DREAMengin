/**
 * CodeEngin core — pure code parsing helpers.
 *
 * Stateless, side-effect-free utilities that operate on source code strings.
 * No UI, no AI, no network calls live here.
 *
 * Strategy: lightweight regex-based analysis that works in any JS environment
 * (browser, Node, edge) without external dependencies. This covers the 80 %
 * use-case: syntax validation hints, symbol extraction, and structure checks.
 * For full AST work (refactoring, type-aware edits) the AI co-pilot route
 * delegates to the server-side Groq/Claude models instead.
 */

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ParseError {
  line: number;
  col: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParsedSymbol {
  kind: 'function' | 'class' | 'variable' | 'import' | 'export' | 'type';
  name: string;
  line: number;
}

export interface ParseResult {
  /** Always null — reserved for future full-AST integration. */
  ast: null;
  errors: ParseError[];
  warnings: ParseError[];
  symbols: ParsedSymbol[];
  /** Detected language (normalised), e.g. 'typescript', 'python'. */
  language: string;
  /** Line count. */
  lineCount: number;
  /** True when the parser found no structural errors it could detect. */
  structurallyValid: boolean;
}

// ─── Language normalisation ───────────────────────────────────────────────────

const LANG_ALIASES: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript',
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  py: 'python', python3: 'python',
  rs: 'rust',
  go: 'go', golang: 'go',
  rb: 'ruby',
  java: 'java',
  cs: 'csharp', 'c#': 'csharp',
  cpp: 'cpp', 'c++': 'cpp', cc: 'cpp',
  c: 'c',
  sh: 'bash', bash: 'bash', zsh: 'bash',
  sql: 'sql',
  json: 'json',
  md: 'markdown', markdown: 'markdown',
  html: 'html',
  css: 'css',
  scss: 'scss',
  yaml: 'yaml', yml: 'yaml',
  toml: 'toml',
};

function normaliseLanguage(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return LANG_ALIASES[lower] ?? lower;
}

// ─── Per-language symbol extractors ──────────────────────────────────────────

function extractTSSymbols(lines: string[]): ParsedSymbol[] {
  const symbols: ParsedSymbol[] = [];
  const funcRe   = /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/;
  const arrowRe  = /(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/;
  const classRe  = /(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/;
  const importRe = /^import\s+.+\s+from\s+['"]([^'"]+)['"]/;
  const typeRe   = /(?:export\s+)?(?:type|interface)\s+([A-Za-z_$][\w$]*)/;
  const varRe    = /(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*[:=]/;

  lines.forEach((line, i: number) => {
    const ln = i + 1;
    let m: RegExpMatchArray | null;
    if ((m = line.match(funcRe)))        symbols.push({ kind: 'function', name: m[1], line: ln });
    else if ((m = line.match(arrowRe)))  symbols.push({ kind: 'function', name: m[1], line: ln });
    else if ((m = line.match(classRe)))  symbols.push({ kind: 'class',    name: m[1], line: ln });
    else if ((m = line.match(typeRe)))   symbols.push({ kind: 'type',     name: m[1], line: ln });
    else if ((m = line.match(importRe))) symbols.push({ kind: 'import',   name: m[1], line: ln });
    else if ((m = line.match(varRe)))    symbols.push({ kind: 'variable', name: m[1], line: ln });
  });
  return symbols;
}

function extractPythonSymbols(lines: string[]): ParsedSymbol[] {
  const symbols: ParsedSymbol[] = [];
  const funcRe   = /^(?:async\s+)?def\s+([A-Za-z_][\w]*)/;
  const classRe  = /^class\s+([A-Za-z_][\w]*)/;
  const importRe = /^(?:import|from)\s+(\S+)/;

  lines.forEach((line, i: number) => {
    const ln = i + 1;
    const trimmed = line.trimStart();
    let m: RegExpMatchArray | null;
    if ((m = trimmed.match(funcRe)))        symbols.push({ kind: 'function', name: m[1], line: ln });
    else if ((m = trimmed.match(classRe)))  symbols.push({ kind: 'class',    name: m[1], line: ln });
    else if ((m = trimmed.match(importRe))) symbols.push({ kind: 'import',   name: m[1], line: ln });
  });
  return symbols;
}

function extractGoSymbols(lines: string[]): ParsedSymbol[] {
  const symbols: ParsedSymbol[] = [];
  const funcRe   = /^func\s+(?:\([^)]+\)\s+)?([A-Za-z_][\w]*)/;
  const typeRe   = /^type\s+([A-Za-z_][\w]*)/;
  const importRe = /^\s*"([^"]+)"/;

  let inImportBlock = false;
  lines.forEach((line, i: number) => {
    const ln = i + 1;
    if (line.trim() === 'import (') { inImportBlock = true; return; }
    if (inImportBlock && line.trim() === ')') { inImportBlock = false; return; }

    let m: RegExpMatchArray | null;
    if (inImportBlock) {
      if ((m = line.match(importRe))) symbols.push({ kind: 'import',   name: m[1], line: ln });
    } else if ((m = line.match(funcRe))) {
      symbols.push({ kind: 'function', name: m[1], line: ln });
    } else if ((m = line.match(typeRe))) {
      symbols.push({ kind: 'type',     name: m[1], line: ln });
    }
  });
  return symbols;
}

function extractRustSymbols(lines: string[]): ParsedSymbol[] {
  const symbols: ParsedSymbol[] = [];
  const fnRe     = /(?:pub\s+)?(?:async\s+)?fn\s+([a-z_][\w]*)/;
  const structRe = /(?:pub\s+)?struct\s+([A-Za-z_][\w]*)/;
  const enumRe   = /(?:pub\s+)?enum\s+([A-Za-z_][\w]*)/;
  const traitRe  = /(?:pub\s+)?trait\s+([A-Za-z_][\w]*)/;
  const useRe    = /^use\s+([^;]+)/;

  lines.forEach((line, i: number) => {
    const ln = i + 1;
    const trimmed = line.trimStart();
    let m: RegExpMatchArray | null;
    if ((m = trimmed.match(fnRe)))         symbols.push({ kind: 'function', name: m[1], line: ln });
    else if ((m = trimmed.match(structRe))) symbols.push({ kind: 'class',   name: m[1], line: ln });
    else if ((m = trimmed.match(enumRe)))   symbols.push({ kind: 'type',    name: m[1], line: ln });
    else if ((m = trimmed.match(traitRe)))  symbols.push({ kind: 'type',    name: m[1], line: ln });
    else if ((m = trimmed.match(useRe)))    symbols.push({ kind: 'import',  name: m[1].trim(), line: ln });
  });
  return symbols;
}

// ─── Bracket / paren balance checker ─────────────────────────────────────────

function checkBracketBalance(content: string, lang: string): ParseError[] {
  if (!['typescript','javascript','json','rust','go','cpp','c','java','csharp'].includes(lang)) {
    return [];
  }

  const errors: ParseError[] = [];
  const stack: Array<{ ch: string; line: number; col: number }> = [];
  const PAIRS: Record<string, string> = { '{': '}', '(': ')', '[': ']' };
  const CLOSE = new Set(['}', ')', ']']);
  let line = 1, col = 1;
  let inLineComment = false;
  let inBlockComment = false;
  let inStr: null | '"' | "'" | '`' = null;

  for (let i = 0; i < content.length; i++) {
    const ch  = content[i];
    const nxt = content[i + 1] ?? '';

    if (ch === '\n') { line++; col = 1; inLineComment = false; continue; }
    if (inLineComment)  { col++; continue; }
    if (inBlockComment) {
      if (ch === '*' && nxt === '/') { i++; col += 2; inBlockComment = false; continue; }
      col++; continue;
    }
    if (inStr) {
      if (ch === '\\') { i++; col += 2; continue; }
      if (ch === inStr) inStr = null;
      col++; continue;
    }

    if (ch === '/' && nxt === '/') { inLineComment  = true;  col += 2; i++; continue; }
    if (ch === '/' && nxt === '*') { inBlockComment = true;  col += 2; i++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch as string; col++; continue; }

    if (ch in PAIRS) {
      stack.push({ ch, line, col });
    } else if (CLOSE.has(ch)) {
      const top = stack[stack.length - 1];
      if (!top) {
        errors.push({ line, col, message: `Unexpected '${ch}'`, severity: 'error' });
      } else if (PAIRS[top.ch] !== ch) {
        errors.push({ line, col, message: `Expected '${PAIRS[top.ch]}' but found '${ch}'`, severity: 'error' });
        stack.pop();
      } else {
        stack.pop();
      }
    }
    col++;
  }

  for (const { ch, line: l, col: c } of stack) {
    errors.push({ line: l, col: c, message: `Unclosed '${ch}'`, severity: 'error' });
  }

  return errors;
}

// ─── JSON validator ───────────────────────────────────────────────────────────

function checkJSON(content: string): ParseError[] {
  try {
    JSON.parse(content);
    return [];
  } catch (e: unknown) {
    const msg: string = e?.message ?? 'Invalid JSON';
    const posMatch = msg.match(/line (\d+) column (\d+)/);
    if (posMatch) {
      return [{ line: Number(posMatch[1]), col: Number(posMatch[2]), message: msg, severity: 'error' }];
    }
    return [{ line: 1, col: 1, message: msg, severity: 'error' }];
  }
}

// ─── Python indentation check ─────────────────────────────────────────────────

function checkPythonIndent(lines: string[]): ParseError[] {
  const warnings: ParseError[] = [];
  let expectedIndent: number | null = null;

  lines.forEach((line, i: number) => {
    if (line.trim() === '' || line.trimStart().startsWith('#')) return;
    const indent = line.length - line.trimStart().length;
    if (line.trimEnd().endsWith(':')) {
      expectedIndent = indent + 4;
    } else if (expectedIndent !== null) {
      if (indent < expectedIndent && line.trim() !== '') {
        warnings.push({
          line: i + 1, col: 1,
          message: `Possible indentation issue — expected ≥${expectedIndent} spaces`,
          severity: 'warning',
        });
      }
      expectedIndent = null;
    }
  });
  return warnings;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * parseCode(content, language)
 *
 * Analyses source code and returns a structured ParseResult.
 * Safe in any runtime: browser, edge, Node — no external deps.
 */
export function parseCode(content: string, language: string): ParseResult {
  const lang  = normaliseLanguage(language);
  const lines = content.split('\n');

  const errors:   ParseError[]   = [];
  const warnings: ParseError[]   = [];
  let   symbols:  ParsedSymbol[] = [];

  switch (lang) {
    case 'typescript':
    case 'javascript':
      symbols = extractTSSymbols(lines);
      break;
    case 'python':
      symbols = extractPythonSymbols(lines);
      break;
    case 'go':
      symbols = extractGoSymbols(lines);
      break;
    case 'rust':
      symbols = extractRustSymbols(lines);
      break;
    default:
      break;
  }

  if (lang === 'json') {
    errors.push(...checkJSON(content));
  } else {
    const bracketErrs = checkBracketBalance(content, lang);
    errors.push(...bracketErrs.filter((e) => e.severity === 'error'));
    warnings.push(...bracketErrs.filter((e) => e.severity === 'warning'));
  }

  if (lang === 'python') {
    warnings.push(...checkPythonIndent(lines));
  }

  lines.forEach((line, i: number) => {
    if (line !== line.trimEnd()) {
      warnings.push({
        line: i + 1, col: line.trimEnd().length + 1,
        message: 'Trailing whitespace',
        severity: 'warning',
      });
    }
  });

  return {
    ast:               null,
    errors,
    warnings,
    symbols,
    language:          lang,
    lineCount:         lines.length,
    structurallyValid: errors.length === 0,
  };
}