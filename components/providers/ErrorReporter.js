'use client';

import { useEffect } from 'react';

function reasonMessage(reason) {
  if (!reason) return 'Unknown error';
  if (typeof reason === 'string') return reason;
  if (reason instanceof Error) return reason.message || reason.name;
  if (typeof Event !== 'undefined' && reason instanceof Event) {
    return reason.type ? `Event:${reason.type}` : 'Event';
  }
  try {
    return JSON.stringify(reason);
  } catch {
    return String(reason);
  }
}

/** Reports uncaught client errors to /api/errors (logged on the server / Vercel). */
export default function ErrorReporter() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const send = (payload) => {
      try {
        const body = JSON.stringify({
          ...payload,
          url: window.location.href,
        });
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      } catch {
        // ignore
      }
    };

    const onError = (event) => {
      // Ignore noisy resource / next noise
      if (!event.message || event.message === '[object Event]') return;
      send({
        type: event.error?.name || 'Error',
        message: event.message || event.error?.message,
        stack: event.error?.stack,
        source: 'window.onerror',
      });
    };
    const onRejection = (event) => {
      const reason = event.reason;
      // Next/Clerk sometimes reject with bare Events — ignore those
      if (typeof Event !== 'undefined' && reason instanceof Event) return;
      const message = reasonMessage(reason);
      if (!message || message === '[object Event]') return;
      send({
        type: reason?.name || 'UnhandledRejection',
        message,
        stack: reason?.stack,
        source: 'unhandledrejection',
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
