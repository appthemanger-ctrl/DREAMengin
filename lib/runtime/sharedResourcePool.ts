const pool = new Map<string, unknown[]>();

export function acquireSharedResource<T>(key: string, factory: () => T): T {
  const bucket = pool.get(key);
  if (bucket && bucket.length > 0) {
    return bucket.pop() as T;
  }
  return factory();
}

export function releaseSharedResource<T>(key: string, value: T): void {
  const bucket = pool.get(key) ?? [];
  bucket.push(value as unknown);
  pool.set(key, bucket);
}
