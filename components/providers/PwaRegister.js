'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

export default function PwaRegister() {
  const [deferred, setDeferred] = useState(null);
  const [online, setOnline] = useState(true);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    setOnline(navigator.onLine);
    setDismissed(localStorage.getItem('flashy_install_dismissed') === '1');

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const onBip = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const dismissInstall = () => {
    setDeferred(null);
    setDismissed(true);
    try {
      localStorage.setItem('flashy_install_dismissed', '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {!online ? (
        <div className="fixed inset-x-0 top-0 z-[60] bg-ink px-4 py-2 text-center text-sm font-semibold text-white">
          You’re offline — studying cached sets still works. AI and sync need a connection.
        </div>
      ) : null}
      {deferred && !dismissed ? (
        <div className="fixed bottom-20 left-4 right-4 z-[60] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card sm:bottom-6">
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-ink">Install Flashy</p>
            <p className="text-xs text-muted">Add to your home screen for faster study.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" size="sm" onClick={dismissInstall}>
              Not now
            </Button>
            <Button size="sm" onClick={install}>
              Install
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
