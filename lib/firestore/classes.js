import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { createId } from '../id';

function joinCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function syncDeckReaders(deckId, memberIds) {
  const ref = doc(db, 'decks', deckId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const existing = snap.data().readerIds || [];
  const readerIds = Array.from(new Set([...existing, ...(memberIds || [])]));
  await updateDoc(ref, { readerIds });
}

export async function createClass({ ownerId, name }) {
  const id = createId('class');
  const code = joinCode();
  await setDoc(doc(db, 'classes', id), {
    ownerId,
    name: name.trim() || 'Untitled class',
    joinCode: code,
    memberIds: [ownerId],
    deckIds: [],
    createdAt: serverTimestamp(),
  });
  return { id, joinCode: code };
}

export async function listOwnedClasses(userId) {
  const q = query(collection(db, 'classes'), where('ownerId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listJoinedClasses(userId) {
  const q = query(collection(db, 'classes'), where('memberIds', 'array-contains', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function joinClassByCode(userId, code) {
  const q = query(
    collection(db, 'classes'),
    where('joinCode', '==', code.trim().toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('No class found for that code');
  const ref = snap.docs[0].ref;
  const data = snap.docs[0].data();
  const memberIds = Array.from(new Set([...(data.memberIds || []), userId]));
  await updateDoc(ref, { memberIds });
  await Promise.all((data.deckIds || []).map((deckId) => syncDeckReaders(deckId, [userId])));
  return { id: snap.docs[0].id, ...data, memberIds };
}

export async function addDeckToClass(classId, deckId) {
  const ref = doc(db, 'classes', classId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Class not found');
  const data = snap.data();
  const deckIds = Array.from(new Set([...(data.deckIds || []), deckId]));
  await updateDoc(ref, { deckIds });
  await syncDeckReaders(deckId, data.memberIds || []);
}

export async function getClass(classId) {
  const snap = await getDoc(doc(db, 'classes', classId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
