import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { recordStudyActivity } from './users';

export async function createStudySession({
  userId,
  deckId,
  mode,
  results = {},
}) {
  const ref = await addDoc(collection(db, 'studySessions'), {
    userId,
    deckId,
    mode,
    startedAt: serverTimestamp(),
    endedAt: serverTimestamp(),
    results,
  });
  const streak = await recordStudyActivity(userId);
  return { id: ref.id, streak };
}

export async function listRecentSessions(userId, max = 20) {
  try {
    const q = query(
      collection(db, 'studySessions'),
      where('userId', '==', userId),
      orderBy('endedAt', 'desc'),
      limit(max)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    // Fallback if composite index is missing
    const q = query(collection(db, 'studySessions'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const aTime = a.endedAt?.toMillis?.() || 0;
        const bTime = b.endedAt?.toMillis?.() || 0;
        return bTime - aTime;
      })
      .slice(0, max);
  }
}
