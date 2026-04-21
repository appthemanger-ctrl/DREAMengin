import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('README §6 HomeDream spec alignment', () => {
  const readme = readFileSync(resolve(__dirname, '../README.md'), 'utf8');
  const section6 = readme.match(
    /## 6\. HomeDream \(Core System, Private Operating Surface\)([\s\S]*?)\n---/,
  )?.[1] ?? '';

  it('documents the expected HomeDream control model and feed model', () => {
    expect(section6).toContain('Single tap: Open dual menus.');
    expect(section6).toContain('Double tap: Go Home.');
    expect(section6).toContain('private by default');
    expect(section6).toContain('persistent between sessions');
    expect(section6).toContain('centered around a personalized feed');
    expect(section6).toContain('6 Daydream navigation');
    expect(section6).toContain('Dream Window layout');
    expect(section6).toContain('feed algorithm settings');
    expect(section6).toContain('posting routes');
  });

});
