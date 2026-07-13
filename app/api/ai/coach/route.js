import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOpenRouter, AI_MODEL, parseJsonContent } from '@/lib/ai';

const systemPrompt = `You coach a student who missed a flashcard answer.
Return ONLY JSON:
{"why":"1-2 sentences why the correct answer fits","tip":"one short memory tip","encouragement":"one short supportive line"}
Do not wrap in markdown.`;

export async function POST(req) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { front, back, userAnswer } = body || {};
    if (!front || !back) {
      return NextResponse.json({ error: 'Card required' }, { status: 400 });
    }

    const openai = getOpenRouter();
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Term: ${front}\nCorrect: ${back}\nStudent answered: ${userAnswer || '(blank)'}`,
        },
      ],
    });

    const parsed = parseJsonContent(completion.choices[0]?.message?.content);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Coach error:', error);
    return NextResponse.json({ error: error.message || 'Coach failed' }, { status: 500 });
  }
}
