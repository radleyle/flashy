import Link from 'next/link';
import Button from '../ui/Button';

export default function SessionSummary({ title, stats = [], deckId }) {
  return (
    <div className="mx-auto max-w-md text-center py-10">
      <h2 className="font-display text-3xl font-semibold text-ink">{title}</h2>
      <dl className="mt-8 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-xs uppercase tracking-wider text-muted">{s.label}</dt>
            <dd className="mt-1 font-display text-2xl font-semibold text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 flex justify-center gap-3">
        {deckId ? (
          <Link href={`/decks/${deckId}`}>
            <Button variant="secondary">Back to deck</Button>
          </Link>
        ) : null}
        <Button onClick={() => window.location.reload()}>Study again</Button>
      </div>
    </div>
  );
}
