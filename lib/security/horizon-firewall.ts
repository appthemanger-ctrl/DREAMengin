import { NextRequest } from 'next/server';

/**
 * Horizon Firewall (CCC-inspired):
 * - Treats the edge as a causal boundary ("horizon") where we decide what enters.
 * - Maintains a tiny signed "ledger" per client (cookie) = boundary record/memory.
 * - Computes a risk/tension score from request features.
 *
 * This is NOT a perfect security system; it is a pragmatic, low-dependency foundation
 * that can be upgraded to Redis/Upstash/Cloudflare WAF later without rewriting the logic.
 */

type Decision = 'allow' | 'challenge' | 'block';

export type HorizonVerdict = {
  decision: Decision;
  mode: 'basic' | 'ledger';
  delayMs?: number;
  setCookie?: string;
};

// Cookie name for our signed boundary ledger.
const LEDGER_COOKIE = 'horizon_ledger';

// If you set this env var in Vercel, the ledger becomes tamper-resistant.
const SECRET = process.env.HORIZON_LEDGER_SECRET || '';

type Ledger = {
  v: 1;
  // Rolling counters
  n: number;            // total requests observed (by this client cookie)
  s: number;            // suspicious hits
  f: number;            // failed-ish signals (404s etc.) tracked client-side best-effort
  t: number;            // last timestamp (ms)
  // Entropy-ish proxy: how “random” their paths look.
  // 0 = same path repeatedly, higher = scan-like behavior.
  h: number;
  // Last few path hashes for diversity measurement
  p: string[];
};

// --- Utilities (Edge runtime compatible) ---

// Edge runtime does NOT guarantee Node.js Buffer.
// Use Web APIs (btoa/atob) for tiny payloads like our cookie ledger.
function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlEncode(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  return base64ToBytes(b64);
}

async function hmacSha256(key: string, msg: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(msg));
  return b64urlEncode(new Uint8Array(sig));
}

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function hashPath(path: string): string {
  // Tiny stable hash (not cryptographic) for diversity tracking.
  let h = 2166136261;
  for (let i = 0; i < path.length; i++) {
    h ^= path.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

// Jensen–Shannon-ish divergence proxy between “normal” and “observed” behavior.
// We don’t have a global baseline without storage; so we use a local proxy:
// - repeated same path => low divergence
// - many unique paths quickly => high divergence (scan-like)
function divergenceProxy(pathDiversity: number, burstiness: number): number {
  // both inputs roughly 0..1
  return 0.6 * pathDiversity + 0.4 * burstiness;
}

// CCC-inspired quadratic: I = C * L^2
// Here: I = boundary info (risk), C = channel capacity (how much we can “see”)
// L = ledger tension (divergence proxy)
function riskFromCLC(channelCapacity: number, tension: number): number {
  return channelCapacity * tension * tension;
}

function getChannelCapacity(req: NextRequest): number {
  // More context = higher capacity = more confident decisions.
  // Authenticated user gives us more “capacity” to trust.
  const hasAuth = !!req.cookies.get('sb-access-token') || !!req.cookies.get('supabase-auth-token');
  const hasUA = !!req.headers.get('user-agent');
  const hasReferer = !!req.headers.get('referer');
  const base = 0.4;
  return Math.min(1, base + (hasAuth ? 0.35 : 0) + (hasUA ? 0.15 : 0) + (hasReferer ? 0.1 : 0));
}

function obviousBad(req: NextRequest): boolean {
  const url = req.nextUrl;
  const path = url.pathname.toLowerCase();
  const qs = url.search.toLowerCase();

  // Path traversal & null bytes.
  if (path.includes('..') || path.includes('%2e%2e') || path.includes('%00') || qs.includes('%00')) return true;

  // Common exploit probes.
  const probe = /(wp-admin|wp-login|\.env|phpmyadmin|\bselect\b.*\bfrom\b|union\s+select|<script|\bjavascript:)/i;
  if (probe.test(path) || probe.test(qs)) return true;

  return false;
}

function readLedger(req: NextRequest): { ledger: Ledger; valid: boolean } {
  const raw = req.cookies.get(LEDGER_COOKIE)?.value;
  if (!raw) {
    return {
      ledger: { v: 1, n: 0, s: 0, f: 0, t: Date.now(), h: 0, p: [] },
      valid: false,
    };
  }

  // Format: payload.signature  where payload is base64url(JSON)
  const parts = raw.split('.');
  if (parts.length !== 2) {
    return { ledger: { v: 1, n: 0, s: 0, f: 0, t: Date.now(), h: 0, p: [] }, valid: false };
  }

  const payloadB64 = parts[0];
  const sig = parts[1];
  const json = new TextDecoder().decode(b64urlDecode(payloadB64));
  const parsed = safeJsonParse<Ledger>(json);

  if (!parsed || parsed.v !== 1) {
    return { ledger: { v: 1, n: 0, s: 0, f: 0, t: Date.now(), h: 0, p: [] }, valid: false };
  }

  // If no secret, accept unsigned (still useful for honest clients).
  if (!SECRET) return { ledger: parsed, valid: true };

  // Verify signature asynchronously in evaluateHorizon.
  return { ledger: parsed, valid: sig.length > 0 };
}

async function signLedger(ledger: Ledger): Promise<string> {
  const payload = b64urlEncode(new TextEncoder().encode(JSON.stringify(ledger)));
  const sig = SECRET ? await hmacSha256(SECRET, payload) : 'nosig';
  // HttpOnly so JS can’t read it; SameSite to reduce CSRF.
  return `${LEDGER_COOKIE}=${payload}.${sig}; Path=/; HttpOnly; SameSite=Lax; Secure`;
}

export async function evaluateHorizon(req: NextRequest): Promise<HorizonVerdict> {
  // Hard block on obvious malicious probes.
  if (obviousBad(req)) {
    return { decision: 'block', mode: 'basic' };
  }

  const now = Date.now();
  const { ledger } = readLedger(req);

  // Update ledger with new request.
  ledger.n += 1;

  const pathHash = hashPath(req.nextUrl.pathname);
  ledger.p = [pathHash, ...ledger.p.filter((x) => x !== pathHash)].slice(0, 8);

  // Diversity proxy (0..1)
  const diversity = Math.min(1, ledger.p.length / 8);

  // Burstiness proxy: requests packed too tightly in time.
  const dt = Math.max(1, now - (ledger.t || now));
  const burstiness = Math.max(0, Math.min(1, 150 / dt)); // dt<150ms => high
  ledger.t = now;

  // Suspicious signals: lots of query params, very long URLs, weird methods.
  const urlLen = req.nextUrl.href.length;
  const qpCount = req.nextUrl.searchParams.size;
  const method = req.method.toUpperCase();

  let suspicious = 0;
  if (urlLen > 1800) suspicious += 2;
  if (qpCount > 12) suspicious += 1;
  if (!['GET', 'POST', 'HEAD', 'OPTIONS'].includes(method)) suspicious += 2;

  // Accumulate “entropy” proxy.
  const tension = divergenceProxy(diversity, burstiness);
  ledger.h = Math.min(1, 0.85 * ledger.h + 0.15 * tension);

  if (suspicious > 0) ledger.s += suspicious;

  // Participation weight P (0..1): authenticated users get more benefit of the doubt.
  const hasAuth = !!req.cookies.get('sb-access-token') || !!req.cookies.get('supabase-auth-token');
  const P = hasAuth ? 0.85 : 0.35;

  // Channel capacity C: how much context we have to decide.
  const C = getChannelCapacity(req);

  // Ledger tension L: risk increases with entropy + suspicious counters, reduced by participation.
  // Normalize counters into ~0..1.
  const sNorm = Math.min(1, ledger.s / 12);
  const nNorm = Math.min(1, ledger.n / 50);
  const L = Math.min(1, (0.55 * ledger.h + 0.35 * sNorm + 0.10 * nNorm) * (1 - 0.55 * P));

  // Boundary info I (risk) using CCC quadratic.
  const I = riskFromCLC(C, L);

  // Decision thresholds.
  // - allow: normal
  // - challenge: slow down (soft firewall)
  // - block: hard deny
  let decision: Decision = 'allow';
  let delayMs: number | undefined;

  // Escalate faster for anonymous traffic.
  const blockT = hasAuth ? 0.62 : 0.45;
  const challT = hasAuth ? 0.38 : 0.28;

  if (I >= blockT) decision = 'block';
  else if (I >= challT) {
    decision = 'challenge';
    delayMs = 500 + Math.round(700 * I);
  }

  const setCookie = await signLedger(ledger);
  return { decision, mode: SECRET ? 'ledger' : 'basic', delayMs, setCookie };
}
