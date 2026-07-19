/**
 * 在生成的 hey-api 客户端上注册认证拦截器：
 * - 请求前注入 `Authorization: Bearer <accessToken>`；
 * - access token 即将过期（30s 窗口）时，自动用 refresh token 单飞续签，
 *   避免 v3.0 "登录 15 分钟后所有请求 401" 的体验断崖；
 * - 响应 401 时强制登出，回到登录页而不是停留在报错界面。
 *
 * 放在 src/lib/ 而非 src/api/ 目录下，避免被 `npm run generate:api` 清空。
 */
import { client } from '../api/client.gen'
import type { LoginResponse } from '../api/types.gen'
import { useAuthStore } from '../store/authStore'

/** 过期前多久触发预刷新（毫秒）。 */
const REFRESH_WINDOW_MS = 30_000

let refreshPromise: Promise<string | null> | null = null

async function doRefresh(refreshToken: string): Promise<string | null> {
  try {
    // 用原生 fetch，避免再次进入本拦截器
    const resp = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!resp.ok) {
      useAuthStore.getState().logout()
      return null
    }
    const data = (await resp.json()) as LoginResponse
    useAuthStore.getState().updateAccessToken(data.accessToken, data.refreshToken, data.expiresIn)
    return data.accessToken
  } catch {
    // 网络抖动时不强制登出，让本次请求按旧 token 尝试
    return useAuthStore.getState().accessToken
  }
}

async function ensureFreshToken(): Promise<string | null> {
  const { accessToken, refreshToken, expiresAt } = useAuthStore.getState()
  if (!accessToken) return null
  const stillValid = !expiresAt || Date.now() < expiresAt - REFRESH_WINDOW_MS
  if (stillValid || !refreshToken) return accessToken

  if (!refreshPromise) {
    refreshPromise = doRefresh(refreshToken).finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export function installAuthInterceptor() {
  client.interceptors.request.use(async (req) => {
    // 认证端点本身不需要 Bearer，也不应触发续签
    if (/\/auth\/(login|register|refresh)$/.test(new URL(req.url).pathname)) return req
    const token = await ensureFreshToken()
    if (token) req.headers.set('Authorization', `Bearer ${token}`)
    return req
  })

  client.interceptors.response.use((res) => {
    if (res.status === 401 && useAuthStore.getState().isAuthenticated) {
      useAuthStore.getState().logout()
    }
    return res
  })
}
