import React, { useState } from 'react'
import { moderateUser } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import StatusBadge from '../ui/StatusBadge'

const ACTIONS = [
  { key: 'ban',     label: 'Ban',     icon: 'bi-slash-circle',      color: 'var(--danger)',  desc: 'Permanently bans the user. Sets status to "banned".' },
  { key: 'suspend', label: 'Suspend', icon: 'bi-pause-circle',      color: 'var(--warning)', desc: 'Temporarily suspends the user.' },
  { key: 'unban',   label: 'Unban',   icon: 'bi-check-circle',      color: 'var(--success)', desc: 'Restores the user to active status.' },
  { key: 'mute',    label: 'Mute',    icon: 'bi-mic-mute',          color: 'var(--text-secondary)', desc: 'Mutes the user (is_muted = true).' },
  { key: 'unmute',  label: 'Unmute',  icon: 'bi-mic',               color: 'var(--accent)',  desc: 'Un-mutes the user (is_muted = false).' },
]

function buildBody(action, reason) {
  const body = { reason }
  if (action === 'ban')     body.status = 'banned'
  if (action === 'suspend') body.status = 'suspended'
  if (action === 'unban')   body.status = 'active'
  if (action === 'mute')    body.mute   = true
  if (action === 'unmute')  body.mute   = false
  return body
}

export default function ModerateModal({ open, user, onClose, onSuccess }) {
  const { role } = useAuth()
  const { addToast } = useToast()
  const [selectedAction, setSelectedAction] = useState(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const actionMeta = ACTIONS.find(a => a.key === selectedAction)

  async function handleSubmit() {
    if (!selectedAction) { addToast('Select an action.', 'warning'); return }
    if (!reason.trim())  { addToast('A reason is required.', 'warning'); return }
    setLoading(true)
    try {
      await moderateUser(user._id, buildBody(selectedAction, reason.trim()), role)
      addToast(`User ${selectedAction}ed successfully.`, 'success')
      setReason('')
      setSelectedAction(null)
      onSuccess?.()
      onClose()
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setReason('')
    setSelectedAction(null)
    onClose()
  }

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title"><i className="bi bi-shield-check me-2" />Moderate User</span>
          <button className="modal-close" onClick={handleClose}><i className="bi bi-x" /></button>
        </div>

        <div className="modal-body">
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(user.full_name || user.username || 'U')[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{user.full_name || user.username}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user._id}</div>
              </div>
              <StatusBadge status={user.status} />
            </div>
          )}

          <label className="form-label">Select Action</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {ACTIONS.map(a => (
              <button
                key={a.key}
                className="action-sel-btn"
                style={{
                  color: selectedAction === a.key ? a.color : undefined,
                  borderColor: selectedAction === a.key ? a.color : undefined,
                  background: selectedAction === a.key ? `${a.color}15` : undefined,
                }}
                onClick={() => setSelectedAction(a.key)}
              >
                <i className={`bi ${a.icon}`} /> {a.label}
              </button>
            ))}
          </div>

          {actionMeta && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: `${actionMeta.color}15`, color: actionMeta.color, fontSize: 12.5, marginBottom: 14 }}>
              <i className="bi bi-info-circle me-1" /> {actionMeta.desc}
            </div>
          )}

          <label className="form-label">Reason <span style={{ color: 'var(--danger)' }}>*</span></label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Required — describe the reason for this action…"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline-secondary btn-sm" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={loading || !selectedAction || !reason.trim()}
          >
            {loading ? <><i className="bi bi-arrow-clockwise me-1" style={{ animation: 'spin 1s linear infinite' }} />Processing…</> : 'Apply Action'}
          </button>
        </div>
      </div>
    </div>
  )
}
