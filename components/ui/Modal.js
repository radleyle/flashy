'use client';

import { useEffect } from 'react';
import Button from './Button';

export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-2xl bg-surface p-6 shadow-soft"
      >
        {title ? (
          <h2 className="font-display text-xl font-semibold text-ink mb-3">{title}</h2>
        ) : null}
        <div className="text-sm text-muted">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          {footer || (
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
