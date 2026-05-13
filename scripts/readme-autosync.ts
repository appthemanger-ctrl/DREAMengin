#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface SubsectionDescriptor {
  id: string;
  title: string;
  globs: string[];
}

export interface SectionDescriptor {
  id: string;
  title: string;
  globs: string[];
  subsections?: Record<string, SubsectionDescriptor>;
}

export interface AutosyncSummary {
  changedFiles: string[];
  affectedSections: Array<{ id: string; title: string }>;
  regeneratedSections: Array<{ id: string; title: string }>;
  regeneratedSubsections: Array<{ sectionId: string; subsectionId: string; title: string }>;
  readmeChanged: boolean;
}

export const SECTION_REGISTRY: SectionDescriptor[] = [
  {
    id: 'the-engins',
    title: 'The Engins',
    globs: ['engins/**', 'components/runtime/**', 'lib/runtime/**', 'lib/dreamdm/**'],
    subsections: {
      'branding-engin': { id: 'branding-engin', title: 'BrandingEngin', globs: ['engins/engin.BrandingEngin.tsx'] },
      'code-engin': { id: 'code-engin', title: 'CodeEngin', globs: ['engins/engin.CodeEngin.tsx', 'engins/CodeEngin/**'] },
      'content-engin': { id: 'content-engin', title: 'ContentEngin', globs: ['engins/engin.ContentEngin.tsx'] },
      'game-engin': { id: 'game-engin', title: 'GameEngin', globs: ['engins/engin.GameEngin.tsx', 'engins/autoopen/**'] },
      'lab-engin': { id: 'lab-engin', title: 'LabEngin', globs: ['engins/engin.LabEngin.tsx', 'engins/dream.QuantumCircuitCanvas.tsx'] },
      'starmaker-engin': { id: 'starmaker-engin', title: 'StarMakerEngin', globs: ['engins/engin.StarMakerEngin.tsx'] },
      'analytics-engin': { id: 'analytics-engin', title: 'AnalyticsEngin', globs: ['engins/dream.panel.AnalyticsEngin.tsx'] },
      'forge-engin': { id: 'forge-engin', title: 'ForgeEngin', globs: ['engins/dream.ForgeEngin.tsx'] },
      'portfolio-engin': { id: 'portfolio-engin', title: 'PortfolioEngin', globs: ['engins/portfolio/**'] },
      'custom-engins-capability': {
        id: 'custom-engins-capability',
        title: 'Custom Engins capability (current state)',
        globs: ['engins/**', 'components/daydream/**', 'lib/engins/**'],
      },
    },
  },
  { id: 'dual-runtimes', title: 'Dual Runtimes', globs: ['lib/runtime/**', 'lib/vm/**', 'components/runtime/**', 'hooks/useSharedDream.ts'] },
  { id: 'shared-dreams', title: 'Shared Dreams', globs: ['lib/shared/**', 'lib/channels/**', 'hooks/useSharedDream*.ts', 'app/api/dreams/**'] },
  { id: 'dreamr---human-media', title: 'Dreamr — Human Media', globs: ['app/dreamr/**', 'app/api/dreamr/**', 'lib/feed/**', 'components/home/**'] },
  { id: 'the-shop', title: 'The Shop', globs: ['app/shop/**', 'app/api/shop/**', 'lib/shop/**', 'components/shop/**'] },
  { id: 'the-marketplace', title: 'The Marketplace', globs: ['app/marketplace/**', 'app/api/marketplace/**', 'lib/marketplace/**', 'components/marketplace/**'] },
  { id: 'ads-user-ads', title: 'Ads & User Ads', globs: ['app/ads/**', 'app/api/ads/**', 'lib/ads/**', 'components/ads/**'] },
  { id: 'the-dmbar-dreamdmbar', title: 'The DmBar (`dreamdmbar/`)', globs: ['dreamdmbar/**', 'components/home/dream.bar.*', 'lib/dreamdm/**'] },
  { id: 'messaging', title: 'Messaging', globs: ['app/messages/**', 'app/api/messages/**', 'components/messaging/**', 'lib/messaging/**'] },
  { id: 'homedream', title: 'HomeDream', globs: ['app/homedream/**', 'components/home/**', 'lib/home/**'] },
  { id: 'dreamspace', title: 'DreamSpace', globs: ['app/daydream/**', 'components/daydream/**', 'lib/daydream/**'] },
  { id: 'dreams-widgets-windows-surfaces', title: 'Dreams (Widgets / Windows / Surfaces)', globs: ['components/dream.**', 'components/runtime/**', 'lib/widgets/**', 'lib/windows/**'] },
  { id: 'user-facing-modularity', title: 'User-Facing Modularity', globs: ['components/**', 'styles/**', 'lib/ui/**', 'hooks/**'] },
  { id: 'custom-engins', title: 'Custom Engins', globs: ['engins/**', 'daydreams/**', 'components/daydream/**'] },
  { id: 'full-website-customizability', title: 'Full Website Customizability', globs: ['app/settings/**', 'app/api/settings/**', 'lib/theme/**', 'styles/**'] },
  { id: 'backend-system-core-coresurfaces', title: 'Backend, System, Core & CoreSurfaces', globs: ['backend/**', 'core/**', 'coresurfaces/**', 'system/**', 'app/api/**', 'lib/supabase/**'] },
  { id: 'agents-workflow', title: 'Agents & Workflow', globs: ['agents/**', '.github/workflows/**', '.github/scripts/**', 'scripts/**'] },
  { id: 'research-experiments-daydreams', title: 'Research, Experiments & Daydreams', globs: ['research/**', 'research-and-development/**', 'experiments/**', 'daydreams/**'] },
  { id: 'infra-ops', title: 'Infra & Ops', globs: ['terraform/**', 'prometheus/**', 'grafana/**', '.github/workflows/**', 'vercel.json', 'docker-compose.yml'] },
  { id: 'testing', title: 'Testing', globs: ['tests/**', 'vitest.config.ts', 'playwright.config.ts'] },
  {
    id: 'tech-stack-monorepo-layout',
    title: 'Tech Stack & Monorepo Layout',
    globs: [
      'package.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'tsconfig*.json',
      'next.config.*',
      'eslint.config.*',
      'tailwind.config.*',
      'vercel.json',
      '.env*.example',
      'Dockerfile*',
    ],
  },
  { id: 'getting-started', title: 'Getting Started', globs: ['README.md', '.env.example', '.env.local.example'] },
  { id: 'environment-variables', title: 'Environment Variables', globs: ['.env.example', '.env.local.example', 'app/api/**'] },
  { id: 'contributing', title: 'Contributing', globs: ['CONTRIBUTING*', 'AGENTS.md', 'docs/**', '.github/**'] },
  { id: 'license', title: 'License', globs: ['LICENSE'] },
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const ROOT = resolve(__dirname, '..');
const README_PATH = join(ROOT, 'README.md');

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
}

function globToRegExp(glob: string): RegExp {
  const normalized = normalizePath(glob);
  let pattern = '';
  for (let i = 0; i < normalized.length; i += 1) {
    const current = normalized[i];
    const next = normalized[i + 1];
    if (current === '*' && next === '*') {
      pattern += '.*';
      i += 1;
      continue;
    }
    if (current === '*') {
      pattern += '[^/]*';
      continue;
    }
    if (current === '?') {
      pattern += '.';
      continue;
    }
    if ('\\.^$+{}()|[]'.includes(current)) {
      pattern += `\\${current}`;
      continue;
    }
    pattern += current;
  }
  return new RegExp(`^${pattern}$`);
}

function matchesGlob(filePath: string, glob: string): boolean {
  return globToRegExp(glob).test(normalizePath(filePath));
}

function matchesAnyGlob(filePath: string, globs: string[]): boolean {
  const normalized = normalizePath(filePath);
  return globs.some((glob) => matchesGlob(normalized, glob));
}

function walkFiles(dir: string): string[] {
  const output: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === '.git' || entry === 'node_modules') continue;
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      output.push(...walkFiles(full));
    } else if (stats.isFile()) {
      output.push(normalizePath(relative(ROOT, full)));
    }
  }
  return output;
}

function toRoutePath(filePath: string): string {
  const normalized = normalizePath(filePath);
  if (!normalized.startsWith('app/')) return '';
  const withoutApp = normalized.slice(4);
  const withoutLeaf = withoutApp.replace(/\/(route|page)\.(t|j)sx?$/i, '');
  const cleaned = withoutLeaf
    .split('/')
    .filter((segment) => segment && !/^\(.*\)$/.test(segment))
    .join('/');
  return `/${cleaned}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

function toComponentName(filePath: string): string {
  const file = basename(filePath, extname(filePath));
  const clean = file.replace(/^(dream\.|engin\.|page\.)/i, '').replace(/[-._]+/g, ' ');
  return clean
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join('');
}

function summarizeList(items: string[], max = 8): string {
  const sorted = [...new Set(items.filter(Boolean))].sort();
  if (sorted.length === 0) return 'none';
  if (sorted.length <= max) return sorted.map((item) => `\`${item}\``).join(', ');
  const shown = sorted.slice(0, max).map((item) => `\`${item}\``).join(', ');
  return `${shown}, +${sorted.length - max} more`;
}

function describeFileKind(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  if (filePath.endsWith('/route.ts') || filePath.endsWith('/route.tsx')) return 'API route handler';
  if (filePath.endsWith('/page.tsx') || filePath.endsWith('/page.ts')) return 'route page';
  if (ext === '.tsx' || ext === '.jsx') return `React UI module for ${toComponentName(filePath)}`;
  if (ext === '.ts' || ext === '.js' || ext === '.mjs' || ext === '.cjs') return 'TypeScript/JavaScript runtime module';
  if (ext === '.sql') return 'SQL migration/schema artifact';
  if (ext === '.md') return 'documentation file';
  return `project file (${ext.replace('.', '') || 'no extension'})`;
}

function buildTreeLines(files: string[], maxLines = 120): string[] {
  const sorted = [...new Set(files)].sort();
  if (sorted.length === 0) return ['(no files currently matched)'];

  const tree = new Map<string, Set<string>>();
  for (const file of sorted) {
    const parts = file.split('/');
    for (let i = 0; i < parts.length; i += 1) {
      const parent = parts.slice(0, i).join('/');
      if (!tree.has(parent)) tree.set(parent, new Set());
      tree.get(parent)?.add(parts[i]);
    }
  }

  const lines: string[] = [];
  const emit = (parent: string, prefix: string): void => {
    const children = [...(tree.get(parent) ?? [])].sort();
    children.forEach((child, index) => {
      if (lines.length >= maxLines) return;
      const isLast = index === children.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const childPath = parent ? `${parent}/${child}` : child;
      const isLeaf = !tree.has(childPath);
      lines.push(`${prefix}${connector}${child}${isLeaf ? '' : ''}`);
      if (!isLeaf) {
        emit(childPath, `${prefix}${isLast ? '    ' : '│   '}`);
      }
    });
  };

  emit('', '');
  if (sorted.length > maxLines) lines.push(`… (${sorted.length - maxLines} more files)`);
  return lines;
}

function buildSectionProse(section: SectionDescriptor, files: string[]): string {
  const routePaths = files.filter((file) => /\/route\.(t|j)sx?$/i.test(file)).map(toRoutePath);
  const pagePaths = files.filter((file) => /\/page\.(t|j)sx?$/i.test(file)).map(toRoutePath);
  const components = files.filter((file) => /\.(t|j)sx$/i.test(file)).map(toComponentName);
  const migrations = files.filter((file) => /^supabase\/migrations\/.*\.sql$/i.test(file)).map((file) => basename(file, '.sql'));

  const lines = [
    `Auto-synced from ${section.globs.map((glob) => `\`${glob}\``).join(', ')} using repository introspection.`,
    `- Files tracked: **${files.length}**`,
    `- API routes discovered: ${summarizeList(routePaths)}`,
    `- App pages discovered: ${summarizeList(pagePaths)}`,
    `- Components/modules discovered: ${summarizeList(components)}`,
  ];

  if (migrations.length > 0) {
    lines.push(`- Supabase migrations touched: ${summarizeList(migrations)}`);
  }

  return `${lines.join('\n')}`;
}

function buildSectionBlock(section: SectionDescriptor, files: string[]): string {
  const prose = buildSectionProse(section, files);
  const tree = buildTreeLines(files).join('\n');
  const listItems = files.length
    ? files.sort().map((file) => `- \`${file}\` — ${describeFileKind(file)}.`).join('\n')
    : '- _No files matched the configured glob set after this change._';

  return [
    `## ${section.title}`,
    prose,
    `#### ${section.title} file structure`,
    '```text',
    tree,
    '```',
    `<details><summary>${section.title} file index (${files.length} files)</summary>`,
    '',
    listItems,
    '',
    '</details>',
    '',
  ].join('\n');
}

function buildSubsectionBlock(subsection: SubsectionDescriptor, files: string[]): string {
  const pseudoSection: SectionDescriptor = { id: subsection.id, title: subsection.title, globs: subsection.globs };
  const prose = buildSectionProse(pseudoSection, files);
  const tree = buildTreeLines(files).join('\n');
  const listItems = files.length
    ? files.sort().map((file) => `- \`${file}\` — ${describeFileKind(file)}.`).join('\n')
    : '- _No files matched the configured glob set after this change._';

  return [
    `### ${subsection.title}`,
    prose,
    `#### ${subsection.title} file structure`,
    '```text',
    tree,
    '```',
    `<details><summary>${subsection.title} file index (${files.length} files)</summary>`,
    '',
    listItems,
    '',
    '</details>',
    '',
  ].join('\n');
}

function findSectionBounds(readme: string, title: string): { start: number; end: number } | null {
  const headingPattern = new RegExp(`(^|\\n)## ${escapeRegExp(title)}\\s*\\n`, 'm');
  const match = headingPattern.exec(readme);
  if (!match || match.index < 0) return null;
  const headingStart = match.index + (match[1] ? match[1].length : 0);
  const searchFrom = headingStart + match[0].replace(/^\n/, '').length;
  const rest = readme.slice(searchFrom);
  const nextSectionOffset = rest.search(/\n##\s+/);
  const sectionEnd = nextSectionOffset === -1 ? readme.length : searchFrom + nextSectionOffset;
  return { start: headingStart, end: sectionEnd };
}

export function replaceSection(readme: string, section: SectionDescriptor, replacement: string): string {
  const bounds = findSectionBounds(readme, section.title);
  if (!bounds) return `${readme.trimEnd()}\n\n${replacement.trim()}\n`;
  return `${readme.slice(0, bounds.start)}${replacement.trim()}\n\n${readme.slice(bounds.end).replace(/^\n+/, '')}`;
}

export function upsertSubsectionInSection(sectionBody: string, subsection: SubsectionDescriptor, replacement: string): string {
  const subsectionPattern = new RegExp(`(^|\\n)### ${escapeRegExp(subsection.title)}\\s*\\n`, 'm');
  const match = subsectionPattern.exec(sectionBody);
  if (!match || match.index < 0) {
    return `${sectionBody.trimEnd()}\n\n${replacement.trim()}\n`;
  }
  const subsectionStart = match.index + (match[1] ? match[1].length : 0);
  const searchFrom = subsectionStart + match[0].replace(/^\n/, '').length;
  const rest = sectionBody.slice(searchFrom);
  const nextSubsectionOffset = rest.search(/\n###\s+/);
  const subsectionEnd = nextSubsectionOffset === -1 ? sectionBody.length : searchFrom + nextSubsectionOffset;
  return `${sectionBody.slice(0, subsectionStart)}${replacement.trim()}\n\n${sectionBody.slice(subsectionEnd).replace(/^\n+/, '')}`;
}

function inferDynamicSections(changedFiles: string[], registry: SectionDescriptor[]): SectionDescriptor[] {
  const handledTopLevels = new Set(
    registry
      .flatMap((section) => section.globs)
      .map((glob) => normalizePath(glob).split('/')[0])
      .filter(Boolean),
  );

  const dynamic: SectionDescriptor[] = [];
  const seen = new Set<string>();

  for (const changedFile of changedFiles) {
    const top = normalizePath(changedFile).split('/')[0];
    if (!top || top.startsWith('.') || handledTopLevels.has(top) || seen.has(top)) continue;
    seen.add(top);

    const title = top
      .split(/[-_]/g)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    dynamic.push({
      id: top.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      title,
      globs: [`${top}/**`],
    });
  }

  return dynamic;
}

export function computeAffected(
  changedFiles: string[],
  sections: SectionDescriptor[],
): Map<string, { section: SectionDescriptor; subsections: Set<string> }> {
  const affected = new Map<string, { section: SectionDescriptor; subsections: Set<string> }>();
  for (const changedFile of changedFiles.map(normalizePath)) {
    for (const section of sections) {
      if (!matchesAnyGlob(changedFile, section.globs)) continue;
      if (!affected.has(section.id)) {
        affected.set(section.id, { section, subsections: new Set<string>() });
      }
      if (section.subsections) {
        for (const subsection of Object.values(section.subsections)) {
          if (matchesAnyGlob(changedFile, subsection.globs)) {
            affected.get(section.id)?.subsections.add(subsection.id);
          }
        }
      }
    }
  }
  return affected;
}

export function runReadmeAutosync(options: { changedFiles: string[]; summaryFile?: string }): AutosyncSummary {
  if (!existsSync(README_PATH)) {
    throw new Error(`README not found at ${README_PATH}`);
  }

  const allFiles = walkFiles(ROOT);
  const dynamicSections = inferDynamicSections(options.changedFiles, SECTION_REGISTRY);
  const sections = [...SECTION_REGISTRY, ...dynamicSections];
  const affected = computeAffected(options.changedFiles, sections);

  if (affected.size === 0) {
    const summary: AutosyncSummary = {
      changedFiles: options.changedFiles,
      affectedSections: [],
      regeneratedSections: [],
      regeneratedSubsections: [],
      readmeChanged: false,
    };
    if (options.summaryFile) writeFileSync(options.summaryFile, JSON.stringify(summary, null, 2));
    return summary;
  }

  let readme = readFileSync(README_PATH, 'utf8');
  const regeneratedSubsections: Array<{ sectionId: string; subsectionId: string; title: string }> = [];
  const regeneratedSections: Array<{ id: string; title: string }> = [];

  for (const { section, subsections } of affected.values()) {
    const sectionFiles = allFiles.filter((file) => matchesAnyGlob(file, section.globs));
    let replacement = buildSectionBlock(section, sectionFiles);

    if (subsections.size > 0 && section.subsections) {
      for (const subsectionId of [...subsections].sort()) {
        const subsection = section.subsections[subsectionId];
        if (!subsection) continue;
        const subsectionFiles = allFiles.filter((file) => matchesAnyGlob(file, subsection.globs));
        replacement = upsertSubsectionInSection(replacement, subsection, buildSubsectionBlock(subsection, subsectionFiles));
        regeneratedSubsections.push({ sectionId: section.id, subsectionId, title: subsection.title });
      }
    }

    readme = replaceSection(readme, section, replacement);
    regeneratedSections.push({ id: section.id, title: section.title });
  }

  const original = readFileSync(README_PATH, 'utf8');
  const readmeChanged = original !== readme;
  if (readmeChanged) writeFileSync(README_PATH, readme);

  const summary: AutosyncSummary = {
    changedFiles: options.changedFiles,
    affectedSections: [...affected.values()].map(({ section }) => ({ id: section.id, title: section.title })),
    regeneratedSections,
    regeneratedSubsections,
    readmeChanged,
  };

  if (options.summaryFile) writeFileSync(options.summaryFile, JSON.stringify(summary, null, 2));
  return summary;
}

function parseArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function readChangedFiles(changedFilesPath: string): string[] {
  if (!existsSync(changedFilesPath)) return [];
  return readFileSync(changedFilesPath, 'utf8')
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalizePath);
}

if (process.argv[1] && resolve(process.argv[1]) === __filename) {
  const changedFilesFile = parseArg('--changed-files');
  if (!changedFilesFile) {
    console.error('Missing required argument: --changed-files <path>');
    process.exit(1);
  }

  const summaryFile = parseArg('--summary-file');
  const changedFiles = readChangedFiles(resolve(changedFilesFile));
  const summary = runReadmeAutosync({ changedFiles, summaryFile: summaryFile ? resolve(summaryFile) : undefined });
  console.log(JSON.stringify(summary, null, 2));
}
