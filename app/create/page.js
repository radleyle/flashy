'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import AppNav from '@/components/layout/AppNav';
import CardEditor, { emptyCard } from '@/components/deck/CardEditor';
import Skeleton from '@/components/ui/Skeleton';
import { createDeck, listDecks } from '@/lib/firestore/decks';
import { ensureUser, getAiUsage, incrementAiUsage } from '@/lib/firestore/users';
import { canCreateDeck, canGenerateAi, getPlanLimits } from '@/lib/plans';
import { useFirebaseAuth } from '@/components/providers/FirebaseAuthProvider';

export default function CreatePage() {
  const { user, isLoaded } = useUser();
  const { ready: firebaseReady } = useFirebaseAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState(null);
  const [folders, setFolders] = useState([]);
  const [cards, setCards] = useState([emptyCard(0), emptyCard(1)]);
  const [aiText, setAiText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState('free');

  useEffect(() => {
    if (!isLoaded || !user || !firebaseReady) return;
    (async () => {
      const profile = await ensureUser(user.id);
      setFolders(profile.folders || []);
      setPlan(profile.plan || 'free');
    })();
  }, [isLoaded, user, firebaseReady]);

  const onGenerate = async () => {
    if (!user) return;
    setError('');
    const used = await getAiUsage(user.id);
    if (!canGenerateAi(plan, used)) {
      const limits = getPlanLimits(plan);
      setError(`AI limit reached (${limits.aiGensPerDay}/day on ${limits.name}). Upgrade on Pricing.`);
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
      const next = (Array.isArray(data) ? data : data.flashcards || []).map((c, i) => ({
        id: `temp_${Date.now()}_${i}`,
        front: c.front || '',
        back: c.back || '',
        mastery: 0,
      }));
      if (!next.length) throw new Error('No cards returned');
      setCards(next);
      await incrementAiUsage(user.id);
      if (!title.trim()) {
        setTitle(aiText.trim().slice(0, 48) || 'AI deck');
      }
    } catch (e) {
      setError(e.message || 'Could not generate cards');
    } finally {
      setGenerating(false);
    }
  };

  const onSave = async () => {
    if (!user) return;
    setError('');
    setSaving(true);
    try {
      const existing = await listDecks(user.id);
      if (!canCreateDeck(plan, existing.length)) {
        const limits = getPlanLimits(plan);
        throw new Error(
          `Deck limit reached (${limits.maxDecks} on ${limits.name}). Upgrade on Pricing.`
        );
      }
      const cleaned = cards.filter((c) => c.front.trim() || c.back.trim());
      const id = await createDeck({
        ownerId: user.id,
        title,
        description,
        folderId,
        cards: cleaned,
      });
      router.push(`/decks/${id}`);
    } catch (e) {
      setError(e.message || 'Could not save deck');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Create deck
        </h1>
        <p className="mt-1 text-sm text-muted">Add terms manually or generate from notes.</p>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {!firebaseReady ? (
          <div className="mt-8 space-y-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="mt-8">
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
          </div>
        )}
      </main>
    </div>
  );
}
