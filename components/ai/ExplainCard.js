'use client';

import { useState } from 'react';
import Button from '../ui/Button';
import { useAiQuota } from '@/lib/hooks/useAiQuota';

export default function ExplainCard({
  front,
  back,
  deckTitle,
  onUseAi,
  compact = false,
}) {
  const { consume } = useAiQuota();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [tip, setTip] = useState('');
  const [error, setError] = useState('');

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    if (!front?.trim() || !back?.trim()) return;
    setOpen(true);
    if (explanation) return;

    setLoading(true);
    setError('');
    try {
      if (onUseAi) {
        const ok = await onUseAi();
        if (!ok) {
          setOpen(false);
          setLoading(false);
          return;
        }
      } else {
        const result = await consume();
        if (!result.ok) {
          setError(result.error);
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ front, back, deckTitle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Explain failed');
      setExplanation(data.explanation || '');
      setTip(data.tip || '');
    } catch (e) {
      setError(e.message || 'Could not explain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? '' : 'mt-2'}>
      <Button
        size="sm"
        variant="ghost"
        onClick={toggle}
        disabled={!front?.trim() || !back?.trim() || loading}
        className="!px-2"
      >
        {loading ? 'Explaining…' : open ? 'Hide explain' : 'Explain with AI'}
      </Button>

      {open ? (
        <div className="mt-2 rounded-xl border border-line bg-canvas px-3.5 py-3 text-sm text-left">
          {loading && !explanation ? <p className="text-muted">Thinking…</p> : null}
          {error ? <p className="text-red-600">{error}</p> : null}
          {explanation ? (
            <>
              <p className="text-ink leading-relaxed">{explanation}</p>
              {tip ? (
                <p className="mt-2 text-muted">
                  <span className="font-bold text-accent">Tip:</span> {tip}
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
