import Taro from '@tarojs/taro'
import { API_BASE_URL } from './config'

/**
 * 小程序登录库（wechat-auth 骨架级接入）。
 *
 * 链路：Taro.login() 取 code → POST /auth/wechat-login → JWT 持久化。
 * 纯函数（parseLoginResponse）可单测；Taro 运行时行为（login/request/storage）
 * 由 9.4 smoke test 在开发者工具中手工验证。
 * API 基础地址引用 lib/config.ts（单一来源，见 TODO(domain)）。
 */

/** 本地存储 key 契约 */
export const STORAGE_KEYS = {
  accessToken: 'dsa_mp_access_token',
  refreshToken: 'dsa_mp_refresh_token',
  user: 'dsa_mp_user',
} as const

export interface MpUser {
  id: number
  username: string
  displayName?: string
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  user: MpUser
}

/** 校验并规范化 wechat-login 响应（纯函数）。 */
export function parseLoginResponse(payload: unknown): AuthSession {
  const p = payload as Record<string, unknown> | undefined
  const accessToken = p?.accessToken
  const refreshToken = p?.refreshToken
  const user = p?.user as Record<string, unknown> | undefined
  if (typeof accessToken !== 'string' || accessToken === ''
      || typeof refreshToken !== 'string' || refreshToken === ''
      || !user || typeof user.username !== 'string' || user.username === '') {
    throw new Error('登录响应格式异常')
  }
  return {
    accessToken,
    refreshToken,
    user: {
      id: Number(user.id),
      username: user.username,
      displayName: typeof user.displayName === 'string' ? user.displayName : undefined,
    },
  }
}

/** 持久化会话到本地存储。 */
export function persistSession(session: AuthSession): void {
  Taro.setStorageSync(STORAGE_KEYS.accessToken, session.accessToken)
  Taro.setStorageSync(STORAGE_KEYS.refreshToken, session.refreshToken)
  Taro.setStorageSync(STORAGE_KEYS.user, session.user)
}

/** 读取本地已登录用户（无有效记录返回 null）。 */
export function getStoredUser(): MpUser | null {
  try {
    const user = Taro.getStorageSync(STORAGE_KEYS.user) as MpUser | undefined
    return typeof user?.username === 'string' ? user : null
  } catch {
    return null
  }
}

/** wx.login → wechat-login → 持久化。失败抛 Error（message 为后端提示或兜底文案）。 */
export async function wechatLogin(): Promise<AuthSession> {
  const { code } = await Taro.login()
  const res = await Taro.request({
    url: `${API_BASE_URL}/auth/wechat-login`,
    method: 'POST',
    data: { code },
  })
  if (res.statusCode >= 400) {
    const data = res.data as Record<string, unknown> | undefined
    const message = data?.message
    throw new Error(typeof message === 'string' && message ? message : '登录失败，请重试')
  }
  const session = parseLoginResponse(res.data)
  persistSession(session)
  return session
}
