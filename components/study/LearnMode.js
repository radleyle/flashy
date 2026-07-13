'use client';

import { useMemo, useState } from 'react';
import Button from '../ui/Button';
import SessionSummary from './SessionSummary';

export default function LearnMode({ cards, onMasteryChange, onComplete, deckId }) {
  const queue = useMemo(() => [...cards].sort((a, b) => (a.mastery || 0) - (b.mastery || 0)), [cards]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [known, setKnown] = useState(0);
  const [learning, setLearning] = useState(0);
  const [done, setDone] = useState(false);

  const card = queue[index];
  const total = queue.length;
  const progress = total ? ((known + learning) / total) * 100 : 0;

  const answer = async (knewIt) => {
    if (!card) return;
    const nextMastery = knewIt
      ? Math.min(5, (card.mastery || 0) + 1)
      : Math.max(0, (card.mastery || 0) - 1);
    await onMasteryChange?.(card.id, nextMastery);
    if (knewIt) setKnown((k) => k + 1);
    else setLearning((l) => l + 1);

    setRevealed(false);
    if (index + 1 >= total) {
      setDone(true);
      onComplete?.({ known: known + (knewIt ? 1 : 0), learning: learning + (knewIt ? 0 : 1), total });
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (!total) {
    return <p className="text-center text-muted py-16">No cards to learn.</p>;
  }

  if (done) {
    return (
      <SessionSummary
        title="Learn complete"
        deckId={deckId}
        stats={[
          { label: 'Known', value: known },
          { label: 'Still learning', value: learning },
          { label: 'Total', value: total },
        ]}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm text-muted">
          <span>
            Card {index + 1} of {total}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-line">
          <div
            className="h-full origin-left rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-line bg-white shadow-soft p-8 min-h-[280px] flex flex-col justify-center animate-flip-in">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">Term</p>
        <p className="font-display text-2xl sm:text-3xl font-semibold text-ink">{card.front}</p>
        {revealed ? (
          <div className="mt-8 border-t border-line pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
              Definition
            </p>
            <p className="text-lg text-ink leading-relaxed">{card.back}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {!revealed ? (
          <Button onClick={() => setRevealed(true)}>Show answer</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={() => answer(false)}>
              Still learning
            </Button>
            <Button onClick={() => answer(true)}>Know</Button>
          </>
        )}
      </div>
    </div>
  );
}
