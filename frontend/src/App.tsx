import { useEffect } from 'react'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { MotionConfig } from 'framer-motion'
import { ErrorBoundary } from './components/layout/ErrorBoundary'
import { AppShell } from './components/layout/AppShell'
import { EffectLayer } from './core/components/effects/EffectLayer'
import { LoginPage } from './pages/LoginPage'
import { OnboardingGuide } from './components/layout/OnboardingGuide'
import { useAuthStore } from './core/store/authStore'
import { useCalendarStore } from '@/modules/calendar/store/calendarStore'
import { useTheme } from './core/hooks/useTheme'
import { moduleRegistry } from './core/lib/moduleRegistry'
import { queryClient } from './core/lib/queryClient'

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

function AppRoutes() {
  return useRoutes([
    {
      path: '/*',
      element: (
        <AuthGuard>
          <AppShell />
        </AuthGuard>
      ),
      children: moduleRegistry.getRoutes(),
    },
  ])
}

export default function App() {
  useTheme()

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">
          <BrowserRouter>
            <EffectLayer />
            <AppRoutes />
            <OnboardingOverlay />
            <Toaster position="top-center" richColors />
          </BrowserRouter>
        </MotionConfig>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
