import { NextRequest, NextResponse } from 'next/server';

export function GET(req: NextRequest ){
  const url = new URL(req.url);
  url.pathname = '/api/dreams/instances';
  return NextResponse.redirect(url, 301);
}