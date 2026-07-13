import OpenAI from 'openai';

export function getOpenRouter() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('AI is not configured');
  }
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  });
}

export const AI_MODEL = 'openai/gpt-3.5-turbo';

export function parseJsonContent(raw) {
  const cleaned = (raw || '{}').replace(/^```json\s*|```$/g, '').trim();
  return JSON.parse(cleaned);
}
