import Taro from '@tarojs/taro'
import { API_BASE_URL } from './config'
import { STORAGE_KEYS } from './auth'

/**
 * 统一业务请求封装（Bearer 鉴权 + 错误 unwrap）。
 *
 * - 请求前注入 `Authorization: Bearer <accessToken>`（无 token 则不注入）
 * - `statusCode >= 400` 抛出后端 `message` 的 `Error`（缺失时兜底文案）
 * - 401 特判：清除本地会话三项并抛 `UnauthorizedError`，由调用方走静默重登
 * （Decision 5：refresh 预续签机制留待后续变更，本次 401 兜底保证不白屏）
 */

/** 401 未授权（token 失效），本地会话已清除，调用方应静默重登后重试 */
export class UnauthorizedError extends Error {
  constructor() {
    super('登录已失效')
    this.name = 'UnauthorizedError'
  }
}

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** 清除本地会话（access/refresh/user 三项） */
export function clearStoredSession(): void {
  Taro.removeStorageSync(STORAGE_KEYS.accessToken)
  Taro.removeStorageSync(STORAGE_KEYS.refreshToken)
  Taro.removeStorageSync(STORAGE_KEYS.user)
}

interface ApiRequestOptions {
  method?: ApiMethod
  data?: unknown
}

/** 发起业务请求并 unwrap 响应。失败抛 Error（message 为后端提示或兜底文案）。 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', data } = options
  const accessToken = Taro.getStorageSync(STORAGE_KEYS.accessToken)
  const header: Record<string, string> = {}
  if (typeof accessToken === 'string' && accessToken !== '') {
    header.Authorization = `Bearer ${accessToken}`
  }

  const res = await Taro.request({
    url: `${API_BASE_URL}${path}`,
    method,
    data,
    header,
  })

  if (res.statusCode === 401) {
    clearStoredSession()
    throw new UnauthorizedError()
  }
  if (res.statusCode >= 400) {
    const body = res.data as Record<string, unknown> | undefined
    const message = body?.message
    const err = new Error(typeof message === 'string' && message !== '' ? message : '请求失败，请重试')
    // 附加状态码：业务态特判需区分（如宠物无宠物态 404 非错误），不影响既有调用方
    ;(err as Error & { status?: number }).status = res.statusCode
    throw err
  }
  return res.data as T
}
