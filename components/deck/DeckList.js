'use client';

import Link from 'next/link';
import EmptyState from '../ui/EmptyState';

export default function DeckList({ decks, onDelete, folders = [], activeFolderId }) {
  const filtered =
    activeFolderId === 'all'
      ? decks
      : activeFolderId === 'none'
        ? decks.filter((d) => !d.folderId)
        : decks.filter((d) => d.folderId === activeFolderId);

  if (!filtered.length) {
    return (
      <EmptyState
        title="No decks here yet"
        description="Create a deck manually or generate one from your notes with AI."
        actionLabel="Create deck"
        actionHref="/create"
      />
    );
  }

  const folderName = (id) => folders.find((f) => f.id === id)?.name;

  return (
    <ul className="divide-y divide-line border-y border-line">
      {filtered.map((deck) => (
        <li key={deck.id} className="group flex items-center gap-4 py-3.5">
          <Link href={`/decks/${deck.id}`} className="min-w-0 flex-1">
            <div className="font-display text-base sm:text-lg font-semibold text-ink group-hover:text-accent transition-colors">
              {deck.title}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span>{deck.cardCount || 0} terms</span>
              {deck.folderId ? <span>{folderName(deck.folderId)}</span> : null}
              {deck.visibility === 'public' ? <span className="text-accent">Public</span> : null}
            </div>
          </Link>
          <button
            type="button"
            onClick={() => onDelete?.(deck)}
            className="text-sm font-medium text-muted hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
