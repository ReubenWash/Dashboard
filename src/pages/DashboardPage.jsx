import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getAllUsers, getRole, resolveId, getDashboardOverview } from '../api/client'

// ── Enhanced Quick Actions ────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Look Up User',  icon: 'bi-search',        path: '/lookup',   color: 'var(--accent)' },
  { label: 'Moderate User', icon: 'bi-shield-check',  path: '/moderate', color: 'var(--warning)' },
  { label: 'Edit Profile',  icon: 'bi-pencil-square', path: '/edit',     color: 'var(--success)' },
  { label: 'Content Mod',   icon: 'bi-file-earmark-text', path: '/content', color: '#d455e0' },
  { label: 'Financials',    icon: 'bi-wallet2',       path: '/finances', color: 'var(--success)' },
  { label: 'Live Streams',  icon: 'bi-broadcast',     path: '/streams',  color: 'var(--accent)' },
  { label: 'Activity Log',  icon: 'bi-clock-history', path: '/activity', color: 'var(--text-secondary)' },
  { label: 'Analytics',     icon: 'bi-graph-up',      path: '/analytics',color: 'var(--accent)' },
  { label: 'Send Email',    icon: 'bi-envelope',      path: '/email',    color: '#4f8ef7' },
  { label: 'Settings',      icon: 'bi-gear',          path: '/settings', color: 'var(--text-muted)' },
]

// ── Status helpers ────────────────────────────────────────────────────────────
function getStatus(user) {
  if (user.is_banned    === true) return 'banned'
  if (user.is_suspended === true) return 'suspended'
  if (user.is_muted     === true) return 'muted'
  const s = (user.status ?? user.moderation_status ?? user.account_status ?? '').toLowerCase()
  if (s === 'banned')    return 'banned'
  if (s === 'suspended') return 'suspended'
  if (s === 'muted')     return 'muted'
  return 'active'
}

function StatusBadge({ status }) {
  const map = {
    active:    { color: 'var(--success)',    bg: 'var(--success-bg)',  label: 'Active' },
    banned:    { color: '#e05260',           bg: '#3a1820',            label: 'Banned' },
    suspended: { color: 'var(--warning)',    bg: '#3a2e10',            label: 'Suspended' },
    muted:     { color: 'var(--text-muted)', bg: 'var(--bg-hover)',   label: 'Muted' },
  }
  const s = map[status] ?? map.active
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
      border: `1px solid ${s.color}33`, letterSpacing: 0.3, textTransform: 'uppercase',
    }}>
      {s.label}
    </span>
  )
}

function deriveStats(users) {
  return {
    total:     users.length,
    banned:    users.filter(u => getStatus(u) === 'banned').length,
    suspended: users.filter(u => getStatus(u) === 'suspended').length,
    muted:     users.filter(u => getStatus(u) === 'muted').length,
  }
}

export default function DashboardPage() {
  const { user, role } = useAuth()
  const navigate = useNavigate()

  const isAdmin     = role !== 'moderator'
  const displayName = user?.admin_name ?? user?.moderator_name ?? user?.name ?? 'Staff'

  // ── State ──────────────────────────────────────────────────────────────────────
  const [stats,        setStats]        = useState({ total: null, banned: null, suspended: null, muted: null })
  const [overview,     setOverview]     = useState(null)
  const [users,        setUsers]        = useState([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError,   setStatsError]   = useState(null)
  const [search,       setSearch]       = useState('')

  // ── Fetch users + overview ──────────────────────────────────────────────────
  useEffect(() => {
    const currentRole = role ?? getRole()
    
    // Fetch users first (always works)
    getAllUsers(currentRole)
      .then(usersData => {
        const list = Array.isArray(usersData)
          ? usersData
          : Array.isArray(usersData?.users)
            ? usersData.users
            : Array.isArray(usersData?.data)
              ? usersData.data
              : []
        setUsers(list)
        setStats(deriveStats(list))
      })
      .catch(err => {
        console.error('Failed to fetch users:', err)
        setStatsError('Failed to load users. Please refresh.')
      })
      .finally(() => setStatsLoading(false))

    // Then try to fetch overview (but don't crash if it fails)
    getDashboardOverview(currentRole)
      .then(overviewData => {
        setOverview(overviewData)
      })
      .catch(err => {
        console.warn('Dashboard overview not available:', err.message)
        // Don't set error state - just use user stats
      })
  }, [role])

  // ── Filter users ─────────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (u.username  ?? '').toLowerCase().includes(q) ||
      (u.full_name ?? '').toLowerCase().includes(q) ||
      (u.email     ?? '').toLowerCase().includes(q) ||
      (u.phone_number ?? u.phone ?? '').toLowerCase().includes(q) ||
      String(resolveId(u) ?? '').includes(q)
    )
  })

  // ── Build stat cards from overview or fallback ──────────────────────────────
  const STAT_CARDS = overview ? [
    { label: 'Total Users',   icon: 'bi-people-fill',       colorClass: 'text-accent',   value: overview.total_users ?? stats.total },
    { label: 'DAU',           icon: 'bi-bar-chart-fill',    colorClass: 'text-success',   value: overview.dau ?? '—' },
    { label: 'MAU',           icon: 'bi-graph-up',          colorClass: 'text-accent',    value: overview.mau ?? '—' },
    { label: 'Active Streams',icon: 'bi-broadcast',         colorClass: 'text-warn',      value: overview.active_streams ?? 0 },
    { label: 'Total Posts',   icon: 'bi-file-earmark',      colorClass: 'text-accent',    value: overview.total_posts ?? '—' },
    { label: 'Mod Queue',     icon: 'bi-clock-history',     colorClass: 'text-warn',      value: overview.moderation_queue ?? 0 },
    { label: 'Revenue',       icon: 'bi-coin',              colorClass: 'text-success',   value: overview.revenue ? `$${overview.revenue.toFixed(2)}` : '—' },
    { label: 'Banned',        icon: 'bi-slash-circle-fill', colorClass: 'text-danger2',   value: stats.banned },
  ] : [
    { label: 'Total Users',  icon: 'bi-people-fill',       colorClass: 'text-accent',  value: stats.total },
    { label: 'Banned Users', icon: 'bi-slash-circle-fill', colorClass: 'text-danger2', value: stats.banned },
    { label: 'Suspended',    icon: 'bi-pause-circle-fill', colorClass: 'text-warn',    value: stats.suspended },
    { label: 'Muted',        icon: 'bi-mic-mute-fill',     colorClass: 'text-muted2',  value: stats.muted },
  ]

  function renderStatVal(v) {
    if (statsLoading) return <div style={{ width: 48, height: 22, borderRadius: 4, background: 'var(--bg-hover)', animation: 'pulse 1.4s ease-in-out infinite' }} />
    if (statsError || v === null || v === undefined) return '—'
    return v
  }

  // ── Navigation helpers ──────────────────────────────────────────────────────
  function goLookup(u)   { navigate(`/lookup?id=${resolveId(u) ?? ''}`) }
  function goModerate(u) { navigate(`/moderate?id=${resolveId(u) ?? ''}`) }
  function goEdit(u)     { navigate(`/edit?id=${resolveId(u) ?? ''}`) }

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .user-row:hover { background: var(--bg-hover) !important; }
        .user-row { transition: background 0.15s; }
        .search-box { background: var(--bg-hover); border: 1px solid var(--border); color: var(--text-primary); border-radius: 8px; padding: 7px 14px; width: 100%; max-width: 300px; font-size: 13px; }
        .search-box:focus { outline: none; border-color: var(--accent); }
        .search-box::placeholder { color: var(--text-muted); }
        .act-btn { background: var(--bg-hover); border: 1px solid var(--border); border-radius: 6px; padding: 4px 9px; cursor: pointer; color: var(--text-secondary); font-size: 11.5px; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
        .act-btn:hover { border-color: var(--accent); color: var(--accent); }
        .act-btn.warn:hover { border-color: var(--warning); color: var(--warning); }
        .act-btn.success:hover { border-color: var(--success); color: var(--success); }
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
        @media (max-width: 768px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
        .quick-actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; }
        @media (max-width: 480px) { .quick-actions-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      {/* Welcome banner */}
      <div className="card mb-4" style={{ padding: '28px', background: 'linear-gradient(120deg, var(--bg-card) 60%, var(--accent-glow) 100%)', borderLeft: '3px solid var(--accent)' }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h4 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, marginBottom: 4 }}>Welcome back, {displayName} 👋</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 0 }}>
              Signed in as <span className={`role-pill ${isAdmin ? 'admin' : 'moderator'}`}>{isAdmin ? 'Admin' : 'Moderator'}</span>. Here's what's happening on your platform.
            </p>
          </div>
          <div style={{ width: 52, height: 52, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif', flexShrink: 0 }}>
            {displayName[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid mb-4">
        {STAT_CARDS.map(s => (
          <div className="stat-card" key={s.label}>
            <div className={`stat-icon ${s.colorClass}`}><i className={`bi ${s.icon}`} /></div>
            <div className={`stat-val ${s.colorClass}`}>{renderStatVal(s.value)}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* All Users Table */}
      <div className="card mb-4">
        <div className="card-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span className="card-title">
            All Users
            {!statsLoading && !statsError && (
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 8 }}>
                ({filtered.length}{search ? ` of ${users.length}` : ''})
              </span>
            )}
          </span>
          <input className="search-box" placeholder="Search name, username, email, phone, ID…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ padding: 0 }}>
          {statsLoading && (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              <i className="bi bi-hourglass-split me-2" />Loading users…
            </div>
          )}
          {!statsLoading && statsError && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#e05260', fontSize: 13.5 }}>
              <i className="bi bi-x-circle me-2" />{statsError}
            </div>
          )}
          {!statsLoading && !statsError && filtered.length === 0 && (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              {search ? 'No users match your search.' : 'No users found.'}
            </div>
          )}

          {!statsLoading && !statsError && filtered.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
                    {['#', 'User', 'Email', 'Phone', 'Status', 'Verified', 'Email Verified', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, idx) => {
                    const uid      = resolveId(u)
                    const status   = getStatus(u)
                    const avatar   = u.avatar ?? u.profile_picture ?? u.avatar_url ?? null
                    const name     = u.full_name ?? u.name ?? u.username ?? '—'
                    const username = u.username ? `@${u.username}` : ''
                    const email    = u.email ?? '—'
                    const phone    = u.phone_number ?? u.phone ?? '—'
                    const verified = u.is_verified === true
                    const emailVerified = u.is_email_verified === true

                    return (
                      <tr key={uid ?? idx} className="user-row" style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700, minWidth: 44, fontSize: 13 }}>
                          {idx + 1}
                        </td>

                        {/* User */}
                        <td style={{ padding: '12px 16px', minWidth: 190 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {avatar ? (
                              <img src={avatar} alt={name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid var(--border)' }} onError={e => { e.target.style.display = 'none' }} />
                            ) : (
                              <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>
                                {(name[0] ?? '?').toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
                              {username && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{username}</div>}
                              {uid && <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'monospace', opacity: 0.7 }}>{uid}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', minWidth: 180 }}>{email}</td>

                        {/* Phone */}
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', minWidth: 140 }}>{phone}</td>

                        {/* Status */}
                        <td style={{ padding: '12px 16px', minWidth: 110 }}>
                          <StatusBadge status={status} />
                        </td>

                        {/* Verified (profile verified) */}
                        <td style={{ padding: '12px 16px', minWidth: 80 }}>
                          {verified
                            ? <i className="bi bi-patch-check-fill" style={{ color: 'var(--accent)', fontSize: 16 }} />
                            : <i className="bi bi-dash" style={{ color: 'var(--text-muted)' }} />}
                        </td>

                        {/* Email Verified */}
                        <td style={{ padding: '12px 16px', minWidth: 80 }}>
                          {emailVerified
                            ? <i className="bi bi-envelope-check-fill" style={{ color: 'var(--success)', fontSize: 16 }} />
                            : <i className="bi bi-envelope-slash-fill" style={{ color: 'var(--text-muted)' }} />}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 14px', minWidth: 180 }}>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            <button className="act-btn" onClick={() => goLookup(u)} title="View full profile">
                              <i className="bi bi-search" /> View
                            </button>
                            <button className="act-btn warn" onClick={() => goModerate(u)} title="Moderate user">
                              <i className="bi bi-shield" /> Mod
                            </button>
                            <button className="act-btn success" onClick={() => goEdit(u)} title="Edit profile">
                              <i className="bi bi-pencil" /> Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mb-4">
        <div className="card-header-bar"><span className="card-title">Quick Actions</span></div>
        <div className="card-body-pad">
          <div className="quick-actions-grid">
            {QUICK_ACTIONS.map(a => (
              <button
                key={a.label}
                className="btn btn-outline-secondary"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: '16px 8px',
                  height: '100%',
                  minHeight: 80,
                  fontSize: 12,
                }}
                onClick={() => navigate(a.path)}
              >
                <i className={`bi ${a.icon}`} style={{ fontSize: 22, color: a.color }} />
                <span style={{ fontWeight: 600 }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}