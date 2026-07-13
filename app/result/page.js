'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppNav from '@/components/layout/AppNav';
import Button from '@/components/ui/Button';

function ResultContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided.');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/checkout_sessions?session_id=${sessionId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch session');
        setSession(data);
      } catch (err) {
        setError(err.message || 'Could not verify payment.');
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  if (loading) {
    return <p className="text-center text-muted py-20">Confirming your payment…</p>;
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error}</p>
        <Link href="/pricing" className="mt-4 inline-block text-accent font-semibold">
          Back to pricing
        </Link>
      </div>
    );
  }

  const paid = session?.payment_status === 'paid';

  return (
    <div className="mx-auto max-w-md text-center py-16">
      <h1 className="font-display text-3xl font-semibold text-ink">
        {paid ? 'You are all set' : 'Payment incomplete'}
      </h1>
      <p className="mt-3 text-muted">
        {paid
          ? `Your ${session.planType || 'paid'} plan is active. Head to your library and keep studying.`
          : 'Your payment was not completed. You can try again from pricing.'}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href={paid ? '/library' : '/pricing'}>
          <Button>{paid ? 'Open library' : 'Try again'}</Button>
        </Link>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <div className="min-h-screen">
      <AppNav />
      <Suspense fallback={<p className="text-center text-muted py-20">Loading…</p>}>
        <ResultContent />
      </Suspense>
    </div>
  );
}
