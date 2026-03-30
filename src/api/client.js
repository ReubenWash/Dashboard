/**
 * eVibeX Admin API Client — Fixed for Vercel + Dev
 */

const BASE = import.meta.env.VITE_API_BASE ?? '' // e.g., '' for dev, 'https://dashboard-nu-hazel-70.vercel.app' for prod

// ── Storage helpers ─────────────────────────────────────────────────────────
export const getToken  = ()      => localStorage.getItem('evibex_token')
export const getRole   = ()      => localStorage.getItem('evibex_role') ?? 'admin'
export const setAuth   = (token, role) => {
  localStorage.setItem('evibex_token', token)
  localStorage.setItem('evibex_role',  role)
}
export const clearAuth = () => {
  localStorage.removeItem('evibex_token')
  localStorage.removeItem('evibex_role')
  localStorage.removeItem('evibex_user')
}
export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('evibex_user') ?? 'null') } catch { return null }
}
export const setStoredUser = (u) => localStorage.setItem('evibex_user', JSON.stringify(u))

// ── Prefix helper ────────────────────────────────────────────────────────────
// Returns "/api/v1/admin" or "/api/v1/mod"
const prefix = (role) => `/api/v1/${role === 'moderator' ? 'mod' : 'admin'}`

// ── Core fetch wrapper ───────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    let msg = `Request failed: ${res.status}`
    try {
      const data = await res.json()
      msg = data.message ?? data.error ?? msg
    } catch { /* ignore */ }
    throw new Error(msg)
  }

  if (res.status === 204) return null
  return res.json()
}

// ════════════════════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════════════════════

/**
 * Login as admin
 */
export async function loginAdmin(adminName, password) {
  return apiFetch(`${prefix('admin')}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ admin_name: adminName, password }),
  })
}

/**
 * Login as moderator
 */
export async function loginModerator(moderatorName, password) {
  return apiFetch(`${prefix('moderator')}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ moderator_name: moderatorName, password }),
  })
}

/**
 * Convenience login using current role in localStorage
 */
export async function login(name, password, role = 'admin') {
  if (role === 'moderator') return loginModerator(name, password)
  return loginAdmin(name, password)
}

// ════════════════════════════════════════════════════════════════════════════
//  USER PROFILE
// ════════════════════════════════════════════════════════════════════════════

export async function getUserProfile(userId, role = getRole()) {
  return apiFetch(`${prefix(role)}/users/${userId}/profile`)
}

// ════════════════════════════════════════════════════════════════════════════
//  MODERATION
// ════════════════════════════════════════════════════════════════════════════

export async function moderateUser(userId, { status, mute, reason }, role = getRole()) {
  const body = { reason }
  if (status !== undefined) body.status = status
  if (mute   !== undefined) body.mute   = mute
  return apiFetch(`${prefix(role)}/users/${userId}/moderation`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// Convenience wrappers
export const banUser     = (userId, reason, role) => moderateUser(userId, { status: 'banned',    reason }, role)
export const suspendUser = (userId, reason, role) => moderateUser(userId, { status: 'suspended', reason }, role)
export const unbanUser   = (userId, reason, role) => moderateUser(userId, { status: 'active',    reason }, role)
export const muteUser    = (userId, reason, role) => moderateUser(userId, { mute: true,          reason }, role)
export const unmuteUser  = (userId, reason, role) => moderateUser(userId, { mute: false,         reason }, role)

// ════════════════════════════════════════════════════════════════════════════
//  FULL PROFILE EDIT
// ════════════════════════════════════════════════════════════════════════════

export const EDIT_ALLOWLIST = [
  'username', 'full_name', 'email', 'bio',
  'phone_number', 'avatar', 'cover_image',
  'website', 'country', 'is_private',
  'show_online_status', 'is_verified',
]

export async function editUserProfile(userId, fields, role = getRole()) {
  const safe = Object.fromEntries(
    Object.entries(fields).filter(([k]) => EDIT_ALLOWLIST.includes(k))
  )
  if (Object.keys(safe).length === 0) throw new Error('No valid fields to update.')
  return apiFetch(`${prefix(role)}/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(safe),
  })
}