// scripts/gen-mod-registry.mjs
// Combined prebuild script: (1) force-dynamic on server pages using Supabase
// and (2) generate the modules registry file.
import { readdir, writeFile, mkdir, stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MOD_DIR = path.join(ROOT, 'modules');
const WIDGET_DIR = path.join(MOD_DIR, 'widgets');
const CONNECT_DIR = path.join(MOD_DIR, 'connectors');
const OUT = path.join(MOD_DIR, 'registry.generated.ts');

async function ensureDir(p) { try { await mkdir(p, { recursive: true }); } catch {} }
async function exists(p) { try { await stat(p); return true; } catch { return false; } }

// ---------- (1) Force dynamic for pages that use Supabase on the server ----------
const targetPages = [
  ['app','ads','page.tsx'],
  ['app','connectors','page.tsx'],
  ['app','home','page.tsx'],
  ['app','music','page.tsx'],
  ['app','shop','page.tsx'],
  ['app','shop','me','page.tsx'],
  ['app','page.tsx'],
];

async function injectDynamic(filePath) {
  try {
    const src = await readFile(filePath, 'utf8');
    if (/export\s+const\s+dynamic\s*=/.test(src)) return false; // already present

    // Keep 'use client' at very top if present
    const lines = src.split(/\r?\n/);
    let startIdx = 0;
    while (startIdx < lines.length && lines[startIdx].trim() === '') startIdx++;
    if (/^["']use client["'];?$/.test(lines[startIdx]?.trim() || '')) {
      // insert after this line
      lines.splice(startIdx+1, 0, "export const dynamic = 'force-dynamic';");
    } else {
      // insert at top
      lines.unshift("export const dynamic = 'force-dynamic';");
    }
    const updated = lines.join('\n');
    await writeFile(filePath, updated, 'utf8');
    console.log('[prebuild] added dynamic flag ->', path.relative(ROOT, filePath));
    return true;
  } catch (e) {
    // ignore missing files
    return false;
  }
}

for (const parts of targetPages) {
  const p = path.join(ROOT, ...parts);
  // Only touch if file actually exists
  const ok = await exists(p);
  if (ok) await injectDynamic(p);
}

// ---------- (2) Generate modules registry ----------
async function collect(dir) {
  const items = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        const base = e.name;
        const baseDir = path.join(dir, base);
        const hasIndex =
          (await exists(path.join(baseDir, 'index.ts')))  ||
          (await exists(path.join(baseDir, 'index.tsx'))) ||
          (await exists(path.join(baseDir, 'index.js')));
        if (hasIndex) {
          items.push({
            key: base,
            rel: path.posix.join(path.relative(MOD_DIR, baseDir).replace(/\\/g, '/'))
          });
        }
      } else if (e.isFile() && /\.(t|j)sx?$/.test(e.name)) {
        const base = e.name.replace(/\.(t|j)sx?$/, '');
        if (base !== 'index') {
          items.push({
            key: base,
            rel: path.posix.join(path.relative(MOD_DIR, path.join(dir, base)).replace(/\\/g, '/'))
          });
        }
      }
    }
  } catch {
    // folder missing is fine
  }
  const seen = new Set();
  return items.filter(i => !seen.has(i.key) && seen.add(i.key)).sort((a,b)=>a.key.localeCompare(b.key));
}

await ensureDir(MOD_DIR);
await ensureDir(WIDGET_DIR);
await ensureDir(CONNECT_DIR);

const widgets = await collect(WIDGET_DIR);
const connectors = await collect(CONNECT_DIR);

const content = `// AUTO-GENERATED. Do not edit by hand.
export const widgetRegistry = {
${widgets.map(i => `  "${i.key}": () => import("./${i.rel}")`).join(',\n')}
} as const;

export const connectorRegistry = {
${connectors.map(i => `  "${i.key}": () => import("./${i.rel}")`).join(',\n')}
} as const;

export type WidgetKey = keyof typeof widgetRegistry;
export type ConnectorKey = keyof typeof connectorRegistry;
`;

await writeFile(OUT, content, 'utf8');
console.log('Generated', path.relative(ROOT, OUT), 'with', (widgets?.length ?? 0), 'widgets and', (connectors?.length ?? 0), 'connectors');
