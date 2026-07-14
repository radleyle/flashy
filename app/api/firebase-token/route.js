import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonError(message, status = 500, extra = {}) {
  return NextResponse.json(
    {
      error: message,
      hint:
        'Open /api/firebase-health on your deployed site for diagnostics. Prefer FIREBASE_SERVICE_ACCOUNT_JSON only (delete FIREBASE_SERVICE_ACCOUNT_PATH on Vercel).',
      hasJsonEnv: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
      hasPathEnv: Boolean(
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
          process.env.GOOGLE_APPLICATION_CREDENTIALS
      ),
      ...extra,
    },
    { status }
  );
}

export async function POST() {
  try {
    const { userId } = auth();
    if (!userId) {
      return jsonError('Unauthorized', 401);
    }

    // Lazy-load so a bad admin config still returns JSON, not an HTML 500 page
    const { getAdminAuth } = await import('@/lib/firebase-admin');
    const adminAuth = getAdminAuth();
    const token = await adminAuth.createCustomToken(userId);
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Firebase token error:', error);
    return jsonError(error.message || 'Could not create Firebase token', 500);
  }
}
