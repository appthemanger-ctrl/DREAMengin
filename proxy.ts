import { NextRequest, NextResponse } from 'next/server';


/**
 * REQUIRED by Next.js when using proxy.ts
 * The function name MUST be `proxy` or default export.
 */
export function proxy(req: NextRequest) {
  return NextResponse.next();
}
