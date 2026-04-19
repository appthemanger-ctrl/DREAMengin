import { describe, expect, it } from 'vitest';

import {
  extractNodeMajorFromDockerfile,
  extractPnpmVersion,
  refreshCurrentImplementationStatusSection,
} from '../scripts/update-readme-status-utils.mjs';

describe('update-readme current implementation status helpers', () => {
  it('extracts pnpm and node versions', () => {
    expect(extractPnpmVersion('pnpm@10.30.0')).toBe('10.30.0');
    expect(extractNodeMajorFromDockerfile('FROM node:25-bookworm-slim')).toBe('25');
  });

  it('updates only the Current Implementation Status section values', () => {
    const input = `# Sample

## Current Implementation Status
Last updated: old

Build Status: old-build
Tech Stack:
- Babylon.js 8+ (WebGPU-first 3D rendering)
- pnpm 9.0.0
- Node 24

## Another Section
Build Status: keep-this
`;

    const output = refreshCurrentImplementationStatusSection(input, {
      utcDate: '2026-04-16 19:00 UTC',
      sha: 'abc1234',
      actor: 'idari',
      routeCount: 200,
      pageCount: 102,
      apiCount: 98,
      testCount: 147,
      babylonMajor: '9',
      pnpmVersion: '10.30.0',
      nodeMajor: '25',
    });

    expect(output).toContain('Last updated: 2026-04-16 19:00 UTC — `abc1234` by idari');
    expect(output).toContain('Build Status: 200 routes (102 pages + 98 API handlers) · 147 test files');
    expect(output).toContain('- Babylon.js 9+ (WebGPU-first 3D rendering)');
    expect(output).toContain('- pnpm 10.30.0');
    expect(output).toContain('- Node 25');
    expect(output).toContain('## Another Section\nBuild Status: keep-this');
  });

  it('replaces an existing italic last-updated line under the H1 instead of stacking new ones', () => {
    const input = `# DreamENGIN

_Last updated: 2026-04-18 13:43 UTC — \`a7cdd3a\` by appthemanger-ctrl_

<!-- DREAMENGIN-AI-CONTEXT:START -->
## 🤖 AI Agent Quick Reference
some content
<!-- DREAMENGIN-AI-CONTEXT:END -->
`;

    const output = refreshCurrentImplementationStatusSection(input, {
      utcDate: '2026-04-19 04:13 UTC',
      sha: '50e72fe',
      actor: 'appthemanger-ctrl',
    });

    const matches = output.match(/^_Last updated:[^\n]*_$/gm) || [];
    expect(matches).toHaveLength(1);
    expect(output).toContain('_Last updated: 2026-04-19 04:13 UTC — `50e72fe` by appthemanger-ctrl_');
    expect(output).not.toContain('a7cdd3a');
  });

  it('collapses multiple stacked last-updated lines into a single fresh one', () => {
    const input = `# DreamENGIN

_Last updated: 2026-04-19 04:13 UTC — \`50e72fe\` by appthemanger-ctrl_

_Last updated: 2026-04-18 13:43 UTC — \`a7cdd3a\` by appthemanger-ctrl_

_Last updated: 2026-04-18 10:16 UTC — \`0b088c9\` by appthemanger-ctrl_

<!-- DREAMENGIN-AI-CONTEXT:START -->
content
<!-- DREAMENGIN-AI-CONTEXT:END -->
`;

    const output = refreshCurrentImplementationStatusSection(input, {
      utcDate: '2026-04-20 09:00 UTC',
      sha: 'deadbee',
      actor: 'idari',
    });

    const matches = output.match(/^_Last updated:[^\n]*_$/gm) || [];
    expect(matches).toHaveLength(1);
    expect(matches[0]).toBe('_Last updated: 2026-04-20 09:00 UTC — `deadbee` by idari_');
    expect(output).not.toContain('a7cdd3a');
    expect(output).not.toContain('0b088c9');
    expect(output).not.toContain('50e72fe');
  });
});
