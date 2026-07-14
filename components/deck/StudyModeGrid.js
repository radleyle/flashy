import Link from 'next/link';
import { isDue, isNew } from '@/lib/srs';

const MODES = [
  {
    mode: 'flashcards',
    label: 'Flashcards',
    desc: 'Flip through every term',
    color: 'bg-mode-flash',
    soft: 'hover:border-mode-flash/40',
  },
  {
    mode: 'learn',
    label: 'Learn',
    desc: 'Know it or still learning',
    color: 'bg-mode-learn',
    soft: 'hover:border-mode-learn/40',
  },
  {
    mode: 'write',
    label: 'Write',
    desc: 'Type the answer from memory',
    color: 'bg-mode-write',
    soft: 'hover:border-mode-write/40',
  },
  {
    mode: 'match',
    label: 'Match',
    desc: 'Race to pair them all',
    color: 'bg-mode-match',
    soft: 'hover:border-mode-match/40',
  },
  {
    mode: 'test',
    label: 'Practice test',
    desc: 'Mixed quiz with a score',
    color: 'bg-mode-test',
    soft: 'hover:border-mode-test/40',
  },
];

const DUE_HELP =
  'Flashy schedules reviews for you — there is no due-date picker. After you study in Learn or Write and rate how well you know a card, it gets a next-review date (higher mastery = longer wait). When that date is today or earlier, the card shows here. New cards with no review yet are not due.';

export default function StudyModeGrid({ deckId, cards = [] }) {
  const dueCount = cards.filter((c) => isDue(c)).length;
  const newCount = cards.filter((c) => isNew(c)).length;

  return (
    <div className="space-y-3">
      {dueCount > 0 ? (
        <div className="relative z-30 flex items-center justify-between gap-3 rounded-2xl border-2 border-accent/30 bg-accent-soft px-5 py-4 shadow-soft">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/decks/${deckId}/study/flashcards?due=1`}
                className="font-display text-lg font-bold text-ink hover:text-accent"
              >
                Due today
              </Link>
              <span className="group relative inline-flex">
                <button
                  type="button"
                  className="flex h-4 w-4 items-center justify-center rounded-full border border-accent/50 text-[10px] font-bold leading-none text-accent hover:bg-accent hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="How Due today works"
                  aria-describedby="due-today-help"
                >
                  i
                </button>
                <span
                  id="due-today-help"
                  role="tooltip"
                  className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface px-3.5 py-3 text-left text-sm font-normal leading-relaxed text-muted opacity-0 shadow-card transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  {DUE_HELP}
                </span>
              </span>
            </div>
            <p className="text-sm text-muted">
              {dueCount} card{dueCount === 1 ? '' : 's'} scheduled for review
            </p>
          </div>
          <Link
            href={`/decks/${deckId}/study/flashcards?due=1`}
            className="shrink-0 text-sm font-bold text-accent hover:underline"
          >
            Study →
          </Link>
        </div>
      ) : newCount > 0 ? (
        <p className="rounded-2xl border border-line bg-surface px-5 py-3 text-sm text-muted">
          {newCount} new card{newCount === 1 ? '' : 's'} — study Learn or Write to schedule
          reviews. Nothing is due yet.
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.map((m) => (
          <Link
            key={m.mode}
            href={`/decks/${deckId}/study/${m.mode}`}
            className={`group relative overflow-hidden rounded-2xl border-2 border-line bg-surface p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card ${m.soft}`}
          >
            <div className={`mb-4 h-1.5 w-12 rounded-full ${m.color}`} />
            <div className="font-display text-xl font-bold tracking-tight text-ink group-hover:text-accent transition-colors">
              {m.label}
            </div>
            <p className="mt-1 text-sm text-muted">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
