'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import AppNav from '@/components/layout/AppNav';
import Button from '@/components/ui/Button';
import { PLANS } from '@/lib/plans';
import getStripe from '@/utils/get-stripe';
import { track } from '@/lib/analytics';

export default function PricingPage() {
  const { user, isSignedIn } = useUser();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const checkout = async (planType) => {
    if (!isSignedIn) {
      window.location.href = '/sign-in?redirect_url=/pricing';
      return;
    }
    setLoading(planType);
    setError('');
    track('checkout_started', { planType });
    try {
      const res = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType, userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || 'Checkout failed');
      const stripe = await getStripe();
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.id,
      });
      if (stripeError) throw new Error(stripeError.message);
    } catch (e) {
      setError(e.message);
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Pricing
          </h1>
          <p className="mt-2 text-muted font-medium">
            Start free. Upgrade when you need more sets and AI generations.
          </p>
        </div>
        {error ? <p className="mt-5 text-center text-sm text-red-600">{error}</p> : null}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {Object.values(PLANS).map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl border-2 p-7 ${
                plan.id === 'pro'
                  ? 'border-accent bg-surface shadow-lift'
                  : 'border-line bg-surface shadow-soft'
              }`}
            >
              <h2 className="font-display text-xl font-bold tracking-tight text-ink">
                {plan.name}
              </h2>
              <p className="mt-3 font-display text-4xl font-bold tracking-tight text-ink">
                ${plan.price}
                <span className="text-base font-semibold text-muted"> / mo</span>
              </p>
              <ul className="mt-5 space-y-2 text-sm text-muted">
                {plan.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              <div className="mt-6">
                {plan.id === 'free' ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Current starter
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={loading === plan.id}
                    onClick={() => checkout(plan.id)}
                  >
                    {loading === plan.id ? 'Redirecting…' : `Choose ${plan.name}`}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
