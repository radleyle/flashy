'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import AppNav from '@/components/layout/AppNav';
import Button from '@/components/ui/Button';
import CardEditor, { emptyCard } from '@/components/deck/CardEditor';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import {
  getDeck,
  listCards,
  replaceCards,
  updateDeckMeta,
  deleteDeck,
  setDeckVisibility,
} from '@/lib/firestore/decks';
import { ensureUser, getAiUsage, incrementAiUsage } from '@/lib/firestore/users';
import { canGenerateAi, getPlanLimits } from '@/lib/plans';
import { useFirebaseAuth } from '@/components/providers/FirebaseAuthProvider';
import Skeleton from '@/components/ui/Skeleton';

export default function DeckDetailPage() {
  const { id } = useParams();
  const { user, isLoaded } = useUser();
  const { ready: firebaseReady } = useFirebaseAuth();
  const router = useRouter();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState(null);
  const [folders, setFolders] = useState([]);
  const [aiText, setAiText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [plan, setPlan] = useState('free');

  useEffect(() => {
    if (!isLoaded || !user || !id || !firebaseReady) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const profile = await ensureUser(user.id);
        if (cancelled) return;
        setFolders(profile.folders || []);
        setPlan(profile.plan || 'free');
        const d = await getDeck(id);
        if (cancelled) return;
        if (!d) {
          setError('Deck not found');
          return;
        }
        setDeck(d);
        setTitle(d.title || '');
        setDescription(d.description || '');
        setFolderId(d.folderId || null);
        const c = await listCards(id);
        if (cancelled) return;
        setCards(c.length ? c : [emptyCard(0)]);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('Failed to load deck');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, id, firebaseReady]);

  useEffect(() => {
    if (deck && user && deck.ownerId !== user.id) {
      setError('You do not have access to this deck.');
    }
  }, [deck, user]);

  const reloadDeck = async () => {
    const d = await getDeck(id);
    if (!d) {
      setError('Deck not found');
      return;
    }
    setDeck(d);
    setTitle(d.title || '');
    setDescription(d.description || '');
    setFolderId(d.folderId || null);
    const c = await listCards(id);
    setCards(c.length ? c : [emptyCard(0)]);
  };

  const onGenerate = async () => {
    setError('');
    const used = await getAiUsage(user.id);
    if (!canGenerateAi(plan, used)) {
      const limits = getPlanLimits(plan);
      setError(`AI limit reached (${limits.aiGensPerDay}/day on ${limits.name}).`);
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      const next = (Array.isArray(data) ? data : []).map((c, i) => ({
        id: `temp_${Date.now()}_${i}`,
        front: c.front || '',
        back: c.back || '',
        mastery: 0,
      }));
      setCards(next);
      await incrementAiUsage(user.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateDeckMeta(id, {
        title: title.trim(),
        description: description.trim(),
        folderId: folderId || null,
      });
      const cleaned = cards.filter((c) => c.front.trim() || c.back.trim());
      await replaceCards(id, cleaned);
      setEditing(false);
      await reloadDeck();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleShare = async () => {
    const next = deck.visibility === 'public' ? 'private' : 'public';
    await setDeckVisibility(id, next);
    setDeck((d) => ({ ...d, visibility: next }));
  };

  const shareUrl =
    typeof window !== 'undefined' && deck?.shareSlug
      ? `${window.location.origin}/s/${deck.shareSlug}`
      : '';

  const handleDelete = async () => {
    if (!confirm('Delete this deck permanently?')) return;
    await deleteDeck(id);
    router.push('/library');
  };

  if (error && !deck) {
    return (
      <div className="min-h-screen">
        <AppNav />
        <p className="p-10 text-center text-muted">{error}</p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen">
        <AppNav />
        <main className="mx-auto max-w-3xl px-4 py-10 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
          <div className="grid gap-3 sm:grid-cols-2 pt-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {!editing ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-semibold text-ink">{deck.title}</h1>
                {deck.description ? (
                  <p className="mt-2 text-muted">{deck.description}</p>
                ) : null}
                <p className="mt-2 text-sm text-muted">{deck.cardCount || cards.length} terms</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShareOpen(true)}>
                  Share
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                { mode: 'flashcards', label: 'Flashcards', desc: 'Flip through terms' },
                { mode: 'learn', label: 'Learn', desc: 'Know vs still learning' },
                { mode: 'write', label: 'Write', desc: 'Type the term from memory' },
                { mode: 'match', label: 'Match', desc: 'Pair terms fast' },
              ].map((m) => (
                <Link
                  key={m.mode}
                  href={`/decks/${id}/study/${m.mode}`}
                  className="rounded-2xl border border-line bg-white p-5 shadow-soft transition hover:border-accent"
                >
                  <div className="font-display text-lg font-semibold text-ink">{m.label}</div>
                  <p className="mt-1 text-sm text-muted">{m.desc}</p>
                </Link>
              ))}
            </div>

            <section className="mt-10">
              <h2 className="font-display text-lg font-semibold text-ink mb-4">Terms</h2>
              <ul className="divide-y divide-line border-y border-line">
                {cards.map((card, i) => (
                  <li key={card.id || i} className="grid gap-2 py-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted mb-1">Term</p>
                      <p className="font-medium text-ink">{card.front}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-1">Definition</p>
                      <p className="text-ink">{card.back}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="mb-4 text-sm text-muted hover:text-ink"
            >
              ← Cancel edit
            </button>
            {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
            <CardEditor
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              cards={cards}
              setCards={setCards}
              aiText={aiText}
              setAiText={setAiText}
              onGenerate={onGenerate}
              generating={generating}
              onSave={onSave}
              saving={saving}
              folderId={folderId}
              setFolderId={setFolderId}
              folders={folders}
            />
          </>
        )}
      </main>

      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share deck"
        footer={
          <Button variant="secondary" onClick={() => setShareOpen(false)}>
            Done
          </Button>
        }
      >
        <p className="mb-4">
          Visibility:{' '}
          <strong className="text-ink">
            {deck.visibility === 'public' ? 'Public' : 'Private'}
          </strong>
        </p>
        <Button size="sm" onClick={toggleShare} className="mb-4">
          Make {deck.visibility === 'public' ? 'private' : 'public'}
        </Button>
        {deck.visibility === 'public' ? (
          <div className="space-y-2">
            <Input readOnly value={shareUrl} />
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        ) : (
          <p>Make the deck public to get a shareable link.</p>
        )}
      </Modal>
    </div>
  );
}
