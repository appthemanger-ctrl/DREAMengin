// lib/ai/router.ts
export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/** Minimal local stub so builds succeed without external AI keys. */
export async function aiChat({ messages }: { messages: ChatMessage[] }): Promise<string> {
  const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';
  const preview = lastUser.replace(/\s+/g, ' ').slice(0, 160);
  return `InnerDreams stub: processed ${preview.length} chars. Preview: "${preview}"`;
}
