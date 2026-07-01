import React, { useState, useEffect } from 'react'
import { getEarningsUsers, markEarningsPaid, getWithdrawals, getFinancialCollection, resolveId } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const TABS = [
  { key: 'earnings',  label: 'Earnings Users', icon: 'bi-wallet2' },
  { key: 'withdrawals-pending', label: 'Pending Withdrawals', icon: 'bi-clock-history' },
  { key: 'withdrawals-processing', label: 'Processing Withdrawals', icon: 'bi-hourglass-split' },
  { key: 'ledger',    label: 'Ledger', icon: 'bi-journal' },
  { key: 'deposits',  label: 'Deposits', icon: 'bi-arrow-down-circle' },
  { key: 'platform-revenue', label: 'Platform Revenue', icon: 'bi-graph-up' },
]

// ── Helper: render status badge for deposits ──
function renderStatusBadge(status) {
  const statusMap = {
    pending:  { color: 'var(--warning)',   bg: 'var(--warning-bg)',  label: 'Pending' },
    success:  { color: 'var(--success)',   bg: 'var(--success-bg)',  label: 'Success' },
    failed:   { color: 'var(--danger)',    bg: 'var(--danger-bg)',   label: 'Failed' },
    cancelled:{ color: 'var(--text-muted)',bg: 'var(--bg-hover)',    label: 'Cancelled' },
  }
  const s = statusMap[status?.toLowerCase()] ?? { color: 'var(--text-muted)', bg: 'var(--bg-hover)', label: status || 'Unknown' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      color: s.color,
      background: s.bg,
      border: `1px solid ${s.color}33`,
      textTransform: 'capitalize',
    }}>
      {s.label}
    </span>
  )
}

export default function FinancialsPage() {
  const { role } = useAuth()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState('earnings')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})

  const fetchData = async () => {
    setLoading(true)
    try {
      let data
      if (activeTab === 'earnings') {
        data = await getEarningsUsers('unpaid', role)
      } else if (activeTab === 'withdrawals-pending') {
        data = await getWithdrawals('pending', role)
      } else if (activeTab === 'withdrawals-processing') {
        data = await getWithdrawals('processing', role)
      } else {
        const collectionMap = {
          ledger: 'ledger',
          deposits: 'deposits',
          'platform-revenue': 'platform-revenue',
        }
        data = await getFinancialCollection(collectionMap[activeTab], {}, role)
      }
      const list = Array.isArray(data) ? data : data?.data ?? data?.items ?? data?.users ?? []
      setItems(list)
    } catch (e) {
      addToast(e.message, 'error')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const getUserId = (item) => {
    return item?._id ?? item?.id ?? item?.user_id ?? item?.user?._id ?? item?.user?.id ?? null
  }

  const handleMarkPaid = async (userId, amount) => {
    if (!userId) return addToast('No user ID found for this record', 'warning')
    if (amount !== undefined && (isNaN(amount) || amount <= 0)) {
      addToast('Please enter a valid amount (must be > 0)', 'warning')
      return
    }
    if (!confirm(`Mark ${amount ? '₵' + Number(amount).toFixed(2) : 'all earnings'} as paid?`)) return
    setActionLoading(prev => ({ ...prev, [userId]: true }))
    try {
      await markEarningsPaid(userId, amount, role)
      addToast(`Earnings ${amount ? 'of ₵' + Number(amount).toFixed(2) : ''} marked as paid`, 'success')
      fetchData()
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }))
    }
  }

  const renderAmount = (amount) => {
    if (amount === undefined || amount === null) return '—'
    return `₵${Number(amount).toFixed(2)}`
  }

  return (
    <>
      <div className="card mb-4">
        <div className="card-header-bar">
          <span className="card-title"><i className="bi bi-wallet2 me-2 text-accent" />Financials</span>
        </div>
        <div className="card-body-pad">
          <div className="d-flex gap-2 flex-wrap mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            {TABS.map(t => (
              <button
                key={t.key}
                className={`btn btn-sm ${activeTab === t.key ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab(t.key)}
              >
                <i className={`bi ${t.icon} me-1`} /> {t.label}
              </button>
            ))}
          </div>

          {loading && (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="bi bi-arrow-clockwise me-2" style={{ animation: 'spin 1s linear infinite' }} />Loading…
            </div>
          )}
          {!loading && items.length === 0 && (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="bi bi-inbox me-2" />No records found.
            </div>
          )}
          {!loading && items.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
                    {activeTab === 'earnings' && (
                      <>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>User</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Balance</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Verified</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action</th>
                      </>
                    )}
                    {(activeTab === 'withdrawals-pending' || activeTab === 'withdrawals-processing') && (
                      <>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>User</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Requested At</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                      </>
                    )}
                    {(activeTab === 'ledger' || activeTab === 'deposits' || activeTab === 'platform-revenue') && (
                      <>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ID</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                        {activeTab === 'deposits' && (
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                        )}
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const userId = getUserId(item)
                    const balance = item.amount ?? item.balance ?? 0
                    const emailVerified = item.is_email_verified === true

                    if (activeTab === 'earnings') {
                      return (
                        <tr key={userId || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 500 }}>{item.full_name || item.username}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{item.username}</div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{item.email}</td>
                          <td style={{ padding: '10px 12px' }}>{item.phone_number ?? item.phone ?? '—'}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{renderAmount(balance)}</td>
                          <td style={{ padding: '10px 12px' }}>
                            {emailVerified
                              ? <i className="bi bi-check-circle-fill" style={{ color: 'var(--success)', fontSize: 16 }} />
                              : <i className="bi bi-x-circle-fill" style={{ color: 'var(--danger)', fontSize: 16 }} />}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ color: item.status === 'paid' ? 'var(--success)' : 'var(--warning)' }}>
                              {item.status ?? 'unpaid'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {item.status !== 'paid' ? (
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={balance}
                                  className="form-control form-control-sm"
                                  style={{ width: 90, fontSize: 12 }}
                                  defaultValue={balance}
                                  ref={(el) => {
                                    if (el) el.dataset.userId = userId
                                  }}
                                />
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => {
                                    const input = document.querySelector(`[data-user-id="${userId}"]`)
                                    const amount = input ? parseFloat(input.value) : undefined
                                    handleMarkPaid(userId, amount)
                                  }}
                                  disabled={actionLoading[userId]}
                                >
                                  {actionLoading[userId]
                                    ? <i className="bi bi-arrow-clockwise" style={{ animation: 'spin 1s linear infinite' }} />
                                    : 'Pay'}
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Paid</span>
                            )}
                          </td>
                        </tr>
                      )
                    } else if (activeTab === 'withdrawals-pending' || activeTab === 'withdrawals-processing') {
                      const wdUserId = item.user?._id ?? item.user?.id ?? item.user_id
                      return (
                        <tr key={wdUserId || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 12px' }}>{item.user?.username || item.user_id || '—'}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{renderAmount(item.amount)}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                            {item.requested_at ? new Date(item.requested_at).toLocaleString() : '—'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ color: item.status === 'pending' ? 'var(--warning)' : 'var(--accent)' }}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      )
                    } else {
                      // Ledger, Deposits, or Platform Revenue
                      const ledgerId = item._id ?? item.id
                      return (
                        <tr key={ledgerId || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{ledgerId}</td>
                          <td style={{ padding: '10px 12px' }}>{item.description ?? item.type ?? '—'}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{renderAmount(item.amount)}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                            {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
                          </td>
                          {activeTab === 'deposits' && (
                            <td style={{ padding: '10px 12px' }}>
                              {renderStatusBadge(item.status)}
                            </td>
                          )}
                        </tr>
                      )
                    }
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