import React from 'react'

export default function StatusBadge({ status, muted }) {
  if (muted) {
    return (
      <span className="badge-status badge-muted">
        <span className="dot" /> Muted
      </span>
    )
  }
  switch (status) {
    case 'active':
      return <span className="badge-status badge-active"><span className="dot" /> Active</span>
    case 'suspended':
      return <span className="badge-status badge-suspended"><span className="dot" /> Suspended</span>
    case 'banned':
      return <span className="badge-status badge-banned"><span className="dot" /> Banned</span>
    default:
      return <span className="badge-status badge-muted"><span className="dot" /> {status ?? 'Unknown'}</span>
  }
}
