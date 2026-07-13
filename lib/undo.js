const KEY = 'flash_undo_deck';

export function stashDeletedDeck(deck, cards) {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ deck, cards, savedAt: Date.now() })
    );
  } catch {
    // ignore
  }
}

export function peekDeletedDeck() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.savedAt > 5 * 60 * 1000) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearDeletedDeck() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
