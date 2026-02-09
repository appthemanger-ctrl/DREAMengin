// lib/ai/AISystem.ts
// Three-Tier AI System (§13)
//
// Dr. Eams  — User AI      — Creative / Assistant
// IDARi     — Admin AI     — Debugger / Overseer
// BoogieManAI — Policy AI  — Policy / Enforcement
//
// AI lives inside widgets. Not above system.

import widgetBus from '@/lib/widgets/WidgetBus';

// =============================================================================
// AI TIERS
// =============================================================================

export type AITier = 'dr_eams' | 'idari' | 'boogieman';

export type AIRole = 'creative' | 'assistant' | 'debugger' | 'overseer' | 'policy' | 'enforcement';

export interface AIAgent {
  id: string;
  tier: AITier;
  name: string;
  roles: AIRole[];
  // The widget this agent lives inside (§13: AI lives inside widgets)
  hostWidgetId?: string;
  active: boolean;
}

// =============================================================================
// AI MESSAGE (inter-agent communication)
// =============================================================================

export interface AIMessage {
  from: AITier;
  to: AITier | 'broadcast';
  action: string;
  payload?: Record<string, unknown>;
  timestamp: number;
}

// =============================================================================
// THREE-TIER AI SYSTEM
// =============================================================================

class AISystem {
  private agents: Map<AITier, AIAgent> = new Map();

  constructor() {
    // Register the three core agents
    this.agents.set('dr_eams', {
      id: 'dr_eams',
      tier: 'dr_eams',
      name: 'Dr. Eams',
      roles: ['creative', 'assistant'],
      active: true,
    });
    this.agents.set('idari', {
      id: 'idari',
      tier: 'idari',
      name: 'IDARi',
      roles: ['debugger', 'overseer'],
      active: true,
    });
    this.agents.set('boogieman', {
      id: 'boogieman',
      tier: 'boogieman',
      name: 'BoogieManAI',
      roles: ['policy', 'enforcement'],
      active: true,
    });
  }

  // ---- Agent Access ----

  getAgent(tier: AITier): AIAgent | undefined {
    return this.agents.get(tier);
  }

  getAllAgents(): AIAgent[] {
    return Array.from(this.agents.values());
  }

  // ---- Bind agent to a widget (§13: AI lives inside widgets) ----

  bindToWidget(tier: AITier, widgetId: string): void {
    const agent = this.agents.get(tier);
    if (agent) {
      agent.hostWidgetId = widgetId;
      widgetBus.emit(`ai:bound`, { tier, widgetId });
    }
  }

  // ---- Inter-agent messaging via WidgetBus ----

  send(message: AIMessage): void {
    const channel =
      message.to === 'broadcast'
        ? 'ai:broadcast'
        : `ai:${message.to}`;
    widgetBus.emit(channel, message);
  }

  onMessage(tier: AITier, callback: (msg: AIMessage) => void): () => void {
    const directHandler = (msg: any) => callback(msg as AIMessage);
    const broadcastHandler = (msg: any) => {
      if ((msg as AIMessage).from !== tier) callback(msg as AIMessage);
    };

    widgetBus.on(`ai:${tier}`, directHandler);
    widgetBus.on('ai:broadcast', broadcastHandler);

    return () => {
      widgetBus.off(`ai:${tier}`, directHandler);
      widgetBus.off('ai:broadcast', broadcastHandler);
    };
  }

  // ---- Policy check (BoogieManAI enforcement, §13) ----

  checkPolicy(action: string, context?: Record<string, unknown>): { allowed: boolean; reason?: string } {
    const boogieman = this.agents.get('boogieman');
    if (!boogieman?.active) return { allowed: true };

    // Emit the policy check through the bus so external listeners can participate
    widgetBus.emit('ai:policy_check', { action, context });

    // Default: allow (real enforcement would be async via API)
    return { allowed: true };
  }
}

const aiSystem = new AISystem();
export default aiSystem;
