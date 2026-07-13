'use client';

import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function StudyPlanModal({ open, onClose, title, cards, onUseAi }) {
  const [examDays, setExamDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');

  const generate = async () => {
    setError('');
    setLoading(true);
    setPlan(null);
    try {
      if (onUseAi && !(await onUseAi())) {
        setLoading(false);
        return;
      }
      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          examDays,
          cards: cards.slice(0, 30).map((c) => ({ front: c.front, back: c.back })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Plan failed');
      setPlan(data);
    } catch (e) {
      setError(e.message || 'Could not build plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="AI study plan"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={generate} disabled={loading}>
            {loading ? 'Planning…' : plan ? 'Regenerate' : 'Generate plan'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Days until exam"
          type="number"
          min={2}
          max={21}
          value={examDays}
          onChange={(e) => setExamDays(Number(e.target.value) || 7)}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {plan ? (
          <div className="space-y-3">
            <p className="text-sm text-ink font-semibold">{plan.summary}</p>
            <ul className="space-y-2">
              {(plan.days || []).map((d) => (
                <li
                  key={d.day}
                  className="rounded-xl border border-line bg-canvas px-3 py-2 text-sm"
                >
                  <p className="font-bold text-ink">
                    Day {d.day} · {d.minutes || 20} min
                  </p>
                  <p className="text-muted">{d.focus}</p>
                  {d.cardHint ? (
                    <p className="mt-1 text-xs text-muted">{d.cardHint}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Get a day-by-day plan based on this deck and your exam date.
          </p>
        )}
      </div>
    </Modal>
  );
}
