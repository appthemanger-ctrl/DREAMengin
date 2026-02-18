// lib/ai/CIC.ts
type CICInput = {
  userId: string
  widgetType?: string
  content?: string
  tags?: string[]
  activityType: 'view' | 'edit' | 'like' | 'share' | 'lab-run' | 'purchase'
}

type CICOutput = {
  suggestion: string
  category?: string
  layoutHint?: string
  trendScore?: number
}

export class CIC {
  private memory: Record<string, number> = {}

  learn(event: CICInput) {
    const key = `${event.widgetType || 'global'}::${event.activityType}`
    this.memory[key] = (this.memory[key] || 0) + 1
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
}