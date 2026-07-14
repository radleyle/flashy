'use client';

import { useMemo } from 'react';
import { speak, speechSupported } from '@/lib/speech';

export default function SpeakButton({ text, lang, className = '' }) {
  const ok = useMemo(() => speechSupported(), []);
  if (!ok || !text?.trim()) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        speak(text, lang);
      }}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-line text-xs font-bold text-muted hover:border-accent hover:text-accent ${className}`}
      aria-label="Pronounce"
      title="Pronounce"
    >
      ♪
    </button>
  );
}
