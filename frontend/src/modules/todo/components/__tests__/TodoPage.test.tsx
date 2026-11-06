import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('@/api/sdk.gen', () => ({
  listTasks: vi.fn().mockResolvedValue({ data: [], response: { ok: true } }),
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  moveTask: vi.fn(),
}))

vi.mock('../../hooks/useTasks', () => ({
  useTasks: () => ({ data: [], isLoading: true, isError: false }),
}))

describe('TodoPage', () => {
  it('模块可导入', async () => {
    const mod = await import('../TodoPage')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('加载中渲染骨架占位（Skeleton）', async () => {
    const { default: TodoPage } = await import('../TodoPage')
    const { container } = render(<TodoPage />)
    // 3 个 Skeleton 均为 aria-hidden 装饰块 + 容器 aria-busy
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3)
  })
})
