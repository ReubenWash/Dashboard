import React from 'react'
import StatusBadge from './StatusBadge'

export default function UserProfileCard({ user, onModerate, onEdit }) {
  if (!user) return null

  const avatarLetter = (user.full_name || user.username || 'U')[0].toUpperCase()

  return (
    <>
      {/* Hero */}
      <div className="profile-hero">
        <div className="profile-cover">
          {user.cover_image && <img src={user.cover_image} alt="cover" />}
        </div>
        <div className="profile-info">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {user.avatar
                ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : avatarLetter}
            </div>
          </div>
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
            <div>
              <div className="profile-name">{user.full_name || user.username}</div>
              <div className="profile-username">@{user.username}</div>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <StatusBadge status={user.status} />
              {user.is_muted && <StatusBadge muted />}
            </div>
          </div>
          <div className="profile-meta">
            {user.email && (
              <div className="profile-meta-item">
                <i className="bi bi-envelope" />
                {user.email}
              </div>
            )}
            {(user.country || user.location) && (
              <div className="profile-meta-item">
                <i className="bi bi-geo-alt" />
                {user.country || user.location}
              </div>
            )}
            {user.website && (
              <div className="profile-meta-item">
                <i className="bi bi-globe" />
                <a href={user.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                  {user.website}
                </a>
              </div>
            )}
            {user.is_verified && (
              <div className="profile-meta-item text-accent">
                <i className="bi bi-patch-check-fill" /> Verified
              </div>
            )}
            {user.is_private && (
              <div className="profile-meta-item text-warn">
                <i className="bi bi-lock-fill" /> Private
              </div>
            )}
          </div>
          {user.bio && (
            <p style={{ marginTop: 12, fontSize: 13.5, color: 'var(--text-secondary)' }}>{user.bio}</p>
          )}
        </div>
      </div>

      {/* Action strip */}
      {(onModerate || onEdit) && (
        <div className="action-strip">
          <span className="strip-label">Actions</span>
          {onModerate && (
            <button className="btn btn-sm btn-outline-secondary" onClick={onModerate}>
              <i className="bi bi-shield-check me-1" /> Moderate
            </button>
          )}
          {onEdit && (
            <button className="btn btn-sm btn-primary" onClick={onEdit}>
              <i className="bi bi-pencil me-1" /> Edit Profile
            </button>
          )}
        </div>
      )}

      {/* Info grid */}
      <div className="card">
        <div className="card-header-bar">
          <span className="card-title">Profile Details</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ID: {user._id}</span>
        </div>
        <div className="card-body-pad">
          {[
            ['User ID',       user._id],
            ['Username',      user.username],
            ['Full Name',     user.full_name],
            ['Email',         user.email],
            ['Phone',         user.phone_number || user.phone],
            ['Country',       user.country || user.location],
            ['Website',       user.website],
            ['Status',        <StatusBadge key="s" status={user.status} />],
            ['Muted',         user.is_muted ? <span className="text-warn">Yes</span> : 'No'],
            ['Private',       user.is_private ? 'Yes' : 'No'],
            ['Show Online',   user.show_online_status ? 'Yes' : 'No'],
            ['Verified',      user.is_verified ? <span className="text-accent">Yes</span> : 'No'],
          ].filter(([, v]) => v != null && v !== '').map(([k, v]) => (
            <div className="info-row" key={k}>
              <span className="info-key">{k}</span>
              <span className="info-val">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
