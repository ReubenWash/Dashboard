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
        // ledger, deposits, platform-revenue
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

  const handleMarkPaid = async (userId) => {
    if (!userId) return addToast('No user ID', 'warning')
    if (!confirm('Mark this user\'s earnings as paid?')) return
    setActionLoading(prev => ({ ...prev, [userId]: true }))
    try {
      await markEarningsPaid(userId, role)
      addToast('Earnings marked as paid', 'success')
      fetchData()
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }))
    }
  }

  const renderAmount = (amount) => {
    if (amount === undefined || amount === null) return '—'
    return `$${Number(amount).toFixed(2)}`
  }

  return (
    <>
      <div className="card mb-4">
        <div className="card-header-bar">
          <span className="card-title"><i className="bi bi-wallet2 me-2 text-accent" />Financials</span>
        </div>
        <div className="card-body-pad">
          {/* Tabs */}
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
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Balance</th>
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
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const id = resolveId(item)
                    if (activeTab === 'earnings') {
                      return (
                        <tr key={id || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 500 }}>{item.full_name || item.username}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{item.username}</div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{item.email}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{renderAmount(item.amount ?? item.balance)}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ color: item.status === 'paid' ? 'var(--success)' : 'var(--warning)' }}>
                              {item.status ?? 'unpaid'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <button
                              className="btn btn-success btn-xs"
                              onClick={() => handleMarkPaid(id)}
                              disabled={actionLoading[id] || item.status === 'paid'}
                            >
                              {actionLoading[id] ? <i className="bi bi-arrow-clockwise" style={{ animation: 'spin 1s linear infinite' }} /> : 'Mark Paid'}
                            </button>
                          </td>
                        </tr>
                      )
                    } else if (activeTab === 'withdrawals-pending' || activeTab === 'withdrawals-processing') {
                      return (
                        <tr key={id || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
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
                      // ledger, deposits, platform-revenue
                      return (
                        <tr key={id || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{id}</td>
                          <td style={{ padding: '10px 12px' }}>{item.description ?? item.type ?? '—'}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{renderAmount(item.amount)}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                            {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
                          </td>
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