/**
 * api-route-body-guard.test.ts
 *
 * Ensures that all user-facing API routes guard `req.json()` with a `.catch()`
 * so a missing or malformed request body returns a 400 instead of crashing
 * with a 500 (SyntaxError: Unexpected end of JSON input).
 *
 * Pattern: `await req.json().catch(() => ({}))`  ← safe
 * Anti-pattern: `await req.json()` outside any try/catch  ← crashes on empty body
 *
 * Regression test for the runtime error fix in:
 *   app/api/{likes,follow,profile,music,notifications,messages,posts,projects,
 *           shop,favorites,scheduled-posts,close-friends}/route.ts
 *   components/panels/dream.panel.ProfilePanel.tsx
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

function readRoute(rel: string) {
  return readFileSync(join(root, rel), 'utf-8');
}

/**
 * Returns true when every occurrence of `req.json()` in the source is either:
 * a) immediately followed by `.catch` on the same line, OR
 * b) preceded by `try {` within the previous 8 lines (let body; try { body = … })
 */
function allJsonCallsAreGuarded(source: string): { ok: boolean; unguarded: string[] } {
  const lines = source.split('\n');
  const unguarded: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes('req.json()')) continue;
    // Safe: .catch() is on the same line
    if (line.includes('.catch(')) continue;
    // Safe: inside a try block opened within the previous 8 lines
    const window = lines.slice(Math.max(0, i - 8), i + 1);
    const inTry = window.some((l) => /try\s*\{/.test(l));
    if (!inTry) {
      unguarded.push(`line ${i + 1}: ${line.trim()}`);
    }
  }

  return { ok: unguarded.length === 0, unguarded };
}

const CORE_ROUTES = [
  'app/api/likes/route.ts',
  'app/api/follow/route.ts',
  'app/api/profile/route.ts',
  'app/api/music/route.ts',
  'app/api/notifications/route.ts',
  'app/api/messages/route.ts',
  'app/api/posts/route.ts',
  'app/api/projects/route.ts',
  'app/api/shop/route.ts',
  'app/api/favorites/route.ts',
  'app/api/scheduled-posts/route.ts',
  'app/api/close-friends/route.ts',
];

describe('API route req.json() body guard', () => {
  for (const routePath of CORE_ROUTES) {
    it(`${routePath} guards every req.json() call`, () => {
      const source = readRoute(routePath);
      const { ok, unguarded } = allJsonCallsAreGuarded(source);
      expect(ok, `Unguarded req.json() in ${routePath}:\n${unguarded.join('\n')}`).toBe(true);
    });
  }

  it('ProfilePanel useEffect has try/catch so loading spinner always resolves', () => {
    const source = readRoute('components/panels/dream.panel.ProfilePanel.tsx');
    // The useEffect must have a try block and a finally (may be on its own line)
    expect(source).toContain('try {');
    expect(source).toMatch(/finally\s*\{/);
    expect(source).toContain('setIsLoading(false)');
  });

  it('scheduled-posts POST guards body parse with .catch', () => {
    const source = readRoute('app/api/scheduled-posts/route.ts');
    // Both POST (create) and PUT (update) should use .catch on req.json()
    const matches = [...source.matchAll(/req\.json\(\)/g)];
    for (const match of matches) {
      const pos = match.index ?? 0;
      const snippet = source.slice(pos, pos + 30);
      const linesBefore = source.slice(Math.max(0, pos - 200), pos);
      const hasCatch = snippet.includes('.catch(');
      const hasTry = /try\s*\{/.test(linesBefore.split('\n').slice(-8).join('\n'));
      expect(hasCatch || hasTry).toBe(true);
    }
  });
});
