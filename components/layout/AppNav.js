'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Button from '../ui/Button';
import ThemeToggle from '../ui/ThemeToggle';

const primary = [
  { href: '/library', label: 'Library' },
  { href: '/discover', label: 'Discover' },
  { href: '/create', label: 'Create' },
];

const moreLinks = [
  { href: '/progress', label: 'Progress' },
  { href: '/classes', label: 'Classes' },
  { href: '/account', label: 'Account' },
  { href: '/pricing', label: 'Pricing' },
];

export default function AppNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  const moreActive = moreLinks.some((l) => pathname?.startsWith(l.href));

  useEffect(() => {
    const onDoc = (e) => {
      if (!moreRef.current?.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="font-display text-xl font-bold tracking-[-0.04em] text-ink"
          >
            Flashy
          </Link>
          <nav className="hidden md:flex items-center gap-0.5">
            {primary.map((link) => {
              const active = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
                    active
                      ? 'bg-accent-soft text-accent'
                      : 'text-muted hover:text-ink hover:bg-surface-2'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((o) => !o)}
                className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
                  moreActive || moreOpen
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted hover:text-ink hover:bg-surface-2'
                }`}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
              >
                More
              </button>
              {moreOpen ? (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-50 mt-1.5 min-w-[10rem] overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-card"
                >
                  {moreLinks.map((link) => {
                    const active = pathname?.startsWith(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        role="menuitem"
                        className={`block px-3.5 py-2 text-sm font-bold transition-colors ${
                          active
                            ? 'bg-accent-soft text-accent'
                            : 'text-ink hover:bg-surface-2'
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignedOut>
            <Link
              href="/sign-in"
              className="hidden sm:inline text-sm font-bold text-muted hover:text-ink px-2"
            >
              Log in
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Sign up</Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
