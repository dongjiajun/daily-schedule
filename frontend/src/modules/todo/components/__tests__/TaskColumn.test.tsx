import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

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

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('TaskColumn', () => {
  it('模块可导入', async () => {
    const mod = await import('../TaskColumn')
    expect(mod.TaskColumn).toBeDefined()
    expect(typeof mod.TaskColumn).toBe('function')
  })

  it('点击列头新建展开设计系统 Input 并保留语义图标着色', async () => {
    const { TaskColumn } = await import('../TaskColumn')
    const { container } = render(<TaskColumn status="IN_PROGRESS" tasks={[]} onEdit={vi.fn()} />, { wrapper })
    const icon = container.querySelector('h3 svg')
    expect(icon?.getAttribute('class')).toContain('text-warning-fg')

    fireEvent.click(screen.getByRole('button', { name: '新建' }))
    const input = screen.getByPlaceholderText('输入任务标题，回车创建…')
    expect(input.className).toContain('focus-visible:ring-focus-strong')
  })
})
