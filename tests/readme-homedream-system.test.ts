import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('README HomeDream System spec', () => {
  const readme = readFileSync(resolve(__dirname, '../README.md'), 'utf8');
  const homeSystemSection = readme.split('## HomeDream System')[1]?.split('# AI Triad')[0] ?? '';

  it('documents the canonical HomeDream route and implementation paths', () => {
    expect(homeSystemSection).toContain('app/homedream/page.tsx');
    expect(homeSystemSection).toContain('dreamdmbar/homedream/HomeSystem.tsx');
    expect(homeSystemSection).toContain('components/home/HomeSystem.tsx');
  });

  it('defines canonical HomeDream vocabulary used by the system', () => {
    expect(homeSystemSection).toContain('**Surface**');
    expect(homeSystemSection).toContain('**Daydream**');
    expect(homeSystemSection).toContain('**Engin**');
    expect(homeSystemSection).toContain('**Dream Window**');
    expect(homeSystemSection).toContain('**Canonical Route**');
  });

  it('captures enforceable HomeDream runtime rules', () => {
    expect(homeSystemSection).toContain('DreamDMBar persistence is shell-owned');
    expect(homeSystemSection).toContain('DreamSystemContext');
    expect(homeSystemSection).toContain('hidden/minimized');
  });
});
