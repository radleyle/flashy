import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAdminDb, FieldValue } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { code } = await req.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Join code required' }, { status: 400 });
    }

    const db = getAdminDb();
    const snap = await db
      .collection('classes')
      .where('joinCode', '==', code.trim().toUpperCase())
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: 'No class found for that code' }, { status: 404 });
    }

    const classDoc = snap.docs[0];
    const data = classDoc.data();
    await classDoc.ref.update({
      memberIds: FieldValue.arrayUnion(userId),
    });

    const deckIds = data.deckIds || [];
    await Promise.all(
      deckIds.map((deckId) =>
        db
          .collection('decks')
          .doc(deckId)
          .update({ readerIds: FieldValue.arrayUnion(userId) })
          .catch(() => null)
      )
    );

    return NextResponse.json({ id: classDoc.id, name: data.name });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Join failed' }, { status: 500 });
  }
}
