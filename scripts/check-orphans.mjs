#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRegistry } from './wire-orphans.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'build-memory', 'registry.json');

async function main() {
  const [{ scannedFiles }, registryRaw] = await Promise.all([
    buildRegistry({ write: false }),
    fs.readFile(REGISTRY_PATH, 'utf8'),
  ]);

  const registry = JSON.parse(registryRaw);
  const referenced = new Set(
    Array.isArray(registry.entries)
      ? registry.entries
        .map((entry) => (entry && typeof entry.path === 'string' ? entry.path : null))
        .filter((value) => value !== null)
      : [],
  );

  const { registry: expectedRegistry } = await buildRegistry({ write: false });
  const scopedSources = new Set(expectedRegistry.entries.map((entry) => entry.path));

  const orphans = Array.from(scopedSources).filter((sourcePath) => !referenced.has(sourcePath));

  if (orphans.length > 0) {
    console.error('Orphan files detected (missing from build-memory/registry.json):');
    for (const orphan of orphans.sort((a, b) => a.localeCompare(b))) {
      console.error(` - ${orphan}`);
    }
    process.exit(1);
  }

  const scannedCount = scannedFiles.length;
  const trackedCount = scopedSources.size;
  console.log(`No orphans detected. Scanned ${scannedCount} files; ${trackedCount} are tracked by the registry.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
