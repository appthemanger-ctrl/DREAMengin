#!/usr/bin/env node
/**
 * sync-build-memory.mjs
 *
 * Scans the DREAMengin repo and writes five machine-readable JSON files
 * to /build-memory/:
 *
 *   actions.json    — server actions (files with "use server")
 *   routes.json     — app/api route.ts endpoints with HTTP methods
 *   schema.json     — Supabase table names + columns from types/supabase.ts
 *   events.json     — CustomEvent / dispatchEvent names & payload types
 *   ui-surfaces.json— major page/layout components and their owning files
 *
 * Run:
 *   node scripts/sync-build-memory.mjs
 *
 * CI auto-runs this via .github/workflows/sync-build-memory.yml
 */

import fs   from 'node:fs';
import path from 'node:path';

const ROOT  = path.resolve(process.cwd());
const OUT   = path.join(ROOT, 'build-memory');
const META  = { generated_at: new Date().toISOString(), generator: 'scripts/sync-build-memory.mjs' };

fs.mkdirSync(OUT, { recursive: true });

// ─── helpers ─────────────────────────────────────────────────────────────────

function walk(dir, ext = ['.ts', '.tsx']) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, ext));
    } else if (ext.some(e => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

function rel(p) { return path.relative(ROOT, p); }

function readFile(p) {
  try { return fs.readFileSync(p, 'utf8'); }
  catch { return ''; }
}

function write(name, data) {
  const file = path.join(OUT, name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log(`  ✓ build-memory/${name}`);
}

// ─── 1. actions.json — "use server" files + API route handlers ───────────────

function scanActions() {
  const files = walk(ROOT);
  const actions = [];

  for (const f of files) {
    const src = readFile(f);
    const hasUseServer = src.includes('"use server"') || src.includes("'use server'");
    const isApiRoute   = /app[/\\]api[/\\].*route\.ts$/.test(f);

    if (!hasUseServer && !isApiRoute) continue;

    const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

    // Collect all exported function names
    const fnMatches = [...src.matchAll(/export\s+(?:async\s+)?function\s+(\w+)\s*\(/g)];
    let fns = fnMatches.map(m => m[1]);

    // Collect named exports via export { ... }
    const namedMatches = [...src.matchAll(/export\s*\{([^}]+)\}/g)];
    for (const m of namedMatches) {
      m[1].split(',').forEach(n => {
        const trimmed = n.trim().split(/\s+as\s+/)[0].trim();
        if (trimmed && !fns.includes(trimmed)) fns.push(trimmed);
      });
    }

    // Collect const exports: export const GET = ...
    const constMatches = [...src.matchAll(/export\s+const\s+(\w+)\s*=/g)];
    for (const m of constMatches) {
      if (!fns.includes(m[1])) fns.push(m[1]);
    }

    const httpHandlers = fns.filter(n => HTTP_METHODS.includes(n));
    const serverFns    = fns.filter(n => !HTTP_METHODS.includes(n) &&
                                         n !== 'config' && n !== 'runtime');

    actions.push({
      file: rel(f),
      type: hasUseServer ? 'server-action' : 'api-route-handler',
      http_handlers: isApiRoute ? httpHandlers : undefined,
      exports: hasUseServer ? fns : serverFns,
    });
  }

  return { ...META, count: actions.length, actions };
}

// ─── 2. routes.json — app/api route.ts files ─────────────────────────────────

function scanRoutes() {
  const apiDir = path.join(ROOT, 'app', 'api');
  const files = walk(apiDir).filter(f => f.endsWith('route.ts'));
  const routes = [];

  const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  for (const f of files) {
    const src = readFile(f);
    const methods = HTTP_METHODS.filter(m =>
      new RegExp(`export\\s+(?:async\\s+)?function\\s+${m}\\b`).test(src) ||
      new RegExp(`export\\s+const\\s+${m}\\s*=`).test(src)
    );

    // Derive URL path from filesystem
    const relPath = rel(f);
    const urlPath = relPath
      .replace(/^app/, '')
      .replace(/\/route\.ts$/, '')
      .replace(/\\/g, '/') || '/';

    routes.push({ path: urlPath, file: relPath, methods });
  }

  routes.sort((a, b) => a.path.localeCompare(b.path));
  return { ...META, count: routes.length, routes };
}

// ─── 3. schema.json — tables from types/supabase.ts + migrations ─────────────

function scanSchema() {
  const supabaseTypes = path.join(ROOT, 'types', 'supabase.ts');
  const src = readFile(supabaseTypes);
  const tables = [];
  const tableNames = new Set();

  // ── A. Parse types/supabase.ts (public.Tables block) ──────────────────────
  if (!src) {
    console.warn('  ⚠  types/supabase.ts not found — will use migrations only');
  } else {
    const lines = src.split('\n');
    let inTables = false;
    let tableDepth = 0;
    let currentTable = null;
    let inRow = false;
    let rowDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!inTables) {
        if (/^\s*Tables:\s*\{/.test(line)) { inTables = true; tableDepth = 1; }
        continue;
      }

      const opens  = (line.match(/\{/g) || []).length;
      const closes = (line.match(/\}/g) || []).length;

      if (tableDepth === 1 && !inRow) {
        const tableMatch = trimmed.match(/^([a-z][a-z0-9_]*):\s*\{/);
        if (tableMatch) {
          currentTable = { table: tableMatch[1], columns: [], source: 'types/supabase.ts' };
          tableNames.add(tableMatch[1]);
          tableDepth += opens - closes;
          continue;
        }
      }

      if (currentTable && !inRow && /^\s*Row:\s*\{/.test(line)) {
        inRow = true;
        rowDepth = 1;
        tableDepth += opens - closes;
        continue;
      }

      if (inRow) {
        rowDepth += opens - closes;
        if (rowDepth <= 0) { inRow = false; tableDepth += opens - closes; continue; }
        const colMatch = trimmed.match(/^([a-zA-Z_]\w*):\s*(.+)$/);
        if (colMatch && rowDepth === 1) {
          currentTable.columns.push({
            name: colMatch[1],
            type: colMatch[2].replace(/,?\s*$/, '').trim(),
          });
        }
        continue;
      }

      tableDepth += opens - closes;
      if (tableDepth === 1 && currentTable) {
        if (currentTable.columns.length > 0) tables.push(currentTable);
        currentTable = null;
      }
      if (tableDepth <= 0) break;
    }
  }

  // ── B. Supplement from migration SQL files ─────────────────────────────────
  const migrationsDir = path.join(ROOT, 'supabase', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const sqlFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .map(f => path.join(migrationsDir, f));

    for (const sqlFile of sqlFiles) {
      const sqlSrc = readFile(sqlFile);
      // CREATE TABLE [IF NOT EXISTS] [public.]table_name (
      const createRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-z][a-z0-9_]*)\s*\(/gi;
      let m;
      while ((m = createRe.exec(sqlSrc)) !== null) {
        const tbl = m[1].toLowerCase();
        if (tableNames.has(tbl) || ['is', 'if'].includes(tbl)) continue;
        tableNames.add(tbl);

        // Extract column definitions from CREATE TABLE block
        const start  = m.index + m[0].length;
        let depth2   = 1, pos = start;
        let blockEnd = start;
        while (pos < sqlSrc.length && depth2 > 0) {
          if (sqlSrc[pos] === '(') depth2++;
          else if (sqlSrc[pos] === ')') { depth2--; if (depth2 === 0) { blockEnd = pos; break; } }
          pos++;
        }
        const block = sqlSrc.slice(start, blockEnd);
        const columns = [];
        for (const colLine of block.split('\n')) {
          const ct = colLine.trim();
          if (!ct || ct.startsWith('--') || ct.toUpperCase().startsWith('CONSTRAINT') ||
              ct.toUpperCase().startsWith('PRIMARY KEY') || ct.toUpperCase().startsWith('UNIQUE') ||
              ct.toUpperCase().startsWith('FOREIGN KEY') || ct.toUpperCase().startsWith('CHECK')) continue;
          const colMatch = ct.match(/^([a-z][a-z0-9_]*)\s+([A-Z][A-Z0-9 _()]*)/i);
          if (colMatch) {
            columns.push({ name: colMatch[1], type: colMatch[2].trim().replace(/,\s*$/, '') });
          }
        }
        tables.push({ table: tbl, columns, source: path.basename(sqlFile) });
      }
    }
  }

  // ── C. Supplement with code-only tables (queried in source but not in DB files) ─
  const allFiles = walk(ROOT);
  for (const f of allFiles) {
    const codeSrc = readFile(f);
    const tableRefs = [...codeSrc.matchAll(/\.from\(['"`]([a-z][a-z0-9_]*)['"`]\)/g)];
    for (const m of tableRefs) {
      const tbl = m[1];
      if (tableNames.has(tbl) || ['is', 'if'].includes(tbl)) continue;
      tableNames.add(tbl);
      tables.push({ table: tbl, columns: [], source: 'code-only', note: 'Referenced in code but not found in types/supabase.ts or migrations — may indicate missing migration' });
    }
  }

  tables.sort((a, b) => a.table.localeCompare(b.table));
  return { ...META, sources: ['types/supabase.ts', 'supabase/migrations/'], count: tables.length, tables };
}

// ─── 4. events.json — CustomEvent names & payload types ──────────────────────

function scanEvents() {
  const files = walk(ROOT);
  const seen = new Map();

  for (const f of files) {
    const src = readFile(f);

    // window.dispatchEvent(new CustomEvent('name', ...)) or new CustomEvent("name")
    const re1 = /new\s+CustomEvent[<(]\s*[^,)>]*?\s*[>)]?\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let m;
    while ((m = re1.exec(src)) !== null) {
      const name = m[1];
      if (!seen.has(name)) {
        // Try to find the payload type via TypeScript generic CustomEvent<SomeType>
        const typeMatch = src.match(new RegExp(`CustomEvent<(\\w+)>\\s*\\(\\s*['"\`]${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
        seen.set(name, { event: name, payload_type: typeMatch ? typeMatch[1] : null, files: [] });
      }
      seen.get(name).files.push(rel(f));
    }

    // window.addEventListener('name', ...) or window.addEventListener("name", ...)
    const re2 = /window\.(?:add|remove)EventListener\s*\(\s*['"`]([a-z][a-zA-Z0-9:_-]+)['"`]/g;
    while ((m = re2.exec(src)) !== null) {
      const name = m[1];
      if (name.startsWith('click') || name.startsWith('scroll') || name.startsWith('mouse') ||
          name.startsWith('key') || name.startsWith('touch') || name.startsWith('focus') ||
          name.startsWith('blur') || name.startsWith('change') || name.startsWith('input') ||
          name.startsWith('resize') || name.startsWith('load') || name === 'message') continue;
      if (!seen.has(name)) {
        seen.set(name, { event: name, payload_type: null, files: [] });
      }
      if (!seen.get(name).files.includes(rel(f))) {
        seen.get(name).files.push(rel(f));
      }
    }

    // Also scan exported EVENT_NAME constants
    const re3 = /(?:const|let)\s+EVENT_NAME\s*=\s*['"`]([^'"`]+)['"`]/g;
    while ((m = re3.exec(src)) !== null) {
      const name = m[1];
      if (!seen.has(name)) {
        seen.set(name, { event: name, payload_type: null, files: [] });
      }
      if (!seen.get(name).files.includes(rel(f))) {
        seen.get(name).files.push(rel(f));
      }
    }
  }

  // Deduplicate files per event
  const events = [...seen.values()].map(e => ({ ...e, files: [...new Set(e.files)] }));
  events.sort((a, b) => a.event.localeCompare(b.event));
  return { ...META, count: events.length, events };
}

// ─── 5. ui-surfaces.json — major UI surfaces and their owning components ──────

function scanUISurfaces() {
  const appDir    = path.join(ROOT, 'app');
  const compDir   = path.join(ROOT, 'components');
  const surfaces  = [];

  // Page surfaces from app/ directory
  const pageFiles = walk(appDir, ['.tsx']).filter(f => f.endsWith('page.tsx'));
  for (const f of pageFiles) {
    const relPath  = rel(f);
    const urlPath  = relPath.replace(/^app/, '').replace(/\/page\.tsx$/, '') || '/';
    const src      = readFile(f);

    // Find default export function name
    const fnMatch  = src.match(/export\s+default\s+(?:async\s+)?function\s+(\w+)/);
    const component = fnMatch ? fnMatch[1] : null;

    // Find major imported components
    const imports  = [...src.matchAll(/import\s+(?:\{[^}]+\}|(\w+))\s+from\s+['"`]([^'"`]+)['"`]/g)]
      .map(m => ({ name: m[1] || m[0].match(/import\s+(?:\{([^}]+)\})/)?.[1]?.trim(), from: m[2] }))
      .filter(i => i.from.startsWith('@/components') || i.from.startsWith('../') || i.from.startsWith('./'));

    surfaces.push({
      type: 'page',
      path: urlPath,
      file: relPath,
      component,
      imports: imports.slice(0, 8),
    });
  }

  // Layout surfaces
  const layoutFiles = walk(appDir, ['.tsx']).filter(f => f.endsWith('layout.tsx'));
  for (const f of layoutFiles) {
    const relPath  = rel(f);
    const src      = readFile(f);
    const fnMatch  = src.match(/export\s+default\s+(?:async\s+)?function\s+(\w+)/);
    surfaces.push({
      type: 'layout',
      path: rel(f).replace(/^app/, '').replace(/\/layout\.tsx$/, '') || '/',
      file: relPath,
      component: fnMatch ? fnMatch[1] : null,
    });
  }

  // Named major component surfaces (non-trivial components in components/)
  const OWNER_MAP = {
    DreamDMBar:       'DreamDM Bar designer',
    DreamsSpacePanel: 'DreamDM Bar designer',
    HomeDream:        'HomeDream designer',
    EditProfileDream: 'EditProfileDream designer',
    DaydreamShell:    'Landing/world designer',
    HomeSpace:        'HomeDream designer',
    HomeFeed:         'HomeDream designer',
    HomeDashboard:    'HomeDream designer',
    GameEngin:        'Landing/world designer',
  };

  const compFiles = walk(compDir, ['.tsx']);
  for (const f of compFiles) {
    const name = path.basename(f, '.tsx');
    if (!OWNER_MAP[name]) continue;
    surfaces.push({
      type: 'component',
      name,
      file: rel(f),
      owner: OWNER_MAP[name],
    });
  }

  surfaces.sort((a, b) => {
    const ap = a.path || a.name || '';
    const bp = b.path || b.name || '';
    return ap.localeCompare(bp);
  });

  return { ...META, count: surfaces.length, surfaces };
}

// ─── main ─────────────────────────────────────────────────────────────────────

console.log('🔍  Scanning repo...');
write('actions.json',    scanActions());
write('routes.json',     scanRoutes());
write('schema.json',     scanSchema());
write('events.json',     scanEvents());
write('ui-surfaces.json',scanUISurfaces());
console.log(`✅  build-memory updated (${new Date().toISOString()})`);
