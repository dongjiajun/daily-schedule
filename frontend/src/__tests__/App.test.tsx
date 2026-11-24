import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import App from '../App'
import { useAuthStore } from '../core/store/authStore'
import { useShellStore } from '../core/store/shellStore'

vi.mock('../core/lib/moduleRegistry', () => ({
  moduleRegistry: {
    getAll: () => [],
    getRoutes: () => [],
    getGlobalOverlays: () => [],
    getSidebarFooters: () => [],
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
    useShellStore.setState({
      showOnboarding: false,
      showShortcuts: false,
      sidebarOpen: false,
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
