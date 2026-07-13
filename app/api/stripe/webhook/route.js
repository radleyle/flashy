import { NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe';
import { adminSetUserPlan } from '@/lib/firestore/admin-users';

export const runtime = 'nodejs';

export async function POST(req) {
  const stripe = getStripeServer();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  const body = await req.text();

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.userId || session.client_reference_id;
      const planType = session.metadata?.planType || 'basic';
      if (userId) {
        await adminSetUserPlan(userId, planType, {
          stripeCustomerId: session.customer || null,
          stripeSubscriptionId: session.subscription || null,
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const userId = sub.metadata?.userId;
      if (userId) {
        await adminSetUserPlan(userId, 'free', {
          stripeSubscriptionId: null,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
