'use client';

import Link from 'next/link';
import EmptyState from '../ui/EmptyState';

export default function DeckList({
  decks,
  onDelete,
  folders = [],
  activeFolderId,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onDragStartDeck,
}) {
  const filtered =
    activeFolderId === 'all'
      ? decks
      : activeFolderId === 'none'
        ? decks.filter((d) => !d.folderId)
        : decks.filter((d) => d.folderId === activeFolderId);

  if (!filtered.length) {
    const inFolder = activeFolderId !== 'all';
    return (
      <EmptyState
        title={inFolder ? 'No sets in this folder' : 'No sets yet'}
        description={
          inFolder
            ? 'Drag a set onto this folder, or create a new one and put it here.'
            : 'Your library is empty. Create a set by hand, or paste notes / upload a PDF and generate with AI.'
        }
        actionLabel="Create a set"
        actionHref="/create"
      />
    );
  }

  const folderName = (id) => folders.find((f) => f.id === id)?.name;
  const allSelected =
    filtered.length > 0 && filtered.every((d) => selectedIds.includes(d.id));

  return (
    <div>
      <div className="mb-3 flex items-center gap-3 px-1">
        <label className="flex items-center gap-2 text-sm font-semibold text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => onToggleSelectAll?.(filtered.map((d) => d.id))}
            className="h-4 w-4 rounded border-line accent-accent"
          />
          Select all
        </label>
        <span className="text-xs text-muted">Drag onto a folder to move</span>
      </div>
      <ul className="divide-y divide-line border-y border-line">
        {filtered.map((deck) => {
          const checked = selectedIds.includes(deck.id);
          return (
            <li
              key={deck.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/deck-id', deck.id);
                e.dataTransfer.effectAllowed = 'move';
                onDragStartDeck?.(deck.id);
              }}
              className={`group relative flex items-stretch gap-0 transition-colors ${
                checked ? 'bg-accent-soft/40' : 'hover:bg-surface-2/60'
              }`}
            >
              <div
                className={`w-1 shrink-0 ${
                  checked ? 'bg-accent' : 'bg-transparent group-hover:bg-line'
                }`}
              />
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3.5 sm:px-4">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleSelect?.(deck.id)}
                  className="h-4 w-4 shrink-0 rounded border-line accent-accent"
                  aria-label={`Select ${deck.title}`}
                />
                <Link href={`/decks/${deck.id}`} className="min-w-0 flex-1">
                  <div className="font-display text-base font-bold tracking-tight text-ink group-hover:text-accent transition-colors">
                    {deck.title}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-sm text-muted">
                    <span className="font-semibold">{deck.cardCount || 0} terms</span>
                    {deck.folderId ? <span>{folderName(deck.folderId)}</span> : null}
                    {deck.visibility === 'public' ? (
                      <span className="font-semibold text-accent">Public</span>
                    ) : null}
                  </div>
                </Link>
                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href={`/decks/${deck.id}/study/flashcards`}
                    className="text-sm font-bold text-accent hover:text-accent-hover"
                  >
                    Study
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDelete?.(deck)}
                    className="text-sm font-semibold text-muted opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
