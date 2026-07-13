import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOpenRouter, AI_MODEL, parseJsonContent } from '@/lib/ai';

const systemPrompt = `Assign difficulty to flashcards: easy | medium | hard.
Return ONLY JSON:
{"cards":[{"front":"must match input front","difficulty":"easy|medium|hard"}]}
Do not wrap in markdown.`;

export async function POST(req) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const cards = Array.isArray(body?.cards) ? body.cards.slice(0, 40) : [];
    if (!cards.length) {
      return NextResponse.json({ error: 'Cards required' }, { status: 400 });
    }

    const openai = getOpenRouter();
    const list = cards.map((c, i) => `${i + 1}. ${c.front} — ${c.back}`).join('\n');
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: list },
      ],
    });

    const parsed = parseJsonContent(completion.choices[0]?.message?.content);
    return NextResponse.json(parsed.cards || []);
  } catch (error) {
    console.error('Difficulty error:', error);
    return NextResponse.json({ error: error.message || 'Tagging failed' }, { status: 500 });
  }
}
