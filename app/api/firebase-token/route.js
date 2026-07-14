import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonError(message, status = 500) {
  return NextResponse.json(
    {
      error: message,
      hint:
        'Vercel: set FIREBASE_SERVICE_ACCOUNT_JSON only (remove FIREBASE_SERVICE_ACCOUNT_PATH), then Redeploy.',
      hasJsonEnv: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
      hasPathEnv: Boolean(
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
          process.env.GOOGLE_APPLICATION_CREDENTIALS
      ),
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

    const adminAuth = getAdminAuth();
    const token = await adminAuth.createCustomToken(userId);
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Firebase token error:', error);
    return jsonError(error.message || 'Could not create Firebase token', 500);
  }
}
