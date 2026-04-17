import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const codeDaydreamPage = readFileSync(join(root, 'app/daydream/code/page.tsx'), 'utf8');
const codeEngin = readFileSync(join(root, 'engins/CodeEngin.tsx'), 'utf8');

describe('README §13 Code / CodeEngin alignment', () => {
  it('keeps the Section 13 spec in README', () => {
    expect(readme).toContain('## 13. Code / CodeEngin');
    expect(readme).toContain('13.1 Code (Side A)');
    expect(readme).toContain('13.2 CodeEngin (Side B)');
    expect(readme).toContain('13.3 Specialized Dream Windows (Examples)');
  });

  it('covers Side A requirements on the Code daydream surface', () => {
    expect(codeDaydreamPage).toContain('Project Vault');
    expect(codeDaydreamPage).toContain('Snippet Library');
    expect(codeDaydreamPage).toContain('Import Files & Zips');
    expect(codeDaydreamPage).toContain("label: 'Drafts'");
    expect(codeDaydreamPage).toContain('Drafts Workspace');
    expect(codeDaydreamPage).toContain('Open CodeEngin');
  });

  it('covers Side B engine behaviors in CodeEngin', () => {
    expect(codeEngin).toContain('runCellCode');
    expect(codeEngin).toContain('Run CI (lint, typecheck, test, build)');
    expect(codeEngin).toContain('ShellHub');
    expect(codeEngin).toContain('TaskJobManager');
  });

  it('lists all Section 13 specialized dream window examples on Side A', () => {
    expect(codeDaydreamPage).toContain('Project Dream Window');
    expect(codeDaydreamPage).toContain('Code File Dream Window');
    expect(codeDaydreamPage).toContain('Snippet Dream Window');
    expect(codeDaydreamPage).toContain('Terminal Dream Window');
    expect(codeDaydreamPage).toContain('Deployment Dream Window');
    expect(codeDaydreamPage).toContain('Runtime Dream Window');
  });
});
