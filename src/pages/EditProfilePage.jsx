import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getUserProfile, editUserProfile, resolveId, EDIT_ALLOWLIST } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import StatusBadge from '../components/ui/StatusBadge'

const FIELDS = [
  { key: 'username',           label: 'Username',           type: 'text',     col: 6 },
  { key: 'full_name',          label: 'Full Name',          type: 'text',     col: 6 },
  { key: 'email',              label: 'Email',              type: 'email',    col: 6 },
  { key: 'phone_number',       label: 'Phone Number',       type: 'tel',      col: 6 },
  { key: 'bio',                label: 'Bio',                type: 'textarea', col: 12 },
  { key: 'avatar',             label: 'Avatar URL',         type: 'text',     col: 6 },
  { key: 'cover_image',        label: 'Cover Image URL',    type: 'text',     col: 6 },
  { key: 'website',            label: 'Website',            type: 'url',      col: 6 },
  { key: 'country',            label: 'Country',            type: 'text',     col: 6 },
  { key: 'is_private',         label: 'Private Account',    type: 'bool',     col: 4 },
  { key: 'show_online_status', label: 'Show Online Status', type: 'bool',     col: 4 },
  { key: 'is_verified',        label: 'Verified',           type: 'bool',     col: 4 },
]

function initState(user) {
  const s = {}
  for (const f of FIELDS) {
    s[f.key] = user?.[f.key] ?? (f.type === 'bool' ? false : '')
  }
  return s
}

export default function EditProfilePage() {
  const { role } = useAuth()
  const { addToast } = useToast()
  const [searchParams] = useSearchParams()

  // Accept ?id= from dashboard navigation
  const paramId = searchParams.get('id') ?? searchParams.get('uid') ?? ''

  const [userId, setUserId]   = useState(paramId)
  const [user, setUser]       = useState(null)
  const [form, setForm]       = useState(initState(null))
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [dirty, setDirty]     = useState(false)

  // Auto-load when navigated with ?id=
  useEffect(() => {
    const pid = searchParams.get('id') ?? searchParams.get('uid') ?? ''
    if (pid) {
      setUserId(pid)
      fetchProfile(pid)
    }
  }, [searchParams])

  async function fetchProfile(id) {
    const uid = (id ?? userId).trim()
    if (!uid) { addToast('Enter a User ID.', 'warning'); return }
    setLoading(true); setUser(null); setDirty(false)
    try {
      const u = await getUserProfile(uid, role)
      setUser(u)
      setForm(initState(u))
    } catch (e) {
      addToast(e.message, 'error')
    } finally { setLoading(false) }
  }

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  async function handleSave() {
    const uid = resolveId(user)
    if (!uid) { addToast('No user loaded — cannot save.', 'warning'); return }

    const payload = {}
    for (const f of FIELDS) {
      const v = form[f.key]
      if (f.type === 'bool') {
        payload[f.key] = Boolean(v)
      } else {
        // Only include if user actually entered something
        if (v !== '' && v != null) payload[f.key] = v
      }
    }
    if (!Object.keys(payload).length) { addToast('No fields to update.', 'warning'); return }

    setSaving(true)
    try {
      await editUserProfile(uid, payload, role)
      addToast('Profile updated successfully.', 'success')
      setDirty(false)
      // Re-fetch to show fresh data
      const updated = await getUserProfile(uid, role)
      setUser(updated)
      setForm(initState(updated))
    } catch (e) {
      addToast(e.message, 'error')
    } finally { setSaving(false) }
  }

  function handleClear() {
    if (user) { setForm(initState(user)); setDirty(false) }
  }

  const resolvedId = resolveId(user)

  return (
    <>
      {/* Lookup */}
      <div className="card mb-4">
        <div className="card-header-bar">
          <span className="card-title"><i className="bi bi-pencil-square me-2 text-accent" />Edit User Profile</span>
        </div>
        <div className="card-body-pad">
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 14 }}>
            Load a user by their 24-char hex ObjectId, edit the fields, then save.
          </p>
          <div className="d-flex gap-2 flex-wrap">
            <input
              type="text"
              className="form-control"
              style={{ flex: 1, minWidth: 260, fontFamily: 'monospace', fontSize: 12.5 }}
              placeholder="24-char hex ObjectId"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchProfile()}
            />
            <button className="btn btn-primary" onClick={() => fetchProfile()} disabled={loading}>
              {loading
                ? <><i className="bi bi-arrow-clockwise me-1" style={{ animation: 'spin 1s linear infinite' }} />Loading…</>
                : <><i className="bi bi-cloud-arrow-down me-1" />Load Fields</>}
            </button>
          </div>
        </div>
      </div>

      {!user && !loading && (
        <div className="empty-state">
          <i className="bi bi-cloud-arrow-down" />
          <p>Load a user profile to start editing.</p>
        </div>
      )}

      {user && (
        <>
          {/* User summary strip */}
          <div className="card mb-4" style={{ padding: '14px 18px', borderLeft: '3px solid var(--accent)' }}>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {(user.full_name || user.username || 'U')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{user.full_name || user.username}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {resolvedId ?? '—'}
                  {!resolvedId && (
                    <span style={{ color: '#e05260', marginLeft: 8 }}>⚠ No ID found — save may fail</span>
                  )}
                </div>
              </div>
              <div className="d-flex gap-2">
                <StatusBadge status={user.status} />
                {user.is_muted && <StatusBadge muted />}
              </div>
              {dirty && (
                <span style={{ fontSize: 12, color: 'var(--warning)', padding: '2px 8px', borderRadius: 20, background: 'var(--warning-bg)' }}>
                  <i className="bi bi-exclamation-triangle me-1" />Unsaved changes
                </span>
              )}
            </div>
          </div>

          {/* Field grid */}
          <div className="card mb-4">
            <div className="card-header-bar">
              <span className="card-title">Editable Fields</span>
            </div>
            <div className="card-body-pad">
              <div className="perm-notice" style={{ display: 'block', marginBottom: 20 }}>
                <i className="bi bi-info-circle me-1" />
                Password and wallet/balance fields cannot be edited here. Leave text fields blank to skip updating them.
              </div>

              <div className="row g-3">
                {FIELDS.map(f => (
                  <div key={f.key} className={`col-12 col-md-${f.col}`}>
                    <label className="form-label">{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea
                        className="form-control"
                        rows={3}
                        value={form[f.key] ?? ''}
                        onChange={e => setField(f.key, e.target.value)}
                      />
                    ) : f.type === 'bool' ? (
                      <div className="form-check form-switch mt-1">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`ef-${f.key}`}
                          checked={!!form[f.key]}
                          onChange={e => setField(f.key, e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <label className="form-check-label" htmlFor={`ef-${f.key}`} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {form[f.key] ? 'Enabled' : 'Disabled'}
                        </label>
                      </div>
                    ) : (
                      <input
                        type={f.type}
                        className="form-control"
                        value={form[f.key] ?? ''}
                        onChange={e => setField(f.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="d-flex gap-2 mt-4">
                <button className="btn btn-primary" onClick={handleSave} disabled={saving || !dirty || !resolvedId}>
                  {saving
                    ? <><i className="bi bi-arrow-clockwise me-1" style={{ animation: 'spin 1s linear infinite' }} />Saving…</>
                    : <><i className="bi bi-save me-1" />Save Changes</>}
                </button>
                <button className="btn btn-outline-secondary" onClick={handleClear} disabled={saving}>
                  <i className="bi bi-arrow-counterclockwise me-1" />Reset
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
