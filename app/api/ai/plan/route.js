import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOpenRouter, AI_MODEL, parseJsonContent } from '@/lib/ai';

const systemPrompt = `Create a short study plan for a flashcard deck.
Return ONLY JSON:
{"summary":"1 sentence","days":[{"day":1,"focus":"string","cardHint":"which cards or themes to prioritize","minutes":20}]}
Make 3-7 days based on examDays. Do not wrap in markdown.`;

export async function POST(req) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const examDays = Math.min(Math.max(Number(body?.examDays) || 7, 2), 21);
    const title = body?.title || 'Deck';
    const cards = Array.isArray(body?.cards) ? body.cards.slice(0, 30) : [];

    const openai = getOpenRouter();
    const list = cards.map((c, i) => `${i + 1}. ${c.front}`).join('\n');
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Deck: ${title}\nExam in ${examDays} days\nCards:\n${list || '(empty)'}`,
        },
      ],
    });

    return NextResponse.json(parseJsonContent(completion.choices[0]?.message?.content));
  } catch (error) {
    console.error('Plan error:', error);
    return NextResponse.json({ error: error.message || 'Plan failed' }, { status: 500 });
  }
}
