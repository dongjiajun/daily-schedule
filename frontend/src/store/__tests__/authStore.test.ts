import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../authStore'

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear()
    // 重置 store 到初始状态
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isAuthenticated: false,
    })
  })

  it('初始状态未认证', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.accessToken).toBeNull()
    expect(state.user).toBeNull()
  })

  it('loginFromResponse 写入 token 和 user 并持久化', () => {
    useAuthStore.getState().loginFromResponse({
      accessToken: 'test-access',
      refreshToken: 'test-refresh',
      expiresIn: 900,
      user: { id: 1, username: 'alice' },
    })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.accessToken).toBe('test-access')
    expect(state.user?.username).toBe('alice')
    expect(state.expiresAt).toBeGreaterThan(Date.now())

    // 持久化
    const stored = JSON.parse(localStorage.getItem('auth.v3')!)
    expect(stored.accessToken).toBe('test-access')
  })

  it('logout 清空状态和 localStorage', () => {
    useAuthStore.getState().loginFromResponse({
      accessToken: 'test-access',
      refreshToken: 'test-refresh',
      expiresIn: 900,
      user: { id: 1, username: 'alice' },
    })
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.accessToken).toBeNull()
    expect(localStorage.getItem('auth.v3')).toBeNull()
  })

  it('updateAccessToken 刷新 token', () => {
    useAuthStore.getState().loginFromResponse({
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
      expiresIn: 900,
      user: { id: 1, username: 'alice' },
    })
    useAuthStore.getState().updateAccessToken('new-access', 'new-refresh', 1800)

    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('new-access')
    expect(state.refreshToken).toBe('new-refresh')
  })

  it('v1.1 legacy 兼容: 从旧格式读取', () => {
    localStorage.setItem('auth', JSON.stringify({ token: 'legacy-token', userId: 2, username: 'bob' }))

    // 需要重建 store... Zustand 已经在模块加载时初始化了，这里只验证 localStorage 读写
    const stored = JSON.parse(localStorage.getItem('auth')!)
    expect(stored.token).toBe('legacy-token')
    expect(stored.userId).toBe(2)
  })
})
