import Link from 'next/link';
import { isDue } from '@/lib/srs';

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

export default function StudyModeGrid({ deckId, cards = [] }) {
  const dueCount = cards.filter((c) => isDue(c)).length;

  return (
    <div className="space-y-3">
      {dueCount > 0 ? (
        <Link
          href={`/decks/${deckId}/study/flashcards?due=1`}
          className="flex items-center justify-between rounded-2xl border-2 border-accent/30 bg-accent-soft px-5 py-4 shadow-soft transition hover:-translate-y-0.5"
        >
          <div>
            <p className="font-display text-lg font-bold text-ink">Due today</p>
            <p className="text-sm text-muted">
              {dueCount} card{dueCount === 1 ? '' : 's'} ready for review
            </p>
          </div>
          <span className="text-sm font-bold text-accent">Study →</span>
        </Link>
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
