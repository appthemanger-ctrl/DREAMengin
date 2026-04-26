import { NextRequest, NextResponse } from 'next/server';

function redirectToDreams(req: NextRequest) {
  const url = new URL(req.url);
  url.pathname = '/api/dreams/feed';
  return NextResponse.redirect(url, 301);
}

export function GET(req: NextRequest) {
  return redirectToDreams(req);
}

export function POST(req: NextRequest) {
  return redirectToDreams(req);
}
