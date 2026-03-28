export const GAME_LIBRARY_SELECTION_STORAGE_KEY = 'de:games:selected';
export const GAME_LIBRARY_SESSION_STORAGE_KEY = 'de:games:saved-sessions';

export interface SavedGameSession {
  gameId: string;
  label: string;
  savedAt: string;
  source: 'library-screen' | 'fullscreen';
}

export function upsertSavedGameSession(
  existing: SavedGameSession[],
  next: SavedGameSession,
) {
  return [next, ...existing.filter((session) => session.gameId !== next.gameId)].slice(0, 8);
}
