import { readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MOD = path.join(ROOT, 'modules');
const WIDGETS = path.join(MOD, 'widgets');
const CONNECTORS = path.join(MOD, 'connectors');
const OUT = path.join('lib', 'modules', 'registry.generated.ts');

async function ensure(p){ try { await mkdir(p, { recursive: true }); } catch {} }
async function exists(p){ try { await stat(p); return true; } catch { return false; } }

async function collect(dir){
  const out = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries){
      if (e.isDirectory()){
        const d = path.join(dir, e.name);
        const has = (await exists(path.join(d,'index.ts'))) ||
                    (await exists(path.join(d,'index.tsx'))) ||
                    (await exists(path.join(d,'index.js')));
        if (has) out.push({ key: e.name, rel: path.posix.join(path.relative('lib/modules', d).replace(/\\/g,'/')) });
      } else if (e.isFile() && /\.(t|j)sx?$/.test(e.name)){
        const base = e.name.replace(/\.(t|j)sx?$/, '');
        if (base === 'index') continue;
        out.push({ key: base, rel: path.posix.join(path.relative('lib/modules', path.join(dir, base)).replace(/\\/g,'/')) });
      }
    }
  } catch {}
  const seen = new Set();
  return out.filter(i=>!seen.has(i.key) && seen.add(i.key)).sort((a,b)=>a.key.localeCompare(b.key));
}

await ensure(MOD); await ensure(WIDGETS); await ensure(CONNECTORS);
const widgets = await collect(WIDGETS);
const connectors = await collect(CONNECTORS);

const content = `// AUTO-GENERATED. Do not edit by hand.
export const widgetRegistry = {
${widgets.map(m => `  "${m.key}": () => import("${m.rel.startsWith('.')?m.rel:('./'+m.rel)}")`).join(',\n')}
} as const;

export const connectorRegistry = {
${connectors.map(m => `  "${m.key}": () => import("${m.rel.startsWith('.')?m.rel:('./'+m.rel)}")`).join(',\n')}
} as const;

export type WidgetKey = keyof typeof widgetRegistry;
export type ConnectorKey = keyof typeof connectorRegistry;
`;

await writeFile(path.join(ROOT, OUT), content, 'utf8');
console.log('Generated', OUT, 'with', (widgets?.length ?? 0), 'widgets and', (connectors?.length ?? 0), 'connectors');
