'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import AppNav from '@/components/layout/AppNav';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
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
    <div className="min-h-screen bg-canvas pb-20 sm:pb-0">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
              Progress
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted">
              Streaks, daily goal, and recent study sessions
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/account">
              <Button variant="secondary">Account</Button>
            </Link>
            <Link href="/library">
              <Button variant="secondary">Back to library</Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                {
                  label: 'Daily goal',
                  value: `${
                    profile?.cardsStudiedDate === new Date().toISOString().slice(0, 10)
                      ? profile?.cardsStudiedToday || 0
                      : 0
                  } / ${profile?.dailyGoal || 20}`,
                  hint: (
                    <Link href="/account" className="text-accent font-bold">
                      Adjust in Account
                    </Link>
                  ),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-soft"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                    {stat.label}
                  </p>
                  <p className="mt-1.5 font-display text-3xl font-bold text-ink">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-muted">{stat.hint}</p>
                </div>
              ))}
            </div>

            <section className="mt-6">
              <h2 className="font-display text-lg font-bold text-ink mb-3">
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
                <ul className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft divide-y divide-line">
                  {sessions.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-ink truncate">
                          {deckMap[s.deckId] || 'Deck'} ·{' '}
                          <span className="capitalize">{s.mode}</span>
                        </p>
                        <p className="text-sm text-muted">{formatWhen(s.endedAt)}</p>
                      </div>
                      <Link
                        href={`/decks/${s.deckId}/study/${s.mode}`}
                        className="shrink-0 text-sm font-bold text-accent hover:text-accent-hover"
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
