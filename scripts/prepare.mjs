  // scripts/prepare.mjs
  // Generates modules/registry.generated.js (PLAIN JS, no TS syntax).
  import { readdir, stat, mkdir, writeFile } from 'node:fs/promises';
  import path from 'node:path';
  import { fileURLToPath } from 'node:url';

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const ROOT = path.join(__dirname, '..');
  const MOD_DIR = path.join(ROOT, 'modules');
  const WIDGET_DIR = path.join(MOD_DIR, 'widgets');
  const CONNECT_DIR = path.join(MOD_DIR, 'connectors');
  const OUT = path.join(MOD_DIR, 'registry.generated.js');

  async function ensureDir(p){ try{ await mkdir(p, { recursive: true }); } catch{} }
  async function exists(p){ try{ await stat(p); return true; } catch{ return false; } }

  async function list(dir){
    const items = [];
    try{
      const entries = await readdir(dir, { withFileTypes: true });
      for (const e of entries){
        if (e.isDirectory()){
          const slug = e.name;
          const base = path.join(dir, slug);
          const hasIndex = (
            await exists(path.join(base, 'index.js')) ||
            await exists(path.join(base, 'index.ts')) ||
            await exists(path.join(base, 'index.tsx'))
          );
          if (hasIndex){
            const rel = path.posix.join(path.relative(MOD_DIR, base).replace(/\\/g,'/'));
            items.push({ slug, rel });
          }
          continue;
        }
        if (e.isFile() && /(index|[\w-]+)\.(t|j)sx?$/.test(e.name)){
          const slug = e.name.replace(/\.(t|j)sx?$/, '');
          if (slug === 'index') continue;
          const rel = path.posix.join(path.relative(MOD_DIR, path.join(dir, slug)).replace(/\\/g,'/'));
          items.push({ slug, rel });
        }
      }
    } catch {}
    // de-dupe & sort
    const seen = new Set();
    return items
      .filter(i => !seen.has(i.slug) && seen.add(i.slug))
      .sort((a,b)=>a.slug.localeCompare(b.slug));
  }

  await ensureDir(MOD_DIR);
  await ensureDir(WIDGET_DIR);
  await ensureDir(CONNECT_DIR);

  const widgets = await list(WIDGET_DIR);
  const connectors = await list(CONNECT_DIR);

  const file = `// AUTO-GENERATED. Do not edit by hand. Plain JavaScript.
export const widgetRegistry = {
${widgets.map(i => `  "${i.slug}": () => import("./${i.rel}")`).join(',\n')}
};

export const connectorRegistry = {
${connectors.map(i => `  "${i.slug}": () => import("./${i.rel}")`).join(',\n')}
};

// Convenience arrays for discovery
export const widgetModules = Object.entries(widgetRegistry).map(([slug, loader]) => ({ slug, name: slug, loader }));
export const connectorModules = Object.entries(connectorRegistry).map(([slug, loader]) => ({ slug, name: slug, loader }));
`;

  await writeFile(OUT, file, 'utf8');
  console.log('Generated', path.relative(ROOT, OUT), 'with', widgets.length, 'widgets and', connectors.length, 'connectors');
