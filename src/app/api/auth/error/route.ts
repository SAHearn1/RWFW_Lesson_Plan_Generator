import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: Request) {
  const url = new URL('/auth/error', request.url);
  return NextResponse.redirect(url, { status: 307 });
}

export function POST(request: Request) {
  return GET(request);
}
