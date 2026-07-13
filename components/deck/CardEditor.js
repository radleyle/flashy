'use client';

import { useRef } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import { cardsToCsv, downloadCsv, parseCsv } from '@/lib/csv';

function emptyCard(index = 0) {
  return {
    id: `temp_${Date.now()}_${index}`,
    front: '',
    back: '',
    mastery: 0,
    imageUrl: '',
    difficulty: '',
  };
}

export default function CardEditor({
  title,
  setTitle,
  description,
  setDescription,
  cards,
  setCards,
  aiText,
  setAiText,
  onGenerate,
  generating,
  onExpand,
  expanding,
  onTagDifficulty,
  tagging,
  onSave,
  saving,
  folderId,
  setFolderId,
  folders = [],
}) {
  const fileRef = useRef(null);

  const updateCard = (index, field, value) => {
    setCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, [field]: value } : card))
    );
  };

  const addCard = () => setCards((prev) => [...prev, emptyCard(prev.length)]);
  const removeCard = (index) =>
    setCards((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  const hasCards = cards.some((c) => c.front.trim() || c.back.trim());

  const onExport = () => {
    const cleaned = cards.filter((c) => c.front.trim() || c.back.trim());
    downloadCsv(`${(title || 'deck').replace(/\s+/g, '-').toLowerCase()}.csv`, cardsToCsv(cleaned));
  };

  const onImportFile = async (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    const text = await file.text();
    if (name.endsWith('.csv') || name.endsWith('.tsv')) {
      const parsed = parseCsv(text);
      if (!parsed.length) return;
      setCards(
        parsed.map((c, i) => ({
          ...emptyCard(i),
          front: c.front,
          back: c.back,
          imageUrl: c.imageUrl || '',
          difficulty: c.difficulty || '',
        }))
      );
      return;
    }
    // .txt / .md / pasted PDF text — feed into AI notes box
    setAiText((prev) => (prev ? `${prev}\n\n${text}` : text));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Biology Chapter 3"
        />
        <label className="block w-full">
          <span className="mb-1.5 block text-sm font-medium text-ink">Folder</span>
          <select
            value={folderId || ''}
            onChange={(e) => setFolderId(e.target.value || null)}
            className="w-full h-11 rounded-xl border border-line bg-surface px-3.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            <option value="">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <TextArea
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        placeholder="What is this deck about?"
      />

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-lg font-bold text-ink">Generate with AI</h2>
        <p className="mt-1 text-sm text-muted">
          Paste notes, upload a .txt/.md, or import a CSV. For PDFs, paste the text here.
        </p>
        <div className="mt-4">
          <TextArea
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            rows={4}
            placeholder="Paste study notes here…"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={onGenerate} disabled={generating || expanding || tagging || !aiText.trim()}>
            {generating ? 'Generating…' : 'Generate cards'}
          </Button>
          <Button
            variant="secondary"
            onClick={onExpand}
            disabled={generating || expanding || tagging || !hasCards}
          >
            {expanding ? 'Adding…' : 'Add related cards'}
          </Button>
          {onTagDifficulty ? (
            <Button
              variant="secondary"
              onClick={onTagDifficulty}
              disabled={generating || expanding || tagging || !hasCards}
            >
              {tagging ? 'Tagging…' : 'Tag difficulty'}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>
            Import file
          </Button>
          <Button variant="ghost" onClick={onExport} disabled={!hasCards}>
            Export CSV
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt,.md,.pdf,text/plain,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              onImportFile(f);
              e.target.value = '';
            }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          CSV columns: term, definition (optional: imageUrl, difficulty). PDF: copy text into the box, then Generate.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">
            Terms ({cards.length})
          </h2>
          <Button variant="secondary" size="sm" onClick={addCard}>
            Add card
          </Button>
        </div>

        {cards.map((card, index) => (
          <div
            key={card.id || index}
            className="space-y-3 rounded-2xl border border-line bg-surface p-4"
          >
            <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr_auto]">
              <div className="flex h-11 w-8 items-center justify-center text-sm font-medium text-muted">
                {index + 1}
              </div>
              <Input
                value={card.front}
                onChange={(e) => updateCard(index, 'front', e.target.value)}
                placeholder="Term"
              />
              <Input
                value={card.back}
                onChange={(e) => updateCard(index, 'back', e.target.value)}
                placeholder="Definition"
              />
              <button
                type="button"
                onClick={() => removeCard(index)}
                className="h-11 px-2 text-sm text-muted hover:text-red-600"
                aria-label="Remove card"
              >
                Remove
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 pl-0 sm:pl-11">
              <Input
                value={card.imageUrl || ''}
                onChange={(e) => updateCard(index, 'imageUrl', e.target.value)}
                placeholder="Image URL (optional)"
              />
              <label className="block w-full">
                <span className="sr-only">Difficulty</span>
                <select
                  value={card.difficulty || ''}
                  onChange={(e) => updateCard(index, 'difficulty', e.target.value)}
                  className="w-full h-11 rounded-xl border border-line bg-surface px-3.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
            </div>
            {card.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.imageUrl}
                alt=""
                className="ml-0 sm:ml-11 h-24 w-auto rounded-lg border border-line object-cover"
              />
            ) : null}
          </div>
        ))}
      </section>

      <div className="flex justify-end gap-3 pb-6">
        <Button onClick={onSave} disabled={saving || !title.trim()}>
          {saving ? 'Saving…' : 'Save deck'}
        </Button>
      </div>
    </div>
  );
}

export { emptyCard };
