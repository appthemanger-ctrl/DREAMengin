// lib/ai/CIC.ts
// Context Intelligence Core — wired to WidgetBus for automatic activity learning.

import widgetBus from '@/lib/widgets/WidgetBus';

type CICActivityType = 'view' | 'edit' | 'like' | 'share' | 'lab-run' | 'purchase';

type CICInput = {
  userId: string
  widgetType?: string
  content?: string
  tags?: string[]
  activityType: CICActivityType
}

type CICOutput = {
  suggestion: string
  category?: string
  layoutHint?: string
  trendScore?: number
}

export class CIC {
  private memory: Record<string, number> = {}
  private listening = false

  learn(event: CICInput) {
    const key = `${event.widgetType || 'global'}::${event.activityType}`
    this.memory[key] = (this.memory[key] || 0) + 1

    // Persist learning into shared widget memory so other systems can read it
    widgetBus.setMemory(`cic:${key}`, this.memory[key]);
  }

  suggest(event: CICInput): CICOutput {
    const base = this.memory[`${event.widgetType || 'global'}::${event.activityType}`] || 0

    if (event.widgetType === 'music') {
      return {
        suggestion: base > 5 ? 'Try releasing a remix version' : 'Start with an audio snippet',
        category: 'entertainment',
        layoutHint: 'square-audio',
        trendScore: base / 10
      }
    }

    if (event.widgetType === 'lab') {
      return {
        suggestion: 'Simulate quantum ledger drift using CCC model',
        category: 'physics',
        layoutHint: 'wide-chart',
        trendScore: base / 20
      }
    }

    return {
      suggestion: 'Try combining widgets into a preset layout',
      layoutHint: 'adaptive',
      trendScore: base / 50
    }
  }

  /**
   * Start listening on the WidgetBus for activity events and auto-learn.
   * Call once at app startup to wire CIC into the widget system.
   */
  startListening(userId: string): () => void {
    if (this.listening) return () => {};
    this.listening = true;

    const handler = (payload: any) => {
      if (payload && typeof payload === 'object' && payload.activityType) {
        this.learn({
          userId,
          widgetType: payload.widgetType,
          content: payload.content,
          tags: payload.tags,
          activityType: payload.activityType,
        });
      }
    };

    widgetBus.on('cic:activity', handler);

    return () => {
      widgetBus.off('cic:activity', handler);
      this.listening = false;
    };
  }
}