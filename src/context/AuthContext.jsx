import React, { createContext, useContext, useState, useCallback } from 'react'
import {
  login as apiLogin,
  clearAuth,
  setAuth,
  setStoredUser,
  getStoredUser,
  getToken,
  getRole,
} from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(getStoredUser)
  const [role, setRole]   = useState(getRole)
  const [token, setToken] = useState(getToken)

  const isAuthenticated = !!token && !!user

  const signIn = useCallback(async (name, password, selectedRole) => {
    const data = await apiLogin(name, password, selectedRole)
    const { token: jwt, ...profile } = data
    setAuth(jwt, selectedRole)
    setStoredUser(profile)
    setToken(jwt)
    setRole(selectedRole)
    setUser(profile)
    return profile
  }, [])

  const signOut = useCallback(() => {
    clearAuth()
    setToken(null)
    setRole('admin')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, role, token, isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
