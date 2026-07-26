import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TaskCard } from '../TaskCard'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('@/api/sdk.gen', () => ({
  deleteTask: vi.fn().mockResolvedValue({ response: { ok: true } }),
}))

const mockTask = {
  id: 1,
  title: '买水果',
  status: 'TODO' as const,
  priority: 'HIGH' as const,
  sortOrder: 1,
  dueDate: null,
  description: null,
  tags: [],
  userId: 1,
  createdAt: '',
  updatedAt: '',
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('TaskCard', () => {
  it('渲染任务标题', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} />, { wrapper })
    expect(screen.getByText('买水果')).toBeInTheDocument()
  })

  it('渲染优先级标签', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} />, { wrapper })
    expect(screen.getByText('高')).toBeInTheDocument()
  })

  it('渲染删除按钮', () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} />, { wrapper })
    expect(screen.getByRole('button', { name: /删除/ })).toBeInTheDocument()
  })
})
