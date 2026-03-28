export const DEFAULT_GAME_ID = 'platformer';

export interface GameLaunchOptions {
  openEngin?: boolean;
  remote?: boolean;
  play?: boolean;
  expand?: boolean;
}

export function buildGameLaunchHref(
  gameId: string = DEFAULT_GAME_ID,
  options: GameLaunchOptions = {},
) {
  const params = new URLSearchParams();
  params.set('game', gameId || DEFAULT_GAME_ID);
  if (options.openEngin) params.set('openEngin', '1');
  if (options.remote) params.set('remote', '1');
  if (options.play) params.set('play', '1');
  if (options.expand) params.set('expand', '1');
  return `/daydream/games?${params.toString()}`;
}

export function isLaunchFlagEnabled(value: string | null | undefined) {
  return value === '1';
}

export function resolveGameLaunchId<TFallback extends string | null>(
  candidate: string | null | undefined,
  validGameIds: readonly string[],
  fallback: TFallback = DEFAULT_GAME_ID as TFallback,
) {
  if (candidate && validGameIds.includes(candidate)) return candidate;
  return fallback;
}
