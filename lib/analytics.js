/** First-party product analytics (no third-party SDK). */

export function track(name, props = {}) {
  if (typeof window === 'undefined') return;
  if (!name || typeof name !== 'string') return;
  try {
    const body = JSON.stringify({
      name: name.slice(0, 80),
      props: props && typeof props === 'object' ? props : {},
      path: window.location?.pathname || null,
      ts: Date.now(),
    });
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/events', blob);
      return;
    }
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
