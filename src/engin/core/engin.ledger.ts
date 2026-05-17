// engin.ledger — immutable infrastructure
// Tracks active game sessions, frame indices, and delta history.
// No game-specific logic. No dream.* imports.

export interface LedgerEntry {
  timestamp: number;
  eventType: string;
  payload: unknown;
}

export interface DreamLedger {
  entries: LedgerEntry[];
  syncClock: number;
}

export function createLedger(: DreamLedger {
  return { entries: [], syncClock: 0 };
}

export function appendEntry(
  ledger: DreamLedger,
  entry: Omit<LedgerEntry, 'timestamp'>
): DreamLedger {
  const newEntry: LedgerEntry = { ...entry, timestamp: Date.now() };
  return {
    entries: [...ledger.entries, newEntry],
    syncClock: ledger.syncClock + 1,
  };
}
