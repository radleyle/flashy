'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import StudyShell from '@/components/layout/StudyShell';
import FlashcardPlayer from '@/components/study/FlashcardPlayer';
import LearnMode from '@/components/study/LearnMode';
import MatchMode from '@/components/study/MatchMode';
import WriteMode from '@/components/study/WriteMode';
import Skeleton from '@/components/ui/Skeleton';
import { getDeck, listCards, updateCardMastery } from '@/lib/firestore/decks';
import { createStudySession } from '@/lib/firestore/progress';
import { useFirebaseAuth } from '@/components/providers/FirebaseAuthProvider';

const MODES = ['flashcards', 'learn', 'match', 'write'];

export default function StudyPage() {
  const { id, mode } = useParams();
  const { user, isLoaded } = useUser();
  const { ready: firebaseReady } = useFirebaseAuth();
  const router = useRouter();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!MODES.includes(mode)) {
      router.replace(`/decks/${id}/study/flashcards`);
    }
  }, [mode, id, router]);

  useEffect(() => {
    if (!isLoaded || !user || !id || !firebaseReady) return;
    (async () => {
      try {
        const d = await getDeck(id);
        if (!d || d.ownerId !== user.id) {
          setError('Deck not found');
          return;
        }
        setDeck(d);
        setCards(await listCards(id));
      } catch (e) {
        console.error(e);
        setError('Failed to load study session');
      }
    })();
  }, [isLoaded, user, id, firebaseReady]);

  const saveSession = useCallback(
    async (results) => {
      if (!user) return;
      try {
        await createStudySession({
          userId: user.id,
          deckId: id,
          mode,
          results,
        });
      } catch (e) {
        console.error(e);
      }
    },
    [user, id, mode]
  );

  const onMasteryChange = async (cardId, mastery) => {
    await updateCardMastery(id, cardId, mastery);
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, mastery } : c))
    );
  };

  if (error) {
    return (
      <StudyShell title="Study" deckId={id}>
        <p className="text-center text-muted py-16">{error}</p>
      </StudyShell>
    );
  }

  if (!deck) {
    return (
      <StudyShell title="Study" deckId={id}>
        <div className="mx-auto max-w-2xl space-y-4 py-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-72 w-full rounded-3xl" />
          <div className="flex justify-between">
            <Skeleton className="h-11 w-28" />
            <Skeleton className="h-11 w-28" />
          </div>
        </div>
      </StudyShell>
    );
  }

  const title = `${deck.title} · ${mode.charAt(0).toUpperCase()}${mode.slice(1)}`;

  return (
    <StudyShell title={title} deckId={id}>
      {mode === 'flashcards' ? (
        <FlashcardPlayer cards={cards} deckId={id} onComplete={saveSession} />
      ) : null}
      {mode === 'learn' ? (
        <LearnMode
          cards={cards}
          deckId={id}
          onMasteryChange={onMasteryChange}
          onComplete={saveSession}
        />
      ) : null}
      {mode === 'match' ? (
        <MatchMode cards={cards} deckId={id} onComplete={saveSession} />
      ) : null}
      {mode === 'write' ? (
        <WriteMode
          cards={cards}
          deckId={id}
          onMasteryChange={onMasteryChange}
          onComplete={saveSession}
        />
      ) : null}
    </StudyShell>
  );
}
