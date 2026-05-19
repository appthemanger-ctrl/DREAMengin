#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_GRAPH = path.join(__dirname, 'graph.json');
const OUTPUT_STATS = path.join(__dirname, 'graph-stats.json');
const VISUAL_SCHEMATIC = path.join(REPO_ROOT, 'VISUAL-SCHEMATIC.md');
const AUTO_START = '<!-- VISUAL-SCHEMATIC:AUTO-GENERATED:START -->';
const AUTO_END = '<!-- VISUAL-SCHEMATIC:AUTO-GENERATED:END -->';

const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'build', '.git', 'coverage']);
const JS_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const DOC_EXTS = new Set(['.md', '.mdx', '.txt', '.rst']);
const ROOT_CONFIG_FILES = [
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'tsconfig.json',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'eslint.config.js',
  'eslint.config.mjs',
  'tailwind.config.js',
  'tailwind.config.ts',
  'postcss.config.js',
  'postcss.config.mjs',
  'vitest.config.ts',
  'playwright.config.ts',
  'vercel.json',
  'middleware.ts',
  'middleware.js',
];

function toPosix(relPath) {
  return relPath.split(path.sep).join('/');
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function getTrackedFiles(rootDir) {
  try {
    const out = execSync('git ls-files -co --exclude-standard', { cwd: rootDir, encoding: 'utf8' });
    return out
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((rel) => toPosix(rel))
      .filter((rel) => !rel.split('/').some((part) => SKIP_DIRS.has(part)));
  } catch {
    const result = [];
    const walk = (dirRel = '') => {
      const abs = path.join(rootDir, dirRel);
      for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const rel = dirRel ? `${dirRel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) walk(rel);
        else result.push(toPosix(rel));
      }
    };
    walk();
    return result;
  }
}

function getFileType(relPath) {
  const base = path.basename(relPath);
  const ext = path.extname(relPath).toLowerCase();
  const isRoute = /^app\/.+\/(page|layout)\.(ts|tsx|js|jsx)$/.test(relPath)
    || /^app\/.+\/route\.(ts|js)$/.test(relPath)
    || /^app\/(page|layout)\.(ts|tsx|js|jsx)$/.test(relPath)
    || /^app\/route\.(ts|js)$/.test(relPath);
  if (isRoute) return 'route';
  if (DOC_EXTS.has(ext)) return 'doc';
  if (ext === '.sql') return 'sql';
  if (ext === '.py') return 'python';
  if (ext === '.css' || ext === '.scss' || ext === '.sass' || ext === '.less') return 'css';
  if (JS_EXTS.has(ext)) return ext.slice(1);
  if (base === 'Dockerfile' || base.startsWith('Dockerfile.')) return 'config';
  if (ext === '.json' || ext === '.yml' || ext === '.yaml' || ext === '.toml' || ext === '.ini') return 'config';
  return 'file';
}

function lineOfIndex(text, index) {
  return text.slice(0, index).split('\n').length;
}

function ensureFolderNodes(nodes, folders, relPath) {
  const folderPath = path.dirname(relPath);
  if (folderPath === '.' || folderPath === '') return 'folder:.';
  const parts = folderPath.split('/');
  let current = '';
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    const id = `folder:${current}`;
    if (!folders.has(id)) {
      const parentPath = path.dirname(current);
      nodes.push({
        id,
        label: part,
        type: 'folder',
        path: current,
        parent: parentPath === '.' ? 'folder:.' : `folder:${parentPath}`,
        loc: null,
        isOrphan: false,
      });
      folders.add(id);
    }
  }
  return `folder:${folderPath}`;
}

function createRootFolder(nodes, folders) {
  if (folders.has('folder:.')) return;
  nodes.push({
    id: 'folder:.',
    label: 'repo',
    type: 'folder',
    path: '.',
    parent: null,
    loc: null,
    isOrphan: false,
  });
  folders.add('folder:.');
}

function normalizeExportName(raw) {
  return raw?.replace(/^default\s+/, '').trim();
}

function resolveImport(sourceFileRel, spec, allFilesSet) {
  if (!spec) return null;
  const sourceDir = path.dirname(sourceFileRel);
  const candidates = [];
  if (spec.startsWith('./') || spec.startsWith('../')) {
    const base = toPosix(path.normalize(path.join(sourceDir, spec)));
    candidates.push(base);
  } else if (spec.startsWith('@/')) {
    candidates.push(spec.slice(2));
  } else if (spec.startsWith('/')) {
    candidates.push(spec.slice(1));
  } else {
    return null;
  }

  const exts = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.scss', '.sass', '.less', '.sql', '.py', '.md'];
  for (const base of candidates) {
    for (const ext of exts) {
      const candidate = `${base}${ext}`;
      if (allFilesSet.has(candidate)) return candidate;
    }
    for (const ext of exts.slice(1)) {
      const idx = `${base}/index${ext}`;
      if (allFilesSet.has(idx)) return idx;
    }
  }
  return null;
}

function topLevelRanges(content) {
  const ranges = [];
  let depth = 0;
  let start = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escaped = false;
  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];
    const prev = content[i - 1];
    if (inSingle || inDouble || inTemplate) {
      if (!escaped && ((inSingle && ch === '\'') || (inDouble && ch === '"') || (inTemplate && ch === '`'))) {
        inSingle = inDouble = inTemplate = false;
      }
      escaped = !escaped && ch === '\\';
      continue;
    }
    if (ch === '\'') { inSingle = true; continue; }
    if (ch === '"') { inDouble = true; continue; }
    if (ch === '`') { inTemplate = true; continue; }
    if (ch === '/' && content[i + 1] === '/') {
      while (i < content.length && content[i] !== '\n') i += 1;
      continue;
    }
    if (ch === '/' && content[i + 1] === '*') {
      i += 2;
      while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) i += 1;
      i += 1;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') depth = Math.max(0, depth - 1);
    if (depth === 0 && ch === '\n') {
      ranges.push([start, i]);
      start = i + 1;
    }
    if (prev === '\n' && depth === 0) start = Math.min(start, i);
  }
  if (start < content.length) ranges.push([start, content.length]);
  return ranges;
}

function extractJSImportData(relPath, content, allFilesSet) {
  const imports = [];
  const exports = [];
  const functions = [];
  const classes = [];
  const callRefs = [];
  const reexports = [];

  const importSymbolToFile = new Map();

  const importFromRegex = /^\s*import\s+([\s\S]*?)\s+from\s+['"]([^'"\n]+)['"];?/gm;
  for (const match of content.matchAll(importFromRegex)) {
    const clause = match[1]?.trim() || '';
    const spec = match[2]?.trim();
    const resolved = resolveImport(relPath, spec, allFilesSet);
    imports.push({ spec, resolved, dynamic: false });
    if (resolved) {
      if (clause.startsWith('{')) {
        const names = clause
          .replace(/[{}]/g, '')
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean);
        for (const name of names) {
          const [imported, alias] = name.split(/\s+as\s+/i).map((v) => v.trim());
          if (alias) importSymbolToFile.set(alias, { file: resolved, symbol: imported });
          else importSymbolToFile.set(imported, { file: resolved, symbol: imported });
        }
      } else if (clause.includes('{')) {
        const [defaultPart, namedPartRaw] = clause.split('{');
        const defaultName = defaultPart.replace(',', '').trim();
        if (defaultName) importSymbolToFile.set(defaultName, { file: resolved, symbol: 'default' });
        const namedPart = namedPartRaw?.replace('}', '') || '';
        const names = namedPart.split(',').map((part) => part.trim()).filter(Boolean);
        for (const name of names) {
          const [imported, alias] = name.split(/\s+as\s+/i).map((v) => v.trim());
          importSymbolToFile.set(alias || imported, { file: resolved, symbol: imported });
        }
      } else if (clause.startsWith('* as ')) {
        const ns = clause.replace('* as ', '').trim();
        if (ns) importSymbolToFile.set(ns, { file: resolved, symbol: '*' });
      } else if (clause) {
        importSymbolToFile.set(clause.replace(',', '').trim(), { file: resolved, symbol: 'default' });
      }
    }
  }

  const sideEffectImportRegex = /^\s*import\s+['"]([^'"\n]+)['"];?/gm;
  for (const match of content.matchAll(sideEffectImportRegex)) {
    const spec = match[1]?.trim();
    const resolved = resolveImport(relPath, spec, allFilesSet);
    imports.push({ spec, resolved, dynamic: false });
  }

  const dynamicImportRegex = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const match of content.matchAll(dynamicImportRegex)) {
    const spec = match[1]?.trim();
    const resolved = resolveImport(relPath, spec, allFilesSet);
    imports.push({ spec, resolved, dynamic: true });
  }

  const requireRegex = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const match of content.matchAll(requireRegex)) {
    const sym = match[1];
    const spec = match[2]?.trim();
    const resolved = resolveImport(relPath, spec, allFilesSet);
    imports.push({ spec, resolved, dynamic: false });
    if (resolved) importSymbolToFile.set(sym, { file: resolved, symbol: 'default' });
  }

  const reexportRegex = /^\s*export\s+(?:\*|\{[^}]+\})\s+from\s+['"]([^'"]+)['"];?/gm;
  for (const match of content.matchAll(reexportRegex)) {
    const spec = match[1]?.trim();
    const resolved = resolveImport(relPath, spec, allFilesSet);
    if (resolved) reexports.push({ resolved });
  }

  for (const [start, end] of topLevelRanges(content)) {
    const chunk = content.slice(start, end);
    let m;
    m = chunk.match(/^\s*export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/);
    if (m) {
      const name = normalizeExportName(m[1]);
      functions.push({ name, exported: true, loc: lineOfIndex(content, start + (m.index || 0)) });
      exports.push({ kind: 'function', name });
      continue;
    }
    m = chunk.match(/^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/);
    if (m) {
      const name = m[1];
      functions.push({ name, exported: false, loc: lineOfIndex(content, start + (m.index || 0)) });
      continue;
    }
    m = chunk.match(/^\s*export\s+(?:default\s+)?class\s+([A-Za-z_$][\w$]*)/);
    if (m) {
      const name = normalizeExportName(m[1]);
      classes.push({ name, exported: true, loc: lineOfIndex(content, start + (m.index || 0)) });
      exports.push({ kind: 'class', name });
      continue;
    }
    m = chunk.match(/^\s*class\s+([A-Za-z_$][\w$]*)/);
    if (m) {
      const name = m[1];
      classes.push({ name, exported: false, loc: lineOfIndex(content, start + (m.index || 0)) });
      continue;
    }
    m = chunk.match(/^\s*export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/);
    if (m) {
      const name = m[1];
      functions.push({ name, exported: true, loc: lineOfIndex(content, start + (m.index || 0)) });
      exports.push({ kind: 'function', name });
      continue;
    }
  }

  for (const [start, end] of topLevelRanges(content)) {
    const chunk = content.slice(start, end);
    const callRegex = /\b([A-Za-z_$][\w$]*)\s*\(/g;
    for (const match of chunk.matchAll(callRegex)) {
      const symbol = match[1];
      const target = importSymbolToFile.get(symbol);
      if (target) {
        callRefs.push({ symbol, targetFile: target.file, targetSymbol: target.symbol });
      }
    }
  }

  const supabase = {
    createClient: /\bcreateClient\s*\(/.test(content),
    fromTables: [...content.matchAll(/\.from\(\s*['"]([a-zA-Z0-9_\.]+)['"]\s*\)/g)].map((m) => m[1]),
    rpcFns: [...content.matchAll(/\.rpc\(\s*['"]([a-zA-Z0-9_\.]+)['"]\s*\)/g)].map((m) => m[1]),
  };

  return { imports, exports, functions, classes, callRefs, reexports, supabase };
}

function extractPythonData(relPath, content, allFilesSet) {
  const imports = [];
  const functions = [];
  const classes = [];
  const callRefs = [];
  const importedNames = new Map();

  for (const match of content.matchAll(/^\s*import\s+([^\n#]+)/gm)) {
    const modules = match[1].split(',').map((m) => m.trim()).filter(Boolean);
    for (const mod of modules) {
      const [name, alias] = mod.split(/\s+as\s+/i).map((s) => s.trim());
      const symbol = alias || name.split('.').pop();
      importedNames.set(symbol, { module: name, symbol });
      imports.push({ spec: name, resolved: resolvePythonImport(relPath, name, allFilesSet) });
    }
  }

  for (const match of content.matchAll(/^\s*from\s+([^\s]+)\s+import\s+([^\n#]+)/gm)) {
    const mod = match[1].trim();
    const names = match[2].split(',').map((n) => n.trim()).filter(Boolean);
    const resolved = resolvePythonImport(relPath, mod, allFilesSet);
    imports.push({ spec: mod, resolved });
    for (const nameChunk of names) {
      const [name, alias] = nameChunk.split(/\s+as\s+/i).map((s) => s.trim());
      importedNames.set(alias || name, { module: mod, symbol: name });
    }
  }

  for (const match of content.matchAll(/^def\s+([A-Za-z_][\w]*)\s*\(/gm)) {
    functions.push({ name: match[1], exported: true, loc: lineOfIndex(content, match.index ?? 0) });
  }

  for (const match of content.matchAll(/^class\s+([A-Za-z_][\w]*)\b/gm)) {
    classes.push({ name: match[1], exported: true, loc: lineOfIndex(content, match.index ?? 0) });
  }

  for (const match of content.matchAll(/^([A-Za-z_][\w]*)\s*\(/gm)) {
    const sym = match[1];
    const imported = importedNames.get(sym);
    if (imported) {
      callRefs.push({ symbol: sym, targetFile: resolvePythonImport(relPath, imported.module, allFilesSet), targetSymbol: imported.symbol });
    }
  }

  return { imports, functions, classes, callRefs };
}

function resolvePythonImport(sourceRel, moduleName, allFilesSet) {
  const sourceDir = path.dirname(sourceRel);
  const levelsUp = (moduleName.match(/^\.+/)?.[0]?.length || 0) - 1;
  const modulePath = moduleName.replace(/^\.+/, '').replace(/\./g, '/');
  let baseDir = sourceDir;
  for (let i = 0; i < Math.max(0, levelsUp); i += 1) baseDir = path.dirname(baseDir);

  const candidates = [];
  if (moduleName.startsWith('.')) {
    const relBase = toPosix(path.normalize(path.join(baseDir, modulePath)));
    candidates.push(relBase);
  } else {
    candidates.push(modulePath);
  }

  for (const base of candidates) {
    const py = base.endsWith('.py') ? base : `${base}.py`;
    if (allFilesSet.has(py)) return py;
    const initPy = `${base}/__init__.py`;
    if (allFilesSet.has(initPy)) return initPy;
  }
  return null;
}

function extractSqlData(content) {
  const tables = new Set();
  const functions = new Set();
  const policies = new Set();

  for (const match of content.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?([a-zA-Z0-9_\."']+)/gi)) {
    tables.add(cleanSqlName(match[1]));
  }
  for (const match of content.matchAll(/create\s+(?:or\s+replace\s+)?function\s+([a-zA-Z0-9_\."']+)/gi)) {
    functions.add(cleanSqlName(match[1]));
  }
  for (const match of content.matchAll(/create\s+policy\s+([a-zA-Z0-9_\-\."']+)/gi)) {
    policies.add(cleanSqlName(match[1]));
  }

  return {
    tables: [...tables],
    functions: [...functions],
    policies: [...policies],
  };
}

function cleanSqlName(raw) {
  return (raw || '')
    .replace(/["'`;()]/g, '')
    .split('.')
    .pop()
    .trim();
}

function isEntryPoint(relPath) {
  if (/^app\/(?:.+\/)?(page|layout)\.(ts|tsx|js|jsx)$/.test(relPath)) return true;
  if (/^app\/(?:.+\/)?route\.(ts|js)$/.test(relPath)) return true;
  if (/^tests\//.test(relPath)) return true;
  if (/^\.github\/workflows\//.test(relPath)) return true;
  if (ROOT_CONFIG_FILES.includes(relPath)) return true;
  if (/^next\.config\./.test(path.basename(relPath))) return true;
  return false;
}

function addEdge(edges, edgeSet, source, target, kind) {
  if (!source || !target || source === target) return;
  const key = `${source}|${target}|${kind}`;
  if (edgeSet.has(key)) return;
  edgeSet.add(key);
  edges.push({ source, target, kind });
}

const FILE_LEVEL_SOURCE_DIRS = new Set([
  'app', 'components', 'lib', 'hooks', 'types', 'engins', 'daydreams',
  'coresurfaces', 'dreamdmbar', 'src', 'scripts', 'tests', 'utils',
  'agents', 'dr-eams', 'assembly', 'core',
]);

function getTopFolder(relPath) {
  const slash = relPath.indexOf('/');
  return slash === -1 ? '(root)' : relPath.slice(0, slash);
}

function buildFileLevelSection(nodes, edges) {
  // Unique file→file adjacency maps (deduped regardless of edge kind)
  const outMap = new Map(); // srcPath → Set<tgtPath>
  const inMap = new Map();  // tgtPath → Set<srcPath>

  for (const node of nodes) {
    if (!node.id.startsWith('file:')) continue;
    outMap.set(node.path, new Set());
    inMap.set(node.path, new Set());
  }

  for (const edge of edges) {
    if (!edge.source.startsWith('file:') || !edge.target.startsWith('file:')) continue;
    const srcPath = edge.source.slice('file:'.length);
    const tgtPath = edge.target.slice('file:'.length);
    if (outMap.has(srcPath) && inMap.has(tgtPath)) {
      outMap.get(srcPath).add(tgtPath);
      inMap.get(tgtPath).add(srcPath);
    }
  }

  // Group files by top-level folder (only source dirs)
  const byFolder = new Map();
  for (const node of nodes) {
    if (!node.id.startsWith('file:')) continue;
    const topFolder = getTopFolder(node.path);
    if (!FILE_LEVEL_SOURCE_DIRS.has(topFolder)) continue;
    if (!byFolder.has(topFolder)) byFolder.set(topFolder, []);
    byFolder.get(topFolder).push(node);
  }

  // Sort folders by file count descending
  const sortedFolders = [...byFolder.entries()].sort((a, b) => b[1].length - a[1].length);

  const lines = ['#### File-Level Connectivity (auto-generated)', ''];

  for (const [folderName, folderFiles] of sortedFolders) {
    // Sort files by Imported By descending, then path ascending
    folderFiles.sort((a, b) => {
      const aIn = inMap.get(a.path)?.size || 0;
      const bIn = inMap.get(b.path)?.size || 0;
      if (bIn !== aIn) return bIn - aIn;
      return a.path.localeCompare(b.path);
    });

    lines.push(`<details><summary>${folderName}/ (${folderFiles.length} files)</summary>`, '');
    lines.push('| File | Type | Imports | Imported By | Top Importers | Top Imports |');
    lines.push('|---|---|---|---|---|---|');

    for (const node of folderFiles) {
      const outList = [...(outMap.get(node.path) || [])];
      const inList = [...(inMap.get(node.path) || [])];
      const topImporters = inList.slice(0, 3).map((p) => `\`${p}\``).join(', ');
      const topImports = outList.slice(0, 3).map((p) => `\`${p}\``).join(', ');
      lines.push(`| \`${node.path}\` | ${node.type} | ${outList.length} | ${inList.length} | ${topImporters || '—'} | ${topImports || '—'} |`);
    }

    lines.push('', '</details>', '');
  }

  return lines.join('\n');
}

function buildFileLevelGraphs(nodes, edges) {
  // Group files by top-level folder (only source dirs)
  const byFolder = new Map();
  for (const node of nodes) {
    if (!node.id.startsWith('file:')) continue;
    const topFolder = getTopFolder(node.path);
    if (!FILE_LEVEL_SOURCE_DIRS.has(topFolder)) continue;
    if (!byFolder.has(topFolder)) byFolder.set(topFolder, []);
    byFolder.get(topFolder).push(node.path);
  }

  // Sort folders by file count ascending (smaller = renderable first)
  const sortedFolders = [...byFolder.entries()].sort((a, b) => a[1].length - b[1].length);

  const lines = ['#### File-Level Graphs by Folder', ''];

  const toNodeId = (p) => 'f_' + p.replace(/[^a-zA-Z0-9]/g, '_');

  for (const [folderName, folderFilePaths] of sortedFolders) {
    const count = folderFilePaths.length;
    const folderFileSet = new Set(folderFilePaths);

    lines.push(`<details><summary>${folderName}/ — ${count} files</summary>`, '');

    if (count > 60) {
      lines.push(`_File-level graph omitted: ${count} files exceeds Mermaid render budget. See table above._`);
    } else {
      const nodeDefs = new Map(); // nodeId → label
      const graphEdges = new Set(); // "  srcId --> tgtId"

      for (const edge of edges) {
        if (!edge.source.startsWith('file:') || !edge.target.startsWith('file:')) continue;
        const srcPath = edge.source.slice('file:'.length);
        const tgtPath = edge.target.slice('file:'.length);
        if (!folderFileSet.has(srcPath)) continue;
        const srcId = toNodeId(srcPath);
        const tgtId = toNodeId(tgtPath);
        const srcLabel = srcPath.split('/').pop();
        const tgtLabel = tgtPath.split('/').pop();
        if (!nodeDefs.has(srcId)) nodeDefs.set(srcId, srcLabel);
        if (!nodeDefs.has(tgtId)) nodeDefs.set(tgtId, tgtLabel);
        graphEdges.add(`  ${srcId} --> ${tgtId}`);
      }

      // Add isolated nodes from this folder (no outgoing edges captured)
      for (const p of folderFilePaths) {
        const id = toNodeId(p);
        if (!nodeDefs.has(id)) nodeDefs.set(id, p.split('/').pop());
      }

      const mermaidLines = ['```mermaid', 'graph LR'];
      for (const [id, label] of nodeDefs) {
        mermaidLines.push(`  ${id}["${label}"]`);
      }
      for (const edgeLine of graphEdges) {
        mermaidLines.push(edgeLine);
      }
      mermaidLines.push('```');
      lines.push(...mermaidLines);
    }

    lines.push('', '</details>', '');
  }

  return lines.join('\n');
}

function buildTopLevelFolderMermaid(edges) {
  const groupFor = (p) => {
    const [first] = p.split('/');
    return p.includes('/') ? first : '(root)';
  };

  const connectionCounts = new Map();
  for (const edge of edges) {
    if (!edge.source.startsWith('file:') || !edge.target.startsWith('file:')) continue;
    const srcPath = edge.source.slice('file:'.length);
    const tgtPath = edge.target.slice('file:'.length);
    const srcGroup = groupFor(srcPath);
    const tgtGroup = groupFor(tgtPath);
    if (srcGroup === tgtGroup) continue;
    const key = `${srcGroup}|${tgtGroup}`;
    connectionCounts.set(key, (connectionCounts.get(key) || 0) + 1);
  }

  const top = [...connectionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40);

  const toId = (name) => name.replace(/[^a-zA-Z0-9_]/g, '_') || 'root';
  const lines = ['graph LR'];
  if (top.length === 0) {
    lines.push('  repo["repo"]');
    return lines.join('\n');
  }
  for (const [pair, count] of top) {
    const [a, b] = pair.split('|');
    lines.push(`  ${toId(a)}["${a}"] -->|${count}| ${toId(b)}["${b}"]`);
  }
  return lines.join('\n');
}

function buildAutoSection(stats, mermaid, orphanRows, nodes, edges) {
  const orphanTable = orphanRows.length
    ? orphanRows.map((row) => `| \`${row.path}\` | ${row.type} |`).join('\n')
    : '| _None_ | — |';

  const fileLevelSection = buildFileLevelSection(nodes, edges);
  const fileLevelGraphs = buildFileLevelGraphs(nodes, edges);

  return [
    '### Auto-Generated Repository Overview',
    '',
    `- **Total files:** ${stats.totalFiles}`,
    `- **Total function/class nodes:** ${stats.totalFunctionAndClassNodes}`,
    `- **Total edges:** ${stats.totalEdges}`,
    `- **Orphan nodes:** ${stats.orphanCount}`,
    '',
    '#### Top-Level Folder Connectivity (overview)',
    '```mermaid',
    mermaid,
    '```',
    '',
    fileLevelSection,
    '',
    fileLevelGraphs,
    '',
    '#### Orphan Files (floating/disconnected)',
    '| Path | Type |',
    '|---|---|',
    orphanTable,
    '',
    '_Generated by `repo-visualizer/analyzer.mjs`._',
  ].join('\n');
}

function ensureVisualSchematic(stats, mermaid, orphanRows, nodes, edges) {
  const autoBlock = buildAutoSection(stats, mermaid, orphanRows, nodes, edges);
  const baseDoc = [
    '# VISUAL SCHEMATIC',
    '',
    'Supabase-style visual schematic for the DREAMengin repository. It maps files, folders, function/class symbols, imports, calls, re-exports, routes, SQL entities, and floating/orphan nodes.',
    '',
    '**Live viewer:** https://appthemanger-ctrl.github.io/DREAMengin/',
    '',
    AUTO_START,
    AUTO_END,
    '',
    'Open the interactive viewer for click-to-inspect details, filtering, and zoom controls.',
    '',
  ].join('\n');

  if (!fs.existsSync(VISUAL_SCHEMATIC)) {
    fs.writeFileSync(VISUAL_SCHEMATIC, baseDoc, 'utf8');
  }

  const current = readFileSafe(VISUAL_SCHEMATIC);
  const startIndex = current.indexOf(AUTO_START);
  const endIndex = current.indexOf(AUTO_END);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    fs.writeFileSync(VISUAL_SCHEMATIC, baseDoc.replace(`${AUTO_START}\n${AUTO_END}`, `${AUTO_START}\n${autoBlock}\n${AUTO_END}`), 'utf8');
    return;
  }

  const updated = `${current.slice(0, startIndex + AUTO_START.length)}\n${autoBlock}\n${current.slice(endIndex)}`;
  fs.writeFileSync(VISUAL_SCHEMATIC, updated, 'utf8');
}

function main() {
  const relFiles = getTrackedFiles(REPO_ROOT);
  const allFilesSet = new Set(relFiles);

  const nodes = [];
  const edges = [];
  const folders = new Set();
  const edgeSet = new Set();
  const symbolNodeByFileAndName = new Map();
  const sqlTableNodesByName = new Map();
  const sqlFunctionNodesByName = new Map();
  const pendingCallRefs = [];

  createRootFolder(nodes, folders);

  for (const relPath of relFiles) {
    const abs = path.join(REPO_ROOT, relPath);
    const stat = fs.statSync(abs);
    if (!stat.isFile()) continue;

    const parentFolderId = ensureFolderNodes(nodes, folders, relPath);
    const type = getFileType(relPath);
    const fileNodeId = `file:${relPath}`;
    const fileNode = {
      id: fileNodeId,
      label: path.basename(relPath),
      type,
      path: relPath,
      parent: parentFolderId,
      loc: null,
      isOrphan: false,
      tags: [],
    };

    if (/^app\/api\/.+\/route\.(ts|js)$/.test(relPath)) fileNode.tags.push('api-handler');

    const content = readFileSafe(abs);

    if (JS_EXTS.has(path.extname(relPath).toLowerCase())) {
      const js = extractJSImportData(relPath, content, allFilesSet);
      if (js.supabase.createClient) fileNode.tags.push('supabase-create-client');

      for (const imp of js.imports) {
        if (imp.resolved) addEdge(edges, edgeSet, fileNodeId, `file:${imp.resolved}`, 'import');
      }
      for (const rex of js.reexports) {
        addEdge(edges, edgeSet, fileNodeId, `file:${rex.resolved}`, 'reexport');
      }

      for (const fn of js.functions) {
        const id = `function:${relPath}#${fn.name}`;
        nodes.push({
          id,
          label: fn.name,
          type: 'function',
          path: relPath,
          parent: fileNodeId,
          loc: fn.loc,
          isOrphan: false,
          exported: fn.exported,
        });
        symbolNodeByFileAndName.set(`${relPath}::${fn.name}`, id);
      }
      for (const cls of js.classes) {
        const id = `class:${relPath}#${cls.name}`;
        nodes.push({
          id,
          label: cls.name,
          type: 'class',
          path: relPath,
          parent: fileNodeId,
          loc: cls.loc,
          isOrphan: false,
          exported: cls.exported,
        });
        symbolNodeByFileAndName.set(`${relPath}::${cls.name}`, id);
      }

      for (const ref of js.callRefs) pendingCallRefs.push({ source: fileNodeId, ...ref });

      for (const table of js.supabase.fromTables) fileNode.tags.push(`supabase-table:${table}`);
      for (const rpcFn of js.supabase.rpcFns) fileNode.tags.push(`supabase-rpc:${rpcFn}`);
      if (type === 'route') {
        for (const imp of js.imports) {
          if (imp.resolved) addEdge(edges, edgeSet, fileNodeId, `file:${imp.resolved}`, 'route-uses');
        }
      }
    } else if (path.extname(relPath).toLowerCase() === '.py') {
      const py = extractPythonData(relPath, content, allFilesSet);
      for (const imp of py.imports) {
        if (imp.resolved) addEdge(edges, edgeSet, fileNodeId, `file:${imp.resolved}`, 'import');
      }
      for (const fn of py.functions) {
        const id = `function:${relPath}#${fn.name}`;
        nodes.push({
          id,
          label: fn.name,
          type: 'function',
          path: relPath,
          parent: fileNodeId,
          loc: fn.loc,
          isOrphan: false,
          exported: true,
        });
        symbolNodeByFileAndName.set(`${relPath}::${fn.name}`, id);
      }
      for (const cls of py.classes) {
        const id = `class:${relPath}#${cls.name}`;
        nodes.push({
          id,
          label: cls.name,
          type: 'class',
          path: relPath,
          parent: fileNodeId,
          loc: cls.loc,
          isOrphan: false,
          exported: true,
        });
        symbolNodeByFileAndName.set(`${relPath}::${cls.name}`, id);
      }
      for (const ref of py.callRefs) pendingCallRefs.push({ source: fileNodeId, ...ref });
    } else if (path.extname(relPath).toLowerCase() === '.sql') {
      const sql = extractSqlData(content);
      for (const table of sql.tables) {
        if (!table) continue;
        const id = `sql-table:${relPath}#${table}`;
        nodes.push({
          id,
          label: table,
          type: 'sql-table',
          path: relPath,
          parent: fileNodeId,
          loc: null,
          isOrphan: false,
        });
        sqlTableNodesByName.set(table, id);
      }
      for (const fn of sql.functions) {
        if (!fn) continue;
        const id = `function:${relPath}#${fn}`;
        nodes.push({
          id,
          label: fn,
          type: 'function',
          path: relPath,
          parent: fileNodeId,
          loc: null,
          isOrphan: false,
        });
        sqlFunctionNodesByName.set(fn, id);
      }
      for (const policy of sql.policies) {
        if (!policy) continue;
        const id = `sql-policy:${relPath}#${policy}`;
        nodes.push({
          id,
          label: policy,
          type: 'sql-policy',
          path: relPath,
          parent: fileNodeId,
          loc: null,
          isOrphan: false,
        });
      }
    }

    nodes.push(fileNode);
  }

  for (const ref of pendingCallRefs) {
    if (!ref.targetFile) continue;
    const symbolTarget = symbolNodeByFileAndName.get(`${ref.targetFile}::${ref.targetSymbol}`)
      || symbolNodeByFileAndName.get(`${ref.targetFile}::${ref.symbol}`);
    addEdge(edges, edgeSet, ref.source, symbolTarget || `file:${ref.targetFile}`, 'call');
  }

  for (const node of nodes) {
    if (!node.tags || !Array.isArray(node.tags)) continue;
    for (const tag of node.tags) {
      if (typeof tag !== 'string') continue;
      if (tag.startsWith('supabase-table:')) {
        const table = tag.slice('supabase-table:'.length);
        const target = sqlTableNodesByName.get(cleanSqlName(table));
        if (target) addEdge(edges, edgeSet, node.id, target, 'sql-reference');
      }
      if (tag.startsWith('supabase-rpc:')) {
        const fnName = tag.slice('supabase-rpc:'.length);
        const target = sqlFunctionNodesByName.get(cleanSqlName(fnName));
        if (target) addEdge(edges, edgeSet, node.id, target, 'sql-reference');
      }
    }
  }

  const incomingCount = new Map();
  for (const edge of edges) incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);

  for (const node of nodes) {
    if (node.type === 'folder') {
      node.isOrphan = false;
      continue;
    }
    const pathValue = node.path || '';
    const incoming = incomingCount.get(node.id) || 0;
    const entry = isEntryPoint(pathValue);
    node.isOrphan = incoming === 0 && !entry;
  }

  const degreeByNode = new Map();
  for (const edge of edges) {
    degreeByNode.set(edge.source, (degreeByNode.get(edge.source) || 0) + 1);
    degreeByNode.set(edge.target, (degreeByNode.get(edge.target) || 0) + 1);
  }

  const countsByType = nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {});

  const orphanCount = nodes.filter((n) => n.isOrphan).length;
  const totalFiles = nodes.filter((n) => n.id.startsWith('file:')).length;
  const totalFunctionAndClassNodes = nodes.filter((n) => n.type === 'function' || n.type === 'class').length;

  const topConnected = [...degreeByNode.entries()]
    .map(([id, degree]) => {
      const node = nodes.find((n) => n.id === id);
      return {
        id,
        degree,
        label: node?.label || id,
        type: node?.type || 'unknown',
        path: node?.path || null,
      };
    })
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 10);

  const stats = {
    generatedAt: new Date().toISOString(),
    totalFiles,
    totalNodes: nodes.length,
    totalEdges: edges.length,
    totalFunctionAndClassNodes,
    orphanCount,
    countsByType,
    topConnected,
  };

  const graph = {
    generatedAt: stats.generatedAt,
    root: '.',
    nodes,
    edges,
  };

  fs.writeFileSync(OUTPUT_GRAPH, JSON.stringify(graph, null, 2));
  fs.writeFileSync(OUTPUT_STATS, JSON.stringify(stats, null, 2));

  const orphanFileRows = nodes
    .filter((node) => node.id.startsWith('file:') && node.isOrphan)
    .map((node) => ({ path: node.path, type: node.type }))
    .sort((a, b) => a.path.localeCompare(b.path));

  const mermaid = buildTopLevelFolderMermaid(edges);
  ensureVisualSchematic(stats, mermaid, orphanFileRows, nodes, edges);

  console.log(`Generated ${OUTPUT_GRAPH}`);
  console.log(`Generated ${OUTPUT_STATS}`);
  console.log(`Updated ${VISUAL_SCHEMATIC}`);
  console.log(`Nodes: ${nodes.length}, edges: ${edges.length}, orphans: ${orphanCount}`);
}

main();
