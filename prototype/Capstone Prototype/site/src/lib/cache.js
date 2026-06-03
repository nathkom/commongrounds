// Simple in-memory cache for catalog fetches.
// Lives only for the tab's lifetime — not persisted to localStorage so it can't
// leak role-sensitive data across sessions on shared devices.

const cache = new Map();
const inflight = new Map();

const DEFAULT_MAX_AGE = 30_000;

export function getCached(key) {
  return cache.get(key)?.data;
}

export function isFresh(key, maxAge = DEFAULT_MAX_AGE) {
  const entry = cache.get(key);
  return !!entry && Date.now() - entry.fetchedAt < maxAge;
}

export function setCached(key, data) {
  cache.set(key, { data, fetchedAt: Date.now() });
}

export async function fetchWithCache(key, fetcher, { maxAge = DEFAULT_MAX_AGE } = {}) {
  if (isFresh(key, maxAge)) return cache.get(key).data;
  if (inflight.has(key)) return inflight.get(key);
  const p = (async () => {
    try {
      const data = await fetcher();
      cache.set(key, { data, fetchedAt: Date.now() });
      return data;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

export function invalidate(key) {
  cache.delete(key);
  inflight.delete(key);
}

export function clearCache() {
  cache.clear();
  inflight.clear();
}
