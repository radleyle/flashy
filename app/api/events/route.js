import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/** Lightweight first-party event sink (Vercel logs). */
export async function POST(req) {
  try {
    const { userId } = auth();
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.slice(0, 80) : null;
    if (!name) return new NextResponse(null, { status: 204 });

    console.info('[event]', {
      userId: userId || null,
      name,
      props: body.props && typeof body.props === 'object' ? body.props : {},
      path: typeof body.path === 'string' ? body.path.slice(0, 200) : null,
      ts: body.ts || Date.now(),
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
