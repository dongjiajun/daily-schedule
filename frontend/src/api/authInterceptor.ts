/**
 * 在生成的 hey-api 客户端上注册 Authorization Bearer 拦截器，并暴露一个
 * {@link clearCachedToken} 用于在登录/注销时清除内存缓存。
 *
 * 把这部分逻辑从 client.gen.ts 抽离，避免被 `npm run generate:api` 覆盖。
 */
import { client } from './client.gen'

const STORAGE_KEY = 'auth.v3'
const LEGACY_KEY = 'auth'

let cached: string | null | undefined

function readToken(): string | null {
  if (cached !== undefined) return cached as string | null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { accessToken?: string | null }
      cached = parsed.accessToken ?? null
      return cached as string | null
    }
  } catch {
    // ignore
  }
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { token?: string | null }
      cached = parsed.token ?? null
      return cached as string | null
    }
  } catch {
    // ignore
  }
  cached = null
  return null
}

export function clearCachedToken() {
  cached = undefined
}

export function installAuthInterceptor() {
  client.interceptors.request.use((req) => {
    const token = readToken()
    if (token) req.headers.set('Authorization', `Bearer ${token}`)
    return req
  })
}
