#!/usr/bin/env node
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const ALLOWED_ROOT_MARKDOWN = new Set([
  'README.md',
  'CHANGELOG.md',
  'AGENTS.md',
  'REPO_STATE.md',
  'COOP_AND_SOLO_ROADMAP.md',
  'GameENGINspec.md',
  'VISUAL-SCHEMATIC.md',
]);

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);
const PUBLIC_FORBIDDEN_SEGMENTS = new Set([
  'admin',
  'admins',
  'backup',
  'backups',
  'config',
  'configs',
  'legacy',
  'old',
  'tmp',
]);
const APP_FORBIDDEN_ROUTE_DIRS = new Set([
  'admin',
  'backup',
  'backups',
  'config',
  'configs',
]);
const REDIRECT_ONLY_LEGACY_ROUTE_DIRS = new Set([
  'codespace',
  'dreamengin',
  'edit-profile',
  'home',
  'music',
  'physics-lab',
]);

const entries = await readdir(ROOT, { withFileTypes: true });
const rootFiles = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);

const violations = [];

for (const file of rootFiles) {
  const ext = path.extname(file).toLowerCase();

  if (ext === '.md' && !ALLOWED_ROOT_MARKDOWN.has(file)) {
    violations.push(`${file} (root markdown must be moved under docs/)`);
    continue;
  }

  if (IMAGE_EXTENSIONS.has(ext)) {
    violations.push(`${file} (root image must be moved under assets/images/)`);
  }
}

async function collectPublicPathViolations(dir, relative = '') {
  const pathViolations = [];
  let dirEntries = [];

  try {
    dirEntries = await readdir(dir, { withFileTypes: true });
  } catch {
    return pathViolations;
  }

  for (const entry of dirEntries) {
    const entryRelative = path.join(relative, entry.name);
    const segment = entry.name.toLowerCase();

    if (PUBLIC_FORBIDDEN_SEGMENTS.has(segment)) {
      pathViolations.push(`public/${entryRelative} (forbidden webroot segment)`);
    }

    if (entry.isDirectory()) {
      pathViolations.push(
        ...(await collectPublicPathViolations(path.join(dir, entry.name), entryRelative)),
      );
    }
  }

  return pathViolations;
}

const appRoot = path.join(ROOT, 'app');
const appEntries = await readdir(appRoot, { withFileTypes: true });

for (const entry of appEntries) {
  if (!entry.isDirectory()) continue;
  const name = entry.name.toLowerCase();
  if (name === 'api' || name.startsWith('(')) continue;

  if (APP_FORBIDDEN_ROUTE_DIRS.has(name)) {
    violations.push(`app/${entry.name} (admin/config/backup routes must not live at the web root)`);
  }

  if (REDIRECT_ONLY_LEGACY_ROUTE_DIRS.has(name)) {
    violations.push(`app/${entry.name} (redirect-only legacy route must be centralized in next.config.mjs)`);
  }
}

violations.push(...(await collectPublicPathViolations(path.join(ROOT, 'public'))));

if (violations.length > 0) {
  console.error('Root hygiene violations found:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Root hygiene check passed.');
