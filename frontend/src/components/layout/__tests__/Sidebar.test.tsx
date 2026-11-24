import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '../Sidebar'

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/core/lib/moduleRegistry', () => ({
  moduleRegistry: {
    getAll: () => [],
    getSidebarFooters: () => [
      { moduleId: 'test-footer', Component: () => <div data-testid="slot-footer" /> },
    ],
  },
}))

describe('Sidebar', () => {
  it('模块可导入并渲染 sidebarFooterComponent 扩展槽位', () => {
    render(<Sidebar />)
    expect(screen.getByTestId('slot-footer')).toBeInTheDocument()
  })
})
