import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '../../store/authStore'

// Mock fetch for refresh and logout calls
global.fetch = vi.fn().mockResolvedValue(
  new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
)

// Mock the client from api
vi.mock('../../../api/client.gen', () => ({
  client: {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

describe('authInterceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
    })
  })

  it('installAuthInterceptor 注册请求拦截器', async () => {
    const { installAuthInterceptor } = await import('../authInterceptor')
    installAuthInterceptor()
    const { client } = await import('../../../api/client.gen')
    expect(client.interceptors.request.use).toHaveBeenCalled()
    expect(client.interceptors.response.use).toHaveBeenCalled()
  })

  it('认证端点不注入 Bearer token', async () => {
    const { installAuthInterceptor } = await import('../authInterceptor')
    installAuthInterceptor()
    const { client } = await import('../../../api/client.gen')

    // 获取注册的 request interceptor 回调
    const requestFn = (client.interceptors.request.use as ReturnType<typeof vi.fn>).mock.calls[0][0]

    const req = {
      url: 'http://localhost/api/v1/auth/login',
      headers: new Headers(),
    }
    const result = await requestFn(req)
    expect(result.headers.get('Authorization')).toBeNull()
  })

  it('有 token 时注入 Bearer header', async () => {
    useAuthStore.setState({
      accessToken: 'test-access-token',
      expiresAt: Date.now() + 600_000, // 10 分钟后过期
      isAuthenticated: true,
    })

    const { installAuthInterceptor } = await import('../authInterceptor')
    installAuthInterceptor()
    const { client } = await import('../../../api/client.gen')

    const requestFn = (client.interceptors.request.use as ReturnType<typeof vi.fn>).mock.calls[0][0]

    const req = {
      url: 'http://localhost/api/v1/events',
      headers: new Headers(),
    }
    const result = await requestFn(req)
    expect(result.headers.get('Authorization')).toBe('Bearer test-access-token')
  })

  it('401 响应触发 logout', async () => {
    useAuthStore.setState({ isAuthenticated: true, accessToken: 'old' })
    const logoutSpy = vi.spyOn(useAuthStore.getState(), 'logout')

    const { installAuthInterceptor } = await import('../authInterceptor')
    installAuthInterceptor()
    const { client } = await import('../../../api/client.gen')

    const responseFn = (client.interceptors.response.use as ReturnType<typeof vi.fn>).mock.calls[0][0]

    const res = { status: 401 }
    responseFn(res)
    expect(logoutSpy).toHaveBeenCalled()
  })
})
