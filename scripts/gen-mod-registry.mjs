
// scripts/gen-mod-registry.mjs
import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const WIDGET_DIR = path.join(ROOT, 'modules', 'widgets');
const CONNECT_DIR = path.join(ROOT, 'modules', 'connectors');
const OUT = path.join(ROOT, 'modules', 'registry.generated.ts');

async function listModules(dir) {
  try {
    const files = await readdir(dir, { withFileTypes: true });
    return files
      .filter(f => f.isDirectory() || /\.(t|j)sx?$/.test(f.name))
      .map(f => {
        const base = f.isDirectory() ? f.name : f.name.replace(/\.(t|j)sx?$/, '');
        // registry imports must be relative to modules/
        return {
          key: base,
          relPath: path.relative(path.join(ROOT, 'modules'), path.join(dir, base)).replace(/\\/g, '/')
        };
      });
  } catch {
    return [];
  }
}

const widgets = await listModules(WIDGET_DIR);
const connectors = await listModules(CONNECT_DIR);

const file = `// AUTO-GENERATED. Do not edit by hand.
export const widgetRegistry = {
${widgets.map(m => `  "${m.key}": () => import("./${m.relPath}")`).join(',\n')}
} as const;

export const connectorRegistry = {
${connectors.map(m => `  "${m.key}": () => import("./${m.relPath}")`).join(',\n')}
} as const;

export type WidgetKey = keyof typeof widgetRegistry;
export type ConnectorKey = keyof typeof connectorRegistry;
`;

await writeFile(OUT, file, 'utf8');
console.log('Generated', OUT, 'with', widgets.length, 'widgets and', connectors.length, 'connectors');
