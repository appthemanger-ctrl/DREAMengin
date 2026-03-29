#!/usr/bin/env node
/**
 * DREAMengin Repository State Analyzer
 *
 * Comprehensive analysis tool that examines every aspect of the repository:
 * - Tech stack and dependencies
 * - Directory structure and file organization
 * - Code statistics and metrics
 * - API routes and endpoints
 * - Components and their relationships
 * - Database schema and migrations
 * - Tests and coverage
 * - Documentation
 * - Configuration files
 * - CI/CD workflows
 * - Outdated dependencies and 2026 standards compliance
 * - Redundancies and optimization opportunities
 *
 * Generates REPO_STATE.md with actionable insights for AI agents.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'REPO_STATE.md');

// Utility functions
const exec = (cmd) => {
  try {
    return execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  } catch (error) {
    return `Error: ${error.message}`;
  }
};

const readJSON = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
};

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const countLines = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
};

const getFileSize = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
};

const walkDir = async (dir, filter = () => true) => {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'build') {
        files.push(...await walkDir(fullPath, filter));
      }
    } else if (filter(entry.name, fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
};

// Analysis functions
async function analyzePackageJson() {
  const pkg = await readJSON(path.join(ROOT_DIR, 'package.json'));
  if (!pkg) return { error: 'package.json not found' };

  const now = new Date();
  const currentYear = now.getFullYear();

  return {
    name: pkg.name,
    version: pkg.version,
    packageManager: pkg.packageManager,
    scripts: Object.keys(pkg.scripts || {}),
    dependencies: pkg.dependencies || {},
    devDependencies: pkg.devDependencies || {},
    totalDeps: Object.keys(pkg.dependencies || {}).length,
    totalDevDeps: Object.keys(pkg.devDependencies || {}).length,
  };
}

async function analyzeFileStructure() {
  const structure = {};

  const dirs = ['app', 'components', 'lib', 'tests', 'styles', 'public', 'docs', 'scripts', 'supabase'];

  for (const dir of dirs) {
    const dirPath = path.join(ROOT_DIR, dir);
    if (await fileExists(dirPath)) {
      const files = await walkDir(dirPath);
      structure[dir] = {
        totalFiles: files.length,
        byExtension: {}
      };

      for (const file of files) {
        const ext = path.extname(file) || 'no-extension';
        structure[dir].byExtension[ext] = (structure[dir].byExtension[ext] || 0) + 1;
      }
    }
  }

  return structure;
}

async function analyzeCodeMetrics() {
  const tsxFiles = await walkDir(path.join(ROOT_DIR, 'app'), (name) => name.endsWith('.tsx'));
  const componentFiles = await walkDir(path.join(ROOT_DIR, 'components'), (name) => name.endsWith('.tsx'));
  const libFiles = await walkDir(path.join(ROOT_DIR, 'lib'), (name) => name.endsWith('.ts') || name.endsWith('.tsx'));
  const testFiles = await walkDir(path.join(ROOT_DIR, 'tests'), (name) => name.endsWith('.test.ts') || name.endsWith('.test.tsx'));

  let totalLines = 0;
  let totalSize = 0;

  for (const file of [...tsxFiles, ...componentFiles, ...libFiles]) {
    totalLines += await countLines(file);
    totalSize += await getFileSize(file);
  }

  return {
    tsxFiles: tsxFiles.length,
    componentFiles: componentFiles.length,
    libFiles: libFiles.length,
    testFiles: testFiles.length,
    totalCodeFiles: tsxFiles.length + componentFiles.length + libFiles.length,
    totalLines,
    totalSize: (totalSize / 1024 / 1024).toFixed(2) + ' MB',
  };
}

async function analyzeAPIRoutes() {
  const apiDir = path.join(ROOT_DIR, 'app/api');
  if (!await fileExists(apiDir)) return { routes: [] };

  const routes = [];

  const findRoutes = async (dir, basePath = '') => {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const routePath = basePath + '/' + entry.name;
        await findRoutes(fullPath, routePath);
      } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
        const content = await fs.readFile(fullPath, 'utf-8');
        const methods = [];
        if (content.includes('export async function GET')) methods.push('GET');
        if (content.includes('export async function POST')) methods.push('POST');
        if (content.includes('export async function PUT')) methods.push('PUT');
        if (content.includes('export async function PATCH')) methods.push('PATCH');
        if (content.includes('export async function DELETE')) methods.push('DELETE');

        routes.push({
          path: '/api' + basePath,
          methods,
          file: fullPath.replace(ROOT_DIR, ''),
        });
      }
    }
  };

  await findRoutes(apiDir);
  return { routes, count: routes.length };
}

async function analyzePages() {
  const appDir = path.join(ROOT_DIR, 'app');
  if (!await fileExists(appDir)) return { pages: [] };

  const pages = [];

  const findPages = async (dir, basePath = '') => {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('_') && entry.name !== 'api') {
        const routePath = basePath + '/' + entry.name;
        await findPages(fullPath, routePath);
      } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
        pages.push({
          route: basePath || '/',
          file: fullPath.replace(ROOT_DIR, ''),
        });
      }
    }
  };

  await findPages(appDir);
  return { pages, count: pages.length };
}

async function analyzeComponents() {
  const componentDir = path.join(ROOT_DIR, 'components');
  if (!await fileExists(componentDir)) return { components: [] };

  const subdirs = await fs.readdir(componentDir, { withFileTypes: true });
  const categories = [];

  for (const entry of subdirs.filter(e => e.isDirectory())) {
    const files = await walkDir(path.join(componentDir, entry.name), (name) =>
      name.endsWith('.tsx') || name.endsWith('.ts')
    );
    categories.push({
      name: entry.name,
      fileCount: files.length,
    });
  }

  return { categories, totalCategories: categories.length };
}

async function analyzeDatabaseSchema() {
  const migrationsDir = path.join(ROOT_DIR, 'supabase/migrations');
  if (!await fileExists(migrationsDir)) return { migrations: [] };

  const files = await fs.readdir(migrationsDir);
  const migrations = files
    .filter(f => f.endsWith('.sql'))
    .sort()
    .map(f => ({ file: f, path: `/supabase/migrations/${f}` }));

  const schemaFile = path.join(ROOT_DIR, 'supabase/schema-final.sql');
  const hasSchema = await fileExists(schemaFile);

  return {
    migrations,
    migrationCount: migrations.length,
    hasSchemaFile: hasSchema,
  };
}

async function analyzeTests() {
  const testsDir = path.join(ROOT_DIR, 'tests');
  if (!await fileExists(testsDir)) return { testFiles: [] };

  const testFiles = await walkDir(testsDir, (name) =>
    name.endsWith('.test.ts') || name.endsWith('.test.tsx') || name.endsWith('.spec.ts')
  );

  // Try to run tests and get results
  const testOutput = exec('pnpm run test 2>&1 || true');
  const passMatch = testOutput.match(/(\d+) passed/);
  const failMatch = testOutput.match(/(\d+) failed/);

  return {
    testFiles: testFiles.map(f => f.replace(ROOT_DIR, '')),
    testFileCount: testFiles.length,
    testsPassing: passMatch ? parseInt(passMatch[1]) : 'unknown',
    testsFailing: failMatch ? parseInt(failMatch[1]) : 0,
  };
}

async function analyzeDocumentation() {
  const docsDir = path.join(ROOT_DIR, 'docs');
  const rootDocs = ['README.md', 'CHANGELOG.md', 'LICENSE', 'IMPLEMENTATION_NOTES.md'];

  const docs = [];

  for (const doc of rootDocs) {
    if (await fileExists(path.join(ROOT_DIR, doc))) {
      docs.push({ name: doc, path: `/${doc}` });
    }
  }

  if (await fileExists(docsDir)) {
    const docFiles = await walkDir(docsDir, (name) => name.endsWith('.md'));
    docs.push(...docFiles.map(f => ({
      name: path.basename(f),
      path: f.replace(ROOT_DIR, '')
    })));
  }

  return { docs, count: docs.length };
}

async function analyzeGitHubActions() {
  const workflowsDir = path.join(ROOT_DIR, '.github/workflows');
  if (!await fileExists(workflowsDir)) return { workflows: [] };

  const files = await fs.readdir(workflowsDir);
  const workflows = files
    .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
    .map(f => ({ name: f, path: `/.github/workflows/${f}` }));

  return { workflows, count: workflows.length };
}

async function analyzeConfigFiles() {
  const configs = [
    'package.json',
    'tsconfig.json',
    'next.config.mjs',
    'tailwind.config.ts',
    'eslint.config.mjs',
    'vercel.json',
    'docker-compose.yml',
    'Dockerfile',
    '.env.example',
    'vitest.config.ts',
    'playwright.config.ts',
  ];

  const found = [];
  for (const config of configs) {
    if (await fileExists(path.join(ROOT_DIR, config))) {
      found.push({ name: config, path: `/${config}` });
    }
  }

  return { configs: found, count: found.length };
}

async function analyzeDependencyHealth() {
  const pkg = await readJSON(path.join(ROOT_DIR, 'package.json'));
  if (!pkg) return { status: 'unknown' };

  const issues = [];
  const recommendations = [];

  // Check for outdated major versions
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Check specific packages for 2026 standards
  if (deps['next'] && !deps['next'].includes('^16') && !deps['next'].includes('^17')) {
    issues.push('Next.js version should be 16+ for 2026 standards');
  }

  if (deps['react'] && !deps['react'].includes('^19')) {
    issues.push('React version should be 19+ for 2026 standards');
  }

  if (deps['typescript'] && deps['typescript'].includes('^5.5')) {
    recommendations.push('TypeScript 5.5+ is good for 2026');
  }

  // Check for deprecated packages
  if (deps['moment']) {
    issues.push('moment.js is deprecated, consider using date-fns or dayjs');
  }

  return { issues, recommendations };
}

async function analyzeCodeQuality() {
  const issues = [];
  const recommendations = [];

  // Check for TypeScript strict mode
  const tsconfig = await readJSON(path.join(ROOT_DIR, 'tsconfig.json'));
  if (tsconfig && !tsconfig.compilerOptions?.strict) {
    issues.push('TypeScript strict mode is not enabled');
  } else {
    recommendations.push('TypeScript strict mode is enabled ✓');
  }

  // Check for ESLint
  if (await fileExists(path.join(ROOT_DIR, 'eslint.config.mjs'))) {
    recommendations.push('ESLint is configured ✓');
  } else {
    issues.push('ESLint configuration not found');
  }

  // Check for testing framework
  if (await fileExists(path.join(ROOT_DIR, 'vitest.config.ts'))) {
    recommendations.push('Vitest is configured ✓');
  }

  // Check for Playwright E2E
  if (await fileExists(path.join(ROOT_DIR, 'playwright.config.ts'))) {
    recommendations.push('Playwright E2E testing is configured ✓');
  }

  return { issues, recommendations };
}

async function findRedundancies() {
  const redundancies = [];

  // Check for duplicate components (same name in different dirs)
  const componentFiles = await walkDir(path.join(ROOT_DIR, 'components'), (name) => name.endsWith('.tsx'));
  const componentNames = new Map();

  for (const file of componentFiles) {
    const basename = path.basename(file);
    if (!componentNames.has(basename)) {
      componentNames.set(basename, []);
    }
    componentNames.get(basename).push(file.replace(ROOT_DIR, ''));
  }

  for (const [name, paths] of componentNames) {
    if (paths.length > 1) {
      redundancies.push({
        type: 'Duplicate component name',
        name,
        locations: paths,
      });
    }
  }

  // Check for unused dependencies
  const pkg = await readJSON(path.join(ROOT_DIR, 'package.json'));
  if (pkg) {
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const unusedDeps = [];

    // This is a simple check - a more thorough analysis would require depcheck
    for (const dep of Object.keys(allDeps)) {
      // Skip obvious framework dependencies
      if (['react', 'react-dom', 'next', 'typescript'].includes(dep)) continue;

      // Check if referenced in any source file
      const grepResult = exec(`grep -r "from '${dep}'" app/ components/ lib/ 2>/dev/null || true`);
      const grepResult2 = exec(`grep -r 'from "${dep}"' app/ components/ lib/ 2>/dev/null || true`);

      if (!grepResult && !grepResult2) {
        unusedDeps.push(dep);
      }
    }

    if (unusedDeps.length > 0) {
      redundancies.push({
        type: 'Potentially unused dependencies',
        items: unusedDeps,
      });
    }
  }

  return redundancies;
}

async function analyzeArchitecturePatterns() {
  const patterns = [];

  // Check for Server Components usage
  const appFiles = await walkDir(path.join(ROOT_DIR, 'app'), (name) => name.endsWith('.tsx'));
  let clientComponentCount = 0;
  let serverComponentCount = 0;

  for (const file of appFiles) {
    const content = await fs.readFile(file, 'utf-8');
    if (content.includes("'use client'") || content.includes('"use client"')) {
      clientComponentCount++;
    } else {
      serverComponentCount++;
    }
  }

  patterns.push({
    name: 'Next.js App Router Architecture',
    details: `${serverComponentCount} Server Components, ${clientComponentCount} Client Components`,
  });

  // Check for Supabase usage
  const hasSupabase = await fileExists(path.join(ROOT_DIR, 'lib/supabase'));
  if (hasSupabase) {
    patterns.push({
      name: 'Supabase Backend',
      details: 'Using Supabase for database, auth, and storage',
    });
  }

  // Check for state management
  const hasContexts = await walkDir(path.join(ROOT_DIR, 'lib'), (name) =>
    name.toLowerCase().includes('context') || name.toLowerCase().includes('provider')
  );
  if (hasContexts.length > 0) {
    patterns.push({
      name: 'React Context for State Management',
      details: `${hasContexts.length} context providers found`,
    });
  }

  return patterns;
}

async function generateGitInfo() {
  const branch = exec('git rev-parse --abbrev-ref HEAD').trim();
  const commit = exec('git rev-parse HEAD').trim();
  const commitShort = exec('git rev-parse --short HEAD').trim();
  const commitDate = exec('git log -1 --format=%cd --date=iso').trim();
  const commitMessage = exec('git log -1 --format=%s').trim();
  const totalCommits = exec('git rev-list --count HEAD').trim();

  return {
    branch,
    commit,
    commitShort,
    commitDate,
    commitMessage,
    totalCommits,
  };
}

// Main analysis function
async function analyzeRepository() {
  console.log('🔍 Starting comprehensive repository analysis...\n');

  const analysis = {
    generatedAt: new Date().toISOString(),
    git: await generateGitInfo(),
    package: await analyzePackageJson(),
    structure: await analyzeFileStructure(),
    metrics: await analyzeCodeMetrics(),
    api: await analyzeAPIRoutes(),
    pages: await analyzePages(),
    components: await analyzeComponents(),
    database: await analyzeDatabaseSchema(),
    tests: await analyzeTests(),
    docs: await analyzeDocumentation(),
    workflows: await analyzeGitHubActions(),
    configs: await analyzeConfigFiles(),
    dependencyHealth: await analyzeDependencyHealth(),
    codeQuality: await analyzeCodeQuality(),
    redundancies: await findRedundancies(),
    architecturePatterns: await analyzeArchitecturePatterns(),
  };

  console.log('✅ Analysis complete!\n');
  return analysis;
}

// Generate markdown report
function generateMarkdown(analysis) {
  const lines = [];

  lines.push('# DREAMengin Repository State');
  lines.push('');
  lines.push('> **Comprehensive analysis of the entire codebase**');
  lines.push('> Generated automatically - DO NOT EDIT MANUALLY');
  lines.push('');
  lines.push(`**Last Updated:** ${new Date(analysis.generatedAt).toLocaleString()}`);
  lines.push(`**Branch:** ${analysis.git.branch}`);
  lines.push(`**Commit:** ${analysis.git.commitShort} - ${analysis.git.commitMessage}`);
  lines.push(`**Total Commits:** ${analysis.git.totalCommits}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Table of Contents
  lines.push('## Table of Contents');
  lines.push('');
  lines.push('1. [Overview](#overview)');
  lines.push('2. [Tech Stack](#tech-stack)');
  lines.push('3. [Repository Structure](#repository-structure)');
  lines.push('4. [Code Metrics](#code-metrics)');
  lines.push('5. [API Routes](#api-routes)');
  lines.push('6. [Pages & Routes](#pages--routes)');
  lines.push('7. [Components](#components)');
  lines.push('8. [Database Schema](#database-schema)');
  lines.push('9. [Tests](#tests)');
  lines.push('10. [Documentation](#documentation)');
  lines.push('11. [CI/CD Workflows](#cicd-workflows)');
  lines.push('12. [Configuration Files](#configuration-files)');
  lines.push('13. [Architecture Patterns](#architecture-patterns)');
  lines.push('14. [Code Quality](#code-quality)');
  lines.push('15. [Dependency Health](#dependency-health)');
  lines.push('16. [Redundancies & Technical Debt](#redundancies--technical-debt)');
  lines.push('17. [2026 Standards Compliance](#2026-standards-compliance)');
  lines.push('18. [Action Items](#action-items)');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Overview
  lines.push('## Overview');
  lines.push('');
  lines.push(`**Project:** ${analysis.package.name}`);
  lines.push(`**Version:** ${analysis.package.version}`);
  lines.push(`**Package Manager:** ${analysis.package.packageManager}`);
  lines.push('');
  lines.push('**Quick Stats:**');
  lines.push('');
  lines.push(`- 📁 Total Code Files: ${analysis.metrics.totalCodeFiles}`);
  lines.push(`- 📝 Total Lines of Code: ${analysis.metrics.totalLines.toLocaleString()}`);
  lines.push(`- 📦 Size: ${analysis.metrics.totalSize}`);
  lines.push(`- 🧪 Tests: ${analysis.tests.testFileCount} files, ${analysis.tests.testsPassing} passing`);
  lines.push(`- 📄 API Routes: ${analysis.api.count}`);
  lines.push(`- 🎨 Components: ${analysis.components.totalCategories} categories`);
  lines.push(`- 📖 Documentation: ${analysis.docs.count} files`);
  lines.push(`- ⚙️ GitHub Actions: ${analysis.workflows.count} workflows`);
  lines.push('');

  // Tech Stack
  lines.push('## Tech Stack');
  lines.push('');
  lines.push('### Core Dependencies');
  lines.push('');
  lines.push('| Package | Version |');
  lines.push('|---------|---------|');
  const coreDeps = ['next', 'react', 'react-dom', 'typescript', '@supabase/supabase-js'];
  for (const dep of coreDeps) {
    if (analysis.package.dependencies[dep] || analysis.package.devDependencies[dep]) {
      const version = analysis.package.dependencies[dep] || analysis.package.devDependencies[dep];
      lines.push(`| ${dep} | ${version} |`);
    }
  }
  lines.push('');
  lines.push('### All Dependencies');
  lines.push('');
  lines.push(`**Production Dependencies:** ${analysis.package.totalDeps}`);
  lines.push('```');
  for (const [dep, ver] of Object.entries(analysis.package.dependencies).slice(0, 20)) {
    lines.push(`${dep}@${ver}`);
  }
  if (analysis.package.totalDeps > 20) {
    lines.push(`... and ${analysis.package.totalDeps - 20} more`);
  }
  lines.push('```');
  lines.push('');
  lines.push(`**Dev Dependencies:** ${analysis.package.totalDevDeps}`);
  lines.push('```');
  for (const [dep, ver] of Object.entries(analysis.package.devDependencies).slice(0, 20)) {
    lines.push(`${dep}@${ver}`);
  }
  if (analysis.package.totalDevDeps > 20) {
    lines.push(`... and ${analysis.package.totalDevDeps - 20} more`);
  }
  lines.push('```');
  lines.push('');

  // Repository Structure
  lines.push('## Repository Structure');
  lines.push('');
  lines.push('### Directory Breakdown');
  lines.push('');
  lines.push('| Directory | Total Files | File Types |');
  lines.push('|-----------|-------------|------------|');
  for (const [dir, data] of Object.entries(analysis.structure)) {
    const types = Object.entries(data.byExtension)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([ext, count]) => `${ext}(${count})`)
      .join(', ');
    lines.push(`| \`${dir}/\` | ${data.totalFiles} | ${types} |`);
  }
  lines.push('');

  // Code Metrics
  lines.push('## Code Metrics');
  lines.push('');
  lines.push('### File Distribution');
  lines.push('');
  lines.push(`- **App Routes (TSX):** ${analysis.metrics.tsxFiles}`);
  lines.push(`- **Component Files:** ${analysis.metrics.componentFiles}`);
  lines.push(`- **Library Files:** ${analysis.metrics.libFiles}`);
  lines.push(`- **Test Files:** ${analysis.metrics.testFiles}`);
  lines.push('');
  lines.push('### Code Volume');
  lines.push('');
  lines.push(`- **Total Lines:** ${analysis.metrics.totalLines.toLocaleString()}`);
  lines.push(`- **Total Size:** ${analysis.metrics.totalSize}`);
  lines.push('');

  // API Routes
  lines.push('## API Routes');
  lines.push('');
  lines.push(`**Total API Endpoints:** ${analysis.api.count}`);
  lines.push('');
  if (analysis.api.routes.length > 0) {
    lines.push('### All Routes');
    lines.push('');
    lines.push('| Path | Methods | File |');
    lines.push('|------|---------|------|');
    for (const route of analysis.api.routes.slice(0, 50)) {
      lines.push(`| \`${route.path}\` | ${route.methods.join(', ')} | ${route.file} |`);
    }
    if (analysis.api.routes.length > 50) {
      lines.push(`| ... | ... | ... and ${analysis.api.routes.length - 50} more routes |`);
    }
    lines.push('');
  }

  // Pages
  lines.push('## Pages & Routes');
  lines.push('');
  lines.push(`**Total Pages:** ${analysis.pages.count}`);
  lines.push('');
  if (analysis.pages.pages.length > 0) {
    lines.push('### All Pages');
    lines.push('');
    lines.push('| Route | File |');
    lines.push('|-------|------|');
    for (const page of analysis.pages.pages.slice(0, 50)) {
      lines.push(`| \`${page.route}\` | ${page.file} |`);
    }
    if (analysis.pages.pages.length > 50) {
      lines.push(`| ... | ... and ${analysis.pages.pages.length - 50} more pages |`);
    }
    lines.push('');
  }

  // Components
  lines.push('## Components');
  lines.push('');
  lines.push(`**Total Component Categories:** ${analysis.components.totalCategories}`);
  lines.push('');
  lines.push('### Component Organization');
  lines.push('');
  lines.push('| Category | File Count |');
  lines.push('|----------|-----------|');
  for (const cat of analysis.components.categories) {
    lines.push(`| \`${cat.name}/\` | ${cat.fileCount} |`);
  }
  lines.push('');

  // Database
  lines.push('## Database Schema');
  lines.push('');
  lines.push(`**Total Migrations:** ${analysis.database.migrationCount}`);
  lines.push(`**Schema File:** ${analysis.database.hasSchemaFile ? '✓ Present' : '✗ Missing'}`);
  lines.push('');
  if (analysis.database.migrations.length > 0) {
    lines.push('### Migration History');
    lines.push('');
    lines.push('| Migration File |');
    lines.push('|----------------|');
    for (const mig of analysis.database.migrations.slice(-10)) {
      lines.push(`| ${mig.file} |`);
    }
    if (analysis.database.migrations.length > 10) {
      lines.push(`| ... and ${analysis.database.migrations.length - 10} earlier migrations |`);
    }
    lines.push('');
  }

  // Tests
  lines.push('## Tests');
  lines.push('');
  lines.push(`**Test Files:** ${analysis.tests.testFileCount}`);
  lines.push(`**Tests Passing:** ${analysis.tests.testsPassing}`);
  lines.push(`**Tests Failing:** ${analysis.tests.testsFailing}`);
  lines.push('');
  if (analysis.tests.testFiles.length > 0) {
    lines.push('### Test Files');
    lines.push('');
    for (const testFile of analysis.tests.testFiles.slice(0, 20)) {
      lines.push(`- ${testFile}`);
    }
    if (analysis.tests.testFiles.length > 20) {
      lines.push(`- ... and ${analysis.tests.testFiles.length - 20} more test files`);
    }
    lines.push('');
  }

  // Documentation
  lines.push('## Documentation');
  lines.push('');
  lines.push(`**Total Documentation Files:** ${analysis.docs.count}`);
  lines.push('');
  lines.push('### Documentation Files');
  lines.push('');
  for (const doc of analysis.docs.docs.slice(0, 30)) {
    lines.push(`- [${doc.name}](${doc.path})`);
  }
  if (analysis.docs.docs.length > 30) {
    lines.push(`- ... and ${analysis.docs.docs.length - 30} more docs`);
  }
  lines.push('');

  // Workflows
  lines.push('## CI/CD Workflows');
  lines.push('');
  lines.push(`**Total Workflows:** ${analysis.workflows.count}`);
  lines.push('');
  if (analysis.workflows.workflows.length > 0) {
    lines.push('### Workflow Files');
    lines.push('');
    for (const workflow of analysis.workflows.workflows) {
      lines.push(`- ${workflow.name}`);
    }
    lines.push('');
  }

  // Config Files
  lines.push('## Configuration Files');
  lines.push('');
  lines.push(`**Total Configuration Files:** ${analysis.configs.count}`);
  lines.push('');
  lines.push('### Config Files');
  lines.push('');
  for (const config of analysis.configs.configs) {
    lines.push(`- [${config.name}](${config.path})`);
  }
  lines.push('');

  // Architecture Patterns
  lines.push('## Architecture Patterns');
  lines.push('');
  for (const pattern of analysis.architecturePatterns) {
    lines.push(`### ${pattern.name}`);
    lines.push('');
    lines.push(pattern.details);
    lines.push('');
  }

  // Code Quality
  lines.push('## Code Quality');
  lines.push('');
  lines.push('### ✅ Positive Indicators');
  lines.push('');
  for (const rec of analysis.codeQuality.recommendations) {
    lines.push(`- ${rec}`);
  }
  lines.push('');
  if (analysis.codeQuality.issues.length > 0) {
    lines.push('### ⚠️ Issues to Address');
    lines.push('');
    for (const issue of analysis.codeQuality.issues) {
      lines.push(`- ${issue}`);
    }
    lines.push('');
  }

  // Dependency Health
  lines.push('## Dependency Health');
  lines.push('');
  if (analysis.dependencyHealth.recommendations.length > 0) {
    lines.push('### ✅ Up to Date');
    lines.push('');
    for (const rec of analysis.dependencyHealth.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  }
  if (analysis.dependencyHealth.issues.length > 0) {
    lines.push('### ⚠️ Needs Attention');
    lines.push('');
    for (const issue of analysis.dependencyHealth.issues) {
      lines.push(`- ${issue}`);
    }
    lines.push('');
  }

  // Redundancies
  lines.push('## Redundancies & Technical Debt');
  lines.push('');
  if (analysis.redundancies.length === 0) {
    lines.push('✅ No major redundancies detected.');
    lines.push('');
  } else {
    for (const redundancy of analysis.redundancies) {
      lines.push(`### ${redundancy.type}`);
      lines.push('');
      if (redundancy.locations) {
        for (const loc of redundancy.locations) {
          lines.push(`- ${loc}`);
        }
      } else if (redundancy.items) {
        for (const item of redundancy.items.slice(0, 20)) {
          lines.push(`- ${item}`);
        }
        if (redundancy.items.length > 20) {
          lines.push(`- ... and ${redundancy.items.length - 20} more`);
        }
      }
      lines.push('');
    }
  }

  // 2026 Standards
  lines.push('## 2026 Standards Compliance');
  lines.push('');
  lines.push('### Current Status');
  lines.push('');

  const standards = [];

  // Check React 19
  if (analysis.package.dependencies.react?.includes('^19')) {
    standards.push('✅ React 19 - Latest version');
  } else {
    standards.push('⚠️ React version should be upgraded to 19+');
  }

  // Check Next.js 16+
  if (analysis.package.dependencies.next?.includes('^16')) {
    standards.push('✅ Next.js 16+ - Latest App Router');
  } else {
    standards.push('⚠️ Next.js should be upgraded to 16+');
  }

  // Check TypeScript 5.5+
  if (analysis.package.devDependencies.typescript?.includes('^5.5')) {
    standards.push('✅ TypeScript 5.5+ - Latest features');
  } else {
    standards.push('⚠️ TypeScript should be 5.5+');
  }

  // Check for modern testing
  if (analysis.package.devDependencies.vitest) {
    standards.push('✅ Vitest - Modern testing framework');
  } else {
    standards.push('⚠️ Consider migrating to Vitest');
  }

  // Check for E2E testing
  if (analysis.package.devDependencies.playwright) {
    standards.push('✅ Playwright - Modern E2E testing');
  } else {
    standards.push('⚠️ Consider adding Playwright for E2E tests');
  }

  for (const std of standards) {
    lines.push(`- ${std}`);
  }
  lines.push('');

  // Action Items
  lines.push('## Action Items');
  lines.push('');
  lines.push('### High Priority');
  lines.push('');
  const highPriority = [
    ...analysis.codeQuality.issues.map(i => `🔴 ${i}`),
    ...analysis.dependencyHealth.issues.map(i => `🔴 ${i}`),
  ];

  if (highPriority.length > 0) {
    for (const item of highPriority) {
      lines.push(`- ${item}`);
    }
  } else {
    lines.push('✅ No high-priority action items!');
  }
  lines.push('');

  lines.push('### Medium Priority');
  lines.push('');
  const mediumPriority = [];

  if (analysis.redundancies.length > 0) {
    mediumPriority.push('🟡 Review and remove redundant code');
  }

  if (analysis.tests.testsFailing > 0) {
    mediumPriority.push(`🟡 Fix ${analysis.tests.testsFailing} failing tests`);
  }

  if (mediumPriority.length > 0) {
    for (const item of mediumPriority) {
      lines.push(`- ${item}`);
    }
  } else {
    lines.push('✅ No medium-priority action items!');
  }
  lines.push('');

  lines.push('### Low Priority');
  lines.push('');
  lines.push('- 🟢 Continue monitoring dependency updates');
  lines.push('- 🟢 Keep documentation in sync with code changes');
  lines.push('- 🟢 Add more test coverage where needed');
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('*This document is automatically generated by `scripts/analyze-repo-state.mjs`*');
  lines.push('*Last updated: ' + new Date(analysis.generatedAt).toLocaleString() + '*');
  lines.push('');

  return lines.join('\n');
}

// Main execution
async function main() {
  try {
    console.log('🚀 DREAMengin Repository State Analyzer\n');

    const analysis = await analyzeRepository();
    const markdown = generateMarkdown(analysis);

    await fs.writeFile(OUTPUT_FILE, markdown, 'utf-8');

    console.log(`✅ Repository state analysis complete!`);
    console.log(`📝 Report saved to: ${OUTPUT_FILE}`);
    console.log('');
    console.log('Summary:');
    console.log(`- ${analysis.metrics.totalCodeFiles} code files`);
    console.log(`- ${analysis.metrics.totalLines.toLocaleString()} lines of code`);
    console.log(`- ${analysis.api.count} API routes`);
    console.log(`- ${analysis.pages.count} pages`);
    console.log(`- ${analysis.tests.testFileCount} test files`);
    console.log(`- ${analysis.workflows.count} GitHub Actions`);
    console.log('');
  } catch (error) {
    console.error('❌ Error analyzing repository:', error);
    process.exit(1);
  }
}

main();
