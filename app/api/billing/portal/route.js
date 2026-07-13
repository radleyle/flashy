import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getStripeServer } from '@/lib/stripe';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getAdminDb();
    const snap = await db.collection('users').doc(userId).get();
    const customerId = snap.exists ? snap.data()?.stripeCustomerId : null;

    if (!customerId) {
      return NextResponse.json(
        {
          error:
            'No billing account yet. Upgrade on Pricing first — then you can manage your subscription here.',
        },
        { status: 400 }
      );
    }

    const stripe = getStripeServer();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/account`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Billing portal error:', error);
    return NextResponse.json(
      { error: error.message || 'Could not open billing portal' },
      { status: 500 }
    );
  }
}
