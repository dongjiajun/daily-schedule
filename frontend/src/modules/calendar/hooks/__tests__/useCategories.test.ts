import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const { mockCategories } = vi.hoisted(() => ({
  mockCategories: [{ id: 1, name: '工作', color: '#ff0000', userId: 1 }],
}))

vi.mock('@/api/sdk.gen', () => ({
  listCategories: vi.fn().mockResolvedValue({ data: mockCategories, response: { ok: true } }),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))

import { useCategories } from '../useCategories'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useCategories', () => {
  it('查询返回分类列表', async () => {
    const { result } = renderHook(() => useCategories(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockCategories)
  })
})
