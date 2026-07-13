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
  if (!card.nextReviewAt) return true;
  return card.nextReviewAt <= today;
}

export function sortByDue(cards) {
  const today = new Date().toISOString().slice(0, 10);
  return [...cards].sort((a, b) => {
    const aDue = isDue(a, today) ? 0 : 1;
    const bDue = isDue(b, today) ? 0 : 1;
    if (aDue !== bDue) return aDue - bDue;
    return (a.mastery || 0) - (b.mastery || 0);
  });
}
