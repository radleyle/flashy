'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';
import SessionSummary from './SessionSummary';
import ExplainCard from '../ai/ExplainCard';

export default function LearnMode({ cards, onMasteryChange, onComplete, deckId, deckTitle }) {
  const queue = useMemo(
    () => [...cards].sort((a, b) => (a.mastery || 0) - (b.mastery || 0)),
    [cards]
  );
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [known, setKnown] = useState(0);
  const [learning, setLearning] = useState(0);
  const [done, setDone] = useState(false);

  const card = queue[index];
  const total = queue.length;
  const progress = total ? ((known + learning) / total) * 100 : 0;

  const answer = useCallback(
    async (knewIt) => {
      if (!card) return;
      const nextMastery = knewIt
        ? Math.min(5, (card.mastery || 0) + 1)
        : Math.max(0, (card.mastery || 0) - 1);
      await onMasteryChange?.(card.id, nextMastery);
      const nextKnown = known + (knewIt ? 1 : 0);
      const nextLearning = learning + (knewIt ? 0 : 1);
      if (knewIt) setKnown(nextKnown);
      else setLearning(nextLearning);

      setRevealed(false);
      if (index + 1 >= total) {
        setDone(true);
        onComplete?.({ known: nextKnown, learning: nextLearning, total });
      } else {
        setIndex((i) => i + 1);
      }
    },
    [card, known, learning, index, total, onMasteryChange, onComplete]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!revealed) setRevealed(true);
      } else if (revealed && e.key === '1') {
        e.preventDefault();
        answer(false);
      } else if (revealed && e.key === '2') {
        e.preventDefault();
        answer(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [revealed, answer]);

  if (!total) {
    return (
      <p className="flex flex-1 items-center justify-center text-muted py-16">
        No cards to learn.
      </p>
    );
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-2xl flex-1 items-center px-4 py-10">
        <SessionSummary
          title="Learn complete"
          deckId={deckId}
          stats={[
            { label: 'Known', value: known },
            { label: 'Still learning', value: learning },
            { label: 'Total', value: total },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl px-4 pt-2 sm:px-6">
        <div className="mb-1 flex justify-between text-sm font-semibold text-muted">
          <span>
            {index + 1} / {total}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-mode-learn transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-mode-learn">
          Term
        </p>
        <p className="font-display max-w-xl text-3xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.15]">
          {card.front}
        </p>
        {revealed ? (
          <div className="mt-10 max-w-xl animate-fadeUp border-t border-line pt-8">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
              Definition
            </p>
            <p className="font-display text-xl sm:text-2xl font-semibold text-ink leading-snug">
              {card.back}
            </p>
          </div>
        ) : (
          <p className="mt-10 text-sm font-semibold text-muted">Space to reveal</p>
        )}
      </div>

      <div className="border-t border-line bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-4 sm:px-6">
          {!revealed ? (
            <Button onClick={() => setRevealed(true)}>Show answer</Button>
          ) : (
            <>
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="secondary" onClick={() => answer(false)}>
                  Still learning
                </Button>
                <Button onClick={() => answer(true)}>Know it</Button>
              </div>
              <ExplainCard
                front={card.front}
                back={card.back}
                deckTitle={deckTitle}
                compact
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
