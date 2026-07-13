import Link from 'next/link';

export default function StudyShell({ title, deckId, backHref, children, right }) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={backHref || (deckId ? `/decks/${deckId}` : '/library')}
              className="text-sm font-medium text-muted hover:text-ink shrink-0"
            >
              ← Back
            </Link>
            <h1 className="font-display text-base sm:text-lg font-semibold text-ink truncate">
              {title}
            </h1>
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
