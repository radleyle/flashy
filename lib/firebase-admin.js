import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

function stripWrappingQuotes(text) {
  let t = String(text).trim();
  if (
    (t.startsWith("'") && t.endsWith("'")) ||
    (t.startsWith('"') && t.endsWith('"'))
  ) {
    t = t.slice(1, -1);
  }
  return t.trim();
}

function parseServiceAccountJson(raw) {
  const text = stripWrappingQuotes(raw);

  // Common mistake: pasting only the private key into FIREBASE_SERVICE_ACCOUNT_JSON
  if (text.startsWith('-----BEGIN') || text.startsWith('-')) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON looks like a private key, not JSON. Either paste the FULL service-account JSON object, or set FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL + FIREBASE_PROJECT_ID separately.'
    );
  }

  const parsed = JSON.parse(text);
  if (parsed.private_key && typeof parsed.private_key === 'string') {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }
  return parsed;
}

function getCredential() {
  // Base64 of the full JSON (most reliable on Vercel)
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    try {
      const decoded = Buffer.from(stripWrappingQuotes(b64), 'base64').toString('utf8');
      return cert(parseServiceAccountJson(decoded));
    } catch (e) {
      console.error('FIREBASE_SERVICE_ACCOUNT_BASE64 failed:', e.message);
    }
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      return cert(parseServiceAccountJson(json));
    } catch (e) {
      console.error('FIREBASE_SERVICE_ACCOUNT_JSON parse failed:', e.message);
      // If they pasted a PEM into JSON by mistake, fall through to split fields
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Also accept PEM mistakenly stored in the JSON env var
  if (!privateKey && json) {
    const maybePem = stripWrappingQuotes(json);
    if (maybePem.includes('BEGIN PRIVATE KEY')) {
      privateKey = maybePem;
    }
  }

  if (projectId && clientEmail && privateKey) {
    return cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    });
  }

  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (filePath) {
    const absolute = resolve(process.cwd(), filePath);
    if (!existsSync(absolute)) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_PATH is set to "${filePath}" but that file is not on the server. On Vercel use FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY + FIREBASE_PROJECT_ID.`
      );
    }
    return cert(JSON.parse(readFileSync(absolute, 'utf8')));
  }

  return null;
}

export function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const credential = getCredential();
  if (!credential) {
    throw new Error(
      'Firebase Admin is not configured. On Vercel set FIREBASE_SERVICE_ACCOUNT_BASE64 (or full FIREBASE_SERVICE_ACCOUNT_JSON object — not just the private key). Locally you can use FIREBASE_SERVICE_ACCOUNT_PATH.'
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
