import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';

// Walk all .ts/.tsx files under a directory
function walkFiles(dir: string, ext = ['.ts', '.tsx']): string[] {
  const results: string[] = [];
  let entries: ReturnType<typeof readdirSync>;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walkFiles(full, ext));
    } else if (ext.some((e) => full.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

const SRC_ROOT = resolve(__dirname, '../src');

describe('Namespace Isolation Gate (Rule 5)', () => {
  it('dream.* files MUST NOT import from engin/core directly', () => {
    const dreamFiles = walkFiles(join(SRC_ROOT, 'dream'));
    const violations: string[] = [];
    for (const file of dreamFiles) {
      const content = readFileSync(file, 'utf-8');
      // Match any import that resolves to engin/core (relative or alias)
      if (
        /from\s+['"][^'"]*engin[\\/]core[^'"]*['"]/.test(content) ||
        /from\s+['"]@\/engin\/core[^'"]*['"]/.test(content)
      ) {
        violations.push(file);
      }
    }
    expect(
      violations,
      `dream.* files importing engin/core directly:\n${violations.join('\n')}`
    ).toHaveLength(0);
  });

  it('engin/core files MUST NOT import from dream.* directly', () => {
    const enginFiles = walkFiles(join(SRC_ROOT, 'engin', 'core'));
    const violations: string[] = [];
    for (const file of enginFiles) {
      const content = readFileSync(file, 'utf-8');
      if (
        /from\s+['"][^'"]*dream[\\/]rulesets[^'"]*['"]/.test(content) ||
        /from\s+['"]@\/dream\/[^'"]*['"]/.test(content)
      ) {
        violations.push(file);
      }
    }
    expect(
      violations,
      `engin/core files importing dream.* directly:\n${violations.join('\n')}`
    ).toHaveLength(0);
  });

  it('dreamsurface IS allowed to import from both engin/core and dream/*', () => {
    // This test just verifies the bridge file exists and imports from both sides
    const bridgeFile = join(SRC_ROOT, 'dreamsurface', 'dreamsurface.bridge.ts');
    const content = readFileSync(bridgeFile, 'utf-8');
    expect(content).toMatch(/engin/);
    expect(content).toMatch(/dream/);
  });

  it('src/engin/state/base.json must be valid JSON with genesis:true', () => {
    const basePath = join(SRC_ROOT, 'engin', 'state', 'base.json');
    const raw = readFileSync(basePath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.genesis).toBe(true);
    expect(parsed.namespace).toBe('engin.state.base');
  });
});
