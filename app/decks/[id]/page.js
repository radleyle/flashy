'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import AppNav from '@/components/layout/AppNav';
import Button from '@/components/ui/Button';
import CardEditor, { emptyCard } from '@/components/deck/CardEditor';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import {
  getDeck,
  listCards,
  replaceCards,
  updateDeckMeta,
  deleteDeck,
  setDeckVisibility,
  restoreDeck,
} from '@/lib/firestore/decks';
import { ensureUser, getAiUsage, incrementAiUsage } from '@/lib/firestore/users';
import { canGenerateAi, getPlanLimits } from '@/lib/plans';
import { useFirebaseAuth } from '@/components/providers/FirebaseAuthProvider';
import Skeleton from '@/components/ui/Skeleton';
import StudyModeGrid from '@/components/deck/StudyModeGrid';
import ExplainCard from '@/components/ai/ExplainCard';
import StudyPlanModal from '@/components/deck/StudyPlanModal';
import UndoToast from '@/components/ui/UndoToast';
import { cardsToCsv, downloadCsv } from '@/lib/csv';
import { stashDeletedDeck } from '@/lib/undo';
import { track } from '@/lib/analytics';
import EmptyState from '@/components/ui/EmptyState';
import SpeakButton from '@/components/ui/SpeakButton';
import { isDue, isNew } from '@/lib/srs';
import { cacheDeckOffline } from '@/lib/offline';

export default function DeckDetailPage() {
  const { id } = useParams();
  const { user, isLoaded } = useUser();
  const { ready: firebaseReady } = useFirebaseAuth();
  const router = useRouter();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState(null);
  const [folders, setFolders] = useState([]);
  const [aiText, setAiText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [tagging, setTagging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [plan, setPlan] = useState('free');
  const [termQuery, setTermQuery] = useState('');
  const [showDefinitions, setShowDefinitions] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user || !id || !firebaseReady) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const profile = await ensureUser(user.id);
        if (cancelled) return;
        setFolders(profile.folders || []);
        setPlan(profile.plan || 'free');
        const d = await getDeck(id);
        if (cancelled) return;
        if (!d) {
          setError('Deck not found');
          return;
        }
        setDeck(d);
        setTitle(d.title || '');
        setDescription(d.description || '');
        setFolderId(d.folderId || null);
        const c = await listCards(id);
        if (cancelled) return;
        setCards(c.length ? c : [emptyCard(0)]);
        if (d && c.length) cacheDeckOffline(d, c).catch(() => {});
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('Failed to load deck');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, id, firebaseReady]);

  useEffect(() => {
    if (deck && user && deck.ownerId !== user.id) {
      const readers = deck.readerIds || [];
      if (!readers.includes(user.id) && deck.visibility !== 'public') {
        setError('You do not have access to this deck.');
      }
    }
  }, [deck, user]);

  const filteredCards = useMemo(() => {
    const q = termQuery.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (c) =>
        c.front?.toLowerCase().includes(q) ||
        c.back?.toLowerCase().includes(q) ||
        c.difficulty?.toLowerCase().includes(q)
    );
  }, [cards, termQuery]);

  const realCards = useMemo(
    () => cards.filter((c) => c.front?.trim() || c.back?.trim()),
    [cards]
  );

  const srsStats = useMemo(() => {
    let newCount = 0;
    let dueCount = 0;
    let learned = 0;
    realCards.forEach((c) => {
      if (isNew(c)) newCount += 1;
      if (isDue(c)) dueCount += 1;
      if ((c.mastery || 0) >= 3) learned += 1;
    });
    return { newCount, dueCount, learned };
  }, [realCards]);

  const isOwner = Boolean(user && deck && deck.ownerId === user.id);

  const reloadDeck = async () => {
    const d = await getDeck(id);
    if (!d) {
      setError('Deck not found');
      return;
    }
    setDeck(d);
    setTitle(d.title || '');
    setDescription(d.description || '');
    setFolderId(d.folderId || null);
    const c = await listCards(id);
    setCards(c.length ? c : [emptyCard(0)]);
  };

  const checkAiQuota = async () => {
    const used = await getAiUsage(user.id);
    if (!canGenerateAi(plan, used)) {
      const limits = getPlanLimits(plan);
      setError(`AI limit reached (${limits.aiGensPerDay}/day on ${limits.name}).`);
      return false;
    }
    return true;
  };

  const onGenerate = async () => {
    setError('');
    if (!(await checkAiQuota())) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      const next = (Array.isArray(data) ? data : []).map((c, i) => ({
        id: `temp_${Date.now()}_${i}`,
        front: c.front || '',
        back: c.back || '',
        mastery: 0,
        imageUrl: '',
        difficulty: '',
      }));
      setCards(next);
      await incrementAiUsage(user.id);
      track('ai_generate', { source: 'deck_edit', count: next.length });
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const onExpand = async () => {
    setError('');
    if (!(await checkAiQuota())) return;
    setExpanding(true);
    try {
      const existing = cards.filter((c) => c.front.trim() || c.back.trim());
      const res = await fetch('/api/ai/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, cards: existing, count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Expand failed');
      const added = (Array.isArray(data) ? data : []).map((c, i) => ({
        id: `temp_exp_${Date.now()}_${i}`,
        front: c.front || '',
        back: c.back || '',
        mastery: 0,
        imageUrl: '',
        difficulty: '',
      }));
      if (!added.length) throw new Error('No new cards returned');
      setCards((prev) => [...prev.filter((c) => c.front.trim() || c.back.trim()), ...added]);
      await incrementAiUsage(user.id);
    } catch (e) {
      setError(e.message || 'Could not add related cards');
    } finally {
      setExpanding(false);
    }
  };

  const onTagDifficulty = async () => {
    setError('');
    if (!(await checkAiQuota())) return;
    setTagging(true);
    try {
      const existing = cards.filter((c) => c.front.trim() || c.back.trim());
      const res = await fetch('/api/ai/difficulty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: existing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tagging failed');
      const byFront = Object.fromEntries(
        (Array.isArray(data) ? data : []).map((c) => [c.front, c.difficulty])
      );
      setCards((prev) =>
        prev.map((c) => ({
          ...c,
          difficulty: byFront[c.front] || c.difficulty || '',
        }))
      );
      await incrementAiUsage(user.id);
    } catch (e) {
      setError(e.message || 'Could not tag difficulty');
    } finally {
      setTagging(false);
    }
  };

  const onExplainQuota = async () => {
    setError('');
    if (!(await checkAiQuota())) return false;
    await incrementAiUsage(user.id);
    return true;
  };

  const onSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateDeckMeta(id, {
        title: title.trim(),
        description: description.trim(),
        folderId: folderId || null,
      });
      const cleaned = cards.filter((c) => c.front.trim() || c.back.trim());
      await replaceCards(id, cleaned);
      setEditing(false);
      await reloadDeck();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleShare = async () => {
    const next = deck.visibility === 'public' ? 'private' : 'public';
    await setDeckVisibility(id, next);
    setDeck((d) => ({ ...d, visibility: next }));
  };

  const shareUrl =
    typeof window !== 'undefined' && deck?.shareSlug
      ? `${window.location.origin}/s/${deck.shareSlug}`
      : '';

  const handleDelete = async () => {
    if (!confirm('Delete this deck? You can undo for a few minutes.')) return;
    stashDeletedDeck(
      {
        title: deck.title,
        description: deck.description,
        folderId: deck.folderId,
      },
      cards.filter((c) => c.front || c.back)
    );
    await deleteDeck(id);
    router.push('/library');
  };

  const handleExport = () => {
    downloadCsv(
      `${(deck.title || 'deck').replace(/\s+/g, '-').toLowerCase()}.csv`,
      cardsToCsv(cards)
    );
  };

  if (error && !deck) {
    return (
      <div className="min-h-screen pb-20 sm:pb-0">
        <AppNav />
        <p className="p-10 text-center text-muted">{error}</p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen pb-20 sm:pb-0">
        <AppNav />
        <main className="mx-auto max-w-3xl px-4 py-10 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
          <div className="grid gap-3 sm:grid-cols-2 pt-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <AppNav />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {!editing ? (
          <>
            <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent mb-1">
                    Study set
                  </p>
                  <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
                    {deck.title}
                  </h1>
                  {deck.description ? (
                    <p className="mt-3 text-muted leading-relaxed">{deck.description}</p>
                  ) : null}
                  <p className="mt-3 text-sm font-semibold text-muted">
                    {deck.cardCount || realCards.length} terms
                    {realCards.length ? (
                      <span className="font-medium text-muted">
                        {' '}
                        · {srsStats.newCount} new · {srsStats.dueCount} due ·{' '}
                        {srsStats.learned} learned
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isOwner ? (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                        Edit
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setShareOpen(true)}>
                        Share
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setPlanOpen(true)}>
                        Study plan
                      </Button>
                      <Button variant="secondary" size="sm" onClick={handleExport}>
                        Export
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleDelete}>
                        Delete
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-muted self-center">Shared via class</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="font-display text-lg font-bold tracking-tight text-ink mb-3">
                Choose a study mode
              </h2>
              <StudyModeGrid deckId={id} cards={cards} />
            </div>

            <section className="mt-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                  Terms in this set ({filteredCards.filter((c) => c.front?.trim() || c.back?.trim()).length}
                  {termQuery ? ` of ${realCards.length}` : ''})
                </h2>
                {realCards.length ? (
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowDefinitions((v) => !v)}
                    >
                      {showDefinitions ? 'Hide definitions' : 'Show definitions'}
                    </Button>
                    <div className="w-full sm:w-56">
                      <Input
                        value={termQuery}
                        onChange={(e) => setTermQuery(e.target.value)}
                        placeholder="Search terms…"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
              {!realCards.length ? (
                <EmptyState
                  title="No terms yet"
                  description="Add terms by hand or generate them from your notes with AI."
                  actionLabel={isOwner ? 'Add terms' : undefined}
                  onAction={isOwner ? () => setEditing(true) : undefined}
                />
              ) : (
              <ul className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft divide-y divide-line">
                {filteredCards.map((card, i) => (
                  <li
                    key={card.id || i}
                    className="px-5 py-4 hover:bg-canvas/70 transition-colors"
                  >
                    <div
                      className={`grid gap-3 ${showDefinitions ? 'sm:grid-cols-2' : ''}`}
                    >
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                          Term
                          {card.difficulty ? (
                            <span className="ml-2 normal-case tracking-normal font-semibold text-accent">
                              {card.difficulty}
                            </span>
                          ) : null}
                          {typeof card.mastery === 'number' && showDefinitions ? (
                            <span className="ml-2 normal-case tracking-normal font-semibold text-muted">
                              · mastery {card.mastery}/5
                            </span>
                          ) : null}
                        </p>
                        <p className="font-semibold text-ink inline-flex items-center gap-2">
                          {card.front}
                          <SpeakButton text={card.front} />
                        </p>
                        {card.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={card.imageUrl}
                            alt=""
                            className="mt-2 h-16 rounded-lg object-cover"
                          />
                        ) : null}
                      </div>
                      {showDefinitions ? (
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                            Definition
                          </p>
                          <p className="text-ink leading-relaxed inline-flex items-start gap-2">
                            <span>{card.back}</span>
                            <SpeakButton text={card.back} className="mt-0.5 shrink-0" />
                          </p>
                        </div>
                      ) : null}
                    </div>
                    {showDefinitions ? (
                      <ExplainCard
                        front={card.front}
                        back={card.back}
                        deckTitle={deck.title}
                        onUseAi={onExplainQuota}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
              )}
            </section>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="mb-4 text-sm text-muted hover:text-ink"
            >
              ← Cancel edit
            </button>
            {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
            <CardEditor
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              cards={cards}
              setCards={setCards}
              aiText={aiText}
              setAiText={setAiText}
              onGenerate={onGenerate}
              generating={generating}
              onExpand={onExpand}
              expanding={expanding}
              onTagDifficulty={onTagDifficulty}
              tagging={tagging}
              onSave={onSave}
              saving={saving}
              folderId={folderId}
              setFolderId={setFolderId}
              folders={folders}
            />
          </>
        )}
      </main>

      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share deck"
        footer={
          <Button variant="secondary" onClick={() => setShareOpen(false)}>
            Done
          </Button>
        }
      >
        <p className="mb-4">
          Visibility:{' '}
          <strong className="text-ink">
            {deck.visibility === 'public' ? 'Public' : 'Private'}
          </strong>
        </p>
        <Button size="sm" onClick={toggleShare} className="mb-4">
          Make {deck.visibility === 'public' ? 'private' : 'public'}
        </Button>
        {deck.visibility === 'public' ? (
          <div className="space-y-2">
            <Input readOnly value={shareUrl} />
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        ) : (
          <p>Make the deck public to get a shareable link and appear in Discover.</p>
        )}
      </Modal>

      <StudyPlanModal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        title={deck.title}
        cards={cards}
        onUseAi={async () => {
          if (!(await checkAiQuota())) return false;
          await incrementAiUsage(user.id);
          return true;
        }}
      />

      <UndoToast
        onUndo={async (item) => {
          if (!user) return;
          const newId = await restoreDeck({
            ownerId: user.id,
            deck: item.deck,
            cards: item.cards,
          });
          router.push(`/decks/${newId}`);
        }}
      />
    </div>
  );
}
