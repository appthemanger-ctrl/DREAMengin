import { describe, expect, it } from 'vitest';
import {
  extractRepositoryStateSnapshot,
  buildRepositoryStateAnalysisSection,
} from '../scripts/repository-state-analysis-section.mjs';

describe('repository-state-analysis-section', () => {
  it('extracts repository snapshot metrics from REPO_STATE markdown', () => {
    const snapshot = extractRepositoryStateSnapshot(`
**Last Updated:** 4/16/2026, 5:41:52 PM
**Branch:** completedream

- 📁 Total Code Files: 722
- 📝 Total Lines of Code: 176,623
- 🧪 Tests: 151 files, 146 passing
- 📄 API Routes: 98
`);

    expect(snapshot).toEqual({
      totalCodeFiles: 722,
      totalLinesOfCode: 176623,
      apiRoutes: 98,
      testFiles: 151,
      testsPassing: 146,
      lastUpdated: '4/16/2026, 5:41:52 PM',
      branch: 'completedream',
    });
  });

  it('builds section body with parsed metrics and workflow triggers', () => {
    const section = buildRepositoryStateAnalysisSection({
      totalCodeFiles: 722,
      totalLinesOfCode: 176623,
      apiRoutes: 98,
      testFiles: 151,
      testsPassing: 146,
      lastUpdated: '4/16/2026, 5:41:52 PM',
      branch: 'completedream',
    });

    expect(section).toContain('Complete code metrics (722 files, 176,623 lines)');
    expect(section).toContain('98 API routes, all pages, and components');
    expect(section).toContain('Tests overview (151 files, 146 passing)');
    expect(section).toContain('pushes to `completedream`');
    expect(section).toContain('Latest analyzer snapshot: 4/16/2026, 5:41:52 PM on `completedream`.');
  });
});
