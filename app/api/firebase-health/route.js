import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Safe diagnostics (no secrets). Open while signed out:
 *   https://YOUR_DOMAIN/api/firebase-health
 */
export async function GET() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '';
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || '';
  const path =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    '';
  const hasFields = Boolean(
    (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      (process.env.FIREBASE_PRIVATE_KEY ||
        (json && json.includes('BEGIN PRIVATE KEY')))
  );

  let jsonParseOk = false;
  let jsonParseError = null;
  let jsonHasPrivateKey = false;
  let jsonLooksLikePemOnly = false;
  if (json) {
    const trimmed = json.trim().replace(/^['"]|['"]$/g, '');
    jsonLooksLikePemOnly =
      trimmed.startsWith('-----BEGIN') ||
      (trimmed.startsWith('-') && trimmed.includes('PRIVATE KEY'));
    try {
      const parsed = JSON.parse(trimmed);
      jsonParseOk = true;
      jsonHasPrivateKey = Boolean(parsed.private_key);
    } catch (e) {
      jsonParseError = e.message;
    }
  }

  let b64Ok = false;
  let b64Error = null;
  if (b64) {
    try {
      const decoded = Buffer.from(b64.trim(), 'base64').toString('utf8');
      JSON.parse(decoded);
      b64Ok = true;
    } catch (e) {
      b64Error = e.message;
    }
  }

  let adminOk = false;
  let adminError = null;
  try {
    const { getAdminAuth } = await import('@/lib/firebase-admin');
    getAdminAuth();
    adminOk = true;
  } catch (e) {
    adminError = e.message;
  }

  return NextResponse.json({
    node: process.version,
    hasJsonEnv: Boolean(json),
    jsonLength: json.length,
    jsonParseOk,
    jsonParseError,
    jsonHasPrivateKey,
    jsonLooksLikePemOnly,
    hasBase64Env: Boolean(b64),
    b64Ok,
    b64Error,
    hasPathEnv: Boolean(path),
    pathValue: path || null,
    hasSplitFields: hasFields,
    adminOk,
    adminError,
    advice: adminOk
      ? 'Firebase Admin looks configured.'
      : jsonLooksLikePemOnly
        ? 'FIREBASE_SERVICE_ACCOUNT_JSON currently contains only a private key. Replace it with the FULL service-account JSON, or use FIREBASE_SERVICE_ACCOUNT_BASE64, or set FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL + FIREBASE_PROJECT_ID.'
        : 'On Vercel set FIREBASE_SERVICE_ACCOUNT_BASE64 or a valid full FIREBASE_SERVICE_ACCOUNT_JSON object, then Redeploy.',
  });
}
