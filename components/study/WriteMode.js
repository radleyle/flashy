'use client';

import { useMemo, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import SessionSummary from './SessionSummary';
import { nextReviewDate } from '@/lib/srs';

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

export default function WriteMode({ cards, onMasteryChange, onComplete, deckId }) {
  const queue = useMemo(
    () => [...cards].sort((a, b) => (a.mastery || 0) - (b.mastery || 0)),
    [cards]
  );
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);
  const [coach, setCoach] = useState(null);
  const [coaching, setCoaching] = useState(false);
  const [lastHint, setLastHint] = useState('');

  const card = queue[index];
  const total = queue.length;
  const progress = total ? ((correct + wrong) / total) * 100 : 0;

  const loadCoach = async (userAnswer) => {
    setCoaching(true);
    setCoach(null);
    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: card.front,
          back: card.back,
          userAnswer,
        }),
      });
      const data = await res.json();
      if (res.ok) setCoach(data);
    } catch {
      // ignore
    } finally {
      setCoaching(false);
    }
  };

  const check = async () => {
    if (!card || feedback) return;
    const ok = normalize(answer) === normalize(card.front);
    setFeedback(ok ? 'correct' : 'wrong');
    const nextMastery = ok
      ? Math.min(5, (card.mastery || 0) + 1)
      : Math.max(0, (card.mastery || 0) - 1);
    setLastHint(`Next review ${nextReviewDate(nextMastery)}`);
    await onMasteryChange?.(card.id, nextMastery);
    if (ok) setCorrect((c) => c + 1);
    else {
      setWrong((w) => w + 1);
      loadCoach(answer);
    }
  };

  const next = () => {
    const nextCorrect = feedback === 'correct' ? correct : correct;
    const nextWrong = feedback === 'wrong' ? wrong : wrong;
    setAnswer('');
    setFeedback(null);
    setCoach(null);
    if (index + 1 >= total) {
      setDone(true);
      onComplete?.({
        correct: nextCorrect,
        wrong: nextWrong,
        total,
      });
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (!total) {
    return <p className="text-center text-muted py-16">No cards to practice.</p>;
  }

  if (done) {
    return (
      <SessionSummary
        title="Write complete"
        deckId={deckId}
        stats={[
          { label: 'Correct', value: correct },
          { label: 'Missed', value: wrong },
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
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-line bg-surface shadow-soft p-8 min-h-[240px]">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">
          Definition · mastery {card.mastery || 0}/5
        </p>
        {lastHint ? (
          <p className="mb-3 text-xs font-semibold text-muted">{lastHint}</p>
        ) : null}
        <p className="font-display text-2xl font-semibold text-ink leading-snug">
          {card.back}
        </p>
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.imageUrl}
            alt=""
            className="mt-4 max-h-40 rounded-xl border border-line object-contain"
          />
        ) : null}
        <div className="mt-8">
          <Input
            label="Type the term"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (!feedback) check();
                else next();
              }
            }}
            disabled={!!feedback}
            placeholder="Your answer…"
            autoFocus
          />
        </div>
        {feedback ? (
          <p
            className={`mt-4 text-sm font-medium ${
              feedback === 'correct' ? 'text-accent' : 'text-red-600'
            }`}
          >
            {feedback === 'correct'
              ? 'Correct'
              : `Not quite — answer: ${card.front}`}
          </p>
        ) : null}
        {feedback === 'wrong' ? (
          <div className="mt-4 rounded-xl border border-line bg-canvas p-4 text-sm">
            {coaching ? (
              <p className="text-muted">Coach is thinking…</p>
            ) : coach ? (
              <div className="space-y-2">
                <p className="font-semibold text-ink">{coach.why}</p>
                <p className="text-muted">Tip: {coach.tip}</p>
                <p className="text-accent font-medium">{coach.encouragement}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        {!feedback ? (
          <Button onClick={check} disabled={!answer.trim()}>
            Check
          </Button>
        ) : (
          <Button onClick={next}>{index + 1 >= total ? 'Finish' : 'Next'}</Button>
        )}
      </div>
    </div>
  );
}
