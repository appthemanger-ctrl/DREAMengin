// lib/toSerializable.ts
// Ensures data passed from Server Components -> Client Components is safely serializable.
// Next/React Server Components cannot pass non-serializable values (e.g. BigInt, Date objects in some cases,
// class instances, circular refs). We normalize to plain JSON.

export function toSerializable<T>(value: T): T {
  // Fast path for null/undefined/primitives
  if (value == null) return value
  const t = typeof value
  if (t === 'string' || t === 'number' || t === 'boolean') return value

  try {
    // Convert BigInt -> string, strip functions/symbols.
    const json = JSON.stringify(value, (_k, v) => {
      if (typeof v === 'bigint') return v.toString()
      if (typeof v === 'function') return undefined
      if (typeof v === 'symbol') return undefined
      return v
    })
    return JSON.parse(json) as T
  } catch {
    // If something is circular or otherwise not JSON-safe, fail closed.
    return null as unknown as T
  }
}
