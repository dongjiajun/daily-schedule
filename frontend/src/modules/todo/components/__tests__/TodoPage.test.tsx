import { describe, it, expect, vi } from 'vitest'

vi.mock('@/api/sdk.gen', () => ({
  listTasks: vi.fn().mockResolvedValue({ data: [], response: { ok: true } }),
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  moveTask: vi.fn(),
}))

describe('TodoPage', () => {
  it('模块可导入', async () => {
    const mod = await import('../TodoPage')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })
})
