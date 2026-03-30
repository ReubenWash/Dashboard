import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getUserProfile } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import UserProfileCard from '../components/ui/UserProfileCard'
import ModerateModal from '../components/modals/ModerateModal'
import EditModal from '../components/modals/EditModal'

export default function UserLookupPage() {
  const { role } = useAuth()
  const { addToast } = useToast()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [userId, setUserId]         = useState(searchParams.get('uid') ?? '')
  const [user, setUser]             = useState(null)
  const [loading, setLoading]       = useState(false)
  const [modOpen, setModOpen]       = useState(false)
  const [editOpen, setEditOpen]     = useState(false)

  // Auto-fetch if uid query param is provided (from topbar search)
  useEffect(() => {
    const uid = searchParams.get('uid')
    if (uid) {
      setUserId(uid)
      fetchUser(uid)
    }
  }, [searchParams])

  async function fetchUser(id) {
    const uid = (id ?? userId).trim()
    if (!uid) { addToast('Enter a User ID.', 'warning'); return }
    setLoading(true)
    setUser(null)
    try {
      const u = await getUserProfile(uid, role)
      setUser(u)
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') fetchUser()
  }

  function handleModerationSuccess() {
    // Re-fetch to reflect updated status
    if (user?._id) fetchUser(user._id)
  }

  function handleEditSuccess() {
    if (user?._id) fetchUser(user._id)
  }

  return (
    <>
      {/* Search card */}
      <div className="card mb-4">
        <div className="card-header-bar">
          <span className="card-title">
            <i className="bi bi-search me-2 text-accent" />
            User Lookup
          </span>
        </div>
        <div className="card-body-pad">
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 16 }}>
            Enter a 24-character hex MongoDB ObjectId to look up an end user.
          </p>
          <div className="d-flex gap-2 flex-wrap">
            <input
              type="text"
              className="form-control"
              style={{ flex: 1, minWidth: 260, fontFamily: 'monospace' }}
              placeholder="e.g. 69c0e3c821b3ff8977c20f21"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="btn btn-primary"
              onClick={() => fetchUser()}
              disabled={loading}
            >
              {loading
                ? <><i className="bi bi-arrow-clockwise me-1" style={{ animation: 'spin 1s linear infinite' }} />Loading…</>
                : <><i className="bi bi-search me-1" />Look Up</>}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="empty-state">
          <i className="bi bi-arrow-clockwise" style={{ animation: 'spin 1s linear infinite', fontSize: 36, opacity: .5 }} />
          <p>Fetching profile…</p>
        </div>
      )}

      {!loading && !user && (
        <div className="empty-state">
          <i className="bi bi-person-bounding-box" />
          <p>Enter a User ID above to view their profile.</p>
        </div>
      )}

      {!loading && user && (
        <UserProfileCard
          user={user}
          onModerate={() => setModOpen(true)}
          onEdit={() => setEditOpen(true)}
        />
      )}

      {/* Modals */}
      <ModerateModal
        open={modOpen}
        user={user}
        onClose={() => setModOpen(false)}
        onSuccess={handleModerationSuccess}
      />
      <EditModal
        open={editOpen}
        user={user}
        onClose={() => setEditOpen(false)}
        onSuccess={handleEditSuccess}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
