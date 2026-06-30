// ── Cache Manager ────────────────────────────────────────────────────────────

const CACHE_PREFIX = 'evibex_cache_'
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {any|null} - Cached data or null if expired/missing
 */
export function getCache(key) {
  try {
    const item = localStorage.getItem(CACHE_PREFIX + key)
    if (!item) return null
    
    const { data, timestamp, ttl } = JSON.parse(item)
    const now = Date.now()
    
    // Check if expired
    if (now - timestamp > ttl) {
      localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }
    
    return data
  } catch {
    return null
  }
}

/**
 * Set cached data
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 */
export function setCache(key, data, ttl = DEFAULT_TTL) {
  try {
    const item = {
      data,
      timestamp: Date.now(),
      ttl,
    }
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item))
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

/**
 * Remove cached item
 * @param {string} key - Cache key
 */
export function removeCache(key) {
  localStorage.removeItem(CACHE_PREFIX + key)
}

/**
 * Clear all cache
 */
export function clearCache() {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key)
    }
  })
}

/**
 * Get cache stats (useful for debugging)
 */
export function getCacheStats() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX))
  return {
    count: keys.length,
    keys: keys.map(k => k.replace(CACHE_PREFIX, '')),
  }
}

export default {
  get: getCache,
  set: setCache,
  remove: removeCache,
  clear: clearCache,
  stats: getCacheStats,
}