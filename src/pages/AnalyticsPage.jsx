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
      setAnalytics(analyticsData)
      setOverview(overviewData)
    } catch (e) {
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
                    value={analytics.total_users || overview?.total_users || 0}
                    icon="bi-people-fill"
                    color="var(--accent)"
                  />
                </div>
                <div className="col-6 col-md-3">
                  <MetricCard 
                    label="Active Users (DAU)" 
                    value={analytics.dau || overview?.dau || 0}
                    change={analytics.dau_change}
                    icon="bi-bar-chart-fill"
                    color="var(--success)"
                  />
                </div>
                <div className="col-6 col-md-3">
                  <MetricCard 
                    label="New Signups" 
                    value={analytics.new_signups || 0}
                    change={analytics.signups_change}
                    icon="bi-person-plus-fill"
                    color="var(--accent)"
                  />
                </div>
                <div className="col-6 col-md-3">
                  <MetricCard 
                    label="Revenue" 
                    value={analytics.revenue ? `$${analytics.revenue.toFixed(2)}` : overview?.revenue ? `$${overview.revenue.toFixed(2)}` : '$0'}
                    change={analytics.revenue_change}
                    icon="bi-coin"
                    color="var(--success)"
                  />
                </div>
              </div>

              {/* Content stats */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-hover)' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>
                      <i className="bi bi-file-earmark me-2" />Content Overview
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Videos</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(analytics.total_videos || 0)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Images</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(analytics.total_images || 0)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Comments</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(analytics.total_comments || 0)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reports</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: analytics.pending_reports > 0 ? 'var(--danger)' : 'var(--success)' }}>
                          {formatNumber(analytics.pending_reports || 0)} pending
                        </div>
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
                          {analytics.total_deposits ? `$${analytics.total_deposits.toFixed(2)}` : '$0'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Payouts</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--warning)' }}>
                          {analytics.total_payouts ? `$${analytics.total_payouts.toFixed(2)}` : '$0'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pending Withdrawals</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: analytics.pending_withdrawals > 0 ? 'var(--warning)' : 'var(--success)' }}>
                          {formatNumber(analytics.pending_withdrawals || 0)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Platform Revenue</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
                          {analytics.platform_revenue ? `$${analytics.platform_revenue.toFixed(2)}` : '$0'}
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
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(analytics.total_views || 0)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Likes</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(analytics.total_likes || 0)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Shares</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(analytics.total_shares || 0)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active Streams</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: overview?.active_streams > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                          {overview?.active_streams || 0}
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