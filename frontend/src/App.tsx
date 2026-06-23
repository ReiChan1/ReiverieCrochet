import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import StitchCounterPage from './pages/StitchCounterPage'
import ProjectsPage from './pages/ProjectsPage'
import PatternsPage from './pages/PatternsPage'
import YarnStashPage from './pages/YarnStashPage'
import HooksPage from './pages/HooksPage'
import SocialPage from './pages/SocialPage'
import FriendsPage from './pages/FriendsPage'
import MarketplacePage from './pages/MarketplacePage'
import StatsPage from './pages/StatsPage'
import QuestsPage from './pages/QuestsPage'
import JournalPage from './pages/JournalPage'
import PortfolioPage from './pages/PortfolioPage'
import OrdersPage from './pages/OrdersPage'
import AdminPage from './pages/AdminPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-4">✿</div>
        <div className="text-brand-500 font-medium animate-pulse">Loading CrochetHub…</div>
      </div>
    </div>
  )
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile } = useAuthStore()
  return profile?.is_admin ? <>{children}</> : <Navigate to="/dashboard" replace />
}

export default function App() {
  const { setUser, setSession, setLoading, fetchProfile } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [setUser, setSession, setLoading, fetchProfile])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"   element={<DashboardPage />} />
            <Route path="counter"     element={<StitchCounterPage />} />
            <Route path="projects"    element={<ProjectsPage />} />
            <Route path="patterns"    element={<PatternsPage />} />
            <Route path="yarn"        element={<YarnStashPage />} />
            <Route path="hooks"       element={<HooksPage />} />
            <Route path="social"      element={<SocialPage />} />
            <Route path="friends"     element={<FriendsPage />} />
            <Route path="marketplace" element={<MarketplacePage />} />
            <Route path="stats"       element={<StatsPage />} />
            <Route path="quests"      element={<QuestsPage />} />
            <Route path="journal"     element={<JournalPage />} />
            <Route path="portfolio"   element={<PortfolioPage />} />
            <Route path="orders"      element={<OrdersPage />} />
            <Route path="admin" element={
              <AdminRoute><AdminPage /></AdminRoute>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
