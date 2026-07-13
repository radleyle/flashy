'use client';

import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';

function emptyCard(index = 0) {
  return { id: `temp_${Date.now()}_${index}`, front: '', back: '', mastery: 0 };
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
  onSave,
  saving,
  folderId,
  setFolderId,
  folders = [],
}) {
  const updateCard = (index, field, value) => {
    setCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, [field]: value } : card))
    );
  };

  const addCard = () => setCards((prev) => [...prev, emptyCard(prev.length)]);
  const removeCard = (index) =>
    setCards((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  return (
    <div className="space-y-8">
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
            className="w-full h-11 rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
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

      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Generate with AI</h2>
        <p className="mt-1 text-sm text-muted">
          Paste notes or a topic. We&apos;ll draft term / definition pairs you can edit.
        </p>
        <div className="mt-4">
          <TextArea
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            rows={4}
            placeholder="Paste study notes here…"
          />
        </div>
        <div className="mt-3">
          <Button onClick={onGenerate} disabled={generating || !aiText.trim()}>
            {generating ? 'Generating…' : 'Generate cards'}
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            Terms ({cards.length})
          </h2>
          <Button variant="secondary" size="sm" onClick={addCard}>
            Add card
          </Button>
        </div>

        {cards.map((card, index) => (
          <div
            key={card.id || index}
            className="grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[auto_1fr_1fr_auto]"
          >
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
        ))}
      </section>

      <div className="flex justify-end gap-3 pb-8">
        <Button onClick={onSave} disabled={saving || !title.trim()}>
          {saving ? 'Saving…' : 'Save deck'}
        </Button>
      </div>
    </div>
  );
}

export { emptyCard };
