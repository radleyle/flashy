'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import StudyShell from '@/components/layout/StudyShell';
import FlashcardPlayer from '@/components/study/FlashcardPlayer';
import LearnMode from '@/components/study/LearnMode';
import MatchMode from '@/components/study/MatchMode';
import WriteMode from '@/components/study/WriteMode';
import TestMode from '@/components/study/TestMode';
import KeyboardTips from '@/components/study/KeyboardTips';
import Skeleton from '@/components/ui/Skeleton';
import { getDeck, listCards, updateCardMastery } from '@/lib/firestore/decks';
import { createStudySession } from '@/lib/firestore/progress';
import { useFirebaseAuth } from '@/components/providers/FirebaseAuthProvider';
import { isDue, nextReviewDate, sortByDue } from '@/lib/srs';
import { track } from '@/lib/analytics';
import {
  cacheDeckOffline,
  flushMasteryQueue,
  getCachedDeck,
  queueMasteryUpdate,
} from '@/lib/offline';

const MODES = ['flashcards', 'learn', 'match', 'write', 'test'];

export default function StudyPageInner() {
  const { id, mode } = useParams();
  const searchParams = useSearchParams();
  const dueOnly = searchParams.get('due') === '1';
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
    if (!isLoaded || !user || !id) return;
    if (!firebaseReady) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        getCachedDeck(id).then((cached) => {
          if (cached?.deck) {
            setDeck(cached.deck);
            setCards(cached.cards || []);
          }
        });
      }
      return;
    }
    (async () => {
      try {
        const d = await getDeck(id);
        const canAccess =
          d &&
          (d.ownerId === user.id ||
            (d.readerIds || []).includes(user.id) ||
            d.visibility === 'public');
        if (!canAccess) {
          setError('Deck not found');
          return;
        }
        const cardList = await listCards(id);
        setDeck(d);
        setCards(cardList);
        cacheDeckOffline(d, cardList).catch(() => {});
        track('study_started', { mode, dueOnly: dueOnly ? 1 : 0 });
      } catch (e) {
        console.error(e);
        try {
          const cached = await getCachedDeck(id);
          if (cached?.deck && cached?.cards?.length) {
            setDeck(cached.deck);
            setCards(cached.cards);
            return;
          }
        } catch {
          /* ignore */
        }
        setError('Failed to load study session');
      }
    })();
  }, [isLoaded, user, id, firebaseReady, mode, dueOnly]);

  useEffect(() => {
    const flush = () => {
      flushMasteryQueue(updateCardMastery).catch(() => {});
    };
    window.addEventListener('online', flush);
    if (navigator.onLine) flush();
    return () => window.removeEventListener('online', flush);
  }, []);

  const studyCards = useMemo(() => {
    let list = cards;
    if (dueOnly) list = list.filter((c) => isDue(c));
    return sortByDue(list);
  }, [cards, dueOnly]);

  const saveSession = useCallback(
    async (results) => {
      if (!user) return;
      if (!navigator.onLine) return;
      try {
        await createStudySession({
          userId: user.id,
          deckId: id,
          mode: dueOnly ? `${mode}-due` : mode,
          results,
        });
      } catch (e) {
        console.error(e);
      }
    },
    [user, id, mode, dueOnly]
  );

  const onMasteryChange = async (cardId, mastery) => {
    const nextAt = nextReviewDate(mastery);
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId ? { ...c, mastery, nextReviewAt: nextAt } : c
      )
    );
    try {
      if (!navigator.onLine) throw new Error('offline');
      await updateCardMastery(id, cardId, mastery);
    } catch {
      await queueMasteryUpdate(id, cardId, mastery);
    }
  };

  if (error) {
    return (
      <StudyShell title="Study" deckId={id} right={<KeyboardTips />}>
        <p className="text-center text-muted py-16">{error}</p>
      </StudyShell>
    );
  }

  if (!deck) {
    return (
      <StudyShell title="Study" deckId={id} right={<KeyboardTips />}>
        <div className="mx-auto max-w-2xl space-y-4 py-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
      </StudyShell>
    );
  }

  const title = `${deck.title} · ${dueOnly ? 'Due · ' : ''}${mode.charAt(0).toUpperCase()}${mode.slice(1)}`;
  const focusMode = mode === 'flashcards' || mode === 'learn';
  const shortTitle = focusMode
    ? `${indexSafeTitle(deck.title)}${dueOnly ? ' · Due' : ''}`
    : title;

  return (
    <StudyShell
      title={shortTitle}
      deckId={id}
      right={<KeyboardTips />}
      focus={focusMode}
    >
      {dueOnly && !studyCards.length ? (
        <p className="flex flex-1 items-center justify-center text-muted py-16">
          Nothing due today — nice work. Study the full set anytime.
        </p>
      ) : null}
      {mode === 'flashcards' && studyCards.length ? (
        <FlashcardPlayer
          cards={studyCards}
          deckId={id}
          deckTitle={deck.title}
          onComplete={saveSession}
        />
      ) : null}
      {mode === 'learn' && studyCards.length ? (
        <LearnMode
          cards={studyCards}
          deckId={id}
          deckTitle={deck.title}
          onMasteryChange={onMasteryChange}
          onComplete={saveSession}
        />
      ) : null}
      {mode === 'match' && studyCards.length ? (
        <MatchMode cards={studyCards} deckId={id} onComplete={saveSession} />
      ) : null}
      {mode === 'write' && studyCards.length ? (
        <WriteMode
          cards={studyCards}
          deckId={id}
          onMasteryChange={onMasteryChange}
          onComplete={saveSession}
        />
      ) : null}
      {mode === 'test' && studyCards.length ? (
        <TestMode cards={studyCards} deckId={id} onComplete={saveSession} />
      ) : null}
    </StudyShell>
  );
}

function indexSafeTitle(t) {
  if (!t) return 'Study';
  return t.length > 28 ? `${t.slice(0, 26)}…` : t;
}
