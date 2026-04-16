export function extractRepositoryStateSnapshot(markdown) {
  if (!markdown) return {};

  const readInt = (regex) => {
    const match = markdown.match(regex);
    if (!match?.[1]) return null;
    const value = Number.parseInt(match[1].replace(/,/g, ''), 10);
    return Number.isFinite(value) ? value : null;
  };

  const readText = (regex) => {
    const match = markdown.match(regex);
    return match?.[1]?.trim() || null;
  };

  return {
    totalCodeFiles: readInt(/Total Code Files:\s*([\d,]+)/),
    totalLinesOfCode: readInt(/Total Lines of Code:\s*([\d,]+)/),
    apiRoutes: readInt(/API Routes:\s*([\d,]+)/),
    testFiles: readInt(/Tests:\s*([\d,]+)\s+files,/),
    testsPassing: readInt(/Tests:\s*[\d,]+\s+files,\s*([\d,]+)/),
    lastUpdated: readText(/\*\*Last Updated:\*\*\s*([^\n]+)/),
    branch: readText(/\*\*Branch:\*\*\s*([^\n]+)/),
  };
}

function formatCount(value, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return value.toLocaleString();
}

export function buildRepositoryStateAnalysisSection(snapshot = {}) {
  const files = formatCount(snapshot.totalCodeFiles, 'live');
  const lines = formatCount(snapshot.totalLinesOfCode, 'live');
  const apiRoutes = formatCount(snapshot.apiRoutes, 'all');
  const testFiles = formatCount(snapshot.testFiles, 'all');
  const testsPassing = formatCount(snapshot.testsPassing, 'current');

  const snapshotLine = snapshot.lastUpdated
    ? `Latest analyzer snapshot: ${snapshot.lastUpdated}${snapshot.branch ? ` on \`${snapshot.branch}\`` : ''}.`
    : null;

  const linesOut = [
    '## Repository State Analysis',
    '',
    'For a comprehensive, real-time analysis of the entire codebase, see **[REPO_STATE.md](./REPO_STATE.md)**',
    '',
    'This auto-generated document provides:',
    `- 📊 Complete code metrics (${files} files, ${lines} lines)`,
    `- 🔍 ${apiRoutes} API routes, all pages, and components`,
    '- 📦 Dependency health and 2026 standards compliance',
    `- 🧪 Tests overview (${testFiles} files, ${testsPassing} passing)`,
    '- ⚠️ Technical debt and redundancies',
    '- ✅ Actionable items prioritized by severity',
    '',
    '**Update the analysis:** `pnpm run repo-state`',
    '**Documentation:** [docs/REPO_STATE_ANALYZER.md](./docs/REPO_STATE_ANALYZER.md)',
    '',
    'The state is automatically updated on pushes to `completedream`, merged PR closures targeting `completedream`/`main`/`develop`, and daily at 2 AM UTC.',
  ];

  if (snapshotLine) {
    linesOut.push('', snapshotLine);
  }

  return linesOut.join('\n');
}
