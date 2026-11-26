import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, fireEvent } from '@testing-library/react'
import { useTodoKeyboardShortcuts } from '../useTodoKeyboardShortcuts'
import { useTodoStore } from '../../store/todoStore'

describe('useTodoKeyboardShortcuts', () => {
  beforeEach(() => {
    useTodoStore.setState({ viewMode: 'board' })
  })

  it('按下 N 新建任务，1/2 切换看板与列表视图', () => {
    const onNewTask = vi.fn()
    renderHook(() => useTodoKeyboardShortcuts({ onNewTask }))

    fireEvent.keyDown(window, { key: 'n' })
    expect(onNewTask).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(window, { key: '2' })
    expect(useTodoStore.getState().viewMode).toBe('list')

    fireEvent.keyDown(window, { key: '1' })
    expect(useTodoStore.getState().viewMode).toBe('board')
  })

  it('输入框聚焦或存在 dialog 时屏蔽任务快捷键', () => {
    const onNewTask = vi.fn()
    renderHook(() => useTodoKeyboardShortcuts({ onNewTask }))

    const input = document.createElement('input')
    document.body.appendChild(input)
    fireEvent.keyDown(input, { key: 'n' })
    fireEvent.keyDown(input, { key: '2' })
    expect(onNewTask).not.toHaveBeenCalled()
    expect(useTodoStore.getState().viewMode).toBe('board')
    input.remove()

    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    document.body.appendChild(dialog)
    fireEvent.keyDown(window, { key: 'n' })
    expect(onNewTask).not.toHaveBeenCalled()
    dialog.remove()
  })
})
