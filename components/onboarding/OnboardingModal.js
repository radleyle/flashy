'use client';

import { useEffect, useRef, useState } from 'react';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { track } from '@/lib/analytics';

const ONBOARDING_KEY = 'flashy_onboarding_v1';
const LAST_ACTIVE_KEY = 'flashy_last_active';
const WB_SESSION_KEY = 'flashy_wb_session';
const WB_SHOWN_AT_KEY = 'flashy_wb_shown_at';
/** Show welcome-back after this much idle time (3 hours). */
const INACTIVITY_MS = 3 * 60 * 60 * 1000;
/** Don't show welcome-back again within this window (avoids multi-tab spam). */
const WB_COOLDOWN_MS = 30 * 60 * 1000;

const FIRST_STEPS = [
  {
    eyebrow: 'Welcome',
    title: 'Flashy',
    body: 'Build study sets from notes or by hand, then drill them until they stick.',
  },
  {
    eyebrow: 'Study modes',
    title: 'Learn your way',
    body: 'Flashcards, Learn, Write, Match, and practice tests — plus Due today for spaced review.',
  },
  {
    eyebrow: 'Ready',
    title: 'Start strong',
    body: 'Open your library or create a set from lecture notes with AI. You’ve got this.',
  },
];

function touchLastActive() {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

function shouldWelcomeBack() {
  try {
    const lastWb = Number(localStorage.getItem(WB_SHOWN_AT_KEY) || 0);
    if (lastWb && Date.now() - lastWb < WB_COOLDOWN_MS) return false;

    const last = Number(localStorage.getItem(LAST_ACTIVE_KEY) || 0);
    const idleLong = !last || Date.now() - last >= INACTIVITY_MS;
    const alreadyThisSession = Boolean(sessionStorage.getItem(WB_SESSION_KEY));

    // New browser session (reopen app / fresh tab session) → welcome back once
    if (!alreadyThisSession) return true;
    // Same session, but idle too long (tab left open overnight, etc.)
    if (idleLong) return true;
    return false;
  } catch {
    return false;
  }
}

function markWelcomeBackShown() {
  try {
    sessionStorage.setItem(WB_SESSION_KEY, '1');
    localStorage.setItem(WB_SHOWN_AT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  touchLastActive();
}

function OverlayShell({ titleId, eyebrow, title, titleAccent, body, children }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-ink/55 backdrop-blur-md dark:bg-ink/70"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(255,92,74,0.22),transparent_55%)]"
      />
      <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center animate-fadeUp">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">
          {eyebrow}
        </p>
        <h2
          id={titleId}
          className={`font-display font-bold tracking-tight drop-shadow-sm ${
            titleAccent
              ? 'text-5xl sm:text-7xl tracking-[-0.04em] text-accent animate-coral-word'
              : 'text-3xl sm:text-5xl text-white'
          }`}
        >
          {title}
        </h2>
        <p className="mt-5 max-w-md text-base sm:text-lg leading-relaxed text-white/80">
          {body}
        </p>
        {children}
      </div>
    </div>
  );
}

function WelcomeInner() {
  const [mode, setMode] = useState(null); // 'first' | 'back' | null
  const [step, setStep] = useState(0);
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    try {
      const onboarded = Boolean(localStorage.getItem(ONBOARDING_KEY));
      if (!onboarded) {
        shownRef.current = true;
        setMode('first');
        track('onboarding_shown');
        return;
      }
      if (shouldWelcomeBack()) {
        shownRef.current = true;
        markWelcomeBackShown();
        setMode('back');
        track('welcome_back_shown');
        return;
      }
      touchLastActive();
      markWelcomeBackShown();
    } catch {
      /* ignore */
    }
  }, []);

  // Keep last-active fresh while using the app (so short breaks don't re-trigger)
  useEffect(() => {
    touchLastActive();
    const onVis = () => {
      if (document.visibilityState === 'visible') touchLastActive();
    };
    const id = window.setInterval(touchLastActive, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(() => {
    if (!mode) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') dismiss('escape');
      if (mode === 'first' && (e.key === 'Enter' || e.key === 'ArrowRight')) {
        e.preventDefault();
        if (step < FIRST_STEPS.length - 1) setStep((s) => s + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, step]);

  const dismiss = (reason) => {
    try {
      if (mode === 'first') localStorage.setItem(ONBOARDING_KEY, '1');
      markWelcomeBackShown();
      touchLastActive();
    } catch {
      /* ignore */
    }
    track(mode === 'first' ? 'onboarding_dismissed' : 'welcome_back_dismissed', {
      reason,
      step,
    });
    setMode(null);
  };

  if (mode === 'back') {
    return (
      <OverlayShell
        titleId="welcome-back-title"
        eyebrow="Welcome back"
        title="Flashy"
        titleAccent
        body="Pick up where you left off — jump into your library, or make a new set."
      >
        <div className="mt-10 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/library" onClick={() => dismiss('library')}>
            <Button size="lg">Open library</Button>
          </Link>
          <Link href="/create" onClick={() => dismiss('create')}>
            <Button
              size="lg"
              variant="secondary"
              className="border-white/25 bg-white/10 text-white hover:bg-white/20"
            >
              Create a set
            </Button>
          </Link>
        </div>
        <button
          type="button"
          onClick={() => dismiss('continue')}
          className="mt-5 text-sm font-semibold text-white/55 hover:text-white"
        >
          Continue studying
        </button>
      </OverlayShell>
    );
  }

  if (mode !== 'first') return null;

  const current = FIRST_STEPS[step];
  const last = step >= FIRST_STEPS.length - 1;

  return (
    <OverlayShell
      titleId="onboarding-title"
      eyebrow={current.eyebrow}
      title={current.title}
      titleAccent={step === 0}
      body={current.body}
    >
      <div className="mt-8 flex items-center gap-2" aria-hidden>
        {FIRST_STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === step ? 'w-8 bg-accent' : 'w-1.5 bg-white/35'
            }`}
          />
        ))}
      </div>

      <div className="mt-10 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {!last ? (
          <>
            <Button size="lg" onClick={() => setStep((s) => s + 1)}>
              Continue
            </Button>
            <button
              type="button"
              onClick={() => dismiss('skip')}
              className="text-sm font-semibold text-white/55 hover:text-white"
            >
              Skip intro
            </button>
          </>
        ) : (
          <>
            <Link href="/create" onClick={() => dismiss('create')}>
              <Button size="lg">Create a set</Button>
            </Link>
            <Link href="/library" onClick={() => dismiss('library')}>
              <Button
                size="lg"
                variant="secondary"
                className="border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                Open library
              </Button>
            </Link>
          </>
        )}
      </div>
    </OverlayShell>
  );
}

/** Clear session flag on sign-out so the next sign-in can welcome them back. */
function ClearWelcomeSession() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(WB_SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}

export default function OnboardingModal() {
  return (
    <>
      <SignedIn>
        <WelcomeInner />
      </SignedIn>
      <SignedOut>
        <ClearWelcomeSession />
      </SignedOut>
    </>
  );
}
