'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SUPPORT =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@flashy.study';

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.includes('/study/')) return null;

  return (
    <footer className="mt-auto border-t border-line/80 pb-20 sm:pb-0">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-display text-sm font-bold text-ink">Flashy</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-muted">
          <Link href="/pricing" className="hover:text-ink">
            Pricing
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <a href={`mailto:${SUPPORT}`} className="hover:text-ink">
            Support
          </a>
        </nav>
      </div>
    </footer>
  );
}
