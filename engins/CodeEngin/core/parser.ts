/**
 * CodeEngin core – pure code parsing helpers.
 *
 * This module contains stateless, side-effect-free utilities that operate on
 * source code strings. No UI, no AI, no network calls belong here.
 *
 * Extend with real AST parsers (e.g. @babel/parser, tree-sitter) as the
 * feature set grows.
 */

export interface ParseResult {
  ast: null;
  errors: string[];
}

/**
 * Parse source code for a given language.
 * Currently returns a stub result; replace with a real parser when needed.
 */
export function parseCode(
  _content: string,
  _language: string,
): ParseResult {
  return { ast: null, errors: [] };
}
