/**
 * eVibeX Admin API Client
 *
 * Base URL is read from VITE_API_BASE (default: http://localhost:8080).
 * The Vite dev-server proxy rewrites /api → http://localhost:8080/api
 * so in development you can just set VITE_API_BASE="" and let the proxy handle it.
 *
 * All staff routes require a Bearer JWT stored in localStorage under "evibex_token".
 * Role is stored under "evibex_role" ("admin" | "moderator").
 */

const BASE = import.meta.env.VITE_API_BASE ?? ''

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
export const getStoredUser = ()       => {
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

  // 204 No Content
  if (res.status === 204) return null

  return res.json()
}

// ════════════════════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════════════════════

/**
 * Login as admin.
 * POST /api/v1/admin/auth/login
 * Body: { admin_name, password }
 * Returns: { token, ...adminProfile }
 */
export async function loginAdmin(adminName, password) {
  return apiFetch('/api/v1/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ admin_name: adminName, password }),
  })
}

/**
 * Login as moderator.
 * POST /api/v1/mod/auth/login
 * Body: { moderator_name, password }
 * Returns: { token, ...modProfile }
 */
export async function loginModerator(moderatorName, password) {
  return apiFetch('/api/v1/mod/auth/login', {
    method: 'POST',
    body: JSON.stringify({ moderator_name: moderatorName, password }),
  })
}

/**
 * Convenience: login using the current role stored in localStorage.
 */
export async function login(name, password, role = 'admin') {
  if (role === 'moderator') return loginModerator(name, password)
  return loginAdmin(name, password)
}

// ════════════════════════════════════════════════════════════════════════════
//  USER PROFILE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get a user's profile.
 * GET /api/v1/{admin|mod}/users/:userId/profile
 * Requires: users:read permission
 * Returns: user profile object
 */
export async function getUserProfile(userId, role = getRole()) {
  return apiFetch(`${prefix(role)}/users/${userId}/profile`)
}

// ════════════════════════════════════════════════════════════════════════════
//  MODERATION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Moderate a user (ban / suspend / unban / mute / unmute).
 * POST /api/v1/{admin|mod}/users/:userId/moderation
 * Requires: users:moderate permission
 *
 * Body:
 *   { status?: "active"|"suspended"|"banned", mute?: boolean, reason: string }
 *   At least one of status or mute must be provided alongside reason.
 *
 * Audit actions logged by backend:
 *   banned   → ban_user
 *   active   → unban_user
 *   muted    → mute_user / unmute_user
 *   other    → update_user
 */
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

/**
 * Allowlisted fields for PATCH (password and wallet are NOT editable here).
 */
export const EDIT_ALLOWLIST = [
  'username', 'full_name', 'email', 'bio',
  'phone_number', 'avatar', 'cover_image',
  'website', 'country', 'is_private',
  'show_online_status', 'is_verified',
]

/**
 * Full profile edit.
 * PATCH /api/v1/{admin|mod}/users/:userId
 * Requires: users:full_edit permission
 * Body: object with any subset of EDIT_ALLOWLIST keys
 * Returns: { ok: true }
 */
export async function editUserProfile(userId, fields, role = getRole()) {
  // Strip any keys not in the allowlist as a safety measure
  const safe = Object.fromEntries(
    Object.entries(fields).filter(([k]) => EDIT_ALLOWLIST.includes(k))
  )
  if (Object.keys(safe).length === 0) throw new Error('No valid fields to update.')
  return apiFetch(`${prefix(role)}/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(safe),
  })
}
