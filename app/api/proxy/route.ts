import { NextRequest, NextResponse } from 'next/server';

export type ProxyVerdict = {
  ok: boolean;
  status: number;
  text?: string;
  horizonDecision?: string | null;
  horizonMode?: string | null;
};

// Next.js route handler
export async function GET(request: NextRequest) {
  // Simple proxy gate check
  // This can be expanded with actual logic
  
  return NextResponse.json(
    { ok: true, message: 'Proxy gate passed' },
    {
      status: 200,
      headers: {
        'x-horizon-decision': 'allow',
        'x-horizon-mode': 'open',
      },
    }
  );
}

// Helper function for client-side use
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

export async function requireProxyGate(init?: RequestInit): Promise<void> {
  const v = await runProxyGate(init);
  if (!v.ok) throw new Error(v.text || `Blocked (${v.status})`);
}
