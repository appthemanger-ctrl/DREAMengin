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

// Typed shape of a successful Groq API response.
interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

function parseGroqResponse(json: unknown): string {
  if (
    json == null ||
    typeof json !== 'object' ||
    !('choices' in json) ||
    !Array.isArray((json as GroqResponse).choices) ||
    (json as GroqResponse).choices.length === 0
  ) {
    throw new Error('Groq response missing content');
  }
  const content = (json as GroqResponse).choices[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Groq response missing content');
  }
  return content;
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

  const json: unknown = await res.json();
  return parseGroqResponse(json);
}

/**
 * Health-check ping — returns true when the Groq API is reachable and the
 * key is valid, false otherwise.  Never throws.  Used by IDARi's health
 * monitor (req #86).
 */
export async function groqHealthCheck(): Promise<boolean> {
  try {
    await groqChat({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
      temperature: 0,
    });
    return true;
  } catch {
    return false;
  }
}
