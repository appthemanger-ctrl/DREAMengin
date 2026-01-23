import { readdir, stat, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MOD = path.join(ROOT, 'modules');
const W = path.join(MOD, 'widgets');
const C = path.join(MOD, 'connectors');
const OUT = path.join(MOD, 'registry.generated.js');

async function list(dir) {
  let items = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        const dirPath = path.join(dir, e.name);
        for (const f of ['index.js']) {
          const p = path.join(dirPath, f);
          if (await stat(p).then(()=>true).catch(()=>false)) {
            items.push(e.name);
            break;
          }
        }
      } else if (e.isFile() && e.name.endsWith('.js')) {
        const base = e.name.replace(/\.js$/, '');
        if (base !== 'index') items.push(base);
      }
    }
  } catch {}
  items = Array.from(new Set(items)).sort();
  return items;
}

const widgets = await list(W);
const connectors = await list(C);

const widgetLines = widgets.map(k => `  "${k}": () => import("./widgets/${k}")`).join(',\n');
const connectorLines = connectors.map(k => `  "${k}": () => import("./connectors/${k}")`).join(',\n');

const content = `// AUTO-GENERATED. Do not edit by hand.
export const widgetRegistry = {
${widgetLines}
} as const;

export const connectorRegistry = {
${connectorLines}
} as const;

export const widgetModules = Object.entries(widgetRegistry).map(([slug, loader]) => ({ slug, name: slug, loader }));
export const connectorModules = Object.entries(connectorRegistry).map(([slug, loader]) => ({ slug, name: slug, loader }));
`;

await writeFile(OUT, content, 'utf8');
console.log('Generated', path.relative(ROOT, OUT), 'with', (widgets?.length ?? 0), 'widgets and', (connectors?.length ?? 0), 'connectors');

// ensure dynamic flags on pages that were failing export in past builds
const dynamicTargets = [
  'app/page.js',
  'app/home/page.js',
  'app/login/page.js',
  'app/ads/page.js',
  'app/connectors/page.js',
  'app/music/page.js',
  'app/shop/page.js',
  'app/shop/me/page.js'
];

for (const rel of dynamicTargets) {
  const p = path.join(ROOT, rel);
  try {
    const src = await readFile(p, 'utf8');
    if (!/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/.test(src)) {
      const updated = `export const dynamic = 'force-dynamic';\n\n` + src;
      await writeFile(p, updated, 'utf8');
      console.log('[prebuild] added dynamic flag ->', rel);
    }
  } catch {}
}
