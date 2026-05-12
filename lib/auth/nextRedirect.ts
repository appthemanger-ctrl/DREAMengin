const FALLBACK_NEXT_PATH = '/homedream';
const SAFE_NEXT_ORIGIN = 'https://dreamengin.local';

type SearchParamValue = string | string[] | undefined;
type SearchParamRecord = Record<string, SearchParamValue>;

export function resolveSafeNextPath(
  value: string | null | undefined,
  fallback = FALLBACK_NEXT_PATH,
) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback;
  }

  try {
    const url = new URL(value, SAFE_NEXT_ORIGIN);
    if (url.origin !== SAFE_NEXT_ORIGIN) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function buildLoginRedirectPath(
  pathname: string,
  searchParams?: SearchParamRecord | URLSearchParams,
) {
  const params = new URLSearchParams();

  if (searchParams instanceof URLSearchParams) {
    searchParams.forEach((value, key) => params.append(key, value));
  } else if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (Array.isArray(value)) {
        value.forEach((entry) => params.append(key, entry));
      } else if (value !== undefined) {
        params.set(key, value);
      }
    }
  }

  const query = params.toString();
  const nextPath = resolveSafeNextPath(`${pathname}${query ? `?${query}` : ''}`);
  return `/login?next=${encodeURIComponent(nextPath)}`;
}
