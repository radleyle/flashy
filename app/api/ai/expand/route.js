import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOpenRouter, AI_MODEL, parseJsonContent } from '@/lib/ai';

const systemPrompt = `You expand an existing flashcard deck with related new cards.
Rules:
1. Do NOT duplicate existing terms.
2. Keep front/back concise and study-friendly.
3. Stay on the same topic as the existing cards.
4. Return ONLY valid JSON:
{"flashcards":[{"front":"str","back":"str"}]}
Do not wrap in markdown.`;

export async function POST(req) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const existing = Array.isArray(body?.cards) ? body.cards : [];
    const count = Math.min(Math.max(Number(body?.count) || 5, 1), 15);
    const title = body?.title || 'Untitled deck';

    if (!existing.length) {
      return NextResponse.json(
        { error: 'Add at least one card before expanding.' },
        { status: 400 }
      );
    }

    const openai = getOpenRouter();
    const summary = existing
      .slice(0, 40)
      .map((c, i) => `${i + 1}. ${c.front} — ${c.back}`)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Deck title: ${title}\nExisting cards:\n${summary}\n\nCreate ${count} NEW related flashcards.`,
        },
      ],
    });

    const parsed = parseJsonContent(completion.choices[0]?.message?.content);
    const flashcards = parsed.flashcards || [];
    return NextResponse.json(flashcards);
  } catch (error) {
    console.error('Expand error:', error);
    return NextResponse.json(
      { error: error.message || 'Could not expand this deck.' },
      { status: 500 }
    );
  }
}
