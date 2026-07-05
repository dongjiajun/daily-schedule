import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ErrorBoundary } from './components/layout/ErrorBoundary'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { OnboardingGuide } from './components/layout/OnboardingGuide'
import { useAuthStore } from './store/authStore'
import { useCalendarStore } from './store/calendarStore'
import { useTheme } from './hooks/useTheme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <LoginPage />
  return <>{children}</>
}

function OnboardingOverlay() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const showOnboarding = useCalendarStore((s) => s.showOnboarding)
  const openOnboarding = useCalendarStore((s) => s.openOnboarding)
  const closeOnboarding = useCalendarStore((s) => s.closeOnboarding)

  useEffect(() => {
    if (isAuthenticated && !localStorage.getItem('onboarding_done')) {
      openOnboarding()
    }
  }, [isAuthenticated, openOnboarding])

  if (!showOnboarding) return null

  return <OnboardingGuide onClose={closeOnboarding} />
}

export default function App() {
  useTheme()

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route
              path="/*"
              element={
                <AuthGuard>
                  <AppShell />
                </AuthGuard>
              }
            >
              <Route index element={<HomePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <OnboardingOverlay />
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
