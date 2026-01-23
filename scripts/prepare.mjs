// scripts/prepare.mjs
import { readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MOD = path.join(ROOT, 'modules');
const WIDGETS = path.join(MOD, 'widgets');
const CONNECTORS = path.join(MOD, 'connectors');
const OUT = path.join(MOD, 'registry.generated.js');

async function ensureDir(p) { try { await mkdir(p, { recursive: true }); } catch {} }
async function exists(p) { try { await stat(p); return true; } catch { return false; } }

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
            rel: path.posix.join(path.relative(MOD, baseDir).replace(/\\/g, '/')),
          });
        }
      } else if (e.isFile() && /\.(t|j)sx?$/.test(e.name)) {
        const base = e.name.replace(/\.(t|j)sx?$/, '');
        if (base !== 'index') {
          items.push({
            key: base,
            rel: path.posix.join(path.relative(MOD, path.join(dir, base)).replace(/\\/g, '/')),
          });
        }
      }
    }
  } catch {}
  // de-dupe + sort
  const seen = new Set();
  return items
    .filter(i => !seen.has(i.key) && seen.add(i.key))
    .sort((a, b) => a.key.localeCompare(b.key));
}

await ensureDir(MOD);
await ensureDir(WIDGETS);
await ensureDir(CONNECTORS);

const widgets = await collect(WIDGETS);
const connectors = await collect(CONNECTORS);

const content = `// AUTO-GENERATED (plain JS). Do not edit by hand.
export const widgetRegistry = {
${widgets.map(i => `  "${i.key}": () => import("./${'${i.rel}'}")`).join(',\n')}
};

export const connectorRegistry = {
${connectors.map(i => `  "${i.key}": () => import("./${'${i.rel}'}")`).join(',\n')}
};

// Friendly arrays some pages expect
export const widgetModules = Object.entries(widgetRegistry).map(([slug, loader]) => ({ slug, name: slug, loader }));
export const connectorModules = Object.entries(connectorRegistry).map(([slug, loader]) => ({ slug, name: slug, loader }));
`;

await writeFile(OUT, content, 'utf8');

console.log(
  'Generated',
  path.relative(ROOT, OUT),
  'with',
  widgets.length,
  'widgets and',
  connectors.length,
  'connectors'
);
