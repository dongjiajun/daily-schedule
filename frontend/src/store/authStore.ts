import { create } from 'zustand'
import type { LoginResponse, UserResponse } from '../api/types.gen'

const STORAGE_KEY = 'auth.v3'
const LEGACY_KEY = 'auth' // v1.1 兼容：旧字段 token/userId/username

interface PersistedAuth {
  accessToken: string | null
  refreshToken: string | null
  /** access token 过期时刻（epoch 毫秒），用于拦截器预刷新。 */
  expiresAt: number | null
  user: UserResponse | null
}

interface AuthState extends PersistedAuth {
  isAuthenticated: boolean
  /** 登录/注册成功后写入 access + refresh + user + 过期时间。 */
  loginFromResponse: (resp: LoginResponse) => void
  /** v1.1 兼容入口：旧 LoginPage 仍可能调用 login(token, userId, username)。 */
  login: (token: string, userId: number, username: string) => void
  logout: () => void
  /** 单独刷新 access token（不更新 user）。 */
  updateAccessToken: (accessToken: string, refreshToken?: string | null, expiresIn?: number) => void
}

function expiresAtFrom(expiresIn?: number): number | null {
  return expiresIn ? Date.now() + expiresIn * 1000 : null
}

function readInitial(): PersistedAuth {
  // 优先读 v3 格式
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedAuth
      if (parsed.accessToken) return { ...parsed, expiresAt: parsed.expiresAt ?? null }
    }
  } catch {
    // 忽略，下面回退到 legacy
  }
  // v1.1 兼容：迁移老数据
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (raw) {
      const legacy = JSON.parse(raw) as { token?: string; userId?: number; username?: string }
      if (legacy.token) {
        return {
          accessToken: legacy.token,
          refreshToken: null,
          expiresAt: null,
          user: legacy.userId
            ? { id: legacy.userId, username: legacy.username ?? undefined }
            : null,
        }
      }
    }
  } catch {
    // 忽略
  }
  return { accessToken: null, refreshToken: null, expiresAt: null, user: null }
}

function persist(state: PersistedAuth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  // 同步写一份 legacy，让仍读取 'auth' 的代码继续工作
  if (state.accessToken) {
    localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({
        token: state.accessToken,
        userId: state.user?.id,
        username: state.user?.username,
      })
    )
  } else {
    localStorage.removeItem(LEGACY_KEY)
  }
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initial = readInitial()
  return {
    ...initial,
    isAuthenticated: !!initial.accessToken,

    loginFromResponse: (resp) => {
      const next: PersistedAuth = {
        accessToken: resp.accessToken,
        refreshToken: resp.refreshToken,
        expiresAt: expiresAtFrom(resp.expiresIn),
        user: resp.user ?? null,
      }
      persist(next)
      set({ ...next, isAuthenticated: true })
    },

    login: (token, userId, username) => {
      const next: PersistedAuth = {
        accessToken: token,
        refreshToken: null,
        expiresAt: null,
        user: { id: userId, username },
      }
      persist(next)
      set({ ...next, isAuthenticated: true })
    },

    logout: () => {
      const token = get().accessToken
      // 通知服务端清除 SSE Cookie；失败不阻塞本地登出
      if (token) {
        void fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => undefined)
      }
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(LEGACY_KEY)
      set({
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        user: null,
        isAuthenticated: false,
      })
    },

    updateAccessToken: (accessToken, refreshToken, expiresIn) => {
      const cur = get()
      const next: PersistedAuth = {
        accessToken,
        refreshToken: refreshToken ?? cur.refreshToken,
        expiresAt: expiresAtFrom(expiresIn),
        user: cur.user,
      }
      persist(next)
      set({ ...next, isAuthenticated: true })
    },
  }
})
