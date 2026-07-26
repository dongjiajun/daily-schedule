import { describe, it, expect, vi } from 'vitest'

vi.mock('@/api/sdk.gen', () => ({
  createTask: vi.fn(),
  deleteTask: vi.fn(),
}))

// Mock todoStore
vi.mock('../../store/todoStore', () => ({
  useTodoStore: {
    getState: () => ({ viewMode: 'board' }),
  },
}))

describe('TaskColumn', () => {
  it('模块可导入', async () => {
    const mod = await import('../TaskColumn')
    expect(mod.TaskColumn).toBeDefined()
    expect(typeof mod.TaskColumn).toBe('function')
  })
})
