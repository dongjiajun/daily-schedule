import { describe, it, expect, beforeEach } from 'vitest'
import { useShellStore } from '../shellStore'

describe('shellStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useShellStore.setState({
      showOnboarding: false,
      showShortcuts: false,
      sidebarOpen: false,
    })
  })

  it('openOnboarding 与 closeOnboarding 正确更新状态并持久化标记', () => {
    useShellStore.getState().openOnboarding()
    expect(useShellStore.getState().showOnboarding).toBe(true)

    useShellStore.getState().closeOnboarding()
    expect(useShellStore.getState().showOnboarding).toBe(false)
    expect(localStorage.getItem('onboarding_done')).toBe('1')
  })

  it('setShowShortcuts 切换快捷键帮助弹窗', () => {
    useShellStore.getState().setShowShortcuts(true)
    expect(useShellStore.getState().showShortcuts).toBe(true)
    useShellStore.getState().setShowShortcuts(false)
    expect(useShellStore.getState().showShortcuts).toBe(false)
  })

  it('setSidebarOpen 切换移动端侧栏抽屉', () => {
    useShellStore.getState().setSidebarOpen(true)
    expect(useShellStore.getState().sidebarOpen).toBe(true)
    useShellStore.getState().setSidebarOpen(false)
    expect(useShellStore.getState().sidebarOpen).toBe(false)
  })
})
