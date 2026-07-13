'use client';

import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const TIPS = [
  { keys: 'Space / Enter', action: 'Flip card (Flashcards)' },
  { keys: '← →', action: 'Previous / next card' },
  { keys: 'Enter', action: 'Check or submit answer (Write / Test)' },
  { keys: '1 / 2', action: 'Still learning / Know (Learn)' },
  { keys: '?', action: 'Open this cheat sheet' },
];

export default function KeyboardTips() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        const tag = e.target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-line px-2 py-1 text-xs font-bold text-muted hover:text-ink"
        title="Keyboard shortcuts"
      >
        ?
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Keyboard shortcuts"
        footer={
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        }
      >
        <ul className="space-y-3">
          {TIPS.map((t) => (
            <li key={t.keys} className="flex items-start justify-between gap-4 text-sm">
              <kbd className="rounded-md border border-line bg-canvas px-2 py-1 font-mono text-xs text-ink">
                {t.keys}
              </kbd>
              <span className="text-muted text-right">{t.action}</span>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
