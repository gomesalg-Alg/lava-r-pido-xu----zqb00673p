import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'

const AdminLogoutListener = () => {
  const location = useLocation()
  const { signOut, isAuthenticated, loading } = useAuth()
  const hasForcedLogout = useRef(false)

  // Force re-authentication for new browser sessions/tabs by clearing persistent session
  useEffect(() => {
    if (!sessionStorage.getItem('app_session_initialized')) {
      sessionStorage.setItem('app_session_initialized', 'true')
      if (isAuthenticated) {
        hasForcedLogout.current = true
        signOut()
      }
    }
  }, [isAuthenticated, signOut])

  // Prevent race condition where authRefresh restores a session we just cleared on mount
  useEffect(() => {
    if (!loading && hasForcedLogout.current) {
      if (isAuthenticated) {
        signOut()
      }
      hasForcedLogout.current = false
    }
  }, [loading, isAuthenticated, signOut])

  // Invalidate session if navigating away from the management view to a public route
  useEffect(() => {
    if (loading) return
    const isPublicRoute = !location.pathname.startsWith('/admin') && location.pathname !== '/login'
    if (isPublicRoute && isAuthenticated) {
      signOut()
    }
  }, [location.pathname, isAuthenticated, loading, signOut])

  return null
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

const App = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <AdminLogoutListener />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
