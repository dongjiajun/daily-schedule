import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePetStore } from '../petStore'

describe('petStore', () => {
  beforeEach(() => {
    usePetStore.setState({
      animationState: 'idle',
      bubbleMessage: null,
      menuOpen: false,
      selectionOpen: false,
    })
    vi.useFakeTimers()
  })

  it('初始状态正确', () => {
    const s = usePetStore.getState()
    expect(s.animationState).toBe('idle')
    expect(s.bubbleMessage).toBeNull()
    expect(s.menuOpen).toBe(false)
    expect(s.selectionOpen).toBe(false)
  })

  it('triggerAnimation happy 后 5s 自动恢复 idle', () => {
    usePetStore.getState().triggerAnimation('happy')
    expect(usePetStore.getState().animationState).toBe('happy')

    vi.advanceTimersByTime(5000)
    expect(usePetStore.getState().animationState).toBe('idle')
  })

  it('showBubble 后 4s 自动清除', () => {
    usePetStore.getState().showBubble('测试消息')
    expect(usePetStore.getState().bubbleMessage).toBe('测试消息')

    vi.advanceTimersByTime(4000)
    expect(usePetStore.getState().bubbleMessage).toBeNull()
  })

  it('setMenuOpen 切换菜单', () => {
    usePetStore.getState().setMenuOpen(true)
    expect(usePetStore.getState().menuOpen).toBe(true)
    usePetStore.getState().setMenuOpen(false)
    expect(usePetStore.getState().menuOpen).toBe(false)
  })

  it('setSelectionOpen 切换选择框', () => {
    usePetStore.getState().setSelectionOpen(true)
    expect(usePetStore.getState().selectionOpen).toBe(true)
  })
})
