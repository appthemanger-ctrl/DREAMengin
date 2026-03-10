import { NextRequest, NextResponse } from 'next/server';

// Legacy route — canonical Dr. Eams endpoint is /api/ai/eams
// Redirects are 308 (Permanent Redirect) to preserve POST method.
export async function POST(req: NextRequest) {
  return NextResponse.redirect(new URL('/api/ai/eams', req.url), 308);
}
