import React, { useState } from 'react'
import { sendUserEmail, getAllUsers } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function SendEmailPage() {
  const { role } = useAuth()
  const { addToast } = useToast()
  
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [showUserSelect, setShowUserSelect] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers(role)
      const list = Array.isArray(data) ? data : data?.users ?? data?.data ?? []
      setUsers(list)
      setShowUserSelect(true)
      console.log('📊 Users loaded for email:', list.length)
    } catch (e) {
      addToast(e.message, 'error')
      console.error('Error fetching users:', e)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!email || !subject || !message) {
      addToast('All fields are required.', 'warning')
      return
    }
    
    setLoading(true)
    try {
      console.log('📧 Sending email to:', email)
      console.log('📧 Subject:', subject)
      console.log('📧 Message length:', message.length)
      
      const response = await sendUserEmail(email, subject, message, role)
      
      // ─── DEBUG: Log the response ──────────────────────────────────────────
      console.log('📧 Email Send Response:', JSON.stringify(response, null, 2))
      console.log('📧 Response keys:', Object.keys(response || {}))
      
      addToast(`Email sent to ${email} successfully!`, 'success')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (e) {
      console.error('❌ Failed to send email:', e)
      addToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectUser = (user) => {
    setEmail(user.email)
    setShowUserSelect(false)
    setSearchTerm('')
    addToast(`Selected: ${user.full_name || user.username}`, 'info')
    console.log('👤 Selected user:', user.full_name || user.username, user.email)
  }

  const filteredUsers = users.filter(u => 
    u.email && (
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <>
      <div className="card">
        <div className="card-header-bar">
          <span className="card-title"><i className="bi bi-envelope me-2 text-accent" />Send Email to User</span>
        </div>
        <div className="card-body-pad">
          <form onSubmit={handleSend}>
            {/* Email with user lookup */}
            <div className="mb-3">
              <label className="form-label">Recipient Email <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div className="d-flex gap-2">
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="user@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={fetchUsers}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <i className="bi bi-search me-1" />Find User
                </button>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                <i className="bi bi-info-circle me-1" />
                Enter a user's email or use "Find User" to search from the user list.
              </div>
            </div>

            {/* User selection dropdown */}
            {showUserSelect && (
              <div className="mb-3" style={{ 
                padding: 12, 
                border: '1px solid var(--border)', 
                borderRadius: 8,
                background: 'var(--bg-hover)',
                maxHeight: 260,
                overflow: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Select a User</span>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setShowUserSelect(false)}
                  >
                    <i className="bi bi-x" />
                  </button>
                </div>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search by name, username, or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ marginBottom: 8 }}
                />
                {filteredUsers.length === 0 ? (
                  <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No users found.
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <div 
                      key={user._id}
                      style={{ 
                        padding: '8px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => selectUser(user)}
                    >
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{user.full_name || user.username}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
                      </div>
                      <button className="btn btn-sm btn-primary btn-xs">
                        <i className="bi bi-check" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Subject */}
            <div className="mb-3">
              <label className="form-label">Subject <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="Email subject line..."
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Message */}
            <div className="mb-3">
              <label className="form-label">Message <span style={{ color: 'var(--danger)' }}>*</span></label>
              <textarea
                className="form-control"
                rows={8}
                placeholder="Write your message here..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
            </div>

            {/* Template suggestions */}
            <div className="mb-3" style={{ padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                <i className="bi bi-lightbulb me-1" />Quick Templates:
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <button 
                  type="button" 
                  className="btn btn-xs btn-outline-secondary"
                  onClick={() => {
                    setSubject('Welcome to eVibeX! 🎉')
                    setMessage('Hi there,\n\nWelcome to eVibeX! We\'re excited to have you join our community. Start exploring, connect with creators, and enjoy exclusive content.\n\nHappy vibing!\nThe eVibeX Team')
                  }}
                >
                  Welcome
                </button>
                <button 
                  type="button" 
                  className="btn btn-xs btn-outline-secondary"
                  onClick={() => {
                    setSubject('Account Verification Required')
                    setMessage('Hi,\n\nPlease verify your email address to unlock all features on eVibeX. Click the link below to verify your account:\n\n[Verification Link]\n\nThanks,\nThe eVibeX Team')
                  }}
                >
                  Verification
                </button>
                <button 
                  type="button" 
                  className="btn btn-xs btn-outline-secondary"
                  onClick={() => {
                    setSubject('New Update: Exciting Features! 🚀')
                    setMessage('Hi there,\n\nWe\'ve just released exciting new features on eVibeX! Check out the latest updates and let us know what you think.\n\nStay tuned for more!\nThe eVibeX Team')
                  }}
                >
                  Announcement
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="d-flex gap-2">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <><i className="bi bi-arrow-clockwise me-1" style={{ animation: 'spin 1s linear infinite' }} />Sending…</>
                ) : (
                  <><i className="bi bi-send me-1" />Send Email</>
                )}
              </button>
              <button 
                type="reset" 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setEmail('')
                  setSubject('')
                  setMessage('')
                }}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn-xs { padding: 2px 8px !important; font-size: 11px !important; }
      `}</style>
    </>
  )
}