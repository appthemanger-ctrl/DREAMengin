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
]);

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

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

if (violations.length > 0) {
  console.error('Root hygiene violations found:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Root hygiene check passed.');
