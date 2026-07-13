'use client';

import { useEffect, useMemo, useState } from 'react';
import SessionSummary from './SessionSummary';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MatchMode({ cards, onComplete, deckId }) {
  const limited = useMemo(() => shuffle(cards).slice(0, 6), [cards]);
  const tiles = useMemo(() => {
    const terms = limited.map((c) => ({
      id: `${c.id}-front`,
      pairId: c.id,
      text: c.front,
      side: 'term',
    }));
    const defs = limited.map((c) => ({
      id: `${c.id}-back`,
      pairId: c.id,
      text: c.back,
      side: 'def',
    }));
    return shuffle([...terms, ...defs]);
  }, [limited]);

  const [selected, setSelected] = useState([]);
  const [matched, setMatched] = useState([]);
  const [misses, setMisses] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return undefined;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    return () => clearInterval(t);
  }, [startedAt, done]);

  useEffect(() => {
    if (selected.length !== 2) return undefined;
    const [a, b] = selected;
    const timer = setTimeout(() => {
      if (a.pairId === b.pairId && a.side !== b.side) {
        const next = [...matched, a.pairId];
        setMatched(next);
        if (next.length === limited.length) {
          setDone(true);
          onComplete?.({
            matches: limited.length,
            misses,
            seconds: Math.floor((Date.now() - startedAt) / 1000),
          });
        }
      } else {
        setMisses((m) => m + 1);
      }
      setSelected([]);
    }, 350);
    return () => clearTimeout(timer);
  }, [selected, matched, limited.length, misses, onComplete, startedAt]);

  const pick = (tile) => {
    if (done || matched.includes(tile.pairId)) return;
    if (selected.find((s) => s.id === tile.id)) return;
    if (selected.length >= 2) return;
    setSelected((s) => [...s, tile]);
  };

  if (!limited.length) {
    return <p className="text-center text-muted py-16">Need at least one card to play Match.</p>;
  }

  if (done) {
    return (
      <SessionSummary
        title="Match complete"
        deckId={deckId}
        stats={[
          { label: 'Pairs', value: limited.length },
          { label: 'Misses', value: misses },
          { label: 'Time', value: `${elapsed}s` },
        ]}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between text-sm text-muted">
        <span>
          Matched {matched.length}/{limited.length}
        </span>
        <span>{elapsed}s · misses {misses}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tiles.map((tile) => {
          const isMatched = matched.includes(tile.pairId);
          const isSelected = selected.some((s) => s.id === tile.id);
          return (
            <button
              key={tile.id}
              type="button"
              disabled={isMatched}
              onClick={() => pick(tile)}
              className={`min-h-[96px] rounded-2xl border p-4 text-left text-sm font-medium transition animate-tile-pop ${
                isMatched
                  ? 'border-accent bg-accent-soft text-accent opacity-70'
                  : isSelected
                    ? 'border-accent bg-surface shadow-soft ring-2 ring-accent/30'
                    : 'border-line bg-surface hover:border-accent/50 text-ink'
              }`}
            >
              <span className="block text-[10px] uppercase tracking-wider text-muted mb-1">
                {tile.side === 'term' ? 'Term' : 'Definition'}
              </span>
              {tile.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
