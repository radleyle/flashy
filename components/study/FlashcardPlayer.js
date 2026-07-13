'use client';

import { useEffect, useState, useCallback } from 'react';
import Button from '../ui/Button';
import SessionSummary from './SessionSummary';

export default function FlashcardPlayer({ cards, onComplete, deckId }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  const card = cards[index];
  const total = cards.length;

  const finish = useCallback(() => {
    setDone(true);
    onComplete?.({ reviewed: total });
  }, [onComplete, total]);

  const go = useCallback(
    (next) => {
      setFlipped(false);
      setIndex((i) => {
        const n = i + next;
        if (n < 0) return 0;
        if (n >= total) {
          finish();
          return i;
        }
        return n;
      });
    },
    [total, finish]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        go(1);
      } else if (e.key === 'ArrowLeft') {
        go(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  if (!card) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-xl font-semibold">No cards in this deck</p>
      </div>
    );
  }

  if (done) {
    return (
      <SessionSummary
        title="Flashcards complete"
        deckId={deckId}
        stats={[
          { label: 'Reviewed', value: total },
          { label: 'Cards', value: total },
          { label: 'Mode', value: 'Flip' },
        ]}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between text-sm text-muted">
        <span>
          {index + 1} / {total}
        </span>
        <span>Space to flip · arrows to navigate</span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="perspective-1000 w-full text-left"
      >
        <div
          className={`relative h-72 sm:h-80 w-full transition-transform duration-500 preserve-3d ${
            flipped ? 'rotate-y-180' : ''
          }`}
        >
          <div className="absolute inset-0 backface-hidden rounded-3xl border border-line bg-white shadow-soft p-8 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">
              Term
            </p>
            <p className="font-display text-2xl sm:text-3xl font-semibold text-ink leading-snug">
              {card.front}
            </p>
          </div>
          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl border border-line bg-accent-soft shadow-soft p-8 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">
              Definition
            </p>
            <p className="font-display text-2xl sm:text-3xl font-semibold text-ink leading-snug">
              {card.back}
            </p>
          </div>
        </div>
      </button>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="secondary" onClick={() => go(-1)} disabled={index === 0}>
          Previous
        </Button>
        <Button onClick={() => go(1)}>
          {index === total - 1 ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
