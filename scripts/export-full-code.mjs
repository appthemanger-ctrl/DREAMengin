#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_EXCLUDED_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build']);
export const DEFAULT_EXCLUDED_BASENAMES = new Set(['DREAMengin-full-code.txt']);

function shouldSkipEntry(entryName, parentPath, rootDir, excludedDirs, excludedBasenames) {
  const fullPath = path.join(parentPath, entryName);
  const relativePath = path.relative(rootDir, fullPath);

  if (!relativePath || relativePath.startsWith(`..${path.sep}`)) {
    return false;
  }

  if (excludedBasenames.has(entryName)) {
    return true;
  }

  return relativePath.split(path.sep).some((segment) => excludedDirs.has(segment));
}

export function isProbablyTextBuffer(buffer) {
  if (buffer.length === 0) {
    return false;
  }

  let suspiciousBytes = 0;
  const sample = buffer.subarray(0, 8192);

  for (const byte of sample) {
    if (byte === 0) {
      return false;
    }

    const isAsciiControl = byte < 32 && ![9, 10, 12, 13].includes(byte);
    if (isAsciiControl) {
      suspiciousBytes += 1;
    }
  }

  return suspiciousBytes / sample.length < 0.1;
}

export function hasPrintableContent(buffer) {
  if (!isProbablyTextBuffer(buffer)) {
    return false;
  }

  const text = buffer.toString('utf8');
  return /[^\r\n]/.test(text);
}

export async function collectExportableFiles(rootDir, options = {}) {
  const excludedDirs = options.excludedDirs ?? DEFAULT_EXCLUDED_DIRS;
  const excludedBasenames = options.excludedBasenames ?? DEFAULT_EXCLUDED_BASENAMES;
  const files = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      if (shouldSkipEntry(entry.name, currentDir, rootDir, excludedDirs, excludedBasenames)) {
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const content = await fs.readFile(fullPath);
      if (hasPrintableContent(content)) {
        files.push(fullPath);
      }
    }
  }

  await walk(rootDir);
  return files;
}

export async function exportFullCodeSnapshot({
  rootDir = path.resolve(__dirname, '..'),
  outputFile = path.join(path.resolve(__dirname, '..'), 'DREAMengin-full-code.txt'),
} = {}) {
  const files = await collectExportableFiles(rootDir);

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  const handle = await fs.open(outputFile, 'w');

  try {
    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      await handle.writeFile(`\n\n===== ${file} =====\n${content}`);
    }
  } finally {
    await handle.close();
  }

  return { outputFile, fileCount: files.length };
}

async function main() {
  const outputFile = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : path.join(path.resolve(__dirname, '..'), 'DREAMengin-full-code.txt');

  const { fileCount } = await exportFullCodeSnapshot({ outputFile });
  console.log(`Exported ${fileCount} files to ${outputFile}`);
}

const isDirectRun = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
