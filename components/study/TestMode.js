'use client';

import { useMemo, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import SessionSummary from './SessionSummary';

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(cards) {
  return shuffle(cards)
    .slice(0, Math.min(cards.length, 20))
    .map((card, i) => {
      const useMc = i % 2 === 0 && cards.length >= 4;
      if (useMc) {
        const distractors = shuffle(cards.filter((c) => c.id !== card.id))
          .slice(0, 3)
          .map((c) => c.front);
        const options = shuffle([card.front, ...distractors]);
        return { card, type: 'mc', options, prompt: card.back };
      }
      return { card, type: 'written', options: null, prompt: card.back };
    });
}

export default function TestMode({ cards, onComplete, deckId }) {
  const questions = useMemo(() => buildQuestions(cards), [cards]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);
  const [missed, setMissed] = useState([]);

  const q = questions[index];
  const total = questions.length;
  const progress = total ? ((correct + wrong) / total) * 100 : 0;

  const submit = (value) => {
    if (!q || done) return;
    const ok = normalize(value) === normalize(q.card.front);
    const nextCorrect = correct + (ok ? 1 : 0);
    const nextWrong = wrong + (ok ? 0 : 1);
    const nextMissed = ok
      ? missed
      : [...missed, { front: q.card.front, back: q.card.back, given: value }];
    setCorrect(nextCorrect);
    setWrong(nextWrong);
    setMissed(nextMissed);
    setAnswer('');
    if (index + 1 >= total) {
      setDone(true);
      onComplete?.({
        correct: nextCorrect,
        wrong: nextWrong,
        total,
        score: Math.round((nextCorrect / total) * 100),
      });
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (!total) {
    return <p className="text-center text-muted py-16">Need cards for a practice test.</p>;
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <SessionSummary
          title="Practice test complete"
          deckId={deckId}
          stats={[
            { label: 'Score', value: `${Math.round((correct / total) * 100)}%` },
            { label: 'Correct', value: correct },
            { label: 'Missed', value: wrong },
          ]}
        />
        {missed.length ? (
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
            <h3 className="font-display text-lg font-bold text-ink">Review misses</h3>
            <ul className="mt-3 space-y-3">
              {missed.map((m, i) => (
                <li key={i} className="text-sm">
                  <p className="font-semibold text-ink">{m.front}</p>
                  <p className="text-muted">{m.back}</p>
                  <p className="text-red-600">You wrote: {m.given || '(blank)'}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm text-muted">
          <span>
            Question {index + 1} of {total}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-mode-test transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-line bg-surface shadow-soft p-8 min-h-[240px]">
        <p className="text-xs font-semibold uppercase tracking-wider text-mode-test mb-3">
          {q.type === 'mc' ? 'Multiple choice' : 'Written'}
        </p>
        <p className="font-display text-2xl font-semibold text-ink leading-snug">{q.prompt}</p>

        {q.type === 'mc' ? (
          <div className="mt-8 grid gap-2">
            {q.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => submit(opt)}
                className="rounded-xl border border-line bg-canvas px-4 py-3 text-left text-sm font-semibold text-ink hover:border-mode-test hover:bg-mode-test/5 transition"
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            <Input
              label="Type the term"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && answer.trim()) {
                  e.preventDefault();
                  submit(answer);
                }
              }}
              placeholder="Your answer…"
              autoFocus
            />
            <Button onClick={() => submit(answer)} disabled={!answer.trim()}>
              Submit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
