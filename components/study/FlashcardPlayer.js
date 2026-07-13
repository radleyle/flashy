'use client';

import { useEffect, useState, useCallback } from 'react';
import Button from '../ui/Button';
import SessionSummary from './SessionSummary';
import ExplainCard from '../ai/ExplainCard';

export default function FlashcardPlayer({ cards, onComplete, deckId, deckTitle }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  const card = cards[index];
  const total = cards.length;
  const progress = total ? ((index + 1) / total) * 100 : 0;

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
      <div className="flex flex-1 items-center justify-center py-20">
        <p className="font-display text-xl font-bold">No cards in this deck</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-2xl flex-1 items-center px-4 py-10">
        <SessionSummary
          title="Flashcards complete"
          deckId={deckId}
          stats={[
            { label: 'Reviewed', value: total },
            { label: 'Cards', value: total },
            { label: 'Mode', value: 'Flip' },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl px-4 pt-2 sm:px-6">
        <div className="mb-1 flex items-center justify-between text-sm font-semibold text-muted">
          <span>
            {index + 1} / {total}
          </span>
          <span className="hidden sm:inline font-medium">Space flip · ← →</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-mode-flash transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
      >
        <p
          className={`mb-4 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
            flipped ? 'text-accent' : 'text-mode-flash'
          }`}
        >
          {flipped ? 'Definition' : 'Term'}
        </p>
        <div
          key={`${card.id}-${flipped}`}
          className="animate-fadeUp max-w-xl"
        >
          <p className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.15]">
            {flipped ? card.back : card.front}
          </p>
          {!flipped && card.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.imageUrl}
              alt=""
              className="mx-auto mt-6 max-h-36 rounded-xl object-contain"
            />
          ) : null}
        </div>
        <p className="mt-10 text-sm font-semibold text-muted">
          Tap anywhere to flip
        </p>
      </button>

      <div className="border-t border-line bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => go(-1)} disabled={index === 0}>
              Previous
            </Button>
            <Button onClick={() => go(1)}>
              {index === total - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
          {flipped ? (
            <ExplainCard
              front={card.front}
              back={card.back}
              deckTitle={deckTitle}
              compact
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
