import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'DREAMengin',
    timestamp: new Date().toISOString(),
  });
}
