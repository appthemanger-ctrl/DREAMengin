/**
 * Dr. Eam local stub.
 * Accepts either a string prompt or {messages:[{role,content}...]}
 * Returns a short friendly answer, never errors builds.
 */

/** @param {string|{messages:{role:string,content:string}[]}} input */
export async function aiChat(input) {
  let prompt = '';
  if (typeof input === 'string') {
    prompt = input;
  } else if (input && Array.isArray(input.messages)) {
    prompt = input.messages.map(m => `${m.role}: ${m.content}`).join('\n').slice(0, 4000);
  }
  const base = "I'm Dr. Eam. For live AI later, connect an API key. For now:";
  const reply = (prompt || 'No prompt').slice(0, 240);
  return `${base} ${reply}`;
}
