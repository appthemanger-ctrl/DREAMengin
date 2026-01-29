export type TeachEvent = {
  featureId: string
  title: string
  message: string
  timestamp: number
}

const TEACH_EVENT = 'drEams:teach'

export function emitTeach(event: Omit<TeachEvent, 'timestamp'>) {
  if (typeof window === 'undefined') return
  const full: TeachEvent = { ...event, timestamp: Date.now() }
  window.dispatchEvent(new CustomEvent(TEACH_EVENT, { detail: full }))
}

export function onTeach(handler: (evt: TeachEvent) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const listener = (e: Event) => handler((e as CustomEvent).detail as TeachEvent)
  window.addEventListener(TEACH_EVENT, listener as any)
  return () => window.removeEventListener(TEACH_EVENT, listener as any)
}

export function hasTaught(featureId: string): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(`drEams:taught:${featureId}`) === 'true'
}

export function markTaught(featureId: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(`drEams:taught:${featureId}`, 'true')
}
