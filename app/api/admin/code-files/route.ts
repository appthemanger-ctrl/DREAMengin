import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// ── Rate-limiter (in-memory, resets on server restart) ──────────────────────
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 min window

function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

function rateCheck(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false; // not limited
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

// ── File-tree builder ────────────────────────────────────────────────────────
const ALLOWED_TOP_DIRS = ['app', 'components', 'lib', 'hooks', 'types', 'styles'];
const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.md', '.mjs', '.cjs']);
const BLOCKED_SEGMENTS = new Set(['node_modules', '.git', '.next', 'dist', 'out', '__pycache__']);

export interface FileNode {
  name: string;
  type: 'file' | 'dir';
  path: string;       // relative to project root
  children?: FileNode[];
}

async function buildTree(absDir: string, root: string, depth = 0): Promise<FileNode[]> {
  if (depth > 5) return [];
  let entries;
  try {
    entries = await fs.readdir(absDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const nodes: FileNode[] = [];
  for (const e of entries) {
    if (e.name.startsWith('.') || BLOCKED_SEGMENTS.has(e.name)) continue;
    const abs = path.join(absDir, e.name);
    const rel = path.relative(root, abs);
    if (e.isDirectory()) {
      nodes.push({ name: e.name, type: 'dir', path: rel, children: await buildTree(abs, root, depth + 1) });
    } else if (ALLOWED_EXTENSIONS.has(path.extname(e.name))) {
      nodes.push({ name: e.name, type: 'file', path: rel });
    }
  }
  // dirs first, then files, both alphabetical
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// ── Path-safety guard ────────────────────────────────────────────────────────
function isSafe(relPath: string, root: string): boolean {
  const abs = path.resolve(root, relPath);
  if (!abs.startsWith(root + path.sep) && abs !== root) return false;
  const segments = relPath.split(path.sep);
  if (segments.some((s) => BLOCKED_SEGMENTS.has(s))) return false;
  return true;
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (rateCheck(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
  }

  let body: { password?: string; action?: string; filePath?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // ── Password check (server-side only) ──
  const adminPw = process.env.ADMIN_CODE_PASSWORD;
  if (!adminPw) {
    return NextResponse.json({ error: 'ADMIN_CODE_PASSWORD env var not set on the server.' }, { status: 503 });
  }
  if (!body.password || body.password !== adminPw) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  const root = process.cwd();

  // ── Action: tree ──
  if (body.action === 'tree') {
    const tree: FileNode[] = [];
    for (const dir of ALLOWED_TOP_DIRS) {
      const abs = path.join(root, dir);
      try {
        await fs.access(abs);
        tree.push({ name: dir, type: 'dir', path: dir, children: await buildTree(abs, root) });
      } catch {
        /* skip directories that don't exist */
      }
    }
    return NextResponse.json({ tree });
  }

  // ── Action: read ──
  if (body.action === 'read' && body.filePath) {
    const rel = body.filePath;
    if (!isSafe(rel, root)) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }
    const abs = path.resolve(root, rel);
    try {
      const raw = await fs.readFile(abs, 'utf-8');
      if (raw.length > 200_000) {
        return NextResponse.json({ error: 'File too large to display (> 200 KB).' }, { status: 413 });
      }
      return NextResponse.json({ content: raw, path: rel });
    } catch {
      return NextResponse.json({ error: 'Could not read file.' }, { status: 404 });
    }
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
