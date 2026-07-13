'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import AppNav from '@/components/layout/AppNav';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import {
  createClass,
  listOwnedClasses,
  listJoinedClasses,
  joinClassByCode,
  addDeckToClass,
} from '@/lib/firestore/classes';
import { listDecks } from '@/lib/firestore/decks';
import { useFirebaseAuth } from '@/components/providers/FirebaseAuthProvider';

export default function ClassesPage() {
  const { user, isLoaded } = useUser();
  const { ready: firebaseReady } = useFirebaseAuth();
  const [owned, setOwned] = useState([]);
  const [joined, setJoined] = useState([]);
  const [decks, setDecks] = useState([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const [o, j, d] = await Promise.all([
      listOwnedClasses(user.id),
      listJoinedClasses(user.id),
      listDecks(user.id),
    ]);
    setOwned(o);
    setJoined(j.filter((c) => c.ownerId !== user.id));
    setDecks(d);
  };

  useEffect(() => {
    if (!isLoaded || !user || !firebaseReady) return;
    (async () => {
      setLoading(true);
      try {
        await reload();
      } catch (e) {
        console.error(e);
        setError('Could not load classes.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, firebaseReady]);

  const onCreate = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    try {
      await createClass({ ownerId: user.id, name });
      setName('');
      await reload();
    } catch (e) {
      setError(e.message || 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  const onJoin = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setError('');
    try {
      await joinClassByCode(user.id, code);
      setCode('');
      await reload();
    } catch (e) {
      setError(e.message || 'Join failed');
    } finally {
      setBusy(false);
    }
  };

  const onAddDeck = async (classId, deckId) => {
    if (!deckId) return;
    setBusy(true);
    try {
      await addDeckToClass(classId, deckId);
      await reload();
    } catch (e) {
      setError(e.message || 'Could not add deck');
    } finally {
      setBusy(false);
    }
  };

  const renderClass = (c, isOwner) => (
    <li key={c.id} className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold text-ink">{c.name}</p>
          <p className="mt-1 text-sm text-muted">
            {(c.memberIds || []).length} member{(c.memberIds || []).length === 1 ? '' : 's'}
            {' · '}
            {(c.deckIds || []).length} deck{(c.deckIds || []).length === 1 ? '' : 's'}
          </p>
          {isOwner ? (
            <p className="mt-2 text-sm font-bold text-accent">
              Join code: <span className="font-mono tracking-wider">{c.joinCode}</span>
            </p>
          ) : null}
        </div>
      </div>
      {(c.deckIds || []).length ? (
        <ul className="mt-4 space-y-1">
          {c.deckIds.map((deckId) => {
            const deck = decks.find((d) => d.id === deckId);
            return (
              <li key={deckId}>
                <Link
                  href={`/decks/${deckId}`}
                  className="text-sm font-semibold text-ink hover:text-accent"
                >
                  {deck?.title || deckId}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">No decks shared yet.</p>
      )}
      {isOwner ? (
        <div className="mt-4">
          <select
            disabled={busy}
            defaultValue=""
            onChange={(e) => {
              onAddDeck(c.id, e.target.value);
              e.target.value = '';
            }}
            className="h-10 w-full rounded-xl border border-line bg-canvas px-3 text-sm outline-none focus:border-accent"
          >
            <option value="" disabled>
              Add a deck from your library…
            </option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </li>
  );

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <AppNav />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Classes</h1>
        <p className="mt-1 text-sm text-muted">
          Create a class, share the join code, and attach decks for your group.
        </p>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
            <p className="font-bold text-ink">Create a class</p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bio 101"
            />
            <Button onClick={onCreate} disabled={busy || !name.trim()}>
              Create
            </Button>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
            <p className="font-bold text-ink">Join with code</p>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
            />
            <Button variant="secondary" onClick={onJoin} disabled={busy || !code.trim()}>
              Join
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 space-y-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <section>
              <h2 className="font-display text-lg font-bold text-ink mb-3">Your classes</h2>
              {!owned.length ? (
                <p className="text-sm text-muted">You haven&apos;t created a class yet.</p>
              ) : (
                <ul className="space-y-3">{owned.map((c) => renderClass(c, true))}</ul>
              )}
            </section>
            <section>
              <h2 className="font-display text-lg font-bold text-ink mb-3">Joined</h2>
              {!joined.length ? (
                <p className="text-sm text-muted">No joined classes yet.</p>
              ) : (
                <ul className="space-y-3">{joined.map((c) => renderClass(c, false))}</ul>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
