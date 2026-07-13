'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import AppNav from '@/components/layout/AppNav';
import DeckList from '@/components/deck/DeckList';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { DeckListSkeleton } from '@/components/ui/Skeleton';
import { listDecks, deleteDeck } from '@/lib/firestore/decks';
import { ensureUser, addFolder, deleteFolder } from '@/lib/firestore/users';
import { useFirebaseAuth } from '@/components/providers/FirebaseAuthProvider';
import Link from 'next/link';

export default function LibraryPage() {
  const { user, isLoaded } = useUser();
  const { ready: firebaseReady, error: firebaseError } = useFirebaseAuth();
  const [decks, setDecks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [folderModal, setFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');

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

  const handleDelete = async (deck) => {
    if (!confirm(`Delete “${deck.title}”?`)) return;
    await deleteDeck(deck.id);
    setDecks((prev) => prev.filter((d) => d.id !== deck.id));
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
    if (activeFolderId === folderId) setActiveFolderId('all');
  };

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
              Library
            </h1>
            <p className="mt-1 text-sm text-muted">Your decks and folders</p>
          </div>
          <Link href="/create">
            <Button>Create deck</Button>
          </Link>
        </div>

        {(error || firebaseError) && (
          <p className="mt-4 text-sm text-red-600">
            {error || `Firebase auth: ${firebaseError}. Check FIREBASE_SERVICE_ACCOUNT_JSON.`}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:gap-10">
          <aside className="w-full lg:w-52 shrink-0 space-y-0.5">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Folders
            </p>
            {[
              { id: 'all', name: 'All decks' },
              { id: 'none', name: 'Unfiled' },
              ...folders,
            ].map((f) => (
              <div key={f.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveFolderId(f.id)}
                  className={`flex-1 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    activeFolderId === f.id
                      ? 'bg-accent-soft text-accent'
                      : 'text-muted hover:bg-white hover:text-ink'
                  }`}
                >
                  {f.name}
                </button>
                {f.id !== 'all' && f.id !== 'none' ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteFolder(f.id)}
                    className="px-2 text-xs text-muted hover:text-red-600"
                    aria-label="Delete folder"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full justify-start"
              onClick={() => setFolderModal(true)}
            >
              + New folder
            </Button>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-5">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your decks…"
              />
            </div>
            {loading || !firebaseReady ? <DeckListSkeleton /> : (
              <DeckList
                decks={searched}
                folders={folders}
                activeFolderId={activeFolderId}
                onDelete={handleDelete}
              />
            )}
          </div>
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
    </div>
  );
}
