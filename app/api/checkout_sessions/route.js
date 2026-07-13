import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getStripeServer, formatAmountForStripe } from '@/lib/stripe';
import { PLANS } from '@/lib/plans';

export async function POST(req) {
  try {
    const { userId: clerkUserId } = auth();
    const { planType, userId: bodyUserId } = await req.json();
    const userId = clerkUserId || bodyUserId;

    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const plan = PLANS[planType];
    if (!plan || plan.price <= 0) {
      return NextResponse.json({ error: { message: 'Invalid plan type' } }, { status: 400 });
    }

    const stripe = getStripeServer();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    let customerId = null;
    try {
      const { getAdminDb } = await import('@/lib/firebase-admin');
      const snap = await getAdminDb().collection('users').doc(userId).get();
      if (snap.exists) customerId = snap.data()?.stripeCustomerId || null;
    } catch {
      // continue without existing customer
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      client_reference_id: userId,
      ...(customerId ? { customer: customerId } : {}),
      metadata: {
        userId,
        planType,
      },
      subscription_data: {
        metadata: {
          userId,
          planType,
        },
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Flashy ${plan.name}`,
            },
            unit_amount: formatAmountForStripe(plan.price),
            recurring: {
              interval: 'month',
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/result?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
    });

    return NextResponse.json({ id: checkoutSession.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 });
    }

    const stripe = getStripeServer();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid' && session.metadata?.userId) {
      try {
        const { adminSetUserPlan } = await import('@/lib/firestore/admin-users');
        await adminSetUserPlan(session.metadata.userId, session.metadata.planType || 'basic', {
          stripeCustomerId: session.customer || null,
          stripeSubscriptionId: session.subscription || null,
        });
      } catch (adminError) {
        console.error('Admin plan sync failed, falling back:', adminError.message);
        const { setUserPlan } = await import('@/lib/firestore/users');
        await setUserPlan(session.metadata.userId, session.metadata.planType || 'basic', {
          stripeCustomerId: session.customer || null,
          stripeSubscriptionId: session.subscription || null,
        });
      }
    }

    return NextResponse.json({
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
      planType: session.metadata?.planType || null,
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
