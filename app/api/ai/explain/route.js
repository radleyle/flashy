import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOpenRouter, AI_MODEL, parseJsonContent } from '@/lib/ai';

const systemPrompt = `You are a patient tutor helping a student understand a flashcard.
Write a short, clear explanation (3-5 sentences max) of the term and how the definition fits.
Optionally add one simple memory tip or example.
Return ONLY valid JSON:
{"explanation":"string","tip":"string"}
Do not wrap in markdown.`;

export async function POST(req) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const front = body?.front?.trim();
    const back = body?.back?.trim();
    if (!front || !back) {
      return NextResponse.json({ error: 'Term and definition are required' }, { status: 400 });
    }

    const openai = getOpenRouter();
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Term: ${front}\nDefinition: ${back}${
            body?.deckTitle ? `\nDeck: ${body.deckTitle}` : ''
          }`,
        },
      ],
    });

    const parsed = parseJsonContent(completion.choices[0]?.message?.content);
    return NextResponse.json({
      explanation: parsed.explanation || '',
      tip: parsed.tip || '',
    });
  } catch (error) {
    console.error('Explain error:', error);
    return NextResponse.json(
      { error: error.message || 'Could not explain this card.' },
      { status: 500 }
    );
  }
}
