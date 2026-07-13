import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const token = await adminAuth.createCustomToken(userId);
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Firebase token error:', error);
    return NextResponse.json(
      { error: error.message || 'Could not create Firebase token' },
      { status: 500 }
    );
  }
}
