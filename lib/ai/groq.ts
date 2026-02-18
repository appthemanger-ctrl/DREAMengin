// lib/ai/groq.ts
// Minimal Groq (OpenAI-compatible) chat client for server-side use.

export type GroqRole = 'system' | 'user' | 'assistant';

export interface GroqMessage {
  role: GroqRole;
  content: string;
}

export interface GroqChatOptions {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
}

export async function groqChat(opts: GroqChatOptions): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  // Never throw at import time (breaks builds). If missing, fail softly.
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.2,
      max_tokens: opts.max_tokens ?? 900,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Groq error ${res.status}: ${text.slice(0, 500)}`);
  }

  const json: any = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Groq response missing content');
  }
  return content;
}
