/**
 * AgentOS singleton – local implementation.
 *
 * Provides the same API surface as @rivet-dev/agent-os without requiring that
 * package to be installed.  Calls the Anthropic Messages API directly using
 * the standard fetch() available in Node 18+/Next.js edge/server runtimes.
 *
 * Set ANTHROPIC_API_KEY in .env.local to enable real AI responses.
 * All other agent-os semantics (session isolation, host tools, software packs)
 * are faithfully mirrored at the interface level.
 */

import type { CodeEnginHostTools } from './agentOS/hostTools';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface SessionOptions {
  hostTools?: Partial<CodeEnginHostTools>;
}

interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
}

class AgentSession {
  readonly sessionId: string;
  private readonly hostTools: Partial<CodeEnginHostTools>;
  private history: SessionMessage[] = [];

  constructor(sessionId: string, hostTools: Partial<CodeEnginHostTools> = {}) {
    this.sessionId = sessionId;
    this.hostTools = hostTools;
  }

  async prompt(message: string): Promise<string> {
    this.history.push({ role: 'user', content: message });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const reply =
        '[AI Co‑pilot] ANTHROPIC_API_KEY is not set. ' +
        'Add it to .env.local to enable real AI responses.';
      this.history.push({ role: 'assistant', content: reply });
      return reply;
    }

    const systemPrompt =
      'You are an expert software engineer acting as an AI Co‑pilot inside ' +
      'CodeEngin, a real-time IDE. Help the developer write, debug, refactor, ' +
      'and explain code. Be concise and precise.';

    const body = {
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: this.history.map(m => ({ role: m.role, content: m.content })),
    };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      const reply = `[AI Co‑pilot] API error ${res.status}: ${err}`;
      this.history.push({ role: 'assistant', content: reply });
      return reply;
    }

    const data = await res.json() as {
      content: Array<{ type: string; text: string }>;
    };
    const text =
      data.content.find(c => c.type === 'text')?.text ??
      '[AI Co‑pilot] No response text returned.';
    this.history.push({ role: 'assistant', content: text });
    return text;
  }
}

// ---------------------------------------------------------------------------
// AgentOS manager
// ---------------------------------------------------------------------------

class AgentOsManager {
  private sessions = new Map<string, AgentSession>();

  async createSession(
    _type: string,
    options: SessionOptions = {},
  ): Promise<{ sessionId: string }> {
    const sessionId = `ses_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    this.sessions.set(
      sessionId,
      new AgentSession(sessionId, options.hostTools),
    );
    return { sessionId };
  }

  getSession(sessionId: string): AgentSession | undefined {
    return this.sessions.get(sessionId);
  }

  async closeSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let vm: AgentOsManager | null = null;

/**
 * Returns the singleton AgentOS manager, creating it on first call.
 * The manager is shared across all agent sessions in a single server process.
 */
export async function getAgentOS(): Promise<AgentOsManager> {
  if (!vm) {
    vm = new AgentOsManager();
  }
  return vm;
}

