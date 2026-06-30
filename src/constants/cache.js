// ── Cache TTL Constants ──────────────────────────────────────────────────────

export const CACHE_TTL = {
  // Short-lived (1 minute) – for real-time data
  REAL_TIME: 60 * 1000,
  
  // Medium (5 minutes) – for dashboard data
  DASHBOARD: 5 * 60 * 1000,
  
  // Long (15 minutes) – for settings and lists
  STANDARD: 15 * 60 * 1000,
  
  // Very long (1 hour) – for static data
  STATIC: 60 * 60 * 1000,
}

export default CACHE_TTL