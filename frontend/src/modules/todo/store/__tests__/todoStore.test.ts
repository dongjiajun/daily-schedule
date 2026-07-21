import { describe, it, expect } from 'vitest'
import { useTodoStore } from '../todoStore'

describe('todoStore', () => {
  it('默认 viewMode 为 board', () => {
    expect(useTodoStore.getState().viewMode).toBe('board')
  })

  it('setViewMode 切换到 list', () => {
    useTodoStore.getState().setViewMode('list')
    expect(useTodoStore.getState().viewMode).toBe('list')
  })

  it('setViewMode 切回 board', () => {
    useTodoStore.getState().setViewMode('list')
    useTodoStore.getState().setViewMode('board')
    expect(useTodoStore.getState().viewMode).toBe('board')
  })
})
