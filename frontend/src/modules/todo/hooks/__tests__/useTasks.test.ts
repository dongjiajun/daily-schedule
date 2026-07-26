import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const { mockTasks } = vi.hoisted(() => ({
  mockTasks: [{ id: 1, title: '买水果', status: 'TODO', priority: 'MEDIUM', sortOrder: 1, dueDate: null, tags: [], userId: 1, description: null, createdAt: '', updatedAt: '' }],
}))

vi.mock('@/api/sdk.gen', () => ({
  listTasks: vi.fn().mockResolvedValue({ data: mockTasks, response: { ok: true } }),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  moveTask: vi.fn(),
}))

import { useTasks } from '../useTasks'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useTasks', () => {
  it('查询返回任务列表', async () => {
    const { result } = renderHook(() => useTasks(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockTasks)
  })
})
