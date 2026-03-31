import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../api' // your axios instance

const QUICK_ACTIONS = [
  { label: 'Look Up User',  icon: 'bi-search',        path: '/lookup',   color: 'var(--accent)' },
  { label: 'Moderate User', icon: 'bi-shield-check',  path: '/moderate', color: 'var(--warning)' },
  { label: 'Edit Profile',  icon: 'bi-pencil-square', path: '/edit',     color: 'var(--success)' },
]

// ---------------------------------------------------------------------------
// Helpers — defensively derive a user's moderation status from whatever
// field shape the eVibeX backend actually returns.
// Adjust the field names here once you confirm the real API response shape.
// ---------------------------------------------------------------------------
function getStatus(user) {
  // Try explicit boolean flags first
  if (user.is_banned     === true) return 'banned'
  if (user.is_suspended  === true) return 'suspended'
  if (user.is_muted      === true) return 'muted'

  // Try a single status string field (most common pattern)
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const { user, role } = useAuth()
  const navigate = useNavigate()

  const isAdmin     = role !== 'moderator'
  const displayName = user?.admin_name ?? user?.moderator_name ?? user?.name ?? 'Staff'

  const [stats,        setStats]        = useState({ total: null, banned: null, suspended: null, muted: null })
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError,   setStatsError]   = useState(false)

  useEffect(() => {
    // Only admins have access to /admin/users/all
    const endpoint = isAdmin
      ? '/api/v1/admin/users/all'
      : '/api/v1/mod/users/all'

    api.get(endpoint)
      .then(res => {
        // Handle both { users: [...] } and plain array responses
        const raw   = res.data
        const users = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.users)
            ? raw.users
            : Array.isArray(raw?.data)
              ? raw.data
              : []

        setStats(deriveStats(users))
      })
      .catch(() => setStatsError(true))
      .finally(() => setStatsLoading(false))
  }, [isAdmin])

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
      {/* Pulse keyframe — injected once */}
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

      {/* ── Error notice (only shown if fetch failed) ── */}
      {statsError && (
        <div
          className="card mb-4"
          style={{ padding: '14px 18px', borderLeft: '3px solid var(--danger)' }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <i className="bi bi-exclamation-triangle" style={{ color: 'var(--danger)', marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 0 }}>
              Could not load user stats. The backend may be waking up (Render free tier) or
              you may not have permission to access this endpoint. Stats will show <strong>—</strong> until resolved.
            </p>
          </div>
        </div>
      )}

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
              { perm: 'users:read',      label: 'View user profiles', icon: 'bi-eye',           adminOnly: false },
              { perm: 'users:moderate',  label: 'Moderate users',      icon: 'bi-shield-check',  adminOnly: false },
              { perm: 'users:full_edit', label: 'Full profile edit',   icon: 'bi-pencil-square', adminOnly: !isAdmin },
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
