/**
 * eVibeX Admin API Client – with Caching
 */

const BASE = import.meta.env.VITE_API_BASE ?? ''
// In dev:  VITE_API_BASE='' → requests go to /api/... → Vite proxy forwards to Render
// In prod: VITE_API_BASE='' → Vercel rewrites /api/... → Render

// ── Storage helpers ──────────────────────────────────────────────────────────
export const getToken      = ()            => localStorage.getItem('evibex_token')
export const getRole       = ()            => localStorage.getItem('evibex_role') ?? 'admin'
export const setAuth       = (token, role) => {
  localStorage.setItem('evibex_token', token)
  localStorage.setItem('evibex_role',  role)
}
export const clearAuth = () => {
  localStorage.removeItem('evibex_token')
  localStorage.removeItem('evibex_role')
  localStorage.removeItem('evibex_user')
}
export const getStoredUser  = () => {
  try { return JSON.parse(localStorage.getItem('evibex_user') ?? 'null') } catch { return null }
}
export const setStoredUser  = (u) => localStorage.setItem('evibex_user', JSON.stringify(u))

// ── Prefix ────────────────────────────────────────────────────────────────────
const prefix = (role) => `${BASE}/api/v1/${role === 'moderator' ? 'mod' : 'admin'}`

// ── Resolve the canonical ID from a user object ───────────────────────────────
export function resolveId(user) {
  return user?._id ?? user?.id ?? null
}

// ────────────────────────────────────────────────────────────────────────────────
//  CACHE SYSTEM
// ────────────────────────────────────────────────────────────────────────────────

const CACHE_PREFIX = 'evibex_cache_'
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Generate a cache key from the URL and optional parameters
 */
function getCacheKey(url) {
  // Use URL as-is, but remove trailing slashes and query order doesn't matter
  return url
}

/**
 * Get cached data
 */
function getCache(key) {
  try {
    const item = localStorage.getItem(CACHE_PREFIX + key)
    if (!item) return null
    const { data, timestamp, ttl } = JSON.parse(item)
    const now = Date.now()
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
 */
function setCache(key, data, ttl = DEFAULT_TTL) {
  try {
    const item = { data, timestamp: Date.now(), ttl }
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item))
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

/**
 * Clear all cached items
 */
export function clearAppCache() {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key)
    }
  })
}

/**
 * Invalidate cache for a specific key pattern (optional)
 */
function invalidateCache(pattern) {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX) && key.includes(pattern)) {
      localStorage.removeItem(key)
    }
  })
}

// ────────────────────────────────────────────────────────────────────────────────
//  CORE FETCH WITH CACHING
// ────────────────────────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const method = options.method || 'GET'
  const isGet = method === 'GET'
  const cacheKey = getCacheKey(path)

  // ── Try cache for GET requests ──
  if (isGet) {
    const cached = getCache(cacheKey)
    if (cached !== null) {
      return cached // Return cached data immediately
    }
  }

  // ── Perform fetch ──
  let res
  try {
    res = await fetch(path, { ...options, headers })
  } catch (networkErr) {
    throw new Error(`Network error — could not reach the server. (${networkErr.message})`)
  }

  if (!res.ok) {
    let msg = `Request failed: ${res.status}`
    try {
      const data = await res.json()
      msg = data.message ?? data.error ?? data.detail ?? msg
    } catch { /* ignore */ }
    throw new Error(msg)
  }

  let responseData
  if (res.status === 204) {
    responseData = null
  } else {
    responseData = await res.json()
  }

  // ── Cache GET responses ──
  if (isGet && responseData !== null) {
    setCache(cacheKey, responseData, DEFAULT_TTL)
  }

  // ── Invalidate cache on mutations (POST, PUT, PATCH, DELETE) ──
  if (!isGet) {
    // Clear all cache after any mutation to keep data fresh
    clearAppCache()
  }

  return responseData
}

// ────────────────────────────────────────────────────────────────────────────────
//  AUTH
// ────────────────────────────────────────────────────────────────────────────────

export async function loginAdmin(adminName, password) {
  return apiFetch(`${prefix('admin')}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ admin_name: adminName, password }),
  })
}

export async function loginModerator(moderatorName, password) {
  return apiFetch(`${prefix('moderator')}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ moderator_name: moderatorName, password }),
  })
}

export async function login(name, password, role = 'admin') {
  if (role === 'moderator') return loginModerator(name, password)
  return loginAdmin(name, password)
}

// ────────────────────────────────────────────────────────────────────────────────
//  USER MANAGEMENT
// ────────────────────────────────────────────────────────────────────────────────

export async function getUserProfile(userId, role = getRole()) {
  const id = String(userId ?? '').trim()
  if (!id) throw new Error('No user ID provided.')
  return apiFetch(`${prefix(role)}/users/${id}/profile`)
}
 
export async function getAllUsers(role = getRole()) {
  return apiFetch(`${prefix(role)}/users/all`)
}

export async function moderateUser(userId, { status, mute, reason }, role = getRole()) {
  const id = String(userId ?? '').trim()
  if (!id) throw new Error('No user ID — cannot moderate.')
  const body = { reason }
  if (status !== undefined) body.status = status
  if (mute   !== undefined) body.mute   = mute
  return apiFetch(`${prefix(role)}/users/${id}/moderation`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export const banUser     = (userId, reason, role) => moderateUser(userId, { status: 'banned',    reason }, role)
export const suspendUser = (userId, reason, role) => moderateUser(userId, { status: 'suspended', reason }, role)
export const unbanUser   = (userId, reason, role) => moderateUser(userId, { status: 'active',    reason }, role)
export const muteUser    = (userId, reason, role) => moderateUser(userId, { mute: true,          reason }, role)
export const unmuteUser  = (userId, reason, role) => moderateUser(userId, { mute: false,         reason }, role)

export const EDIT_ALLOWLIST = [
  'username', 'full_name', 'email', 'bio',
  'phone_number', 'avatar', 'cover_image',
  'website', 'country', 'is_private',
  'show_online_status', 'is_verified',
]

export async function editUserProfile(userId, fields, role = getRole()) {
  const id = String(userId ?? '').trim()
  if (!id) throw new Error('No user ID — cannot edit profile.')
  const safe = Object.fromEntries(
    Object.entries(fields).filter(([k]) => EDIT_ALLOWLIST.includes(k))
  )
  if (Object.keys(safe).length === 0) throw new Error('No valid fields to update.')
  return apiFetch(`${prefix(role)}/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(safe),
  })
}

/**
 * Send email to a user
 */
export async function sendUserEmail(email, subject, message, role = getRole()) {
  if (!email || !subject || !message) {
    throw new Error('Email, subject, and message are required.')
  }
  return apiFetch(`${prefix(role)}/users/send-email`, {
    method: 'POST',
    body: JSON.stringify({ email, subject, message }),
  })
}

// ────────────────────────────────────────────────────────────────────────────────
//  DASHBOARD & ANALYTICS
// ────────────────────────────────────────────────────────────────────────────────

export async function getDashboardOverview(role = getRole()) {
  return apiFetch(`${prefix(role)}/dashboard/overview`)
}

export async function getActiveUsers(role = getRole()) {
  return apiFetch(`${prefix(role)}/dashboard/active-users`)
}

export async function getProductAnalytics(role = getRole()) {
  return apiFetch(`${prefix(role)}/analytics/product`)
}

export async function getActivityFeed(role = getRole()) {
  return apiFetch(`${prefix(role)}/activity`)
}

// ────────────────────────────────────────────────────────────────────────────────
//  CONTENT MODERATION
// ────────────────────────────────────────────────────────────────────────────────

export async function getAdminCollection(collection, params = {}, role = getRole()) {
  const query = new URLSearchParams(params).toString()
  const url = `${prefix(role)}/collections/${collection}${query ? '?' + query : ''}`
  return apiFetch(url)
}

export const getContentCollection = getAdminCollection

export async function moderateContent(collection, contentId, action, reason, role = getRole()) {
  if (!collection || !contentId || !action || !reason) {
    throw new Error('collection, contentId, action, and reason are required.')
  }
  return apiFetch(`${prefix(role)}/content/action`, {
    method: 'POST',
    body: JSON.stringify({ collection, content_id: contentId, action, reason }),
  })
}

// ────────────────────────────────────────────────────────────────────────────────
//  LIVE STREAMING
// ────────────────────────────────────────────────────────────────────────────────

export async function getLiveStreams({ active } = {}, role = getRole()) {
  const query = active !== undefined ? `?active=${active}` : ''
  return apiFetch(`${prefix(role)}/live/streams${query}`)
}

export async function forceEndStream(streamId, role = getRole()) {
  if (!streamId) throw new Error('Stream ID is required.')
  return apiFetch(`${prefix(role)}/live/streams/${streamId}/force-end`, {
    method: 'POST',
  })
}

// ────────────────────────────────────────────────────────────────────────────────
//  FINANCIALS
// ────────────────────────────────────────────────────────────────────────────────

export async function getEarningsUsers(status = 'all', role = getRole()) {
  const query = status !== 'all' ? `?status=${status}` : ''
  return apiFetch(`${prefix(role)}/earnings/users${query}`)
}

export async function markEarningsPaid(userId, amount, role = getRole()) {
  if (!userId) throw new Error('User ID is required.')
  const body = amount !== undefined && amount !== null && !isNaN(amount) ? { amount } : {}
  return apiFetch(`${prefix(role)}/earnings/users/${userId}/mark-paid`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getWithdrawals(status, role = getRole()) {
  if (!status) throw new Error('Status is required (pending, processing, etc.).')
  return apiFetch(`${prefix(role)}/withdrawals/${status}`)
}

export async function getFinancialCollection(collection, params = {}, role = getRole()) {
  const query = new URLSearchParams(params).toString()
  const url = `${prefix(role)}/collections/${collection}${query ? '?' + query : ''}`
  return apiFetch(url)
}

// ────────────────────────────────────────────────────────────────────────────────
//  SETTINGS
// ────────────────────────────────────────────────────────────────────────────────

export async function getAllSettings(role = getRole()) {
  return apiFetch(`${prefix(role)}/settings`)
}

export async function getSettingsByCategory(category, role = getRole()) {
  if (!category) throw new Error('Category is required.')
  return apiFetch(`${prefix(role)}/settings/${category}`)
}

export async function updateSettings(category, configData, role = getRole()) {
  if (!category) throw new Error('Category is required.')
  return apiFetch(`${prefix(role)}/settings/${category}`, {
    method: 'PUT',
    body: JSON.stringify(configData),
  })
}