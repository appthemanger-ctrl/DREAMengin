// scripts/convert-to-js.mjs
// Very conservative TS->JS transformer for your repo.
// - Converts .ts -> .js and .tsx -> .jsx
// - Strips `import type` lines and `export type` declarations
// - Removes simple `: Type` annotations in function params/vars when safe
// - Drops `as const`
// NOTE: Not a full parser; it aims to handle common patterns in this project.

import { readdir, readFile, writeFile, rename, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.next', '.vercel', '.git', 'dist', 'out', '.turbo']);

const extsMap = new Map([['.ts', '.js'], ['.tsx', '.jsx']]);

function shouldSkip(p) {
  const parts = p.split(path.sep);
  return parts.some(part => SKIP_DIRS.has(part));
}

async function walk(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (shouldSkip(p)) continue;
    if (e.isDirectory()) {
      out.push(...await walk(p));
    } else {
      out.push(p);
    }
  }
  return out;
}

function stripTypes(src) {
  let s = src;

  // Remove `import type` lines entirely
  s = s.replace(/^\s*import\s+type\s+[\s\S]*?;[ \t]*$/gm, '');

  // Remove `export type ...` blocks
  s = s.replace(/^\s*export\s+type\s+[\s\S]*?;[ \t]*$/gm, '');

  // Remove `type`-only exports/interfaces
  s = s.replace(/^\s*export\s+interface\s+[\s\S]*?\{[\s\S]*?\}[ \t]*$/gm, '');
  s = s.replace(/^\s*interface\s+[\s\S]*?\{[\s\S]*?\}[ \t]*$/gm, '');

  // Remove : Type in simple variable declarations: const x: Foo = ..., let x: Foo = ...
  s = s.replace(/(\b(const|let|var)\s+[A-Za-z0-9_$]+)\s*:\s*[^=;]+(?==)/g, '$1');

  // Remove : Type in function params (simple cases only)
  s = s.replace(/(\([^\)]*)\s*:\s*[A-Za-z0-9_<>\[\]\|\&\.\{\}\?\s]+/g, '$1');

  // Remove return type annotations in functions: ) : Type {  -> ) {
  s = s.replace(/\)\s*:\s*[A-Za-z0-9_<>\[\]\|\&\.\{\}\?\s]+\s*\{/g, ') {');

  // Remove angle generic on common hooks/Promise: useState<...>, Promise<...>
  s = s.replace(/useState<[^>]+>/g, 'useState');
  s = s.replace(/useRef<[^>]+>/g, 'useRef');
  s = s.replace(/Promise<[^>]+>/g, 'Promise');

  // Remove "as const"
  s = s.replace(/\s+as\s+const/g, '');

  // Remove satisfies clauses: const x = y satisfies Type -> const x = y
  s = s.replace(/\s+satisfies\s+[A-Za-z0-9_<>\[\]\|\&\.\{\}\?\s]+/g, '');

  return s;
}

async function convertFile(file) {
  const ext = path.extname(file);
  if (!extsMap.has(ext)) return;

  const nextExt = extsMap.get(ext);
  const src = await readFile(file, 'utf8');
  const out = stripTypes(src);

  const newPath = file.slice(0, -ext.length) + nextExt;
  await writeFile(newPath, out, 'utf8');
  await rename(file, file + '.bak.ts-removed'); // keep a backup to avoid data loss on iOS workflow
  return { from: file, to: newPath };
}

async function run() {
  // Remove tsconfig / next-env if they exist (Next will work with JS only)
  for (const f of ['tsconfig.json', 'next-env.d.ts']) {
    try {
      await rename(path.join(ROOT, f), path.join(ROOT, f + '.bak_disabled'));
      console.log('[convert-to-js] disabled', f);
    } catch {}
  }

  const files = await walk(ROOT);
  const targets = files.filter(f => ['.ts', '.tsx'].includes(path.extname(f)));
  const results = [];
  for (const f of targets) {
    try {
      const r = await convertFile(f);
      if (r) results.push(r);
    } catch (e) {
      console.warn('[convert-to-js] failed on', f, e.message);
    }
  }
  console.log('[convert-to-js] converted', results.length, 'files');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
