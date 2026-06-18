import React, { useState, useEffect } from 'react'
import { getAllSettings, getSettingsByCategory, updateSettings } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const CATEGORIES = [
  'feature_flags',
  'maintenance',
  'coin_packages',
  'gift_catalog',
  'subscription_tiers',
  'platform_fees',
  'payout_schedule',
  'moderation_rules',
  'fraud_rules',
  'discovery_weights',
  'notification_templates',
  'payment_gateways',
  'roles_permissions',
  'terms_versions',
  'referral_promos',
]

export default function SettingsPage() {
  const { role } = useAuth()
  const { addToast } = useToast()

  const [allSettings, setAllSettings] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [config, setConfig] = useState(null)
  const [rawJson, setRawJson] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const fetchAllSettings = async () => {
    setLoading(true)
    try {
      const data = await getAllSettings(role)
      const list = Array.isArray(data) ? data : data?.settings ?? data?.data ?? []
      setAllSettings(list)
      if (list.length > 0 && !selectedCategory) {
        setSelectedCategory(list[0].category)
      }
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategory = async (category) => {
    if (!category) return
    setLoading(true)
    try {
      const data = await getSettingsByCategory(category, role)
      // data is the full setting object: { _id, category, ...config }
      setConfig(data)
      // Remove _id, category, timestamps before showing JSON
      const { _id, category: cat, created_at, updated_at, updated_by_admin_id, ...rest } = data
      setRawJson(JSON.stringify(rest, null, 2))
      setIsDirty(false)
    } catch (e) {
      addToast(e.message, 'error')
      setConfig(null)
      setRawJson('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllSettings()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      fetchCategory(selectedCategory)
    }
  }, [selectedCategory])

  const handleSave = async () => {
    if (!selectedCategory) return addToast('No category selected', 'warning')
    try {
      const parsed = JSON.parse(rawJson)
      setSaving(true)
      await updateSettings(selectedCategory, parsed, role)
      addToast('Settings updated successfully', 'success')
      setIsDirty(false)
      fetchCategory(selectedCategory) // refresh
    } catch (e) {
      if (e instanceof SyntaxError) {
        addToast('Invalid JSON syntax. Please fix before saving.', 'error')
      } else {
        addToast(e.message, 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (config) {
      const { _id, category: cat, created_at, updated_at, updated_by_admin_id, ...rest } = config
      setRawJson(JSON.stringify(rest, null, 2))
      setIsDirty(false)
    }
  }

  return (
    <>
      <div className="row g-4">
        {/* Category selector */}
        <div className="col-12 col-lg-3">
          <div className="card">
            <div className="card-header-bar">
              <span className="card-title"><i className="bi bi-list-ul me-2 text-accent" />Categories</span>
            </div>
            <div className="card-body-pad" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {loading && !config && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <i className="bi bi-arrow-clockwise" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              )}
              {allSettings.map(s => (
                <button
                  key={s.category}
                  className={`btn w-100 text-start ${selectedCategory === s.category ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{ marginBottom: 6, fontSize: 13 }}
                  onClick={() => setSelectedCategory(s.category)}
                >
                  {s.category}
                </button>
              ))}
              {allSettings.length === 0 && !loading && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
                  No settings found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* JSON editor */}
        <div className="col-12 col-lg-9">
          <div className="card">
            <div className="card-header-bar">
              <span className="card-title">
                <i className="bi bi-gear me-2 text-accent" />
                {selectedCategory ? `Edit: ${selectedCategory}` : 'Select a category'}
              </span>
              {isDirty && (
                <span style={{ fontSize: 12, color: 'var(--warning)', padding: '2px 10px', borderRadius: 20, background: 'var(--warning-bg)' }}>
                  <i className="bi bi-exclamation-triangle me-1" />Unsaved
                </span>
              )}
            </div>
            <div className="card-body-pad">
              {!selectedCategory && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <i className="bi bi-arrow-left me-2" />Select a category from the left.
                </div>
              )}
              {selectedCategory && loading && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <i className="bi bi-arrow-clockwise me-2" style={{ animation: 'spin 1s linear infinite' }} />Loading…
                </div>
              )}
              {selectedCategory && !loading && (
                <>
                  <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <i className="bi bi-info-circle me-1" />
                    Edit the JSON below. Click <strong>Save</strong> to apply changes.
                  </div>
                  <textarea
                    className="form-control"
                    rows={18}
                    style={{ fontFamily: 'monospace', fontSize: 12.5, background: 'var(--bg-input)' }}
                    value={rawJson}
                    onChange={e => { setRawJson(e.target.value); setIsDirty(true) }}
                    spellCheck={false}
                  />
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving || !isDirty}>
                      {saving ? (
                        <><i className="bi bi-arrow-clockwise me-1" style={{ animation: 'spin 1s linear infinite' }} />Saving…</>
                      ) : (
                        <><i className="bi bi-save me-1" />Save Changes</>
                      )}
                    </button>
                    <button className="btn btn-outline-secondary" onClick={handleReset} disabled={saving || !isDirty}>
                      <i className="bi bi-arrow-counterclockwise me-1" />Reset
                    </button>
                    <button className="btn btn-outline-secondary ms-auto" onClick={() => fetchCategory(selectedCategory)} disabled={saving || loading}>
                      <i className="bi bi-cloud-arrow-down me-1" />Refresh
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}