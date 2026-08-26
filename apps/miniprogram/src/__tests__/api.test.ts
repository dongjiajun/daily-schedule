import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * api.ts 请求封装回归（mock Taro.request/storage）。
 * 覆盖：Bearer 注入、无 token 不注入、401 清态 + UnauthorizedError、
 * ≥400 抛后端 message、200 透传数据。
 */
const { storage, requestMock } = vi.hoisted(() => {
  const storage = new Map<string, unknown>()
  return { storage, requestMock: vi.fn() }
})

vi.mock('@tarojs/taro', () => ({
  default: {
    getStorageSync: (key: string) => storage.get(key),
    removeStorageSync: (key: string) => {
      storage.delete(key)
    },
    request: requestMock,
  },
}))

import { apiRequest, clearStoredSession, UnauthorizedError } from '../lib/api'

const KEYS = {
  accessToken: 'dsa_mp_access_token',
  refreshToken: 'dsa_mp_refresh_token',
  user: 'dsa_mp_user',
}

beforeEach(() => {
  storage.clear()
  requestMock.mockReset()
})

describe('apiRequest Bearer 注入', () => {
  it('本地有 accessToken → 请求头携带 Bearer', async () => {
    storage.set(KEYS.accessToken, 'at-1')
    requestMock.mockResolvedValue({ statusCode: 200, data: { ok: 1 } })

    await apiRequest('/events?start=x&end=y')

    expect(requestMock).toHaveBeenCalledWith(expect.objectContaining({
      url: 'http://localhost:8080/api/v1/events?start=x&end=y',
      method: 'GET',
      header: { Authorization: 'Bearer at-1' },
    }))
  })

  it('无 accessToken → 不注入 Authorization', async () => {
    requestMock.mockResolvedValue({ statusCode: 200, data: null })

    await apiRequest('/events?start=x&end=y')

    expect(requestMock).toHaveBeenCalledWith(expect.objectContaining({
      header: {},
    }))
  })
})

describe('apiRequest 错误语义', () => {
  it('401 → 清除三项会话并抛 UnauthorizedError', async () => {
    storage.set(KEYS.accessToken, 'at-1')
    storage.set(KEYS.refreshToken, 'rt-1')
    storage.set(KEYS.user, { username: 'wx_a' })
    requestMock.mockResolvedValue({ statusCode: 401, data: {} })

    await expect(apiRequest('/events?start=x&end=y')).rejects.toBeInstanceOf(UnauthorizedError)
    expect(storage.has(KEYS.accessToken)).toBe(false)
    expect(storage.has(KEYS.refreshToken)).toBe(false)
    expect(storage.has(KEYS.user)).toBe(false)
  })

  it('≥400 → 抛后端 message', async () => {
    requestMock.mockResolvedValue({ statusCode: 400, data: { code: 400, message: '参数错误' } })

    await expect(apiRequest('/events?start=x&end=y')).rejects.toThrow('参数错误')
  })

  it('≥400 但无 message → 抛兜底文案', async () => {
    requestMock.mockResolvedValue({ statusCode: 502, data: 'oops' })

    await expect(apiRequest('/events?start=x&end=y')).rejects.toThrow('请求失败，请重试')
  })

  it('200 → 透传响应数据', async () => {
    requestMock.mockResolvedValue({ statusCode: 200, data: [{ id: 1 }] })

    await expect(apiRequest('/events?start=x&end=y')).resolves.toEqual([{ id: 1 }])
  })
})

describe('clearStoredSession', () => {
  it('清除全部三项', () => {
    storage.set(KEYS.accessToken, 'at-1')
    storage.set(KEYS.refreshToken, 'rt-1')
    storage.set(KEYS.user, { username: 'wx_a' })

    clearStoredSession()

    expect(storage.size).toBe(0)
  })
})
