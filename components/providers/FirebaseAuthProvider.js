'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getAuth, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';

const FirebaseAuthContext = createContext({
  ready: false,
  firebaseUser: null,
  error: null,
});

export function FirebaseAuthProvider({ children }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isLoaded) return undefined;

    let cancelled = false;
    const auth = getAuth(app);

    (async () => {
      setError(null);
      setReady(false);
      try {
        if (!isSignedIn || !userId) {
          if (auth.currentUser) await signOut(auth);
          if (!cancelled) {
            setFirebaseUser(null);
            setReady(true);
          }
          return;
        }

        if (auth.currentUser?.uid === userId) {
          if (!cancelled) setReady(true);
          return;
        }

        const res = await fetch('/api/firebase-token', { method: 'POST' });
        const text = await res.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          const preview = text.slice(0, 80).replace(/\s+/g, ' ');
          throw new Error(
            `Firebase token API returned non-JSON (HTTP ${res.status}). Check /api/firebase-health on this site. Preview: ${preview}`
          );
        }
        if (!res.ok) {
          throw new Error(
            data.error ||
              `Token request failed (HTTP ${res.status}). See /api/firebase-health`
          );
        }
        if (!data.token) throw new Error(data.error || 'No Firebase token returned');

        await signInWithCustomToken(auth, data.token);
        if (!cancelled) setReady(true);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(e.message);
          setReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId]);

  const value = useMemo(
    () => ({ ready, firebaseUser, error }),
    [ready, firebaseUser, error]
  );

  return (
    <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  return useContext(FirebaseAuthContext);
}
