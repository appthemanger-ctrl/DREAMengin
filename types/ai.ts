// types/ai.ts
// Section 13: AI System — Three-tier model
// AI lives inside widgets, not above system.

export type AITier = "dr_eams" | "idari" | "boogieman";

export type AIRole =
  | "creative"
  | "assistant"
  | "debugger"
  | "overseer"
  | "policy"
  | "enforcement";

export interface AIAgent {
  id: string;
  tier: AITier;
  roles: AIRole[];
  name: string;
  description: string;
  // AI lives inside widgets
  widget_id?: string;
  is_active: boolean;
  config?: Record<string, unknown>;
}

// Dr. Eams — User AI: Creative / Assistant
export interface DrEamsAgent extends AIAgent {
  tier: "dr_eams";
  roles: ("creative" | "assistant")[];
}

// IDARi — Admin AI: Debugger / Overseer
export interface IDARiAgent extends AIAgent {
  tier: "idari";
  roles: ("debugger" | "overseer")[];
}

// BoogieManAI — Policy / Enforcement
export interface BoogieManAgent extends AIAgent {
  tier: "boogieman";
  roles: ("policy" | "enforcement")[];
}

export type AnyAIAgent = DrEamsAgent | IDARiAgent | BoogieManAgent;
