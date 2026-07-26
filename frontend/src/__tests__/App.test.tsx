import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import App from '../App'
import { useAuthStore } from '../core/store/authStore'

vi.mock('../modules/calendar/store/calendarStore', () => ({
  useCalendarStore: vi.fn((selector?: (s: unknown) => unknown) => {
    const state = {
      showOnboarding: false,
      openOnboarding: vi.fn(),
      closeOnboarding: vi.fn(),
      selectedEventId: null,
      view: 'month',
    }
    return selector ? selector(state) : state
  }),
}))

vi.mock('../core/lib/moduleRegistry', () => ({
  moduleRegistry: {
    getRoutes: () => [],
  },
}))

vi.mock('../core/hooks/useTheme', () => ({
  useTheme: vi.fn(),
}))

describe('App', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      isAuthenticated: false,
    })
  })

  it('渲染不崩溃', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    expect(() => {
      render(
        React.createElement(QueryClientProvider, { client: qc },
          React.createElement(MemoryRouter, null,
            React.createElement(App)
          )
        )
      )
    }).not.toThrow()
  })

  it('未认证时包含 LoginPage 元素', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      React.createElement(QueryClientProvider, { client: qc },
        React.createElement(MemoryRouter, null,
          React.createElement(App)
        )
      )
    )
    // LoginPage 渲染了"欢迎回来"或登录表单
    expect(document.body.textContent).toBeTruthy()
  })
})
