import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { createId, createShareSlug } from '../id';

export async function listDecks(userId) {
  const q = query(collection(db, 'decks'), where('ownerId', '==', userId));
  const snap = await getDocs(q);
  const decks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return decks.sort((a, b) => {
    const aTime = a.updatedAt?.toMillis?.() || a.updatedAt || 0;
    const bTime = b.updatedAt?.toMillis?.() || b.updatedAt || 0;
    return bTime - aTime;
  });
}

export async function getDeck(deckId) {
  const snap = await getDoc(doc(db, 'decks', deckId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getDeckByShareSlug(slug) {
  const q = query(collection(db, 'decks'), where('shareSlug', '==', slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = { id: d.id, ...d.data() };
  if (data.visibility !== 'public') return null;
  return data;
}

export async function listCards(deckId) {
  const snap = await getDocs(collection(db, 'decks', deckId, 'cards'));
  const cards = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return cards.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function createDeck({
  ownerId,
  title,
  description = '',
  folderId = null,
  cards = [],
}) {
  const deckId = createId('deck');
  const shareSlug = createShareSlug();
  const deckRef = doc(db, 'decks', deckId);

  // Write deck first so card rules can get() the ownerId
  await setDoc(deckRef, {
    ownerId,
    title: title.trim() || 'Untitled deck',
    description: description.trim(),
    folderId,
    visibility: 'private',
    shareSlug,
    cardCount: cards.length,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (cards.length) {
    const batch = writeBatch(db);
    cards.forEach((card, index) => {
      const cardId = createId('card');
      batch.set(doc(db, 'decks', deckId, 'cards', cardId), {
        front: card.front || '',
        back: card.back || '',
        order: index,
        mastery: 0,
        lastStudiedAt: null,
      });
    });
    await batch.commit();
  }

  return deckId;
}

export async function updateDeckMeta(deckId, data) {
  await updateDoc(doc(db, 'decks', deckId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function replaceCards(deckId, cards) {
  const existing = await getDocs(collection(db, 'decks', deckId, 'cards'));
  const batch = writeBatch(db);
  existing.docs.forEach((d) => batch.delete(d.ref));

  cards.forEach((card, index) => {
    const cardId = card.id && !card.id.startsWith('temp_') ? card.id : createId('card');
    batch.set(doc(db, 'decks', deckId, 'cards', cardId), {
      front: card.front || '',
      back: card.back || '',
      order: index,
      mastery: typeof card.mastery === 'number' ? card.mastery : 0,
      lastStudiedAt: card.lastStudiedAt || null,
    });
  });

  batch.update(doc(db, 'decks', deckId), {
    cardCount: cards.length,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function deleteDeck(deckId) {
  const cardsSnap = await getDocs(collection(db, 'decks', deckId, 'cards'));
  // Delete cards before the parent so get(deck) still works for card rules
  if (!cardsSnap.empty) {
    const batch = writeBatch(db);
    cardsSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, 'decks', deckId));
}

export async function updateCardMastery(deckId, cardId, mastery) {
  await updateDoc(doc(db, 'decks', deckId, 'cards', cardId), {
    mastery: Math.max(0, Math.min(5, mastery)),
    lastStudiedAt: serverTimestamp(),
  });
}

export async function setDeckVisibility(deckId, visibility) {
  await updateDoc(doc(db, 'decks', deckId), {
    visibility,
    updatedAt: serverTimestamp(),
  });
}
