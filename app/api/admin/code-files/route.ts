import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { createServerClient } from '@/lib/supabase/server';

// ── Owner gate ───────────────────────────────────────────────────────────────
// The ONLY email that may call this API.
const OWNER_EMAIL = 'Appthemanger@gmail.com';

// ── Permanent lockout ────────────────────────────────────────────────────────
// One wrong password attempt locks this process forever.
// Process-level flag (survives hot-reloads, resets only on server restart / redeploy).
// Additionally, set ADMIN_LOCKOUT=1 in your environment for persistence across deployments.
// To reset: remove ADMIN_LOCKOUT from your environment config AND redeploy.
let adminLocked = false;

function isLocked(): boolean {
  return adminLocked || process.env.ADMIN_LOCKOUT === '1';
}

// ── Blocked domains ──────────────────────────────────────────────────────────
// Any request whose origin, referer, or host contains one of these strings is denied.
const BLOCKED_DOMAINS = ['theboogieman.ai'];

function isDomainBlocked(req: Request): boolean {
  const checkHeaders = [
    req.headers.get('origin') ?? '',
    req.headers.get('referer') ?? '',
    req.headers.get('host') ?? '',
  ];
  return checkHeaders.some((h) =>
    BLOCKED_DOMAINS.some((d) => h.toLowerCase().includes(d))
  );
}

// ── File-tree builder ────────────────────────────────────────────────────────
const ALLOWED_TOP_DIRS = ['app', 'components', 'lib', 'hooks', 'types', 'styles'];
const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.md', '.mjs', '.cjs']);
const BLOCKED_SEGMENTS = new Set(['node_modules', '.git', '.next', 'dist', 'out', '__pycache__']);

export interface FileNode {
  name: string;
  type: 'file' | 'dir';
  path: string;
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

// ── Deny helper ──────────────────────────────────────────────────────────────
function deny(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  // 1. Block blacklisted domains immediately — no information leakage
  if (isDomainBlocked(request)) {
    return deny('Access denied.', 403);
  }

  // 2. Check permanent lockout
  if (isLocked()) {
    return deny('Access permanently locked. Edit repository configuration to reset.', 403);
  }

  // 3. Verify Supabase session — must be owner email
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email ?? '';
    if (email.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
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
  const adminPw = process.env.ADMIN_CODE_PASSWORD;
  if (!adminPw) {
    return deny('Admin feature not configured on this server.', 503);
  }
  if (!body.password || body.password !== adminPw) {
    // Trigger permanent lockout immediately
    adminLocked = true;
    // Subtle error — do not reveal that a lockout occurred
    return deny('Incorrect password.', 401);
  }

  const root = process.cwd();

  // 6. Action: tree
  if (body.action === 'tree') {
    const tree: FileNode[] = [];
    for (const dir of ALLOWED_TOP_DIRS) {
      const abs = path.join(root, dir);
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
    const rel = body.filePath;
    if (!isSafe(rel, root)) {
      return deny('Access denied.', 403);
    }
    const abs = path.resolve(root, rel);
    try {
      const raw = await fs.readFile(abs, 'utf-8');
      if (raw.length > 200_000) {
        return deny('File too large to display (> 200 KB).', 413);
      }
      return NextResponse.json({ content: raw, path: rel });
    } catch {
      return deny('Could not read file.', 404);
    }
  }

  return deny('Unknown action.', 400);
}

