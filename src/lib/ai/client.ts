/**
 * AI provider wrapper — server-side only.
 *
 * Environment variables (set in Vercel / .env.local):
 *   AI_PROVIDER          – "openai" | "anthropic" | "mock"  (default "mock")
 *   AI_API_KEY           – API key for the chosen provider
 *   AI_MODEL_EAMS        – model for Dr. Eams  (optional override)
 *   AI_MODEL_IDARI       – model for IDARi     (optional override)
 *   AI_MODEL_BOOGIEMAN   – model for TheBoogieMan (optional override)
 */

export type AiAgent = "eams" | "idari" | "boogieman";

const PROVIDER = process.env.AI_PROVIDER ?? "mock";
const API_KEY = process.env.AI_API_KEY ?? "";

const MODEL_DEFAULTS: Record<AiAgent, string> = {
  eams: "gpt-4o-mini",
  idari: "gpt-4o",
  boogieman: "gpt-4o",
};

function modelFor(agent: AiAgent): string {
  const envKey = `AI_MODEL_${agent.toUpperCase()}` as keyof NodeJS.ProcessEnv;
  return (process.env[envKey] as string | undefined) ?? MODEL_DEFAULTS[agent];
}

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiResponse {
  content: string;
  agent: AiAgent;
  model: string;
}

/** Send messages to the specified AI agent and return the reply. */
export async function callAi(
  agent: AiAgent,
  messages: AiMessage[]
): Promise<AiResponse> {
  const model = modelFor(agent);

  if (PROVIDER === "mock") {
    return {
      content: `[${agent.toUpperCase()} mock] Received ${messages.length} message(s).`,
      agent,
      model: "mock",
    };
  }

  if (PROVIDER === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ model, messages }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${text}`);
    }
    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    return {
      content: data.choices[0]?.message?.content ?? "",
      agent,
      model,
    };
  }

  throw new Error(`Unsupported AI_PROVIDER: ${PROVIDER}`);
}
