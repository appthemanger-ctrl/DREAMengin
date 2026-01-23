// Minimal AI router so builds never fail
// Usage: aiChat({ messages: [{ role: 'user', content: 'hello'}] })
export async function aiChat(input) {
  if (typeof input === 'string') return `Dr. Eam says: ${input}`;
  const messages = input?.messages ?? [];
  const last = messages.length ? messages[messages.length - 1].content : '';
  return `Dr. Eam says: ${last}`;
}

export async function aiComplete(prompt) {
  return `Result: ${String(prompt ?? '').slice(0, 400)}`;
}
