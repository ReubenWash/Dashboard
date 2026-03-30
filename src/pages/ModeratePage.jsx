import React, { useState } from 'react'
import { getUserProfile, moderateUser } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import StatusBadge from '../components/ui/StatusBadge'

const ACTIONS = [
  { key: 'ban',     label: 'Ban',     icon: 'bi-slash-circle',    color: 'var(--danger)',         desc: 'Sets status to "banned". Logged as ban_user.' },
  { key: 'suspend', label: 'Suspend', icon: 'bi-pause-circle',    color: 'var(--warning)',        desc: 'Sets status to "suspended". Logged as update_user.' },
  { key: 'unban',   label: 'Unban',   icon: 'bi-check-circle',    color: 'var(--success)',        desc: 'Restores status to "active". Logged as unban_user.' },
  { key: 'mute',    label: 'Mute',    icon: 'bi-mic-mute',        color: 'var(--text-secondary)', desc: 'Sets is_muted to true. Logged as mute_user.' },
  { key: 'unmute',  label: 'Unmute',  icon: 'bi-mic',             color: 'var(--accent)',         desc: 'Sets is_muted to false. Logged as unmute_user.' },
]

function buildBody(action, reason) {
  const body = { reason }
  if (action === 'ban')     body.status = 'banned'
  if (action === 'suspend') body.status = 'suspended'
  if (action === 'unban')   body.status = 'active'
  if (action === 'mute')    body.mute = true
  if (action === 'unmute')  body.mute = false
  return body
}

export default function ModeratePage() {
  const { role } = useAuth()
  const { addToast } = useToast()

  const [userId, setUserId]         = useState('')
  const [user, setUser]             = useState(null)
  const [loadingProfile, setLP]     = useState(false)
  const [selectedAction, setAction] = useState(null)
  const [reason, setReason]         = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function fetchProfile() {
    if (!userId.trim()) { addToast('Enter a User ID.', 'warning'); return }
    setLP(true); setUser(null)
    try {
      const u = await getUserProfile(userId.trim(), role)
      setUser(u)
    } catch (e) {
      addToast(e.message, 'error')
    } finally { setLP(false) }
  }

  async function handleSubmit() {
    const uid = userId.trim() || user?._id
    if (!uid)           { addToast('Enter a User ID.', 'warning'); return }
    if (!selectedAction){ addToast('Select an action.', 'warning'); return }
    if (!reason.trim()) { addToast('A reason is required.', 'warning'); return }
    setSubmitting(true)
    try {
      await moderateUser(uid, buildBody(selectedAction, reason.trim()), role)
      addToast(`User ${selectedAction}ed successfully.`, 'success')
      setReason('')
      setAction(null)
      // Re-fetch to show updated status
      if (user?._id) {
        const updated = await getUserProfile(user._id, role)
        setUser(updated)
      }
    } catch (e) {
      addToast(e.message, 'error')
    } finally { setSubmitting(false) }
  }

  const actionMeta = ACTIONS.find(a => a.key === selectedAction)

  return (
    <>
      <div className="row g-4">
        {/* Left: User ID + Preview */}
        <div className="col-12 col-lg-5">
          <div className="card mb-3">
            <div className="card-header-bar">
              <span className="card-title"><i className="bi bi-person-badge me-2 text-accent" />Target User</span>
            </div>
            <div className="card-body-pad">
              <label className="form-label">User ID</label>
              <div className="d-flex gap-2 mb-3">
                <input
                  type="text"
                  className="form-control"
                  style={{ fontFamily: 'monospace', fontSize: 12.5 }}
                  placeholder="24-char hex ObjectId"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchProfile()}
                />
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={fetchProfile}
                  disabled={loadingProfile}
                  style={{ flexShrink: 0 }}
                >
                  {loadingProfile
                    ? <i className="bi bi-arrow-clockwise" style={{ animation: 'spin 1s linear infinite' }} />
                    : <i className="bi bi-cloud-arrow-down" />}
                </button>
              </div>

              {/* Preview */}
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff', flexShrink: 0 }}>
                    {(user.full_name || user.username || 'U')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{user.full_name || user.username}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user._id}</div>
                  </div>
                  <div className="d-flex flex-column gap-1 align-items-end">
                    <StatusBadge status={user.status} />
                    {user.is_muted && <StatusBadge muted />}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '16px', borderRadius: 8, background: 'var(--bg-input)', border: '1px dashed var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  {loadingProfile ? 'Loading…' : 'Load a user to preview'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="col-12 col-lg-7">
          <div className="card">
            <div className="card-header-bar">
              <span className="card-title"><i className="bi bi-shield-check me-2 text-accent" />Moderation Action</span>
            </div>
            <div className="card-body-pad">

              {/* Action grid */}
              <label className="form-label">Select Action</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {ACTIONS.map(a => (
                  <button
                    key={a.key}
                    className="action-sel-btn"
                    style={{
                      color: selectedAction === a.key ? a.color : undefined,
                      borderColor: selectedAction === a.key ? a.color : undefined,
                      background: selectedAction === a.key ? `${a.color}18` : undefined,
                    }}
                    onClick={() => setAction(selectedAction === a.key ? null : a.key)}
                  >
                    <i className={`bi ${a.icon}`} /> {a.label}
                  </button>
                ))}
              </div>

              {/* Action description */}
              {actionMeta && (
                <div
                  style={{
                    padding: '9px 12px', borderRadius: 8, fontSize: 12.5, marginBottom: 14,
                    background: `${actionMeta.color}15`, color: actionMeta.color,
                  }}
                >
                  <i className="bi bi-info-circle me-1" /> {actionMeta.desc}
                </div>
              )}

              {/* Reason */}
              <label className="form-label">
                Reason <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                className="form-control mb-3"
                rows={4}
                placeholder="Required — describe the reason for this moderation action…"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />

              {/* Audit note */}
              <div style={{ padding: '9px 13px', borderRadius: 8, background: 'var(--accent-glow)', color: 'var(--accent)', fontSize: 12, marginBottom: 18 }}>
                <i className="bi bi-journal-check me-1" />
                All moderation actions are written to the <code>moderator_log</code> audit collection
                in the admin-management database.
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={submitting || !selectedAction || !reason.trim()}
                >
                  {submitting
                    ? <><i className="bi bi-arrow-clockwise me-1" style={{ animation: 'spin 1s linear infinite' }} />Submitting…</>
                    : <><i className="bi bi-shield-check me-1" />Apply Moderation</>}
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => { setAction(null); setReason('') }}
                  disabled={submitting}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
