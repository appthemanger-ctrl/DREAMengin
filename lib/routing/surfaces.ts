export const PUBLIC_SURFACE_PREFIXES = ['/login', '/join', '/policy', '/about', '/auth'] as const;

export const SAB_ISOLATED_ROUTE_PREFIXES = ['/daydream', '/engines'] as const;

export function isPublicSurfacePath(pathname: string | null | undefined: boolean {
  if (!pathname) return true;
  if (pathname === '/') return true;
  return PUBLIC_SURFACE_PREFIXES.some((prefix: Record<string, unknown>) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isSabIsolatedPath(pathname: string | null | undefined: boolean {
  if (!pathname) return false;
  return SAB_ISOLATED_ROUTE_PREFIXES.some((prefix: Record<string, unknown>) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
