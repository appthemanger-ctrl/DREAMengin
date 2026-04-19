export function extractPnpmVersion(packageManager) {
  if (typeof packageManager !== 'string') return undefined;
  // Accept pnpm@MAJOR, pnpm@MAJOR.MINOR, or pnpm@MAJOR.MINOR.PATCH.
  const match = packageManager.match(/^pnpm@([0-9]+(?:\.[0-9]+){0,2})$/);
  return match?.[1];
}

export function extractNodeMajorFromDockerfile(dockerfileText) {
  if (typeof dockerfileText !== 'string') return undefined;
  const match = dockerfileText.match(/^\s*FROM\s+node:(\d+)(?:[^\n]*)$/m);
  return match?.[1];
}

export function refreshCurrentImplementationStatusSection(doc, options) {
  const heading = '## Current Implementation Status';
  const sectionStart = doc.indexOf(heading);
  const lastUpdatedItalicLine =
    `_Last updated: ${options.utcDate} — \`${options.sha}\` by ${options.actor}_`;
  // Matches a single `_Last updated: ..._` line (italic form used under the H1
  // when no `## Current Implementation Status` section exists).  Used to avoid
  // stacking a new line on every run when the heading is absent.
  const italicLastUpdatedRe = /^_Last updated:[^\n]*_\n?/gm;

  if (sectionStart === -1) {
    const h1end = doc.indexOf('\n') + 1;
    const head = doc.slice(0, h1end);
    let rest = doc.slice(h1end);

    // Strip ALL existing `_Last updated: ..._` lines plus any blank lines
    // immediately following them, so repeated runs don't accumulate.
    rest = rest.replace(/(?:^_Last updated:[^\n]*_\n(?:\n)?)+/m, '');

    // Also strip any stray italic last-updated lines elsewhere near the top.
    const headerEnd = rest.search(/\n#{1,6} |\n<!--/);
    if (headerEnd !== -1) {
      const top = rest.slice(0, headerEnd).replace(italicLastUpdatedRe, '');
      rest = top + rest.slice(headerEnd);
    }

    return head + `\n${lastUpdatedItalicLine}\n` + rest;
  }

  const nextH2 = doc.indexOf('\n## ', sectionStart + heading.length);
  const sectionEnd = nextH2 === -1 ? doc.length : nextH2 + 1;
  let section = doc.slice(sectionStart, sectionEnd);

  const lastUpdatedLine = `Last updated: ${options.utcDate} — \`${options.sha}\` by ${options.actor}\n`;
  section = section.replace(
    /(## Current Implementation Status\n)(?:Last updated:[^\n]*\n)?/,
    `$1${lastUpdatedLine}`
  );

  const buildStatusLine =
    `Build Status: ${options.routeCount} routes (${options.pageCount} pages + ${options.apiCount} API handlers) · ${options.testCount} test files`;
  if (/^Build Status:.*$/m.test(section)) {
    section = section.replace(/^Build Status:.*$/m, buildStatusLine);
  }

  if (options.babylonMajor) {
    section = section.replace(
      /- Babylon\.js \d+\+ \(WebGPU-first 3D rendering\)/g,
      `- Babylon.js ${options.babylonMajor}+ (WebGPU-first 3D rendering)`
    );
  }

  if (options.pnpmVersion) {
    section = section.replace(/- pnpm [^\n]+/g, `- pnpm ${options.pnpmVersion}`);
  }

  if (options.nodeMajor) {
    section = section.replace(/- Node [^\n]+/g, `- Node ${options.nodeMajor}`);
  }

  return doc.slice(0, sectionStart) + section + doc.slice(sectionEnd);
}
