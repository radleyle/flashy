import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

function parseServiceAccountJson(raw) {
  let text = String(raw).trim();
  // Vercel UI sometimes wraps values in extra quotes
  if (
    (text.startsWith("'") && text.endsWith("'")) ||
    (text.startsWith('"') && text.endsWith('"'))
  ) {
    text = text.slice(1, -1);
  }
  const parsed = JSON.parse(text);
  if (parsed.private_key && typeof parsed.private_key === 'string') {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }
  return parsed;
}

function getCredential() {
  // Prefer JSON on serverless (Vercel). A leftover FIREBASE_SERVICE_ACCOUNT_PATH
  // from .env.local will crash if we try the file first.
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      return cert(parseServiceAccountJson(json));
    } catch (e) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_JSON is invalid (${e.message}). Paste the full service-account JSON as one line in Vercel.`
      );
    }
  }

  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (filePath) {
    const absolute = resolve(process.cwd(), filePath);
    if (!existsSync(absolute)) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_PATH is set to "${filePath}" but that file is not on the server. On Vercel: remove FIREBASE_SERVICE_ACCOUNT_PATH and set FIREBASE_SERVICE_ACCOUNT_JSON instead.`
      );
    }
    return cert(JSON.parse(readFileSync(absolute, 'utf8')));
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return cert({ projectId, clientEmail, privateKey });
  }

  return null;
}

export function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const credential = getCredential();
  if (!credential) {
    throw new Error(
      'Firebase Admin is not configured. On Vercel set FIREBASE_SERVICE_ACCOUNT_JSON (one-line JSON). Locally you can use FIREBASE_SERVICE_ACCOUNT_PATH.'
    );
  }

  return initializeApp({
    credential,
    projectId:
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      'flashcard-saas-cb092',
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export { FieldValue };
