import { useState, type ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AppShell } from '../AppShell'

const sseSpy = vi.fn()
vi.mock('@/core/hooks/useSseNotifications', () => ({
  useSseNotifications: () => sseSpy(),
}))

let mockPathname = '/'
let mockOutletNode: ReactNode = <div data-testid="outlet" />

vi.mock('react-router-dom', () => ({
  Outlet: () => <>{mockOutletNode}</>,
  useLocation: () => ({ pathname: mockPathname }),
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
  beforeEach(() => {
    mockPathname = '/'
    mockOutletNode = <div data-testid="outlet" />
  })

  it('模块可导入并渲染 globalOverlayComponent 扩展槽位与挂载 SSE 订阅', () => {
    render(<AppShell />)
    expect(sseSpy).toHaveBeenCalled()
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
    expect(screen.getByTestId('slot-overlay')).toBeInTheDocument()
  })

  it('子路由挂起时展示带 role=status 的骨架占位，解析后渲染页面内容', async () => {
    let resolved = false
    let resolveFn!: () => void
    const pending = new Promise<void>((r) => {
      resolveFn = () => {
        resolved = true
        r()
      }
    })

    function SuspendingChild() {
      if (!resolved) throw pending
      return <div data-testid="resolved-page">已加载页面</div>
    }
    mockOutletNode = <SuspendingChild />

    render(<AppShell />)
    expect(screen.getByRole('status', { name: '页面加载中' })).toBeInTheDocument()

    await act(async () => {
      resolveFn()
      await pending
    })
    expect(screen.getByTestId('resolved-page')).toBeInTheDocument()
  })

  it('子路由异常由路由级 ErrorBoundary 捕获并在切换路由时复位', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    function BrokenPage() {
      const [crash] = useState(true)
      if (crash) throw new Error('ChunkLoadError: mock fail')
      return null
    }

    mockPathname = '/broken'
    mockOutletNode = <BrokenPage />

    const { rerender } = render(<AppShell />)
    expect(screen.getByText('页面出现错误')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新加载' })).toBeInTheDocument()

    // 切换 pathname 后，key={pathname} 复位 ErrorBoundary
    mockPathname = '/todo'
    mockOutletNode = <div data-testid="recovered-page">正常任务页</div>
    rerender(<AppShell />)

    expect(screen.queryByText('页面出现错误')).not.toBeInTheDocument()
    expect(screen.getByTestId('recovered-page')).toBeInTheDocument()
    errSpy.mockRestore()
  })
})
