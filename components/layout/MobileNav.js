'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn } from '@clerk/nextjs';

const items = [
  { href: '/library', label: 'Library' },
  { href: '/discover', label: 'Discover' },
  { href: '/create', label: 'Create' },
  { href: '/progress', label: 'More' },
];

export default function MobileNav() {
  const pathname = usePathname();
  if (pathname?.includes('/study/')) return null;

  const morePaths = ['/progress', '/classes', '/account', '/pricing'];
  const moreActive = morePaths.some((p) => pathname?.startsWith(p));

  return (
    <SignedIn>
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md sm:hidden pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
          {items.map((item) => {
            const active =
              item.href === '/progress'
                ? moreActive
                : pathname?.startsWith(item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-bold ${
                    active ? 'text-accent' : 'text-muted'
                  }`}
                >
                  <span
                    className={`h-1 w-1 rounded-full ${active ? 'bg-accent' : 'bg-transparent'}`}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </SignedIn>
  );
}
