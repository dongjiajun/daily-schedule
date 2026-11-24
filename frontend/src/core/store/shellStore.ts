import { create } from 'zustand'

interface ShellState {
  showOnboarding: boolean
  openOnboarding: () => void
  closeOnboarding: () => void

  showShortcuts: boolean
  setShowShortcuts: (show: boolean) => void

  /** 移动端侧边栏抽屉 */
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useShellStore = create<ShellState>((set) => ({
  showOnboarding: false,
  openOnboarding: () => set({ showOnboarding: true }),
  closeOnboarding: () => {
    localStorage.setItem('onboarding_done', '1')
    set({ showOnboarding: false })
  },

  showShortcuts: false,
  setShowShortcuts: (show) => set({ showShortcuts: show }),

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
