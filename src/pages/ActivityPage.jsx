import React, { useState, useEffect } from 'react'
import { getActivityFeed } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function ActivityPage() {
  const { role } = useAuth()
  const { addToast } = useToast()
  
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all')

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const data = await getActivityFeed(role)
      const list = Array.isArray(data) ? data : data?.activities ?? data?.data ?? []
      setActivities(list)
    } catch (e) {
      addToast(e.message, 'error')
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  const getActivityIcon = (type) => {
    const icons = {
      user_signup: 'bi-person-plus',
      user_login: 'bi-box-arrow-in-right',
      user_report: 'bi-flag',
      content_upload: 'bi-cloud-upload',
      content_remove: 'bi-trash',
      moderation: 'bi-shield-check',
      payout: 'bi-cash',
      withdrawal: 'bi-arrow-up-circle',
      stream_start: 'bi-broadcast',
      stream_end: 'bi-camera-video-off',
      gift_sent: 'bi-gift',
      subscription: 'bi-star',
      admin_action: 'bi-gear',
      user_verified: 'bi-patch-check',
      email_sent: 'bi-envelope',
      deposit: 'bi-arrow-down-circle',
      revenue: 'bi-graph-up',
    }
    return icons[type] ?? 'bi-dot'
  }

  const getActivityColor = (type) => {
    const colors = {
      user_signup: 'var(--success)',
      user_login: 'var(--accent)',
      user_report: 'var(--danger)',
      content_upload: 'var(--accent)',
      content_remove: 'var(--danger)',
      moderation: 'var(--warning)',
      payout: 'var(--success)',
      withdrawal: 'var(--warning)',
      stream_start: 'var(--success)',
      stream_end: 'var(--danger)',
      gift_sent: 'var(--accent)',
      subscription: 'var(--accent)',
      admin_action: 'var(--text-muted)',
      user_verified: 'var(--success)',
      email_sent: 'var(--accent)',
      deposit: 'var(--success)',
      revenue: 'var(--success)',
    }
    return colors[type] ?? 'var(--text-muted)'
  }

  const filteredActivities = activities.filter(a => {
    if (filter !== 'all' && a.type !== filter) return false
    
    if (dateRange === 'today') {
      const today = new Date().toDateString()
      const activityDate = a.created_at ? new Date(a.created_at).toDateString() : ''
      return activityDate === today
    }
    if (dateRange === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const activityDate = a.created_at ? new Date(a.created_at) : new Date(0)
      return activityDate >= weekAgo
    }
    if (dateRange === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      const activityDate = a.created_at ? new Date(a.created_at) : new Date(0)
      return activityDate >= monthAgo
    }
    return true
  })

  const types = [...new Set(activities.map(a => a.type).filter(Boolean))]

  return (
    <>
      <div className="card">
        <div className="card-header-bar">
          <span className="card-title"><i className="bi bi-clock-history me-2 text-accent" />Activity Log</span>
          <div className="d-flex gap-2 flex-wrap">
            <select 
              className="form-select form-select-sm" 
              style={{ width: 'auto', minWidth: 130 }}
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="all">All Activities</option>
              {types.map(t => (
                <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
            <select 
              className="form-select form-select-sm" 
              style={{ width: 'auto', minWidth: 100 }}
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            <button 
              className="btn btn-sm btn-outline-secondary" 
              onClick={fetchActivities}
              disabled={loading}
            >
              <i className={`bi bi-arrow-clockwise ${loading ? 'spinning' : ''}`} />
            </button>
          </div>
        </div>
        <div className="card-body-pad">
          {loading && (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="bi bi-arrow-clockwise me-2" style={{ animation: 'spin 1s linear infinite' }} />Loading activities…
            </div>
          )}
          {!loading && activities.length === 0 && (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="bi bi-inbox me-2" />No activities found.
            </div>
          )}
          {!loading && filteredActivities.length === 0 && activities.length > 0 && (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="bi bi-funnel me-2" />No activities match your filters.
            </div>
          )}
          {!loading && filteredActivities.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredActivities.map((activity, idx) => (
                <div 
                  key={activity._id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'background 0.15s',
                    cursor: 'default',
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${getActivityColor(activity.type)}20`,
                    color: getActivityColor(activity.type),
                    flexShrink: 0,
                    fontSize: 16,
                  }}>
                    <i className={`bi ${getActivityIcon(activity.type)}`} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13.5 }}>
                      {activity.message || activity.description || activity.action || 'Activity'}
                    </div>
                    {activity.details && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {activity.details}
                      </div>
                    )}
                    {activity.admin_name && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        <i className="bi bi-person me-1" />By: {activity.admin_name}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      <i className="bi bi-clock me-1" />
                      {activity.created_at 
                        ? new Date(activity.created_at).toLocaleString()
                        : activity.timestamp 
                          ? new Date(activity.timestamp).toLocaleString()
                          : '—'}
                    </div>
                  </div>
                  {activity.type && (
                    <span style={{
                      padding: '2px 10px',
                      borderRadius: 20,
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      background: `${getActivityColor(activity.type)}20`,
                      color: getActivityColor(activity.type),
                      flexShrink: 0,
                    }}>
                      {activity.type.replace('_', ' ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinning { animation: spin 1s linear infinite; }
      `}</style>
    </>
  )
}