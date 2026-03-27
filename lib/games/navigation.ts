export const DEFAULT_GAME_ID = 'platformer';

export function buildGameLaunchHref(
  gameId: string = DEFAULT_GAME_ID,
  options: { openEngin?: boolean; remote?: boolean } = {},
) {
  const params = new URLSearchParams();
  params.set('game', gameId || DEFAULT_GAME_ID);
  if (options.openEngin) params.set('openEngin', '1');
  if (options.remote) params.set('remote', '1');
  return `/daydream/games?${params.toString()}`;
}

export function resolveGameLaunchId<TFallback extends string | null>(
  candidate: string | null | undefined,
  validGameIds: readonly string[],
  fallback: TFallback = DEFAULT_GAME_ID as TFallback,
) {
  if (candidate && validGameIds.includes(candidate)) return candidate;
  return fallback;
}
