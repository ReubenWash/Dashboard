import React, { useState, useEffect } from 'react'
import { getLiveStreams, forceEndStream, resolveId } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function LiveStreamsPage() {
  const { role } = useAuth()
  const { addToast } = useToast()

  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterActive, setFilterActive] = useState(false)
  const [actionLoading, setActionLoading] = useState({})

  const fetchStreams = async () => {
    setLoading(true)
    try {
      const data = await getLiveStreams({ active: filterActive || undefined }, role)
      const list = Array.isArray(data) ? data : data?.streams ?? data?.data ?? []
      setStreams(list)
    } catch (e) {
      addToast(e.message, 'error')
      setStreams([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStreams()
  }, [filterActive])

  const handleForceEnd = async (streamId) => {
    if (!streamId) return addToast('No stream ID', 'warning')
    if (!confirm('Force-end this stream? This action cannot be undone.')) return
    setActionLoading(prev => ({ ...prev, [streamId]: true }))
    try {
      await forceEndStream(streamId, role)
      addToast('Stream force-ended successfully', 'success')
      fetchStreams()
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setActionLoading(prev => ({ ...prev, [streamId]: false }))
    }
  }

  const renderStatus = (stream) => {
    const isLive = stream.is_live === true || stream.status === 'live'
    const endedByAdmin = stream.status === 'ended_by_admin'
    if (endedByAdmin) return <span style={{ color: 'var(--danger)' }}>Ended by Admin</span>
    if (isLive) return <span style={{ color: 'var(--success)' }}>🔴 Live</span>
    return <span style={{ color: 'var(--text-muted)' }}>Ended</span>
  }

  return (
    <>
      <div className="card mb-4">
        <div className="card-header-bar">
          <span className="card-title"><i className="bi bi-broadcast me-2 text-accent" />Live Streams</span>
          <div className="d-flex gap-2">
            <button
              className={`btn btn-sm ${filterActive ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setFilterActive(!filterActive)}
            >
              {filterActive ? 'Showing Active' : 'Show Active Only'}
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={fetchStreams} disabled={loading}>
              <i className="bi bi-arrow-clockwise" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>
        <div className="card-body-pad">
          {loading && (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="bi bi-arrow-clockwise me-2" style={{ animation: 'spin 1s linear infinite' }} />Loading streams…
            </div>
          )}
          {!loading && streams.length === 0 && (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="bi bi-camera-video-off me-2" />No streams {filterActive ? 'active' : 'found'}.
            </div>
          )}
          {!loading && streams.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stream ID</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Title / User</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Viewers</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Started</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {streams.map(s => {
                    const id = resolveId(s)
                    const title = s.title ?? s.stream_title ?? 'Untitled'
                    const userName = s.user?.username ?? s.user?.full_name ?? s.creator ?? '—'
                    const viewers = s.viewer_count ?? s.viewers ?? 0
                    const startedAt = s.started_at ?? s.created_at ?? null
                    const isLive = s.is_live === true || s.status === 'live'

                    return (
                      <tr key={id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{id}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 500 }}>{title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{userName}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>{renderStatus(s)}</td>
                        <td style={{ padding: '10px 12px' }}>{viewers}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                          {startedAt ? new Date(startedAt).toLocaleString() : '—'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <button
                            className="btn btn-danger btn-xs"
                            onClick={() => handleForceEnd(id)}
                            disabled={actionLoading[id] || !isLive}
                          >
                            {actionLoading[id]
                              ? <i className="bi bi-arrow-clockwise" style={{ animation: 'spin 1s linear infinite' }} />
                              : 'Force End'}
                          </button>
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