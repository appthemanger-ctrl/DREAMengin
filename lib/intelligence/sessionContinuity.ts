/**
 * lib/intelligence/sessionContinuity.ts
 *
 * SESSION CONTINUITY ENGINE — 2026
 *
 * Gives DREAMengin a persistent memory across browser sessions.
 *
 * Each session's artifact trail is persisted to IndexedDB (localStorage
 * fallback for environments without IDB). On the next launch the OS knows:
 *   - Which subsystems you visited and in what order
 *   - What the last artifact was
 *   - How today's session differs from last time (SessionDiff)
 *
 * This is the feature that turns a series of browser tabs into a real OS
 * context — "you were working on a game in LabEngin, want to pick back up?"
 *
 * Privacy: all data stays in the user's browser. Nothing is sent off-device.
 *
 * Design:
 *   - IDB store: "dreamengin-continuity" / "sessions"
 *   - Keeps the last MAX_STORED_SESSIONS sessions (rolling eviction)
 *   - Session records are intentionally minimal (no full payload blobs)
 *   - Storage backend is injectable for testability
 */

export interface StoredSession {
  /** Random unique session ID. */
  id: string;
  /** Unix ms when this session started. */
  startedAt: number;
  /** Unix ms when this session was last persisted (end-of-session or periodic). */
  endedAt: number;
  /** Ordered subsystem activation IDs (one entry per recordActivation() call). */
  activations: string[];
  /** Unique artifact kinds observed during the session. */
  artifactKinds: string[];
  /** Title of the most recent artifact at persist time (for continuity hints). */
  lastArtifactTitle: string | null;
  /** Total artifact count at persist time. */
  artifactCount: number;
}

export interface SessionSummary {
  sessionId: string;
  startedAt: number;
  endedAt: number;
  /** Unique subsystems visited, ordered by first appearance. */
  subsystemsVisited: string[];
  /** Total activation transitions (N - 1 for N activations). */
  subsystemActivationCount: number;
  /** Subsystem visited most frequently. */
  primarySubsystem: string | null;
  artifactCount: number;
  artifactKinds: string[];
  lastArtifactTitle: string | null;
}

export interface SessionDiff {
  /** Subsystems active today but absent last session. */
  newSubsystems: string[];
  /** Subsystems from last session not yet visited today. */
  droppedSubsystems: string[];
  /** The last subsystem you were in at the end of the previous session. */
  continueFrom: string | null;
  /** Human-readable OS-level recommendation string. */
  recommendation: string;
}

/** Storage backend interface — injectable for testability. */
export interface SessionStorageBackend {
  read(): Promise<StoredSession[]>;
  write(sessions: StoredSession[]): Promise<void>;
}

const MAX_STORED_SESSIONS = 5;

// ─── Utilities ────────────────────────────────────────────────────────────────

function summariseSession(s: StoredSession): SessionSummary {
  const unique = [...new Set(s.activations)];
  const freq = new Map<string, number>();
  for (const id of s.activations) freq.set(id, (freq.get(id) ?? 0) + 1);
  let primarySubsystem: string | null = null;
  let maxCount = 0;
  for (const [id, count] of freq) {
    if (count > maxCount) {
      maxCount = count;
      primarySubsystem = id;
    }
  }
  return {
    sessionId: s.id,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    subsystemsVisited: unique,
    subsystemActivationCount: Math.max(0, s.activations.length - 1),
    primarySubsystem,
    artifactCount: s.artifactCount,
    artifactKinds: s.artifactKinds,
    lastArtifactTitle: s.lastArtifactTitle,
  };
}

function buildDiff(last: StoredSession, current: StoredSession): SessionDiff {
  const lastSet = new Set(last.activations);
  const currentSet = new Set(current.activations);

  const newSubsystems = [...currentSet].filter((id) => !lastSet.has(id));
  const droppedSubsystems = [...lastSet].filter((id) => !currentSet.has(id));
  const continueFrom = last.activations[last.activations.length - 1] ?? null;

  let recommendation: string;

  if (currentSet.size === 0) {
    if (continueFrom) {
      recommendation = `You left off in ${continueFrom} last time. Ready to pick up where you stopped?`;
    } else {
      recommendation = 'Starting fresh. What are we building today?';
    }
  } else if (newSubsystems.length > 0 && droppedSubsystems.length === 0) {
    recommendation = `New territory today: ${newSubsystems.join(', ')}.`;
  } else if (droppedSubsystems.length > 0 && continueFrom && !currentSet.has(continueFrom)) {
    recommendation = `You haven't been back to ${continueFrom} yet — that's where you finished last time.`;
  } else if (droppedSubsystems.length > 0) {
    recommendation = `You covered ${droppedSubsystems.join(', ')} last session — not yet today.`;
  } else {
    recommendation = 'Staying in familiar territory — you know where everything is.';
  }

  return { newSubsystems, droppedSubsystems, continueFrom, recommendation };
}

// ─── IndexedDB backend ────────────────────────────────────────────────────────

const DB_NAME = 'dreamengin-continuity';
const STORE_NAME = 'sessions';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function createIDBBackend(): Promise<SessionStorageBackend> {
  const db = await openDB();
  return {
    async read(): Promise<StoredSession[]> {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () =>
          resolve((req.result as StoredSession[]).sort((a, b) => b.startedAt - a.startedAt));
        req.onerror = () => reject(req.error);
      });
    },
    async write(sessions: StoredSession[]): Promise<void> {
      const fresh = sessions.slice(0, MAX_STORED_SESSIONS);
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const clearReq = store.clear();
        clearReq.onsuccess = () => {
          for (const s of fresh) store.put(s);
        };
        clearReq.onerror = () => reject(clearReq.error);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    },
  };
}

// ─── LocalStorage backend ────────────────────────────────────────────────────

const LS_KEY = 'dreamengin-continuity-sessions';

function createLSBackend(): SessionStorageBackend {
  return {
    async read(): Promise<StoredSession[]> {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as StoredSession[];
      } catch {
        return [];
      }
    },
    async write(sessions: StoredSession[]): Promise<void> {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(sessions.slice(0, MAX_STORED_SESSIONS)));
      } catch {
        // Quota exceeded or private browsing — silently ignore.
      }
    },
  };
}

// ─── In-memory backend (SSR / test / non-browser contexts) ───────────────────

function createMemoryBackend(): SessionStorageBackend {
  return {
    async read(): Promise<StoredSession[]> { return []; },
    async write(): Promise<void> { /* no-op */ },
  };
}

// ─── Session Continuity ───────────────────────────────────────────────────────

/**
 * Manages cross-session persistence for DREAMengin.
 *
 * Accepts an optional `backend` for testability. When omitted, the backend
 * is resolved automatically: IndexedDB → localStorage → in-memory.
 */
export class SessionContinuity {
  private backend: SessionStorageBackend | null;
  private readonly currentSession: StoredSession;
  private pastSessions: StoredSession[] = [];
  private ready = false;

  constructor(backend?: SessionStorageBackend) {
    this.backend = backend ?? null;
    this.currentSession = {
      id: `session:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      startedAt: Date.now(),
      endedAt: Date.now(),
      activations: [],
      artifactKinds: [],
      lastArtifactTitle: null,
      artifactCount: 0,
    };
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  async init(): Promise<void> {
    if (!this.backend) {
      this.backend = await this.resolveBackend();
    }
    try {
      this.pastSessions = await this.backend.read();
    } catch {
      this.pastSessions = [];
    }
    this.ready = true;
  }

  private async resolveBackend(): Promise<SessionStorageBackend> {
    if (typeof window === 'undefined') return createMemoryBackend();
    if (typeof indexedDB !== 'undefined') {
      try {
        return await createIDBBackend();
      } catch {
        // IDB failed — fall through to localStorage.
      }
    }
    if (typeof localStorage !== 'undefined') {
      return createLSBackend();
    }
    return createMemoryBackend();
  }

  // ── Current session updates ───────────────────────────────────────────────

  /** Record a subsystem activation into the current session. */
  recordActivation(subsystemId: string): void {
    this.currentSession.activations.push(subsystemId);
  }

  /** Update the current session's artifact snapshot. */
  updateArtifacts(count: number, kinds: string[], lastTitle: string | null): void {
    this.currentSession.artifactCount = count;
    this.currentSession.artifactKinds = [...new Set(kinds)];
    this.currentSession.lastArtifactTitle = lastTitle;
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  /**
   * Persist the current session state. Call periodically (e.g. on blur,
   * visibility change) and on page unload.
   */
  async persist(): Promise<void> {
    if (!this.backend) return;
    this.currentSession.endedAt = Date.now();
    try {
      const all = [{ ...this.currentSession }, ...this.pastSessions];
      await this.backend.write(all);
    } catch {
      // Persistence failure is non-fatal.
    }
  }

  // ── Query ─────────────────────────────────────────────────────────────────

  /** Returns the last completed session (the one before the current one). */
  getLastSession(): StoredSession | null {
    return this.pastSessions[0] ?? null;
  }

  /** Returns a summary of the last session, or null if none exists. */
  getLastSessionSummary(): SessionSummary | null {
    const last = this.getLastSession();
    return last ? summariseSession(last) : null;
  }

  /** Returns a summary of the current (live) session. */
  getCurrentSessionSummary(): SessionSummary {
    return summariseSession({ ...this.currentSession, endedAt: Date.now() });
  }

  /**
   * Returns a diff between the current session and the last one.
   * Returns null if there is no previous session to compare against.
   */
  getSessionDiff(): SessionDiff | null {
    const last = this.getLastSession();
    if (!last) return null;
    return buildDiff(last, this.currentSession);
  }

  /** Whether init() has completed. */
  isReady(): boolean {
    return this.ready;
  }

  /** All past sessions (most recent first). */
  getPastSessions(): readonly StoredSession[] {
    return this.pastSessions;
  }
}

// Module-level singleton — one engine per app lifetime.
export const sessionContinuity = typeof window !== 'undefined'
  ? new SessionContinuity()
  : null;
