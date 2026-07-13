import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/** Lightweight error sink for client crashes. Wire a real APM later if needed. */
export async function POST(req) {
  try {
    const { userId } = auth();
    const body = await req.json().catch(() => ({}));
    console.error('[client-error]', {
      userId: userId || null,
      message: body.message || null,
      type: body.type || null,
      source: body.source || null,
      url: body.url || null,
      stack: body.stack ? String(body.stack).slice(0, 2000) : null,
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
