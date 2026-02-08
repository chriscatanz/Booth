const TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_KEYS = 50;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getKey(key: string): string {
  return `tsm_cache_${key}`;
}

export function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(getKey(key));
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > TTL_MS) {
      localStorage.removeItem(getKey(key));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(getKey(key), JSON.stringify(entry));
    evictIfNeeded();
  } catch {
    // localStorage full or unavailable; silently fail
  }
}

export function clearCache(key: string): void {
  localStorage.removeItem(getKey(key));
}

export function clearAllCache(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('tsm_cache_'));
  keys.forEach(k => localStorage.removeItem(k));
}

function evictIfNeeded(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('tsm_cache_'));
  if (keys.length <= MAX_KEYS) return;

  // LRU: sort by timestamp, evict oldest
  const entries = keys.map(k => {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) return { key: k, timestamp: 0 };
      const parsed = JSON.parse(raw);
      return { key: k, timestamp: parsed.timestamp || 0 };
    } catch {
      return { key: k, timestamp: 0 };
    }
  }).sort((a, b) => a.timestamp - b.timestamp);

  const toRemove = entries.slice(0, entries.length - MAX_KEYS);
  toRemove.forEach(e => localStorage.removeItem(e.key));
}
