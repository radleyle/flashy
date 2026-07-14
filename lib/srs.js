/** Lightweight spaced-repetition helpers (mastery 0–5). */

const INTERVAL_DAYS = [0, 1, 2, 4, 7, 14];

export function daysFromMastery(mastery) {
  const m = Math.max(0, Math.min(5, mastery || 0));
  return INTERVAL_DAYS[m] ?? 14;
}

export function nextReviewDate(mastery, from = new Date()) {
  const days = daysFromMastery(mastery);
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isDue(card, today = new Date().toISOString().slice(0, 10)) {
  // Never-reviewed cards are "new", not scheduled due
  if (!card.nextReviewAt) return false;
  return card.nextReviewAt <= today;
}

export function isNew(card) {
  return !card.nextReviewAt;
}

export function sortByDue(cards) {
  const today = new Date().toISOString().slice(0, 10);
  return [...cards].sort((a, b) => {
    const rank = (c) => {
      if (isDue(c, today)) return 0;
      if (isNew(c)) return 1;
      return 2;
    };
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
    return (a.mastery || 0) - (b.mastery || 0);
  });
}
