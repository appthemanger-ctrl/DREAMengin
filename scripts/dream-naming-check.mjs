#!/usr/bin/env node
/**
 * dream-naming-check.mjs
 *
 * Validates source files and import paths against the DREAMengin naming spec.
 * Source of truth: config/namespaces.json
 *
 * Usage:
 *   node scripts/dream-naming-check.mjs               # report only
 *   node scripts/dream-naming-check.mjs --strict      # exit 1 on violations (CI)
 *   node scripts/dream-naming-check.mjs --verbose     # show passing files too
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join, relative, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Bootstrap ───────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const VERBOSE = args.includes('--verbose');

// ─── Load namespace config ────────────────────────────────────────────────────

const namespacesPath = join(ROOT, 'config', 'namespaces.json');
if (!existsSync(namespacesPath)) {
  console.error(`✗ Missing config/namespaces.json (expected at ${namespacesPath})`);
  process.exit(1);
}
const { namespaces } = JSON.parse(readFileSync(namespacesPath, 'utf8'));

// Pre-build regex patterns per namespace
// engin.[engine].ts  dreamsurface.[engine].tsx  dream.[name].tsx
const PATTERNS = [
  { prefix: 'engin',        ext: '.ts',  label: 'Engine Logic' },
  { prefix: 'dreamsurface', ext: '.tsx', label: 'Surface Container' },
  { prefix: 'dream',        ext: '.tsx', label: 'Interactive Component' },
];

// Regex: <prefix>.<name><ext>  — all lowercase, no extra dots in <name> required
const patternRegexes = PATTERNS.map(({ prefix, ext }) => {
  const escapedExt = ext.replace('.', '\\.');
  return new RegExp(`^${prefix}\\.[a-z0-9]+${escapedExt}$`);
});

/** Returns the matching pattern index for a bare filename, or -1 */
function matchesSpec(filename) {
  for (let i = 0; i < patternRegexes.length; i++) {
    if (patternRegexes[i].test(filename)) return i;
  }
  return -1;
}

// ─── Collect source files ─────────────────────────────────────────────────────

const SCAN_DIRS = ['components', 'lib', 'app', 'engins', 'games', 'coresurfaces', 'src'];

/** Recursively collect .ts / .tsx files */
function collectFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      results.push(...collectFiles(full));
    } else if (/\.(tsx?|jsx?)$/.test(entry) && !entry.endsWith('.d.ts')) {
      results.push(full);
    }
  }
  return results;
}

// Also grab flat-root TS/TSX files (skip config files)
function collectRootFiles() {
  return readdirSync(ROOT)
    .filter(f => /\.(tsx?|jsx?)$/.test(f) && !f.endsWith('.d.ts') && statSync(join(ROOT, f)).isFile())
    .map(f => join(ROOT, f));
}

const allFiles = [
  ...collectRootFiles(),
  ...SCAN_DIRS.flatMap(d => collectFiles(join(ROOT, d))),
];

// ─── Validation ───────────────────────────────────────────────────────────────

const violations = [];
const ok = [];

// 1. File-name validation — only check files that LOOK LIKE they are trying to
//    follow the spec (i.e. start with one of the three prefixes).
//    Other files (legacy subdirectory files) are silently skipped unless --verbose.
for (const filePath of allFiles) {
  const rel = relative(ROOT, filePath);
  const name = basename(filePath);
  const startsWithPrefix = PATTERNS.some(({ prefix }) => name.startsWith(prefix + '.'));

  if (!startsWithPrefix) {
    if (VERBOSE) console.log(`  skip  ${rel}  (not a spec-prefixed file)`);
    continue;
  }

  const idx = matchesSpec(name);
  if (idx === -1) {
    // Has a spec prefix but the full name / extension is wrong
    violations.push({
      kind: 'bad-filename',
      file: rel,
      message: `"${name}" has a spec prefix but does not match any valid pattern (engin.<name>.ts | dreamsurface.<name>.tsx | dream.<name>.tsx)`,
    });
  } else {
    ok.push({ file: rel, pattern: PATTERNS[idx].label });
  }
}

// 2. Import path validation — any import of @/engin.* | @/dreamsurface.* | @/dream.*
//    must resolve to a real file in the repo root.
const specImportRe = /from\s+['"](@\/(engin|dreamsurface|dream)\.[a-z0-9]+)['"]/g;

for (const filePath of allFiles) {
  const rel = relative(ROOT, filePath);
  const source = readFileSync(filePath, 'utf8');
  let m;
  while ((m = specImportRe.exec(source)) !== null) {
    const importPath = m[1]; // e.g. @/engin.gameengin
    const bareName = importPath.slice(2); // e.g. engin.gameengin
    // Try resolving with each possible extension
    const candidates = [
      join(ROOT, bareName + '.ts'),
      join(ROOT, bareName + '.tsx'),
      join(ROOT, bareName + '.js'),
    ];
    const resolved = candidates.find(c => existsSync(c));
    if (!resolved) {
      violations.push({
        kind: 'unresolved-import',
        file: rel,
        message: `Import "${importPath}" does not resolve to any file in the repo root`,
      });
    }
  }
}

// 3. Export convention — for spec-named files, check they have a default export
//    and that the exported name starts with "Dream".
const defaultExportRe = /export\s+default\s+(\w+)/;
const classOrFunctionDefaultRe = /export\s+default\s+(?:class|function)\s+(\w+)/;
const dreamPrefixRe = /^Dream/;

for (const { file } of ok) {
  const filePath = join(ROOT, file);
  const source = readFileSync(filePath, 'utf8');

  const hasDefault =
    defaultExportRe.test(source) ||
    /export\s+default\s+/.test(source);

  if (!hasDefault) {
    violations.push({
      kind: 'missing-default-export',
      file,
      message: `Spec-named file has no default export`,
    });
    continue;
  }

  // Check the exported name starts with Dream
  const nameMatch =
    source.match(classOrFunctionDefaultRe) ||
    source.match(defaultExportRe);
  if (nameMatch) {
    const exportedName = nameMatch[1];
    if (!dreamPrefixRe.test(exportedName)) {
      violations.push({
        kind: 'bad-export-name',
        file,
        message: `Default export "${exportedName}" does not start with "Dream"`,
      });
    }
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

console.log('\n─── DREAMengin Naming Convention Check ───────────────────────────\n');

if (VERBOSE) {
  for (const { file, pattern } of ok) {
    console.log(`  ✓  ${file}  (${pattern})`);
  }
}

if (violations.length === 0) {
  console.log(`  ✓  All ${ok.length} spec-prefixed file(s) conform to the naming convention.\n`);
  process.exit(0);
}

console.log(`  Found ${violations.length} violation(s):\n`);
for (const v of violations) {
  console.log(`  ✗  [${v.kind}]  ${v.file}`);
  console.log(`        ${v.message}\n`);
}

if (STRICT) {
  console.log('  Exiting with code 1 (--strict mode)\n');
  process.exit(1);
}
