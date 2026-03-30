import React, { useState, useEffect } from 'react'
import { editUserProfile, EDIT_ALLOWLIST } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

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

export default function EditModal({ open, user, onClose, onSuccess }) {
  const { role } = useAuth()
  const { addToast } = useToast()
  const [form, setForm]     = useState(() => initState(user))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) setForm(initState(user))
  }, [user])

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    const payload = {}
    for (const f of FIELDS) {
      const v = form[f.key]
      if (f.type === 'bool') {
        payload[f.key] = v
      } else {
        if (v !== '' && v != null) payload[f.key] = v
      }
    }
    if (!Object.keys(payload).length) { addToast('No fields to update.', 'warning'); return }
    setLoading(true)
    try {
      await editUserProfile(user._id, payload, role)
      addToast('Profile updated successfully.', 'success')
      onSuccess?.()
      onClose()
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <span className="modal-title"><i className="bi bi-pencil-square me-2" />Edit User Profile</span>
          <button className="modal-close" onClick={onClose}><i className="bi bi-x" /></button>
        </div>

        <div className="modal-body">
          <div className="perm-notice">
            <i className="bi bi-info-circle me-1" />
            Password and wallet/balance fields cannot be edited here. Leave text fields blank to skip updating.
          </div>

          <div className="row g-3">
            {FIELDS.map(f => (
              <div key={f.key} className={`col-12 col-md-${f.col}`}>
                <label className="form-label">{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                  />
                ) : f.type === 'bool' ? (
                  <div className="form-check form-switch mt-1">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`ef-${f.key}`}
                      checked={!!form[f.key]}
                      onChange={e => set(f.key, e.target.checked)}
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
                    value={form[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading}>
            {loading ? <><i className="bi bi-arrow-clockwise me-1" />Saving…</> : <><i className="bi bi-save me-1" />Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}
