import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Safe diagnostics (no secrets). Open while signed out:
 *   https://YOUR_DOMAIN/api/firebase-health
 */
export async function GET() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '';
  const path =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    '';
  const hasFields = Boolean(
    (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );

  let jsonParseOk = false;
  let jsonParseError = null;
  let jsonHasPrivateKey = false;
  if (json) {
    try {
      let text = json.trim();
      if (
        (text.startsWith("'") && text.endsWith("'")) ||
        (text.startsWith('"') && text.endsWith('"'))
      ) {
        text = text.slice(1, -1);
      }
      const parsed = JSON.parse(text);
      jsonParseOk = true;
      jsonHasPrivateKey = Boolean(parsed.private_key);
    } catch (e) {
      jsonParseError = e.message;
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
    hasPathEnv: Boolean(path),
    pathValue: path || null,
    hasSplitFields: hasFields,
    adminOk,
    adminError,
    advice: adminOk
      ? 'Firebase Admin looks configured.'
      : 'On Vercel: remove FIREBASE_SERVICE_ACCOUNT_PATH; set FIREBASE_SERVICE_ACCOUNT_JSON as one-line JSON (or use FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY + FIREBASE_PROJECT_ID); Redeploy.',
  });
}
