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

  const folderItems = useMemo(
    () => [
      { id: 'all', name: 'All decks', droppable: false },
      { id: 'none', name: 'Unfiled', droppable: true, folderId: null },
      ...folders.map((f) => ({ ...f, droppable: true, folderId: f.id })),
    ],
    [folders]
  );

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
  };

  const handleDeleteFolder = async (folderId) => {
    if (!user || !confirm('Delete this folder? Decks stay in your library.')) return;
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
    } catch (e) {
      console.error(e);
      setError('Could not move decks.');
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
    if (!confirm(`Delete ${selectedIds.length} deck${selectedIds.length === 1 ? '' : 's'}?`)) {
      return;
    }
    setBusy(true);
    try {
      await deleteDecks(selectedIds);
      setDecks((prev) => prev.filter((d) => !selectedIds.includes(d.id)));
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
      setError('Could not delete decks.');
    } finally {
      setBusy(false);
    }
  };

  const bulkMove = async (folderId) => {
    await applyFolderMove(selectedIds, folderId);
  };

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <AppNav />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
              Your library
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted">
              {decks.length} set{decks.length === 1 ? '' : 's'}
              {folders.length
                ? ` · ${folders.length} folder${folders.length === 1 ? '' : 's'}`
                : ''}
            </p>
          </div>
          <Link href="/create">
            <Button>Create a set</Button>
          </Link>
        </div>

        {(error || firebaseError) && (
          <p className="mt-4 text-sm text-red-600">
            {error || `Firebase auth: ${firebaseError}. Check FIREBASE_SERVICE_ACCOUNT_JSON.`}
          </p>
        )}

        {selectedIds.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3">
            <span className="text-sm font-medium text-ink mr-2">
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
              className="h-9 rounded-lg border border-line bg-canvas px-2 text-sm outline-none focus:border-accent"
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

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {folderItems.map((f) => {
            const active = activeFolderId === f.id;
            const isDrop = dropTarget === f.id;
            return (
              <div key={f.id} className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setActiveFolderId(f.id)}
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
                    f.droppable
                      ? (e) => onDropFolder(e, f.folderId ?? null)
                      : undefined
                  }
                  className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
                    isDrop
                      ? 'bg-accent text-white'
                      : active
                        ? 'bg-accent text-white'
                        : 'bg-surface-2 text-muted hover:text-ink'
                  }`}
                >
                  {f.name}
                </button>
                {f.id !== 'all' && f.id !== 'none' ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteFolder(f.id)}
                    className="px-1 text-xs text-muted hover:text-red-600"
                    aria-label="Delete folder"
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
            className="rounded-full px-3 py-1.5 text-sm font-bold text-muted hover:text-accent"
          >
            + Folder
          </button>
        </div>

        <div className="mt-5">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your decks…"
          />
        </div>

        <div className="mt-5">
          {loading || !firebaseReady ? (
            <DeckListSkeleton />
          ) : (
            <DeckList
              decks={searched}
              folders={folders}
              activeFolderId={activeFolderId}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onDelete={handleDelete}
            />
          )}
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
