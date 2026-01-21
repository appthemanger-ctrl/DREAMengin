
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { password } = await req.json();
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return NextResponse.json({ error: 'ADMIN_PASSWORD not set' }, { status: 500 });
  if (password !== expected) return NextResponse.json({ error: 'invalid' }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', `admin=1; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60*60*12}`);
  return res;
}
