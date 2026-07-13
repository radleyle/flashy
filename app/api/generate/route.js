import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@clerk/nextjs/server';

const systemPrompt = `You are a flashcard creator. Design concise term/definition flashcards for studying.
Rules:
1. Keep each front (term/question) and back (definition/answer) short and clear.
2. Focus on key concepts only.
3. Return ONLY valid JSON in this shape:
{"flashcards":[{"front":"str","back":"str"}]}
Do not wrap in markdown.`;

export async function POST(req) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'AI is not configured' }, { status: 500 });
  }

  try {
    const body = await req.json().catch(() => null);
    const text = typeof body?.text === 'string' ? body.text : await req.text();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      model: 'openai/gpt-3.5-turbo',
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);
    const flashcards = parsed.flashcards || parsed.flashcard || [];
    return NextResponse.json(flashcards);
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating flashcards.' },
      { status: 500 }
    );
  }
}
