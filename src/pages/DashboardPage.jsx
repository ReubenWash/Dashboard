import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getToken, getRole } from '../api'   // ✅ uses your actual api.js

const BASE = import.meta.env.VITE_API_BASE ?? ''

const QUICK_ACTIONS = [
  { label: 'Look Up User',  icon: 'bi-search',        path: '/lookup',   color: 'var(--accent)' },
  { label: 'Moderate User', icon: 'bi-shield-check',  path: '/moderate', color: 'var(--warning)' },
  { label: 'Edit Profile',  icon: 'bi-pencil-square', path: '/edit',     color: 'var(--success)' },
]

// ── Status helper ────────────────────────────────────────────────────────────
function getStatus(user) {
  if (user.is_banned     === true) return 'banned'
  if (user.is_suspended  === true) return 'suspended'
  if (user.is_muted      === true) return 'muted'
  const s = (user.status ?? user.moderation_status ?? user.account_status ?? '').toLowerCase()
  if (s === 'banned')    return 'banned'
  if (s === 'suspended') return 'suspended'
  if (s === 'muted')     return 'muted'
  return 'active'
}

function deriveStats(users) {
  return {
    total:     users.length,
    banned:    users.filter(u => getStatus(u) === 'banned').length,
    suspended: users.filter(u => getStatus(u) === 'suspended').length,
    muted:     users.filter(u => getStatus(u) === 'muted').length,
  }
}

// ── Fetch all users using the same pattern as your api.js ───────────────────
async function fetchAllUsers(role) {
  const token    = getToken()
  const prefix   = role === 'moderator' ? 'mod' : 'admin'
  const endpoint = `${BASE}/api/v1/${prefix}/users/all`

  console.log('[Dashboard] Fetching:', endpoint)

  const res = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  console.log('[Dashboard] Response status:', res.status)

  if (!res.ok) {
    let msg = `${res.status}`
    try {
      const data = await res.json()
      msg = data.message ?? data.error ?? msg
    } catch { /* ignore */ }
    throw new Error(msg)
  }

  const data = await res.json()
  console.log('[Dashboard] Raw data:', data)
  return data
}

// ── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, role } = useAuth()
  const navigate = useNavigate()

  const isAdmin     = role !== 'moderator'
  const displayName = user?.admin_name ?? user?.moderator_name ?? user?.name ?? 'Staff'

  const [stats,        setStats]        = useState({ total: null, banned: null, suspended: null, muted: null })
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError,   setStatsError]   = useState(null)

  useEffect(() => {
    const currentRole = role ?? getRole()

    fetchAllUsers(currentRole)
      .then(raw => {
        // Handle { users: [] }, { data: [] }, or plain array
        const users = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.users)
            ? raw.users
            : Array.isArray(raw?.data)
              ? raw.data
              : []

        console.log('[Dashboard] Users found:', users.length)
        if (users.length > 0) console.log('[Dashboard] First user sample:', users[0])

        setStats(deriveStats(users))
      })
      .catch(err => {
        console.error('[Dashboard] ❌ Error:', err.message)
        setStatsError(err.message)
      })
      .finally(() => setStatsLoading(false))
  }, [role])

  const STAT_CARDS = [
    { label: 'Total Users',  icon: 'bi-people-fill',       colorClass: 'text-accent',  value: stats.total },
    { label: 'Banned Users', icon: 'bi-slash-circle-fill', colorClass: 'text-danger2', value: stats.banned },
    { label: 'Suspended',    icon: 'bi-pause-circle-fill', colorClass: 'text-warn',    value: stats.suspended },
    { label: 'Muted',        icon: 'bi-mic-mute-fill',     colorClass: 'text-muted2',  value: stats.muted },
  ]

  function renderStatVal(value) {
    if (statsLoading) {
      return (
        <div
          style={{
            width: 48, height: 22, borderRadius: 4,
            background: 'var(--bg-hover)',
            animation: 'pulse 1.4s ease-in-out infinite',
          }}
        />
      )
    }
    if (statsError || value === null) return '—'
    return value
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      {/* ── Welcome banner ── */}
      <div
        className="card mb-4"
        style={{
          padding: '28px 28px',
          background: 'linear-gradient(120deg, var(--bg-card) 60%, var(--accent-glow) 100%)',
          borderLeft: '3px solid var(--accent)',
        }}
      >
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h4 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, marginBottom: 4 }}>
              Welcome back, {displayName} 👋
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 0 }}>
              You're signed in as{' '}
              <span className={`role-pill ${isAdmin ? 'admin' : 'moderator'}`}>
                {isAdmin ? 'Admin' : 'Moderator'}
              </span>
              . Use the sidebar to manage users.
            </p>
          </div>
          <div
            style={{
              width: 52, height: 52,
              background: 'var(--accent)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: '#fff',
              fontFamily: 'Syne, sans-serif',
              flexShrink: 0,
            }}
          >
            {displayName[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="row g-3 mb-4">
        {STAT_CARDS.map(s => (
          <div className="col-6 col-lg-3" key={s.label}>
            <div className="stat-card">
              <div className={`stat-icon ${s.colorClass}`}>
                <i className={`bi ${s.icon}`} />
              </div>
              <div className={`stat-val ${s.colorClass}`}>
                {renderStatVal(s.value)}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Debug / status banner ── */}
      <div
        className="card mb-4"
        style={{
          padding: '14px 18px',
          borderLeft: `3px solid ${
            statsError   ? 'var(--danger)'  :
            statsLoading ? 'var(--warning)' :
                           'var(--success)'
          }`,
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <i
            className={`bi ${
              statsError   ? 'bi-x-circle'          :
              statsLoading ? 'bi-hourglass-split'   :
                             'bi-check-circle-fill'
            }`}
            style={{
              color: statsError   ? 'var(--danger)'  :
                     statsLoading ? 'var(--warning)' :
                                    'var(--success)',
              marginTop: 2, flexShrink: 0,
            }}
          />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 0 }}>
            {statsLoading && 'Loading user stats…'}
            {!statsLoading && !statsError && (
              <>
                Stats loaded — Total: <strong>{stats.total}</strong> | Banned:{' '}
                <strong>{stats.banned}</strong> | Suspended:{' '}
                <strong>{stats.suspended}</strong> | Muted:{' '}
                <strong>{stats.muted}</strong>
              </>
            )}
            {statsError && (
              <>
                Could not load stats ({statsError}). Check Console (F12) for{' '}
                <code>[Dashboard]</code> logs.
              </>
            )}
          </p>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="card">
        <div className="card-header-bar">
          <span className="card-title">Quick Actions</span>
        </div>
        <div className="card-body-pad">
          <div className="row g-3">
            {QUICK_ACTIONS.map(a => (
              <div className="col-12 col-md-4" key={a.label}>
                <button
                  className="btn btn-outline-secondary w-100 py-3"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, height: '100%' }}
                  onClick={() => navigate(a.path)}
                >
                  <i className={`bi ${a.icon}`} style={{ fontSize: 24, color: a.color }} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{a.label}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Permissions summary ── */}
      <div className="card mt-4">
        <div className="card-header-bar">
          <span className="card-title">Your Permissions</span>
        </div>
        <div className="card-body-pad">
          <div className="row g-2">
            {[
              { perm: 'users:read',      label: 'View user profiles', adminOnly: false },
              { perm: 'users:moderate',  label: 'Moderate users',      adminOnly: false },
              { perm: 'users:full_edit', label: 'Full profile edit',   adminOnly: !isAdmin },
            ].map(p => {
              const granted = !p.adminOnly
              return (
                <div className="col-12 col-md-4" key={p.perm}>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 8,
                      background: granted ? 'var(--success-bg)' : 'var(--bg-hover)',
                      border: `1px solid ${granted ? 'var(--success)' : 'var(--border)'}`,
                      opacity: granted ? 1 : 0.5,
                    }}
                  >
                    <i
                      className={`bi ${granted ? 'bi-check-circle-fill' : 'bi-x-circle'}`}
                      style={{ color: granted ? 'var(--success)' : 'var(--text-muted)', fontSize: 16 }}
                    />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{p.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.perm}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {!isAdmin && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, marginBottom: 0 }}>
              <i className="bi bi-info-circle me-1" />
              Moderators have <code>users:read</code> and <code>users:moderate</code> by default.{' '}
              <code>users:full_edit</code> requires explicit permission from an admin.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
