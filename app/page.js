'use client';

import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import AppNav from '@/components/layout/AppNav';
import Button from '@/components/ui/Button';

const MODES = [
  { name: 'Flashcards', desc: 'Flip until it sticks', color: 'bg-mode-flash' },
  { name: 'Learn', desc: 'Know it or still learning', color: 'bg-mode-learn' },
  { name: 'Write', desc: 'Type from memory', color: 'bg-mode-write' },
  { name: 'Match', desc: 'Race to pair them', color: 'bg-mode-match' },
];

const STEPS = [
  {
    n: '01',
    title: 'Create a set',
    body: 'Add terms by hand or paste notes and generate with AI.',
  },
  {
    n: '02',
    title: 'Pick a mode',
    body: 'Flashcards, Learn, Write, or Match — switch anytime.',
  },
  {
    n: '03',
    title: 'Track progress',
    body: 'Streaks and recent sessions keep you accountable.',
  },
];

const FEATURES = [
  ['AI from notes', 'Paste lecture notes and edit the generated terms.'],
  ['Explain any card', 'Get a plain-language explanation and memory tip.'],
  ['Expand a set', 'Ask AI to add related cards without wiping your work.'],
  ['Folders + sharing', 'Organize sets, move in bulk, and share public links.'],
  ['Due today', 'Spaced review surfaces what needs practice now.'],
  ['Progress streaks', 'See sessions and keep a daily streak going.'],
];

function CoralRule() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6" aria-hidden>
      <div className="relative h-3 w-full">
        {/* soft bloom behind the blade */}
        <div className="absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-accent/35 blur-[5px] animate-coral-glow" />
        {/* fine continuous blade — full width */}
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 rounded-full bg-accent animate-coral-blade" />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-canvas">
      <AppNav />
      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_0%,var(--hero-from),transparent_55%),radial-gradient(ellipse_at_90%_10%,var(--hero-to),transparent_50%),radial-gradient(ellipse_at_50%_100%,var(--accent-soft),transparent_60%)]"
          />
          <div className="mx-auto max-w-5xl px-4 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-20">
            <p className="font-display text-6xl sm:text-8xl font-bold tracking-[-0.05em] text-ink animate-fadeUp">
              Flashy
            </p>
            <h1 className="mt-5 max-w-2xl font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-snug animate-fadeUp [animation-delay:60ms]">
              Study sets with sunrise energy — and AI when you need speed.
            </h1>
            <p className="mt-4 max-w-lg text-muted leading-relaxed animate-fadeUp [animation-delay:120ms]">
              Build decks, drill with focused modes, and keep a streak going.
              One calm flow from library to study.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 animate-fadeUp [animation-delay:180ms]">
              <SignedOut>
                <Link href="/sign-up">
                  <Button size="lg">Get started free</Button>
                </Link>
                <Link
                  href="/pricing"
                  className="text-sm font-bold text-muted hover:text-ink px-2"
                >
                  View pricing
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/library">
                  <Button size="lg">Open library</Button>
                </Link>
                <Link
                  href="/create"
                  className="text-sm font-bold text-muted hover:text-ink px-2"
                >
                  Create a set
                </Link>
              </SignedIn>
            </div>

            <ul className="mt-14 flex flex-wrap gap-x-8 gap-y-4 animate-fadeUp [animation-delay:220ms]">
              {MODES.map((m) => (
                <li key={m.name} className="min-w-[8rem]">
                  <div className={`mb-2 h-1 w-8 rounded-full ${m.color}`} />
                  <p className="font-display text-base font-bold text-ink">{m.name}</p>
                  <p className="mt-0.5 text-sm text-muted">{m.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <CoralRule />

        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-10">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              How Flashy works
            </h2>
            <Link href="/create" className="text-sm font-bold text-accent hover:text-accent-hover">
              Start a set →
            </Link>
          </div>
          <ol className="space-y-0">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="grid gap-2 py-7 sm:grid-cols-[4rem_1fr] sm:gap-8"
              >
                <p className="font-display text-sm font-bold tracking-[0.14em] text-accent pt-1">
                  {s.n}
                </p>
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">{s.title}</h3>
                  <p className="mt-1.5 max-w-xl text-muted leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <CoralRule />

        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
            Built for real study weeks
          </h2>
          <p className="mt-2 max-w-lg text-muted">
            The tools you reach for between lectures — without a dashboard of boxes.
          </p>
          <ul className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {FEATURES.map(([title, body]) => (
              <li key={title}>
                <h3 className="font-display text-base font-bold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm text-muted leading-relaxed">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        <CoralRule />

        <section>
          <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-5 px-4 py-16 sm:flex-row sm:items-center sm:px-6 sm:py-20">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
                Ready to study?
              </h2>
              <p className="mt-1 text-muted">
                Create your first set in under a minute.
              </p>
            </div>
            <SignedOut>
              <Link href="/sign-up">
                <Button size="lg">Create free account</Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/create">
                <Button size="lg">Create a set</Button>
              </Link>
            </SignedIn>
          </div>
        </section>
      </main>
    </div>
  );
}
