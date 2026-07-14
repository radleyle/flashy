import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAdminDb } from '@/lib/firebase-admin';
import { isDue } from '@/lib/srs';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') || '';
  return header === `Bearer ${secret}`;
}

async function countDueForUser(db, userId) {
  const decksSnap = await db.collection('decks').where('ownerId', '==', userId).get();
  let due = 0;
  let decksWithDue = 0;
  for (const deckDoc of decksSnap.docs) {
    const cardsSnap = await deckDoc.ref.collection('cards').get();
    let deckDue = 0;
    cardsSnap.docs.forEach((c) => {
      if (isDue(c.data())) deckDue += 1;
    });
    if (deckDue > 0) {
      due += deckDue;
      decksWithDue += 1;
    }
  }
  return { due, decksWithDue };
}

export async function GET(req) {
  return run(req);
}

export async function POST(req) {
  return run(req);
}

async function run(req) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const from = process.env.EMAIL_FROM || 'Flashy <onboarding@resend.dev>';
  const base = (process.env.NEXT_PUBLIC_BASE_URL || 'https://flashy.study').replace(/\/$/, '');
  const resend = new Resend(process.env.RESEND_API_KEY);
  const db = getAdminDb();

  const usersSnap = await db.collection('users').where('emailDigest', '==', true).get();
  let sent = 0;
  let skipped = 0;

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();
    const email = user.email;
    if (!email) {
      skipped += 1;
      continue;
    }
    try {
      const { due, decksWithDue } = await countDueForUser(db, userDoc.id);
      const goal = user.dailyGoal || 20;
      const today = new Date().toISOString().slice(0, 10);
      const studied =
        user.cardsStudiedDate === today ? user.cardsStudiedToday || 0 : 0;

      if (due === 0 && studied >= goal) {
        skipped += 1;
        continue;
      }

      const subject =
        due > 0
          ? `Flashy — ${due} card${due === 1 ? '' : 's'} due today`
          : `Flashy — daily study reminder`;

      const lines = [
        `Hi,`,
        ``,
        due > 0
          ? `You have ${due} card${due === 1 ? '' : 's'} due across ${decksWithDue} set${decksWithDue === 1 ? '' : 's'}.`
          : `Nothing is scheduled due — nice. Keep your streak going.`,
        `Daily goal progress: ${studied}/${goal} cards.`,
        ``,
        `Open Flashy: ${base}/library`,
        ``,
        `Turn off digests anytime in Account.`,
      ];

      await resend.emails.send({
        from,
        to: email,
        subject,
        text: lines.join('\n'),
      });
      sent += 1;
    } catch (e) {
      console.error('[due-digest]', userDoc.id, e.message);
      skipped += 1;
    }
  }

  return NextResponse.json({ sent, skipped, total: usersSnap.size });
}
