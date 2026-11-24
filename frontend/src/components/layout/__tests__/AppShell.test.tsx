import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppShell } from '../AppShell'

vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet" />,
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/core/lib/moduleRegistry', () => ({
  moduleRegistry: {
    getAll: () => [],
    getGlobalOverlays: () => [
      { moduleId: 'test-overlay', Component: () => <div data-testid="slot-overlay" /> },
    ],
    getSidebarFooters: () => [],
  },
}))

describe('AppShell', () => {
  it('模块可导入并渲染 globalOverlayComponent 扩展槽位', () => {
    render(<AppShell />)
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
    expect(screen.getByTestId('slot-overlay')).toBeInTheDocument()
  })
})
