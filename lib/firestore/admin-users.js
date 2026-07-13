import { getAdminDb, FieldValue } from '../firebase-admin';

export async function adminSetUserPlan(userId, plan, stripeData = {}) {
  const db = getAdminDb();
  const ref = db.collection('users').doc(userId);
  const snap = await ref.get();
  const payload = {
    plan,
    ...stripeData,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!snap.exists) {
    await ref.set({
      folders: [],
      aiGensToday: 0,
      aiGensDate: new Date().toISOString().slice(0, 10),
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      studyCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      ...payload,
    });
  } else {
    await ref.set(payload, { merge: true });
  }
}
