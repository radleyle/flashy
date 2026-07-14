const DB_NAME = 'flashy-offline';
const DB_VERSION = 1;
const DECKS = 'decks';
const MASTERY_Q = 'masteryQueue';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DECKS)) db.createObjectStore(DECKS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(MASTERY_Q)) {
        db.createObjectStore(MASTERY_Q, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function cacheDeckOffline(deck, cards) {
  if (typeof indexedDB === 'undefined' || !deck?.id) return;
  const db = await openDb();
  const tx = db.transaction(DECKS, 'readwrite');
  tx.objectStore(DECKS).put({
    id: deck.id,
    deck,
    cards,
    cachedAt: Date.now(),
  });
  await txDone(tx);
}

export async function getCachedDeck(deckId) {
  if (typeof indexedDB === 'undefined') return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DECKS, 'readonly');
    const req = tx.objectStore(DECKS).get(deckId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function queueMasteryUpdate(deckId, cardId, mastery) {
  if (typeof indexedDB === 'undefined') return;
  const db = await openDb();
  const tx = db.transaction(MASTERY_Q, 'readwrite');
  tx.objectStore(MASTERY_Q).put({
    key: `${deckId}:${cardId}`,
    deckId,
    cardId,
    mastery,
    at: Date.now(),
  });
  await txDone(tx);
}

export async function flushMasteryQueue(updateFn) {
  if (typeof indexedDB === 'undefined') return 0;
  const db = await openDb();
  const items = await new Promise((resolve, reject) => {
    const tx = db.transaction(MASTERY_Q, 'readonly');
    const req = tx.objectStore(MASTERY_Q).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
  let n = 0;
  for (const item of items) {
    try {
      await updateFn(item.deckId, item.cardId, item.mastery);
      const tx = db.transaction(MASTERY_Q, 'readwrite');
      tx.objectStore(MASTERY_Q).delete(item.key);
      await txDone(tx);
      n += 1;
    } catch {
      /* keep queued */
    }
  }
  return n;
}
