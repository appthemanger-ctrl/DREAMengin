#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const GENERATED_DIR = resolve(ROOT, '.github/generated/readme-autosync');
const SUMMARY_FILE = resolve(process.env.RUNNER_TEMP || os.tmpdir(), 'readme-autosync-summary.json');
const CHANGED_FILES_FILE = resolve(process.env.RUNNER_TEMP || os.tmpdir(), 'readme-autosync-changed-files.txt');
const COMMENT_FILE = resolve(process.env.RUNNER_TEMP || os.tmpdir(), 'readme-autosync-comment.md');
const DRY_RUN = process.env.README_AUTOSYNC_DRY_RUN === '1';

function readEventPayload() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !existsSync(eventPath)) return {};
  return JSON.parse(readFileSync(eventPath, 'utf8'));
}

function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function tryGit(args) {
  try {
    return git(args);
  } catch {
    return '';
  }
}

function shouldRunWorkflow(eventName, eventPayload) {
  if (eventName === 'pull_request') return true;
  const defaultBranch = eventPayload?.repository?.default_branch;
  return Boolean(defaultBranch) && process.env.GITHUB_REF_NAME === defaultBranch;
}

function computeChangedFiles(eventName, eventPayload) {
  const headSha = process.env.GITHUB_SHA || tryGit(['rev-parse', 'HEAD']);
  let baseSha = '';

  if (eventName === 'pull_request') {
    baseSha = eventPayload?.pull_request?.base?.sha || '';
  } else {
    const beforeSha = eventPayload?.before || '';
    if (beforeSha && !/^0+$/.test(beforeSha)) {
      baseSha = beforeSha;
    } else {
      baseSha = tryGit(['rev-parse', 'HEAD~1']);
    }
  }

  const diffArgs = baseSha
    ? ['diff', '--name-only', '--diff-filter=ACMRD', baseSha, headSha]
    : ['diff-tree', '--no-commit-id', '--name-only', '-r', headSha];

  return git(diffArgs)
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean);
}

function runAutosync() {
  const child = spawnSync(
    'pnpm',
    ['tsx', 'scripts/readme-autosync.ts', '--changed-files', CHANGED_FILES_FILE, '--summary-file', SUMMARY_FILE],
    { cwd: ROOT, stdio: 'inherit' },
  );

  if (child.status !== 0) {
    process.exit(child.status ?? 1);
  }
}

function readSummary() {
  return JSON.parse(readFileSync(SUMMARY_FILE, 'utf8'));
}

function readmeChanged() {
  const result = spawnSync('git', ['diff', '--quiet', 'README.md'], { cwd: ROOT, stdio: 'ignore' });
  return result.status !== 0;
}

function buildComment(summary, isFork) {
  const sections = summary.regeneratedSections || [];
  const subsections = summary.regeneratedSubsections || [];

  const lines = [
    '<!-- readme-autosync -->',
    '## 📖 README autosync',
    '',
    summary.readmeChanged
      ? 'README.md was updated for changed subsystem section(s).'
      : 'No README section updates were required for this change set.',
    '',
    `- Changed files evaluated: **${(summary.changedFiles || []).length}**`,
    `- Sections regenerated: **${sections.length}**`,
  ];

  if (sections.length > 0) {
    lines.push('', '### Sections regenerated');
    for (const section of sections) {
      lines.push(`- \`${section.id}\` — ${section.title}`);
    }
  }

  if (subsections.length > 0) {
    lines.push('', '### Targeted subsection refreshes');
    for (const subsection of subsections) {
      lines.push(`- \`${subsection.sectionId}/${subsection.subsectionId}\` — ${subsection.title}`);
    }
  }

  if (isFork && summary.readmeChanged) {
    lines.push('', 'Fork PR detected: write access is unavailable, so updated README.md is attached as an artifact.');
  }

  return `${lines.join('\n')}\n`;
}

async function upsertComment(eventPayload, body) {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  if (!token || !repository) {
    console.warn('README autosync: skipping PR comment because GITHUB_TOKEN or GITHUB_REPOSITORY is unavailable.');
    return;
  }

  const [owner, repo] = repository.split('/');
  const issueNumber = eventPayload?.number || eventPayload?.pull_request?.number;
  if (!owner || !repo || !issueNumber) return;

  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const listResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments?per_page=100`,
    { headers },
  );

  if (!listResponse.ok) {
    throw new Error(`Failed to list PR comments (${listResponse.status})`);
  }

  const comments = await listResponse.json();
  const existing = comments.find(
    (comment) => comment?.user?.login === 'github-actions[bot]' && comment?.body?.includes('<!-- readme-autosync -->'),
  );

  const targetUrl = existing
    ? `https://api.github.com/repos/${owner}/${repo}/issues/comments/${existing.id}`
    : `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`;

  const method = existing ? 'PATCH' : 'POST';
  const writeResponse = await fetch(targetUrl, {
    method,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });

  if (!writeResponse.ok) {
    throw new Error(`Failed to write PR comment (${writeResponse.status})`);
  }
}

function commitAndPush(targetRef) {
  git(['config', 'user.name', 'github-actions[bot]']);
  git(['config', 'user.email', 'github-actions[bot]@users.noreply.github.com']);
  git(['add', 'README.md']);
  git(['commit', '-m', 'docs(readme): autosync touched sections [skip ci]']);
  git(['push', 'origin', targetRef]);
}

function writeStepSummary(summary) {
  const stepSummary = process.env.GITHUB_STEP_SUMMARY;
  if (!stepSummary) return;
  writeFileSync(stepSummary, `## README autosync\n\n\`\`\`json\n${JSON.stringify(summary, null, 2)}\n\`\`\`\n`, { flag: 'a' });
}

function ensureArtifact(readmeNeedsArtifact) {
  if (!readmeNeedsArtifact) return;
  mkdirSync(GENERATED_DIR, { recursive: true });
  copyFileSync(resolve(ROOT, 'README.md'), join(GENERATED_DIR, 'README.md'));
}

async function main() {
  const eventName = process.env.GITHUB_EVENT_NAME || '';
  const eventPayload = readEventPayload();

  if (!shouldRunWorkflow(eventName, eventPayload)) {
    const summary = {
      changedFiles: [],
      affectedSections: [],
      regeneratedSections: [],
      regeneratedSubsections: [],
      readmeChanged: false,
      skipped: true,
    };
    writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));
    writeStepSummary(summary);
    return;
  }

  const changedFiles = computeChangedFiles(eventName, eventPayload);
  writeFileSync(CHANGED_FILES_FILE, `${changedFiles.join('\n')}\n`);

  runAutosync();

  const summary = readSummary();
  summary.readmeChanged = readmeChanged();
  writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));

  const isFork =
    eventName === 'pull_request' &&
    eventPayload?.pull_request?.head?.repo?.full_name &&
    eventPayload.pull_request.head.repo.full_name !== process.env.GITHUB_REPOSITORY;

  const commentBody = buildComment(summary, isFork);
  writeFileSync(COMMENT_FILE, commentBody);

  if (summary.readmeChanged) {
    if (DRY_RUN) {
      ensureArtifact(true);
    } else if (eventName === 'push') {
      commitAndPush('HEAD');
    } else if (eventName === 'pull_request' && !isFork) {
      commitAndPush(`HEAD:${eventPayload.pull_request.head.ref}`);
    } else if (eventName === 'pull_request' && isFork) {
      ensureArtifact(true);
    }
  }

  if (eventName === 'pull_request' && !DRY_RUN) {
    await upsertComment(eventPayload, commentBody);
  }

  writeStepSummary(summary);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
