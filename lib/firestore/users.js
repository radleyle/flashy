import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { createId } from '../id';

export async function ensureUser(userId) {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      plan: 'free',
      folders: [],
      aiGensToday: 0,
      aiGensDate: new Date().toISOString().slice(0, 10),
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      studyCount: 0,
      createdAt: serverTimestamp(),
    });
    return {
      id: userId,
      plan: 'free',
      folders: [],
      aiGensToday: 0,
      aiGensDate: new Date().toISOString().slice(0, 10),
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      studyCount: 0,
    };
  }
  return { id: userId, ...snap.data() };
}

export async function getUser(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return { id: userId, ...snap.data() };
}

export async function setUserPlan(userId, plan, stripeData = {}) {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  const payload = {
    plan,
    ...stripeData,
    updatedAt: serverTimestamp(),
  };
  if (!snap.exists()) {
    await setDoc(ref, {
      folders: [],
      aiGensToday: 0,
      aiGensDate: new Date().toISOString().slice(0, 10),
      createdAt: serverTimestamp(),
      ...payload,
    });
  } else {
    await updateDoc(ref, payload);
  }
}

export async function addFolder(userId, name) {
  const folder = {
    id: createId('folder'),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
  await updateDoc(doc(db, 'users', userId), {
    folders: arrayUnion(folder),
  });
  return folder;
}

export async function renameFolder(userId, folderId, name) {
  const user = await ensureUser(userId);
  const folders = (user.folders || []).map((f) =>
    f.id === folderId ? { ...f, name: name.trim() } : f
  );
  await updateDoc(doc(db, 'users', userId), { folders });
  return folders;
}

export async function deleteFolder(userId, folderId) {
  const user = await ensureUser(userId);
  const folders = (user.folders || []).filter((f) => f.id !== folderId);
  await updateDoc(doc(db, 'users', userId), { folders });
  return folders;
}

/** Returns gens used today after resetting if the calendar day changed. */
export async function getAiUsage(userId) {
  const user = await ensureUser(userId);
  const today = new Date().toISOString().slice(0, 10);
  if (user.aiGensDate !== today) {
    await updateDoc(doc(db, 'users', userId), {
      aiGensToday: 0,
      aiGensDate: today,
    });
    return 0;
  }
  return user.aiGensToday || 0;
}

export async function incrementAiUsage(userId) {
  const used = await getAiUsage(userId);
  const today = new Date().toISOString().slice(0, 10);
  await updateDoc(doc(db, 'users', userId), {
    aiGensToday: used + 1,
    aiGensDate: today,
  });
  return used + 1;
}

function dayDiff(a, b) {
  const ms = Date.parse(b) - Date.parse(a);
  return Math.round(ms / 86400000);
}

/** Updates streak after a completed study session. */
export async function recordStudyActivity(userId) {
  const user = await ensureUser(userId);
  const today = new Date().toISOString().slice(0, 10);
  const last = user.lastStudyDate || null;

  let currentStreak = user.currentStreak || 0;
  if (last === today) {
    // already counted today
  } else if (last && dayDiff(last, today) === 1) {
    currentStreak += 1;
  } else {
    currentStreak = 1;
  }

  const longestStreak = Math.max(user.longestStreak || 0, currentStreak);
  const studyCount = (user.studyCount || 0) + 1;

  await updateDoc(doc(db, 'users', userId), {
    lastStudyDate: today,
    currentStreak,
    longestStreak,
    studyCount,
  });

  return { currentStreak, longestStreak, studyCount, lastStudyDate: today };
}
