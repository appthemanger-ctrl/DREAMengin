import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export type ApiContext = {
  req: NextRequest;
  supabase: Awaited<ReturnType<typeof createServerClient>>;
  user: { id: string; email?: string | null } | null;
};

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status });
}

export async function withApi(
  req: NextRequest,
  handler: (ctx: ApiContext) => Promise<Response>
): Promise<Response> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return await handler({ req, supabase, user: user ? { id: user.id, email: user.email } : null });
  } catch (err: any) {
    console.error('API route error:', err);
    return jsonError('Internal Server Error', 500);
  }
}

export function requireUser(ctx: ApiContext) {
  if (!ctx.user) return jsonError('Unauthorized', 401);
  return null;
}

export async function parseJson<T extends z.ZodTypeAny>(req: NextRequest, schema: T) {
  const raw = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: parsed.error.flatten() };
  return { ok: true as const, data: parsed.data as z.infer<T> };
}

export function parseQuery<T extends z.ZodTypeAny>(req: NextRequest, schema: T) {
  const url = new URL(req.url);
  const obj: Record<string, string> = {};
  for (const [k, v] of url.searchParams.entries()) obj[k] = v;
  const parsed = schema.safeParse(obj);
  if (!parsed.success) return { ok: false as const, error: parsed.error.flatten() };
  return { ok: true as const, data: parsed.data as z.infer<T> };
}
