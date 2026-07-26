import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const { mockTags } = vi.hoisted(() => ({
  mockTags: [{ id: 1, name: '紧急', color: '#ff0000', userId: 1 }],
}))

vi.mock('@/api/sdk.gen', () => ({
  listTags: vi.fn().mockResolvedValue({ data: mockTags, response: { ok: true } }),
  createTag: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
}))

import { useTags } from '../useTags'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useTags', () => {
  it('查询返回标签列表', async () => {
    const { result } = renderHook(() => useTags(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockTags)
  })
})
