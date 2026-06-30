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
      console.log('📊 Activity Feed Response:', data)
      
      // ── Parse the response into a unified list ──
      let list = []
      
      // 1. Live streams
      if (data?.live_activity && Array.isArray(data.live_activity)) {
        data.live_activity.forEach(item => {
          list.push({
            ...item,
            type: 'live_stream',
            message: `${item.streamer_username} started stream: "${item.title}"`,
            timestamp: item.started_at || item.created_at,
          })
        })
      }
      
      // 2. New users
      if (data?.new_users && Array.isArray(data.new_users)) {
        data.new_users.forEach(item => {
          list.push({
            ...item,
            type: 'user_signup',
            message: `New user joined: ${item.username || item.full_name || 'Unknown'}`,
            timestamp: item.created_at,
          })
        })
      }
      
      // 3. Reports
      if (data?.reports && Array.isArray(data.reports)) {
        data.reports.forEach(item => {
          list.push({
            ...item,
            type: 'report',
            message: `Report filed: ${item.reason || 'No reason'}`,
            timestamp: item.created_at,
          })
        })
      }
      
      // 4. Transactions
      if (data?.transactions && Array.isArray(data.transactions)) {
        data.transactions.forEach(item => {
          list.push({
            ...item,
            type: 'transaction',
            message: `Transaction of $${item.amount || 0}`,
            timestamp: item.created_at,
          })
        })
      }
      
      // Sort by timestamp (newest first)
      list.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0)
        const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0)
        return dateB - dateA
      })
      
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
      live_stream: 'bi-broadcast',
      user_signup: 'bi-person-plus',
      report: 'bi-flag',
      transaction: 'bi-cash',
    }
    return icons[type] ?? 'bi-dot'
  }

  const getActivityColor = (type) => {
    const colors = {
      live_stream: 'var(--success)',
      user_signup: 'var(--accent)',
      report: 'var(--danger)',
      transaction: 'var(--warning)',
    }
    return colors[type] ?? 'var(--text-muted)'
  }

  const filteredActivities = activities.filter(a => {
    if (filter !== 'all' && a.type !== filter) return false
    
    if (dateRange === 'today') {
      const today = new Date().toDateString()
      const activityDate = a.timestamp ? new Date(a.timestamp).toDateString() : ''
      return activityDate === today
    }
    if (dateRange === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const activityDate = a.timestamp ? new Date(a.timestamp) : new Date(0)
      return activityDate >= weekAgo
    }
    if (dateRange === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      const activityDate = a.timestamp ? new Date(a.timestamp) : new Date(0)
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
              {filteredActivities.map((activity, idx) => {
                const type = activity.type || 'unknown'
                const message = activity.message || 'Activity'
                const timestamp = activity.timestamp || activity.created_at
                const id = activity._id || activity.id || idx

                return (
                  <div 
                    key={id}
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
                      background: `${getActivityColor(type)}20`,
                      color: getActivityColor(type),
                      flexShrink: 0,
                      fontSize: 16,
                    }}>
                      <i className={`bi ${getActivityIcon(type)}`} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13.5 }}>
                        {message}
                      </div>
                      {activity.details && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {activity.details}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        <i className="bi bi-clock me-1" />
                        {timestamp ? new Date(timestamp).toLocaleString() : '—'}
                      </div>
                    </div>
                    {type && (
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: 20,
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background: `${getActivityColor(type)}20`,
                        color: getActivityColor(type),
                        flexShrink: 0,
                      }}>
                        {type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                )
              })}
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