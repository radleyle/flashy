import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import AppNav from '@/components/layout/AppNav';
import Button from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <AppNav />
      <main>
        <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6">
          <div className="absolute inset-x-0 top-10 -z-10 mx-auto h-[420px] max-w-4xl rounded-full bg-gradient-to-br from-sky-wash via-accent-soft/40 to-transparent blur-3xl opacity-80" />
          <p className="font-display text-6xl sm:text-8xl font-bold tracking-tight text-ink">
            Flash
          </p>
          <h1 className="mt-4 max-w-xl font-display text-2xl sm:text-3xl font-semibold text-ink leading-snug">
            Study smarter, not slower.
          </h1>
          <p className="mt-4 max-w-lg text-base sm:text-lg text-muted leading-relaxed">
            Build decks, drill with Learn and Match, and turn notes into cards with AI — clean study
            flow, no clutter.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <SignedOut>
              <Link href="/sign-up">
                <Button size="lg">Get started</Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="secondary">
                  Log in
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/library">
                <Button size="lg">Open library</Button>
              </Link>
              <Link href="/create">
                <Button size="lg" variant="secondary">
                  Create deck
                </Button>
              </Link>
            </SignedIn>
          </div>
        </section>
      </main>
    </div>
  );
}
