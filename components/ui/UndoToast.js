'use client';

import { useEffect, useState } from 'react';
import Button from './Button';
import { clearDeletedDeck, peekDeletedDeck } from '@/lib/undo';

export default function UndoToast({ onUndo }) {
  const [item, setItem] = useState(null);

  useEffect(() => {
    setItem(peekDeletedDeck());
    const t = setInterval(() => {
      const next = peekDeletedDeck();
      setItem(next);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  if (!item) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-card sm:bottom-6">
      <p className="text-sm font-semibold text-ink">Deck deleted</p>
      <Button
        size="sm"
        variant="secondary"
        onClick={async () => {
          await onUndo?.(item);
          clearDeletedDeck();
          setItem(null);
        }}
      >
        Undo
      </Button>
      <button
        type="button"
        className="text-xs text-muted hover:text-ink"
        onClick={() => {
          clearDeletedDeck();
          setItem(null);
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
