import React, { useState, useEffect } from 'react'
import { getContentCollection, moderateContent, resolveId } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const COLLECTIONS = [
  { key: 'reports', label: 'Reports', icon: 'bi-flag-fill' },
  { key: 'videos',  label: 'Videos',  icon: 'bi-play-circle' },
  { key: 'images',  label: 'Images',  icon: 'bi-image' },
  { key: 'comments',label: 'Comments',icon: 'bi-chat' },
  { key: 'dms',     label: 'DMs',     icon: 'bi-envelope' },
]

const ACTIONS = ['approve', 'remove', 'shadow_ban', 'escalate']

export default function ContentModerationPage() {
  const { role } = useAuth()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState('reports')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})

  const fetchItems = async (collection) => {
    setLoading(true)
    try {
      const data = await getContentCollection(collection, {}, role)
      // backend may return { data: [...] } or raw array
      const list = Array.isArray(data) ? data : data?.data ?? data?.items ?? []
      setItems(list)
    } catch (e) {
      addToast(e.message, 'error')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems(activeTab)
  }, [activeTab])

  const handleAction = async (contentId, action) => {
    if (!contentId) return addToast('No content ID', 'warning')
    setActionLoading(prev => ({ ...prev, [contentId]: true }))
    try {
      await moderateContent(activeTab, contentId, action, `Admin ${action} via dashboard`, role)
      addToast(`Action "${action}" applied successfully`, 'success')
      fetchItems(activeTab) // refresh
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setActionLoading(prev => ({ ...prev, [contentId]: false }))
    }
  }

  const renderStatusBadge = (status) => {
    const map = {
      pending:    { color: 'var(--warning)',   bg: 'var(--warning-bg)',   label: 'Pending' },
      approved:   { color: 'var(--success)',   bg: 'var(--success-bg)',   label: 'Approved' },
      removed:    { color: 'var(--danger)',    bg: 'var(--danger-bg)',    label: 'Removed' },
      shadow_ban: { color: 'var(--text-muted)',bg: 'var(--bg-hover)',     label: 'Shadow Banned' },
      escalated:  { color: '#d455e0',          bg: '#2d1a33',             label: 'Escalated' },
    }
    const s = map[status] ?? map.pending
    return (
      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg }}>
        {s.label}
      </span>
    )
  }

  return (
    <>
      <div className="card mb-4">
        <div className="card-header-bar">
          <span className="card-title"><i className="bi bi-shield-lock me-2 text-accent" />Content Moderation</span>
        </div>
        <div className="card-body-pad">
          {/* Tabs */}
          <div className="d-flex gap-2 flex-wrap mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            {COLLECTIONS.map(c => (
              <button
                key={c.key}
                className={`btn btn-sm ${activeTab === c.key ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab(c.key)}
              >
                <i className={`bi ${c.icon} me-1`} /> {c.label}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading && (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="bi bi-arrow-clockwise me-2" style={{ animation: 'spin 1s linear infinite' }} />Loading…
            </div>
          )}
          {!loading && items.length === 0 && (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="bi bi-inbox me-2" />No {activeTab} found.
            </div>
          )}
          {!loading && items.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ID</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Content</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>User</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const id = resolveId(item)
                    const contentPreview = item.text ?? item.title ?? item.caption ?? item.url ?? item.content ?? '—'
                    const userName = item.user?.username ?? item.user?.full_name ?? item.author ?? '—'
                    const status = item.moderation_status ?? item.status ?? 'pending'

                    return (
                      <tr key={id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{id}</td>
                        <td style={{ padding: '10px 12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {contentPreview}
                        </td>
                        <td style={{ padding: '10px 12px' }}>{userName}</td>
                        <td style={{ padding: '10px 12px' }}>{renderStatusBadge(status)}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div className="d-flex gap-1 flex-wrap">
                            {ACTIONS.map(act => (
                              <button
                                key={act}
                                className="btn btn-xs btn-outline-secondary"
                                onClick={() => handleAction(id, act)}
                                disabled={actionLoading[id]}
                                style={{ textTransform: 'capitalize' }}
                              >
                                {actionLoading[id] ? <i className="bi bi-arrow-clockwise" style={{ animation: 'spin 1s linear infinite' }} /> : act}
                              </button>
                            ))}
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}