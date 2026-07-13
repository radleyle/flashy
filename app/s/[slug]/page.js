'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import StudyShell from '@/components/layout/StudyShell';
import FlashcardPlayer from '@/components/study/FlashcardPlayer';
import { getDeckByShareSlug, listCards } from '@/lib/firestore/decks';

export default function SharedDeckPage() {
  const { slug } = useParams();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const d = await getDeckByShareSlug(slug);
        if (!d) {
          setError('This shared deck is private or does not exist.');
          return;
        }
        setDeck(d);
        setCards(await listCards(d.id));
      } catch (e) {
        console.error(e);
        setError('Could not load shared deck.');
      }
    })();
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted">{error}</p>
        <Link href="/" className="text-accent font-semibold">
          Go to Flash
        </Link>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Loading shared deck…
      </div>
    );
  }

  return (
    <StudyShell
      title={`${deck.title} (shared)`}
      backHref="/"
      right={
        <Link href="/" className="text-sm font-semibold text-accent">
          Flash
        </Link>
      }
    >
      <FlashcardPlayer cards={cards} deckId={deck.id} />
    </StudyShell>
  );
}
