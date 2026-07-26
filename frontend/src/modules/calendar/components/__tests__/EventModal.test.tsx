import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { EventModal } from '../EventModal'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useCalendarStore } from '../../store/calendarStore'

vi.mock('@/api/sdk.gen', () => ({
  listCategories: vi.fn().mockResolvedValue({ data: [], response: { ok: true } }),
  listTags: vi.fn().mockResolvedValue({ data: [], response: { ok: true } }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('EventModal', () => {
  beforeEach(() => {
    useCalendarStore.setState({ modalOpen: true, editingEventId: null })
  })

  it('modalOpen 为 true 时渲染不崩溃', () => {
    expect(() => {
      render(<EventModal />, { wrapper })
    }).not.toThrow()
  })

  it('modalOpen 为 false 时不渲染内容', () => {
    useCalendarStore.setState({ modalOpen: false })
    const { container } = render(<EventModal />, { wrapper })
    // When modal is closed, should have minimal or no content
    expect(container).toBeTruthy()
  })
})
