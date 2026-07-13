'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import AppNav from '@/components/layout/AppNav';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { ensureUser } from '@/lib/firestore/users';
import { listRecentSessions } from '@/lib/firestore/progress';
import { listDecks } from '@/lib/firestore/decks';
import { useFirebaseAuth } from '@/components/providers/FirebaseAuthProvider';

function formatWhen(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ProgressPage() {
  const { user, isLoaded } = useUser();
  const { ready: firebaseReady } = useFirebaseAuth();
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [deckMap, setDeckMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user || !firebaseReady) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [p, s, decks] = await Promise.all([
          ensureUser(user.id),
          listRecentSessions(user.id, 15),
          listDecks(user.id),
        ]);
        if (cancelled) return;
        setProfile(p);
        setSessions(s);
        setDeckMap(Object.fromEntries(decks.map((d) => [d.id, d.title])));
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, firebaseReady]);

  const studiedToday = profile?.lastStudyDate === new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Progress
          </h1>
          <p className="mt-1 text-sm text-muted">Streaks and recent study sessions</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: 'Current streak',
                  value: `${profile?.currentStreak || 0} day${(profile?.currentStreak || 0) === 1 ? '' : 's'}`,
                  hint: studiedToday ? 'Studied today' : 'Study today to keep it',
                },
                {
                  label: 'Longest streak',
                  value: `${profile?.longestStreak || 0}`,
                  hint: 'Best run so far',
                },
                {
                  label: 'Sessions',
                  value: `${profile?.studyCount || 0}`,
                  hint: 'All-time completed',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-line bg-white px-5 py-5 shadow-soft"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {stat.label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-semibold text-ink">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-muted">{stat.hint}</p>
                </div>
              ))}
            </div>

            <section className="mt-10">
              <h2 className="font-display text-lg font-semibold text-ink mb-4">
                Recent activity
              </h2>
              {!sessions.length ? (
                <EmptyState
                  title="No sessions yet"
                  description="Finish a Flashcards, Learn, Match, or Write round to see it here."
                  actionLabel="Open library"
                  actionHref="/library"
                />
              ) : (
                <ul className="divide-y divide-line border-y border-line">
                  {sessions.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-4 py-3.5">
                      <div className="min-w-0">
                        <p className="font-medium text-ink truncate">
                          {deckMap[s.deckId] || 'Deck'} ·{' '}
                          <span className="capitalize">{s.mode}</span>
                        </p>
                        <p className="text-sm text-muted">{formatWhen(s.endedAt)}</p>
                      </div>
                      <Link
                        href={`/decks/${s.deckId}/study/${s.mode}`}
                        className="shrink-0 text-sm font-semibold text-accent hover:text-accent-hover"
                      >
                        Again
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
