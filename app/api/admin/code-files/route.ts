import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { createServerClient } from '@/lib/supabase/server';
import {
  isAdminLocked,
  triggerAdminLockout,
  isOwner,
  isDomainBlocked,
} from '@/lib/admin/lockout';

// fs/path require Node.js runtime (the default in Next.js 16+).
// NOTE: Do not add `export const runtime = 'nodejs'` here — it is incompatible
// with nextConfig.cacheComponents (Turbopack build error in Next.js 16+).

// ── File-tree builder ────────────────────────────────────────────────────────
const ALLOWED_TOP_DIRS = ['app', 'components', 'lib', 'hooks', 'types', 'styles'] as const;
type AllowedTopDir = (typeof ALLOWED_TOP_DIRS)[number];
const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.md', '.mjs', '.cjs']);
const BLOCKED_SEGMENTS = new Set(['node_modules', '.git', '.next', 'dist', 'out', '__pycache__']);

export interface FileNode {
  name: string;
  type: 'file' | 'dir';
  path: string;
  children?: FileNode[];
}

async function buildTree(absDir: string, root: string, depth = 0: Promise<FileNode[]> {
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
    const abs = path.join(/*turbopackIgnore: true*/ absDir, e.name);
    const rel = path.relative(root, abs);
    if (e.isDirectory()) {
      nodes.push({ name: e.name, type: 'dir', path: rel, children: await buildTree(abs, root, depth + 1) });
    } else if (ALLOWED_EXTENSIONS.has(path.extname(e.name))) {
      nodes.push({ name: e.name, type: 'file', path: rel });
    }
  }
  return nodes.sort(a: Record<string, unknown>, b: Record<string, unknown> => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function allowedRoot(topDir: AllowedTopDir: string {
  switch (topDir) {
    case 'app':
      return path.join(/*turbopackIgnore: true*/ process.cwd(), 'app');
    case 'components':
      return path.join(/*turbopackIgnore: true*/ process.cwd(), 'components');
    case 'lib':
      return path.join(/*turbopackIgnore: true*/ process.cwd(), 'lib');
    case 'hooks':
      return path.join(/*turbopackIgnore: true*/ process.cwd(), 'hooks');
    case 'types':
      return path.join(/*turbopackIgnore: true*/ process.cwd(), 'types');
    case 'styles':
      return path.join(/*turbopackIgnore: true*/ process.cwd(), 'styles');
  }
}

// ── Path-safety guard ────────────────────────────────────────────────────────
function resolveAllowedFile(relPath: string: { abs: string; rel: string } | null {
  if (path.isAbsolute(relPath)) return null;
  const normalized = path.normalize(relPath).replaceAll(path.sep, '/');
  if (normalized === '.' || normalized.startsWith('../') || normalized.includes('/../')) return null;

  const segments = normalized.split('/').filter(Boolean);
  const topDir = segments[0] as AllowedTopDir | undefined;
  if (!topDir || !ALLOWED_TOP_DIRS.includes(topDir)) return null;
  if (segments.some((s: Record<string, unknown>) => s === '..' || BLOCKED_SEGMENTS.has(s))) return null;
  if (!ALLOWED_EXTENSIONS.has(path.extname(normalized))) return null;

  return {
    abs: path.join(allowedRoot(topDir), ...segments.slice(1)),
    rel: segments.join('/'),
  };
}

// ── Deny helper ──────────────────────────────────────────────────────────────
function deny(msg: string, status: number {
  return NextResponse.json({ error: msg }, { status });
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: Request {
  // 1. Block blacklisted domains immediately — no information leakage
  if (isDomainBlocked(request)) {
    return deny('Access denied.', 403);
  }

  // 2. Check permanent lockout (durable Supabase-backed check)
  if (await isAdminLocked()) {
    return deny('Access permanently locked. Edit repository configuration to reset.', 403);
  }

  // 3. Verify Supabase session — must be owner email
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email ?? '';
    if (!isOwner(email)) {
      // Do not trigger lockout for wrong user — just deny silently
      return deny('Access denied.', 403);
    }
  } catch {
    return deny('Authentication error.', 401);
  }

  // 4. Parse body
  let body: { password?: string; action?: string; filePath?: string };
  try {
    body = await request.json();
  } catch {
    return deny('Invalid request body.', 400);
  }

  // 5. Password check — ONE wrong attempt = permanent lockout
  const adminPw = process.env.IDARI_PASSWORD;
  if (!adminPw) {
    return deny('Admin feature not configured on this server.', 503);
  }
  if (!body.password || body.password !== adminPw) {
    // Trigger permanent lockout immediately
    await triggerAdminLockout();
    // Subtle error — do not reveal that a lockout occurred
    return deny('Incorrect password.', 401);
  }

  const root = process.cwd();

  // 6. Action: tree
  if (body.action === 'tree') {
    const tree: FileNode[] = [];
    for (const dir of ALLOWED_TOP_DIRS) {
      const abs = allowedRoot(dir);
      try {
        await fs.access(abs);
        tree.push({ name: dir, type: 'dir', path: dir, children: await buildTree(abs, root) });
      } catch {
        /* skip missing directories */
      }
    }
    return NextResponse.json({ tree });
  }

  // 7. Action: read
  if (body.action === 'read' && body.filePath) {
    const safeFile = resolveAllowedFile(body.filePath);
    if (!safeFile) {
      return deny('Access denied.', 403);
    }
    try {
      const raw = await fs.readFile(safeFile.abs, 'utf-8');
      if (raw.length > 200_000) {
        return deny('File too large to display (> 200 KB).', 413);
      }
      return NextResponse.json({ content: raw, path: safeFile.rel });
    } catch {
      return deny('Could not read file.', 404);
    }
  }

  return deny('Unknown action.', 400);
}
