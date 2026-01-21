
export async function aiChat(q: string): Promise<string> {
  // TODO: wire to OpenRouter/Groq/Gemini. MVP returns canned response.
  return `Dr. Eam here. You asked: ${q?.slice(0,160)}`;
}
