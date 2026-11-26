import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { useGlobalShortcuts } from '../useGlobalShortcuts'
import { useShellStore } from '../../store/shellStore'

describe('useGlobalShortcuts', () => {
  beforeEach(() => {
    useShellStore.setState({ showShortcuts: false, showOnboarding: false, sidebarOpen: false })
  })

  it('按下 ? 打开快捷键帮助弹窗', () => {
    renderHook(() => useGlobalShortcuts())
    fireEvent.keyDown(window, { key: '?' })
    expect(useShellStore.getState().showShortcuts).toBe(true)
  })

  it('在输入框内或弹窗打开时不触发快捷键', () => {
    renderHook(() => useGlobalShortcuts())

    const input = document.createElement('input')
    document.body.appendChild(input)
    fireEvent.keyDown(input, { key: '?' })
    expect(useShellStore.getState().showShortcuts).toBe(false)
    input.remove()

    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    document.body.appendChild(dialog)
    fireEvent.keyDown(window, { key: '?' })
    expect(useShellStore.getState().showShortcuts).toBe(false)
    dialog.remove()
  })
})
