import React from 'react'
import { clearCache } from '../utils/cache'
import { useToast } from '../context/ToastContext'

export default function CacheControls() {
  const { addToast } = useToast()

  const handleClearCache = () => {
    clearCache()
    addToast('Cache cleared successfully. Refresh the page to reload data.', 'success')
    setTimeout(() => window.location.reload(), 500)
  }

  return (
    <div className="d-flex gap-2">
      <button 
        className="btn btn-sm btn-outline-secondary"
        onClick={handleClearCache}
        title="Clear all cached data"
      >
        <i className="bi bi-trash3 me-1" /> Clear Cache
      </button>
    </div>
  )
}