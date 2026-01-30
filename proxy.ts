// proxy.ts (root)
//
// This file is NOT auto-run by Next.js (only /middleware.ts is).
// Keep it as a shared helper you can import anywhere (client/server)
// to run your /api/proxy “gate” before doing sensitive stuff.

export type ProxyVerdict = {
  ok: boolean;
  status: number;
  text?: string;
  horizonDecision?: string | null;
  horizonMode?: string | null;
};

export async function runProxyGate(init?: RequestInit): Promise<ProxyVerdict> {
  const r = await fetch('/api/proxy', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    ...(init ?? {}),
  });

  const horizonDecision = r.headers.get('x-horizon-decision');
  const horizonMode = r.headers.get('x-horizon-mode');

  if (!r.ok) {
    const text = await r.text().catch(() => '');
    return {
      ok: false,
      status: r.status,
      text: text || `Blocked (${r.status})`,
      horizonDecision,
      horizonMode,
    };
  }

  return {
    ok: true,
    status: r.status,
    horizonDecision,
    horizonMode,
  };
}

/**
 * Convenience helper: throws if blocked.
 * Usage:
 *   await requireProxyGate();
 *   ...do the thing...
 */
export async function requireProxyGate(init?: RequestInit): Promise<void> {
  const v = await runProxyGate(init);
  if (!v.ok) {
    throw new Error(v.text || `Blocked (${v.status})`);
  }
}
