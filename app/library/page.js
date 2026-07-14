'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import AppNav from '@/components/layout/AppNav';
import DeckList from '@/components/deck/DeckList';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { DeckListSkeleton } from '@/components/ui/Skeleton';
import {
  listDecks,
  deleteDeck,
  deleteDecks,
  moveDecksToFolder,
  listCards,
  restoreDeck,
} from '@/lib/firestore/decks';
import { ensureUser, addFolder, deleteFolder } from '@/lib/firestore/users';
import { useFirebaseAuth } from '@/components/providers/FirebaseAuthProvider';
import Link from 'next/link';
import UndoToast from '@/components/ui/UndoToast';
import { stashDeletedDeck } from '@/lib/undo';
import { useRouter } from 'next/navigation';

export default function LibraryPage() {
  const { user, isLoaded } = useUser();
  const { ready: firebaseReady, error: firebaseError } = useFirebaseAuth();
  const router = useRouter();
  const [decks, setDecks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [folderModal, setFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [dropTarget, setDropTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [mobileFoldersOpen, setMobileFoldersOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user || !firebaseReady) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const profile = await ensureUser(user.id);
        if (cancelled) return;
        setFolders(profile.folders || []);
        const data = await listDecks(user.id);
        if (cancelled) return;
        setDecks(data);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('Could not load your library.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, firebaseReady]);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return decks;
    return decks.filter(
      (d) =>
        d.title?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
    );
  }, [decks, query]);

  const counts = useMemo(() => {
    const map = { all: decks.length, none: 0 };
    folders.forEach((f) => {
      map[f.id] = 0;
    });
    decks.forEach((d) => {
      if (!d.folderId) map.none += 1;
      else if (map[d.folderId] !== undefined) map[d.folderId] += 1;
    });
    return map;
  }, [decks, folders]);

  const folderItems = useMemo(
    () => [
      { id: 'all', name: 'All sets', droppable: false, count: counts.all },
      { id: 'none', name: 'Unfiled', droppable: true, folderId: null, count: counts.none },
      ...folders.map((f) => ({
        ...f,
        droppable: true,
        folderId: f.id,
        count: counts[f.id] || 0,
      })),
    ],
    [folders, counts]
  );

  const activeFolder = folderItems.find((f) => f.id === activeFolderId) || folderItems[0];

  const handleDelete = async (deck) => {
    if (!confirm(`Delete “${deck.title}”? You can undo for a few minutes.`)) return;
    try {
      const cards = await listCards(deck.id);
      stashDeletedDeck(
        {
          title: deck.title,
          description: deck.description,
          folderId: deck.folderId,
        },
        cards
      );
    } catch {
      stashDeletedDeck(
        {
          title: deck.title,
          description: deck.description,
          folderId: deck.folderId,
        },
        []
      );
    }
    await deleteDeck(deck.id);
    setDecks((prev) => prev.filter((d) => d.id !== deck.id));
    setSelectedIds((prev) => prev.filter((id) => id !== deck.id));
  };

  const handleAddFolder = async () => {
    if (!user || !folderName.trim()) return;
    const folder = await addFolder(user.id, folderName);
    setFolders((prev) => [...prev, folder]);
    setFolderName('');
    setFolderModal(false);
    setActiveFolderId(folder.id);
  };

  const handleDeleteFolder = async (folderId) => {
    if (!user || !confirm('Delete this folder? Sets stay in your library.')) return;
    const next = await deleteFolder(user.id, folderId);
    setFolders(next);
    setDecks((prev) =>
      prev.map((d) => (d.folderId === folderId ? { ...d, folderId: null } : d))
    );
    if (activeFolderId === folderId) setActiveFolderId('all');
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (ids) => {
    const allOn = ids.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) =>
      allOn ? prev.filter((id) => !ids.includes(id)) : Array.from(new Set([...prev, ...ids]))
    );
  };

  const applyFolderMove = async (deckIds, folderId) => {
    if (!deckIds.length) return;
    setBusy(true);
    try {
      await moveDecksToFolder(deckIds, folderId);
      setDecks((prev) =>
        prev.map((d) =>
          deckIds.includes(d.id) ? { ...d, folderId: folderId || null } : d
        )
      );
      setSelectedIds([]);
      setSelecting(false);
    } catch (e) {
      console.error(e);
      setError('Could not move sets.');
    } finally {
      setBusy(false);
      setDropTarget(null);
    }
  };

  const onDropFolder = async (e, folderId) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/deck-id');
    const ids = selectedIds.includes(draggedId)
      ? selectedIds
      : draggedId
        ? [draggedId]
        : selectedIds;
    await applyFolderMove(ids, folderId);
  };

  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} set${selectedIds.length === 1 ? '' : 's'}?`)) {
      return;
    }
    setBusy(true);
    try {
      await deleteDecks(selectedIds);
      setDecks((prev) => prev.filter((d) => !selectedIds.includes(d.id)));
      setSelectedIds([]);
      setSelecting(false);
    } catch (e) {
      console.error(e);
      setError('Could not delete sets.');
    } finally {
      setBusy(false);
    }
  };

  const bulkMove = async (folderId) => {
    await applyFolderMove(selectedIds, folderId);
  };

  const FolderNav = ({ onPick }) => (
    <nav className="flex flex-col gap-0.5" aria-label="Folders">
      {folderItems.map((f) => {
        const active = activeFolderId === f.id;
        const isDrop = dropTarget === f.id;
        return (
          <div key={f.id} className="group/folder flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveFolderId(f.id);
                onPick?.();
              }}
              onDragOver={
                f.droppable
                  ? (e) => {
                      e.preventDefault();
                      setDropTarget(f.id);
                    }
                  : undefined
              }
              onDragLeave={
                f.droppable
                  ? () => setDropTarget((t) => (t === f.id ? null : t))
                  : undefined
              }
              onDrop={
                f.droppable ? (e) => onDropFolder(e, f.folderId ?? null) : undefined
              }
              className={`flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                isDrop
                  ? 'bg-accent text-white'
                  : active
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted hover:bg-surface-2 hover:text-ink'
              }`}
            >
              <span className="truncate">{f.name}</span>
              <span
                className={`shrink-0 tabular-nums text-xs font-bold ${
                  isDrop ? 'text-white/80' : active ? 'text-accent/80' : 'text-muted/70'
                }`}
              >
                {f.count}
              </span>
            </button>
            {f.id !== 'all' && f.id !== 'none' ? (
              <button
                type="button"
                onClick={() => handleDeleteFolder(f.id)}
                className="shrink-0 rounded-md px-1.5 py-1 text-xs font-bold text-muted opacity-0 hover:bg-surface-2 hover:text-red-600 group-hover/folder:opacity-100"
                aria-label={`Delete folder ${f.name}`}
              >
                ×
              </button>
            ) : null}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => setFolderModal(true)}
        className="mt-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-muted hover:bg-surface-2 hover:text-accent"
      >
        + New folder
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Library
            </h1>
            <p className="mt-1 text-sm text-muted">
              {decks.length} set{decks.length === 1 ? '' : 's'}
              {folders.length
                ? ` across ${folders.length} folder${folders.length === 1 ? '' : 's'}`
                : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelecting((v) => !v);
                setSelectedIds([]);
              }}
            >
              {selecting ? 'Done' : 'Select'}
            </Button>
            <Link href="/create">
              <Button>Create a set</Button>
            </Link>
          </div>
        </div>

        {(error || firebaseError) && (
          <p className="mt-4 text-sm text-red-600">
            {error || `Firebase auth: ${firebaseError}. Check FIREBASE_SERVICE_ACCOUNT_JSON.`}
          </p>
        )}

        {/* Mobile folder control */}
        <div className="mt-6 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFoldersOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-left shadow-soft"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                Folder
              </p>
              <p className="font-display text-base font-bold text-ink">
                {activeFolder.name}
                <span className="ml-2 text-sm font-semibold text-muted">
                  {activeFolder.count}
                </span>
              </p>
            </div>
            <span className="text-sm font-bold text-accent">
              {mobileFoldersOpen ? 'Close' : 'Browse'}
            </span>
          </button>
          {mobileFoldersOpen ? (
            <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-line bg-surface p-2 shadow-soft">
              <FolderNav onPick={() => setMobileFoldersOpen(false)} />
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                Folders
              </p>
              <div className="max-h-[calc(100vh-10rem)] overflow-y-auto pr-1">
                <FolderNav />
              </div>
              <p className="mt-4 px-3 text-xs leading-relaxed text-muted">
                Drag a set onto a folder to file it.
              </p>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight text-ink">
                  {activeFolder.name}
                </h2>
                <p className="text-sm text-muted">
                  {activeFolder.count} set{activeFolder.count === 1 ? '' : 's'}
                </p>
              </div>
              <div className="w-full sm:max-w-xs">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search sets…"
                />
              </div>
            </div>

            {selectedIds.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-accent/25 bg-accent-soft/50 px-4 py-3">
                <span className="mr-1 text-sm font-bold text-ink">
                  {selectedIds.length} selected
                </span>
                <select
                  disabled={busy}
                  defaultValue=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') return;
                    bulkMove(val === 'none' ? null : val);
                    e.target.value = '';
                  }}
                  className="h-9 rounded-lg border border-line bg-surface px-2 text-sm outline-none focus:border-accent"
                >
                  <option value="" disabled>
                    Move to…
                  </option>
                  <option value="none">Unfiled</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <Button size="sm" variant="danger" disabled={busy} onClick={bulkDelete}>
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setSelectedIds([])}
                >
                  Clear
                </Button>
              </div>
            ) : null}

            <div className="mt-5">
              {loading || !firebaseReady ? (
                <DeckListSkeleton />
              ) : (
                <DeckList
                  decks={searched}
                  folders={folders}
                  activeFolderId={activeFolderId}
                  selectedIds={selectedIds}
                  selecting={selecting}
                  onToggleSelect={toggleSelect}
                  onToggleSelectAll={toggleSelectAll}
                  onDelete={handleDelete}
                />
              )}
            </div>
          </section>
        </div>
      </main>

      <Modal
        open={folderModal}
        onClose={() => setFolderModal(false)}
        title="New folder"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFolderModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFolder}>Create</Button>
          </>
        }
      >
        <Input
          label="Folder name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder="e.g. Midterms"
        />
      </Modal>

      <UndoToast
        onUndo={async (item) => {
          if (!user) return;
          const newId = await restoreDeck({
            ownerId: user.id,
            deck: item.deck,
            cards: item.cards,
          });
          const data = await listDecks(user.id);
          setDecks(data);
          router.push(`/decks/${newId}`);
        }}
      />
    </div>
  );
}
