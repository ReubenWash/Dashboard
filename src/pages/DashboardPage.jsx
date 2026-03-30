import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const QUICK_ACTIONS = [
  { label: 'Look Up User',    icon: 'bi-search',          path: '/lookup',   color: 'var(--accent)' },
  { label: 'Moderate User',   icon: 'bi-shield-check',    path: '/moderate', color: 'var(--warning)' },
  { label: 'Edit Profile',    icon: 'bi-pencil-square',   path: '/edit',     color: 'var(--success)' },
]

export default function DashboardPage() {
  const { user, role } = useAuth()
  const navigate = useNavigate()

  const isAdmin     = role !== 'moderator'
  const displayName = user?.admin_name ?? user?.moderator_name ?? user?.name ?? 'Staff'

  return (
    <>
      {/* Welcome banner */}
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

      {/* Stat cards — dashboard note */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Users',   icon: 'bi-people-fill',       colorClass: 'text-accent',   note: 'Live stats require a dedicated stats API endpoint.' },
          { label: 'Banned Users',  icon: 'bi-slash-circle-fill', colorClass: 'text-danger2',  note: '' },
          { label: 'Suspended',     icon: 'bi-pause-circle-fill', colorClass: 'text-warn',     note: '' },
          { label: 'Muted',         icon: 'bi-mic-mute-fill',     colorClass: 'text-muted2',   note: '' },
        ].map(s => (
          <div className="col-6 col-lg-3" key={s.label}>
            <div className="stat-card">
              <div className={`stat-icon ${s.colorClass}`}><i className={`bi ${s.icon}`} /></div>
              <div className={`stat-val ${s.colorClass}`}>—</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* API info notice */}
      <div
        className="card mb-4"
        style={{ padding: '14px 18px', borderLeft: '3px solid var(--warning)' }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <i className="bi bi-info-circle" style={{ color: 'var(--warning)', marginTop: 2, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 0 }}>
            The eVibeX backend exposes <strong>four staff API endpoints</strong>: login, view user profile,
            moderate a user, and full profile edit. Aggregate stats (totals, banned count, etc.)
            are not part of the current API — the stat cards above will show live data once
            a stats endpoint is added to the backend.
          </p>
        </div>
      </div>

      {/* Quick actions */}
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

      {/* Permissions summary */}
      <div className="card mt-4">
        <div className="card-header-bar">
          <span className="card-title">Your Permissions</span>
        </div>
        <div className="card-body-pad">
          <div className="row g-2">
            {[
              { perm: 'users:read',      label: 'View user profiles',   icon: 'bi-eye' },
              { perm: 'users:moderate',  label: 'Moderate users',        icon: 'bi-shield-check' },
              { perm: 'users:full_edit', label: 'Full profile edit',     icon: 'bi-pencil-square', adminOnly: !isAdmin },
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
              Moderators have <code>users:read</code> and <code>users:moderate</code> by default.
              <code>users:full_edit</code> requires explicit permission from an admin.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
