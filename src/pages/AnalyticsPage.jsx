import React, { useState, useEffect } from 'react'
import { getProductAnalytics, getDashboardOverview } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function AnalyticsPage() {
  const { role } = useAuth()
  const { addToast } = useToast()
  
  const [analytics, setAnalytics] = useState(null)
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('week')

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const [analyticsData, overviewData] = await Promise.all([
        getProductAnalytics(role),
        getDashboardOverview(role)
      ])
      
      // ─── DEBUG: Log the responses ──────────────────────────────────────────
      console.log('📊 Product Analytics Response:', JSON.stringify(analyticsData, null, 2))
      console.log('📊 Analytics keys:', Object.keys(analyticsData || {}))
      console.log('📊 Overview Data (for reference):', JSON.stringify(overviewData, null, 2))
      
      setAnalytics(analyticsData)
      setOverview(overviewData)
    } catch (e) {
      console.error('Analytics fetch error:', e)
      addToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '—'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  // Helper to safely get nested value
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

  const MetricCard = ({ label, value, change, icon, color }) => (
    <div className="stat-card" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
        <div style={{ color, fontSize: 20 }}><i className={`bi ${icon}`} /></div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>
        {formatNumber(value)}
      </div>
      {change !== undefined && change !== null && (
        <div style={{ 
          fontSize: 12, 
          marginTop: 4,
          color: change >= 0 ? 'var(--success)' : 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <i className={`bi ${change >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'}`} />
          {Math.abs(change).toFixed(1)}% from last period
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="card mb-4">
        <div className="card-header-bar">
          <span className="card-title"><i className="bi bi-graph-up me-2 text-accent" />Product Analytics</span>
          <div className="d-flex gap-2">
            <select 
              className="form-select form-select-sm" 
              style={{ width: 'auto' }}
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button 
              className="btn btn-sm btn-outline-secondary" 
              onClick={fetchAnalytics}
              disabled={loading}
            >
              <i className={`bi bi-arrow-clockwise ${loading ? 'spinning' : ''}`} />
            </button>
          </div>
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
              {/* Key metrics grid */}
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <MetricCard 
                    label="Total Users" 
                    value={getNestedValue(analytics, 'total_users') ?? getNestedValue(overview, 'dashboard.total_users') ?? getNestedValue(overview, 'total_users') ?? '—'}
                    icon="bi-people-fill"
                    color="var(--accent)"
                  />
                </div>
                <div className="col-6 col-md-3">
                  <MetricCard 
                    label="DAU" 
                    value={getNestedValue(analytics, 'dau') ?? getNestedValue(overview, 'dashboard.daily_active_users') ?? '—'}
                    icon="bi-bar-chart-fill"
                    color="var(--success)"
                  />
                </div>
                <div className="col-6 col-md-3">
                  <MetricCard 
                    label="MAU" 
                    value={getNestedValue(analytics, 'mau') ?? getNestedValue(overview, 'dashboard.monthly_active_users') ?? '—'}
                    icon="bi-graph-up"
                    color="var(--accent)"
                  />
                </div>
                <div className="col-6 col-md-3">
                  <MetricCard 
                    label="Revenue" 
                    value={getNestedValue(analytics, 'revenue') ?? getNestedValue(overview, 'revenue.total') ?? '$0'}
                    icon="bi-coin"
                    color="var(--success)"
                  />
                </div>
              </div>

              {/* Additional metrics – try to extract from analytics */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-hover)' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>
                      <i className="bi bi-file-earmark me-2" />Content Overview
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Videos</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(getNestedValue(analytics, 'videos_count') ?? getNestedValue(analytics, 'videos') ?? '—')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Images</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(getNestedValue(analytics, 'images_count') ?? getNestedValue(analytics, 'images') ?? '—')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Comments</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(getNestedValue(analytics, 'comments_count') ?? getNestedValue(analytics, 'comments') ?? '—')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reports</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(getNestedValue(analytics, 'reports_pending') ?? getNestedValue(analytics, 'pending_reports') ?? getNestedValue(overview, 'dashboard.pending_reports') ?? '—')}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-hover)' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>
                      <i className="bi bi-wallet2 me-2" />Financial Overview
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Deposits</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>
                          {formatNumber(getNestedValue(analytics, 'total_deposits') ?? getNestedValue(analytics, 'deposits') ?? '—')}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Payouts</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--warning)' }}>
                          {formatNumber(getNestedValue(analytics, 'total_payouts') ?? getNestedValue(analytics, 'payouts') ?? '—')}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pending Withdrawals</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--warning)' }}>
                          {formatNumber(getNestedValue(analytics, 'pending_withdrawals') ?? '—')}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Platform Revenue</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
                          {formatNumber(getNestedValue(analytics, 'platform_revenue') ?? getNestedValue(analytics, 'revenue') ?? '—')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement stats */}
              <div className="row g-3">
                <div className="col-12">
                  <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-hover)' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>
                      <i className="bi bi-heart-fill me-2" style={{ color: 'var(--danger)' }} />Engagement
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Views</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(getNestedValue(analytics, 'total_views') ?? getNestedValue(analytics, 'views') ?? '—')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Likes</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(getNestedValue(analytics, 'total_likes') ?? getNestedValue(analytics, 'likes') ?? '—')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Shares</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(getNestedValue(analytics, 'total_shares') ?? getNestedValue(analytics, 'shares') ?? '—')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active Streams</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: getNestedValue(overview, 'dashboard.active_streams', 0) > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                          {getNestedValue(overview, 'dashboard.active_streams', 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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