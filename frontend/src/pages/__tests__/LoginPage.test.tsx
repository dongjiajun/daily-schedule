import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginPage } from '../LoginPage'
import { useAuthStore } from '../../core/store/authStore'

// Mock SDK functions
vi.mock('../../api/sdk.gen', () => ({
  login: vi.fn(),
  register: vi.fn(),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      isAuthenticated: false,
    })
    vi.clearAllMocks()
  })

  it('渲染登录表单', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText('输入用户名或邮箱')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('输入密码')).toBeInTheDocument()
    expect(screen.getByText('登录')).toBeInTheDocument()
  })

  it('可切换到注册表单', () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByText('去注册'))
    expect(screen.getByPlaceholderText('3-50 位字母/数字/下划线')).toBeInTheDocument()
    expect(screen.getByText('创建账号')).toBeInTheDocument()
  })

  it('可切换回登录表单', () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByText('去注册'))
    fireEvent.click(screen.getByText('去登录'))
    expect(screen.getByText('登录')).toBeInTheDocument()
  })

  it('显示"欢迎回来"标题', () => {
    render(<LoginPage />)
    expect(screen.getByText('欢迎回来')).toBeInTheDocument()
  })

  it('注册模式显示"创建新账号开始使用"', () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByText('去注册'))
    expect(screen.getByText('创建新账号开始使用')).toBeInTheDocument()
  })

  it('登录提交时调用 login API', async () => {
    const { login } = await import('../../api/sdk.gen')
    ;(login as ReturnType<typeof vi.fn>).mockResolvedValue({ error: 'Invalid credentials' })

    render(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText('输入用户名或邮箱'), {
      target: { value: 'testuser' },
    })
    fireEvent.change(screen.getByPlaceholderText('输入密码'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByText('登录'))

    await waitFor(() => {
      expect(login).toHaveBeenCalled()
    })
  })
})
