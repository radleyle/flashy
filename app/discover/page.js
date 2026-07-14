'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import AppNav from '@/components/layout/AppNav';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { listPublicDecks, copyPublicDeck } from '@/lib/firestore/decks';
import { useFirebaseAuth } from '@/components/providers/FirebaseAuthProvider';

export default function DiscoverPage() {
  const { user, isLoaded } = useUser();
  const { ready: firebaseReady } = useFirebaseAuth();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!firebaseReady) return;
    (async () => {
      setLoading(true);
      try {
        setDecks(await listPublicDecks());
      } catch (e) {
        console.error(e);
        setError('Could not load public decks.');
      } finally {
        setLoading(false);
      }
    })();
  }, [firebaseReady]);

  const copy = async (deckId) => {
    if (!user) return;
    setBusyId(deckId);
    setError('');
    try {
      const id = await copyPublicDeck(deckId, user.id);
      window.location.href = `/decks/${id}`;
    } catch (e) {
      setError(e.message || 'Copy failed');
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Discover</h1>
        <p className="mt-1 text-sm text-muted">
          Browse public study sets and copy them into your library.
        </p>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        {loading || !isLoaded ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : !decks.length ? (
          <div className="mt-8">
            <EmptyState
              title="No public decks yet"
              description="When someone shares a set as public, it shows up here. You can also publish one of yours from Share on a deck."
              actionLabel="Go to library"
              actionHref="/library"
            />
          </div>
        ) : (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((d) => (
              <li
                key={d.id}
                className="rounded-2xl border border-line bg-surface p-5 shadow-soft flex flex-col"
              >
                <p className="font-display text-lg font-bold text-ink">{d.title}</p>
                <p className="mt-1 text-sm text-muted line-clamp-2">
                  {d.description || 'No description'}
                </p>
                <p className="mt-3 text-xs font-semibold text-muted">
                  {d.cardCount || 0} terms
                </p>
                <div className="mt-4 flex gap-2">
                  {d.shareSlug ? (
                    <Link href={`/s/${d.shareSlug}`}>
                      <Button size="sm" variant="secondary">
                        Preview
                      </Button>
                    </Link>
                  ) : null}
                  <Button size="sm" disabled={busyId === d.id} onClick={() => copy(d.id)}>
                    {busyId === d.id ? 'Copying…' : 'Copy to library'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
