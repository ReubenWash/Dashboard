/**
 * eVibeX Admin API Client
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
// Backend may return _id (Mongo) or id (mapped). Always prefer _id, fall back to id.
export function resolveId(user) {
  return user?._id ?? user?.id ?? null
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

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

  if (res.status === 204) return null
  return res.json()
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
//  USER PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

export async function getUserProfile(userId, role = getRole()) {
  const id = String(userId ?? '').trim()
  if (!id) throw new Error('No user ID provided.')
  return apiFetch(`${prefix(role)}/users/${id}/profile`)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  USERS — list
// ═══════════════════════════════════════════════════════════════════════════════

export async function getAllUsers(role = getRole()) {
  return apiFetch(`${prefix(role)}/users/all`)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MODERATION
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
//  PROFILE EDIT
// ═══════════════════════════════════════════════════════════════════════════════

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
