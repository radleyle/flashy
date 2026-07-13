'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Button from '../ui/Button';

const links = [
  { href: '/library', label: 'Library' },
  { href: '/create', label: 'Create' },
  { href: '/progress', label: 'Progress' },
  { href: '/pricing', label: 'Pricing' },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display text-2xl font-bold tracking-tight text-ink">
            Flash
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {links.map((link) => {
              const active = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? 'text-accent bg-accent-soft' : 'text-muted hover:text-ink'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <SignedOut>
            <Link href="/sign-in" className="text-sm font-medium text-muted hover:text-ink">
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
