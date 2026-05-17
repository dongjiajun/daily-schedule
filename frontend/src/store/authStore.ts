import { create } from 'zustand'

interface AuthState {
  token: string | null
  userId: number | null
  username: string | null
  isAuthenticated: boolean
  login: (token: string, userId: number, username: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => {
  const stored = localStorage.getItem('auth')
  const initial = stored ? JSON.parse(stored) : { token: null, userId: null, username: null }

  return {
    token: initial.token,
    userId: initial.userId,
    username: initial.username,
    isAuthenticated: !!initial.token,

    login: (token, userId, username) => {
      localStorage.setItem('auth', JSON.stringify({ token, userId, username }))
      set({ token, userId, username, isAuthenticated: true })
    },

    logout: () => {
      localStorage.removeItem('auth')
      set({ token: null, userId: null, username: null, isAuthenticated: false })
    },
  }
})
