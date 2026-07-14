'use client';

import Link from 'next/link';
import EmptyState from '../ui/EmptyState';

export default function DeckList({
  decks,
  onDelete,
  folders = [],
  activeFolderId,
  selectedIds = [],
  selecting = false,
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
      {selecting ? (
        <div className="mb-3 flex items-center gap-3 px-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-muted">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => onToggleSelectAll?.(filtered.map((d) => d.id))}
              className="h-4 w-4 rounded border-line accent-accent"
            />
            Select all
          </label>
        </div>
      ) : null}

      <ul className="divide-y divide-line border-t border-line">
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
              className={`group relative transition-colors ${
                checked ? 'bg-accent-soft/50' : 'hover:bg-surface-2/70'
              }`}
            >
              <div className="flex items-center gap-3 py-4 sm:gap-4">
                {selecting ? (
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleSelect?.(deck.id)}
                    className="h-4 w-4 shrink-0 rounded border-line accent-accent"
                    aria-label={`Select ${deck.title}`}
                  />
                ) : (
                  <div
                    className={`h-10 w-1 shrink-0 rounded-full ${
                      checked ? 'bg-accent' : 'bg-transparent group-hover:bg-accent/40'
                    }`}
                    aria-hidden
                  />
                )}

                <Link href={`/decks/${deck.id}`} className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold tracking-tight text-ink transition-colors group-hover:text-accent">
                    {deck.title}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-sm text-muted">
                    <span className="font-semibold">{deck.cardCount || 0} terms</span>
                    {activeFolderId === 'all' && deck.folderId ? (
                      <span>{folderName(deck.folderId)}</span>
                    ) : null}
                    {deck.visibility === 'public' ? (
                      <span className="font-semibold text-accent">Public</span>
                    ) : null}
                  </p>
                  {deck.description ? (
                    <p className="mt-1 line-clamp-1 text-sm text-muted/90">
                      {deck.description}
                    </p>
                  ) : null}
                </Link>

                <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <Link
                    href={`/decks/${deck.id}/study/flashcards`}
                    className="text-sm font-bold text-accent hover:text-accent-hover"
                  >
                    Study
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDelete?.(deck)}
                    className="text-sm font-semibold text-muted hover:text-red-600 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
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
