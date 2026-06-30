import { useState, useEffect, useCallback } from 'react'
import { getCache, setCache } from '../utils/cache'

/**
 * Hook for fetching data with caching
 * @param {Function} fetchFn - Async function that returns data
 * @param {string} cacheKey - Unique cache key
 * @param {object} options - { ttl, enabled, initialData }
 */
export function useCachedFetch(fetchFn, cacheKey, options = {}) {
  const { 
    ttl = 5 * 60 * 1000, // 5 minutes default
    enabled = true,
    initialData = null,
    onSuccess,
    onError,
  } = options

  const [data, setData] = useState(() => {
    // Try to load from cache on initial render
    if (enabled) {
      const cached = getCache(cacheKey)
      return cached !== null ? cached : initialData
    }
    return initialData
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isStale, setIsStale] = useState(false)

  const fetchData = useCallback(async (force = false) => {
    // Check cache if not forcing
    if (!force) {
      const cached = getCache(cacheKey)
      if (cached !== null) {
        setData(cached)
        setLoading(false)
        setError(null)
        setIsStale(false)
        return cached
      }
    }

    setLoading(true)
    setError(null)
    setIsStale(false)

    try {
      const result = await fetchFn()
      setData(result)
      setCache(cacheKey, result, ttl)
      setLoading(false)
      setIsStale(false)
      
      if (onSuccess) onSuccess(result)
      return result
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch data'
      setError(errorMsg)
      setLoading(false)
      setIsStale(true)
      
      if (onError) onError(err)
      return null
    }
  }, [fetchFn, cacheKey, ttl, onSuccess, onError])

  // Force refresh (skip cache)
  const refresh = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  // Clear cached data for this key
  const clearCache = useCallback(() => {
    localStorage.removeItem(`evibex_cache_${cacheKey}`)
    setData(initialData)
  }, [cacheKey, initialData])

  // Auto-fetch on mount
  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [enabled, fetchData])

  return {
    data,
    loading,
    error,
    isStale,
    refresh,
    clearCache,
    refetch: fetchData,
  }
}

export default useCachedFetch