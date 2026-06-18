import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/layout/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import UserLookupPage from './pages/UserLookupPage'
import ModeratePage from './pages/ModeratePage'
import EditProfilePage from './pages/EditProfilePage'
// ─── NEW PAGES ────────────────────────────────────────────
import ContentModerationPage from './pages/ContentModerationPage'
import LiveStreamsPage from './pages/LiveStreamsPage'
import FinancialsPage from './pages/FinancialsPage'
import SettingsPage from './pages/SettingsPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="lookup" element={<UserLookupPage />} />
                <Route path="moderate" element={<ModeratePage />} />
                <Route path="edit" element={<EditProfilePage />} />
                {/* ─── NEW ROUTES ─── */}
                <Route path="content" element={<ContentModerationPage />} />
                <Route path="streams" element={<LiveStreamsPage />} />
                <Route path="finances" element={<FinancialsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}