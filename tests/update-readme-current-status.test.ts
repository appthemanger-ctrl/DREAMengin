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
});
