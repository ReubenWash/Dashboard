import React, { useState, useEffect } from 'react'
import { getProductAnalytics, getDashboardOverview } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function AnalyticsPage() {
  const { role } = useAuth()
  const { addToast } = useToast()
  
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const data = await getProductAnalytics(role)
      console.log('📊 Product Analytics Response:', data)
      setAnalytics(data)
    } catch (e) {
      console.error('Analytics fetch error:', e)
      addToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '—'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

 const formatCurrency = (value) => {
  if (value === undefined || value === null) return '—'
  const num = typeof value === 'number' ? value : parseFloat(value)
  return isNaN(num) ? '—' : `₵${num.toFixed(2)}`
}

  const getNestedValue = (obj, path, fallback = '—') => {
    if (!obj) return fallback
    const keys = path.split('.')
    let current = obj
    for (const key of keys) {
      if (current === undefined || current === null) return fallback
      current = current[key]
    }
    return current !== undefined && current !== null ? current : fallback
  }

  const MetricCard = ({ label, value, icon, color, subtitle }) => (
    <div className="stat-card" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
        <div style={{ color, fontSize: 20 }}><i className={`bi ${icon}`} /></div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>
        {formatNumber(value)}
      </div>
      {subtitle && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</div>
      )}
    </div>
  )

  return (
    <>
      <div className="card mb-4">
        <div className="card-header-bar">
          <span className="card-title"><i className="bi bi-graph-up me-2 text-accent" />Product Analytics</span>
          <button 
            className="btn btn-sm btn-outline-secondary" 
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? 'spinning' : ''}`} />
          </button>
        </div>
        <div className="card-body-pad">
          {loading && (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="bi bi-arrow-clockwise me-2" style={{ animation: 'spin 1s linear infinite' }} />Loading analytics…
            </div>
          )}
          {!loading && !analytics && (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="bi bi-bar-chart me-2" />No analytics data available.
            </div>
          )}
          {!loading && analytics && (
            <>
              {/* ── Users Section ── */}
              <div style={{ marginBottom: 24 }}>
                <h5 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 12 }}>
                  <i className="bi bi-people-fill me-2 text-accent" />Users
                </h5>
                <div className="row g-3">
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Total Users" 
                      value={getNestedValue(analytics, 'users.total', '—')}
                      icon="bi-people-fill"
                      color="var(--accent)"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Active Users" 
                      value={getNestedValue(analytics, 'users.active', '—')}
                      icon="bi-bar-chart-fill"
                      color="var(--success)"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="New Users (30d)" 
                      value={getNestedValue(analytics, 'users.new', '—')}
                      icon="bi-person-plus-fill"
                      color="var(--accent)"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Verified" 
                      value={getNestedValue(analytics, 'users.verified', '—')}
                      icon="bi-patch-check-fill"
                      color="var(--success)"
                      subtitle={`${getNestedValue(analytics, 'users.verification_rate_percent', 0)}% verified`}
                    />
                  </div>
                </div>
                <div className="row g-3 mt-2">
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Activation Rate" 
                      value={`${getNestedValue(analytics, 'users.activation_rate_percent', 0)}%`}
                      icon="bi-graph-up"
                      color="var(--accent)"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="With Wallet" 
                      value={getNestedValue(analytics, 'users.with_wallet', '—')}
                      icon="bi-wallet2"
                      color="var(--warning)"
                      subtitle={`${getNestedValue(analytics, 'users.wallet_rate_percent', 0)}%`}
                    />
                  </div>
                </div>
              </div>

              {/* ── Content Section ── */}
              <div style={{ marginBottom: 24 }}>
                <h5 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 12 }}>
                  <i className="bi bi-file-earmark me-2 text-accent" />Content
                </h5>
                <div className="row g-3">
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Videos" 
                      value={getNestedValue(analytics, 'content.videos', '—')}
                      icon="bi-play-circle"
                      color="var(--accent)"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Images" 
                      value={getNestedValue(analytics, 'content.images', '—')}
                      icon="bi-image"
                      color="var(--success)"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Statuses" 
                      value={getNestedValue(analytics, 'content.statuses', '—')}
                      icon="bi-chat"
                      color="var(--warning)"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Total Posts" 
                      value={getNestedValue(analytics, 'content.posts_total', '—')}
                      icon="bi-file-earmark"
                      color="var(--accent)"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Broadcasts" 
                      value={getNestedValue(analytics, 'content.broadcasts', '—')}
                      icon="bi-broadcast"
                      color="var(--accent)"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Broadcast Messages" 
                      value={getNestedValue(analytics, 'content.broadcast_messages', '—')}
                      icon="bi-chat-dots"
                      color="var(--text-secondary)"
                    />
                  </div>
                </div>
              </div>

              {/* ── Commerce Section ── */}
              <div style={{ marginBottom: 24 }}>
                <h5 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 12 }}>
                  <i className="bi bi-wallet2 me-2 text-accent" />Commerce
                </h5>
                <div className="row g-3">
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Creator Earnings" 
                      value={formatCurrency(getNestedValue(analytics, 'commerce.creator_earnings', 0))}
                      icon="bi-cash"
                      color="var(--success)"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Viewer Earnings" 
                      value={formatCurrency(getNestedValue(analytics, 'commerce.viewer_earnings', 0))}
                      icon="bi-coin"
                      color="var(--accent)"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Deposits" 
                      value={getNestedValue(analytics, 'commerce.deposits', '—')}
                      icon="bi-arrow-down-circle"
                      color="var(--success)"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Withdrawals" 
                      value={getNestedValue(analytics, 'commerce.withdrawals', '—')}
                      icon="bi-arrow-up-circle"
                      color="var(--danger)"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Main Wallet Balance" 
                      value={formatCurrency(getNestedValue(analytics, 'commerce.main_wallet_balance', 0))}
                      icon="bi-wallet"
                      color="var(--accent)"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Earnings Wallet Balance" 
                      value={formatCurrency(getNestedValue(analytics, 'commerce.earnings_wallet_balance', 0))}
                      icon="bi-wallet2"
                      color="var(--warning)"
                    />
                  </div>
                </div>
              </div>

              {/* ── Engagement Section ── */}
              <div>
                <h5 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 12 }}>
                  <i className="bi bi-heart-fill me-2 text-accent" style={{ color: 'var(--danger)' }} />Engagement
                </h5>
                <div className="row g-3">
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Watch Minutes" 
                      value={getNestedValue(analytics, 'engagement.watch_minutes', '—')}
                      icon="bi-clock"
                      color="var(--accent)"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Watch Seconds" 
                      value={getNestedValue(analytics, 'engagement.watch_seconds', '—')}
                      icon="bi-stopwatch"
                      color="var(--text-secondary)"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Video Analytics Events" 
                      value={getNestedValue(analytics, 'engagement.video_analytics_events', '—')}
                      icon="bi-graph-up"
                      color="var(--success)"
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <MetricCard 
                      label="Top Creators" 
                      value={getNestedValue(analytics, 'engagement.top_creators', []).length || '0'}
                      icon="bi-trophy"
                      color="var(--warning)"
                    />
                  </div>
                </div>
              </div>

              {/* ── Range Info ── */}
              {analytics.range && (
                <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--bg-hover)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <i className="bi bi-calendar-range me-2" />
                  Data range: {new Date(analytics.range.from).toLocaleDateString()} – {new Date(analytics.range.to).toLocaleDateString()} ({analytics.range.days} days)
                </div>
              )}
            </>
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