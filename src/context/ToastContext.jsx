import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)
let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++_id
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast-item toast-${t.type}`}
            onClick={() => removeToast(t.id)}
          >
            <i className={`bi ${iconFor(t.type)}`} style={{ color: colorFor(t.type) }} />
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}
            >
              <i className="bi bi-x" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function iconFor(type) {
  return { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' }[type] ?? 'bi-info-circle-fill'
}
function colorFor(type) {
  return { success: 'var(--success)', error: 'var(--danger)', warning: 'var(--warning)', info: 'var(--accent)' }[type] ?? 'var(--accent)'
}

export function useToast() {
  return useContext(ToastContext)
}
