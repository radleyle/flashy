import Link from 'next/link';
import ThemeToggle from '../ui/ThemeToggle';

export default function StudyShell({
  title,
  deckId,
  backHref,
  children,
  right,
  focus = false,
}) {
  const exitHref = backHref || (deckId ? `/decks/${deckId}` : '/library');

  if (focus) {
    return (
      <div className="flex min-h-screen flex-col bg-canvas">
        <header className="z-30 shrink-0">
          <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4 sm:px-6">
            <Link
              href={exitHref}
              className="text-sm font-bold text-muted hover:text-ink"
            >
              Exit
            </Link>
            <p className="font-display text-sm font-bold tracking-tight text-ink truncate max-w-[50%] text-center">
              {title}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              {right}
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={exitHref}
              className="text-sm font-bold text-muted hover:text-accent shrink-0"
            >
              ← Back
            </Link>
            <h1 className="font-display text-base sm:text-lg font-bold tracking-tight text-ink truncate">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {right}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
