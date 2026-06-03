import { create } from 'zustand'
import { clearCachedToken } from '../api/authInterceptor'
import type { LoginResponse, UserResponse } from '../api/types.gen'

const STORAGE_KEY = 'auth.v3'
const LEGACY_KEY = 'auth' // v1.1 兼容：旧字段 token/userId/username

interface PersistedAuth {
  accessToken: string | null
  refreshToken: string | null
  user: UserResponse | null
}

interface AuthState extends PersistedAuth {
  isAuthenticated: boolean
  /** 兼容旧调用：登录后写入 access + refresh + user。 */
  loginFromResponse: (resp: LoginResponse) => void
  /** v1.1 兼容入口：旧 LoginPage 仍可能调用 login(token, userId, username)。 */
  login: (token: string, userId: number, username: string) => void
  logout: () => void
  /** 单独刷新 access token（不更新 user）。 */
  updateAccessToken: (accessToken: string, refreshToken?: string | null) => void
}

function readInitial(): PersistedAuth {
  // 优先读 v3 格式
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedAuth
      if (parsed.accessToken) return parsed
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
          user: legacy.userId
            ? { id: legacy.userId, username: legacy.username ?? undefined }
            : null,
        }
      }
    }
  } catch {
    // 忽略
  }
  return { accessToken: null, refreshToken: null, user: null }
}

function persist(state: PersistedAuth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  // 同步写一份 legacy，让仍读取 'auth' 的代码（client.gen.ts）继续工作
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
        user: resp.user ?? null,
      }
      persist(next)
      clearCachedToken()
      set({ ...next, isAuthenticated: true })
    },

    login: (token, userId, username) => {
      const next: PersistedAuth = {
        accessToken: token,
        refreshToken: null,
        user: { id: userId, username },
      }
      persist(next)
      clearCachedToken()
      set({ ...next, isAuthenticated: true })
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(LEGACY_KEY)
      clearCachedToken()
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      })
    },

    updateAccessToken: (accessToken, refreshToken) => {
      const cur = get()
      const next: PersistedAuth = {
        accessToken,
        refreshToken: refreshToken ?? cur.refreshToken,
        user: cur.user,
      }
      persist(next)
      clearCachedToken()
      set({ ...next, isAuthenticated: true })
    },
  }
})
